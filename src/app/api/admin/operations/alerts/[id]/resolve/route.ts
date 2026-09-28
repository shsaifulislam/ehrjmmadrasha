import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { resolveOperationalAlert } from "@/lib/operationsEngine";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const updated = await resolveOperationalAlert(params.id);
    return NextResponse.json({ success: true, alert: updated });
  } catch (error: any) {
    console.error("Alert Resolve Error:", error);
    return NextResponse.json(
      { error: error.message || "অ্যালার্ট সমাধান করতে ব্যর্থ।" },
      { status: 400 }
    );
  }
}
