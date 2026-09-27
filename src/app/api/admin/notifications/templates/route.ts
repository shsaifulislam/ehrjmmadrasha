import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { ensureDefaultNotificationTemplates, DEFAULT_NOTIFICATION_TEMPLATES } from "@/lib/communicationEngine";

export const dynamic = "force-dynamic";

/**
 * Admin Notification Templates API
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    await ensureDefaultNotificationTemplates();

    const templates = await prisma.notificationTemplate.findMany({
      orderBy: { code: "asc" },
    });

    return NextResponse.json({ success: true, templates, data: templates });
  } catch (error: any) {
    console.error("Admin Templates GET Error:", error);
    return NextResponse.json({ error: "টেমপ্লেট লোড করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const {
      code,
      nameBn,
      category = "OFFICIAL_NOTICE",
      subjectTemplateBn,
      bodyTemplateBn,
      channels = "PORTAL,EMAIL",
      isMandatory = false,
      isActive = true,
    } = body;

    if (!code || !nameBn || !subjectTemplateBn || !bodyTemplateBn) {
      return NextResponse.json(
        { error: "কোড, নাম, সাবজেক্ট ও বডি টেমপ্লেট পূরণ করা আবশ্যক।" },
        { status: 400 }
      );
    }

    const template = await prisma.notificationTemplate.upsert({
      where: { code },
      update: {
        nameBn,
        category,
        subjectTemplateBn,
        bodyTemplateBn,
        channels,
        isMandatory: Boolean(isMandatory),
        isActive: Boolean(isActive),
        version: { increment: 1 },
      },
      create: {
        code,
        nameBn,
        category,
        subjectTemplateBn,
        bodyTemplateBn,
        channels,
        isMandatory: Boolean(isMandatory),
        isActive: Boolean(isActive),
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "SAVE_NOTIFICATION_TEMPLATE",
      entityType: "NotificationTemplate",
      entityId: template.id,
      details: { code: template.code, version: template.version },
    });

    return NextResponse.json({
      success: true,
      message: "নোটিফিকেশন টেমপ্লেট সফলভাবে সংরক্ষিত হয়েছে।",
      template,
    });
  } catch (error: any) {
    console.error("Admin Templates POST Error:", error);
    return NextResponse.json({ error: error.message || "টেমপ্লেট সংরক্ষণে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
