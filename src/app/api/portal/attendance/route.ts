import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import {
  calculateAttendanceStats,
  normalizeAttendanceDate,
} from "@/lib/attendanceCalculations";

export const dynamic = "force-dynamic";

/**
 * GET /api/portal/attendance
 * Guardian & Student Portal Attendance Query.
 * Strict IDOR protection: Guardians can ONLY view their linked children.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const sessionId = searchParams.get("sessionId");
    const month = searchParams.get("month"); // 1-12
    const year = searchParams.get("year");   // e.g. 2026

    if (!studentId) {
      return NextResponse.json(
        { error: "শিক্ষার্থী আইডি (studentId) প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    // Verify student exists
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
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "শিক্ষার্থী পাওয়া যায়নি।" }, { status: 404 });
    }

    // IDOR Enforcement:
    // If authenticated as GUARDIAN, verify student is linked to this guardian
    if (user && user.role === "GUARDIAN") {
      const guardian = await prisma.guardian.findFirst({
        where: {
          OR: [
            { userId: user.userId },
            { email: user.email },
          ],
        },
        include: {
          students: true,
        },
      });

      if (!guardian) {
        return NextResponse.json(
          { error: "অভিভাবক অ্যাকাউন্ট প্রোফাইল পাওয়া যায়নি।" },
          { status: 403 }
        );
      }

      const isLinked = guardian.students.some((gs) => gs.studentId === studentId);
      if (!isLinked) {
        return NextResponse.json(
          { error: "অননুমোদিত অ্যাক্সেস। আপনি শুধুমাত্র আপনার নিজের সন্তানের হাজিরা দেখতে পারেন।" },
          { status: 403 }
        );
      }
    } else if (user && user.role === "STUDENT") {
      // Students can only view their own attendance
      const isSelf = user.userId === studentId || user.email === student.studentIdNumber;
      if (!isSelf) {
        return NextResponse.json(
          { error: "অননুমোদিত অ্যাক্সেস। শিক্ষার্থী শুধুমাত্র নিজের হাজিরা দেখতে পারে।" },
          { status: 403 }
        );
      }
    } else if (!user) {
      // Unauthenticated access check
      return NextResponse.json(
        { error: "লগইন করা আবশ্যক।" },
        { status: 401 }
      );
    }

    // Resolve session
    const targetSessionId = sessionId || student.enrollments[0]?.sessionId || (await prisma.academicSession.findFirst({ where: { isCurrent: true } }))?.id;

    const where: any = {
      studentId,
      ...(targetSessionId ? { sessionId: targetSessionId } : {}),
    };

    if (month && year) {
      const selectedYear = parseInt(year, 10);
      const selectedMonth = parseInt(month, 10);
      const startOfMonth = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0));
      const endOfMonth = new Date(Date.UTC(selectedYear, selectedMonth, 0, 23, 59, 59, 999));
      where.date = { gte: startOfMonth, lte: endOfMonth };
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        jamatClass: { select: { nameBn: true } },
        section: { select: { nameBn: true } },
      },
    });

    const summary = calculateAttendanceStats(attendanceRecords);

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        studentIdNumber: student.studentIdNumber,
        fullNameBn: student.fullNameBn,
        fullNameEn: student.fullNameEn,
        photoUrl: student.photoUrl,
        residentialStatus: student.residentialStatus,
        currentClass: student.enrollments[0]?.jamatClass?.nameBn || null,
        currentSection: student.enrollments[0]?.section?.nameBn || null,
        rollNumber: student.enrollments[0]?.rollNumber || null,
      },
      summary,
      totalDays: attendanceRecords.length,
      records: attendanceRecords.map((r) => ({
        id: r.id,
        date: r.date.toISOString().split("T")[0],
        status: r.status,
        leaveReason: r.leaveReason,
        remarks: r.remarks,
        classNameBn: r.jamatClass.nameBn,
        sectionNameBn: r.section?.nameBn || null,
      })),
    });
  } catch (error: any) {
    console.error("Portal attendance GET error:", error);
    return NextResponse.json(
      { error: error.message || "হাজিরা লোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
