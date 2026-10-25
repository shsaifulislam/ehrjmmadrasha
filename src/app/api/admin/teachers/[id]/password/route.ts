import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { recordAuditLog, getClientIp } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস: কেবলমাত্র অ্যাডমিন পাসওয়ার্ড রিসেট করতে পারেন।" }, { status: 403 });
    }

    const clientIp = getClientIp(req);
    const body = await req.json();
    const { newPassword, reason } = body;

    if (!newPassword || newPassword.trim().length < 6) {
      return NextResponse.json(
        { error: "নতুন পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।" },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length < 3) {
      return NextResponse.json(
        { error: "পাসওয়ার্ড রিসেটের প্রশাসনিক কারণ (ন্যূনতম ৩ অক্ষর) উল্লেখ করুন।" },
        { status: 400 }
      );
    }

    const teacher = await prisma.user.findFirst({
      where: { id: params.id, role: "TEACHER" },
    });

    if (!teacher) {
      return NextResponse.json({ error: "উস্তাদ/শিক্ষকের তথ্য পাওয়া যায়নি।" }, { status: 404 });
    }

    const passwordHash = await hashPassword(newPassword.trim());

    await prisma.$transaction(async (tx) => {
      // 1. Update Password
      await tx.user.update({
        where: { id: teacher.id },
        data: { passwordHash },
      });

      // 2. Revoke all active sessions so old sessions cannot be hijacked
      await tx.session.deleteMany({
        where: { userId: teacher.id },
      });

      // 3. Record Audit Log (DO NOT LOG PLAINTEXT PASSWORD)
      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: "ADMIN_RESET_PASSWORD",
          entityType: "User",
          entityId: teacher.id,
          detailsJson: JSON.stringify({
            teacherName: teacher.name,
            email: teacher.email,
            reason: reason.trim(),
            sessionsRevoked: true,
          }),
          ipAddress: clientIp,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `উস্তাদ '${teacher.name}' এর পাসওয়ার্ড সফলভাবে রিসেট করা হয়েছে এবং পূর্ববর্তী সকল সক্রিয় সেশন বাতিল করা হয়েছে।`,
    });
  } catch (error: any) {
    console.error("Teacher Password Reset Error:", error);
    return NextResponse.json({ error: "পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
