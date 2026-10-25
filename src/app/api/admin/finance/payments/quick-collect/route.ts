import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { generateNextInvoiceNumber, generateNextReceiptNumber } from "@/lib/feeCalculationService";
import { emitDomainEvent, processSingleOutboxEvent } from "@/lib/communicationEngine";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/finance/payments/quick-collect
 * Atomic creation of spot invoice, instant payment receipt, cash ledger update, and audit log.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন ফি আদায় করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const {
      studentId,
      sessionId,
      feeType = "MONTHLY",
      title,
      amount,
      paymentMethod = "CASH",
      transactionId,
      notes,
    } = body;

    const parsedAmount = Number(amount);
    if (!studentId || isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "শিক্ষার্থী এবং সঠিক টাকার পরিমাণ (১ বা তদূর্ধ্ব) আবশ্যক।" },
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

    // Resolve student
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: {
            jamatClass: true,
            section: true,
            session: true,
          },
          take: 1,
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "শিক্ষার্থী পাওয়া যায়নি।" }, { status: 404 });
    }

    const activeEnrollment = student.enrollments?.[0];

    // Resolve session
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      if (activeEnrollment?.sessionId) {
        activeSessionId = activeEnrollment.sessionId;
      } else {
        const activeSess = await prisma.academicSession.findFirst({
          where: { status: "ACTIVE" },
        });
        activeSessionId = activeSess?.id;
      }
    }

    if (!activeSessionId) {
      return NextResponse.json({ error: "কোনো সক্রিয় শিক্ষাবর্ষ সেশন পাওয়া যায়নি।" }, { status: 400 });
    }

    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    const invoiceTitle = title && title.trim().length > 0 
      ? title.trim() 
      : `স্পট ফি আদায় (${student.fullNameBn}) - ${currentMonth}`;

    const targetFundCode = feeType === "FOOD" || feeType === "LILLAH" ? "LILLAH" : "GENERAL";

    // Atomic transaction
    const txResult = await prisma.$transaction(
      async (tx) => {
        // 1. Generate Next Invoice Number
        const invoiceNumber = await generateNextInvoiceNumber();

        // 2. Create FeeInvoice
        const invoice = await tx.feeInvoice.create({
          data: {
            invoiceNumber,
            studentId,
            sessionId: activeSessionId,
            feeType,
            title: invoiceTitle,
            dueDate: new Date(),
            totalAmount: parsedAmount,
            discountAmount: 0,
            waiverAmount: 0,
            lateFeeAmount: 0,
            netAmount: parsedAmount,
            paidAmount: parsedAmount,
            dueAmount: 0,
            status: "PAID",
            fundCode: targetFundCode,
          },
        });

        // 3. Generate Next Receipt Number
        const receiptNumber = await generateNextReceiptNumber(tx);
        const qrCodeToken = `EHRJ-RCP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // 4. Create PaymentReceipt
        const receipt = await tx.paymentReceipt.create({
          data: {
            receiptNumber,
            invoiceId: invoice.id,
            studentId,
            amount: parsedAmount,
            paymentMethod,
            transactionId: transactionId || null,
            paymentStatus: "SUCCESSFUL",
            fundCode: targetFundCode,
            receivedByUserId: user.userId,
            receiptDate: new Date(),
            qrCodeToken,
            notes: notes || "স্পট কাউন্টার রসিদ",
          },
        });

        // 5. Update CashFund & CashTransaction
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
              category: `স্পট ফি আদায় (${feeType})`,
              amount: parsedAmount,
              payeeOrPayer: student.fullNameBn,
              paymentMethod,
              referenceNo: invoice.invoiceNumber,
              receiptOrVoucherNo: receiptNumber,
              approvedByUserId: user.userId,
              transactionDate: new Date(),
              notes: notes || `ইনভয়েস নং: ${invoice.invoiceNumber} (স্পট কাউন্টার)`,
            },
          });
        }

        // 6. Outbox domain event
        const outbox = await emitDomainEvent({
          eventType: "PAYMENT_SUCCESSFUL",
          entityType: "PaymentReceipt",
          entityId: receipt.id,
          payload: {
            studentId,
            studentNameBn: student.fullNameBn,
            amount: parsedAmount,
            receiptNumber,
            receiptId: receipt.id,
            isSpotPayment: true,
          },
          idempotencyKey: `spot-payment-${receipt.id}`,
          tx,
        });

        return [receipt, invoice, outbox.id];
      },
      { timeout: 15000 }
    );

    const [receipt, invoice, outboxId] = txResult;

    if (outboxId) {
      processSingleOutboxEvent(outboxId as string).catch((err) =>
        console.error("Outbox process error in quick-collect:", err)
      );
    }

    await recordAuditLog({
      userId: user.userId,
      action: "QUICK_PAYMENT_COLLECTED",
      entityType: "PaymentReceipt",
      entityId: (receipt as any).id,
      details: {
        receiptNumber: (receipt as any).receiptNumber,
        invoiceNumber: (invoice as any).invoiceNumber,
        studentId,
        studentName: student.fullNameBn,
        amount: parsedAmount,
        paymentMethod,
      },
    });

    return NextResponse.json({
      success: true,
      message: "ফি সফলভাবে আদায় করা হয়েছে এবং রসিদ তৈরি হয়েছে।",
      receipt: {
        ...(receipt as any),
        studentNameBn: student.fullNameBn,
        studentIdNumber: student.studentIdNumber,
        className: activeEnrollment?.jamatClass?.nameBn || "N/A",
        sectionName: activeEnrollment?.section?.nameBn || "",
        rollNumber: activeEnrollment?.rollNumber || 1,
        title: invoiceTitle,
      },
      invoice,
    });
  } catch (error: any) {
    console.error("Quick Collect Error:", error);
    return NextResponse.json(
      { error: error.message || "স্পট ফি আদায়ে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
