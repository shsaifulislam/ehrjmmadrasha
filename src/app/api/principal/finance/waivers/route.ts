import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * GET /api/principal/finance/waivers
 * Returns student list with fee structures, orphan statuses, active concessions,
 * and summary analytics for the Muhtamim fee management cockpit.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "PRINCIPAL" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const filter = searchParams.get("filter"); // ALL, ORPHAN, CONCESSION

    const currentSession =
      (await prisma.academicSession.findFirst({ where: { isCurrent: true } })) ||
      (await prisma.academicSession.findFirst({ where: { status: "ACTIVE" } }));

    // 1. Fetch Active Students with Enrollment, JamatClass, & Assistance
    let students = await prisma.student.findMany({
      where: {
        status: "ACTIVE",
        ...(filter === "ORPHAN" ? { isOrphan: true } : {}),
      },
      select: {
        id: true,
        studentIdNumber: true,
        fullNameBn: true,
        fullNameEn: true,
        residentialStatus: true,
        isOrphan: true,
        isFinanciallyWeak: true,
        enrollments: {
          where: { status: "ACTIVE" },
          select: {
            rollNumber: true,
            classId: true,
            jamatClass: { select: { id: true, nameBn: true } },
          },
          take: 1,
        },
        financialAssistances: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { fullNameBn: "asc" },
      take: 200,
    });

    if (classId && classId !== "ALL") {
      students = students.filter(
        (s) => s.enrollments?.[0]?.classId === classId
      );
    }

    if (filter === "CONCESSION") {
      students = students.filter(
        (s) => s.financialAssistances && s.financialAssistances.length > 0
      );
    }

    // 2. Fetch All Recorded Concessions / Financial Assistances
    const waivers = await prisma.financialAssistance.findMany({
      include: {
        student: {
          select: {
            id: true,
            studentIdNumber: true,
            fullNameBn: true,
            isOrphan: true,
            enrollments: {
              where: { status: "ACTIVE" },
              select: {
                rollNumber: true,
                jamatClass: { select: { nameBn: true } },
              },
              take: 1,
            },
          },
        },
        session: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // 3. Classes for quick selector
    const classes = await prisma.jamatClass.findMany({
      where: { isActive: true },
      select: { id: true, nameBn: true, code: true },
      orderBy: { sortOrder: "asc" },
    });

    // Calculate Summary Stats
    const totalOrphans = students.filter((s) => s.isOrphan).length;
    const totalFullFree = waivers.filter((w) => w.waiverPercentage === 100 && w.status === "APPROVED").length;
    const totalPartial = waivers.filter((w) => w.waiverPercentage > 0 && w.waiverPercentage < 100 && w.status === "APPROVED").length;
    const totalSubsidizedAmount = waivers
      .filter((w) => w.status === "APPROVED")
      .reduce((sum, w) => sum + (w.waiverAmount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        students,
        waivers,
        classes,
        stats: {
          totalOrphans,
          totalFullFree,
          totalPartial,
          totalSubsidizedAmount,
        },
      },
    });
  } catch (error: any) {
    console.error("Principal Waivers GET error:", error);
    return NextResponse.json({ error: "বেতন ছাড় ও সহায়তা তথ্য লোড ব্যর্থ।" }, { status: 500 });
  }
}

/**
 * POST /api/principal/finance/waivers
 * Muhtamim sets customized tuition, fee waiver, or orphan full scholarship.
 * Direct persistence and auto-approval into system!
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "PRINCIPAL" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const {
      studentId,
      waiverPercentage = 0,
      waiverAmount = 0,
      isOrphan = false,
      feeCategoryTarget = "ALL", // ALL, TUITION, FOOD
      reason,
      familyCondition,
      validMonths = 12,
    } = body;

    if (!studentId) {
      return NextResponse.json({ error: "শিক্ষার্থী আইডি আবশ্যক।" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { enrollments: { where: { status: "ACTIVE" }, take: 1 } },
    });

    if (!student) {
      return NextResponse.json({ error: "শিক্ষার্থী পাওয়া যায়নি।" }, { status: 404 });
    }

    const currentSession =
      (await prisma.academicSession.findFirst({ where: { isCurrent: true } })) ||
      (await prisma.academicSession.findFirst({ where: { status: "ACTIVE" } })) ||
      (await prisma.academicSession.findFirst());

    if (!currentSession) {
      return NextResponse.json({ error: "কোনো শিক্ষাবর্ষ পাওয়া যায়নি।" }, { status: 400 });
    }

    const validFrom = new Date();
    const validTo = new Date(validFrom.getTime() + Number(validMonths) * 30 * 24 * 60 * 60 * 1000);

    // Create or update FinancialAssistance record with APPROVED status directly
    const createdAssistance = await prisma.financialAssistance.create({
      data: {
        studentId,
        sessionId: currentSession.id,
        reason: reason || (isOrphan ? "মুহতামিম বিশেষ এতিম কোটা ১০০% ফ্রি-শিপ" : "মুহতামিম নির্ধারিত বিশেষ আর্থিক ছাড়"),
        isOrphan: Boolean(isOrphan),
        familyCondition: familyCondition || "মুহতামিম প্রত্যক্ষ যাচাইকৃত",
        waiverPercentage: Number(waiverPercentage) || 0,
        waiverAmount: Number(waiverAmount) || 0,
        feeCategoryTarget,
        status: "APPROVED", // Directly approved by Muhtamim!
        approvedByUserId: user.userId,
        validFrom,
        validTo,
      },
    });

    // Update Student flags
    await prisma.student.update({
      where: { id: studentId },
      data: {
        isOrphan: Boolean(isOrphan),
        isFinanciallyWeak: Number(waiverPercentage) > 0 || Number(waiverAmount) > 0,
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "PRINCIPAL_GRANT_FEE_CONCESSION",
      entityType: "FinancialAssistance",
      entityId: createdAssistance.id,
      details: {
        studentId,
        isOrphan,
        waiverPercentage,
        waiverAmount,
        target: feeCategoryTarget,
        approvedBy: user.name,
      },
    });

    // In-app celebration notification for Guardian
    try {
      const guardianLink = await prisma.guardianStudent.findFirst({
        where: { studentId },
        include: { guardian: { select: { userId: true } } },
      });
      if (guardianLink?.guardian?.userId) {
        await prisma.notification.create({
          data: {
            recipientUserId: guardianLink.guardian.userId,
            type: "FINANCE",
            title: isOrphan ? `[এতিম লিল্লাহ ১০০% ফ্রি বৃত্তি মঞ্জুর]` : `[বিশেষ বেতন ছাড় মঞ্জুর]`,
            body: isOrphan
              ? `মুহতামিম মহোদয় কর্তৃক আপনার সন্তানকে এতিম লিল্লাহ তহবিলের আওতায় ১০০% বিনামূল্যে পড়ার বিশেষ বৃত্তি মঞ্জুর করা হয়েছে।`
              : `মুহতামিম মহোদয় কর্তৃক আপনার সন্তানের জন্য বিশেষ মাসিক বেতন ছাড় / কাস্টম ফি কার্যকর করা হয়েছে।`,
            actionUrl: "/portal?tab=FINANCE",
            priority: "IMPORTANT",
            channel: "PORTAL",
          },
        });
      }
    } catch (notErr) {
      console.warn("Guardian notification warning:", notErr);
    }

    return NextResponse.json({
      success: true,
      message: "শিক্ষার্থীর বেতন ছাড় ও কাস্টম ফি সফলভাবে কার্যকর হয়েছে। অ্যাডমিন প্যানেলে অবিলম্বে হালনাগাদ হবে।",
      data: createdAssistance,
    });
  } catch (error: any) {
    console.error("Principal Waivers POST error:", error);
    return NextResponse.json({ error: error.message || "বেতন ছাড় প্রক্রিয়াকরণে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
