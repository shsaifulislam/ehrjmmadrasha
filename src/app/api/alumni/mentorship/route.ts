import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getActiveAlumniMentors,
  getMentorshipRequestsForAlumni,
  getMentorshipRequestsForStudent,
  registerAlumniMentor,
  updateAlumniMentorAvailability,
  requestMentorshipConnection,
  reviewMentorshipRequest,
  completeMentorshipSession,
} from "@/lib/alumni";

export const dynamic = "force-dynamic";

/**
 * GET /api/alumni/mentorship
 * Retrieve active mentors, or mentorship requests for specific student or alumnus.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get("topic") || undefined;
    const alumniId = searchParams.get("alumniId");
    const studentId = searchParams.get("studentId");

    const mentors = getActiveAlumniMentors(topic);

    let alumniRequests: any[] = [];
    if (alumniId) {
      alumniRequests = getMentorshipRequestsForAlumni(alumniId);
    }

    let studentRequests: any[] = [];
    if (studentId) {
      studentRequests = getMentorshipRequestsForStudent(studentId);
    }

    return NextResponse.json({
      success: true,
      mentors,
      alumniRequests,
      studentRequests,
    });
  } catch (error: any) {
    console.error("[API /api/alumni/mentorship] GET Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load mentorship directory" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/alumni/mentorship
 * Action dispatcher for mentor registration, student request, and administrative approval.
 * Invariant: No open direct chat. Connections are vetted and institutionally facilitated.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    const body = await request.json();
    const action = body.action || "REQUEST";

    // 1. Mentor registration
    if (action === "REGISTER_MENTOR") {
      const { alumniId, expertiseTopics, maxMentees, preferredMode, linkedinUrl, bio } = body;
      if (!alumniId || !expertiseTopics || !Array.isArray(expertiseTopics)) {
        return NextResponse.json(
          { success: false, error: "alumniId and expertiseTopics array are required." },
          { status: 400 }
        );
      }

      const mentor = registerAlumniMentor(
        alumniId,
        expertiseTopics,
        maxMentees || 3,
        preferredMode || "ONLINE",
        linkedinUrl,
        bio,
        session?.userId || alumniId
      );

      return NextResponse.json({
        success: true,
        data: mentor,
        message: "Alumni mentor profile registered successfully.",
      });
    }

    // 2. Student mentorship request
    if (action === "REQUEST" || action === "REQUEST_MENTORSHIP") {
      const { studentId, mentorAlumniId, topic, goalsNote, preferredSchedule } = body;
      if (!studentId || !mentorAlumniId || !topic || !goalsNote) {
        return NextResponse.json(
          { success: false, error: "studentId, mentorAlumniId, topic, and goalsNote are required." },
          { status: 400 }
        );
      }

      const mentorshipReq = requestMentorshipConnection(
        studentId,
        mentorAlumniId,
        topic,
        goalsNote,
        preferredSchedule,
        session?.userId || studentId
      );

      return NextResponse.json({
        success: true,
        data: mentorshipReq,
        message: "Mentorship request submitted. Under institutional administrative review.",
      });
    }

    // 3. Admin review mentorship request
    if (action === "REVIEW_REQUEST") {
      if (
        !session ||
        (session.role !== "ADMIN" &&
          session.role !== "PRINCIPAL" &&
          session.role !== "STAFF")
      ) {
        return NextResponse.json(
          { success: false, error: "Unauthorized: Admin privileges required." },
          { status: 403 }
        );
      }

      const { requestId, decision, rejectionReason, facilitationNotes } = body;
      if (!requestId || !decision) {
        return NextResponse.json(
          { success: false, error: "requestId and decision are required." },
          { status: 400 }
        );
      }

      const updated = reviewMentorshipRequest(
        requestId,
        decision,
        session.userId,
        rejectionReason,
        facilitationNotes
      );

      return NextResponse.json({
        success: true,
        data: updated,
        message: `Mentorship request ${decision.toLowerCase()}.`,
      });
    }

    // 4. Complete session
    if (action === "COMPLETE_SESSION") {
      const { requestId, outcomeNotes } = body;
      if (!requestId) {
        return NextResponse.json(
          { success: false, error: "requestId is required." },
          { status: 400 }
        );
      }

      const updated = completeMentorshipSession(
        requestId,
        session?.userId || "MENTOR",
        outcomeNotes
      );

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Mentorship session completed.",
      });
    }

    return NextResponse.json(
      { success: false, error: `Unsupported action: ${action}` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API /api/alumni/mentorship] POST Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process mentorship action" },
      { status: 400 }
    );
  }
}
