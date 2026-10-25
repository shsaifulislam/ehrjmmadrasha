import { NextRequest, NextResponse } from "next/server";
import { getUnifiedCalendar } from "@/lib/calendar/unifiedCalendarProjection";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/portal/calendar
 * Guardian portal academic calendar & holiday projection.
 * Scoped to guardian's linked children's classes and general institutional events.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। অনুগ্রহ করে লগইন করুন।" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const currentYear = now.getFullYear();

    // Default to the full academic year window
    const defaultStart = new Date(currentYear, 0, 1).toISOString();
    const defaultEnd = new Date(currentYear, 11, 31, 23, 59, 59).toISOString();

    const startDate = searchParams.get("start") || defaultStart;
    const endDate = searchParams.get("end") || defaultEnd;
    const filterType = searchParams.get("type"); // HOLIDAY, EXAM, MEETING, ACADEMIC

    // Find linked children if guardian
    let classIds: string[] = [];
    if (user.role === "GUARDIAN") {
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
                    select: { classId: true },
                  },
                },
              },
            },
          },
        },
      });

      if (guardian) {
        guardian.students.forEach((gs) => {
          gs.student.enrollments.forEach((en) => {
            if (en.classId && !classIds.includes(en.classId)) {
              classIds.push(en.classId);
            }
          });
        });
      }
    }

    // Call unified calendar projection engine
    const allEvents = await getUnifiedCalendar({
      startDate,
      endDate,
      userRole: "GUARDIAN",
      userId: user.userId,
      classId: classIds.length > 0 ? classIds[0] : undefined,
      includeRoutineOccurrences: false, // Don't clutter calendar with daily routine; routine has its own tab
    });

    // Apply type filter if requested
    let filteredEvents = allEvents;
    if (filterType && filterType !== "ALL") {
      filteredEvents = allEvents.filter((e) => {
        if (filterType === "HOLIDAY") return e.eventType === "INSTITUTIONAL" || e.id.includes("HOL");
        if (filterType === "EXAM") return e.eventType === "EXAMINATION" || e.id.includes("EXAM");
        if (filterType === "MEETING") return e.eventType === "MEETING";
        return true;
      });
    }

    // Segregate upcoming events (from today onwards)
    const todayStr = now.toISOString().split("T")[0];
    const upcomingEvents = allEvents
      .filter((e) => e.startAt >= todayStr)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .slice(0, 8);

    // Institutional holidays list for easy quick glance
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
    console.error("GET /api/portal/calendar error:", error);
    return NextResponse.json(
      { error: error.message || "ক্যালেন্ডার তথ্য লোড করতে ব্যর্থ।" },
      { status: 500 }
    );
  }
}
