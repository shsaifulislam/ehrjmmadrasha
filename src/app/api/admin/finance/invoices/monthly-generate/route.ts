import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { calculateStudentFee, generateNextInvoiceNumber } from "@/lib/feeCalculationService";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/finance/invoices/monthly-generate
 * Automated Bulk Monthly Fee Generation with Strict Idempotency
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন মাসিক বিল জেনারেট করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { sessionId, classId, billingMonth, feeType = "MONTHLY", dueDay = 10 } = body;

    if (!sessionId || !billingMonth) {
      return NextResponse.json(
        { error: "সেশন এবং বিলিং মাস (যেমন: 2026-03) প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    // 1. Find all active students in the session and specified class
    const enrollmentWhere: any = {
      sessionId,
      status: "ACTIVE",
    };
    if (classId) {
      enrollmentWhere.classId = classId;
    }

    const activeEnrollments = await prisma.enrollment.findMany({
      where: enrollmentWhere,
      include: {
        student: true,
        jamatClass: true,
      },
      orderBy: { rollNumber: "asc" },
    });

    if (activeEnrollments.length === 0) {
      return NextResponse.json({
        success: true,
        message: "কোনো সক্রিয় শিক্ষার্থী পাওয়া যায়নি।",
        createdCount: 0,
        skippedCount: 0,
      });
    }

    // Due date
    const [yearStr, monthStr] = billingMonth.split("-");
    const year = Number(yearStr) || new Date().getFullYear();
    const month = Number(monthStr) || new Date().getMonth() + 1;
    const dueDate = new Date(year, month - 1, Number(dueDay));

    let createdCount = 0;
    let skippedCount = 0;
    const invoicesCreated: any[] = [];

    for (const enrollment of activeEnrollments) {
      const student = enrollment.student;

      // 2. Day Care Food Rule: skip if DAY_CARE student and feeType is FOOD
      if (student.residentialStatus === "DAY_CARE" && feeType === "FOOD") {
        skippedCount++;
        continue;
      }

      // 3. Strict Idempotency: Check if an invoice already exists for (studentId, sessionId, billingMonth, feeType)
      const existingInvoice = await prisma.feeInvoice.findFirst({
        where: {
          studentId: student.id,
          sessionId,
          billingMonth,
          feeType,
          status: { not: "CANCELLED" },
        },
      });

      if (existingInvoice) {
        skippedCount++;
        continue;
      }

      // 4. Calculate fee using canonical engine
      const calc = await calculateStudentFee({
        sessionId,
        classId: enrollment.classId,
        studentId: student.id,
        feeType,
        billingMonth,
      });

      const invoiceNumber = await generateNextInvoiceNumber();
      const title = `${billingMonth} - ${enrollment.jamatClass.nameBn} (${feeType})`;

      const totalAmount = calc.baseAmount;
      const discountAmount = calc.scholarshipAmount + calc.assistanceAmount;
      const waiverAmount = calc.waiverAmount;
      const lateFeeAmount = calc.lateFeeAmount;
      const netAmount = Math.max(0, totalAmount - discountAmount - waiverAmount + lateFeeAmount);

      const createdInv = await prisma.feeInvoice.create({
        data: {
          invoiceNumber,
          studentId: student.id,
          sessionId,
          feeType,
          billingMonth,
          title,
          dueDate,
          totalAmount,
          discountAmount,
          waiverAmount,
          lateFeeAmount,
          netAmount,
          paidAmount: 0,
          dueAmount: netAmount,
          fundCode: calc.fundCode,
          idempotencyKey: `${student.id}_${sessionId}_${billingMonth}_${feeType}`,
          status: netAmount === 0 ? "WAIVED" : "UNPAID",
        },
      });

      invoicesCreated.push(createdInv);
      createdCount++;
    }

    await recordAuditLog({
      userId: user.userId,
      action: "BULK_MONTHLY_INVOICE_GENERATED",
      entityType: "FeeInvoice",
      details: {
        sessionId,
        classId: classId || "ALL",
        billingMonth,
        feeType,
        createdCount,
        skippedCount,
      },
    });

    return NextResponse.json({
      success: true,
      message: `মাসিক বিল তৈরি সম্পন্ন। নতুন ইনভয়েস: ${createdCount}টি, পূর্বেই প্রস্তুত/অপ্রযোজ্য: ${skippedCount}টি।`,
      createdCount,
      skippedCount,
    });
  } catch (error: any) {
    console.error("Monthly fee generate error:", error);
    return NextResponse.json({ error: error.message || "মাসিক ফি তৈরিতে ব্যর্থতা।" }, { status: 500 });
  }
}
