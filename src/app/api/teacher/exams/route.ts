import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/teacher/exams
 * Scoped examinations endpoint for Teachers.
 * Strict server-side authorization: Teachers can only view exams relevant to their assigned classes/sessions.
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
    const sessionId = searchParams.get("sessionId");

    if (user.role === "ADMIN" || user.role === "PRINCIPAL") {
      const exams = await prisma.exam.findMany({
        where: sessionId ? { sessionId } : {},
        orderBy: { startDate: "desc" },
        include: {
          session: { select: { id: true, name: true, isCurrent: true, status: true } },
          examTypeRef: { select: { id: true, code: true, nameBn: true, nameEn: true } },
        },
      });
      return NextResponse.json({ success: true, exams });
    }

    // Teacher role: find sessions teacher is assigned to
    const assignments = await prisma.teacherAssignment.findMany({
      where: { teacherId: user.userId },
      select: { sessionId: true, classId: true },
    });

    if (assignments.length === 0) {
      return NextResponse.json({ success: true, exams: [] });
    }

    const teacherSessionIds = Array.from(new Set(assignments.map((a) => a.sessionId)));

    const exams = await prisma.exam.findMany({
      where: {
        sessionId: sessionId && teacherSessionIds.includes(sessionId) ? sessionId : { in: teacherSessionIds },
        status: { in: ["ACTIVE", "PUBLISHED", "UPCOMING", "ONGOING", "DRAFT"] },
      },
      orderBy: { startDate: "desc" },
      include: {
        session: { select: { id: true, name: true, isCurrent: true, status: true } },
        examTypeRef: { select: { id: true, code: true, nameBn: true, nameEn: true } },
      },
    });

    return NextResponse.json({ success: true, exams });
  } catch (error: any) {
    console.error("GET /api/teacher/exams error:", error);
    return NextResponse.json({ error: "পরীক্ষা তালিকা লোড করতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
