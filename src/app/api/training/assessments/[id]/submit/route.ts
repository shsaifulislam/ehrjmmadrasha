import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { submitAssessmentAttempt, getTrainingProgramById } from "@/lib/training";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // id is programId
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const program = getTrainingProgramById(id);
    if (!program || !program.assessment) {
      return NextResponse.json(
        { success: false, error: "Assessment not found for this program" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { answers } = body;

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { success: false, error: "উত্তরপত্র প্রদান করা হয়নি।" },
        { status: 400 }
      );
    }

    const actor = {
      actorId: user.userId,
      actorName: user.username || "User",
      actorRole: user.role,
    };

    const participant = {
      employeeId: body.employeeId || user.userId,
      employeeName: body.employeeName || user.username || "Participant",
    };

    const result = submitAssessmentAttempt(id, participant, answers, actor);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message:
        result.submission?.status === "PASSED"
          ? "মাশাআল্লাহ! আপনি মূল্যায়নে সফলভাবে উত্তীর্ণ হয়েছেন।"
          : result.submission?.status === "FAILED"
          ? "মূল্যায়ন সম্পন্ন হয়েছে। দুর্ভাগ্যবশত আপনি ন্যূনতম পাস মার্ক অর্জন করতে পারেননি।"
          : "মূল্যায়ন উত্তরপত্র সফলভাবে জমা হয়েছে, পর্যালোচনার অপেক্ষায় রয়েছে।",
      submission: result.submission,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit assessment" },
      { status: 500 }
    );
  }
}
