import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STATUS_LABELS_BN, PRIORITY_LABELS_BN, TYPE_LABELS_BN } from "@/lib/helpdeskEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined;
    const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    const where: any = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const [
      totalCount,
      byStatus,
      byCategory,
      byPriority,
      byType,
      resolvedRequests,
    ] = await Promise.all([
      prisma.supportRequest.count({ where }),
      prisma.supportRequest.groupBy({
        by: ["status"],
        where,
        _count: { id: true },
      }),
      prisma.supportRequest.groupBy({
        by: ["categoryId"],
        where,
        _count: { id: true },
      }),
      prisma.supportRequest.groupBy({
        by: ["priority"],
        where,
        _count: { id: true },
      }),
      prisma.supportRequest.groupBy({
        by: ["requestType"],
        where,
        _count: { id: true },
      }),
      prisma.supportRequest.findMany({
        where: {
          ...where,
          status: { in: ["RESOLVED", "CLOSED"] },
          resolutionDate: { not: null },
        },
        select: {
          createdAt: true,
          resolutionDate: true,
          slaTargetAt: true,
        },
      }),
    ]);

    // Categories lookup
    const categories = await prisma.supportRequestCategory.findMany();
    const categoryMap = new Map(categories.map((c) => [c.id, c.nameBn]));

    let totalResolutionHours = 0;
    let slaBreached = 0;
    for (const r of resolvedRequests) {
      if (r.resolutionDate) {
        totalResolutionHours += (r.resolutionDate.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60);
        if (r.slaTargetAt && r.resolutionDate > r.slaTargetAt) {
          slaBreached++;
        }
      }
    }

    const avgResolutionHours = resolvedRequests.length > 0
      ? Number((totalResolutionHours / resolvedRequests.length).toFixed(1))
      : 0;

    return NextResponse.json({
      success: true,
      report: {
        totalCount,
        resolvedCount: resolvedRequests.length,
        avgResolutionHours,
        slaBreachedCount: slaBreached,
        slaMetCount: resolvedRequests.length - slaBreached,
        statusBreakdown: byStatus.map((s) => ({
          status: s.status,
          label: STATUS_LABELS_BN[s.status] || s.status,
          count: s._count.id,
        })),
        categoryBreakdown: byCategory.map((c) => ({
          categoryId: c.categoryId,
          nameBn: categoryMap.get(c.categoryId) || "অজানা",
          count: c._count.id,
        })),
        priorityBreakdown: byPriority.map((p) => ({
          priority: p.priority,
          label: PRIORITY_LABELS_BN[p.priority] || p.priority,
          count: p._count.id,
        })),
        typeBreakdown: byType.map((t) => ({
          type: t.requestType,
          label: TYPE_LABELS_BN[t.requestType] || t.requestType,
          count: t._count.id,
        })),
      },
    });
  } catch (error: any) {
    console.error("Admin Helpdesk Reports GET error:", error);
    return NextResponse.json(
      { error: error.message || "রিপোর্ট লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
