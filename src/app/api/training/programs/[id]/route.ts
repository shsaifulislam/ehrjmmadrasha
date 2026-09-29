import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getTrainingProgramById,
  saveTrainingProgram,
  getSanitizedAssessment,
  recordTrainingAudit,
} from "@/lib/training";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    const program = getTrainingProgramById(id);

    if (!program) {
      return NextResponse.json(
        { success: false, error: "Training program not found" },
        { status: 404 }
      );
    }

    const isAdmin = user?.role === "ADMIN" || user?.role === "PRINCIPAL";

    // Non-admin gets sanitized assessment without correct answer keys
    let responseProgram = { ...program };
    if (!isAdmin && program.assessment) {
      const sanitized = getSanitizedAssessment(id);
      responseProgram.assessment = sanitized || undefined;
    }

    return NextResponse.json({
      success: true,
      program: responseProgram,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch program" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin access required." },
        { status: 403 }
      );
    }

    const program = getTrainingProgramById(id);
    if (!program) {
      return NextResponse.json(
        { success: false, error: "Training program not found" },
        { status: 404 }
      );
    }

    const updates = await req.json();

    const updated = {
      ...program,
      ...updates,
      id: program.id, // Immutable ID
      trainingCode: program.trainingCode,
      updatedBy: user.username || "Admin",
      updatedAt: new Date().toISOString(),
      currentVersion: program.currentVersion + 1,
    };

    saveTrainingProgram(updated);

    recordTrainingAudit({
      trainingProgramId: program.id,
      action: "UPDATE_PROGRAM",
      actorId: user.userId,
      actorName: user.username || "Admin",
      actorRole: user.role,
      notes: `Updated training program fields. Version incremented to v${updated.currentVersion}`,
      details: { updatedKeys: Object.keys(updates) },
    });

    return NextResponse.json({
      success: true,
      message: "প্রশিক্ষণ তথ্য সফলভাবে আপডেট করা হয়েছে।",
      program: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update program" },
      { status: 500 }
    );
  }
}
