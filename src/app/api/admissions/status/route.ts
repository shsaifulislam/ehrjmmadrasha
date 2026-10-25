import { NextRequest, NextResponse } from "next/server";
import { getAdmissionSettings, updateAdmissionSettings } from "@/lib/systemSettings";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * GET /api/admissions/status
 * Public endpoint returning current admission status (open vs closed)
 */
export async function GET() {
  try {
    const admission = getAdmissionSettings();
    return NextResponse.json({ success: true, admission });
  } catch (error: any) {
    return NextResponse.json(
      { error: "ভর্তি তথ্য লোড করা যায়নি।" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/admissions/status OR POST /api/admissions/status
 * Admin endpoint to toggle admission open/closed and customize notices
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const { isOpen, closedMessage, sessionName, helplinePhone } = body;

    const updated = updateAdmissionSettings({
      ...(typeof isOpen === "boolean" ? { isOpen } : {}),
      ...(closedMessage ? { closedMessage: String(closedMessage).trim() } : {}),
      ...(sessionName ? { sessionName: String(sessionName).trim() } : {}),
      ...(helplinePhone ? { helplinePhone: String(helplinePhone).trim() } : {}),
    });

    await recordAuditLog({
      userId: user.userId,
      action: "ADMISSION_STATUS_TOGGLED",
      entityType: "AdmissionControl",
      entityId: "SYSTEM",
      details: {
        isOpen: updated.isOpen,
        sessionName: updated.sessionName,
      },
    });

    return NextResponse.json({
      success: true,
      message: `ভর্তি কার্যক্রম সফলভাবে ${updated.isOpen ? "চালু (OPEN)" : "বন্ধ (CLOSED)"} করা হয়েছে।`,
      admission: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
