import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "GUARDIAN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    const guardian = await prisma.guardian.findFirst({
      where: { userId: user.userId }
    });

    if (!guardian) {
      return NextResponse.json({ success: true, data: [] });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    // If studentId specified, verify guardian owns this student (IDOR check)
    if (studentId) {
      const link = await prisma.guardianStudent.findUnique({
        where: {
          guardianId_studentId: {
            guardianId: guardian.id,
            studentId
          }
        }
      });
      if (!link) {
        return NextResponse.json(
          { error: "অননুমোদিত অ্যাক্সেস। আপনি এই শিক্ষার্থীর নিবন্ধিত অভিভাবক নন।" },
          { status: 403 }
        );
      }
    }

    const requests = await prisma.studentLeaveRequest.findMany({
      where: {
        guardianId: guardian.id,
        ...(studentId ? { studentId } : {})
      },
      include: {
        student: {
          select: {
            id: true,
            fullNameBn: true,
            studentIdNumber: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "ত্রুটি ঘটেছে।" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "GUARDIAN") {
      return NextResponse.json({ error: "শুধুমাত্র অভিভাবক ছুটির আবেদন করতে পারেন।" }, { status: 403 });
    }

    const guardian = await prisma.guardian.findFirst({
      where: { userId: user.userId }
    });

    if (!guardian) {
      return NextResponse.json({ error: "অভিভাবক প্রোফাইল পাওয়া যায়নি।" }, { status: 404 });
    }

    const body = await req.json();
    const { studentId, startDate, endDate, reason } = body;

    if (!studentId || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: "শিক্ষার্থী, শুরুর তারিখ, শেষের তারিখ এবং কারণ আবশ্যক।" },
        { status: 400 }
      );
    }

    const trimmedReason = String(reason).trim();
    if (trimmedReason.length < 5) {
      return NextResponse.json(
        { error: "ছুটির কারণ কমপক্ষে ৫ অক্ষরের হতে হবে।" },
        { status: 400 }
      );
    }
    if (trimmedReason.length > 500) {
      return NextResponse.json(
        { error: "ছুটির কারণ ৫০০ অক্ষরের বেশি হতে পারবে না।" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: "সঠিক তারিখ প্রদান করুন।" },
        { status: 400 }
      );
    }

    if (start > end) {
      return NextResponse.json(
        { error: "শুরুর তারিখ শেষের তারিখের চেয়ে পরে হতে পারে না।" },
        { status: 400 }
      );
    }

    // IDOR verification: Ensure this student belongs to this guardian
    const link = await prisma.guardianStudent.findUnique({
      where: {
        guardianId_studentId: {
          guardianId: guardian.id,
          studentId
        }
      }
    });

    if (!link) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। আপনি এই শিক্ষার্থীর নিবন্ধিত অভিভাবক নন।" },
        { status: 403 }
      );
    }

    // Find active session
    const currentSession = await prisma.academicSession.findFirst({
      where: { isCurrent: true }
    }) || await prisma.academicSession.findFirst({
      where: { status: "ACTIVE" }
    });

    // Check for conflicting pending/active requests
    const existingConflict = await prisma.studentLeaveRequest.findFirst({
      where: {
        studentId,
        status: { in: ["SUBMITTED", "UNDER_REVIEW", "APPROVED"] },
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start }
          }
        ]
      }
    });

    if (existingConflict) {
      return NextResponse.json(
        { error: "এই সময়ে শিক্ষার্থীর ইতিমধ্যে একটি ছুটির আবেদন সক্রিয় বা অনুমোদিত রয়েছে।" },
        { status: 400 }
      );
    }

    // Persist real DB record
    const leaveRequest = await prisma.studentLeaveRequest.create({
      data: {
        studentId,
        guardianId: guardian.id,
        sessionId: currentSession?.id || null,
        startDate: start,
        endDate: end,
        reason: trimmedReason,
        status: "SUBMITTED"
      },
      include: {
        student: {
          select: {
            id: true,
            fullNameBn: true,
            studentIdNumber: true
          }
        }
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "GUARDIAN_SUBMIT_LEAVE_REQUEST",
        entityType: "StudentLeaveRequest",
        entityId: leaveRequest.id,
        detailsJson: JSON.stringify({
          studentId,
          guardianId: guardian.id,
          startDate: start.toISOString(),
          endDate: end.toISOString()
        }),
        userId: user.userId
      }
    });

    // Notify Principal and Admin in-app
    try {
      const staffUsers = await prisma.user.findMany({
        where: {
          role: { in: ["PRINCIPAL", "ADMIN"] },
          status: "ACTIVE",
        },
        select: { id: true },
      });

      if (staffUsers.length > 0) {
        await prisma.notification.createMany({
          data: staffUsers.map((u) => ({
            recipientUserId: u.id,
            type: "ATTENDANCE",
            title: `[নতুন ছুটির আবেদন] ${leaveRequest.student.fullNameBn}`,
            body: `অভিভাবক কর্তৃক ${leaveRequest.student.fullNameBn}-এর ছুটির আবেদন জমা পড়েছে (${new Date(start).toLocaleDateString("bn-BD")} হতে ${new Date(end).toLocaleDateString("bn-BD")})। কারণ: ${trimmedReason}`,
            actionUrl: "/principal?tab=LEAVE_MANAGEMENT",
            priority: "IMPORTANT",
            channel: "PORTAL",
          })),
        });
      }
    } catch (notifErr) {
      console.warn("Leave notification warning:", notifErr);
    }

    return NextResponse.json({
      success: true,
      messageBn: "আবেদন সফলভাবে জমা হয়েছে।",
      data: leaveRequest
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "আবেদন প্রক্রিয়াকরণে ত্রুটি ঘটেছে।" }, { status: 500 });
  }
}
