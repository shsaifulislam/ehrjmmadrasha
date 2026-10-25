import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import {
  normalizeAttendanceDate,
  calculateAttendanceStats,
} from "@/lib/attendanceCalculations";
import {
  isAttendanceLocked,
  saveAttendanceSheetTransaction,
} from "@/lib/attendanceService";
import { parsePaginationParams } from "@/lib/pagination";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/attendance
 * Admin multi-filter attendance cockpit.
 * Query params: sessionId, classId, sectionId, date, status, search, take, page.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন এই তথ্য দেখতে পারেন।" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const { page, take, skip } = parsePaginationParams(searchParams, 50, 200);
    const sessionId = searchParams.get("sessionId");
    const classId = searchParams.get("classId");
    const sectionId = searchParams.get("sectionId") || undefined;
    const dateStr = searchParams.get("date");
    const statusFilter = searchParams.get("status");
    const search = searchParams.get("search");

    if (!sessionId) {
      // Find current session if not specified
      const current = await prisma.academicSession.findFirst({ where: { isCurrent: true } });
      if (!current) {
        return NextResponse.json({ error: "কোনো শিক্ষাবর্ষ নির্ধারণ করা হয়নি।" }, { status: 400 });
      }
    }

    const targetSessionId = sessionId || (await prisma.academicSession.findFirst({ where: { isCurrent: true } }))?.id!;
    const normalizedDate = dateStr ? normalizeAttendanceDate(dateStr) : normalizeAttendanceDate(new Date());

    // If specific classId is provided, fetch enrollments in roll order
    if (classId) {
      const lockInfo = await isAttendanceLocked(targetSessionId, classId, sectionId, normalizedDate);

      const enrollments = await prisma.enrollment.findMany({
        where: {
          sessionId: targetSessionId,
          classId,
          ...(sectionId ? { sectionId } : {}),
          status: "ACTIVE",
          student: {
            status: "ACTIVE",
            ...(search
              ? {
                  OR: [
                    { fullNameBn: { contains: search } },
                    { fullNameEn: { contains: search } },
                    { studentIdNumber: { contains: search } },
                  ],
                }
              : {}),
          },
        },
        orderBy: {
          rollNumber: "asc",
        },
        skip,
        take,
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
              fatherNameBn: true,
              fatherPhone: true,
            },
          },
          section: {
            select: { id: true, nameBn: true },
          },
          jamatClass: {
            select: { id: true, nameBn: true },
          },
        },
      });

      const studentIds = enrollments.map((e) => e.studentId);

      const existingRecords = await prisma.attendance.findMany({
        where: {
          sessionId: targetSessionId,
          classId,
          date: normalizedDate,
          studentId: { in: studentIds },
          ...(statusFilter ? { status: statusFilter } : {}),
        },
      });

      const attendanceMap = new Map(existingRecords.map((a) => [a.studentId, a]));

      // Combine student and attendance
      let items = enrollments.map((e) => {
        const att = attendanceMap.get(e.studentId);
        return {
          studentId: e.student.id,
          studentIdNumber: e.student.studentIdNumber,
          fullNameBn: e.student.fullNameBn,
          fullNameEn: e.student.fullNameEn,
          fatherNameBn: e.student.fatherNameBn,
          fatherPhone: e.student.fatherPhone,
          rollNumber: e.rollNumber,
          residentialStatus: e.student.residentialStatus,
          isOrphan: e.student.isOrphan,
          photoUrl: e.student.photoUrl,
          classNameBn: e.jamatClass.nameBn,
          sectionNameBn: e.section?.nameBn || null,
          attendanceId: att?.id || null,
          status: att?.status || "UNMARKED",
          checkInTime: att?.checkInTime || null,
          checkOutTime: att?.checkOutTime || null,
          entryMethod: att?.entryMethod || null,
          exitMethod: att?.exitMethod || null,
          checkInSmsSent: att?.checkInSmsSent || false,
          checkOutSmsSent: att?.checkOutSmsSent || false,
          leaveReason: att?.leaveReason || null,
          remarks: att?.remarks || null,
          correctionReason: att?.correctionReason || null,
          markedByUserId: att?.markedByUserId || null,
          updatedByUserId: att?.updatedByUserId || null,
          createdAt: att?.createdAt || null,
          updatedAt: att?.updatedAt || null,
        };
      });

      if (statusFilter && statusFilter !== "ALL") {
        if (statusFilter === "UNMARKED") {
          items = items.filter((i) => i.status === "UNMARKED");
        } else {
          items = items.filter((i) => i.status === statusFilter);
        }
      }

      const allClassAttendance = await prisma.attendance.findMany({
        where: {
          sessionId: targetSessionId,
          classId,
          date: normalizedDate,
        },
      });

      const summary = calculateAttendanceStats(allClassAttendance);

      return NextResponse.json({
        success: true,
        date: normalizedDate.toISOString().split("T")[0],
        sessionId: targetSessionId,
        classId,
        sectionId: sectionId || null,
        isLocked: lockInfo.isLocked,
        lockReason: lockInfo.reason || null,
        lockedAt: lockInfo.lockedAt || null,
        summary,
        totalEnrolled: enrollments.length,
        items,
      });
    }

    // Broad institution-wide view for the selected date
    const broadAttendance = await prisma.attendance.findMany({
      where: {
        sessionId: targetSessionId,
        date: normalizedDate,
        ...(statusFilter && statusFilter !== "ALL" ? { status: statusFilter } : {}),
      },
      include: {
        student: {
          select: {
            id: true,
            studentIdNumber: true,
            fullNameBn: true,
            photoUrl: true,
            residentialStatus: true,
            fatherPhone: true,
          },
        },
        jamatClass: {
          select: { id: true, nameBn: true },
        },
        section: {
          select: { id: true, nameBn: true },
        },
      },
      orderBy: [
        { jamatClass: { sortOrder: "asc" } },
        { student: { studentIdNumber: "asc" } },
      ],
      skip,
      take,
    });

    const broadStats = calculateAttendanceStats(broadAttendance);

    return NextResponse.json({
      success: true,
      page,
      take,
      date: normalizedDate.toISOString().split("T")[0],
      sessionId: targetSessionId,
      summary: broadStats,
      totalRecords: broadAttendance.length,
      items: broadAttendance.map((a) => ({
        attendanceId: a.id,
        studentId: a.studentId,
        studentIdNumber: a.student.studentIdNumber,
        fullNameBn: a.student.fullNameBn,
        photoUrl: a.student.photoUrl,
        residentialStatus: a.student.residentialStatus,
        fatherPhone: a.student.fatherPhone,
        classNameBn: a.jamatClass.nameBn,
        sectionNameBn: a.section?.nameBn || null,
        status: a.status,
        checkInTime: a.checkInTime,
        checkOutTime: a.checkOutTime,
        entryMethod: a.entryMethod,
        exitMethod: a.exitMethod,
        checkInSmsSent: a.checkInSmsSent,
        checkOutSmsSent: a.checkOutSmsSent,
        leaveReason: a.leaveReason,
        remarks: a.remarks,
        correctionReason: a.correctionReason,
        updatedAt: a.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error("Admin attendance GET error:", error);
    return NextResponse.json(
      { error: error.message || "হাজিরা লোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/attendance
 * Admin bulk save / override.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন এই কার্য সম্পাদন করতে পারেন।" },
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

    const result = await saveAttendanceSheetTransaction({
      sessionId,
      classId,
      sectionId: sectionId || null,
      date,
      records,
      actorUserId: user.userId,
      actorRole: "ADMIN",
      correctionReason,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Admin attendance POST error:", error);
    return NextResponse.json(
      { error: error.message || "হাজিরা সংরক্ষণ করতে সমস্যা হয়েছে।" },
      { status: error.statusCode || 500 }
    );
  }
}
