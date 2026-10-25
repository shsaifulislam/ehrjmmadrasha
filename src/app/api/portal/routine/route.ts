import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClassRoutineSlots } from "@/lib/calendar/calendarStore";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    const allowedRoles = ["GUARDIAN", "STUDENT", "ADMIN", "SUPER_ADMIN", "PRINCIPAL"];
    if (!user || !allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let studentId = searchParams.get("studentId");

    if (user.role === "STUDENT") {
      const studentProfile = await prisma.student.findFirst({
        where: {
          OR: [
            { studentIdNumber: user.username },
            { id: user.userId },
          ],
        },
      });
      if (!studentProfile) {
        return NextResponse.json({ error: "শিক্ষার্থী প্রোফাইল পাওয়া যায়নি।" }, { status: 404 });
      }
      studentId = studentProfile.id;
    } else if (user.role === "GUARDIAN") {
      const guardian = await prisma.guardian.findFirst({
        where: { userId: user.userId }
      });

      if (!guardian) {
        return NextResponse.json({ error: "অভিভাবক প্রোফাইল পাওয়া যায়নি।" }, { status: 404 });
      }

      if (!studentId) {
        return NextResponse.json({ error: "studentId আবশ্যক।" }, { status: 400 });
      }

      // IDOR Protection: Verify Guardian owns this student
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
    } else {
      // ADMIN, PRINCIPAL, SUPER_ADMIN
      if (!studentId) {
        return NextResponse.json({ error: "studentId আবশ্যক।" }, { status: 400 });
      }
    }

    // Find student's active enrollment
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: {
            jamatClass: true,
            section: true,
            session: true
          },
          orderBy: { enrolledAt: "desc" },
          take: 1
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: "শিক্ষার্থী পাওয়া যায়নি।" }, { status: 404 });
    }

    const activeEnrollment = student.enrollments[0];
    if (!activeEnrollment) {
      return NextResponse.json({
        success: true,
        data: {
          student: {
            id: student.id,
            fullNameBn: student.fullNameBn,
            studentIdNumber: student.studentIdNumber
          },
          enrollment: null,
          todaySlots: [],
          weeklySlots: []
        }
      });
    }

    const classId = activeEnrollment.classId;
    const sectionId = activeEnrollment.sectionId;

    // Load active routine slots from institutional calendar store
    const allSlots = getClassRoutineSlots().filter((s) => s.status === "ACTIVE");

    // Match classId and optional sectionId
    let studentSlots = allSlots.filter((slot) => {
      if (slot.classId !== classId) return false;
      if (slot.sectionId && sectionId && slot.sectionId !== sectionId) return false;
      return true;
    });

    // Sort by dayOfWeek, then startTime
    studentSlots.sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      return a.startTime.localeCompare(b.startTime);
    });

    // Today's dayOfWeek (JS Date: 0=Sunday, 1=Monday... 6=Saturday)
    const today = new Date();
    const todayDayOfWeek = today.getDay();
    const todaySlots = studentSlots.filter((s) => s.dayOfWeek === todayDayOfWeek);

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student.id,
          fullNameBn: student.fullNameBn,
          studentIdNumber: student.studentIdNumber
        },
        enrollment: {
          classNameBn: activeEnrollment.jamatClass?.nameBn || "শ্রেণি অনির্ধারিত",
          sectionNameBn: activeEnrollment.section?.nameBn || "শাখা অনির্ধারিত",
          rollNumber: activeEnrollment.rollNumber,
          sessionName: activeEnrollment.session?.name || "সক্রিয় শিক্ষাবর্ষ"
        },
        todayDayOfWeek,
        todaySlots,
        weeklySlots: studentSlots
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "রুটিন লোড করতে ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
