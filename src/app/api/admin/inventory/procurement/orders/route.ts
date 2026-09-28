import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getPurchaseOrders, createPurchaseOrder } from "@/lib/inventoryEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get("supplierId") || undefined;
    const status = searchParams.get("status") || undefined;

    const orders = await getPurchaseOrders({ supplierId, status });
    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error("Get purchase orders error:", error);
    return NextResponse.json(
      { error: error.message || "পারচেজ অর্ডার তালিকা লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const { supplierId, purchaseRequestId, expectedDeliveryDate, items, discount, tax, notes } = body;

    if (!supplierId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "সরবরাহকারী ও পণ্যের তালিকা প্রদান আবশ্যক।" },
        { status: 400 }
      );
    }

    const po = await createPurchaseOrder(
      {
        supplierId,
        purchaseRequestId,
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
        items,
        discount: discount !== undefined ? Number(discount) : undefined,
        tax: tax !== undefined ? Number(tax) : undefined,
        notes,
      },
      user.userId
    );

    return NextResponse.json({ success: true, order: po });
  } catch (error: any) {
    console.error("Create purchase order error:", error);
    return NextResponse.json(
      { error: error.message || "পারচেজ অর্ডার তৈরি করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
