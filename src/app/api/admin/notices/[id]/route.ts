import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * Admin Single Notice Detail & Edit
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const notice = await prisma.notice.findUnique({
      where: { id: params.id },
      include: {
        session: true,
        jamatClass: true,
        section: true,
        createdByUser: { select: { id: true, name: true, role: true } },
        publishedByUser: { select: { id: true, name: true, role: true } },
      },
    });

    if (!notice) {
      return NextResponse.json({ error: "নোটিশ পাওয়া যায়নি।" }, { status: 404 });
    }

    return NextResponse.json({ success: true, notice });
  } catch (error: any) {
    console.error("Admin Notice Detail Error:", error);
    return NextResponse.json({ error: "নোটিশ লোড করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const notice = await prisma.notice.findUnique({
      where: { id: params.id },
    });

    if (!notice) {
      return NextResponse.json({ error: "নোটিশ পাওয়া যায়নি।" }, { status: 404 });
    }

    const body = await req.json();
    const {
      titleBn,
      titleEn,
      contentBn,
      contentEn,
      bodyBn,
      bodyEn,
      category,
      audience,
      priority,
      status,
      sessionId,
      classId,
      sectionId,
      isPinned,
      scheduledAt,
      expiresAt,
      attachmentUrl,
      attachmentName,
      attachmentType,
    } = body;

    const finalContentBn = contentBn !== undefined ? contentBn : bodyBn;
    const finalContentEn = contentEn !== undefined ? contentEn : bodyEn;

    const updated = await prisma.notice.update({
      where: { id: params.id },
      data: {
        ...(titleBn !== undefined && { titleBn }),
        ...(titleEn !== undefined && { titleEn }),
        ...(finalContentBn !== undefined && { contentBn: finalContentBn }),
        ...(finalContentEn !== undefined && { contentEn: finalContentEn }),
        ...(category !== undefined && { category }),
        ...(audience !== undefined && { audience }),
        ...(priority !== undefined && {
          priority,
          isUrgent: priority === "URGENT",
        }),
        ...(status !== undefined && {
          status,
          isPublished: status === "PUBLISHED",
        }),
        ...(sessionId !== undefined && { sessionId }),
        ...(classId !== undefined && { classId }),
        ...(sectionId !== undefined && { sectionId }),
        ...(isPinned !== undefined && { isPinned: Boolean(isPinned) }),
        ...(scheduledAt !== undefined && {
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        }),
        ...(expiresAt !== undefined && {
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        }),
        ...(attachmentUrl !== undefined && { attachmentUrl }),
        ...(attachmentName !== undefined && { attachmentName }),
        ...(attachmentType !== undefined && { attachmentType }),
        version: { increment: 1 },
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "NOTICE_UPDATE",
      entityType: "Notice",
      entityId: notice.id,
      details: { titleBn: updated.titleBn, version: updated.version },
    });

    return NextResponse.json({
      success: true,
      message: "নোটিশ সফলভাবে হালনাগাদ করা হয়েছে।",
      notice: updated,
      data: updated,
    });
  } catch (error: any) {
    console.error("Admin Notice Update Error:", error);
    return NextResponse.json({ error: "নোটিশ হালনাগাদ করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}

export const PUT = PATCH;
