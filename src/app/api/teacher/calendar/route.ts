import { NextRequest, NextResponse } from "next/server";
import { getUnifiedCalendar } from "@/lib/calendar/unifiedCalendarProjection";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/teacher/calendar
 * Teacher academic calendar & institutional schedule.
 * Scoped to teacher assignments, meetings, exam schedules, and institutional holidays.
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
    const now = new Date();
    const currentYear = now.getFullYear();

    const defaultStart = new Date(currentYear, 0, 1).toISOString();
    const defaultEnd = new Date(currentYear, 11, 31, 23, 59, 59).toISOString();

    const startDate = searchParams.get("start") || defaultStart;
    const endDate = searchParams.get("end") || defaultEnd;
    const filterType = searchParams.get("type"); // HOLIDAY, EXAM, MEETING, EVENT

    // Find teacher assigned class IDs
    const assignments = await prisma.teacherAssignment.findMany({
      where: { teacherId: user.userId },
      select: { classId: true },
    });
    const classId = assignments.length > 0 ? assignments[0].classId : undefined;

    // Call unified calendar projection
    const allEvents = await getUnifiedCalendar({
      startDate,
      endDate,
      userRole: "TEACHER",
      userId: user.userId,
      classId,
      includeRoutineOccurrences: false, // Routine has its own dedicated tab
    });

    let filteredEvents = allEvents;
    if (filterType && filterType !== "ALL") {
      filteredEvents = allEvents.filter((e) => {
        if (filterType === "HOLIDAY") return e.eventType === "INSTITUTIONAL" || e.id.includes("HOL");
        if (filterType === "EXAM") return e.eventType === "EXAMINATION" || e.id.includes("EXAM");
        if (filterType === "MEETING") return e.eventType === "MEETING";
        if (filterType === "EVENT") return e.eventType === "EVENT";
        return true;
      });
    }

    const todayStr = now.toISOString().split("T")[0];
    const upcomingEvents = allEvents
      .filter((e) => e.startAt >= todayStr)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .slice(0, 8);

    const holidays = allEvents
      .filter((e) => e.eventType === "INSTITUTIONAL" || e.id.includes("HOL"))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    return NextResponse.json({
      success: true,
      currentYear,
      totalCount: filteredEvents.length,
      events: filteredEvents,
      upcomingEvents,
      holidays,
    });
  } catch (error: any) {
    console.error("GET /api/teacher/calendar error:", error);
    return NextResponse.json(
      { error: error.message || "ক্যালেন্ডার তথ্য লোড করতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
