import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { calculateCandidateResult } from "@/lib/resultCalculationService";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");
    const classId = searchParams.get("classId");

    if (!examId) {
      return NextResponse.json({ error: "পরীক্ষা আইডি আবশ্যক।" }, { status: 400 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { session: true },
    });
    if (!exam) {
      return NextResponse.json({ error: "পরীক্ষাটি পাওয়া যায়নি।" }, { status: 404 });
    }

    // Fetch subjects for this exam / class
    const examSubjects = await prisma.examSubject.findMany({
      where: {
        examId,
        ...(classId ? { classId } : {}),
      },
      include: {
        subject: true,
        jamatClass: true,
      },
      orderBy: { examDate: "asc" },
    });

    // Fetch active enrolled students
    const enrollments = await prisma.enrollment.findMany({
      where: {
        sessionId: exam.sessionId,
        ...(classId ? { classId } : {}),
        status: "ACTIVE",
      },
      orderBy: [{ classId: "asc" }, { rollNumber: "asc" }],
      include: {
        student: {
          select: {
            id: true,
            studentIdNumber: true,
            fullNameBn: true,
            fullNameEn: true,
          },
        },
        jamatClass: { select: { id: true, nameBn: true, nameEn: true } },
        section: { select: { id: true, nameBn: true } },
      },
    });

    const studentIds = enrollments.map((e) => e.studentId);
    const existingMarks = await prisma.examMark.findMany({
      where: {
        examId,
        studentId: { in: studentIds },
      },
    });

    // Group marks by studentId
    const marksByStudent = new Map<string, any[]>();
    for (const m of existingMarks) {
      if (!marksByStudent.has(m.studentId)) {
        marksByStudent.set(m.studentId, []);
      }
      marksByStudent.get(m.studentId)!.push(m);
    }

    // Fetch existing Result records if published or saved
    const existingResults = await prisma.result.findMany({
      where: {
        examId,
        studentId: { in: studentIds },
      },
    });
    const resultsByStudent = new Map(existingResults.map((r) => [r.studentId, r]));

    // Build candidates review list
    let totalCandidates = enrollments.length;
    let passedCount = 0;
    let failedCount = 0;
    let pendingCount = 0;

    const candidates = enrollments.map((en) => {
      const studentMarks = marksByStudent.get(en.student.id) || [];
      const classSubjects = examSubjects.filter((es) => es.classId === en.classId);

      const subjectResultsInput = classSubjects.map((es) => {
        const mark = studentMarks.find((m) => m.subjectId === es.subjectId);
        return {
          subjectId: es.subjectId,
          subjectNameBn: es.subject.nameBn,
          subjectNameEn: es.subject.nameEn,
          subjectCode: es.subject.code,
          fullMarks: es.fullMarks,
          passMarks: es.passMarks,
          isOptional: es.subject.isOptional,
          marksObtained: mark?.marksObtained ?? null,
          isAbsent: mark?.isAbsent ?? false,
          isExempt: mark?.isExempt ?? false,
        };
      });

      const hasMissingMarks = subjectResultsInput.some(
        (s) => s.marksObtained === null && !s.isAbsent && !s.isExempt
      );

      const calculated = calculateCandidateResult({
        studentId: en.student.id,
        studentIdNumber: en.student.studentIdNumber,
        fullNameBn: en.student.fullNameBn,
        fullNameEn: en.student.fullNameEn,
        rollNumber: en.rollNumber,
        classNameBn: en.jamatClass.nameBn,
        sectionNameBn: en.section?.nameBn,
        subjectResults: subjectResultsInput,
      });

      const savedResult = resultsByStudent.get(en.student.id);

      if (hasMissingMarks) {
        pendingCount++;
      } else if (calculated.isPassed) {
        passedCount++;
      } else {
        failedCount++;
      }

      return {
        studentId: en.student.id,
        studentIdNumber: en.student.studentIdNumber,
        fullNameBn: en.student.fullNameBn,
        fullNameEn: en.student.fullNameEn,
        rollNumber: en.rollNumber,
        classId: en.classId,
        classNameBn: en.jamatClass.nameBn,
        sectionNameBn: en.section?.nameBn,
        hasMissingMarks,
        calculated,
        savedResult: savedResult
          ? {
              id: savedResult.id,
              status: savedResult.status,
              verificationCode: savedResult.verificationCode,
              publishedAt: savedResult.publishedAt,
            }
          : null,
      };
    });

    return NextResponse.json({
      exam: {
        id: exam.id,
        nameBn: exam.nameBn,
        nameEn: exam.nameEn,
        status: exam.status,
        isPublished: exam.isPublished,
      },
      summary: {
        totalCandidates,
        passedCount,
        failedCount,
        pendingCount,
      },
      subjects: examSubjects.map((es) => ({
        id: es.subject.id,
        classId: es.classId,
        classNameBn: es.jamatClass.nameBn,
        nameBn: es.subject.nameBn,
        nameEn: es.subject.nameEn,
        code: es.subject.code,
        fullMarks: es.fullMarks,
        passMarks: es.passMarks,
      })),
      candidates,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার এরর" }, { status: 500 });
  }
}
