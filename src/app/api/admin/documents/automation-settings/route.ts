import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getDocumentAutomationSettings,
  updateDocumentAutomationSettings,
} from "@/lib/systemSettings";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/documents/automation-settings
 * Returns document automation configuration
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const settings = getDocumentAutomationSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error("GET automation-settings error:", error);
    return NextResponse.json({ error: "কনফিগারেশন লোড করা সম্ভব হয়নি।" }, { status: 500 });
  }
}

/**
 * POST /api/admin/documents/automation-settings
 * Updates document automation configuration
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র প্রধান অ্যাডমিন কনফিগারেশন পরিবর্তন করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const updated = updateDocumentAutomationSettings(body);

    await recordAuditLog({
      userId: user.userId,
      action: "UPDATE_DOCUMENT_AUTOMATION_SETTINGS",
      entityType: "SystemSettings",
      entityId: "documentAutomation",
      details: body,
    });

    return NextResponse.json({
      success: true,
      message: "ডকুমেন্ট অটোমেশন সেটিংস সফলভাবে সংরক্ষিত হয়েছে।",
      settings: updated,
    });
  } catch (error: any) {
    console.error("POST automation-settings error:", error);
    return NextResponse.json({ error: "সেটিংস সংরক্ষণ ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
