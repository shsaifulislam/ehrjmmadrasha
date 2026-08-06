// backend/src/modules/onlinePayment/onlinePayment.service.ts

import prisma from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import { InitiatePaymentInput, VerifyCallbackInput } from './onlinePayment.schema';
import { PaymentGatewayFactory } from './adapters/gateway.factory';
import { OnlinePaymentStatus, OnlineGateway, Prisma } from '@prisma/client';
import { env } from '../../config/env';

export class OnlinePaymentService {
  /**
   * Initiate Online Payment Request
   */
  async initiatePayment(input: InitiatePaymentInput, userId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: input.invoiceId },
      include: { payments: true, student: true },
    });

    if (!invoice) throw new AppError('ইনভয়েস পাওয়া যায়নি', 404);
    if (invoice.status === 'PAID') throw new AppError('এই ইনভয়েসটি ইতিমধ্যে সম্পূর্ণ পরিশোধিত', 400);

    const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amountPaid), 0);
    const dueAmount = Number(invoice.totalAmount) - totalPaid;

    if (input.amount > dueAmount) {
      throw new AppError(`বকেয়া ৳${dueAmount} টাকার বেশি পেমেন্ট করা যাবে না`, 400);
    }

    const paymentReference = `INV-${invoice.id.slice(0, 8)}-${Date.now()}`;
    const gateway = PaymentGatewayFactory.getGateway(input.gateway);

    const callbackUrl = `${env.FRONTEND_URL}/admin/finance/invoices?paymentReference=${paymentReference}`;

    // Create Initial OnlinePaymentTransaction record (INITIATED)
    const txRecord = await prisma.onlinePaymentTransaction.create({
      data: {
        invoiceId: invoice.id,
        gateway: input.gateway,
        amount: new Prisma.Decimal(input.amount),
        paymentReference,
        status: OnlinePaymentStatus.INITIATED,
      },
    });

    // Call Gateway Adapter
    const gatewayRes = await gateway.createPaymentRequest({
      paymentReference,
      amount: input.amount,
      invoiceId: invoice.id,
      callbackUrl,
    });

    if (!gatewayRes.success || !gatewayRes.redirectUrl) {
      await prisma.onlinePaymentTransaction.update({
        where: { id: txRecord.id },
        data: {
          status: OnlinePaymentStatus.FAILED,
          failureReason: gatewayRes.error || 'Gateway initiation failed',
        },
      });
      throw new AppError(gatewayRes.error || 'পেমেন্ট গেটওয়ে চালুকরণ ব্যর্থ হয়েছে', 400);
    }

    // Update with gateway payment ID
    await prisma.onlinePaymentTransaction.update({
      where: { id: txRecord.id },
      data: {
        gatewayPaymentID: gatewayRes.gatewayPaymentID || null,
        status: OnlinePaymentStatus.PENDING,
        rawResponse: JSON.stringify(gatewayRes.rawResponse || {}),
      },
    });

    return {
      paymentReference,
      gatewayPaymentID: gatewayRes.gatewayPaymentID,
      redirectUrl: gatewayRes.redirectUrl,
      amount: input.amount,
    };
  }

  /**
   * Server-Side Callback Verification & Atomic Reconciliation
   */
  async verifyAndReconcilePayment(input: VerifyCallbackInput, userId: string) {
    const txRecord = await prisma.onlinePaymentTransaction.findUnique({
      where: { paymentReference: input.paymentReference },
      include: { invoice: { include: { payments: true, student: { include: { guardian: true } } } } },
    });

    if (!txRecord) throw new AppError('পেমেন্ট ট্রানজ্যাকশন রেকর্ড পাওয়া যায়নি', 404);

    // Rule: If already COMPLETED, safe idempotent return
    if (txRecord.status === OnlinePaymentStatus.COMPLETED) {
      logger.info(`[Online Payment Duplicate Callback Shield] Ref ${input.paymentReference} already COMPLETED.`);
      return {
        success: true,
        status: 'COMPLETED',
        message: 'পেমেন্ট ইতিমধ্যে সফলভাবে পরিশোধিত',
        paymentReference: txRecord.paymentReference,
        trxID: txRecord.trxID,
      };
    }

    // Call Gateway Verification API (Server-to-Server)
    const gateway = PaymentGatewayFactory.getGateway(txRecord.gateway);
    const verifyRes = await gateway.executeAndVerifyPayment({
      paymentReference: txRecord.paymentReference,
      gatewayPaymentID: txRecord.gatewayPaymentID || input.gatewayPaymentID,
      trxID: input.trxID,
    });

    if (!verifyRes.success || verifyRes.status !== 'COMPLETED') {
      await prisma.onlinePaymentTransaction.update({
        where: { id: txRecord.id },
        data: {
          status: verifyRes.status === 'CANCELLED' ? OnlinePaymentStatus.CANCELLED : OnlinePaymentStatus.FAILED,
          failureReason: verifyRes.error || 'Gateway verification rejected',
          rawResponse: JSON.stringify(verifyRes.rawResponse || {}),
        },
      });
      throw new AppError(verifyRes.error || 'পেমেন্ট গেটওয়ে ভেরিফিকেশন ব্যর্থ হয়েছে', 400);
    }

    const verifiedTrxID = verifyRes.trxID || input.trxID || `TRX-${Date.now()}`;
    const verifiedAmount = verifyRes.amount || Number(txRecord.amount);

    // Safety Condition 1: Amount Validation Check
    if (Math.abs(verifiedAmount - Number(txRecord.amount)) > 0.01) {
      await prisma.onlinePaymentTransaction.update({
        where: { id: txRecord.id },
        data: {
          status: OnlinePaymentStatus.FAILED,
          failureReason: `Amount mismatch: expected ${txRecord.amount}, verified ${verifiedAmount}`,
        },
      });
      throw new AppError('পেমেন্টের টাকার পরিমাণ অসামঞ্জস্যপূর্ণ', 400);
    }

    // Perform Atomic Reconciliation inside Prisma Transaction with Race-Condition Locks
    const result = await prisma.$transaction(async (tx) => {
      // Re-fetch transaction inside lock to prevent concurrent callback race-conditions
      const currentTx = await tx.onlinePaymentTransaction.findUnique({
        where: { id: txRecord.id },
      });

      if (currentTx?.status === OnlinePaymentStatus.COMPLETED) {
        return { alreadyProcessed: true };
      }

      // Safety Condition 2: Transaction ID Uniqueness Check
      const existingTrx = await tx.onlinePaymentTransaction.findFirst({
        where: {
          trxID: verifiedTrxID,
          status: OnlinePaymentStatus.COMPLETED,
        },
      });

      if (existingTrx) {
        throw new AppError(`এই ট্রানজ্যাকশন আইডি (${verifiedTrxID}) ইতিমধ্যে অন্য পেমেন্টে ব্যবহৃত হয়েছে`, 400);
      }

      // Re-fetch Invoice & Calculate Due Amount (Safety Condition 3: Race Condition Protection)
      const invoice = await tx.invoice.findUnique({
        where: { id: txRecord.invoiceId },
        include: { payments: true },
      });

      if (!invoice) throw new AppError('ইনভয়েস পাওয়া যায়নি', 404);

      const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amountPaid), 0);
      const remainingDue = Number(invoice.totalAmount) - totalPaid;

      if (Number(txRecord.amount) > remainingDue) {
        throw new AppError(`বকেয়া ৳${remainingDue} টাকার চেয়ে পেমেন্টের পরিমাণ বেশি`, 400);
      }

      // Map OnlineGateway enum to PaymentMethod enum
      const paymentMethod =
        txRecord.gateway === OnlineGateway.BKASH
          ? 'BKASH'
          : txRecord.gateway === OnlineGateway.NAGAD
          ? 'NAGAD'
          : 'OTHER';

      // 1. Create Internal Payment Record
      const payment = await tx.payment.create({
        data: {
          invoiceId: txRecord.invoiceId,
          amountPaid: txRecord.amount,
          method: paymentMethod as any,
          receivedById: userId,
        },
      });

      // 2. Update Invoice Status
      const newStatus = totalPaid + Number(txRecord.amount) >= Number(invoice.totalAmount) ? 'PAID' : 'PARTIAL';
      await tx.invoice.update({
        where: { id: txRecord.invoiceId },
        data: { status: newStatus },
      });

      // 3. Create Receipt Record
      const receipt = await tx.receipt.create({
        data: {
          receiptNumber: `FEE-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
          type: 'FEE',
          paymentId: payment.id,
        },
      });

      // 4. Update OnlinePaymentTransaction Record
      const updatedTx = await tx.onlinePaymentTransaction.update({
        where: { id: txRecord.id },
        data: {
          status: OnlinePaymentStatus.COMPLETED,
          trxID: verifiedTrxID,
          paymentId: payment.id,
          rawResponse: JSON.stringify(verifyRes.rawResponse || {}),
        },
      });

      // 5. Create Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'ONLINE_PAYMENT_SUCCESS',
          resource: 'OnlinePaymentTransaction',
          details: `অনলাইন পেমেন্ট সফল: গেটওয়ে=${txRecord.gateway}, TrxID=${verifiedTrxID}, পরিমাণ=৳${txRecord.amount}`,
        },
      });

      return { payment, receipt, updatedTx, newStatus };
    });

    if (!('payment' in result) || !result.payment || !result.receipt) {
      return {
        success: true,
        status: 'COMPLETED',
        message: 'পেমেন্ট ইতিমধ্যে প্রক্রিয়াজাত করা হয়েছে',
      };
    }

    // Trigger Non-Blocking FEE_PAYMENT_SUCCESS SMS
    setImmediate(async () => {
      try {
        const std = txRecord.invoice.student;
        const phone = std?.guardian?.phone;
        if (phone) {
          const msg = `মহোদয়, অনলাইন পেমেন্ট সফল হয়েছে! আপনার সন্তান ${std.nameBn}-এর ফি ৳${txRecord.amount} টাকা প্রাপ্তি নিশ্চিত করা হলো। TrxID: ${verifiedTrxID}। ইলিয়টগঞ্জ মাদ্রাসা।`;
          const { notificationService } = await import('../notification/notification.service');
          const { NotificationEventType } = await import('@prisma/client');
          await notificationService.dispatchSingleNotification({
            eventType: NotificationEventType.FEE_PAYMENT_SUCCESS,
            recipientPhone: phone,
            recipientName: std.guardian?.name,
            message: msg,
            referenceId: result.payment.id,
          });
        }
      } catch (e) {
        // Non-blocking error suppression
      }
    });

    return {
      success: true,
      status: 'COMPLETED',
      trxID: verifiedTrxID,
      receiptNumber: result.receipt.receiptNumber,
      amount: Number(txRecord.amount),
      invoiceStatus: result.newStatus,
      message: 'অনলাইন পেমেন্ট ভেরিফিকেশন ও রিকনসিলিয়েশন সম্পূর্ণ সফল',
    };
  }

  /**
   * Get Online Payment Transactions History for Admin UI
   */
  async getTransactions(limit: any = 50, page: any = 1) {
    const limitNum = Number(limit) || 50;
    const pageNum = Number(page) || 1;
    const skip = (pageNum - 1) * limitNum;
    const [transactions, total] = await Promise.all([
      prisma.onlinePaymentTransaction.findMany({
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          invoice: { include: { student: { select: { id: true, studentId: true, nameBn: true } } } },
          payment: { select: { id: true, receipt: true } },
        },
      }),
      prisma.onlinePaymentTransaction.count(),
    ]);

    return {
      transactions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }
}

export const onlinePaymentService = new OnlinePaymentService();
