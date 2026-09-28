import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { recordStockTransfer } from "@/lib/inventoryEngine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const { itemId, sourceLocationId, destLocationId, quantity, notes } = body;

    if (!itemId || !sourceLocationId || !destLocationId || quantity === undefined) {
      return NextResponse.json(
        { error: "পণ্য, উৎস লোকেশন, গন্তব্য লোকেশন ও পরিমাণ আবশ্যক।" },
        { status: 400 }
      );
    }

    const result = await recordStockTransfer({
      itemId,
      sourceLocationId,
      destLocationId,
      quantity: Number(quantity),
      notes,
      adminUserId: user.userId,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Stock transfer error:", error);
    return NextResponse.json(
      { error: error.message || "স্টক স্থানান্তর প্রক্রিয়া সম্পন্ন করা সম্ভব হয়নি।" },
      { status: 400 }
    );
  }
}
