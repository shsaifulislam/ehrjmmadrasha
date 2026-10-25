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
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস: কেবলমাত্র অ্যাডমিন স্ট্যাটাস পরিবর্তন করতে পারেন।" }, { status: 403 });
    }

    const clientIp = getClientIp(req);
    const body = await req.json();
    const { status, reason } = body;

    if (!status || !["ACTIVE", "INACTIVE", "ARCHIVED"].includes(status)) {
      return NextResponse.json(
        { error: "অবৈধ স্ট্যাটাস। গ্রহণযোগ্য মান: ACTIVE, INACTIVE, ARCHIVED" },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length < 3) {
      return NextResponse.json(
        { error: "স্ট্যাটাস পরিবর্তনের জন্য কারণ (ন্যূনতম ৩ অক্ষর) উল্লেখ করা বাধ্যতামূলক।" },
        { status: 400 }
      );
    }

    const teacher = await prisma.user.findFirst({
      where: { id: params.id, role: "TEACHER" },
    });

    if (!teacher) {
      return NextResponse.json({ error: "উস্তাদ/শিক্ষকের তথ্য পাওয়া যায়নি।" }, { status: 404 });
    }

    const oldStatus = teacher.status;

    await prisma.$transaction(async (tx) => {
      // 1. Update status
      await tx.user.update({
        where: { id: teacher.id },
        data: { status },
      });

      // 2. If deactivated or archived, immediately invalidate active sessions
      if (status === "INACTIVE" || status === "ARCHIVED") {
        await tx.session.deleteMany({
          where: { userId: teacher.id },
        });

        await tx.employee.updateMany({
          where: { userId: teacher.id },
          data: { status: status === "ARCHIVED" ? "INACTIVE" : "SUSPENDED" },
        });
      } else if (status === "ACTIVE") {
        await tx.employee.updateMany({
          where: { userId: teacher.id },
          data: { status: "ACTIVE" },
        });
      }

      // 3. Record Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.userId,
          action: "TEACHER_STATUS_CHANGE",
          entityType: "User",
          entityId: teacher.id,
          detailsJson: JSON.stringify({
            oldStatus,
            newStatus: status,
            reason: reason.trim(),
            teacherName: teacher.name,
          }),
          ipAddress: clientIp,
        },
      });
    });

    const statusLabels: Record<string, string> = {
      ACTIVE: "সক্রিয় (Active)",
      INACTIVE: "নিষ্ক্রিয় / সাময়িক স্থগিত (Inactive)",
      ARCHIVED: "আর্কাইভ / সংরক্ষিত (Archived)",
    };

    return NextResponse.json({
      success: true,
      message: `উস্তাদের অ্যাকাউন্টের অবস্থা সফলভাবে '${statusLabels[status]}' এ পরিবর্তিত হয়েছে।`,
      status,
    });
  } catch (error: any) {
    console.error("Teacher Status POST Error:", error);
    return NextResponse.json({ error: "স্ট্যাটাস পরিবর্তনে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
