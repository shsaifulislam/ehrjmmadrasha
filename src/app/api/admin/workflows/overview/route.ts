import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getWorkflowMetrics,
  getJobQueueMetrics,
  getApprovalMetrics,
  loadBusinessRules,
  loadDomainEvents,
  loadWorkflowInstances,
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

    const workflowMetrics = getWorkflowMetrics();
    const jobMetrics = getJobQueueMetrics();
    const approvalMetrics = getApprovalMetrics();
    const rules = loadBusinessRules();
    const events = loadDomainEvents();
    const instances = loadWorkflowInstances();

    return NextResponse.json({
      success: true,
      data: {
        workflows: workflowMetrics,
        jobs: jobMetrics,
        approvals: approvalMetrics,
        totalRules: rules.length,
        activeRules: rules.filter((r) => r.status === "ACTIVE").length,
        totalEventsEmitted: events.length,
        recentEvents: events.slice(-10).reverse(),
        recentInstances: instances.slice(-10).reverse(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve workflow overview" },
      { status: 500 }
    );
  }
}
