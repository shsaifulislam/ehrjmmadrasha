import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { recordStockOut } from "@/lib/inventoryEngine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const { itemId, locationId, quantity, purpose, recipient, reference, notes, transactionType } = body;

    if (!itemId || !locationId || quantity === undefined || !purpose) {
      return NextResponse.json(
        { error: "পণ্য, লোকেশন, পরিমাণ ও ব্যবহারের উদ্দেশ্য প্রদান আবশ্যক।" },
        { status: 400 }
      );
    }

    const result = await recordStockOut({
      itemId,
      locationId,
      quantity: Number(quantity),
      purpose,
      recipient,
      reference,
      notes,
      transactionType,
      adminUserId: user.userId,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Stock out error:", error);
    return NextResponse.json(
      { error: error.message || "স্টক-আউট প্রক্রিয়া সম্পন্ন করা সম্ভব হয়নি।" },
      { status: 400 }
    );
  }
}
