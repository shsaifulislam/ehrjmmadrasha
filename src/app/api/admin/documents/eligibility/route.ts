import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { validateDocumentEligibility } from "@/lib/documentFactory";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/documents/eligibility?studentId=...&docType=...
 * Server-side check for document eligibility
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const docType = searchParams.get("docType");
    const sessionId = searchParams.get("sessionId") || undefined;

    if (!studentId || !docType) {
      return NextResponse.json({ error: "শিক্ষার্থী এবং ডকুমেন্টের ধরন আবশ্যক।" }, { status: 400 });
    }

    const result = await validateDocumentEligibility(studentId, docType, sessionId);
    return NextResponse.json({
      success: true,
      eligible: result.eligible,
      reason: result.reason || (result.eligible ? "যোগ্য" : "অযোগ্য"),
      activeDocument: result.activeDocument || null,
    });
  } catch (error: any) {
    console.error("GET eligibility error:", error);
    return NextResponse.json({ error: "যোগ্যতা যাচাইয়ে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
