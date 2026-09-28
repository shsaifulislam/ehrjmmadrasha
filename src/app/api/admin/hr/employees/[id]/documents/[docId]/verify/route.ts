import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { verifyEmployeeDocument } from "@/lib/hrEngine";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const { verificationStatus } = body;

    if (!["VERIFIED", "REJECTED", "PENDING"].includes(verificationStatus)) {
      return NextResponse.json({ error: "ভেরিফিকেশন স্ট্যাটাস সঠিক নয়।" }, { status: 400 });
    }

    const updated = await verifyEmployeeDocument(params.docId, verificationStatus, user.userId);
    return NextResponse.json({ success: true, document: updated });
  } catch (error: any) {
    console.error("Verify employee document error:", error);
    return NextResponse.json(
      { error: error.message || "নথি ভেরিফিকেশন ব্যর্থ হয়েছে।" },
      { status: 400 }
    );
  }
}
