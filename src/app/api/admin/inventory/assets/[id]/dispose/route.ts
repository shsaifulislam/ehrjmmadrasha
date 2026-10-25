import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { disposeInventoryAsset } from "@/lib/inventoryEngine";

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
    const { disposalDate, disposalValue, disposalReason, notes } = body;

    if (!disposalReason) {
      return NextResponse.json(
        { error: "সম্পদ অপসারণ বা বাতিলের কারণ উল্লেখ আবশ্যক।" },
        { status: 400 }
      );
    }

    const updated = await disposeInventoryAsset({
      assetId: params.id,
      disposalDate: disposalDate ? new Date(disposalDate) : undefined,
      disposalValue: disposalValue !== undefined ? Number(disposalValue) : undefined,
      disposalReason,
      notes,
      adminUserId: user.userId,
    });

    return NextResponse.json({ success: true, asset: updated });
  } catch (error: any) {
    console.error("Dispose asset error:", error);
    return NextResponse.json(
      { error: error.message || "সম্পদ অপসারণ প্রক্রিয়া সম্পন্ন করা সম্ভব হয়নি।" },
      { status: 400 }
    );
  }
}
