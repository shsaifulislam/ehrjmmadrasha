import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getMasterGovernanceSummary,
  registerChangeRequest,
  reviewChangeRequest,
  updateChangeImplementation,
  verifyChangeRequest,
  registerTechnicalDebt,
} from "@/lib/governanceEngine";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/governance
 * Returns master governance summary (Change requests, Data Quality, Metrics, Debt, Access review).
 * Authorized: ADMIN & PRINCIPAL (read-only).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন ও প্রিন্সিপাল এই তথ্য দেখতে পারেন।" },
        { status: 403 }
      );
    }

    const summary = await getMasterGovernanceSummary();
    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    console.error("Governance Summary Error:", error);
    return NextResponse.json(
      { error: error.message || "গভর্ন্যান্স সামারি লোড করতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/governance
 * Action dispatcher for Change Management and Technical Debt operations.
 * Authorized: ADMIN only.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন গভর্ন্যান্স পরিবর্তন পরিচালনা করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "REGISTER_CHANGE": {
        const result = await registerChangeRequest({
          title: body.title,
          requesterName: body.requesterName || user.name,
          requesterRole: body.requesterRole || user.role,
          objective: body.objective,
          businessJustification: body.businessJustification,
          affectedModules: body.affectedModules || [],
          changeType: body.changeType || "ENHANCEMENT",
          priority: body.priority || "MEDIUM",
          databaseImpact: Boolean(body.databaseImpact),
          rollbackPlan: body.rollbackPlan || "Revert commit and deploy previous build.",
          adminUserId: user.userId,
        });
        return NextResponse.json({ success: true, changeRequest: result });
      }

      case "REVIEW_CHANGE": {
        const result = await reviewChangeRequest({
          changeId: body.changeId,
          reviewerName: user.name,
          decision: body.decision, // "APPROVED" | "REJECTED"
          reviewNotes: body.reviewNotes,
          adminUserId: user.userId,
        });
        return NextResponse.json({ success: true, changeRequest: result });
      }

      case "UPDATE_IMPLEMENTATION": {
        const result = await updateChangeImplementation({
          changeId: body.changeId,
          commitHash: body.commitHash,
          implementationDetails: body.implementationDetails,
        });
        return NextResponse.json({ success: true, changeRequest: result });
      }

      case "VERIFY_CHANGE": {
        const result = await verifyChangeRequest({
          changeId: body.changeId,
          verifierName: user.name,
          verificationEvidence: body.verificationEvidence,
        });
        return NextResponse.json({ success: true, changeRequest: result });
      }

      case "REGISTER_DEBT": {
        const result = registerTechnicalDebt({
          module: body.module,
          title: body.title,
          risk: body.risk || "MEDIUM",
          impact: body.impact,
          workaround: body.workaround,
          priority: body.priority || "MEDIUM",
          plannedResolution: body.plannedResolution,
          status: body.status || "OPEN",
        });
        return NextResponse.json({ success: true, technicalDebtItem: result });
      }

      default:
        return NextResponse.json({ error: `অজানা গভর্ন্যান্স অ্যাকশন: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Governance Action Error:", error);
    return NextResponse.json(
      { error: error.message || "গভর্ন্যান্স কার্যক্রম সম্পাদনে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
