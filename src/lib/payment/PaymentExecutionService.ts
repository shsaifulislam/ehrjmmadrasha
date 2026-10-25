/**
 * EHRJ DIGITAL CAMPUS & ERP — PAYMENT INFRASTRUCTURE
 * Payment Execution & Finalization Service
 *
 * Implements authoritative server-to-server gateway verification:
 * 1. Validates PaymentIntent state & expiration.
 * 2. Executes transaction with payment gateway.
 * 3. Enforces anti-amount tampering (gateway amount === intent amount).
 * 4. Atomically records PaymentReceipt, updates invoice, and credits digital settlement wallet.
 */

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { PaymentGatewayFactory } from "./PaymentGatewayFactory";
import { generateNextReceiptNumber } from "@/lib/feeCalculationService";
import { recordAuditLog } from "@/lib/security";
import { emitDomainEvent, processSingleOutboxEvent } from "@/lib/communicationEngine";

export class PaymentExecutionService {
  public static async executeGatewayPayment(params: {
    gatewayPaymentId: string;
    provider: "BKASH" | "NAGAD";
    actorUserId?: string;
  }) {
    // 1. Look up PaymentIntent
    const intent = await prisma.paymentIntent.findFirst({
      where: {
        gatewayPaymentId: params.gatewayPaymentId,
        provider: params.provider,
      },
      include: {
        invoice: { include: { student: true } },
        student: true,
      },
    });

    if (!intent) {
      throw new Error(`পেমেন্ট ইন্টেন্ট খুঁজে পাওয়া যায়নি: ${params.gatewayPaymentId}`);
    }

    // 2. Idempotency Check
    if (intent.status === "SUCCESSFUL" && intent.gatewayTransactionId) {
      const existingReceipt = await prisma.paymentReceipt.findUnique({
        where: { transactionId: intent.gatewayTransactionId },
        include: { invoice: true, student: true },
      });
      if (existingReceipt) {
        return {
          success: true,
          isDuplicate: true,
          message: "পেমেন্টটি ইতিপূর্বেই সফলভাবে সম্পন্ন হয়েছে।",
          receipt: existingReceipt,
          invoice: intent.invoice,
        };
      }
    }

    // 3. Expiration Check
    if (new Date() > intent.expiresAt) {
      await prisma.paymentIntent.update({
        where: { id: intent.id },
        data: { status: "EXPIRED" },
      });
      throw new Error("পেমেন্টের নির্ধারিত সময় (১৫ মিনিট) উত্তীর্ণ হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
    }

    // 4. Call Payment Gateway Execute
    const gateway = PaymentGatewayFactory.getProvider(params.provider);
    const executeResult = await gateway.executePayment(params.gatewayPaymentId, {
      amount: intent.amount,
    });

    if (!executeResult.success || executeResult.paymentStatus !== "SUCCESSFUL") {
      await prisma.paymentIntent.update({
        where: { id: intent.id },
        data: {
          status: executeResult.paymentStatus === "CANCELLED" ? "CANCELLED" : "FAILED",
          rawGatewayResponse: JSON.stringify(executeResult.rawResponse || {}),
        },
      });
      throw new Error(executeResult.error || "গেটওয়েতে পেমেন্ট সম্পন্ন হয়নি বা বাতিল হয়েছে।");
    }

    const gatewayTrxId = executeResult.gatewayTransactionId.trim();

    // 5. Anti-Amount Tampering Verification (SECTION 5.5)
    if (executeResult.amount && Math.abs(executeResult.amount - intent.amount) > 0.01) {
      await prisma.paymentIntent.update({
        where: { id: intent.id },
        data: {
          status: "FAILED",
          rawGatewayResponse: JSON.stringify({
            error: "AMOUNT_TAMPERING_DETECTED",
            gatewayAmount: executeResult.amount,
            expectedAmount: intent.amount,
          }),
        },
      });

      await recordAuditLog({
        userId: params.actorUserId || intent.guardianUserId,
        action: "SECURITY_ALERT_PAYMENT_AMOUNT_TAMPERED",
        entityType: "PaymentIntent",
        entityId: intent.id,
        details: {
          intentNumber: intent.intentNumber,
          gatewayAmount: executeResult.amount,
          expectedAmount: intent.amount,
          gatewayTransactionId: gatewayTrxId,
        },
      });

      throw new Error("নিরাপত্তা সতর্কতা: গেটওয়ে থেকে প্রাপ্ত অর্থ এবং ইনভয়েসের পাওনা অর্থ মিলছে না। লেনদেন স্থগিত করা হয়েছে।");
    }

    // 6. Atomic Financial Posting
    const txResult = await prisma.$transaction(async (tx) => {
      // Re-fetch fresh invoice inside transaction
      const freshInv = await tx.feeInvoice.findUnique({
        where: { id: intent.invoiceId },
      });

      if (!freshInv) {
        throw new Error("ইনভয়েস রেকর্ড পাওয়া যায়নি।");
      }

      if (freshInv.status === "PAID" || freshInv.dueAmount <= 0) {
        throw new Error("এই ইনভয়েসের ফি ইতিপূর্বেই সম্পূর্ণ পরিশোধিত।");
      }

      const parsedAmount = Math.round(intent.amount * 100) / 100;
      const officialReceiptNumber = await generateNextReceiptNumber(tx);
      const qrCodeToken = `EHRJ-RCP-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

      const newPaidAmount = Math.round((freshInv.paidAmount + parsedAmount) * 100) / 100;
      const newDueAmount = Math.max(0, Math.round((freshInv.dueAmount - parsedAmount) * 100) / 100);
      const newInvoiceStatus = newDueAmount === 0 ? "PAID" : "PARTIALLY_PAID";
      const targetFundCode = freshInv.fundCode || (freshInv.feeType === "FOOD" ? "LILLAH" : "GENERAL");

      // Resolve digital settlement wallet
      const walletType = params.provider === "BKASH" ? "BKASH_MERCHANT" : "NAGAD_MERCHANT";
      const wallet = await tx.financialAccount.findFirst({
        where: { type: walletType, isActive: true },
      });

      // Update PaymentIntent
      await tx.paymentIntent.update({
        where: { id: intent.id },
        data: {
          status: "SUCCESSFUL",
          gatewayTransactionId: gatewayTrxId,
          rawGatewayResponse: JSON.stringify(executeResult.rawResponse || {}),
        },
      });

      // Create PaymentReceipt
      const r = await tx.paymentReceipt.create({
        data: {
          receiptNumber: officialReceiptNumber,
          invoiceId: freshInv.id,
          studentId: freshInv.studentId,
          amount: parsedAmount,
          paymentMethod: params.provider,
          transactionId: gatewayTrxId,
          paymentStatus: "SUCCESSFUL",
          fundCode: targetFundCode,
          financialAccountId: wallet?.id || null,
          idempotencyKey: intent.idempotencyKey,
          receivedByUserId: params.actorUserId || intent.guardianUserId,
          receiptDate: new Date(),
          qrCodeToken,
          notes: `অনলাইন পেমেন্ট গেটওয়ে (${params.provider}) - ট্রানজেকশন আইডি: ${gatewayTrxId}`,
        },
      });

      // Update FeeInvoice
      const inv = await tx.feeInvoice.update({
        where: { id: freshInv.id },
        data: {
          paidAmount: newPaidAmount,
          dueAmount: newDueAmount,
          status: newInvoiceStatus,
        },
      });

      // Credit digital merchant wallet
      if (wallet) {
        await tx.financialAccount.update({
          where: { id: wallet.id },
          data: {
            currentBalance: { increment: parsedAmount },
          },
        });
      }

      // Record institutional cash ledger
      const fund = await tx.cashFund.findFirst({ where: { code: targetFundCode } });
      if (fund) {
        await tx.cashFund.update({
          where: { id: fund.id },
          data: {
            currentBalance: { increment: parsedAmount },
          },
        });

        await tx.cashTransaction.create({
          data: {
            fundId: fund.id,
            type: "INCOME",
            category: `অনলাইন গেটওয়ে ফি আদায় (${freshInv.feeType}) - ${params.provider}`,
            amount: parsedAmount,
            payeeOrPayer: intent.student.fullNameBn,
            paymentMethod: params.provider,
            referenceNo: freshInv.invoiceNumber,
            receiptOrVoucherNo: officialReceiptNumber,
            approvedByUserId: params.actorUserId || intent.guardianUserId,
            transactionDate: new Date(),
            notes: `গেটওয়ে ট্রানজেকশন আইডি: ${gatewayTrxId}`,
          },
        });
      }

      // Emit PAYMENT_SUCCESSFUL domain event within the transaction
      const outbox = await emitDomainEvent({
        eventType: "PAYMENT_SUCCESSFUL",
        entityType: "PaymentReceipt",
        entityId: r.id,
        payload: {
          studentId: freshInv.studentId,
          studentNameBn: intent.student.fullNameBn,
          amount: parsedAmount,
          receiptNumber: officialReceiptNumber,
          receiptId: r.id,
        },
        idempotencyKey: `payment-successful-${r.id}`,
        tx,
      });

      return [r, inv, outbox.id];
    });

    const receipt = txResult[0];
    const updatedInvoice = txResult[1];
    const outboxId = txResult[2];

    if (outboxId) {
      processSingleOutboxEvent(outboxId).catch((err) =>
        console.error("Gateway payment outbox processing error:", err)
      );
    }

    await recordAuditLog({
      userId: params.actorUserId || intent.guardianUserId,
      action: "GATEWAY_PAYMENT_SUCCESSFULLY_POSTED",
      entityType: "PaymentReceipt",
      entityId: receipt.id,
      details: {
        provider: params.provider,
        receiptNumber: receipt.receiptNumber,
        gatewayTransactionId: gatewayTrxId,
        amount: intent.amount,
        invoiceNumber: intent.invoice.invoiceNumber,
      },
    });

    return {
      success: true,
      message: `পেমেন্ট সফলভাবে সম্পন্ন হয়েছে। অফিসিয়াল রসিদ নং: ${receipt.receiptNumber}`,
      receipt,
      invoice: updatedInvoice,
    };
  }
}
