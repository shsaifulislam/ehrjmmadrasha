import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { createResidentialEnrollment } from "@/lib/hostelEngine";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/hostel/residents
 * Lists residents and students with search, filters (residentialStatus, status, classId, sessionId), and pagination.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const residentialStatus = searchParams.get("residentialStatus") || ""; // RESIDENTIAL, NON_RESIDENTIAL, DAY_CARE
    const enrollmentStatus = searchParams.get("enrollmentStatus") || ""; // CHECKED_IN, APPROVED, CHECKED_OUT
    const classId = searchParams.get("classId") || "";
    const sessionId = searchParams.get("sessionId") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {
      status: "ACTIVE",
    };

    if (residentialStatus) {
      where.residentialStatus = residentialStatus;
    }

    if (search) {
      where.OR = [
        { fullNameBn: { contains: search } },
        { fullNameEn: { contains: search } },
        { studentIdNumber: { contains: search } },
        { fatherPhone: { contains: search } },
      ];
    }

    if (classId || sessionId) {
      where.enrollments = {
        some: {
          status: "ACTIVE",
          ...(classId ? { classId } : {}),
          ...(sessionId ? { sessionId } : {}),
        },
      };
    }

    if (enrollmentStatus) {
      where.residentialEnrollments = {
        some: {
          status: enrollmentStatus,
          ...(sessionId ? { sessionId } : {}),
        },
      };
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
            include: { jamatClass: true, section: true, session: true },
            take: 1,
          },
          residentialEnrollments: {
            orderBy: { createdAt: "desc" },
            include: { session: true },
            take: 1,
          },
          guardianLinks: {
            include: { guardian: true },
            take: 1,
          },
        },
        orderBy: { studentIdNumber: "asc" },
        skip,
        take: limit,
      }),
      prisma.student.count({ where }),
    ]);

    const formatted = students.map((s) => ({
      id: s.id,
      studentIdNumber: s.studentIdNumber,
      fullNameBn: s.fullNameBn,
      fullNameEn: s.fullNameEn,
      photoUrl: s.photoUrl,
      residentialStatus: s.residentialStatus,
      class: s.enrollments[0]?.jamatClass?.nameBn || "N/A",
      section: s.enrollments[0]?.section?.nameBn || "N/A",
      rollNumber: s.enrollments[0]?.rollNumber || "N/A",
      session: s.enrollments[0]?.session?.name || "N/A",
      guardianName: s.guardianLinks[0]?.guardian?.fullNameBn || s.fatherNameBn,
      guardianPhone: s.guardianLinks[0]?.guardian?.phone || s.fatherPhone,
      currentEnrollment: s.residentialEnrollments[0] || null,
    }));

    return NextResponse.json({
      success: true,
      students: formatted,
      residents: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/hostel/residents error:", error);
    return NextResponse.json(
      { error: error.message || "শিক্ষার্থী তালিকা সংগ্রহে ত্রুটি ঘটেছে।" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/hostel/residents
 * Create or assign residential enrollment for a student.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন হোস্টেল ভর্তি করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const {
      studentId,
      sessionId,
      residentialStatus = "RESIDENTIAL",
      roomOrWardLabel,
      bedOrSeatLabel,
      expectedEndDate,
      notes,
      autoCheckIn = false,
    } = body;

    if (!studentId) {
      return NextResponse.json({ error: "শিক্ষার্থী আইডি আবশ্যক।" }, { status: 400 });
    }

    const enrollment = await createResidentialEnrollment({
      studentId,
      sessionId,
      residentialStatus,
      roomOrWardLabel,
      bedOrSeatLabel,
      expectedEndDate: expectedEndDate ? new Date(expectedEndDate) : undefined,
      notes,
      adminUserId: user.userId,
      autoCheckIn,
    });

    return NextResponse.json({
      success: true,
      message: autoCheckIn ? "আবাসিক ভর্তি ও চেক-ইন সফলভাবে সম্পন্ন হয়েছে।" : "আবাসিক ভর্তি সফলভাবে সম্পন্ন হয়েছে।",
      enrollment,
    });
  } catch (error: any) {
    console.error("POST /api/admin/hostel/residents error:", error);
    return NextResponse.json(
      { error: error.message || "আবাসিক ভর্তিতে সমস্যা হয়েছে।" },
      { status: 400 }
    );
  }
}
