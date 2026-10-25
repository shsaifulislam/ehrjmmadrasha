import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Portal User Notifications API
 * Scoped strictly to session user's ID (IDOR-safe)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। অনুগ্রহ করে লগইন করুন।" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    const skip = (page - 1) * limit;

    const where: any = {
      recipientUserId: user.userId,
    };

    if (type && type !== "ALL") {
      where.type = type;
    }
    if (unreadOnly) {
      where.isRead = false;
    }

    const [total, unreadCount, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { recipientUserId: user.userId, isRead: false },
      }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      notifications,
      data: notifications,
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Portal Notifications Error:", error);
    return NextResponse.json({ error: "নোটিফিকেশন লোড করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
