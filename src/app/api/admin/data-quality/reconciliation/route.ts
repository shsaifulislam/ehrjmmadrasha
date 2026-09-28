import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getLatestReconciliationReport, runMasterReconciliation } from "@/lib/reconciliationEngine";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    let report = getLatestReconciliationReport();
    if (!report) {
      report = await runMasterReconciliation();
    }

    return NextResponse.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "ত্রুটি ঘটেছে।" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন রিকনসিলিয়েশন পরিচালনা করতে পারেন।" }, { status: 403 });
    }

    const report = await runMasterReconciliation();

    return NextResponse.json({
      success: true,
      messageBn: `রিকনসিলিয়েশন সফলভাবে সম্পন্ন হয়েছে। ${report.totalChecks} টি চেকের মধ্যে ${report.matchedCount} টি সফল এবং ${report.mismatchCount} টি অসঙ্গতি চিহ্নিত হয়েছে।`,
      data: report
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "রিকনসিলিয়েশন প্রক্রিয়াকরণে ত্রুটি ঘটেছে।" }, { status: 500 });
  }
}
