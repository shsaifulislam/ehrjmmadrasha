import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getAlumniProfiles,
  getAlumniGroupMemberships,
  getActiveAlumniGroups,
  getAlumniVolunteerApplications,
  getActiveVolunteerOpportunities,
  getMentorshipRequestsForAlumni,
  getAlumniContributions,
  getAlumniContributionsSummary,
  updateSelfReportedProfile,
} from "@/lib/alumni";

export const dynamic = "force-dynamic";

/**
 * GET /api/portal/alumni
 * Returns aggregate portal view for authenticated alumni member.
 * Matches logged-in session by userId or studentId.
 */
export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const profiles = getAlumniProfiles();
    // Match by userId, studentId, or email
    const profile = profiles.find(
      (p) =>
        (session.userId && p.userId === session.userId) ||
        (session.username && (p.studentId === session.username || p.studentIdNumber === session.username)) ||
        (session.email && p.email?.toLowerCase() === session.email.toLowerCase())
    );

    if (!profile) {
      return NextResponse.json({
        success: true,
        isRegistered: false,
        message: "No alumni profile found for current user account.",
      });
    }

    const userMemberships = getAlumniGroupMemberships(profile.id);
    const allGroups = getActiveAlumniGroups();
    const volunteerApplications = getAlumniVolunteerApplications(profile.id);
    const volunteerOpportunities = getActiveVolunteerOpportunities();
    const mentorshipRequests = getMentorshipRequestsForAlumni(profile.id);
    const contributions = getAlumniContributions(profile.id);
    const contributionsSummary = getAlumniContributionsSummary(profile.id);

    return NextResponse.json({
      success: true,
      isRegistered: true,
      profile,
      groups: {
        all: allGroups,
        joined: userMemberships,
      },
      volunteering: {
        opportunities: volunteerOpportunities,
        applications: volunteerApplications,
      },
      mentorship: {
        requests: mentorshipRequests,
      },
      contributions: {
        list: contributions,
        summary: contributionsSummary,
      },
    });
  } catch (error: any) {
    console.error("[API /api/portal/alumni] GET Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load alumni portal data" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/portal/alumni
 * Self-service update for the logged-in alumnus.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const profiles = getAlumniProfiles();
    const profile = profiles.find(
      (p) =>
        (session.userId && p.userId === session.userId) ||
        (session.username && (p.studentId === session.username || p.studentIdNumber === session.username)) ||
        (session.email && p.email?.toLowerCase() === session.email.toLowerCase())
    );

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Alumni profile not found for this user." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updated = updateSelfReportedProfile(profile.id, body, session.userId);

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Alumni portal profile updated successfully.",
    });
  } catch (error: any) {
    console.error("[API /api/portal/alumni] PATCH Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update profile" },
      { status: 400 }
    );
  }
}
