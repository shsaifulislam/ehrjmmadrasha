import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateAssetConditionOrStatus } from "@/lib/inventoryEngine";

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
    const condition = body.condition || body.newCondition;
    const status = body.status || body.newStatus;
    const { event, cost, reason, notes } = body;

    if (!condition || !status || !event) {
      return NextResponse.json(
        { error: "অবস্থা (Condition), স্থিতি (Status) ও ইভেন্ট নির্বাচন আবশ্যক।" },
        { status: 400 }
      );
    }

    const updated = await updateAssetConditionOrStatus({
      assetId: params.id,
      condition,
      status,
      event,
      cost: cost !== undefined ? Number(cost) : undefined,
      reason,
      notes,
      adminUserId: user.userId,
    });

    return NextResponse.json({ success: true, asset: updated });
  } catch (error: any) {
    console.error("Update asset condition error:", error);
    return NextResponse.json(
      { error: error.message || "সম্পদের অবস্থা আপডেট করা সম্ভব হয়নি।" },
      { status: 400 }
    );
  }
}
