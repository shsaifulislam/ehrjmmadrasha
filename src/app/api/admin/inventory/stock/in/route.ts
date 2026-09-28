import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { recordStockIn } from "@/lib/inventoryEngine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const { itemId, locationId, quantity, unitCost, reference, purpose, notes, transactionType } = body;

    if (!itemId || !locationId || quantity === undefined) {
      return NextResponse.json(
        { error: "পণ্য, লোকেশন ও পরিমাণ প্রদান আবশ্যক।" },
        { status: 400 }
      );
    }

    const result = await recordStockIn({
      itemId,
      locationId,
      quantity: Number(quantity),
      unitCost: unitCost !== undefined ? Number(unitCost) : undefined,
      reference,
      purpose,
      notes,
      transactionType,
      adminUserId: user.userId,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Stock in error:", error);
    return NextResponse.json(
      { error: error.message || "স্টক-ইন প্রক্রিয়া সম্পন্ন করা সম্ভব হয়নি।" },
      { status: 400 }
    );
  }
}
