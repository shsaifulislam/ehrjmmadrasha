import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getOverviewAnalytics } from "@/lib/analyticsEngine";
import { evaluateDataQualityAdvisory } from "@/lib/biEngine";
import { runEarlyWarningDetection, loadEarlyWarnings } from "@/lib/earlyWarningEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। অ্যাডমিন বা অধ্যক্ষের অনুমোদন প্রয়োজন।" }, { status: 403 });
    }

    const [overview, warningsResult] = await Promise.all([
      getOverviewAnalytics("THIS_MONTH"),
      runEarlyWarningDetection()
    ]);

    const dqAdvisory = evaluateDataQualityAdvisory();
    const allWarnings = loadEarlyWarnings();

    const activeWarnings = allWarnings.filter(w =>
      ["DETECTED", "ACKNOWLEDGED", "INVESTIGATING"].includes(w.status)
    );

    const criticalWarningsCount = activeWarnings.filter(w => w.severity === "CRITICAL").length;
    const highWarningsCount = activeWarnings.filter(w => w.severity === "HIGH").length;

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          activeStudents: overview.students.active,
          todayAttendanceRate: overview.attendance.rateToday,
          overallPassRate: overview.academics.passRate,
          monthlyCollections: overview.finance.totalCollections,
          totalOutstanding: overview.finance.totalOutstanding,
          operatingExpenses: overview.finance.totalExpenses,
          netOperatingBalance: overview.finance.netBalance,
          fundsBalance: overview.finance.fundsTotal,
          lowStockCount: overview.operations.inventory.lowStockItems,
          openTicketsCount: overview.operations.helpdesk.openTickets
        },
        earlyWarnings: {
          totalActive: activeWarnings.length,
          criticalCount: criticalWarningsCount,
          highCount: highWarningsCount,
          recentWarnings: activeWarnings.slice(0, 5)
        },
        anomalies: {
          detectedCount: warningsResult.anomaliesDetected,
          recentAnomalies: warningsResult.anomalies.slice(0, 5)
        },
        dataQualityAdvisory: dqAdvisory,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error("BI Overview API Error:", error);
    return NextResponse.json({ error: error.message || "অভ্যন্তরীণ সার্ভার ত্রুটি।" }, { status: 500 });
  }
}
