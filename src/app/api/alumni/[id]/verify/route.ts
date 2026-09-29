import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  verifyAlumniProfile,
  rejectAlumniProfile,
  setAlumniOptOut,
  archiveAlumniProfile,
  getAlumniProfileById,
} from "@/lib/alumni";

export const dynamic = "force-dynamic";

/**
 * POST /api/alumni/[id]/verify
 * Admin action dispatcher for Alumni verification lifecycle.
 * Actions:
 *  - "VERIFY": Verify profile with optional notes and studentId cross-check.
 *  - "REJECT": Reject unverified profile with reason.
 *  - "OPT_OUT": Mark profile as opted-out (removed from public directory).
 *  - "ARCHIVE": Archive profile.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionUser();

    // Verify authorized role
    if (
      !session ||
      (session.role !== "ADMIN" &&
        session.role !== "PRINCIPAL" &&
        session.role !== "STAFF")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Administrator or Staff privileges required.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const action = body.action || "VERIFY";
    const verificationNotes = body.notes || body.verificationNotes || "";

    const profile = getAlumniProfileById(id);
    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Alumni profile not found" },
        { status: 404 }
      );
    }

    let updated;
    switch (action) {
      case "VERIFY":
        updated = await verifyAlumniProfile(
          id,
          session.userId,
          verificationNotes,
          body.isLegacy || false,
          body.legacySourceNote
        );
        break;

      case "REJECT":
        updated = rejectAlumniProfile(id, session.userId, verificationNotes);
        break;

      case "OPT_OUT":
        updated = setAlumniOptOut(id, session.userId, verificationNotes);
        break;

      case "ARCHIVE":
        updated = archiveAlumniProfile(id, session.userId, verificationNotes);
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Invalid action '${action}'. Expected VERIFY, REJECT, OPT_OUT, or ARCHIVE.`,
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Profile status updated to ${updated.status}.`,
    });
  } catch (error: any) {
    console.error("[API /api/alumni/[id]/verify] POST Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process alumni verification" },
      { status: 400 }
    );
  }
}
