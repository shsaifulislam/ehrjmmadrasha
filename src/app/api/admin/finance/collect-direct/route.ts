import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog, getClientIp } from "@/lib/security";
import { generateNextReceiptNumber, generateNextInvoiceNumber } from "@/lib/feeCalculationService";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/finance/collect-direct
 * Instantly collect fee (Tuition, Exam, Admission, Residential, TC, etc.) for a student,
 * atomically generating invoice, receipt, cash ledger record, and returning receipt details for instant printing.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস: কেবলমাত্র অ্যাডমিন বা অধ্যক্ষ ফি আদায় করতে পারেন।" },
        { status: 403 }
      );
    }

    const clientIp = getClientIp(req);
    const body = await req.json();
    const {
      studentId,
      amount,
      feeType = "MONTHLY_TUITION",
      title,
      paymentMethod = "CASH",
      notes,
    } = body;

    const parsedAmount = Number(amount);
    if (!studentId || isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "শিক্ষার্থী এবং সঠিক টাকার পরিমাণ প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    // 1. Fetch student and active session
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: {
            jamatClass: true,
            section: true,
          },
          take: 1,
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "শিক্ষার্থী পাওয়া যায়নি।" }, { status: 404 });
    }

    let activeSession = await prisma.academicSession.findFirst({
      where: { isCurrent: true },
    });
    if (!activeSession) {
      activeSession = await prisma.academicSession.findFirst({
        orderBy: { createdAt: "desc" },
      });
    }

    if (!activeSession) {
      return NextResponse.json(
        { error: "কোনো সক্রিয় শিক্ষাবর্ষ পাওয়া যায়নি।" },
        { status: 400 }
      );
    }

    const receiptNumber = await generateNextReceiptNumber();
    const invoiceTitle = title?.trim() || `${student.fullNameBn} - ফি আদায়`;

    // 2. Atomic execution
    const result = await prisma.$transaction(async (tx) => {
      // Find if student has any pending/unpaid invoice matching this feeType
      let invoice = await tx.feeInvoice.findFirst({
        where: {
          studentId: student.id,
          feeType,
          status: { in: ["ISSUED", "PARTIAL", "OVERDUE"] },
        },
        orderBy: { createdAt: "desc" },
      });

      if (invoice) {
        // Apply payment to existing invoice
        const newPaid = invoice.paidAmount + parsedAmount;
        const newDue = Math.max(0, invoice.netAmount - newPaid);
        const newStatus = newDue <= 0 ? "PAID" : "PARTIAL";

        invoice = await tx.feeInvoice.update({
          where: { id: invoice.id },
          data: {
            paidAmount: newPaid,
            dueAmount: newDue,
            status: newStatus,
          },
        });
      } else {
        // Create new invoice directly
        const invoiceNumber = await generateNextInvoiceNumber();
        invoice = await tx.feeInvoice.create({
          data: {
            invoiceNumber,
            studentId: student.id,
            sessionId: activeSession!.id,
            title: invoiceTitle,
            feeType,
            totalAmount: parsedAmount,
            discountAmount: 0,
            waiverAmount: 0,
            netAmount: parsedAmount,
            paidAmount: parsedAmount,
            dueAmount: 0,
            status: "PAID",
            dueDate: new Date(),
          },
        });
      }

      // Create Payment Receipt
      const receipt = await tx.paymentReceipt.create({
        data: {
          receiptNumber,
          invoiceId: invoice.id,
          studentId: student.id,
          amount: parsedAmount,
          paymentMethod,
          paymentStatus: "SUCCESS",
          qrCodeToken: `REC-${receiptNumber}-${Date.now()}`,
          receiptDate: new Date(),
          notes: notes?.trim() || null,
        },
        include: {
          student: true,
          invoice: true,
        },
      });

      // Update Cash Ledger / Fund
      const targetFund = await tx.cashFund.findFirst({
        orderBy: { currentBalance: "desc" },
      });

      if (targetFund) {
        await tx.cashFund.update({
          where: { id: targetFund.id },
          data: {
            currentBalance: targetFund.currentBalance + parsedAmount,
          },
        });

        await tx.cashTransaction.create({
          data: {
            fundId: targetFund.id,
            type: "INCOME",
            category: "STUDENT_FEE",
            amount: parsedAmount,
            payeeOrPayer: student.fullNameBn,
            paymentMethod,
            receiptOrVoucherNo: receiptNumber,
            notes: `${invoiceTitle} (রসিদ নং: ${receiptNumber})`,
            transactionDate: new Date(),
          },
        });
      }

      // Record Audit
      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: "COLLECT_FEE_DIRECT",
          entityType: "PaymentReceipt",
          entityId: receipt.id,
          detailsJson: JSON.stringify({
            studentId: student.id,
            receiptNumber,
            amount: parsedAmount,
            feeType,
            invoiceId: invoice.id,
          }),
          ipAddress: clientIp,
        },
      });

      return { invoice, receipt };
    });

    return NextResponse.json({
      success: true,
      message: "ফি সফলভাবে আদায় ও রসিদ তৈরি সম্পন্ন হয়েছে।",
      receipt: result.receipt,
      invoice: result.invoice,
      student: {
        id: student.id,
        fullNameBn: student.fullNameBn,
        fullNameEn: student.fullNameEn,
        studentIdNumber: student.studentIdNumber,
        className: student.enrollments[0]?.jamatClass?.nameBn || "সাধারণ",
        rollNumber: student.enrollments[0]?.rollNumber || 1,
      },
    });
  } catch (error: any) {
    console.error("Collect direct fee error:", error);
    return NextResponse.json(
      { error: error.message || "ফি আদায় সম্পন্ন করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
