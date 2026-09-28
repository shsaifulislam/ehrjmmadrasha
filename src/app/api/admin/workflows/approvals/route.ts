import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  loadApprovalRequests,
  resolveApprovalRequest,
  sweepExpiredApprovals,
  getApprovalMetrics,
  resumeWorkflowAfterApproval,
} from "@/lib/workflow";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। অ্যাডমিন বা অধ্যক্ষের অনুমোদন প্রয়োজন।" },
        { status: 403 }
      );
    }

    // Sweep any expired requests
    sweepExpiredApprovals();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let requests = loadApprovalRequests();
    if (status) {
      requests = requests.filter((r) => r.status === status);
    }

    const metrics = getApprovalMetrics();

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        requests,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve approval requests" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। অ্যাডমিন বা অধ্যক্ষের অনুমোদন প্রয়োজন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { requestId, decision, decisionReason } = body;

    if (!requestId || !decision || !["APPROVED", "REJECTED"].includes(decision)) {
      return NextResponse.json(
        { error: "রিকুয়েস্ট আইডি এবং সঠিক সিদ্ধান্ত (APPROVED বা REJECTED) আবশ্যক।" },
        { status: 400 }
      );
    }

    if (!decisionReason || decisionReason.trim().length < 5) {
      return NextResponse.json(
        { error: "অনুমোদন বা প্রত্যাখ্যানের কারণ সুনির্দিষ্টভাবে উল্লেখ করা বাধ্যতামূলক।" },
        { status: 400 }
      );
    }

    const resolved = resolveApprovalRequest({
      requestId,
      decision,
      decidedBy: {
        userId: user.userId,
        role: user.role,
        name: user.name,
      },
      decisionReason,
    });

    // If approved, resume the waiting workflow instance
    let resumedInstance = null;
    if (decision === "APPROVED") {
      resumedInstance = await resumeWorkflowAfterApproval(requestId);
    }

    return NextResponse.json({
      success: true,
      message: `অনুমোদন রিকুয়েস্ট ${requestId} সফলভাবে ${decision === "APPROVED" ? "অনুমোদিত" : "প্রত্যাখ্যাত"} হয়েছে।`,
      data: {
        approval: resolved,
        resumedWorkflow: resumedInstance,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to resolve approval request" },
      { status: 400 }
    );
  }
}
