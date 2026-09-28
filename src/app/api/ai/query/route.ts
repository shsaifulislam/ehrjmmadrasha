import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { askAIAssistant } from "@/lib/ai/aiEngine";

export const dynamic = "force-dynamic";

/**
 * POST /api/ai/query
 * Role-guarded AI natural language assistant.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। অনুগ্রহ করে লগইন করুন।" }, { status: 401 });
    }

    const body = await req.json();
    const { question, childContextId } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "প্রশ্ন উল্লেখ করা আবশ্যক।" }, { status: 400 });
    }

    const result = await askAIAssistant({
      question,
      userRole: user.role,
      userId: user.userId,
      userName: user.name,
      childContextId,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("AI Query Error:", error);
    return NextResponse.json(
      { error: error.message || "AI অ্যাসিস্ট্যান্ট উত্তর প্রদানে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
