import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { METRIC_LINEAGE_REGISTRY, traceMetricValue } from "@/lib/dataLineage";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const metricKey = searchParams.get("metricKey");

    if (metricKey) {
      const trace = await traceMetricValue(metricKey);
      return NextResponse.json({ success: true, data: trace });
    }

    // Return all metric definitions with sample traces
    const traces = await Promise.all(
      METRIC_LINEAGE_REGISTRY.map(async (m) => {
        try {
          return await traceMetricValue(m.metricKey);
        } catch {
          return { metric: m, calculatedValue: "N/A", sourceRecordCount: 0, sampleEvidence: [] };
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: traces
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "ত্রুটি ঘটেছে।" }, { status: 500 });
  }
}
