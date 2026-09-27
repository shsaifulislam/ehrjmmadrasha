import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Admin Delivery Logs API
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const destination = searchParams.get("destination");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (destination && destination.trim()) {
      where.destination = { contains: destination.trim() };
    }

    const [total, deliveries, counts] = await Promise.all([
      prisma.notificationDelivery.count({ where }),
      prisma.notificationDelivery.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          notification: {
            select: { id: true, title: true, type: true, priority: true },
          },
        },
      }),
      prisma.notificationDelivery.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
    ]);

    const summary: Record<string, number> = {
      QUEUED: 0,
      SENT: 0,
      DELIVERED: 0,
      FAILED: 0,
      CANCELLED: 0,
    };
    for (const c of counts) {
      summary[c.status] = c._count.id;
    }

    return NextResponse.json({
      success: true,
      deliveries,
      data: deliveries,
      summary,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Admin Delivery Logs GET Error:", error);
    return NextResponse.json({ error: "ডেলিভারি লগ লোড করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
