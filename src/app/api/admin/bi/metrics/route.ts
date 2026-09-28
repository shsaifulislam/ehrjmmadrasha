import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { GOVERNED_METRIC_DICTIONARY, MetricDomain } from "@/lib/biMetricDictionary";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const domainFilter = searchParams.get("domain") as MetricDomain | null;

    let metrics = GOVERNED_METRIC_DICTIONARY;
    if (domainFilter) {
      metrics = metrics.filter(m => m.domain === domainFilter);
    }

    return NextResponse.json({
      success: true,
      data: {
        totalMetrics: metrics.length,
        metrics
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "অভ্যন্তরীণ সার্ভার ত্রুটি।" }, { status: 500 });
  }
}
