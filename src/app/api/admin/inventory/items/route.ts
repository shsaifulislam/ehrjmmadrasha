import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getInventoryItems, createInventoryItem } from "@/lib/inventoryEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const isConsumableParam = searchParams.get("isConsumable");
    const isConsumable = isConsumableParam !== null ? isConsumableParam === "true" : undefined;
    const isActiveParam = searchParams.get("isActive");
    const isActive = isActiveParam !== null ? isActiveParam === "true" : undefined;
    const search = searchParams.get("search") || undefined;

    const items = await getInventoryItems({
      categoryId,
      isConsumable,
      isActive,
      search,
    });

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    console.error("Get inventory items error:", error);
    return NextResponse.json(
      { error: error.message || "মালামাল তালিকা লোড করা সম্ভব হয়নি।" },
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
    const {
      nameBn,
      nameEn,
      categoryId,
      unit,
      description,
      isConsumable,
      minStock,
      reorderLevel,
      maxStock,
      defaultUnitCost,
      notes,
      initialStock,
    } = body;

    if (!nameBn || !categoryId || !unit) {
      return NextResponse.json(
        { error: "পণ্যের বাংলা নাম, ক্যাটাগরি ও একক (Unit) নির্বাচন আবশ্যক।" },
        { status: 400 }
      );
    }

    const item = await createInventoryItem(
      {
        nameBn,
        nameEn,
        categoryId,
        unit,
        description,
        isConsumable,
        minStock: minStock !== undefined ? Number(minStock) : undefined,
        reorderLevel: reorderLevel !== undefined ? Number(reorderLevel) : undefined,
        maxStock: maxStock !== undefined ? Number(maxStock) : undefined,
        defaultUnitCost: defaultUnitCost !== undefined ? Number(defaultUnitCost) : undefined,
        notes,
        initialStock,
      },
      user.userId
    );

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error("Create inventory item error:", error);
    return NextResponse.json(
      { error: error.message || "পণ্য যোগ করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
