import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog, getClientIp } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস: কেবলমাত্র অ্যাডমিন এই কাজ করতে পারেন।" }, { status: 403 });
    }

    const clientIp = getClientIp(req);
    const teacher = await prisma.user.findFirst({
      where: { id: params.id, role: "TEACHER" },
    });

    if (!teacher) {
      return NextResponse.json({ error: "উস্তাদ/শিক্ষকের তথ্য পাওয়া যায়নি।" }, { status: 404 });
    }

    // Count and delete active sessions
    const sessionCount = await prisma.session.count({
      where: { userId: teacher.id },
    });

    await prisma.session.deleteMany({
      where: { userId: teacher.id },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "FORCE_LOGOUT",
      entityType: "User",
      entityId: teacher.id,
      details: {
        teacherName: teacher.name,
        email: teacher.email,
        revokedSessionsCount: sessionCount,
      },
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: `উস্তাদ '${teacher.name}' এর সকল সক্রিয় লগইন সেশন (${sessionCount}টি) সফলভাবে বাতিল করা হয়েছে।`,
      revokedCount: sessionCount,
    });
  } catch (error: any) {
    console.error("Force Logout Error:", error);
    return NextResponse.json({ error: "লগআউট করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
