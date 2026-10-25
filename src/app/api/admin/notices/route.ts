import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { createNotice } from "@/lib/communicationEngine";

export const dynamic = "force-dynamic";

/**
 * Admin Notices API (GET list with filters & POST create)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const audience = searchParams.get("audience");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }
    if (category && category !== "ALL") {
      where.category = category;
    }
    if (audience && audience !== "ALL") {
      where.audience = audience;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { titleBn: { contains: q } },
        { titleEn: { contains: q } },
        { contentBn: { contains: q } },
      ];
    }

    const [total, notices, statusCounts] = await Promise.all([
      prisma.notice.count({ where }),
      prisma.notice.findMany({
        where,
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
        include: {
          session: { select: { id: true, name: true } },
          jamatClass: { select: { id: true, nameBn: true } },
          section: { select: { id: true, nameBn: true } },
          createdByUser: { select: { id: true, name: true, role: true } },
          publishedByUser: { select: { id: true, name: true, role: true } },
        },
      }),
      prisma.notice.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
    ]);

    const counts: Record<string, number> = {
      ALL: total,
      DRAFT: 0,
      SCHEDULED: 0,
      PUBLISHED: 0,
      EXPIRED: 0,
      ARCHIVED: 0,
    };
    for (const sc of statusCounts) {
      counts[sc.status] = sc._count.id;
    }

    return NextResponse.json({
      success: true,
      notices,
      counts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Admin Notices GET Error:", error);
    return NextResponse.json({ error: "নোটিশ লোড করা সম্ভব হয়নি।" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন ও মুহতামিম নোটিশ তৈরি করতে পারবেন।" }, { status: 403 });
    }

    const body = await req.json();
    const {
      titleBn,
      titleEn,
      contentBn,
      contentEn,
      bodyBn,
      bodyEn,
      category = "GENERAL",
      audience = "PUBLIC",
      priority = "NORMAL",
      status = "PUBLISHED",
      sessionId,
      classId,
      sectionId,
      isPinned = false,
      scheduledAt,
      expiresAt,
      attachmentUrl,
      attachmentName,
      attachmentType,
    } = body;

    const finalContentBn = contentBn || bodyBn;
    const finalContentEn = contentEn || bodyEn;

    if (!titleBn || !finalContentBn) {
      return NextResponse.json(
        { error: "নোটিশের শিরোনাম ও বিস্তারিত বিবরণ প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    // Validation: Targeted notice requirements
    if (audience === "CLASS" && !classId) {
      return NextResponse.json(
        { error: "শ্রেণিভিত্তিক নোটিশের জন্য নির্দিষ্ট জামাত/শ্রেণি নির্বাচন আবশ্যক।" },
        { status: 400 }
      );
    }

    if (status === "SCHEDULED" && !scheduledAt) {
      return NextResponse.json(
        { error: "নির্ধারিত সময়ের নোটিশের জন্য প্রকাশের তারিখ ও সময় (scheduledAt) আবশ্যক।" },
        { status: 400 }
      );
    }

    const notice = await createNotice({
      titleBn,
      titleEn,
      contentBn: finalContentBn,
      contentEn: finalContentEn,
      category,
      audience,
      priority,
      status,
      sessionId,
      classId,
      sectionId,
      isPinned: Boolean(isPinned),
      scheduledAt,
      expiresAt,
      attachmentUrl,
      attachmentName,
      attachmentType,
      authorUserId: user.userId,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          status === "PUBLISHED"
            ? "নোটিশ সফলভাবে প্রকাশিত হয়েছে।"
            : status === "SCHEDULED"
            ? "নোটিশ প্রকাশের জন্য শিডিউল করা হয়েছে।"
            : "নোটিশ ড্রাফট হিসেবে সংরক্ষিত হয়েছে।",
        notice,
        data: notice,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Admin Notices POST Error:", error);
    return NextResponse.json({ error: error.message || "নোটিশ প্রকাশে সমস্যা হয়েছে।" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "নোটিশ আইডি আবশ্যক।" }, { status: 400 });
    }

    const notice = await prisma.notice.findUnique({ where: { id } });
    if (!notice) {
      return NextResponse.json({ error: "নোটিশ পাওয়া যায়নি।" }, { status: 404 });
    }

    await prisma.notice.delete({
      where: { id },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "DELETE_NOTICE",
      entityType: "Notice",
      entityId: id,
      details: { titleBn: notice.titleBn },
    });

    return NextResponse.json({ success: true, message: "নোটিশটি সফলভাবে অপসারিত হয়েছে।" });
  } catch (error: any) {
    console.error("Admin Notices DELETE Error:", error);
    return NextResponse.json({ error: "নোটিশ মুছতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
