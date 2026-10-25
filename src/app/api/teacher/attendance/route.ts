import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import {
  normalizeAttendanceDate,
  calculateAttendanceStats,
  isWithinCorrectionWindow,
  DEFAULT_CORRECTION_WINDOW_HOURS,
} from "@/lib/attendanceCalculations";
import {
  verifyTeacherClassAssignment,
  isAttendanceLocked,
  saveAttendanceSheetTransaction,
} from "@/lib/attendanceService";

export const dynamic = "force-dynamic";

/**
 * GET /api/teacher/attendance
 * Retrieves students in roll order for a specific session, class, section, and date,
 * along with any recorded attendance, lock status, and summary counts.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অনুমোদিত শিক্ষক বা অ্যাডমিন হাজিরা দেখতে পারেন।" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const classId = searchParams.get("classId");
    const sectionId = searchParams.get("sectionId") || undefined;
    const dateStr = searchParams.get("date");

    if (!sessionId || !classId || !dateStr) {
      return NextResponse.json(
        { error: "সেশন, জামাত এবং তারিখ প্রদান করা বাধ্যতামূলক।" },
        { status: 400 }
      );
    }

    const normalizedDate = normalizeAttendanceDate(dateStr);

    // Teacher assignment authorization verification (Bypassed for ADMIN/PRINCIPAL)
    if (user.role === "TEACHER") {
      const isAssigned = await verifyTeacherClassAssignment(
        user.userId,
        sessionId,
        classId,
        sectionId
      );

      if (!isAssigned) {
        return NextResponse.json(
          { error: "অননুমোদিত জামাত। আপনি শুধুমাত্র আপনার অ্যাসাইনকৃত জামাত ও শাখার হাজিরা দেখতে পারেন।" },
          { status: 403 }
        );
      }
    }

    // Check lock state
    const lockInfo = await isAttendanceLocked(sessionId, classId, sectionId, normalizedDate);

    // Fetch active enrollments in this session, class & section in ROLL order
    const enrollments = await prisma.enrollment.findMany({
      where: {
        sessionId,
        classId,
        ...(sectionId ? { sectionId } : {}),
        status: "ACTIVE",
        student: {
          status: "ACTIVE",
        },
      },
      orderBy: {
        rollNumber: "asc",
      },
      include: {
        student: {
          select: {
            id: true,
            studentIdNumber: true,
            fullNameBn: true,
            fullNameEn: true,
            residentialStatus: true,
            isOrphan: true,
            photoUrl: true,
          },
        },
        section: {
          select: {
            id: true,
            nameBn: true,
          },
        },
        jamatClass: {
          select: {
            id: true,
            nameBn: true,
          },
        },
      },
    });

    const studentIds = enrollments.map((e) => e.studentId);

    // Fetch existing attendance records for these students on this normalized date
    const existingAttendance = await prisma.attendance.findMany({
      where: {
        sessionId,
        classId,
        date: normalizedDate,
        studentId: { in: studentIds },
      },
    });

    const attendanceMap = new Map(existingAttendance.map((a) => [a.studentId, a]));

    // Determine correction window eligibility if existing records exist
    let canTeacherEdit = !lockInfo.isLocked;
    if (existingAttendance.length > 0 && user.role === "TEACHER") {
      const earliestCreated = existingAttendance[0].createdAt;
      if (!isWithinCorrectionWindow(earliestCreated, DEFAULT_CORRECTION_WINDOW_HOURS)) {
        canTeacherEdit = false;
      }
    }

    // Merge students with attendance
    const studentsWithAttendance = enrollments.map((enrollment) => {
      const att = attendanceMap.get(enrollment.studentId);
      return {
        studentId: enrollment.student.id,
        studentIdNumber: enrollment.student.studentIdNumber,
        fullNameBn: enrollment.student.fullNameBn,
        fullNameEn: enrollment.student.fullNameEn,
        rollNumber: enrollment.rollNumber,
        residentialStatus: enrollment.student.residentialStatus,
        isOrphan: enrollment.student.isOrphan,
        photoUrl: enrollment.student.photoUrl,
        sectionNameBn: enrollment.section?.nameBn || null,
        attendanceId: att?.id || null,
        status: att?.status || "UNMARKED",
        leaveReason: att?.leaveReason || null,
        remarks: att?.remarks || null,
        markedAt: att?.createdAt || null,
        updatedAt: att?.updatedAt || null,
      };
    });

    const stats = calculateAttendanceStats(existingAttendance);

    return NextResponse.json({
      success: true,
      date: normalizedDate.toISOString().split("T")[0],
      totalStudents: enrollments.length,
      isLocked: lockInfo.isLocked,
      lockReason: lockInfo.reason || null,
      lockedAt: lockInfo.lockedAt || null,
      canEdit: user.role === "ADMIN" || user.role === "PRINCIPAL" ? true : canTeacherEdit,
      correctionWindowHours: DEFAULT_CORRECTION_WINDOW_HOURS,
      summary: stats,
      students: studentsWithAttendance,
    });
  } catch (error: any) {
    console.error("Teacher attendance GET error:", error);
    return NextResponse.json(
      { error: error.message || "হাজিরা লোড করতে সমস্যা হয়েছে।" },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * POST /api/teacher/attendance
 * Saves attendance sheet for assigned class/section.
 * Executes inside an atomic database transaction.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র শিক্ষক বা অ্যাডমিন হাজিরা সংরক্ষণ করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { sessionId, classId, sectionId, date, records, correctionReason } = body;

    if (!sessionId || !classId || !date || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "সেশন, জামাত, তারিখ এবং অন্তত একজন শিক্ষার্থীর হাজিরা প্রদান আবশ্যক।" },
        { status: 400 }
      );
    }

    // Validate statuses
    const validStatuses = ["PRESENT", "ABSENT", "LATE", "LEAVE"];
    for (const r of records) {
      if (!r.studentId || !validStatuses.includes(r.status)) {
        return NextResponse.json(
          { error: `শিক্ষার্থীর আইডি বা হাজিরা স্ট্যাটাস (${r.status}) অকার্যকর।` },
          { status: 400 }
        );
      }
    }

    const result = await saveAttendanceSheetTransaction({
      sessionId,
      classId,
      sectionId: sectionId || null,
      date,
      records,
      actorUserId: user.userId,
      actorRole: user.role as "ADMIN" | "TEACHER" | "PRINCIPAL",
      correctionReason,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Teacher attendance POST error:", error);
    return NextResponse.json(
      { error: error.message || "হাজিরা সংরক্ষণ করতে সমস্যা হয়েছে।" },
      { status: error.statusCode || 500 }
    );
  }
}
