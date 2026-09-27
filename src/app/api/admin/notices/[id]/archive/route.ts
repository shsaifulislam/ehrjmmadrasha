import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * Admin Archive Notice API
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

    const notice = await prisma.notice.findUnique({ where: { id: params.id } });
    if (!notice) {
      return NextResponse.json({ error: "নোটিশ পাওয়া যায়নি।" }, { status: 404 });
    }

    const archived = await prisma.notice.update({
      where: { id: params.id },
      data: {
        status: "ARCHIVED",
        isPublished: false,
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "NOTICE_ARCHIVE",
      entityType: "Notice",
      entityId: notice.id,
      details: { titleBn: notice.titleBn },
    });

    return NextResponse.json({
      success: true,
      message: "নোটিশটি সফলভাবে আর্কাইভে স্থানান্তর করা হয়েছে।",
      notice: archived,
      data: archived,
    });
  } catch (error: any) {
    console.error("Archive Notice Error:", error);
    return NextResponse.json({ error: "নোটিশ আর্কাইভ করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
