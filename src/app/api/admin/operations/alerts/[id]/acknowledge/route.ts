import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { acknowledgeOperationalAlert } from "@/lib/operationsEngine";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const updated = await acknowledgeOperationalAlert(params.id, user.userId);
    return NextResponse.json({ success: true, alert: updated });
  } catch (error: any) {
    console.error("Alert Acknowledge Error:", error);
    return NextResponse.json(
      { error: error.message || "অ্যালার্ট স্বীকার করতে ব্যর্থ।" },
      { status: 400 }
    );
  }
}
