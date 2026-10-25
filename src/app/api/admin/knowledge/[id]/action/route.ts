import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { transitionDocumentStatus, DocumentStatus } from "@/lib/knowledge/knowledgeStore";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। কেবলমাত্র অ্যাডমিন অনুমোদিত।" }, { status: 403 });
    }

    const body = await req.json();
    const { action, notes } = body;

    const validActions: DocumentStatus[] = [
      "UNDER_REVIEW",
      "APPROVED",
      "PUBLISHED",
      "ARCHIVED",
      "SUPERSEDED",
    ];

    if (!validActions.includes(action)) {
      return NextResponse.json({ error: "অবৈধ অ্যাকশন।" }, { status: 400 });
    }

    const updated = transitionDocumentStatus(
      params.id,
      action,
      {
        userId: user.userId,
        role: user.role,
        name: user.name,
      },
      notes
    );

    if (!updated) {
      return NextResponse.json({ error: "ডকুমেন্ট পাওয়া যায়নি।" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `ডকুমেন্টের স্ট্যাটাস সফলভাবে '${action}'-এ পরিবর্তিত হয়েছে।`,
      document: updated,
    });
  } catch (err: any) {
    console.error("Document Action Error:", err);
    return NextResponse.json({ error: err.message || "অ্যাকশন সম্পন্ন করা যায়নি।" }, { status: 500 });
  }
}
