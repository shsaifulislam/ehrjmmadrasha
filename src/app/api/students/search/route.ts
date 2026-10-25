import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    // Rate limit: 20 searches per minute per IP to prevent scraping
    const rateLimit = checkRateLimit(`search:${ip}`, 20, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "অনুগ্রহ করে ১ মিনিট পর আবার অনুসন্ধান করুন।" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { classId, dob } = body;
    const rollOrId = body.rollOrId || body.rollNumber;

    if (!rollOrId) {
      return NextResponse.json(
        { error: "রোল অথবা শিক্ষার্থী আইডি নম্বর দেওয়া আবশ্যক।" },
        { status: 400 }
      );
    }

    const trimmedInput = String(rollOrId).trim();
    const parsedRoll = parseInt(trimmedInput, 10);

    // Build search query safely with Prisma parameterized query
    let student = null;

    if (trimmedInput.startsWith("EHRJ-")) {
      // Search by exact Student ID Number
      student = await prisma.student.findUnique({
        where: { studentIdNumber: trimmedInput },
        include: {
          enrollments: {
            include: {
              jamatClass: true,
              section: true,
              session: true,
            },
          },
          results: {
            include: {
              exam: true,
            },
          },
        },
      });
    } else if (!isNaN(parsedRoll)) {
      // Search by Roll Number (and Class if selected)
      const enrollmentWhere: Record<string, unknown> = {
        rollNumber: parsedRoll,
      };

      if (classId) {
        enrollmentWhere.classId = classId;
      }

      const enrollment = await prisma.enrollment.findFirst({
        where: enrollmentWhere,
        include: {
          student: {
            include: {
              enrollments: {
                include: {
                  jamatClass: true,
                  section: true,
                  session: true,
                },
              },
              results: {
                include: {
                  exam: true,
                },
              },
            },
          },
        },
      });

      if (enrollment) {
        student = enrollment.student;
      }
    }

    if (!student) {
      return NextResponse.json(
        { error: "প্রদত্ত রোল/আইডি নম্বরে কোনো শিক্ষার্থীর তথ্য পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    // Optional DOB verification if provided
    if (dob) {
      const studentDobStr = new Date(student.dateOfBirth).toISOString().split("T")[0];
      if (studentDobStr !== dob) {
        return NextResponse.json(
          { error: "প্রদত্ত জন্ম তারিখের সাথে শিক্ষার্থীর তথ্য মেলেনি।" },
          { status: 400 }
        );
      }
    }

    // Privacy-Safe Public Verification Data (Strictly NO financial dues, phone numbers, or private ledger data)
    const latestEnrollment = student.enrollments[0];

    // Real Attendance Statistics
    const attendances = await prisma.attendance.findMany({
      where: { studentId: student.id },
      select: { status: true },
    });
    const totalAttendanceDays = attendances.length;
    const presentDays = attendances.filter(
      (a) => a.status === "PRESENT" || a.status === "LATE"
    ).length;
    const attendancePercentage =
      totalAttendanceDays > 0
        ? Math.round((presentDays / totalAttendanceDays) * 100)
        : null;

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        studentIdNumber: student.studentIdNumber,
        fullNameBn: student.fullNameBn,
        fullNameEn: student.fullNameEn,
        gender: student.gender,
        residentialStatus: student.residentialStatus,
        className: latestEnrollment?.jamatClass?.nameBn || "নির্ধারিত নয়",
        sectionName: latestEnrollment?.section?.nameBn || "ক শাখা",
        rollNumber: latestEnrollment?.rollNumber || 1,
        sessionName: latestEnrollment?.session?.name || "২০২৫-২০২৬",
        fatherName: student.fatherNameBn,
        verificationStatus: "VERIFIED_ACTIVE",
        attendanceStats: {
          total: totalAttendanceDays,
          present: presentDays,
          percentage: attendancePercentage,
        },
        results: student.results.map((r) => ({
          id: r.id,
          examName: r.exam.nameBn,
          totalMarks: r.totalMarks,
          percentage: r.percentage,
          grade: r.finalGradeBn,
          isPassed: r.isPassed,
          rankInClass: r.rankInClass,
          verificationCode: r.verificationCode,
          publishedAt: r.publishedAt,
        })),
      },
    });
  } catch (error) {
    console.error("Student Search API Error:", error);
    return NextResponse.json(
      { error: "তথ্য অনুসন্ধানে সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।" },
      { status: 500 }
    );
  }
}
