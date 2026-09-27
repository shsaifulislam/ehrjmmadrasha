import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { dispatchNotification } from "@/lib/communicationEngine";

export const dynamic = "force-dynamic";

/**
 * Admin Send Custom Notification / Broadcast API
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      message,
      audience = "ALL_GUARDIANS",
      priority = "NORMAL",
      category = "OFFICIAL_NOTICE",
      sessionId,
      classId,
      sectionId,
      customUserIds,
      actionUrl,
    } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "শিরোনাম এবং বার্তার বিবরণ প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    const result = await dispatchNotification({
      templateCode: "OFFICIAL_NOTICE_ANNOUNCEMENT",
      customTitle: title,
      customBody: message,
      target: {
        audience,
        sessionId,
        classId,
        sectionId,
        customUserIds,
      },
      variables: {},
      priority,
      actionUrl,
    });

    await recordAuditLog({
      userId: user.userId,
      action: "BROADCAST_NOTIFICATION",
      entityType: "Notification",
      details: { title, audience, dispatchedCount: result.dispatchedCount, recipientsCount: result.recipientsCount },
    });

    return NextResponse.json({
      success: true,
      message: `নোটিফিকেশন সফলভাবে প্রেরণ করা হয়েছে। মোট গ্রাহক: ${result.recipientsCount} জন, পোর্টাল নোটিফিকেশন: ${result.dispatchedCount} টি, ইমেইল কিউ: ${result.emailDeliveryCount} টি।`,
      result,
    });
  } catch (error: any) {
    console.error("Admin Send Notification Error:", error);
    return NextResponse.json({ error: error.message || "বার্তা প্রেরণে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
