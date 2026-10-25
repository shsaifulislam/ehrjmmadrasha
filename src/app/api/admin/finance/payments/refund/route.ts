import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { generateNextRefundNumber } from "@/lib/feeCalculationService";
import { parsePaginationParams } from "@/lib/pagination";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/finance/payments/refund
 * List refunds with status filtering (PENDING_APPROVAL, EXECUTED, REJECTED)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const { page, take, skip } = parsePaginationParams(searchParams, 50, 200);

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [total, refunds] = await Promise.all([
      prisma.refund.count({ where }),
      prisma.refund.findMany({
        where,
        include: {
          payment: {
            select: {
              receiptNumber: true,
              amount: true,
              paymentMethod: true,
              student: {
                select: {
                  id: true,
                  studentIdNumber: true,
                  fullNameBn: true,
                },
              },
            },
          },
          invoice: {
            select: {
              invoiceNumber: true,
              netAmount: true,
              paidAmount: true,
              dueAmount: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);

    return NextResponse.json({
      success: true,
      page,
      take,
      total,
      totalPages: Math.ceil(total / take),
      refunds,
    });
  } catch (error: any) {
    console.error("GET /api/admin/finance/payments/refund error:", error);
    return NextResponse.json({ error: "রিফান্ড তালিকা লোড করতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}

/**
 * POST /api/admin/finance/payments/refund
 * SEC-04: Process or initiate refund.
 * - Amount <= ৳5,000: Admin direct authorized execution.
 * - Amount > ৳5,000: Requires Principal dual-authorization (transitions to PENDING_APPROVAL, zero financial mutation until Principal approves).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "কেবলমাত্র অনুমোদিত প্রশাসন রিফান্ড আবেদন করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { paymentId, amount, reason, refundMethod = "CASH" } = body;

    const parsedAmount = Number(amount);
    if (!paymentId || isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "মূল পেমেন্ট আইডি এবং রিফান্ডের সঠিক পরিমাণ আবশ্যক।" },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { error: "রিফান্ডের যথাযথ কারণ উল্লেখ করা আবশ্যক (কমপক্ষে ৫ অক্ষর)।" },
        { status: 400 }
      );
    }

    // 1. Fetch original PaymentReceipt and existing executed/pending refunds
    const payment = await prisma.paymentReceipt.findUnique({
      where: { id: paymentId },
      include: {
        invoice: true,
        student: true,
        refunds: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "মূল পেমেন্ট রসিদ পাওয়া যায়নি।" }, { status: 404 });
    }

    // Calculate previously refunded or committed amount (excluding REJECTED)
    const activeRefunds = payment.refunds.filter((r) => r.status !== "REJECTED");
    const previouslyRefunded = activeRefunds.reduce((sum, r) => sum + r.amount, 0);
    const availableToRefund = Math.round((payment.amount - previouslyRefunded) * 100) / 100;

    if (availableToRefund <= 0) {
      return NextResponse.json(
        { error: "এই পেমেন্টের সম্পূর্ণ অর্থ ইতিপূর্বেই রিফান্ড বা প্রক্রিয়াধীন করা হয়েছে।" },
        { status: 400 }
      );
    }

    if (parsedAmount > availableToRefund) {
      return NextResponse.json(
        {
          error: `রিফান্ডের পরিমাণ মূল পেমেন্টের অবশিষ্ট অর্থের চেয়ে বেশি হতে পারে না। সর্বোচ্চ রিফান্ডযোগ্য: ৳ ${availableToRefund}`,
        },
        { status: 400 }
      );
    }

    // 2. Fetch destination fund to verify balance
    const targetFundCode = payment.fundCode || "GENERAL";
    const fund = await prisma.cashFund.findFirst({
      where: { code: targetFundCode },
    });

    if (fund && fund.currentBalance < parsedAmount) {
      return NextResponse.json(
        { error: `তহবিলে পর্যাপ্ত ব্যালেন্স নেই। বর্তমান ব্যালেন্স: ৳ ${fund.currentBalance}` },
        { status: 400 }
      );
    }

    // 3. SEC-04 DUAL AUTHORIZATION CHECK (> ৳5,000 Threshold)
    if (parsedAmount > 5000) {
      const refundNumber = await generateNextRefundNumber();

      // Create record in PENDING_APPROVAL status. ABSOLUTELY NO financial mutation yet!
      const pendingRefund = await prisma.refund.create({
        data: {
          refundNumber,
          paymentId: payment.id,
          invoiceId: payment.invoiceId,
          amount: parsedAmount,
          reason,
          status: "PENDING_APPROVAL",
          approvedByUserId: user.userId, // Admin initiator
          principalApprovedByUserId: null,
          refundMethod,
          refundDate: new Date(),
          fundCode: targetFundCode,
        },
      });

      await recordAuditLog({
        userId: user.userId,
        action: "REFUND_PENDING_PRINCIPAL_APPROVAL",
        entityType: "Refund",
        entityId: pendingRefund.id,
        details: {
          refundNumber,
          paymentId,
          amount: parsedAmount,
          reason,
          initiatorUserId: user.userId,
          requiredSignoff: "PRINCIPAL",
          threshold: 5000,
        },
      });

      return NextResponse.json({
        success: true,
        pendingApproval: true,
        refund: {
          id: pendingRefund.id,
          refundNumber: pendingRefund.refundNumber,
          amount: pendingRefund.amount,
          status: pendingRefund.status,
        },
        message: "৳৫,০০০-এর অধিক রিফান্ডের জন্য অধ্যক্ষ মহোদয়ের অনুমোদন আবশ্যক। অনুমোদন অনুরোধ দাখিল করা হয়েছে।",
      });
    }

    // 4. Amount <= ৳5,000: Direct authorized execution
    const refundNumber = await generateNextRefundNumber();

    const [refundRecord, updatedInvoice, updatedFund, updatedReceipt] = await prisma.$transaction(async (tx) => {
      // Fresh query inside transaction to eliminate race conditions
      const freshPayment = await tx.paymentReceipt.findUnique({
        where: { id: paymentId },
        include: { refunds: true, invoice: true },
      });

      if (!freshPayment) {
        throw new Error("মূল পেমেন্ট রসিদ পাওয়া যায়নি।");
      }

      const freshActiveRefunds = freshPayment.refunds.filter((r) => r.status !== "REJECTED");
      const freshRefunded = freshActiveRefunds.reduce((sum, r) => sum + r.amount, 0);
      const freshAvailable = Math.round((freshPayment.amount - freshRefunded) * 100) / 100;

      if (parsedAmount > freshAvailable) {
        throw new Error(
          `রিফান্ডের পরিমাণ অনুমোদিত অবশিষ্ট অর্থের চেয়ে বেশি। সর্বোচ্চ রিফান্ডযোগ্য: ৳ ${freshAvailable}`
        );
      }

      // Create Refund record marked as EXECUTED
      const ref = await tx.refund.create({
        data: {
          refundNumber,
          paymentId: freshPayment.id,
          invoiceId: freshPayment.invoiceId,
          amount: parsedAmount,
          reason,
          status: "EXECUTED",
          approvedByUserId: user.userId,
          principalApprovedByUserId: user.role === "PRINCIPAL" ? user.userId : null,
          refundMethod,
          refundDate: new Date(),
          fundCode: targetFundCode,
        },
      });

      // Update original PaymentReceipt status
      const totalRefundedNow = Math.round((freshRefunded + parsedAmount) * 100) / 100;
      const isFullRefund = Math.abs(freshPayment.amount - totalRefundedNow) < 0.01;
      const nextPaymentStatus = isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED";

      const rcp = await tx.paymentReceipt.update({
        where: { id: freshPayment.id },
        data: {
          paymentStatus: nextPaymentStatus,
          notes: `${freshPayment.notes || ""} | [রিফান্ড সম্পন্ন ৳${parsedAmount}: ভাউচার ${refundNumber}]`,
        },
      });

      // Restore Invoice due amount
      const newPaidAmount = Math.max(0, Math.round((freshPayment.invoice.paidAmount - parsedAmount) * 100) / 100);
      const newDueAmount = Math.max(0, Math.round((freshPayment.invoice.dueAmount + parsedAmount) * 100) / 100);
      const newInvoiceStatus = newDueAmount === 0 ? "PAID" : newPaidAmount > 0 ? "PARTIALLY_PAID" : "UNPAID";

      const inv = await tx.feeInvoice.update({
        where: { id: freshPayment.invoiceId },
        data: {
          paidAmount: newPaidAmount,
          dueAmount: newDueAmount,
          status: newInvoiceStatus,
        },
      });

      // Update CashFund balance
      let f = null;
      if (fund) {
        f = await tx.cashFund.update({
          where: { id: fund.id },
          data: {
            currentBalance: { decrement: parsedAmount },
          },
        });

        // Record expense transaction in CashTransaction
        await tx.cashTransaction.create({
          data: {
            fundId: fund.id,
            type: "EXPENSE",
            category: "শিক্ষার্থী ফি রিফান্ড/ফেরত",
            amount: parsedAmount,
            payeeOrPayer: payment.student.fullNameBn,
            paymentMethod: refundMethod,
            referenceNo: payment.receiptNumber,
            receiptOrVoucherNo: refundNumber,
            approvedByUserId: user.userId,
            transactionDate: new Date(),
            notes: `রিফান্ড কারণ: ${reason}`,
          },
        });
      }

      return [ref, inv, f, rcp];
    });

    await recordAuditLog({
      userId: user.userId,
      action: "PROCESS_FEE_REFUND",
      entityType: "Refund",
      entityId: refundRecord.id,
      details: {
        refundNumber,
        originalReceiptNumber: payment.receiptNumber,
        amount: parsedAmount,
        reason,
        newDueAmount: updatedInvoice.dueAmount,
      },
    });

    return NextResponse.json({
      success: true,
      message: `রিফান্ড সফলভাবে সম্পন্ন হয়েছে। ভাউচার নং: ${refundNumber}`,
      refund: refundRecord,
      invoice: updatedInvoice,
      newDueAmount: updatedInvoice.dueAmount,
      fundBalance: updatedFund?.currentBalance,
    });
  } catch (error: any) {
    console.error("Refund POST error:", error);
    return NextResponse.json({ error: error.message || "রিফান্ড প্রক্রিয়া ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/finance/payments/refund
 * SEC-04: Principal Dual-Authorization Review Endpoint
 * Strictly requires role === "PRINCIPAL".
 * Admin self-approval is permanently blocked.
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    // Strict Principal restriction: Admin, Teacher, Guardian, Public cannot approve
    if (user.role !== "PRINCIPAL") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস: কেবলমাত্র অধ্যক্ষ মহোদয় উচ্চমূল্যের রিফান্ড অনুমোদন বা প্রত্যাখ্যান করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { refundId, decision, rejectionReason } = body;

    if (!refundId || !decision || (decision !== "APPROVE" && decision !== "REJECT")) {
      return NextResponse.json(
        { error: "রিফান্ড আইডি এবং সঠিক সিদ্ধান্ত (APPROVE অথবা REJECT) প্রদান করুন।" },
        { status: 400 }
      );
    }

    // 1. Fetch target refund request
    const existingRefund = await prisma.refund.findUnique({
      where: { id: refundId },
      include: {
        payment: { include: { student: true } },
        invoice: true,
      },
    });

    if (!existingRefund) {
      return NextResponse.json({ error: "রিফান্ড অনুরোধটি পাওয়া যায়নি।" }, { status: 404 });
    }

    if (existingRefund.status !== "PENDING_APPROVAL") {
      return NextResponse.json(
        { error: `এই রিফান্ড অনুরোধটি ইতিমধ্যে প্রক্রিয়াজাত করা হয়েছে (বর্তমান অবস্থা: ${existingRefund.status})।` },
        { status: 400 }
      );
    }

    // 2. Handle REJECTION
    if (decision === "REJECT") {
      const updated = await prisma.refund.update({
        where: { id: refundId },
        data: {
          status: "REJECTED",
          rejectionReason: rejectionReason || "অধ্যক্ষ মহোদয় কর্তৃক প্রত্যাখ্যাত",
          principalApprovedByUserId: user.userId,
          principalDecisionDate: new Date(),
        },
      });

      await recordAuditLog({
        userId: user.userId,
        action: "REFUND_REJECTED_BY_PRINCIPAL",
        entityType: "Refund",
        entityId: refundId,
        details: {
          refundNumber: existingRefund.refundNumber,
          amount: existingRefund.amount,
          rejectionReason: updated.rejectionReason,
          principalUserId: user.userId,
        },
      });

      return NextResponse.json({
        success: true,
        message: "রিফান্ড অনুরোধটি সফলভাবে প্রত্যাখ্যান করা হয়েছে। কোনো অর্থ কর্তন করা হয়নি।",
        refund: updated,
      });
    }

    // 3. Handle APPROVAL with Concurrency-Safe Transaction
    const [executedRefund, updatedInvoice, updatedFund] = await prisma.$transaction(async (tx) => {
      // Re-fetch fresh inside transaction to lock out race conditions
      const freshRefund = await tx.refund.findUnique({
        where: { id: refundId },
      });

      if (!freshRefund || freshRefund.status !== "PENDING_APPROVAL") {
        throw new Error("কনকারেন্ট কনফ্লিক্ট: এই রিফান্ডটি ইতিমধ্যে অন্য একটি অনুরোধ দ্বারা অনুমোদিত বা নিষ্পন্ন হয়েছে।");
      }

      const freshPayment = await tx.paymentReceipt.findUnique({
        where: { id: existingRefund.paymentId },
        include: { refunds: true, invoice: true },
      });

      if (!freshPayment) {
        throw new Error("মূল পেমেন্ট রসিদ পাওয়া যায়নি।");
      }

      // Check fund balance
      const fund = await tx.cashFund.findFirst({
        where: { code: freshRefund.fundCode },
      });

      if (fund && fund.currentBalance < freshRefund.amount) {
        throw new Error(`তহবিলে পর্যাপ্ত ব্যালেন্স নেই। বর্তমান ব্যালেন্স: ৳ ${fund.currentBalance}`);
      }

      // Update Refund status to EXECUTED
      const ref = await tx.refund.update({
        where: { id: refundId },
        data: {
          status: "EXECUTED",
          principalApprovedByUserId: user.userId,
          principalDecisionDate: new Date(),
        },
      });

      // Update original PaymentReceipt status
      const completedRefunds = freshPayment.refunds.filter((r) => r.status === "EXECUTED" || r.id === refundId);
      const totalRefundedNow = completedRefunds.reduce((sum, r) => sum + r.amount, 0);
      const isFullRefund = Math.abs(freshPayment.amount - totalRefundedNow) < 0.01;
      const nextPaymentStatus = isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED";

      await tx.paymentReceipt.update({
        where: { id: freshPayment.id },
        data: {
          paymentStatus: nextPaymentStatus,
          notes: `${freshPayment.notes || ""} | [অধ্যক্ষ অনুমোদিত রিফান্ড ৳${freshRefund.amount}: ভাউচার ${freshRefund.refundNumber}]`,
        },
      });

      // Update Invoice amounts
      const newPaidAmount = Math.max(0, Math.round((freshPayment.invoice.paidAmount - freshRefund.amount) * 100) / 100);
      const newDueAmount = Math.max(0, Math.round((freshPayment.invoice.dueAmount + freshRefund.amount) * 100) / 100);
      const newInvoiceStatus = newDueAmount === 0 ? "PAID" : newPaidAmount > 0 ? "PARTIALLY_PAID" : "UNPAID";

      const inv = await tx.feeInvoice.update({
        where: { id: freshPayment.invoiceId },
        data: {
          paidAmount: newPaidAmount,
          dueAmount: newDueAmount,
          status: newInvoiceStatus,
        },
      });

      // Deduct from CashFund and record CashTransaction
      let f = null;
      if (fund) {
        f = await tx.cashFund.update({
          where: { id: fund.id },
          data: {
            currentBalance: { decrement: freshRefund.amount },
          },
        });

        await tx.cashTransaction.create({
          data: {
            fundId: fund.id,
            type: "EXPENSE",
            category: "শিক্ষার্থী ফি রিফান্ড/ফেরত (অধ্যক্ষ অনুমোদিত)",
            amount: freshRefund.amount,
            payeeOrPayer: existingRefund.payment.student.fullNameBn,
            paymentMethod: freshRefund.refundMethod,
            referenceNo: existingRefund.payment.receiptNumber,
            receiptOrVoucherNo: freshRefund.refundNumber,
            approvedByUserId: user.userId,
            transactionDate: new Date(),
            notes: `অধ্যক্ষ অনুমোদন: ${freshRefund.reason}`,
          },
        });
      }

      return [ref, inv, f];
    });

    await recordAuditLog({
      userId: user.userId,
      action: "REFUND_APPROVED_AND_EXECUTED_BY_PRINCIPAL",
      entityType: "Refund",
      entityId: executedRefund.id,
      details: {
        refundNumber: executedRefund.refundNumber,
        amount: executedRefund.amount,
        principalUserId: user.userId,
        newDueAmount: updatedInvoice.dueAmount,
      },
    });

    return NextResponse.json({
      success: true,
      message: `রিফান্ড সফলভাবে অনুমোদিত ও সম্পন্ন হয়েছে। ভাউচার নং: ${executedRefund.refundNumber}`,
      refund: executedRefund,
      invoice: updatedInvoice,
      fundBalance: updatedFund?.currentBalance,
    });
  } catch (error: any) {
    console.error("Refund PATCH error:", error);
    return NextResponse.json({ error: error.message || "রিফান্ড অনুমোদন ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
