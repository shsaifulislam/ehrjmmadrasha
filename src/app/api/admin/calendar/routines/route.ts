import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import {
  getClassRoutineSlots,
  saveClassRoutineSlots,
  appendCalendarAuditLog,
} from "@/lib/calendar/calendarStore";
import { validateRoutineSlotConflicts } from "@/lib/calendar/conflictEngine";
import { ClassRoutineSlot } from "@/lib/calendar/types";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request, ["ADMIN", "PRINCIPAL", "TEACHER"]);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const sectionId = searchParams.get("sectionId");
    const teacherId = searchParams.get("teacherId");

    let slots = getClassRoutineSlots().filter((s) => s.status === "ACTIVE");

    if (auth.user?.role === "TEACHER") {
      // Teacher-scoped routine filtering: show assigned routines for this teacher
      if (teacherId) {
        slots = slots.filter((s) => s.teacherId === teacherId);
      } else {
        const teacherAssignedSlots = slots.filter(
          (s) =>
            s.teacherId === auth.user?.userId ||
            (auth.user?.name && s.teacherName?.toLowerCase() === auth.user.name.toLowerCase())
        );
        // If specific assigned slots exist, return them; otherwise return all active class routines
        if (teacherAssignedSlots.length > 0) {
          slots = teacherAssignedSlots;
        }
      }
    } else {
      if (classId) {
        slots = slots.filter((s) => s.classId === classId);
      }
      if (sectionId) {
        slots = slots.filter((s) => s.sectionId === sectionId);
      }
      if (teacherId) {
        slots = slots.filter((s) => s.teacherId === teacherId);
      }
    }

    // Sort by dayOfWeek and startTime
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
    console.error("[API /api/admin/calendar/routines] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load routines" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminAuth(request);
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const {
      sessionId,
      classId,
      classNameBn,
      sectionId,
      sectionNameBn,
      subjectId,
      subjectNameBn,
      teacherId,
      teacherName,
      dayOfWeek,
      startTime,
      endTime,
      roomNo,
      actorId,
      actorRole,
    } = body;

    if (
      !classId ||
      !subjectId ||
      !teacherId ||
      dayOfWeek === undefined ||
      !startTime ||
      !endTime
    ) {
      return NextResponse.json(
        { success: false, error: "শ্রেণি, বিষয়, শিক্ষক, বার এবং সময়সূচি আবশ্যক।" },
        { status: 400 }
      );
    }

    const candidate: Partial<ClassRoutineSlot> = {
      sessionId: sessionId || "CURRENT_SESSION",
      classId,
      classNameBn: classNameBn || "শ্রেণি",
      sectionId: sectionId || undefined,
      sectionNameBn: sectionNameBn || undefined,
      subjectId,
      subjectNameBn: subjectNameBn || "বিষয়",
      teacherId,
      teacherName: teacherName || "উস্তাদ",
      dayOfWeek: Number(dayOfWeek),
      startTime,
      endTime,
      roomNo: roomNo || undefined,
      status: "ACTIVE",
    };

    // Run conflict engine
    const conflictResult = validateRoutineSlotConflicts(candidate);
    if (conflictResult.hasBlockingConflicts) {
      const errorMsg = conflictResult.conflicts
        .map((c) => c.messageBn)
        .join(" ");
      return NextResponse.json(
        {
          success: false,
          error: `রুটিন সংঘাত পাওয়া গেছে: ${errorMsg}`,
          conflicts: conflictResult.conflicts,
        },
        { status: 409 }
      );
    }

    const newSlot: ClassRoutineSlot = {
      id: `RTN-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      sessionId: candidate.sessionId!,
      classId: candidate.classId!,
      classNameBn: candidate.classNameBn!,
      sectionId: candidate.sectionId,
      sectionNameBn: candidate.sectionNameBn,
      subjectId: candidate.subjectId!,
      subjectNameBn: candidate.subjectNameBn!,
      teacherId: candidate.teacherId!,
      teacherName: candidate.teacherName!,
      dayOfWeek: candidate.dayOfWeek!,
      startTime: candidate.startTime!,
      endTime: candidate.endTime!,
      roomNo: candidate.roomNo,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const slots = getClassRoutineSlots();
    slots.push(newSlot);
    saveClassRoutineSlots(slots);

    appendCalendarAuditLog({
      action: "CREATE_ROUTINE",
      entityType: "ROUTINE",
      entityId: newSlot.id,
      actorId: actorId || "admin",
      actorRole: actorRole || "ADMIN",
      details: `ক্লাস রুটিন পিরিয়ড তৈরি: ${newSlot.classNameBn} - ${newSlot.subjectNameBn} (${newSlot.teacherName}, বার: ${newSlot.dayOfWeek}, ${newSlot.startTime}-${newSlot.endTime})`,
    });

    return NextResponse.json({
      success: true,
      message: "ক্লাস রুটিন সফলভাবে সংরক্ষিত হয়েছে",
      slot: newSlot,
    });
  } catch (error: any) {
    console.error("[API /api/admin/calendar/routines POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create routine slot" },
      { status: 500 }
    );
  }
}
