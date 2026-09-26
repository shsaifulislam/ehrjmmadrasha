import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/teacher/attendance/assignments
 * Returns classes and sections assigned to the logged-in teacher.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র শিক্ষক এই তথ্য দেখতে পারেন।" },
        { status: 403 }
      );
    }

    const currentSession = await prisma.academicSession.findFirst({
      where: { isCurrent: true },
    });

    if (!currentSession) {
      return NextResponse.json({ assignments: [], currentSession: null });
    }

    // If Admin, they have access to all classes
    if (user.role === "ADMIN") {
      const allClasses = await prisma.jamatClass.findMany({
        where: { isActive: true },
        include: { sections: true },
        orderBy: { sortOrder: "asc" },
      });

      interface AssignmentItem {
        id: string;
        classId: string;
        classNameBn: string;
        sectionId: string | null;
        sectionNameBn: string;
        sessionId: string;
      }

      const adminAssignments: AssignmentItem[] = allClasses.flatMap((cls) => {
        if (cls.sections.length > 0) {
          return cls.sections.map((sec) => ({
            id: `admin_${cls.id}_${sec.id}`,
            classId: cls.id,
            classNameBn: cls.nameBn,
            sectionId: sec.id as string | null,
            sectionNameBn: sec.nameBn,
            sessionId: currentSession.id,
          }));
        }
        return [
          {
            id: `admin_${cls.id}_all`,
            classId: cls.id,
            classNameBn: cls.nameBn,
            sectionId: null,
            sectionNameBn: "সকল শাখা",
            sessionId: currentSession.id,
          },
        ];
      });

      return NextResponse.json({
        success: true,
        assignments: adminAssignments,
        currentSession,
      });
    }

    // For Teacher, query TeacherAssignment
    const assignments = await prisma.teacherAssignment.findMany({
      where: {
        teacherId: user.userId,
        sessionId: currentSession.id,
      },
      include: {
        section: true,
      },
    });

    // Fetch class details for these assignments
    const classIds = Array.from(new Set(assignments.map((a) => a.classId)));
    const classes = await prisma.jamatClass.findMany({
      where: { id: { in: classIds } },
    });
    const classMap = new Map(classes.map((c) => [c.id, c]));

    const formattedAssignments = assignments.map((a) => {
      const cls = classMap.get(a.classId);
      return {
        id: a.id,
        classId: a.classId,
        classNameBn: cls?.nameBn || "অজানা জামাত",
        sectionId: a.sectionId,
        sectionNameBn: a.section ? a.section.nameBn : "সকল শাখা",
        sessionId: a.sessionId,
      };
    });

    return NextResponse.json({
      success: true,
      assignments: formattedAssignments,
      currentSession,
    });
  } catch (error: any) {
    console.error("GET /api/teacher/attendance/assignments error:", error);
    return NextResponse.json(
      { error: "শিক্ষকের দায়িত্বপ্রাপ্ত জামাত লোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
