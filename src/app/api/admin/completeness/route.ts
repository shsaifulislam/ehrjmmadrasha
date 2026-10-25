import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { systemCompletenessEngine } from "@/lib/systemCompleteness";

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

    const auditResult = await systemCompletenessEngine.runFullAudit();

    return NextResponse.json({
      success: true,
      data: auditResult
    });
  } catch (err: any) {
    console.error("[SystemCompletenessAPI] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "অভ্যন্তরীণ সিস্টেম ত্রুটি।" },
      { status: 500 }
    );
  }
}
