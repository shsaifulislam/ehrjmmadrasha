import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { transitionWarningStatus, WarningStatus } from "@/lib/earlyWarningEngine";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const { status, notes } = body;

    const validStatuses: WarningStatus[] = [
      "ACKNOWLEDGED",
      "INVESTIGATING",
      "RESOLVED",
      "DISMISSED"
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `অবৈধ পূর্বসতর্কতা স্ট্যাটাস: ${status}` }, { status: 400 });
    }

    const updated = transitionWarningStatus(id, status, user.name || user.email, notes);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "অভ্যন্তরীণ সার্ভার ত্রুটি।" }, { status: 500 });
  }
}
