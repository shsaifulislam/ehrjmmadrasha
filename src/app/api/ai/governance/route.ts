import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getAIFeatureFlags,
  toggleAIFeatureFlags,
  listAIUsage,
  listPendingHumanReviews,
  listAllHumanReviews,
} from "@/lib/ai/aiGovernance";
import { detectFinancialAnomalies } from "@/lib/ai/aiEngine";

export const dynamic = "force-dynamic";

/**
 * GET /api/ai/governance
 * Returns AI status, feature flags, usage history, and pending human review items.
 * Authorized: ADMIN & PRINCIPAL.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন ও প্রিন্সিপাল AI গভর্ন্যান্স দেখতে পারেন।" },
        { status: 403 }
      );
    }

    const flags = getAIFeatureFlags();
    const usage = listAIUsage(20);
    const pendingReviews = listPendingHumanReviews();
    const financialAnomalies = await detectFinancialAnomalies();

    return NextResponse.json({
      success: true,
      data: {
        flags,
        usage,
        pendingReviews,
        financialAnomalies,
      },
    });
  } catch (error: any) {
    console.error("AI Governance Error:", error);
    return NextResponse.json(
      { error: error.message || "AI গভর্ন্যান্স লোড করতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/governance
 * Toggles AI feature flags or emergency master kill-switch.
 * Authorized: ADMIN only.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন AI ফ্ল্যাগ পরিবর্তন করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { flags, reason } = body;

    const updated = await toggleAIFeatureFlags(flags, user.userId, reason);

    return NextResponse.json({
      success: true,
      flags: updated,
    });
  } catch (error: any) {
    console.error("AI Toggle Error:", error);
    return NextResponse.json(
      { error: error.message || "AI ফ্ল্যাগ পরিবর্তনে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
