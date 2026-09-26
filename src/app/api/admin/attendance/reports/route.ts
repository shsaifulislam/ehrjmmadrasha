import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import {
  normalizeAttendanceDate,
  calculateAttendanceStats,
} from "@/lib/attendanceCalculations";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/attendance/reports
 * Generates structured attendance reports:
 * - DAILY
 * - MONTHLY
 * - STUDENT
 * - CLASS
 * - SESSION
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL" && user.role !== "TEACHER")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অনুমোদিত ব্যবহারকারী রিপোর্ট দেখতে পারেন।" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const type = (searchParams.get("type") || "DAILY").toUpperCase();
    const sessionId = searchParams.get("sessionId");
    const classId = searchParams.get("classId");
    const sectionId = searchParams.get("sectionId");
    const studentId = searchParams.get("studentId");
    const dateStr = searchParams.get("date");
    const month = searchParams.get("month"); // 1 - 12
    const year = searchParams.get("year");   // e.g. 2026
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    // Resolve session
    const targetSessionId = sessionId || (await prisma.academicSession.findFirst({ where: { isCurrent: true } }))?.id;
    if (!targetSessionId) {
      return NextResponse.json({ error: "কোনো শিক্ষাবর্ষ নির্ধারণ করা হয়নি।" }, { status: 400 });
    }

    // 1. DAILY REPORT
    if (type === "DAILY") {
      const normalizedDate = dateStr ? normalizeAttendanceDate(dateStr) : normalizeAttendanceDate(new Date());

      const where: any = {
        sessionId: targetSessionId,
        date: normalizedDate,
      };
      if (classId) where.classId = classId;
      if (sectionId) where.sectionId = sectionId;

      const records = await prisma.attendance.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              studentIdNumber: true,
              fullNameBn: true,
              residentialStatus: true,
            },
          },
          jamatClass: { select: { id: true, nameBn: true } },
          section: { select: { id: true, nameBn: true } },
        },
        orderBy: [{ jamatClass: { sortOrder: "asc" } }, { student: { studentIdNumber: "asc" } }],
      });

      const summary = calculateAttendanceStats(records);

      // Group by class
      const classMap = new Map<string, { classId: string; classNameBn: string; records: any[] }>();
      records.forEach((r) => {
        const cId = r.classId;
        if (!classMap.has(cId)) {
          classMap.set(cId, {
            classId: cId,
            classNameBn: r.jamatClass.nameBn,
            records: [],
          });
        }
        classMap.get(cId)!.records.push(r);
      });

      const classBreakdown = Array.from(classMap.values()).map((g) => {
        const cStats = calculateAttendanceStats(g.records);
        return {
          classId: g.classId,
          classNameBn: g.classNameBn,
          ...cStats,
        };
      });

      return NextResponse.json({
        success: true,
        reportType: "DAILY",
        date: normalizedDate.toISOString().split("T")[0],
        sessionId: targetSessionId,
        summary,
        classBreakdown,
        records: records.map((r) => ({
          studentId: r.studentId,
          studentIdNumber: r.student.studentIdNumber,
          fullNameBn: r.student.fullNameBn,
          residentialStatus: r.student.residentialStatus,
          classNameBn: r.jamatClass.nameBn,
          sectionNameBn: r.section?.nameBn || null,
          status: r.status,
          leaveReason: r.leaveReason,
        })),
      });
    }

    // 2. MONTHLY REPORT
    if (type === "MONTHLY") {
      const selectedYear = parseInt(year || new Date().getFullYear().toString(), 10);
      const selectedMonth = parseInt(month || (new Date().getMonth() + 1).toString(), 10);

      const startOfMonth = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0));
      const endOfMonth = new Date(Date.UTC(selectedYear, selectedMonth, 0, 23, 59, 59, 999));

      const where: any = {
        sessionId: targetSessionId,
        date: { gte: startOfMonth, lte: endOfMonth },
      };
      if (classId) where.classId = classId;
      if (sectionId) where.sectionId = sectionId;

      const records = await prisma.attendance.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              studentIdNumber: true,
              fullNameBn: true,
            },
          },
          jamatClass: { select: { id: true, nameBn: true } },
        },
      });

      // Group records by student
      const studentMap = new Map<string, { student: any; classNameBn: string; records: any[] }>();
      records.forEach((r) => {
        if (!studentMap.has(r.studentId)) {
          studentMap.set(r.studentId, {
            student: r.student,
            classNameBn: r.jamatClass.nameBn,
            records: [],
          });
        }
        studentMap.get(r.studentId)!.records.push(r);
      });

      const studentSummaries = Array.from(studentMap.values()).map((entry) => {
        const stats = calculateAttendanceStats(entry.records);
        return {
          studentId: entry.student.id,
          studentIdNumber: entry.student.studentIdNumber,
          fullNameBn: entry.student.fullNameBn,
          classNameBn: entry.classNameBn,
          ...stats,
        };
      });

      const overall = calculateAttendanceStats(records);

      return NextResponse.json({
        success: true,
        reportType: "MONTHLY",
        year: selectedYear,
        month: selectedMonth,
        sessionId: targetSessionId,
        summary: overall,
        studentSummaries,
      });
    }

    // 3. STUDENT REPORT
    if (type === "STUDENT") {
      if (!studentId) {
        return NextResponse.json({ error: "শিক্ষার্থী আইডি (studentId) প্রদান করা আবশ্যক।" }, { status: 400 });
      }

      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: {
          id: true,
          studentIdNumber: true,
          fullNameBn: true,
          fullNameEn: true,
          residentialStatus: true,
          photoUrl: true,
        },
      });

      if (!student) {
        return NextResponse.json({ error: "শিক্ষার্থী পাওয়া যায়নি।" }, { status: 404 });
      }

      const where: any = {
        studentId,
        sessionId: targetSessionId,
      };

      if (startDateStr && endDateStr) {
        where.date = {
          gte: normalizeAttendanceDate(startDateStr),
          lte: normalizeAttendanceDate(endDateStr),
        };
      }

      const records = await prisma.attendance.findMany({
        where,
        orderBy: { date: "asc" },
        include: {
          jamatClass: { select: { id: true, nameBn: true } },
          section: { select: { id: true, nameBn: true } },
        },
      });

      const summary = calculateAttendanceStats(records);

      return NextResponse.json({
        success: true,
        reportType: "STUDENT",
        student,
        summary,
        records: records.map((r) => ({
          id: r.id,
          date: r.date.toISOString().split("T")[0],
          status: r.status,
          leaveReason: r.leaveReason,
          remarks: r.remarks,
          classNameBn: r.jamatClass.nameBn,
          sectionNameBn: r.section?.nameBn || null,
        })),
      });
    }

    // 4. CLASS REPORT / SESSION REPORT
    const where: any = { sessionId: targetSessionId };
    if (classId) where.classId = classId;
    if (sectionId) where.sectionId = sectionId;

    if (startDateStr && endDateStr) {
      where.date = {
        gte: normalizeAttendanceDate(startDateStr),
        lte: normalizeAttendanceDate(endDateStr),
      };
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        jamatClass: { select: { id: true, nameBn: true } },
      },
    });

    const summary = calculateAttendanceStats(records);

    // Group by date
    const dateMap = new Map<string, any[]>();
    records.forEach((r) => {
      const dKey = r.date.toISOString().split("T")[0];
      if (!dateMap.has(dKey)) dateMap.set(dKey, []);
      dateMap.get(dKey)!.push(r);
    });

    const timeline = Array.from(dateMap.entries()).map(([d, items]) => {
      const stats = calculateAttendanceStats(items);
      return {
        date: d,
        ...stats,
      };
    });

    return NextResponse.json({
      success: true,
      reportType: type,
      sessionId: targetSessionId,
      classId: classId || null,
      summary,
      timeline,
      totalDaysRecorded: timeline.length,
    });
  } catch (error: any) {
    console.error("Attendance reports GET error:", error);
    return NextResponse.json(
      { error: error.message || "রিপোর্ট তৈরিতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
