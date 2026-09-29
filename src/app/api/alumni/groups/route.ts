import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getActiveAlumniGroups,
  getAlumniGroupMemberships,
  requestJoinAlumniGroup,
  reviewAlumniGroupMembership,
  createAlumniGroup,
} from "@/lib/alumni";

export const dynamic = "force-dynamic";

/**
 * GET /api/alumni/groups
 * List alumni community groups and membership status.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const alumniId = searchParams.get("alumniId");

    const groups = getActiveAlumniGroups();

    let userMemberships: any[] = [];
    if (alumniId) {
      userMemberships = getAlumniGroupMemberships(alumniId);
    }

    return NextResponse.json({
      success: true,
      groups,
      userMemberships,
    });
  } catch (error: any) {
    console.error("[API /api/alumni/groups] GET Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load alumni groups" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/alumni/groups
 * Action dispatcher for group join requests, admin review, and group creation.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    const body = await request.json();
    const action = body.action || "JOIN";

    if (action === "JOIN") {
      const { alumniId, groupId, note } = body;
      if (!alumniId || !groupId) {
        return NextResponse.json(
          { success: false, error: "alumniId and groupId are required." },
          { status: 400 }
        );
      }

      const membership = requestJoinAlumniGroup(
        alumniId,
        groupId,
        note,
        session?.userId || alumniId
      );

      return NextResponse.json({
        success: true,
        data: membership,
        message: "Group join request submitted. Awaiting administrative approval.",
      });
    }

    if (action === "REVIEW_MEMBERSHIP") {
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

      const { membershipId, decision, rejectionReason } = body;
      if (!membershipId || !decision) {
        return NextResponse.json(
          { success: false, error: "membershipId and decision are required." },
          { status: 400 }
        );
      }

      const updated = reviewAlumniGroupMembership(
        membershipId,
        decision,
        session.userId,
        rejectionReason
      );

      return NextResponse.json({
        success: true,
        data: updated,
        message: `Group membership ${decision.toLowerCase()}.`,
      });
    }

    if (action === "CREATE") {
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

      const { code, nameBn, nameEn, descriptionBn, descriptionEn, type, batchYear, department, locationScope } = body;
      if (!code || !nameBn || !nameEn || !type) {
        return NextResponse.json(
          { success: false, error: "code, nameBn, nameEn, and type are required." },
          { status: 400 }
        );
      }

      const created = createAlumniGroup(
        {
          code,
          nameBn,
          nameEn,
          descriptionBn: descriptionBn || "",
          descriptionEn: descriptionEn || "",
          type,
          batchYear,
          department,
          locationScope,
        },
        session.userId
      );

      return NextResponse.json({
        success: true,
        data: created,
        message: "Alumni group created successfully.",
      });
    }

    return NextResponse.json(
      { success: false, error: `Unsupported action: ${action}` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API /api/alumni/groups] POST Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process group operation" },
      { status: 400 }
    );
  }
}
