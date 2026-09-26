import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { generateNextReceiptNumber } from "@/lib/feeCalculationService";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/finance/payments
 * List payment receipts with pagination and search
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const method = searchParams.get("method");
    const studentId = searchParams.get("studentId");
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 25)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (method) where.paymentMethod = method;
    if (studentId) where.studentId = studentId;

    if (search) {
      where.OR = [
        { receiptNumber: { contains: search } },
        { transactionId: { contains: search } },
        { invoice: { invoiceNumber: { contains: search } } },
        { student: { fullNameBn: { contains: search } } },
        { student: { studentIdNumber: { contains: search } } },
      ];
    }

    const [total, payments] = await Promise.all([
      prisma.paymentReceipt.count({ where }),
      prisma.paymentReceipt.findMany({
        where,
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              title: true,
              netAmount: true,
              paidAmount: true,
              dueAmount: true,
              status: true,
              feeType: true,
            },
          },
          student: {
            select: {
              id: true,
              studentIdNumber: true,
              fullNameBn: true,
              fullNameEn: true,
            },
          },
          refunds: true,
        },
        orderBy: { receiptDate: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Payments GET error:", error);
    return NextResponse.json({ error: "পেমেন্ট তালিকা লোড করা যায়নি।" }, { status: 500 });
  }
}

/**
 * POST /api/admin/finance/payments
 * Collect payment with atomic transaction, idempotency, partial payment support, and fund ledger update
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন পেমেন্ট গ্রহণ করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const {
      invoiceId,
      amount,
      paymentMethod = "CASH",
      transactionId,
      notes,
      idempotencyKey,
    } = body;

    const parsedAmount = Number(amount);
    if (!invoiceId || isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "ইনভয়েস এবং সঠিক পেমেন্টের পরিমাণ (টাকা) আবশ্যক।" },
        { status: 400 }
      );
    }

    // 1. Idempotency Check: if idempotencyKey provided and already exists, return existing receipt safely
    if (idempotencyKey) {
      const existingReceipt = await prisma.paymentReceipt.findUnique({
        where: { idempotencyKey },
        include: { invoice: true, student: true },
      });
      if (existingReceipt) {
        return NextResponse.json({
          success: true,
          message: "পেমেন্টটি ইতিপূর্বেই সংরক্ষিত হয়েছে (আইডেমপোটেন্ট রেসপন্স)।",
          receipt: existingReceipt,
          isDuplicate: true,
        });
      }
    }

    // 2. Fetch invoice and validate payable due
    const invoice = await prisma.feeInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        student: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "ইনভয়েসটি পাওয়া যায়নি।" }, { status: 404 });
    }

    if (invoice.status === "PAID" || invoice.dueAmount <= 0) {
      return NextResponse.json({ error: "এই ইনভয়েসটির সম্পূর্ণ অর্থ ইতিপূর্বেই পরিশোধিত।" }, { status: 400 });
    }

    if (invoice.status === "CANCELLED") {
      return NextResponse.json({ error: "বাতিলকৃত ইনভয়েসে পেমেন্ট গ্রহণ করা যাবে না।" }, { status: 400 });
    }

    if (parsedAmount > invoice.dueAmount) {
      return NextResponse.json(
        { error: `বকেয়া পরিমাণের চেয়ে বেশি গ্রহণ সম্ভব নয়। বর্তমান বকেয়া: ৳ ${invoice.dueAmount}` },
        { status: 400 }
      );
    }

    // 3. Resolve destination fund
    const targetFundCode = invoice.fundCode || (invoice.feeType === "FOOD" ? "LILLAH" : "GENERAL");
    const fund = await prisma.cashFund.findFirst({
      where: { code: targetFundCode },
    });

    const receiptNumber = await generateNextReceiptNumber();
    const qrCodeToken = `EHRJ-RCP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const newPaidAmount = invoice.paidAmount + parsedAmount;
    const newDueAmount = Math.max(0, invoice.dueAmount - parsedAmount);
    const newInvoiceStatus = newDueAmount === 0 ? "PAID" : "PARTIALLY_PAID";

    // 4. Atomic Execution across Invoice, PaymentReceipt, CashFund, and CashTransaction
    const [receipt, updatedInvoice, updatedFund] = await prisma.$transaction(async (tx) => {
      // Create Receipt
      const r = await tx.paymentReceipt.create({
        data: {
          receiptNumber,
          invoiceId: invoice.id,
          studentId: invoice.studentId,
          amount: parsedAmount,
          paymentMethod,
          transactionId: transactionId || null,
          paymentStatus: "SUCCESSFUL",
          fundCode: targetFundCode,
          idempotencyKey: idempotencyKey || null,
          receivedByUserId: user.userId,
          receiptDate: new Date(),
          qrCodeToken,
          notes,
        },
      });

      // Update Invoice
      const inv = await tx.feeInvoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          dueAmount: newDueAmount,
          status: newInvoiceStatus,
        },
      });

      // Update CashFund if fund exists
      let f = null;
      if (fund) {
        f = await tx.cashFund.update({
          where: { id: fund.id },
          data: {
            currentBalance: fund.currentBalance + parsedAmount,
          },
        });

        // Record CashTransaction
        await tx.cashTransaction.create({
          data: {
            fundId: fund.id,
            type: "INCOME",
            category: `শিক্ষার্থী ফি আদায় (${invoice.feeType})`,
            amount: parsedAmount,
            payeeOrPayer: invoice.student.fullNameBn,
            paymentMethod,
            referenceNo: invoice.invoiceNumber,
            receiptOrVoucherNo: receiptNumber,
            approvedByUserId: user.userId,
            transactionDate: new Date(),
            notes: notes || `ইনভয়েস নং: ${invoice.invoiceNumber}`,
          },
        });
      }

      return [r, inv, f];
    });

    await recordAuditLog({
      userId: user.userId,
      action: "RECORD_FEE_PAYMENT",
      entityType: "PaymentReceipt",
      entityId: receipt.id,
      details: {
        receiptNumber,
        invoiceNumber: invoice.invoiceNumber,
        studentId: invoice.studentId,
        amount: parsedAmount,
        previousDue: invoice.dueAmount,
        remainingDue: newDueAmount,
        fundCode: targetFundCode,
      },
    });

    return NextResponse.json({
      success: true,
      message: `পেমেন্ট সফলভাবে সংরক্ষিত হয়েছে। রসিদ নং: ${receiptNumber}`,
      receipt,
      invoice: updatedInvoice,
      newDueAmount,
      fundBalance: updatedFund?.currentBalance,
    });
  } catch (error: any) {
    console.error("Payment POST error:", error);
    return NextResponse.json({ error: error.message || "পেমেন্ট সংরক্ষণ ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
