import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getInventoryItemById, updateInventoryItem } from "@/lib/inventoryEngine";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const item = await getInventoryItemById(params.id);
    if (!item) {
      return NextResponse.json({ error: "পণ্য পাওয়া যায়নি।" }, { status: 404 });
    }

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error("Get item by id error:", error);
    return NextResponse.json(
      { error: error.message || "পণ্য বিবরণ লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const updated = await updateInventoryItem(params.id, body, user.userId);
    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    console.error("Update inventory item error:", error);
    return NextResponse.json(
      { error: error.message || "পণ্য তথ্য আপডেট করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
