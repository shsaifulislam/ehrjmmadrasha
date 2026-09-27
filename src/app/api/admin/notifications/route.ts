import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Admin Notification Overview API
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const priority = searchParams.get("priority");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type && type !== "ALL") where.type = type;
    if (priority && priority !== "ALL") where.priority = priority;

    const [total, notifications, unreadTotal, deliveryStats] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          recipientUser: { select: { id: true, name: true, email: true, role: true } },
          deliveries: { select: { id: true, status: true, destination: true, attemptCount: true } },
        },
      }),
      prisma.notification.count({ where: { isRead: false } }),
      prisma.notificationDelivery.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
    ]);

    const deliveryCounts: Record<string, number> = {
      QUEUED: 0,
      SENT: 0,
      DELIVERED: 0,
      FAILED: 0,
      CANCELLED: 0,
    };
    for (const d of deliveryStats) {
      deliveryCounts[d.status] = d._count.id;
    }

    return NextResponse.json({
      success: true,
      notifications,
      stats: {
        total,
        unreadTotal,
        deliveries: deliveryCounts,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Admin Notifications GET Error:", error);
    return NextResponse.json({ error: "নোটিফিকেশন লোড করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
