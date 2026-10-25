import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/teacher/exams/routines
 * Fetch scheduled exam routines scoped strictly to the teacher's assigned classes and sections.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র শিক্ষক প্রবেশ করতে পারেন।" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId") || undefined;

    // Admin / Principal view: all published routines
    if (user.role === "ADMIN" || user.role === "PRINCIPAL") {
      const [routines, exams] = await Promise.all([
        prisma.examRoutine.findMany({
          where: {
            ...(examId ? { examId } : {}),
            status: "PUBLISHED",
          },
          include: {
            exam: {
              select: {
                id: true,
                nameBn: true,
                nameEn: true,
                startDate: true,
                endDate: true,
                status: true,
              },
            },
            jamatClass: { select: { id: true, nameBn: true, nameEn: true, code: true } },
            section: { select: { id: true, nameBn: true, nameEn: true } },
            subject: {
              select: {
                id: true,
                nameBn: true,
                nameEn: true,
                code: true,
                fullMarks: true,
                passMarks: true,
              },
            },
          },
          orderBy: [{ examDate: "asc" }, { startTime: "asc" }],
        }),
        prisma.exam.findMany({
          where: {
            status: { in: ["ACTIVE", "PUBLISHED", "UPCOMING", "ONGOING"] },
          },
          select: {
            id: true,
            nameBn: true,
            nameEn: true,
            startDate: true,
            endDate: true,
            status: true,
            instructions: true,
          },
          orderBy: { startDate: "asc" },
        }),
      ]);

      return NextResponse.json({ success: true, routines, exams });
    }

    // Teacher View: query teacher assignments
    const assignments = await prisma.teacherAssignment.findMany({
      where: { teacherId: user.userId },
      select: { classId: true, sectionId: true, sessionId: true },
    });

    if (assignments.length === 0) {
      return NextResponse.json({ success: true, routines: [], exams: [] });
    }

    const assignedClassIds = Array.from(new Set(assignments.map((a) => a.classId)));
    const assignedSectionIds = assignments
      .map((a) => a.sectionId)
      .filter((s): s is string => Boolean(s));
    const sessionIds = Array.from(new Set(assignments.map((a) => a.sessionId)));

    const [routines, exams] = await Promise.all([
      prisma.examRoutine.findMany({
        where: {
          classId: { in: assignedClassIds },
          status: "PUBLISHED",
          ...(examId ? { examId } : {}),
          ...(assignedSectionIds.length > 0
            ? {
                OR: [
                  { sectionId: { in: assignedSectionIds } },
                  { sectionId: null },
                ],
              }
            : {}),
        },
        include: {
          exam: {
            select: {
              id: true,
              nameBn: true,
              nameEn: true,
              startDate: true,
              endDate: true,
              status: true,
            },
          },
          jamatClass: { select: { id: true, nameBn: true, nameEn: true, code: true } },
          section: { select: { id: true, nameBn: true, nameEn: true } },
          subject: {
            select: {
              id: true,
              nameBn: true,
              nameEn: true,
              code: true,
              fullMarks: true,
              passMarks: true,
            },
          },
        },
        orderBy: [{ examDate: "asc" }, { startTime: "asc" }],
      }),
      prisma.exam.findMany({
        where: {
          sessionId: { in: sessionIds },
          status: { in: ["ACTIVE", "PUBLISHED", "UPCOMING", "ONGOING"] },
        },
        select: {
          id: true,
          nameBn: true,
          nameEn: true,
          startDate: true,
          endDate: true,
          status: true,
          instructions: true,
        },
        orderBy: { startDate: "asc" },
      }),
    ]);

    return NextResponse.json({ success: true, routines, exams });
  } catch (error: any) {
    console.error("GET /api/teacher/exams/routines error:", error);
    return NextResponse.json(
      { error: "পরীক্ষার রুটিন লোড করতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
