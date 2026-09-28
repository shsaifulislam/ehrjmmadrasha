import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAllDuplicateCandidates, scanAllStudentDuplicates } from "@/lib/duplicateMergeEngine";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const triggerScan = searchParams.get("scan") === "true";

    let candidates = triggerScan ? await scanAllStudentDuplicates() : getAllDuplicateCandidates();
    if (candidates.length === 0 && !triggerScan) {
      candidates = await scanAllStudentDuplicates();
    }

    return NextResponse.json({
      success: true,
      data: {
        total: candidates.length,
        candidates
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "ত্রুটি ঘটেছে।" }, { status: 500 });
  }
}
