import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { generateNextReceiptNumber } from "@/lib/feeCalculationService";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/finance/payments/verify
 * Administrative Verification & Approval / Rejection of Manual Guardian Payments
 * Invariant: Moves PENDING_VERIFICATION payments to SUCCESSFUL or FAILED atomically.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। কেবলমাত্র অ্যাডমিন পেমেন্ট যাচাই ও অনুমোদন করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { paymentReceiptId, action, notes } = body;

    if (!paymentReceiptId || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "সঠিক পেমেন্ট রসিদ আইডি এবং অ্যাকশন ('APPROVE' বা 'REJECT') আবশ্যক।" },
        { status: 400 }
      );
    }

    const payment = await prisma.paymentReceipt.findUnique({
      where: { id: paymentReceiptId },
      include: {
        invoice: { include: { student: true } },
        student: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "পেমেন্ট রেকর্ড পাওয়া যায়নি।" }, { status: 404 });
    }

    if (payment.paymentStatus !== "PENDING_VERIFICATION") {
      return NextResponse.json(
        { error: `এই পেমেন্টটির বর্তমান স্ট্যাটাস "${payment.paymentStatus}"। কেবলমাত্র 'PENDING_VERIFICATION' পেমেন্ট অনুমোদন করা যাবে।` },
        { status: 400 }
      );
    }

    if (action === "REJECT") {
      const updated = await prisma.paymentReceipt.update({
        where: { id: payment.id },
        data: {
          paymentStatus: "FAILED",
          notes: `${payment.notes || ""} | [প্রত্যাখ্যান করেছেন: ${user.name}] কারণ: ${notes || "ব্যাংক/মার্চেন্ট স্টেটমেন্টে ট্রানজেকশন খুঁজে পাওয়া যায়নি"}`,
        },
      });

      await recordAuditLog({
        userId: user.userId,
        action: "MANUAL_PAYMENT_REJECTED",
        entityType: "PaymentReceipt",
        entityId: payment.id,
        details: {
          receiptNumber: payment.receiptNumber,
          amount: payment.amount,
          studentId: payment.studentId,
          reason: notes || "Rejected by admin",
        },
      });

      return NextResponse.json({
        success: true,
        message: "পেমেন্ট দাবিটি সফলভাবে প্রত্যাখ্যান করা হয়েছে।",
        receipt: updated,
      });
    }

    // ACTION === "APPROVE": Atomic financial posting
    const [approvedReceipt, updatedInvoice] = await prisma.$transaction(async (tx) => {
      // 1. Re-query fresh invoice
      const inv = await tx.feeInvoice.findUnique({
        where: { id: payment.invoiceId },
      });

      if (!inv) {
        throw new Error("সংযুক্ত ইনভয়েস পাওয়া যায়নি।");
      }

      if (inv.status === "PAID" || inv.dueAmount <= 0) {
        throw new Error("এই ইনভয়েসের সম্পূর্ণ অর্থ ইতিমধ্যে পরিশোধিত।");
      }

      const parsedAmount = Math.round(payment.amount * 100) / 100;
      if (parsedAmount > inv.dueAmount) {
        throw new Error(
          `পেমেন্টের পরিমাণ (৳ ${parsedAmount}) বর্তমান বকেয়া (৳ ${inv.dueAmount})-এর চেয়ে বেশি।`
        );
      }

      const officialReceiptNumber = await generateNextReceiptNumber(tx);
      const newPaidAmount = Math.round((inv.paidAmount + parsedAmount) * 100) / 100;
      const newDueAmount = Math.max(0, Math.round((inv.dueAmount - parsedAmount) * 100) / 100);
      const newInvoiceStatus = newDueAmount === 0 ? "PAID" : "PARTIALLY_PAID";
      const targetFundCode = inv.fundCode || "GENERAL";

      // 2. Mark receipt as SUCCESSFUL and assign official receipt number
      const r = await tx.paymentReceipt.update({
        where: { id: payment.id },
        data: {
          receiptNumber: officialReceiptNumber,
          paymentStatus: "SUCCESSFUL",
          receivedByUserId: user.userId,
          receiptDate: new Date(),
          notes: `${payment.notes || ""} | [অ্যাডমিন অনুমোদিত: ${user.name}] নোট: ${notes || "ব্যাংক স্টেটমেন্টের সাথে ট্রানজেকশন মিলেছে"}`,
        },
      });

      // 3. Update invoice balance
      const updatedInv = await tx.feeInvoice.update({
        where: { id: inv.id },
        data: {
          paidAmount: newPaidAmount,
          dueAmount: newDueAmount,
          status: newInvoiceStatus,
        },
      });

      // 4. Update CashFund balance and record transaction
      const fund = await tx.cashFund.findFirst({
        where: { code: targetFundCode },
      });

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
            category: `অনলাইন অভিভাবক ফি আদায় (অনুমোদিত: ${payment.paymentMethod})`,
            amount: parsedAmount,
            payeeOrPayer: payment.student.fullNameBn,
            paymentMethod: payment.paymentMethod,
            referenceNo: inv.invoiceNumber,
            receiptOrVoucherNo: officialReceiptNumber,
            approvedByUserId: user.userId,
            transactionDate: new Date(),
            notes: `অনুমোদিত ট্রানজেকশন আইডি: ${payment.transactionId || "N/A"}`,
          },
        });
      }

      return [r, updatedInv];
    });

    await recordAuditLog({
      userId: user.userId,
      action: "MANUAL_PAYMENT_APPROVED",
      entityType: "PaymentReceipt",
      entityId: approvedReceipt.id,
      details: {
        receiptNumber: approvedReceipt.receiptNumber,
        originalRequestNumber: payment.receiptNumber,
        amount: payment.amount,
        invoiceNumber: payment.invoice.invoiceNumber,
        adminNotes: notes,
      },
    });

    return NextResponse.json({
      success: true,
      message: `পেমেন্ট সফলভাবে অনুমোদিত হয়েছে। অফিসিয়াল রসিদ নং: ${approvedReceipt.receiptNumber}`,
      receipt: approvedReceipt,
      invoice: updatedInvoice,
    });
  } catch (error: any) {
    console.error("Admin payment verification error:", error);
    return NextResponse.json(
      { error: error.message || "পেমেন্ট অনুমোদন করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
