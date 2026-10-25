import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/teacher/classes
 * Scoped academic classes endpoint for Teachers.
 * Strict server-side authorization: Teachers can only view classes assigned to them.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র শিক্ষক প্রবেশ করতে পারেন।" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const targetClassId = searchParams.get("classId");

    if (user.role === "ADMIN" || user.role === "PRINCIPAL") {
      if (targetClassId) {
        const enrollments = await prisma.enrollment.findMany({
          where: { classId: targetClassId, status: "ACTIVE" },
          include: {
            student: {
              include: {
                guardianLinks: {
                  include: { guardian: true },
                },
              },
            },
            section: true,
            session: true,
          },
          orderBy: { rollNumber: "asc" },
        });

        const students = enrollments.map((en) => ({
          id: en.student.id,
          studentIdNumber: en.student.studentIdNumber,
          fullNameBn: en.student.fullNameBn,
          fullNameEn: en.student.fullNameEn,
          rollNumber: en.rollNumber,
          bloodGroup: en.student.bloodGroup || "জানা নেই",
          residentialStatus: en.student.residentialStatus,
          sectionName: en.section?.nameBn || "ক শাখা",
          photoUrl: en.student.photoUrl,
          guardianName: en.student.guardianLinks[0]?.guardian?.fullNameBn || en.student.fatherNameBn || "অভিভাবক",
          guardianPhone: en.student.guardianLinks[0]?.guardian?.phone || en.student.fatherPhone || "তথ্য নেই",
        }));

        return NextResponse.json({ success: true, students });
      }

      const classes = await prisma.jamatClass.findMany({
        where: { isActive: true },
        include: {
          sections: { orderBy: { nameBn: "asc" } },
        },
        orderBy: { sortOrder: "asc" },
      });
      return NextResponse.json({ success: true, classes });
    }

    // Teacher: query teacher assignments
    const assignments = await prisma.teacherAssignment.findMany({
      where: { teacherId: user.userId },
      select: {
        classId: true,
        sectionId: true,
      },
    });

    if (assignments.length === 0) {
      return NextResponse.json({ success: true, classes: [] });
    }

    const assignedClassIds = Array.from(new Set(assignments.map((a) => a.classId)));
    const assignedSectionIds = assignments
      .map((a) => a.sectionId)
      .filter((s): s is string => Boolean(s));

    if (targetClassId) {
      if (user.role === "TEACHER" && !assignedClassIds.includes(targetClassId)) {
        return NextResponse.json(
          { error: "অননুমোদিত অ্যাক্সেস। আপনি শুধুমাত্র আপনার অ্যাসাইনকৃত জামাতের শিক্ষার্থী দেখতে পারেন।" },
          { status: 403 }
        );
      }

      const enrollments = await prisma.enrollment.findMany({
        where: { classId: targetClassId, status: "ACTIVE" },
        include: {
          student: {
            include: {
              guardianLinks: {
                include: { guardian: true },
              },
            },
          },
          section: true,
          session: true,
        },
        orderBy: { rollNumber: "asc" },
      });

      const students = enrollments.map((en) => ({
        id: en.student.id,
        studentIdNumber: en.student.studentIdNumber,
        fullNameBn: en.student.fullNameBn,
        fullNameEn: en.student.fullNameEn,
        rollNumber: en.rollNumber,
        bloodGroup: en.student.bloodGroup || "জানা নেই",
        residentialStatus: en.student.residentialStatus,
        sectionName: en.section?.nameBn || "ক শাখা",
        photoUrl: en.student.photoUrl,
        guardianName: en.student.guardianLinks[0]?.guardian?.fullNameBn || en.student.fatherNameBn || "অভিভাবক",
        guardianPhone: en.student.guardianLinks[0]?.guardian?.phone || en.student.fatherPhone || "তথ্য নেই",
      }));

      return NextResponse.json({ success: true, students });
    }

    const classes = await prisma.jamatClass.findMany({
      where: {
        id: { in: assignedClassIds },
        isActive: true,
      },
      include: {
        sections: {
          where: assignedSectionIds.length > 0
            ? {
                OR: [
                  { id: { in: assignedSectionIds } },
                  // If teacher has class assignment with null sectionId, include all sections of that class
                  { classId: { in: assignments.filter((a) => !a.sectionId).map((a) => a.classId) } },
                ],
              }
            : undefined,
          orderBy: { nameBn: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ success: true, classes });
  } catch (error: any) {
    console.error("GET /api/teacher/classes error:", error);
    return NextResponse.json({ error: "শ্রেণি তালিকা লোড করতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
