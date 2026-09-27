import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/portal/hostel
 * Guardian fetches residential information for linked children.
 * Strict IDOR protection: Guardian cannot query unlinked students.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। লগইন করুন।" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    // 1. Resolve Guardian Record
    const guardian = await prisma.guardian.findFirst({
      where: {
        OR: [
          { userId: user.userId },
          { phone: user.username },
        ],
      },
      include: {
        students: {
          include: {
            student: {
              include: {
                enrollments: {
                  where: { status: "ACTIVE" },
                  include: { jamatClass: true, section: true, session: true },
                },
              },
            },
          },
        },
      },
    });

    if (!guardian || guardian.students.length === 0) {
      return NextResponse.json({ error: "কোনো সংযুক্ত শিক্ষার্থীর তথ্য পাওয়া যায়নি।" }, { status: 404 });
    }

    const linkedStudents = guardian.students.map((gs) => ({
      id: gs.student.id,
      nameBn: gs.student.fullNameBn,
      nameEn: gs.student.fullNameEn,
      studentIdNumber: gs.student.studentIdNumber,
      residentialStatus: gs.student.residentialStatus,
      className: gs.student.enrollments[0]?.jamatClass?.nameBn || "N/A",
      sectionName: gs.student.enrollments[0]?.section?.nameBn || "N/A",
      rollNumber: gs.student.enrollments[0]?.rollNumber || "N/A",
    }));

    const linkedStudentIds = linkedStudents.map((s) => s.id);

    // 2. Strict IDOR Isolation
    if (studentId && !linkedStudentIds.includes(studentId)) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। এই শিক্ষার্থীর তথ্য দেখার অধিকার আপনার নেই।" },
        { status: 403 }
      );
    }

    const activeStudentId = studentId || linkedStudentIds[0];
    const activeStudentProfile = linkedStudents.find((s) => s.id === activeStudentId);

    // 3. Fetch Student's Residential Data
    const [enrollments, histories, requests, invoices] = await Promise.all([
      prisma.residentialEnrollment.findMany({
        where: { studentId: activeStudentId },
        include: { session: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.residentialHistory.findMany({
        where: { studentId: activeStudentId },
        include: { session: true },
        orderBy: { effectiveDate: "desc" },
      }),
      prisma.residentialRequest.findMany({
        where: { studentId: activeStudentId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.feeInvoice.findMany({
        where: {
          studentId: activeStudentId,
          feeType: { in: ["HOSTEL", "FOOD"] },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const activeEnrollment = enrollments.find(
      (e) => e.status === "CHECKED_IN" || e.status === "ACTIVE" || e.status === "APPROVED"
    ) || enrollments[0] || null;

    // Calculate outstanding hostel and food balance
    const outstandingDue = invoices.reduce((sum, inv) => sum + (inv.dueAmount || 0), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);

    return NextResponse.json({
      success: true,
      children: linkedStudents,
      activeStudent: activeStudentProfile,
      student: activeStudentProfile,
      currentEnrollment: activeEnrollment,
      enrollments,
      histories,
      requests,
      invoices,
      financeSummary: {
        outstandingDue,
        totalPaid,
      },
    });
  } catch (error: any) {
    console.error("GET /api/portal/hostel error:", error);
    return NextResponse.json(
      { error: error.message || "হোস্টেল তথ্য সংগ্রহে ত্রুটি ঘটেছে।" },
      { status: 500 }
    );
  }
}
