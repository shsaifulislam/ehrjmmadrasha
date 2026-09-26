import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code?.trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ error: "ভেরিফিকেশন কোড আবশ্যক।" }, { status: 400 });
    }

    const result = await prisma.result.findUnique({
      where: { verificationCode: code },
      include: {
        student: {
          select: {
            id: true,
            studentIdNumber: true,
            fullNameBn: true,
            fullNameEn: true,
          },
        },
        exam: {
          include: {
            session: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!result || result.status !== "PUBLISHED") {
      return NextResponse.json(
        {
          isValid: false,
          error: "প্রদত্ত কোডের সাথে সামঞ্জস্যপূর্ণ কোনো বৈধ বা প্রকাশিত ফলাফল পাওয়া যায়নি।",
        },
        { status: 404 }
      );
    }

    // Safely extract from snapshot or current record without exposing ANY guardian or finance data
    let snapshotData = null;
    if (result.snapshotJson) {
      try {
        snapshotData = JSON.parse(result.snapshotJson);
      } catch {}
    }

    const verificationInfo = {
      isValid: true,
      verificationCode: result.verificationCode,
      institution: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা",
      studentNameBn: result.student.fullNameBn,
      studentNameEn: result.student.fullNameEn,
      studentIdNumber: result.student.studentIdNumber,
      rollNumber: result.rollNumber || snapshotData?.academic?.rollNumber || null,
      classNameBn: snapshotData?.academic?.classNameBn || "নির্ধারিত",
      examNameBn: result.exam.nameBn,
      examNameEn: result.exam.nameEn,
      sessionYear: result.exam.session.name,
      sessionNameBn: result.exam.session.name,
      isPassed: result.isPassed,
      finalGradeBn: result.finalGradeBn,
      finalGradeEn: result.finalGradeEn,
      publishedAt: result.publishedAt,
      // Minimal academic subject breakdown for authentic verification (without financial/guardian links)
      subjects: snapshotData?.result?.subjects?.map((s: any) => ({
        subjectNameBn: s.subjectNameBn,
        fullMarks: s.fullMarks,
        obtainedMarks: s.marksObtained,
        gradeBn: s.gradeBn,
        isPassed: s.isPassed,
      })) || [],
    };

    return NextResponse.json({ verification: verificationInfo });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার এরর" }, { status: 500 });
  }
}
