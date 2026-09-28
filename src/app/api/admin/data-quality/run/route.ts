import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { runDataQualityScan } from "@/lib/dataGovernanceEngine";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। কেবলমাত্র অ্যাডমিন স্ক্যান চালাতে পারেন।" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const domains = body.domains as string[] | undefined;

    const result = await runDataQualityScan(domains);

    return NextResponse.json({
      success: true,
      messageBn: `ডেটা কোয়ালিটি স্ক্যান সফলভাবে সম্পন্ন হয়েছে। মোট ${result.totalIssuesFound} টি অসঙ্গতি চিহ্নিত রয়েছে।`,
      data: result
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "স্ক্যান পরিচালনায় ত্রুটি ঘটেছে।" }, { status: 500 });
  }
}
