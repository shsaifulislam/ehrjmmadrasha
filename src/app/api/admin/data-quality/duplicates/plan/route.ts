import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { planStudentMerge } from "@/lib/duplicateMergeEngine";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const { survivorId, duplicateId } = body;

    if (!survivorId || !duplicateId) {
      return NextResponse.json({ error: "survivorId এবং duplicateId উভয়ই আবশ্যক।" }, { status: 400 });
    }

    const preview = await planStudentMerge(survivorId, duplicateId);

    return NextResponse.json({
      success: true,
      data: preview
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "মার্জ প্রিভিউ তৈরি করতে ব্যর্থ।" }, { status: 500 });
  }
}
