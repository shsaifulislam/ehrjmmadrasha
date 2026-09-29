import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { transitionProgramStatus, TrainingStatus } from "@/lib/training";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin or Principal access required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { targetStatus, reason } = body as { targetStatus: TrainingStatus; reason?: string };

    if (!targetStatus) {
      return NextResponse.json(
        { success: false, error: "targetStatus is required." },
        { status: 400 }
      );
    }

    const actor = {
      actorId: user.userId,
      actorName: user.username || "Admin",
      actorRole: user.role,
    };

    const result = transitionProgramStatus(id, targetStatus, actor, reason);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `স্ট্যাটাস সফলভাবে পরিবর্তিত হয়ে ${targetStatus} হয়েছে।`,
      program: result.program,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to transition program status" },
      { status: 500 }
    );
  }
}
