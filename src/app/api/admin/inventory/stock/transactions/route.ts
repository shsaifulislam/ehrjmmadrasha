import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getInventoryTransactions } from "@/lib/inventoryEngine";

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
    const type = searchParams.get("type") || undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;

    const transactions = await getInventoryTransactions({
      itemId,
      locationId,
      type,
      limit,
    });

    return NextResponse.json({ success: true, transactions });
  } catch (error: any) {
    console.error("Get transactions error:", error);
    return NextResponse.json(
      { error: error.message || "লেনদেন হিস্ট্রি লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
