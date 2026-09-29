import { NextRequest, NextResponse } from "next/server";
import { approveCampaign } from "@/lib/communications";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const approverId = body.approverId || "ADMIN_OVERSIGHT";
    const role = body.role || "ADMIN";

    const updated = approveCampaign(params.id, approverId, role);

    return NextResponse.json({
      success: true,
      message: "ক্যাম্পেইন সফলভাবে অনুমোদিত হয়েছে।",
      campaign: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 400 }
    );
  }
}
