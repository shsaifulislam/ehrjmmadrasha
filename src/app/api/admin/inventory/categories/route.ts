import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getInventoryCategories, createInventoryCategory } from "@/lib/inventoryEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const onlyActive = searchParams.get("onlyActive") === "true";

    const categories = await getInventoryCategories({ onlyActive });
    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    console.error("Get categories error:", error);
    return NextResponse.json(
      { error: error.message || "ক্যাটাগরি তালিকা লোড করা সম্ভব হয়নি।" },
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
    const { code, nameBn, nameEn, description, sortOrder } = body;

    if (!code || !nameBn) {
      return NextResponse.json(
        { error: "ক্যাটাগরি কোড ও বাংলা নাম প্রদান আবশ্যক।" },
        { status: 400 }
      );
    }

    const category = await createInventoryCategory(
      { code, nameBn, nameEn, description, sortOrder },
      user.userId
    );

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    console.error("Create category error:", error);
    return NextResponse.json(
      { error: error.message || "ক্যাটাগরি তৈরি করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
