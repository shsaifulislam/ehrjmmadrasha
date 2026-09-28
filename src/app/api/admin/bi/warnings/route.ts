import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  runEarlyWarningDetection,
  loadEarlyWarnings,
  EARLY_WARNING_RULES
} from "@/lib/earlyWarningEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const domain = searchParams.get("domain");
    const severity = searchParams.get("severity");
    const status = searchParams.get("status");

    // Automatically trigger fresh detection
    const detectionResult = await runEarlyWarningDetection();

    let warnings = detectionResult.warnings;
    if (domain) warnings = warnings.filter(w => w.domain === domain);
    if (severity) warnings = warnings.filter(w => w.severity === severity);
    if (status) warnings = warnings.filter(w => w.status === status);

    return NextResponse.json({
      success: true,
      data: {
        totalWarnings: warnings.length,
        activeCount: detectionResult.activeWarningsTotal,
        anomaliesCount: detectionResult.anomaliesDetected,
        warnings,
        anomalies: detectionResult.anomalies,
        rules: EARLY_WARNING_RULES
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "অভ্যন্তরীণ সার্ভার ত্রুটি।" }, { status: 500 });
  }
}
