import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/teacher/subjects
 * Scoped academic subjects endpoint for Teachers.
 * Strict server-side authorization:
 * - Rejects unassigned classes with 403 Forbidden.
 * - Only returns subjects assigned to the authenticated teacher.
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
    const classId = searchParams.get("classId");

    if (!classId) {
      return NextResponse.json(
        { error: "জামাত/শ্রেণি নির্বাচন আবশ্যক।" },
        { status: 400 }
      );
    }

    if (user.role === "ADMIN" || user.role === "PRINCIPAL") {
      const subjects = await prisma.subject.findMany({
        where: { classId, isActive: true },
        orderBy: [{ sortOrder: "asc" }, { nameBn: "asc" }],
      });
      return NextResponse.json({ success: true, subjects });
    }

    // Teacher Role: check teacher assignment
    const assignments = await prisma.teacherAssignment.findMany({
      where: {
        teacherId: user.userId,
        classId,
      },
      select: {
        subjectId: true,
      },
    });

    if (assignments.length === 0) {
      return NextResponse.json(
        { error: "অননুমোদিত জামাত: আপনি এই জামাত বা বিষয়ের জন্য অ্যাসাইনকৃত শিক্ষক নন।" },
        { status: 403 }
      );
    }

    // Check if teacher has full class assignment (subjectId is null)
    const hasFullClassAssignment = assignments.some((a) => a.subjectId === null);
    const assignedSubjectIds = assignments
      .map((a) => a.subjectId)
      .filter((s): s is string => Boolean(s));

    const subjects = await prisma.subject.findMany({
      where: {
        classId,
        isActive: true,
        ...(hasFullClassAssignment ? {} : { id: { in: assignedSubjectIds } }),
      },
      orderBy: [{ sortOrder: "asc" }, { nameBn: "asc" }],
    });

    return NextResponse.json({ success: true, subjects });
  } catch (error: any) {
    console.error("GET /api/teacher/subjects error:", error);
    return NextResponse.json({ error: "বিষয় তালিকা লোড করতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
