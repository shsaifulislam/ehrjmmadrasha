import { NextRequest, NextResponse } from "next/server";
import {
  getClassRoutineSlots,
  saveClassRoutineSlots,
  appendCalendarAuditLog,
} from "@/lib/calendar/calendarStore";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const actorId = searchParams.get("actorId") || "admin";

    const slots = getClassRoutineSlots();
    const index = slots.findIndex((s) => s.id === params.id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "রুটিন স্লটটি পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    const removed = slots[index];
    // Mark as inactive rather than hard-delete for auditing integrity
    slots[index].status = "INACTIVE";
    slots[index].updatedAt = new Date().toISOString();

    saveClassRoutineSlots(slots);

    appendCalendarAuditLog({
      action: "DELETE_ROUTINE",
      entityType: "ROUTINE",
      entityId: params.id,
      actorId,
      actorRole: "ADMIN",
      details: `রুটিন স্লট নিষ্ক্রিয় করা হয়েছে: ${removed.classNameBn} - ${removed.subjectNameBn} (${removed.teacherName})`,
    });

    return NextResponse.json({
      success: true,
      message: "রুটিন স্লট সফলভাবে সরানো হয়েছে",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
