import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  resolveSmsRecipients,
  sendBulkSms,
  calculateSmsMetrics,
  DEFAULT_SMS_TEMPLATES,
} from "@/lib/smsGateway";

export const dynamic = "force-dynamic";

/**
 * GET: Returns SMS Gateway info, statistics, audience counts, and templates
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const [
      totalGuardians,
      guardiansWithPhone,
      totalTeachers,
      teachersWithPhone,
      classes,
      todaySmsCount,
      allSmsDeliveries,
    ] = await Promise.all([
      prisma.guardian.count(),
      prisma.guardian.count({ where: { phone: { not: "" } } }),
      prisma.user.count({ where: { role: "TEACHER", status: "ACTIVE" } }),
      prisma.user.count({ where: { role: "TEACHER", status: "ACTIVE", phone: { not: null } } }),
      prisma.jamatClass.findMany({
        where: { isActive: true },
        select: { id: true, nameBn: true, code: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.notificationDelivery.count({
        where: {
          channel: "SMS",
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.notificationDelivery.count({
        where: { channel: "SMS" },
      }),
    ]);

    const remainingCredits = Math.max(0, 5000 - allSmsDeliveries);

    return NextResponse.json({
      success: true,
      gateway: {
        provider: process.env.SMS_PROVIDER || "MOCK_GATEWAY",
        senderId: "EHRJMADRASHA",
        status: "ONLINE",
        remainingCredits,
        totalSentToday: todaySmsCount,
        allTimeSent: allSmsDeliveries,
        ratePerSmsBdt: 0.35,
      },
      audienceCounts: {
        totalGuardians,
        guardiansWithPhone,
        totalTeachers,
        teachersWithPhone,
      },
      classes,
      templates: DEFAULT_SMS_TEMPLATES,
    });
  } catch (error: any) {
    console.error("SMS Gateway GET Error:", error);
    return NextResponse.json(
      { error: "এসএমএস গেটওয়ে তথ্য লোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

/**
 * POST: Sends Bulk SMS Broadcast to targeted audience
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const {
      message,
      audience = "ALL_GUARDIANS",
      classId,
      customNumbers,
    } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "এসএমএস বার্তার বিবরণ প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    const trimmedMsg = message.trim();
    const metrics = calculateSmsMetrics(trimmedMsg);

    // Resolve audience recipients
    const recipients = await resolveSmsRecipients({
      audience,
      classId,
      customNumbers,
    });

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "নির্বাচিত ক্যাটাগরিতে কোনো বৈধ ফোন নম্বর পাওয়া যায়নি।" },
        { status: 400 }
      );
    }

    const result = await sendBulkSms({
      message: trimmedMsg,
      recipients,
      adminUserId: user.userId,
    });

    return NextResponse.json({
      success: true,
      message: `এসএমএস ব্রডকাস্ট সফলভাবে প্রেরণ করা হয়েছে। মোট সফল: ${result.successfulSends} জন, সর্বমোট এসএমএস পার্টস: ${result.totalSmsParts} টি।`,
      result,
      metrics,
    });
  } catch (error: any) {
    console.error("Bulk SMS POST Error:", error);
    return NextResponse.json(
      { error: error.message || "এসএমএস ব্রডকাস্ট প্রেরণে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
