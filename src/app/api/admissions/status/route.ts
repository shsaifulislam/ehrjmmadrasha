import { NextRequest, NextResponse } from "next/server";
import { getAdmissionSettings, updateAdmissionSettings } from "@/lib/systemSettings";
import {
  getAdmissionSessionConfig,
  isAdmissionCurrentlyOpen,
  isValidAdmissionDateRange,
  updateAdmissionSessionConfig,
} from "@/lib/admissions/admissionConfigEngine";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * GET /api/admissions/status
 * Public endpoint returning current admission status (open vs closed)
 */
export async function GET() {
  try {
    const [settings, status] = await Promise.all([
      Promise.resolve(getAdmissionSettings()),
      isAdmissionCurrentlyOpen(),
    ]);
    const admission = {
      ...settings,
      isOpen: status.isOpen,
      sessionName: status.config.sessionName,
      startDate: status.config.startDate,
      endDate: status.config.endDate,
      closedMessage: settings.closedMessage,
      statusReason: status.reason,
    };
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
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "অবৈধ ভর্তি কনফিগারেশন।" }, { status: 400 });
    }
    const { isOpen, closedMessage, sessionName, helplinePhone, startDate, endDate } = body;

    const currentConfig = await getAdmissionSessionConfig();
    const configUpdates: Partial<typeof currentConfig> = {};
    if (typeof isOpen === "boolean") configUpdates.isOpen = isOpen;
    if (typeof sessionName === "string" && sessionName.trim()) {
      configUpdates.sessionName = sessionName.trim();
    }
    if (typeof startDate === "string") configUpdates.startDate = startDate.trim();
    if (typeof endDate === "string") configUpdates.endDate = endDate.trim();

    const nextStartDate = configUpdates.startDate ?? currentConfig.startDate;
    const nextEndDate = configUpdates.endDate ?? currentConfig.endDate;
    const nextIsOpen = configUpdates.isOpen ?? currentConfig.isOpen;
    if (nextIsOpen && !isValidAdmissionDateRange(nextStartDate, nextEndDate)) {
      return NextResponse.json(
        { error: "ভর্তি চালু করতে একটি বৈধ শুরু ও শেষ তারিখ নির্ধারণ করুন।" },
        { status: 400 }
      );
    }

    const updatedConfig = await updateAdmissionSessionConfig(configUpdates, user.userId);
    updateAdmissionSettings({
      isOpen: updatedConfig.isOpen,
      sessionName: updatedConfig.sessionName,
      ...(closedMessage ? { closedMessage: String(closedMessage).trim() } : {}),
      ...(helplinePhone ? { helplinePhone: String(helplinePhone).trim() } : {}),
    });
    const status = await isAdmissionCurrentlyOpen();

    await recordAuditLog({
      userId: user.userId,
      action: "ADMISSION_STATUS_TOGGLED",
      entityType: "AdmissionControl",
      entityId: "SYSTEM",
      details: {
        isOpen: status.isOpen,
        sessionName: updatedConfig.sessionName,
      },
    });

    return NextResponse.json({
      success: true,
      message: `ভর্তি কার্যক্রমের কনফিগারেশন সংরক্ষণ করা হয়েছে। বর্তমান অবস্থা: ${status.isOpen ? "চালু" : "বন্ধ"}।`,
      admission: {
        ...getAdmissionSettings(),
        isOpen: status.isOpen,
        sessionName: updatedConfig.sessionName,
        startDate: updatedConfig.startDate,
        endDate: updatedConfig.endDate,
        closedMessage: getAdmissionSettings().closedMessage,
        statusReason: status.reason,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
