import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getAlumniProfileById,
  updateSelfReportedProfile,
  sanitizeAlumniProfileForPublic,
} from "@/lib/alumni";

export const dynamic = "force-dynamic";

/**
 * GET /api/alumni/[id]
 * Retrieve an alumni profile by ID.
 * Returns fully masked view if caller is not the profile owner or an administrator.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profile = getAlumniProfileById(id);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Alumni profile not found" },
        { status: 404 }
      );
    }

    const session = await getSessionUser();
    const isAdmin =
      session?.role === "ADMIN" ||
      session?.role === "PRINCIPAL" ||
      session?.role === "STAFF";
    const isOwner = session?.userId && (profile.userId === session.userId || profile.studentId === session.username);

    // If owner or admin, return full profile
    if (isAdmin || isOwner) {
      return NextResponse.json({
        success: true,
        data: profile,
        isOwner,
        isAdmin,
      });
    }

    // Public / masked profile
    const sanitized = sanitizeAlumniProfileForPublic(profile);
    return NextResponse.json({
      success: true,
      data: sanitized,
      isOwner: false,
      isAdmin: false,
    });
  } catch (error: any) {
    console.error("[API /api/alumni/[id]] GET Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load alumni profile" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/alumni/[id]
 * Self-service profile updates.
 * Updates self-reported fields (profession, org, location, bio, skills, privacy preferences).
 * Disallows tampering with authoritative historical academic fields (passOutYear, studentId, isVerified).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionUser();
    const profile = getAlumniProfileById(id);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Alumni profile not found" },
        { status: 404 }
      );
    }

    const isAdmin =
      session?.role === "ADMIN" ||
      session?.role === "PRINCIPAL" ||
      session?.role === "STAFF";
    const isOwner = session?.userId && (profile.userId === session.userId || profile.studentId === session.username);

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. You may only update your own alumni profile.",
        },
        { status: 403 }
      );
    }

    const updates = await request.json();
    const updated = updateSelfReportedProfile(
      id,
      updates,
      session?.userId || profile.userId || "SELF"
    );

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Profile updated successfully.",
    });
  } catch (error: any) {
    console.error("[API /api/alumni/[id]] PATCH Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update alumni profile" },
      { status: 400 }
    );
  }
}
