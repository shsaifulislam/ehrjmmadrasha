import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateAiDraftRule } from "@/lib/workflow";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন এআই ড্রাফট রুল প্রণয়ন করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { promptBn } = body;

    if (!promptBn || promptBn.trim().length < 5) {
      return NextResponse.json(
        { error: "অনুগ্রহ করে নিয়ম বা স্বয়ংক্রিয় প্রক্রিয়ার বর্ণনা লিখুন।" },
        { status: 400 }
      );
    }

    const draftRule = generateAiDraftRule(promptBn);

    return NextResponse.json({
      success: true,
      data: {
        draftRule,
        noticeBn: "সতর্কতা: এআই প্রণীত নিয়মটি খসড়া (DRAFT) অবস্থায় সংরক্ষিত হয়েছে। এটি কার্যকর করার পূর্বে অ্যাডমিনের শর্তাবলী যাচাই ও সক্রিয়করণ আবশ্যক।",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to generate AI draft rule" },
      { status: 500 }
    );
  }
}
