import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/hostel/residents/[studentId]
 * Detailed hostel profile for a specific student including residential history, finance summary, and requests.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { studentId } = params;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: { jamatClass: true, section: true, session: true },
          take: 1,
        },
        residentialEnrollments: {
          orderBy: { createdAt: "desc" },
          include: { session: true },
        },
        residentialHistories: {
          orderBy: { effectiveDate: "desc" },
          include: {
            session: true,
            recordedByUser: { select: { id: true, name: true, role: true } },
          },
        },
        residentialRequests: {
          orderBy: { createdAt: "desc" },
          include: {
            guardian: true,
            reviewedByUser: { select: { id: true, name: true } },
          },
        },
        guardianLinks: {
          include: { guardian: true },
        },
        feeInvoices: {
          where: { feeType: { in: ["HOSTEL", "FOOD"] } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "শিক্ষার্থী পাওয়া যায়নি।" }, { status: 404 });
    }

    // Aggregate Finance
    const financeSummary = await prisma.feeInvoice.aggregate({
      where: {
        studentId,
        feeType: { in: ["HOSTEL", "FOOD"] },
      },
      _sum: {
        netAmount: true,
        paidAmount: true,
        dueAmount: true,
      },
    });

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        studentIdNumber: student.studentIdNumber,
        fullNameBn: student.fullNameBn,
        fullNameEn: student.fullNameEn,
        photoUrl: student.photoUrl,
        residentialStatus: student.residentialStatus,
        isOrphan: student.isOrphan,
        isFinanciallyWeak: student.isFinanciallyWeak,
        class: student.enrollments[0]?.jamatClass?.nameBn || "N/A",
        section: student.enrollments[0]?.section?.nameBn || "N/A",
        rollNumber: student.enrollments[0]?.rollNumber || "N/A",
        session: student.enrollments[0]?.session?.name || "N/A",
        guardians: student.guardianLinks.map((g) => ({
          name: g.guardian.fullNameBn,
          relation: g.guardian.relation,
          phone: g.guardian.phone,
        })),
      },
      currentEnrollment: student.residentialEnrollments[0] || null,
      enrollments: student.residentialEnrollments,
      histories: student.residentialHistories,
      requests: student.residentialRequests,
      invoices: student.feeInvoices,
      financeSummary: {
        totalBilled: financeSummary._sum.netAmount || 0,
        totalPaid: financeSummary._sum.paidAmount || 0,
        totalDue: financeSummary._sum.dueAmount || 0,
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/hostel/residents/[studentId] error:", error);
    return NextResponse.json(
      { error: error.message || "শিক্ষার্থীর হোস্টেল বিবরণ সংগ্রহে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
