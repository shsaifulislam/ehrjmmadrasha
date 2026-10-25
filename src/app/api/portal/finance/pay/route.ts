import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { generateNextReceiptNumber } from "@/lib/feeCalculationService";

export const dynamic = "force-dynamic";

/**
 * POST /api/portal/finance/pay
 * Guardian Online Fee Payment with single or multi-child invoice allocation
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "লগইন করা আবশ্যক।" }, { status: 401 });
    }

    // SECTION 2.2: Guardian-only online payment authorization
    if (user.role !== "GUARDIAN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। কেবলমাত্র অভিভাবকগণ এই পোর্টালের মাধ্যমে ফি জমা দিতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      allocations, // Array of { invoiceId: string, amount: number }
      paymentMethod = "BKASH",
      transactionId,
      idempotencyKey,
    } = body;

    if (!allocations || !Array.isArray(allocations) || allocations.length === 0) {
      return NextResponse.json({ error: "কমপক্ষে একটি ইনভয়েস নির্বাচন করুন।" }, { status: 400 });
    }

    const cleanTxnId = transactionId ? String(transactionId).trim() : null;
    const effectiveTxnRef = (cleanTxnId || idempotencyKey)?.toString()?.trim();

    // 1. Fetch Guardian record to verify relationship and linked students
    const guardian = await prisma.guardian.findFirst({
      where: {
        OR: [{ userId: user.userId }, { email: user.email }],
      },
      include: { students: true },
    });

    if (!guardian || guardian.students.length === 0) {
      return NextResponse.json(
        { error: "অভিভাবকের সাথে সংযুক্ত কোনো শিক্ষার্থীর তথ্য পাওয়া যায়নি।" },
        { status: 403 }
      );
    }
    const linkedStudentIds = guardian.students.map((gs) => gs.studentId);

    // 2. Fetch and authoritatively validate each invoice against DB
    let totalPaymentAmount = 0;

    for (const item of allocations) {
      const parsedAmount = Math.round(Number(item.amount) * 100) / 100;
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json({ error: "পেমেন্টের পরিমাণ সঠিক নয় (ধনাত্মক সংখ্যা আবশ্যক)।" }, { status: 400 });
      }

      const invoice = await prisma.feeInvoice.findUnique({
        where: { id: item.invoiceId },
        include: { student: true },
      });

      if (!invoice) {
        return NextResponse.json({ error: `ইনভয়েস পাওয়া যায়নি: ${item.invoiceId}` }, { status: 404 });
      }

      // IDOR check: Ensure invoice strictly belongs to one of guardian's linked students
      if (!linkedStudentIds.includes(invoice.studentId)) {
        return NextResponse.json(
          { error: `অননুমোদিত অ্যাক্সেস। ইনভয়েস ${invoice.invoiceNumber} আপনার সন্তানের নয়।` },
          { status: 403 }
        );
      }

      if (invoice.status === "PAID" || invoice.dueAmount <= 0) {
        return NextResponse.json(
          { error: `ইনভয়েস ${invoice.invoiceNumber}-এর ফি ইতিপূর্বেই সম্পূর্ণ পরিশোধিত।` },
          { status: 400 }
        );
      }

      if (parsedAmount > invoice.dueAmount) {
        return NextResponse.json(
          { error: `ইনভয়েস ${invoice.invoiceNumber}-এর বকেয়া (৳ ${invoice.dueAmount})-এর চেয়ে বেশি পরিশোধ সম্ভব নয়।` },
          { status: 400 }
        );
      }

      totalPaymentAmount += parsedAmount;
    }

    totalPaymentAmount = Math.round(totalPaymentAmount * 100) / 100;

    // 3. Process manual submission safely with atomic database transaction
    // SECTION 2.1: Manual/self-reported payments are marked PENDING_VERIFICATION.
    // They do NOT mark invoice PAID, do NOT decrement dueAmount, do NOT increment CashFund.
    const txResults = await prisma.$transaction(async (tx) => {
      const results = [];

      for (const item of allocations) {
        const parsedAmount = Math.round(Number(item.amount) * 100) / 100;
        const invoice = await tx.feeInvoice.findUnique({
          where: { id: item.invoiceId },
          include: { student: true },
        });

        if (!invoice) continue;

        const requestNumber = `REQ-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const qrCodeToken = `EHRJ-PENDING-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const fundCode = invoice.fundCode || "GENERAL";

        const itemTxnId = cleanTxnId || `OFFLINE-CLAIM-${Date.now()}`;
        const itemIdempotencyKey = effectiveTxnRef
          ? (allocations.length === 1 ? effectiveTxnRef : `${effectiveTxnRef}-${invoice.id}`)
          : `IDEM-CLAIM-${invoice.id}-${Date.now()}`;

        // In-transaction duplicate check
        const existingTxn = await tx.paymentReceipt.findFirst({
          where: {
            OR: [
              { transactionId: itemTxnId },
              { idempotencyKey: itemIdempotencyKey },
            ],
          },
        });
        if (existingTxn) {
          throw new Error("এই ট্রানজেকশন রেফারেন্স/আইডি দিয়ে ইতিমধ্যে পেমেন্ট আবেদন দাখিল করা হয়েছে।");
        }

        const receipt = await tx.paymentReceipt.create({
          data: {
            receiptNumber: requestNumber,
            invoiceId: invoice.id,
            studentId: invoice.studentId,
            amount: parsedAmount,
            paymentMethod,
            transactionId: itemTxnId,
            idempotencyKey: itemIdempotencyKey,
            paymentStatus: "PENDING_VERIFICATION", // Invariant: unverified manual claim
            fundCode,
            receivedByUserId: user.userId,
            receiptDate: new Date(),
            qrCodeToken,
            notes: `অভিভাবকের ম্যানুয়াল পেমেন্ট দাবি (${paymentMethod}) — ব্যাংক/মার্চেন্ট স্টেটমেন্ট যাচাই সাপেক্ষে অনুমোদনযোগ্য। TrxID: ${cleanTxnId || "প্রদান করা হয়নি"}`,
          },
        });

        // INVARIANT: Invoice status and balances remain UNTOUCHED until admin verification.
        results.push(receipt);
      }

      return results;
    });

    await recordAuditLog({
      userId: user.userId,
      action: "GUARDIAN_MANUAL_PAYMENT_SUBMITTED",
      entityType: "PaymentReceipt",
      details: {
        totalAmount: totalPaymentAmount,
        invoiceCount: allocations.length,
        status: "PENDING_VERIFICATION",
        requestNumbers: txResults.map((r) => r.receiptNumber),
      },
    });

    return NextResponse.json({
      success: true,
      status: "PENDING_VERIFICATION",
      message: `পেমেন্টের তথ্য সফলভাবে দাখিল হয়েছে। প্রতিষ্ঠান কর্তৃপক্ষ ট্রানজেকশন আইডি (${cleanTxnId || "N/A"}) যাচাই করে অনুমোদন করলে রসিদ চূড়ান্ত হবে ও বকেয়া সমন্বয় করা হবে।`,
      requests: txResults,
      totalAmount: totalPaymentAmount,
    });
  } catch (error: any) {
    console.error("Portal payment submission error:", error);
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "এই ট্রানজেকশন রেফারেন্স/আইডি দিয়ে ইতিমধ্যে পেমেন্ট আবেদন দাখিল করা হয়েছে।" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message || "পেমেন্ট তথ্য দাখিল করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
