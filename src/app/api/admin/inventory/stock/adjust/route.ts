import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { recordStockAdjustment } from "@/lib/inventoryEngine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const { itemId, locationId, actualQuantity, reason, notes } = body;

    if (!itemId || !locationId || actualQuantity === undefined || !reason) {
      return NextResponse.json(
        { error: "পণ্য, লোকেশন, গণনাকৃত প্রকৃত মজুদ ও সমন্বয়ের কারণ আবশ্যক।" },
        { status: 400 }
      );
    }

    const result = await recordStockAdjustment({
      itemId,
      locationId,
      actualQuantity: Number(actualQuantity),
      reason,
      notes,
      adminUserId: user.userId,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Stock adjustment error:", error);
    return NextResponse.json(
      { error: error.message || "স্টক সমন্বয় প্রক্রিয়া সম্পন্ন করা সম্ভব হয়নি।" },
      { status: 400 }
    );
  }
}
