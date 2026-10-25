import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { getClassRoutineSlots } from "@/lib/calendar/calendarStore";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request, ["ADMIN", "PRINCIPAL", "TEACHER"]);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get("teacherId");
    const classId = searchParams.get("classId");

    let slots = getClassRoutineSlots().filter((s) => s.status === "ACTIVE");

    if (auth.user?.role === "TEACHER") {
      const targetId = teacherId || auth.user.userId;
      const filtered = slots.filter(
        (s) =>
          s.teacherId === targetId ||
          (auth.user?.name && s.teacherName?.toLowerCase() === auth.user.name.toLowerCase())
      );
      if (filtered.length > 0) {
        slots = filtered;
      }
    } else {
      if (teacherId) {
        slots = slots.filter((s) => s.teacherId === teacherId);
      }
      if (classId) {
        slots = slots.filter((s) => s.classId === classId);
      }
    }

    slots.sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      return a.startTime.localeCompare(b.startTime);
    });

    return NextResponse.json({
      success: true,
      count: slots.length,
      data: slots,
    });
  } catch (error: any) {
    console.error("[API /api/teacher/calendar/routines] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load routines" },
      { status: 500 }
    );
  }
}
