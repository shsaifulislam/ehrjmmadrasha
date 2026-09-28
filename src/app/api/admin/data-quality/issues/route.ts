import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAllDataQualityIssues, DATA_QUALITY_RULES } from "@/lib/dataGovernanceEngine";

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
    const search = searchParams.get("search")?.toLowerCase();

    let issues = getAllDataQualityIssues();

    if (domain) {
      issues = issues.filter(i => i.domain === domain);
    }
    if (severity) {
      issues = issues.filter(i => i.severity === severity);
    }
    if (status) {
      issues = issues.filter(i => i.status === status);
    }
    if (search) {
      issues = issues.filter(i => 
        i.titleBn.toLowerCase().includes(search) ||
        i.id.toLowerCase().includes(search) ||
        i.descriptionBn.toLowerCase().includes(search) ||
        i.ruleCode.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        total: issues.length,
        issues,
        rules: DATA_QUALITY_RULES
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "ত্রুটি ঘটেছে।" }, { status: 500 });
  }
}
