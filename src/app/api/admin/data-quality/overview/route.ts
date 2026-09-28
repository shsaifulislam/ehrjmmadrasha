import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAllDataQualityIssues, AUTHORITATIVE_DOMAINS, DATA_QUALITY_RULES } from "@/lib/dataGovernanceEngine";
import { getAllDuplicateCandidates } from "@/lib/duplicateMergeEngine";
import { getLatestReconciliationReport } from "@/lib/reconciliationEngine";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। অ্যাডমিন বা অধ্যক্ষের অনুমোদন প্রয়োজন।" }, { status: 403 });
    }

    const issues = getAllDataQualityIssues();
    const openIssues = issues.filter(i => i.status === "OPEN" || i.status === "INVESTIGATING" || i.status === "ASSIGNED");
    const criticalCount = openIssues.filter(i => i.severity === "CRITICAL").length;
    const highCount = openIssues.filter(i => i.severity === "HIGH").length;
    const mediumCount = openIssues.filter(i => i.severity === "MEDIUM").length;
    const lowCount = openIssues.filter(i => i.severity === "LOW" || i.severity === "INFO").length;
    const resolvedCount = issues.filter(i => i.status === "RESOLVED").length;

    const duplicates = getAllDuplicateCandidates();
    const pendingDuplicates = duplicates.filter(d => d.status === "REVIEW_REQUIRED" || d.status === "CONFIRMED_DUPLICATE").length;

    const reconciliation = getLatestReconciliationReport();

    let healthStatus: "HEALTHY" | "WARNING" | "ERROR" | "REVIEW_REQUIRED" = "HEALTHY";
    if (criticalCount > 0) healthStatus = "ERROR";
    else if (highCount > 0) healthStatus = "REVIEW_REQUIRED";
    else if (openIssues.length > 0) healthStatus = "WARNING";

    return NextResponse.json({
      success: true,
      data: {
        healthStatus,
        summary: {
          totalIssues: issues.length,
          openIssues: openIssues.length,
          criticalCount,
          highCount,
          mediumCount,
          lowCount,
          resolvedCount,
          pendingDuplicates,
          reconciliationMismatches: reconciliation ? reconciliation.mismatchCount : 0
        },
        authoritativeDomains: AUTHORITATIVE_DOMAINS,
        activeRulesCount: DATA_QUALITY_RULES.filter(r => r.isActive).length,
        latestReconciliation: reconciliation ? {
          id: reconciliation.id,
          timestamp: reconciliation.timestamp,
          matchedCount: reconciliation.matchedCount,
          mismatchCount: reconciliation.mismatchCount
        } : null
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "অভ্যন্তরীণ সার্ভার ত্রুটি।" }, { status: 500 });
  }
}
