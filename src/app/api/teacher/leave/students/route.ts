import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/teacher/leave/students
 * Allows teachers to view leave applications submitted by guardians of students in their assigned classes.
 * POST /api/teacher/leave/students
 * Allows class teachers to review (recommend, approve, or add teacher note) to student leave requests.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস।" },
        { status: 403 }
      );
    }

    // 1. Find teacher's assigned classes
    const assignments = await prisma.teacherAssignment.findMany({
      where: user.role === "TEACHER" ? { teacherId: user.userId } : {},
      select: { classId: true, sectionId: true },
    });

    const classIds = Array.from(new Set(assignments.map((a) => a.classId)));

    if (user.role === "TEACHER" && classIds.length === 0) {
      return NextResponse.json({ success: true, requests: [] });
    }

    // 2. Find enrolled students in these classes
    const enrollments = await prisma.enrollment.findMany({
      where: {
        ...(classIds.length > 0 ? { classId: { in: classIds } } : {}),
        status: "ACTIVE",
      },
      select: {
        studentId: true,
        rollNumber: true,
        jamatClass: { select: { nameBn: true } },
        section: { select: { nameBn: true } },
      },
    });

    const studentMap = new Map();
    enrollments.forEach((en) => {
      studentMap.set(en.studentId, {
        rollNumber: en.rollNumber,
        className: en.jamatClass?.nameBn || "N/A",
        sectionName: en.section?.nameBn || "N/A",
      });
    });

    const studentIds = Array.from(studentMap.keys());
    if (studentIds.length === 0) {
      return NextResponse.json({ success: true, requests: [] });
    }

    // 3. Find leave requests for these students
    const requests = await prisma.studentLeaveRequest.findMany({
      where: { studentId: { in: studentIds } },
      include: {
        student: {
          select: {
            id: true,
            fullNameBn: true,
            studentIdNumber: true,
            photoUrl: true,
          },
        },
        guardian: {
          select: {
            fullNameBn: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedRequests = requests.map((r) => {
      const classInfo = studentMap.get(r.studentId) || {};
      return {
        id: r.id,
        studentId: r.studentId,
        studentName: r.student.fullNameBn,
        studentIdNumber: r.student.studentIdNumber,
        photoUrl: r.student.photoUrl,
        rollNumber: classInfo.rollNumber || "১",
        className: classInfo.className || "N/A",
        sectionName: classInfo.sectionName || "N/A",
        guardianName: r.guardian.fullNameBn,
        guardianPhone: r.guardian.phone,
        startDate: r.startDate.toISOString(),
        endDate: r.endDate.toISOString(),
        reason: r.reason,
        status: r.status,
        adminNote: r.adminNote,
        createdAt: r.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      requests: formattedRequests,
    });
  } catch (error: any) {
    console.error("GET /api/teacher/leave/students error:", error);
    return NextResponse.json(
      { error: error.message || "শিক্ষার্থীদের ছুটির তালিকা লোড করতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { requestId, status, teacherNote } = await req.json();
    if (!requestId || !status) {
      return NextResponse.json({ error: "অনুরোধ আইডি ও স্ট্যাটাস আবশ্যক।" }, { status: 400 });
    }

    const updated = await prisma.studentLeaveRequest.update({
      where: { id: requestId },
      data: {
        status,
        adminNote: teacherNote || undefined,
        reviewedBy: user.name || user.username,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "ছুটির আবেদন পর্যালোচনা সম্পন্ন হয়েছে।",
      data: updated,
    });
  } catch (error: any) {
    console.error("POST /api/teacher/leave/students error:", error);
    return NextResponse.json(
      { error: error.message || "পর্যালোচনা সংরক্ষণ ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
