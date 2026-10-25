import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  ComplianceCrossModuleBridge,
  ComplianceReportType,
} from "@/lib/compliance";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত প্রবেশাধিকার।" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const reportType = (searchParams.get("type") || "MANAGEMENT_ASSURANCE_REPORT") as ComplianceReportType;

    const report = ComplianceCrossModuleBridge.generateInstitutionalReport(reportType);

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (err: any) {
    console.error("[API Compliance Reports GET] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "প্রতিবেদন তৈরিতে ব্যর্থ।" },
      { status: 500 }
    );
  }
}
