import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getActiveVolunteerOpportunities,
  getAlumniVolunteerApplications,
  applyForVolunteerOpportunity,
  reviewVolunteerApplication,
  recordVolunteerServiceHours,
  createVolunteerOpportunity,
} from "@/lib/alumni";

export const dynamic = "force-dynamic";

/**
 * GET /api/alumni/volunteering
 * List volunteer opportunities and applications.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const alumniId = searchParams.get("alumniId");

    const opportunities = getActiveVolunteerOpportunities();
    let applications: any[] = [];
    if (alumniId) {
      applications = getAlumniVolunteerApplications(alumniId);
    }

    return NextResponse.json({
      success: true,
      opportunities,
      applications,
    });
  } catch (error: any) {
    console.error("[API /api/alumni/volunteering] GET Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load volunteering data" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/alumni/volunteering
 * Application, review, hours logging, and opportunity creation.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    const body = await request.json();
    const action = body.action || "APPLY";

    if (action === "APPLY") {
      const { alumniId, opportunityId, statementOfIntent, availabilityNote } = body;
      if (!alumniId || !opportunityId) {
        return NextResponse.json(
          { success: false, error: "alumniId and opportunityId are required." },
          { status: 400 }
        );
      }

      const application = applyForVolunteerOpportunity(
        alumniId,
        opportunityId,
        statementOfIntent || "",
        availabilityNote || "",
        session?.userId || alumniId
      );

      return NextResponse.json({
        success: true,
        data: application,
        message: "Volunteer application submitted successfully.",
      });
    }

    // Admin protected actions
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

    if (action === "REVIEW") {
      const { applicationId, decision, reviewNotes } = body;
      if (!applicationId || !decision) {
        return NextResponse.json(
          { success: false, error: "applicationId and decision are required." },
          { status: 400 }
        );
      }

      const updated = reviewVolunteerApplication(
        applicationId,
        decision,
        session.userId,
        reviewNotes
      );

      return NextResponse.json({
        success: true,
        data: updated,
        message: `Application ${decision.toLowerCase()}.`,
      });
    }

    if (action === "RECORD_HOURS") {
      const { applicationId, hoursServed, feedbackNotes } = body;
      if (!applicationId || hoursServed === undefined) {
        return NextResponse.json(
          { success: false, error: "applicationId and hoursServed are required." },
          { status: 400 }
        );
      }

      const updated = recordVolunteerServiceHours(
        applicationId,
        Number(hoursServed),
        session.userId,
        feedbackNotes
      );

      return NextResponse.json({
        success: true,
        data: updated,
        message: `Recorded ${hoursServed} volunteer hours.`,
      });
    }

    if (action === "CREATE_OPPORTUNITY") {
      const { titleBn, titleEn, descriptionBn, descriptionEn, category, eventId, maxVolunteers, startDate, endDate } = body;
      if (!titleBn || !titleEn || !category) {
        return NextResponse.json(
          { success: false, error: "titleBn, titleEn, and category are required." },
          { status: 400 }
        );
      }

      const opportunity = createVolunteerOpportunity(
        {
          titleBn,
          titleEn,
          descriptionBn: descriptionBn || "",
          descriptionEn: descriptionEn || "",
          category,
          eventId,
          maxVolunteers: maxVolunteers ? Number(maxVolunteers) : 10,
          startDate: startDate || new Date().toISOString(),
          endDate: endDate || new Date().toISOString(),
          status: "OPEN",
        },
        session.userId
      );

      return NextResponse.json({
        success: true,
        data: opportunity,
        message: "Volunteer opportunity created.",
      });
    }

    return NextResponse.json(
      { success: false, error: `Unsupported action: ${action}` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API /api/alumni/volunteering] POST Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process volunteering action" },
      { status: 400 }
    );
  }
}
