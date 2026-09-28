import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getStockBalances } from "@/lib/inventoryEngine";

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
    const lowStockOnly = searchParams.get("lowStockOnly") === "true";

    const balances = await getStockBalances({
      itemId,
      locationId,
      lowStockOnly,
    });

    return NextResponse.json({ success: true, balances });
  } catch (error: any) {
    console.error("Get stock balances error:", error);
    return NextResponse.json(
      { error: error.message || "স্টক ব্যালেন্স লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
