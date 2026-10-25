import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Public Single Notice Details API
 * Only returns if notice is PUBLISHED, PUBLIC, and not expired.
 */
export async function GET(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const notice = await prisma.notice.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        titleBn: true,
        titleEn: true,
        contentBn: true,
        contentEn: true,
        category: true,
        priority: true,
        status: true,
        audience: true,
        isUrgent: true,
        isPinned: true,
        attachmentUrl: true,
        attachmentName: true,
        attachmentType: true,
        publishedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    if (!notice) {
      return NextResponse.json({ error: "নোটিশ পাওয়া যায়নি।" }, { status: 404 });
    }

    const now = new Date();
    const isExpired = notice.expiresAt && notice.expiresAt <= now;

    // Must be PUBLISHED and PUBLIC for public route
    if (notice.status !== "PUBLISHED" || notice.audience !== "PUBLIC" || isExpired) {
      return NextResponse.json(
        { error: "এই নোটিশটি উন্মুক্ত জনসাধারণের জন্য প্রযোজ্য নয় অথবা মেয়াদোত্তীর্ণ হয়েছে।" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, notice, data: notice });
  } catch (error: any) {
    console.error("Public Notice Details API Error:", error);
    return NextResponse.json({ error: "নোটিশ লোড করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
