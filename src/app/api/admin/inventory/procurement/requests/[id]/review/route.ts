import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { reviewPurchaseRequest } from "@/lib/inventoryEngine";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const { action, reviewNotes } = body;

    if (!action || (action !== "APPROVE" && action !== "REJECT")) {
      return NextResponse.json(
        { error: "অনুমোদন বা প্রত্যাখ্যানের সঠিক সিদ্ধান্ত নির্বাচন করুন।" },
        { status: 400 }
      );
    }

    const updated = await reviewPurchaseRequest(
      params.id,
      action,
      reviewNotes,
      user.userId
    );

    return NextResponse.json({ success: true, request: updated });
  } catch (error: any) {
    console.error("Review purchase request error:", error);
    return NextResponse.json(
      { error: error.message || "আবেদন পর্যালোচনা সম্পন্ন করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
