import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Mark All Notifications as Read for current session user
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    const result = await prisma.notification.updateMany({
      where: {
        recipientUserId: user.userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `${result.count} টি অপঠিত নোটিফিকেশন পঠিত হিসেবে চিহ্নিত করা হয়েছে।`,
      updatedCount: result.count,
    });
  } catch (error: any) {
    console.error("Mark All Read Error:", error);
    return NextResponse.json({ error: "নোটিফিকেশন হালনাগাদে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
