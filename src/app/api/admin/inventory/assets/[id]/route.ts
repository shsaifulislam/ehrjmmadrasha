import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getInventoryAssetById } from "@/lib/inventoryEngine";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const asset = await getInventoryAssetById(params.id);
    if (!asset) {
      return NextResponse.json({ error: "সম্পদ পাওয়া যায়নি।" }, { status: 404 });
    }

    return NextResponse.json({ success: true, asset });
  } catch (error: any) {
    console.error("Get asset by id error:", error);
    return NextResponse.json(
      { error: error.message || "সম্পদ বিবরণ লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
