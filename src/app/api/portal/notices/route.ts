import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Portal Targeted Notices API
 * Returns notices applicable to current logged-in user:
 * - Public notices
 * - Notices targeted to their role (ALL_GUARDIANS or ALL_TEACHERS)
 * - If GUARDIAN: notices targeted to classes/sections their linked children are enrolled in
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const now = new Date();

    let audienceConditions: any[] = [
      { audience: "PUBLIC" },
    ];

    if (user.role === "GUARDIAN") {
      audienceConditions.push({ audience: "ALL_GUARDIANS" });

      // Find all classes/sections where user's children are enrolled
      const guardian = await prisma.guardian.findFirst({
        where: { userId: user.userId },
        include: {
          students: {
            include: {
              student: {
                include: {
                  enrollments: {
                    where: { status: "ACTIVE" },
                    select: { classId: true, sectionId: true },
                  },
                },
              },
            },
          },
        },
      });

      if (guardian) {
        const classIds: string[] = [];
        const sectionIds: string[] = [];

        for (const gs of guardian.students) {
          for (const enr of gs.student.enrollments) {
            if (enr.classId) classIds.push(enr.classId);
            if (enr.sectionId) sectionIds.push(enr.sectionId);
          }
        }

        if (classIds.length > 0) {
          audienceConditions.push({
            audience: "CLASS",
            classId: { in: classIds },
          });
        }

        if (sectionIds.length > 0) {
          audienceConditions.push({
            audience: "SECTION",
            sectionId: { in: sectionIds },
          });
        }
      }
    } else if (user.role === "TEACHER") {
      audienceConditions.push({ audience: "ALL_TEACHERS" });
      audienceConditions.push({ audience: "ALL_STAFF" });
    } else if (user.role === "ADMIN" || user.role === "PRINCIPAL") {
      // Admins see all notices
      audienceConditions = [{}];
    }

    const where: any = {
      status: "PUBLISHED",
      isPublished: true,
      OR: audienceConditions,
      AND: [
        {
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      ],
    };

    if (category && category !== "ALL") {
      where.category = category;
    }

    const notices = await prisma.notice.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      take: 30,
      include: {
        jamatClass: { select: { id: true, nameBn: true } },
        section: { select: { id: true, nameBn: true } },
      },
    });

    return NextResponse.json({ success: true, notices, data: notices });
  } catch (error: any) {
    console.error("Portal Notices Error:", error);
    return NextResponse.json({ error: "নোটিশ লোড করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
