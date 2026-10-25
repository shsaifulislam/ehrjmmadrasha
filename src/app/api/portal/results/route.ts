import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। অনুগ্রহ করে লগইন করুন।" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const examId = searchParams.get("examId");

    if (!studentId) {
      return NextResponse.json({ error: "শিক্ষার্থী নির্বাচন আবশ্যক।" }, { status: 400 });
    }

    // 1. RBAC & IDOR Protection: If GUARDIAN role, ensure linked child
    if (user.role === "GUARDIAN") {
      const guardian = await prisma.guardian.findFirst({
        where: { userId: user.userId },
        include: {
          students: { where: { studentId } },
        },
      });

      if (!guardian || guardian.students.length === 0) {
        return NextResponse.json(
          { error: "নিরাপত্তা সতর্কতা: আপনি শুধুমাত্র আপনার নিবন্ধিত সন্তানের ফলাফল দেখার অনুমতিপ্রাপ্ত।" },
          { status: 403 }
        );
      }
    } else if (user.role === "STUDENT") {
      const student = await prisma.student.findFirst({
        where: {
          OR: [
            { studentIdNumber: user.username },
            { id: studentId },
          ],
        },
      });
      if (!student || (student.id !== studentId && student.studentIdNumber !== user.username)) {
        return NextResponse.json(
          { error: "নিরাপত্তা সতর্কতা: আপনি শুধুমাত্র নিজের পরীক্ষার ফলাফল দেখার অনুমতিপ্রাপ্ত।" },
          { status: 403 }
        );
      }
    }

    // 2. Fetch student profile
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: {
            jamatClass: true,
            section: true,
            session: true,
          },
          take: 1,
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "শিক্ষার্থী পাওয়া যায়নি।" }, { status: 404 });
    }

    // 3. Fetch ONLY PUBLISHED results for this student (Draft results strictly hidden from Guardian)
    const results = await prisma.result.findMany({
      where: {
        studentId,
        status: "PUBLISHED",
        ...(examId ? { examId } : {}),
      },
      include: {
        exam: {
          include: { session: true },
        },
      },
      orderBy: { publishedAt: "desc" },
    });

    const formattedResults = results.map((r) => {
      let parsedSnapshot = null;
      if (r.snapshotJson) {
        try {
          parsedSnapshot = JSON.parse(r.snapshotJson);
        } catch {}
      }

      return {
        id: r.id,
        examId: r.examId,
        examNameBn: r.exam.nameBn,
        examNameEn: r.exam.nameEn,
        sessionNameBn: r.exam.session.name,
        sessionYear: r.exam.session.name,
        totalObtained: r.totalObtained,
        totalFullMarks: r.totalFullMarks,
        percentage: r.percentage,
        finalGradeBn: r.finalGradeBn,
        finalGradeEn: r.finalGradeEn,
        isPassed: r.isPassed,
        publishedAt: r.publishedAt,
        verificationCode: r.verificationCode,
        snapshot: parsedSnapshot,
      };
    });

    return NextResponse.json({
      student: {
        id: student.id,
        studentIdNumber: student.studentIdNumber,
        fullNameBn: student.fullNameBn,
        fullNameEn: student.fullNameEn,
        className: student.enrollments[0]?.jamatClass.nameBn || "অজানা",
        sectionName: student.enrollments[0]?.section?.nameBn || null,
        rollNumber: student.enrollments[0]?.rollNumber || 0,
        sessionYear: student.enrollments[0]?.session.name || "২০২৫-২০২৬",
      },
      results: formattedResults,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার এরর" }, { status: 500 });
  }
}
