import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { assignInventoryAsset } from "@/lib/inventoryEngine";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const { assignedUserId, assignedDepartment, locationId, reason, notes } = body;

    const updated = await assignInventoryAsset({
      assetId: params.id,
      assignedUserId,
      assignedDepartment,
      locationId,
      reason,
      notes,
      adminUserId: user.userId,
    });

    return NextResponse.json({ success: true, asset: updated });
  } catch (error: any) {
    console.error("Assign asset error:", error);
    return NextResponse.json(
      { error: error.message || "সম্পদ হস্তান্তর বা বরাদ্দ করা সম্ভব হয়নি।" },
      { status: 400 }
    );
  }
}
