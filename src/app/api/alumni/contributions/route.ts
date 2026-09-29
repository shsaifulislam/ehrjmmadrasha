import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getAlumniContributions,
  recordAlumniContribution,
  getAlumniContributionsSummary,
} from "@/lib/alumni";

export const dynamic = "force-dynamic";

/**
 * GET /api/alumni/contributions
 * View alumni contributions (financial & in-kind).
 * Non-admins see public/sanitized summaries or their own contributions.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const alumniId = searchParams.get("alumniId") || undefined;
    const session = await getSessionUser();

    const contributions = getAlumniContributions(alumniId);
    const summary = getAlumniContributionsSummary(alumniId);

    // If caller is not admin and not the contributor, filter confidential details
    const isAdmin =
      session?.role === "ADMIN" ||
      session?.role === "PRINCIPAL" ||
      session?.role === "STAFF";

    const sanitizedList = contributions.map((c) => {
      if (isAdmin || (session?.userId && c.alumniId === alumniId)) {
        return c;
      }
      // Public view
      return {
        id: c.id,
        alumniId: c.alumniId,
        type: c.type,
        fund: c.fund,
        amount: c.amount,
        currency: c.currency,
        contributionDate: c.contributionDate,
        purposeBn: c.purposeBn,
        isPubliclyVisible: c.isPubliclyVisible,
      };
    });

    return NextResponse.json({
      success: true,
      data: sanitizedList,
      summary,
    });
  } catch (error: any) {
    console.error("[API /api/alumni/contributions] GET Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load contributions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/alumni/contributions
 * Record an alumni contribution (financial or in-kind).
 * Connects directly to Phase 6 Finance funds. Does NOT create a separate payment engine.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    const body = await request.json();

    const {
      alumniId,
      type,
      fund,
      amount,
      currency,
      inKindDescription,
      purposeBn,
      purposeEn,
      isPubliclyVisible,
    } = body;

    if (!alumniId || !type) {
      return NextResponse.json(
        { success: false, error: "alumniId and type are required." },
        { status: 400 }
      );
    }

    if (type === "FINANCIAL" && (!fund || amount === undefined || amount <= 0)) {
      return NextResponse.json(
        {
          success: false,
          error: "For FINANCIAL contributions, a valid fund (GENERAL, LILLAH, ZAKAT, CONSTRUCTION, ORPHAN_SUPPORT) and positive amount are required.",
        },
        { status: 400 }
      );
    }

    const recorded = await recordAlumniContribution(
      {
        alumniId,
        type,
        fund,
        amount,
        currency,
        inKindDescription,
        purposeBn,
        purposeEn,
        isPubliclyVisible: isPubliclyVisible ?? true,
      },
      session?.userId || alumniId
    );

    return NextResponse.json({
      success: true,
      data: recorded,
      message: "Alumni contribution recorded and linked to finance ledger.",
    });
  } catch (error: any) {
    console.error("[API /api/alumni/contributions] POST Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record contribution" },
      { status: 400 }
    );
  }
}
