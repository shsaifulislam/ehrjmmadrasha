import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { executeStudentMerge } from "@/lib/duplicateMergeEngine";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। কেবলমাত্র অ্যাডমিন রেকর্ড মার্জ করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { survivorId, duplicateId, reason, confirmationPhrase } = body;

    if (!survivorId || !duplicateId || !reason || !confirmationPhrase) {
      return NextResponse.json({ error: "সকল তথ্য ও কনফার্মেশন বাক্য প্রদান আবশ্যক।" }, { status: 400 });
    }

    const result = await executeStudentMerge(
      survivorId,
      duplicateId,
      user.name || user.username,
      reason,
      confirmationPhrase
    );

    return NextResponse.json({
      success: true,
      messageBn: result.messageBn,
      data: result.auditRecord
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "মার্জ প্রক্রিয়াকরণে ত্রুটি ঘটেছে।" }, { status: 500 });
  }
}
