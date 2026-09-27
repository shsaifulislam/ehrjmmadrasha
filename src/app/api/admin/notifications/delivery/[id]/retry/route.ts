import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { sendInstitutionalEmail } from "@/lib/mail";
import { INSTITUTION_INFO } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * Admin Retry Failed Email Delivery
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const delivery = await prisma.notificationDelivery.findUnique({
      where: { id: params.id },
      include: { notification: true },
    });

    if (!delivery) {
      return NextResponse.json({ error: "ডেলিভারি রেকর্ড পাওয়া যায়নি।" }, { status: 404 });
    }

    if (delivery.status === "SENT" || delivery.status === "DELIVERED") {
      return NextResponse.json({ error: "ইমেইলটি ইতিমধ্যে সফলভাবে প্রেরণ করা হয়েছে।" }, { status: 400 });
    }

    if (delivery.attemptCount >= delivery.maxAttempts) {
      return NextResponse.json({ error: `সর্বোচ্চ চেষ্টা সীমা (${delivery.maxAttempts}) অতিক্রম করেছে।` }, { status: 400 });
    }

    const title = delivery.notification?.title || "মাদরাসা নোটিফিকেশন";
    const bodyText = delivery.notification?.body || "";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #0D5C3A; color: #ffffff; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 19px;">${INSTITUTION_INFO.nameBn}</h2>
          <p style="margin: 4px 0 0; font-size: 12px; color: #fef08a;">${INSTITUTION_INFO.nameEn}</p>
        </div>
        <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
          <h3 style="color: #0D5C3A; margin-top: 0;">${title}</h3>
          <p>${bodyText.replace(/\n/g, "<br/>")}</p>
        </div>
        <div style="background-color: #f8fafc; padding: 12px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
          EHRJ Digital Campus • পুনরায় প্রেরিত বার্তা
        </div>
      </div>
    `;

    const sendRes = await sendInstitutionalEmail({
      to: delivery.destination,
      subject: `${title} | ${INSTITUTION_INFO.nameBn}`,
      html,
    });

    if (sendRes.success) {
      const updated = await prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "SENT",
          providerMessageId: sendRes.messageId,
          deliveredAt: new Date(),
          attemptCount: { increment: 1 },
          lastAttemptAt: new Date(),
          errorCode: null,
          errorMessage: null,
        },
      });

      await recordAuditLog({
        userId: user.userId,
        action: "RETRY_EMAIL_SUCCESS",
        entityType: "NotificationDelivery",
        entityId: delivery.id,
        details: { destination: delivery.destination },
      });

      return NextResponse.json({
        success: true,
        message: "ইমেইল সফলভাবে পুনরায় প্রেরণ করা হয়েছে।",
        delivery: updated,
        data: updated,
      });
    } else {
      const updated = await prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "FAILED",
          attemptCount: { increment: 1 },
          lastAttemptAt: new Date(),
          failedAt: new Date(),
          errorCode: "SMTP_RETRY_FAILED",
          errorMessage: sendRes.error,
        },
      });

      return NextResponse.json({
        success: false,
        error: `পুনরায় প্রেরণে ব্যর্থ: ${sendRes.error}`,
        delivery: updated,
        data: updated,
      }, { status: 502 });
    }
  } catch (error: any) {
    console.error("Retry Email Delivery Error:", error);
    return NextResponse.json({ error: error.message || "ইমেইল পুনরায় প্রেরণে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
