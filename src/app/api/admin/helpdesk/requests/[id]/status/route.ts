import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateSupportRequestStatus, HelpdeskStatus } from "@/lib/helpdeskEngine";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.toStatus) {
      return NextResponse.json({ error: "লক্ষ্য স্ট্যাটাস (toStatus) আবশ্যক।" }, { status: 400 });
    }

    const updated = await updateSupportRequestStatus({
      requestId: params.id,
      toStatus: body.toStatus as HelpdeskStatus,
      actorId: user.userId,
      actorRole: user.role,
      notes: body.notes,
      resolutionSummary: body.resolutionSummary,
      rejectionReason: body.rejectionReason,
    });

    return NextResponse.json({ success: true, ticket: updated });
  } catch (error: any) {
    console.error("Admin Helpdesk Request Status PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।" },
      { status: 400 }
    );
  }
}
