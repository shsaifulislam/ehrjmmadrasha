import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { generateGroundedRAGAnswer } from "@/lib/knowledge/ragEngine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    const userRole = (sessionUser?.role as any) || "PUBLIC";

    const body = await req.json();
    const { query, studentId, preferredLanguage } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "প্রশ্ন উল্লেখ করা আবশ্যক।" }, { status: 400 });
    }

    const answerResponse = await generateGroundedRAGAnswer({
      query,
      user: {
        userId: sessionUser?.userId,
        role: userRole,
        studentId,
      },
      preferredLanguage: preferredLanguage || "bn",
    });

    return NextResponse.json({
      success: true,
      result: answerResponse,
    });
  } catch (err: any) {
    console.error("RAG Answer API Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "RAG উত্তর প্রস্তুতকরণ ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
