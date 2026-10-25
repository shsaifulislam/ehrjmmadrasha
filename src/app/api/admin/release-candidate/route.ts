import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { releaseCandidateEngine } from "@/lib/releaseCandidate";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত প্রবেশাধিকার। শুধুমাত্র অ্যাডমিন এবং প্রিন্সিপাল অ্যাক্সেসযোগ্য।" },
        { status: 403 }
      );
    }

    const evaluation = await releaseCandidateEngine.evaluateReleaseCandidate();

    return NextResponse.json({
      success: true,
      data: evaluation
    });
  } catch (err: any) {
    console.error("[ReleaseCandidateAPI] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "অভ্যন্তরীণ সিস্টেম ত্রুটি।" },
      { status: 500 }
    );
  }
}
