import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/portal/children
 * Returns the children linked to the currently logged-in Guardian.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "লগইন করা আবশ্যক।" }, { status: 401 });
    }

    if (user.role === "GUARDIAN") {
      const guardian = await prisma.guardian.findFirst({
        where: {
          OR: [{ userId: user.userId }, { email: user.email }],
        },
        include: {
          students: {
            include: {
              student: {
                include: {
                  enrollments: {
                    where: { status: "ACTIVE" },
                    include: { jamatClass: true, section: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!guardian) {
        return NextResponse.json({ children: [] });
      }

      const children = guardian.students.map((gs) => ({
        id: gs.student.id,
        studentIdNumber: gs.student.studentIdNumber,
        fullNameBn: gs.student.fullNameBn,
        fullNameEn: gs.student.fullNameEn,
        residentialStatus: gs.student.residentialStatus,
        photoUrl: gs.student.photoUrl,
        className: gs.student.enrollments[0]?.jamatClass?.nameBn || null,
        sectionName: gs.student.enrollments[0]?.section?.nameBn || null,
        rollNumber: gs.student.enrollments[0]?.rollNumber || null,
      }));

      return NextResponse.json({ success: true, children });
    }

    // If Admin or Teacher is browsing portal, return the first active students for convenience
    if (user.role === "ADMIN" || user.role === "TEACHER" || user.role === "PRINCIPAL") {
      const activeEnrollments = await prisma.enrollment.findMany({
        where: { status: "ACTIVE" },
        take: 10,
        include: {
          student: true,
          jamatClass: true,
          section: true,
        },
        orderBy: { rollNumber: "asc" },
      });

      const children = activeEnrollments.map((e) => ({
        id: e.student.id,
        studentIdNumber: e.student.studentIdNumber,
        fullNameBn: e.student.fullNameBn,
        fullNameEn: e.student.fullNameEn,
        residentialStatus: e.student.residentialStatus,
        photoUrl: e.student.photoUrl,
        className: e.jamatClass?.nameBn || null,
        sectionName: e.section?.nameBn || null,
        rollNumber: e.rollNumber,
      }));

      return NextResponse.json({ success: true, children });
    }

    return NextResponse.json({ children: [] });
  } catch (error: any) {
    console.error("Portal children GET error:", error);
    return NextResponse.json({ error: error.message || "সন্তান তালিকা লোড ব্যর্থ।" }, { status: 500 });
  }
}
