import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { enrollParticipant, getTrainingProgramById } from "@/lib/training";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const program = getTrainingProgramById(id);
    if (!program) {
      return NextResponse.json(
        { success: false, error: "Training program not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const isAdmin = user.role === "ADMIN" || user.role === "PRINCIPAL";

    // If teacher/staff is self-registering
    let participantEmployeeId = body.employeeId || user.userId;
    let participantName = body.employeeName || user.username || "Participant";
    let designation = body.designation || "শিক্ষক";
    let department = body.department || "একাডেমিক";
    let isAssignment = false;

    if (isAdmin && body.isAssignment) {
      isAssignment = true;
      if (!body.employeeId || !body.employeeName) {
        return NextResponse.json(
          { success: false, error: "কর্মীর আইডি ও নাম আবশ্যক।" },
          { status: 400 }
        );
      }
      participantEmployeeId = body.employeeId;
      participantName = body.employeeName;
      designation = body.designation || "শিক্ষক";
      department = body.department || "একাডেমিক";
    } else {
      // Self registration requires program to be in REGISTRATION_OPEN or PUBLISHED
      if (program.status !== "REGISTRATION_OPEN" && program.status !== "PUBLISHED") {
        return NextResponse.json(
          { success: false, error: "বর্তমানে এই প্রশিক্ষণে রেজিস্ট্রেশন উন্মুক্ত নয়।" },
          { status: 400 }
        );
      }
    }

    const actor = {
      actorId: user.userId,
      actorName: user.username || "User",
      actorRole: user.role,
    };

    const result = enrollParticipant(
      id,
      {
        employeeId: participantEmployeeId,
        employeeName: participantName,
        designation,
        department,
        userRole: user.role,
      },
      {
        isAssignment,
        dueDate: body.dueDate,
        notes: body.notes,
      },
      actor
    );

    return NextResponse.json({
      success: result.success,
      status: result.status,
      message: result.message,
      enrollment: result.enrollment,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process enrollment" },
      { status: 500 }
    );
  }
}
