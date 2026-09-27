import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Mark Single Notification as Read
 * Enforces strict user isolation (IDOR protection)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: params.id },
    });

    if (!notification) {
      return NextResponse.json({ error: "নোটিফিকেশন পাওয়া যায়নি।" }, { status: 404 });
    }

    // IDOR Protection: User can only mark their own notification as read
    if (notification.recipientUserId !== user.userId) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস (IDOR নিষিদ্ধ)।" }, { status: 403 });
    }

    const updated = await prisma.notification.update({
      where: { id: params.id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      notification: updated,
      data: updated,
    });
  } catch (error: any) {
    console.error("Mark Read Error:", error);
    return NextResponse.json({ error: "নোটিফিকেশন চিহ্নিত করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}

export const POST = PATCH;
