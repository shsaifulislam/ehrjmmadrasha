import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { receiveGoodsForPurchaseOrder } from "@/lib/inventoryEngine";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const { locationId, deliveryChallanNumber, notes, items, createFinanceExpense } = body;

    if (!locationId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "রিসিভিং লোকেশন ও গ্রহণকৃত পণ্যের তালিকা আবশ্যক।" },
        { status: 400 }
      );
    }

    const result = await receiveGoodsForPurchaseOrder({
      purchaseOrderId: params.id,
      locationId,
      deliveryChallanNumber,
      notes,
      items,
      createFinanceExpense,
      adminUserId: user.userId,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Receive goods error:", error);
    return NextResponse.json(
      { error: error.message || "মালামাল রিসিভ ও স্টক-ইন সম্পন্ন করা সম্ভব হয়নি।" },
      { status: 400 }
    );
  }
}
