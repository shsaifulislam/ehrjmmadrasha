import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getAllTrainingPrograms,
  addOrUpdateSession,
  buildCalendarEventForSession,
} from "@/lib/training";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const programId = searchParams.get("programId");

    const programs = getAllTrainingPrograms();
    let sessions: any[] = [];

    if (programId) {
      const prog = programs.find((p) => p.id === programId);
      sessions = prog ? prog.sessions.map((s) => ({ ...s, programTitleBn: prog.titleBn })) : [];
    } else {
      for (const p of programs) {
        for (const s of p.sessions) {
          sessions.push({
            ...s,
            programTitleBn: p.titleBn,
            trainingCode: p.trainingCode,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      total: sessions.length,
      sessions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch training sessions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin access required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { programId, sessionData } = body;

    if (!programId || !sessionData || !sessionData.sessionDate || !sessionData.startTime || !sessionData.endTime) {
      return NextResponse.json(
        { success: false, error: "প্রোগ্রাম আইডি, তারিখ ও সময় আবশ্যক।" },
        { status: 400 }
      );
    }

    const actor = {
      actorId: user.userId,
      actorName: user.username || "Admin",
      actorRole: user.role,
    };

    const result = addOrUpdateSession(programId, sessionData, actor);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    // Sync payload for Phase 33 Calendar
    const prog = getAllTrainingPrograms().find((p) => p.id === programId);
    const calendarPayload = prog && result.session ? buildCalendarEventForSession(prog, result.session) : null;

    return NextResponse.json({
      success: true,
      message: "সেশন সফলভাবে সংরক্ষিত হয়েছে।",
      session: result.session,
      calendarPayload,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save session" },
      { status: 500 }
    );
  }
}
