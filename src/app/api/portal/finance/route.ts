import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/portal/finance
 * Returns financial overview for a specific linked child.
 * Enforces strict IDOR protection: Guardians can ONLY view their own linked children.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "লগইন করা আবশ্যক।" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "শিক্ষার্থী আইডি প্রদান করুন।" }, { status: 400 });
    }

    // 1. Strict IDOR Authorization Guard for GUARDIAN role
    if (user.role === "GUARDIAN") {
      const guardian = await prisma.guardian.findFirst({
        where: {
          OR: [{ userId: user.userId }, { email: user.email }],
        },
        include: {
          students: true,
        },
      });

      if (!guardian) {
        return NextResponse.json({ error: "অভিভাবক অ্যাকাউন্ট পাওয়া যায়নি।" }, { status: 403 });
      }

      const isAuthorizedChild = guardian.students.some((gs) => gs.studentId === studentId);
      if (!isAuthorizedChild) {
        return NextResponse.json(
          { error: "অননুমোদিত অ্যাক্সেস। আপনি কেবল আপনার নিবন্ধিত সন্তানের ফি বিবরণী দেখতে পারবেন।" },
          { status: 403 }
        );
      }
    } else if (user.role !== "ADMIN" && user.role !== "PRINCIPAL" && user.role !== "ACCOUNTANT") {
      // Teachers and others are forbidden from student finance
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    // 2. Fetch student financial records
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: { jamatClass: true, section: true },
          take: 1,
        },
        feeInvoices: {
          where: { status: { not: "CANCELLED" } },
          include: {
            receipts: {
              select: {
                id: true,
                receiptNumber: true,
                amount: true,
                paymentMethod: true,
                transactionId: true,
                receiptDate: true,
                qrCodeToken: true,
              },
            },
            refunds: {
              select: {
                id: true,
                refundNumber: true,
                amount: true,
                refundDate: true,
                reason: true,
              },
            },
          },
          orderBy: { dueDate: "desc" },
        },
        financialAssistances: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
        },
        scholarships: {
          include: { scholarship: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "শিক্ষার্থী পাওয়া যায়নি।" }, { status: 404 });
    }

    // 3. Compute totals
    const totalBilled = student.feeInvoices.reduce((sum, inv) => sum + inv.netAmount, 0);
    const totalPaid = student.feeInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const totalDue = student.feeInvoices.reduce((sum, inv) => sum + inv.dueAmount, 0);

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        studentIdNumber: student.studentIdNumber,
        fullNameBn: student.fullNameBn,
        fullNameEn: student.fullNameEn,
        residentialStatus: student.residentialStatus,
        className: student.enrollments[0]?.jamatClass?.nameBn || null,
        rollNumber: student.enrollments[0]?.rollNumber || null,
      },
      summary: {
        totalBilled,
        totalPaid,
        totalDue,
      },
      invoices: student.feeInvoices,
      assistances: student.financialAssistances,
      scholarships: student.scholarships,
    });
  } catch (error: any) {
    console.error("Portal finance GET error:", error);
    return NextResponse.json({ error: "ফি তথ্য লোড করা সম্ভব হয়নি।" }, { status: 500 });
  }
}
