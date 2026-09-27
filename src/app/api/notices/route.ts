import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Public Notice Board API
 * Strictly returns only PUBLISHED, PUBLIC, NON-EXPIRED notices.
 * Never exposes DRAFT, SCHEDULED, or PRIVATE TARGETED notices.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const now = new Date();

    const where: any = {
      status: "PUBLISHED",
      isPublished: true,
      audience: "PUBLIC",
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    };

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.AND = [
        {
          OR: [
            { titleBn: { contains: q } },
            { titleEn: { contains: q } },
            { contentBn: { contains: q } },
            { contentEn: { contains: q } },
          ],
        },
      ];
    }

    const [total, notices] = await Promise.all([
      prisma.notice.count({ where }),
      prisma.notice.findMany({
        where,
        orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
        skip,
        take: limit,
        select: {
          id: true,
          titleBn: true,
          titleEn: true,
          contentBn: true,
          contentEn: true,
          category: true,
          priority: true,
          isUrgent: true,
          isPinned: true,
          attachmentUrl: true,
          attachmentName: true,
          attachmentType: true,
          publishedAt: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      notices,
      data: notices,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Public Notices API Error:", error);
    return NextResponse.json({ error: "Failed to fetch notices" }, { status: 500 });
  }
}
