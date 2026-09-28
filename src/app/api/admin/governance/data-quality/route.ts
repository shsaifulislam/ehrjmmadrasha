import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { runDataQualityAudit } from "@/lib/governanceEngine";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/governance/data-quality
 * Executes a full live audit across students, guardians, enrollments, fee invoices, and cash funds.
 * Authorized: ADMIN & PRINCIPAL.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। ডেটা কোয়ালিটি নিরীক্ষার জন্য অনুমতি নেই।" },
        { status: 403 }
      );
    }

    const report = await runDataQualityAudit();

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error("Data Quality Audit Error:", error);
    return NextResponse.json(
      { error: error.message || "ডেটা কোয়ালিটি অডিট চালাতে ত্রুটি হয়েছে।" },
      { status: 500 }
    );
  }
}
