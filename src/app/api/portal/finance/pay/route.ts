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

    // Idempotency / Duplicate transaction verification
    const effectiveTxnRef = (transactionId || idempotencyKey)?.toString()?.trim();
    if (effectiveTxnRef) {
      const existingReceipt = await prisma.paymentReceipt.findFirst({
        where: { transactionId: effectiveTxnRef },
      });
      if (existingReceipt) {
        return NextResponse.json(
          { error: "এই ট্রানজেকশন রেফারেন্স/আইডি দিয়ে ইতিমধ্যে পেমেন্ট সম্পন্ন হয়েছে।" },
          { status: 409 }
        );
      }
    }

    // 1. Fetch Guardian record to verify relationship
    let linkedStudentIds: string[] = [];
    if (user.role === "GUARDIAN") {
      const guardian = await prisma.guardian.findFirst({
        where: {
          OR: [{ userId: user.userId }, { email: user.email }],
        },
        include: { students: true },
      });

      if (!guardian) {
        return NextResponse.json({ error: "অভিভাবক অ্যাকাউন্ট পাওয়া যায়নি।" }, { status: 403 });
      }
      linkedStudentIds = guardian.students.map((gs) => gs.studentId);
    }

    // 2. Fetch and validate each invoice
    const receiptsGenerated: any[] = [];
    let totalPaymentAmount = 0;

    for (const item of allocations) {
      const parsedAmount = Number(item.amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json({ error: "পেমেন্টের পরিমাণ সঠিক নয়।" }, { status: 400 });
      }

      const invoice = await prisma.feeInvoice.findUnique({
        where: { id: item.invoiceId },
        include: { student: true },
      });

      if (!invoice) {
        return NextResponse.json({ error: `ইনভয়েস পাওয়া যায়নি: ${item.invoiceId}` }, { status: 404 });
      }

      // IDOR check: If guardian, ensure invoice belongs to linked child
      if (user.role === "GUARDIAN" && !linkedStudentIds.includes(invoice.studentId)) {
        return NextResponse.json(
          { error: `অননুমোদিত অ্যাক্সেস। ইনভয়েস ${invoice.invoiceNumber} আপনার সন্তানের নয়।` },
          { status: 403 }
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

    // 3. Process transactions atomically
    const txResults = await prisma.$transaction(async (tx) => {
      const results = [];

      for (const item of allocations) {
        const parsedAmount = Number(item.amount);
        const invoice = await tx.feeInvoice.findUnique({
          where: { id: item.invoiceId },
          include: { student: true },
        });

        if (!invoice) continue;

        const receiptNumber = await generateNextReceiptNumber();
        const qrCodeToken = `EHRJ-RCP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        const newPaid = invoice.paidAmount + parsedAmount;
        const newDue = Math.max(0, invoice.dueAmount - parsedAmount);
        const newStatus = newDue === 0 ? "PAID" : "PARTIALLY_PAID";
        const fundCode = invoice.fundCode || "GENERAL";

        const receipt = await tx.paymentReceipt.create({
          data: {
            receiptNumber,
            invoiceId: invoice.id,
            studentId: invoice.studentId,
            amount: parsedAmount,
            paymentMethod,
            transactionId: transactionId || `TXN-${Date.now()}`,
            paymentStatus: "SUCCESSFUL",
            fundCode,
            receivedByUserId: user.userId,
            receiptDate: new Date(),
            qrCodeToken,
            notes: `অনলাইন পেমেন্ট (${paymentMethod})`,
          },
        });

        await tx.feeInvoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount: newPaid,
            dueAmount: newDue,
            status: newStatus,
          },
        });

        // Update fund balance
        const fund = await tx.cashFund.findFirst({ where: { code: fundCode } });
        if (fund) {
          await tx.cashFund.update({
            where: { id: fund.id },
            data: { currentBalance: fund.currentBalance + parsedAmount },
          });

          await tx.cashTransaction.create({
            data: {
              fundId: fund.id,
              type: "INCOME",
              category: `অনলাইন অভিভাবক ফি আদায় (${invoice.feeType})`,
              amount: parsedAmount,
              payeeOrPayer: invoice.student.fullNameBn,
              paymentMethod,
              referenceNo: invoice.invoiceNumber,
              receiptOrVoucherNo: receiptNumber,
              approvedByUserId: user.userId,
              transactionDate: new Date(),
              notes: `অনলাইন ট্রানজেকশন: ${transactionId || "N/A"}`,
            },
          });
        }

        results.push(receipt);
      }

      return results;
    });

    await recordAuditLog({
      userId: user.userId,
      action: "GUARDIAN_ONLINE_PAYMENT",
      entityType: "PaymentReceipt",
      details: {
        totalAmount: totalPaymentAmount,
        invoiceCount: allocations.length,
        receipts: txResults.map((r) => r.receiptNumber),
      },
    });

    return NextResponse.json({
      success: true,
      message: `পেমেন্ট সফলভাবে সম্পন্ন হয়েছে। সর্বমোট পরিশোধিত: ৳ ${totalPaymentAmount}`,
      receipts: txResults,
      totalAmount: totalPaymentAmount,
    });
  } catch (error: any) {
    console.error("Portal payment error:", error);
    return NextResponse.json({ error: error.message || "পেমেন্ট সম্পন্ন করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
