import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/teacher/hostel
 * Teachers view student residential statuses for their assigned classes.
 * Read-only access: Zero fee, private guardian, or mutation endpoints exposed.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "TEACHER") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র শিক্ষকদের জন্য প্রযোজ্য।" }, { status: 403 });
    }

    // 1. Fetch teacher assignments
    const assignments = await prisma.teacherAssignment.findMany({
      where: { teacherId: user.userId },
      select: { classId: true, sectionId: true, sessionId: true },
    });

    if (assignments.length === 0) {
      return NextResponse.json({ success: true, students: [] });
    }

    const classIds = Array.from(new Set(assignments.map((a) => a.classId)));

    // 2. Fetch active students in teacher's assigned classes
    const students = await prisma.student.findMany({
      where: {
        status: "ACTIVE",
        enrollments: {
          some: {
            classId: { in: classIds },
            status: "ACTIVE",
          },
        },
      },
      select: {
        id: true,
        studentIdNumber: true,
        fullNameBn: true,
        fullNameEn: true,
        residentialStatus: true, // RESIDENTIAL, NON_RESIDENTIAL, DAY_CARE
        enrollments: {
          where: { status: "ACTIVE" },
          select: {
            rollNumber: true,
            jamatClass: { select: { nameBn: true } },
            section: { select: { nameBn: true } },
          },
          take: 1,
        },
        residentialEnrollments: {
          where: { status: { in: ["CHECKED_IN", "ACTIVE"] } },
          select: {
            roomOrWardLabel: true,
            bedOrSeatLabel: true,
            checkInDate: true,
          },
          take: 1,
        },
      },
      orderBy: { studentIdNumber: "asc" },
    });

    const formatted = students.map((s) => ({
      id: s.id,
      studentIdNumber: s.studentIdNumber,
      fullNameBn: s.fullNameBn,
      fullNameEn: s.fullNameEn,
      residentialStatus: s.residentialStatus,
      class: s.enrollments[0]?.jamatClass?.nameBn || "N/A",
      section: s.enrollments[0]?.section?.nameBn || "N/A",
      rollNumber: s.enrollments[0]?.rollNumber || "N/A",
      hostelInfo: s.residentialEnrollments[0] || null,
    }));

    return NextResponse.json({ success: true, students: formatted });
  } catch (error: any) {
    console.error("GET /api/teacher/hostel error:", error);
    return NextResponse.json(
      { error: error.message || "শিক্ষার্থীর আবাসিক তথ্য সংগ্রহে ত্রুটি ঘটেছে।" },
      { status: 500 }
    );
  }
}
