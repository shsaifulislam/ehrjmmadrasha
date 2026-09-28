import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getInventoryAssets, createInventoryAsset } from "@/lib/inventoryEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId") || undefined;
    const locationId = searchParams.get("locationId") || undefined;
    const status = searchParams.get("status") || undefined;
    const condition = searchParams.get("condition") || undefined;
    const assignedUserId = searchParams.get("assignedUserId") || undefined;
    const search = searchParams.get("search") || undefined;

    const assets = await getInventoryAssets({
      itemId,
      locationId,
      status,
      condition,
      assignedUserId,
      search,
    });

    return NextResponse.json({ success: true, assets });
  } catch (error: any) {
    console.error("Get assets error:", error);
    return NextResponse.json(
      { error: error.message || "সম্পদ তালিকা লোড করা সম্ভব হয়নি।" },
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
      itemId,
      serialNumber,
      purchaseCost,
      purchaseDate,
      warrantyExpiry,
      supplierId,
      locationId,
      condition,
      assignedUserId,
      assignedDepartment,
      notes,
    } = body;

    if (!itemId || !locationId) {
      return NextResponse.json(
        { error: "সম্পদের মূল আইটেম ও অবস্থান (Location) নির্বাচন আবশ্যক।" },
        { status: 400 }
      );
    }

    const asset = await createInventoryAsset(
      {
        itemId,
        serialNumber,
        purchaseCost: purchaseCost !== undefined ? Number(purchaseCost) : undefined,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : undefined,
        supplierId,
        locationId,
        condition,
        assignedUserId,
        assignedDepartment,
        notes,
      },
      user.userId
    );

    return NextResponse.json({ success: true, asset });
  } catch (error: any) {
    console.error("Create asset error:", error);
    return NextResponse.json(
      { error: error.message || "সম্পদ নিবন্ধন করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
