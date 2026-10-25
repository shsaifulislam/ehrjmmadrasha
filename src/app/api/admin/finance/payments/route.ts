import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { generateNextReceiptNumber } from "@/lib/feeCalculationService";
import { emitDomainEvent, processSingleOutboxEvent } from "@/lib/communicationEngine";

import { parsePaginationParams } from "@/lib/pagination";

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
    const { page, take, skip } = parsePaginationParams(searchParams, 50, 200);
    const limit = take;

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
              enrollments: {
                take: 1,
                orderBy: { enrolledAt: "desc" },
                select: {
                  rollNumber: true,
                  jamatClass: { select: { nameBn: true } },
                  section: { select: { nameBn: true } },
                },
              },
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

import crypto from "crypto";

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

    // Duplicate transaction ID (TrxID) prevention
    if (transactionId && typeof transactionId === "string" && transactionId.trim().length > 0) {
      const existingTx = await prisma.paymentReceipt.findFirst({
        where: { transactionId: transactionId.trim() },
      });
      if (existingTx) {
        return NextResponse.json(
          { error: "এই ট্রানজ্যাকশন আইডিটি (TrxID) ইতিপূর্বে ব্যবহার করা হয়েছে।" },
          { status: 409 }
        );
      }
    }

    // 1. Resolve Idempotency Key (client-supplied or 30-second deterministic deduplication hash)
    const activeIdempotencyKey =
      idempotencyKey ||
      crypto
        .createHash("sha256")
        .update(`${invoiceId}-${parsedAmount}-${Math.floor(Date.now() / 30000)}`)
        .digest("hex");

    const existingReceipt = await prisma.paymentReceipt.findUnique({
      where: { idempotencyKey: activeIdempotencyKey },
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

    // 2. Atomic Execution with internal concurrency isolation & fresh reads
    const txResult = await prisma.$transaction(
      async (tx) => {
        // Re-query fresh invoice inside transaction to eliminate race conditions
        const inv = await tx.feeInvoice.findUnique({
          where: { id: invoiceId },
          include: {
            student: true,
          },
        });

        if (!inv) {
          throw new Error("ইনভয়েসটি পাওয়া যায়নি।");
        }

        if (inv.status === "PAID" || inv.dueAmount <= 0) {
          throw new Error("এই ইনভয়েসটির সম্পূর্ণ অর্থ ইতিপূর্বেই পরিশোধিত।");
        }

        if (inv.status === "CANCELLED") {
          throw new Error("বাতিলকৃত ইনভয়েসে পেমেন্ট গ্রহণ করা যাবে না।");
        }

        if (parsedAmount > inv.dueAmount) {
          throw new Error(
            `বকেয়া পরিমাণের চেয়ে বেশি গ্রহণ সম্ভব নয়। বর্তমান বকেয়া: ৳ ${inv.dueAmount}`
          );
        }

        // Resolve destination fund
        const targetFundCode = inv.fundCode || (inv.feeType === "FOOD" ? "LILLAH" : "GENERAL");
        const fund = await tx.cashFund.findFirst({
          where: { code: targetFundCode },
        });

        // Generate next receipt number within transaction context
        const receiptNumber = await generateNextReceiptNumber(tx);
        const qrCodeToken = `EHRJ-RCP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        const newPaidAmount = inv.paidAmount + parsedAmount;
        const newDueAmount = Math.max(0, inv.dueAmount - parsedAmount);
        const newInvoiceStatus = newDueAmount === 0 ? "PAID" : "PARTIALLY_PAID";

        // Create Receipt
        const r = await tx.paymentReceipt.create({
          data: {
            receiptNumber,
            invoiceId: inv.id,
            studentId: inv.studentId,
            amount: parsedAmount,
            paymentMethod,
            transactionId: transactionId || null,
            paymentStatus: "SUCCESSFUL",
            fundCode: targetFundCode,
            idempotencyKey: activeIdempotencyKey,
            receivedByUserId: user.userId,
            receiptDate: new Date(),
            qrCodeToken,
            notes,
          },
        });

        // Update Invoice
        const updatedInv = await tx.feeInvoice.update({
          where: { id: inv.id },
          data: {
            paidAmount: newPaidAmount,
            dueAmount: newDueAmount,
            status: newInvoiceStatus,
          },
        });

        // Update CashFund atomically
        let f = null;
        if (fund) {
          f = await tx.cashFund.update({
            where: { id: fund.id },
            data: {
              currentBalance: { increment: parsedAmount },
            },
          });

          // Record CashTransaction
          await tx.cashTransaction.create({
            data: {
              fundId: fund.id,
              type: "INCOME",
              category: `শিক্ষার্থী ফি আদায় (${inv.feeType})`,
              amount: parsedAmount,
              payeeOrPayer: inv.student.fullNameBn,
              paymentMethod,
              referenceNo: inv.invoiceNumber,
              receiptOrVoucherNo: receiptNumber,
              approvedByUserId: user.userId,
              transactionDate: new Date(),
              notes: notes || `ইনভয়েস নং: ${inv.invoiceNumber}`,
            },
          });
        }

        // Emit PAYMENT_SUCCESSFUL domain event within the transaction
        const outbox = await emitDomainEvent({
          eventType: "PAYMENT_SUCCESSFUL",
          entityType: "PaymentReceipt",
          entityId: r.id,
          payload: {
            studentId: inv.studentId,
            studentNameBn: inv.student.fullNameBn,
            amount: parsedAmount,
            receiptNumber,
            receiptId: r.id,
          },
          idempotencyKey: `payment-successful-${r.id}`,
          tx,
        });

        return [r, updatedInv, f, outbox.id];
      },
      {
        timeout: 15000,
      }
    );

    const [receipt, updatedInvoice, updatedFund, outboxId] = txResult;

    if (outboxId) {
      processSingleOutboxEvent(outboxId).catch((err) =>
        console.error("Payment confirmation outbox processing error:", err)
      );
    }

    await recordAuditLog({
      userId: user.userId,
      action: "RECORD_FEE_PAYMENT",
      entityType: "PaymentReceipt",
      entityId: receipt.id,
      details: {
        receiptNumber: receipt.receiptNumber,
        invoiceNumber: updatedInvoice.invoiceNumber,
        studentId: updatedInvoice.studentId,
        amount: parsedAmount,
        previousDue: updatedInvoice.dueAmount + parsedAmount,
        remainingDue: updatedInvoice.dueAmount,
        fundCode: receipt.fundCode,
      },
    });

    return NextResponse.json({
      success: true,
      message: `পেমেন্ট সফলভাবে সংরক্ষিত হয়েছে। রসিদ নং: ${receipt.receiptNumber}`,
      receipt,
      invoice: updatedInvoice,
      newDueAmount: updatedInvoice.dueAmount,
      fundBalance: updatedFund?.currentBalance,
    });
  } catch (error: any) {
    console.error("Payment POST error:", error);
    if (error.code === "P2002" || (error.message && error.message.includes("Unique constraint failed"))) {
      return NextResponse.json(
        { error: "প্রদত্ত ট্রানজ্যাকশন আইডি অথবা তথ্যটি ইতিপূর্বেই ব্যবহৃত হয়েছে।" },
        { status: 400 }
      );
    }
    const isClientError =
      error.message &&
      (error.message.includes("বকেয়া পরিমাণের চেয়ে বেশি গ্রহণ সম্ভব নয়") ||
        error.message.includes("ইনভয়েসটি পাওয়া যায়নি") ||
        error.message.includes("ইতিপূর্বেই পরিশোধিত") ||
        error.message.includes("বাতিলকৃত ইনভয়েসে") ||
        error.message.includes("আবশ্যক"));
    return NextResponse.json(
      { error: error.message || "পেমেন্ট সংরক্ষণ ব্যর্থ হয়েছে।" },
      { status: isClientError ? 400 : 500 }
    );
  }
}
