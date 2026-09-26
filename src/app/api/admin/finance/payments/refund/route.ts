import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { generateNextRefundNumber } from "@/lib/feeCalculationService";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/finance/payments/refund
 * Process Full or Partial Refund with Transactional Integrity and Audit
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন রিফান্ড অনুমোদন করতে পারেন।" }, { status: 403 });
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

    // 1. Fetch original PaymentReceipt and existing refunds
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

    // Calculate previously refunded amount
    const previouslyRefunded = payment.refunds.reduce((sum, r) => sum + r.amount, 0);
    const availableToRefund = payment.amount - previouslyRefunded;

    if (availableToRefund <= 0) {
      return NextResponse.json(
        { error: "এই পেমেন্টের সম্পূর্ণ অর্থ ইতিপূর্বেই রিফান্ড করা হয়েছে।" },
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

    const refundNumber = await generateNextRefundNumber();

    // 3. Atomic execution
    const [refundRecord, updatedInvoice, updatedFund] = await prisma.$transaction(async (tx) => {
      // Create Refund record
      const ref = await tx.refund.create({
        data: {
          refundNumber,
          paymentId: payment.id,
          invoiceId: payment.invoiceId,
          amount: parsedAmount,
          reason,
          approvedByUserId: user.userId,
          refundMethod,
          refundDate: new Date(),
          fundCode: targetFundCode,
        },
      });

      // Restore Invoice due amount
      const newPaidAmount = Math.max(0, payment.invoice.paidAmount - parsedAmount);
      const newDueAmount = Math.max(0, payment.invoice.dueAmount + parsedAmount);
      const newInvoiceStatus = newDueAmount === 0 ? "PAID" : newPaidAmount > 0 ? "PARTIALLY_PAID" : "UNPAID";

      const inv = await tx.feeInvoice.update({
        where: { id: payment.invoiceId },
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
            currentBalance: fund.currentBalance - parsedAmount,
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

      return [ref, inv, f];
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
