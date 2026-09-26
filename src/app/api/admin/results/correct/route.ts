import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import {
  calculateCandidateResult,
  calculateSubjectResult,
  validateMarksInput,
} from "@/lib/resultCalculationService";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন ফলাফল সংশোধন করতে পারেন।" }, { status: 401 });
    }

    const body = await req.json();
    const {
      examId,
      studentId,
      subjectId,
      newMarks,
      isAbsent = false,
      isExempt = false,
      correctionReason,
    } = body;

    if (!examId || !studentId || !subjectId || !correctionReason || !correctionReason.trim()) {
      return NextResponse.json(
        { error: "পরীক্ষা আইডি, শিক্ষার্থী আইডি, বিষয় আইডি এবং সংশোধনের কারণ (Correction Reason) উল্লেখ করা আবশ্যক।" },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { session: true },
    });
    if (!exam) {
      return NextResponse.json({ error: "পরীক্ষাটি পাওয়া যায়নি।" }, { status: 404 });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        sessionId: exam.sessionId,
      },
      include: { student: true, jamatClass: true, section: true },
    });
    if (!enrollment) {
      return NextResponse.json({ error: "শিক্ষার্থীর এনরোলমেন্ট রেকর্ড পাওয়া যায়নি।" }, { status: 404 });
    }

    const examSubject = await prisma.examSubject.findFirst({
      where: { examId, subjectId, classId: enrollment.classId },
      include: { subject: true },
    });
    if (!examSubject) {
      return NextResponse.json({ error: "উক্ত পরীক্ষায় এই বিষয়টি কনফিগার করা নেই।" }, { status: 404 });
    }

    // Validate new marks
    const validation = validateMarksInput(
      newMarks,
      examSubject.fullMarks,
      Boolean(isAbsent),
      Boolean(isExempt)
    );
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Find old mark
    const oldMarkRecord = await prisma.examMark.findUnique({
      where: {
        examId_studentId_subjectId: {
          examId,
          studentId,
          subjectId,
        },
      },
    });

    const oldMarksValue = oldMarkRecord?.marksObtained ?? (oldMarkRecord?.isAbsent ? "ABSENT" : "NONE");
    const newMarksValue = isAbsent ? "ABSENT" : isExempt ? "EXEMPT" : Number(newMarks);

    // Save corrected mark
    const marksObtainedNum = isAbsent || isExempt ? null : Number(newMarks);
    const subResult = calculateSubjectResult({
      subjectId,
      subjectNameBn: examSubject.subject.nameBn,
      subjectNameEn: examSubject.subject.nameEn,
      subjectCode: examSubject.subject.code,
      fullMarks: examSubject.fullMarks,
      passMarks: examSubject.passMarks,
      isOptional: examSubject.subject.isOptional,
      marksObtained: marksObtainedNum,
      isAbsent: Boolean(isAbsent),
      isExempt: Boolean(isExempt),
    });

    await prisma.examMark.upsert({
      where: {
        examId_studentId_subjectId: {
          examId,
          studentId,
          subjectId,
        },
      },
      create: {
        examId,
        studentId,
        subjectId,
        classId: enrollment.classId,
        sectionId: enrollment.sectionId,
        marksObtained: marksObtainedNum,
        isAbsent: Boolean(isAbsent),
        isExempt: Boolean(isExempt),
        letterGrade: subResult.gradeBn,
        gradeRemarks: `সংশোধন: ${correctionReason.trim()}`,
        status: "SUBMITTED",
        recordedByUserId: user.userId,
      },
      update: {
        marksObtained: marksObtainedNum,
        isAbsent: Boolean(isAbsent),
        isExempt: Boolean(isExempt),
        letterGrade: subResult.gradeBn,
        gradeRemarks: `সংশোধন: ${correctionReason.trim()}`,
        status: "SUBMITTED",
        recordedByUserId: user.userId,
      },
    });

    // Recalculate candidate result
    const allExamSubjects = await prisma.examSubject.findMany({
      where: { examId, classId: enrollment.classId },
      include: { subject: true },
    });

    const allMarks = await prisma.examMark.findMany({
      where: { examId, studentId },
    });

    const subjectResultsInput = allExamSubjects.map((es) => {
      const mark = allMarks.find((m) => m.subjectId === es.subjectId);
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

    const recalculated = calculateCandidateResult({
      studentId: enrollment.student.id,
      studentIdNumber: enrollment.student.studentIdNumber,
      fullNameBn: enrollment.student.fullNameBn,
      fullNameEn: enrollment.student.fullNameEn,
      rollNumber: enrollment.rollNumber,
      classNameBn: enrollment.jamatClass.nameBn,
      sectionNameBn: enrollment.section?.nameBn,
      subjectResults: subjectResultsInput,
    });

    // Update Result record if exists
    const existingResult = await prisma.result.findUnique({
      where: { examId_studentId: { examId, studentId } },
    });

    if (existingResult) {
      // Build updated snapshot
      const updatedSnapshot = {
        student: {
          id: enrollment.student.id,
          studentIdNumber: enrollment.student.studentIdNumber,
          fullNameBn: enrollment.student.fullNameBn,
          fullNameEn: enrollment.student.fullNameEn,
          fatherNameBn: enrollment.student.fatherNameBn,
        },
        academic: {
          sessionId: exam.sessionId,
          sessionYear: exam.session.name,
          classId: enrollment.classId,
          classNameBn: enrollment.jamatClass.nameBn,
          rollNumber: enrollment.rollNumber,
        },
        exam: {
          id: exam.id,
          nameBn: exam.nameBn,
        },
        result: {
          totalFullMarks: recalculated.totalFullMarks,
          totalObtained: recalculated.totalObtained,
          percentage: recalculated.percentage,
          finalGradeBn: recalculated.finalGradeBn,
          finalGradeEn: recalculated.finalGradeEn,
          letterGrade: recalculated.letterGrade,
          isPassed: recalculated.isPassed,
          subjects: recalculated.subjects,
        },
        correctionHistory: {
          correctedAt: new Date(),
          correctedByUserId: user.userId,
          reason: correctionReason.trim(),
          oldMarks: oldMarksValue,
          newMarks: newMarksValue,
        },
        verificationCode: existingResult.verificationCode,
        publishedAt: existingResult.publishedAt,
      };

      await prisma.result.update({
        where: { id: existingResult.id },
        data: {
          totalMarks: recalculated.totalObtained,
          totalObtained: recalculated.totalObtained,
          totalFullMarks: recalculated.totalFullMarks,
          percentage: recalculated.percentage,
          finalGradeBn: recalculated.finalGradeBn,
          finalGradeEn: recalculated.finalGradeEn,
          isPassed: recalculated.isPassed,
          correctionReason: correctionReason.trim(),
          snapshotJson: JSON.stringify(updatedSnapshot),
        },
      });
    }

    await recordAuditLog({
      userId: user.userId,
      action: "RESULT_MARKS_CORRECTED",
      entityType: "Result",
      entityId: existingResult?.id || `${examId}-${studentId}`,
      details: {
        examId,
        studentId,
        subjectId,
        oldMarks: oldMarksValue,
        newMarks: newMarksValue,
        correctionReason: correctionReason.trim(),
        actorUserId: user.userId,
      },
    });

    return NextResponse.json({
      message: "নম্বর সফলভাবে সংশোধন ও ফলাফল পুনর্গণনা সম্পন্ন হয়েছে।",
      recalculated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার এরর" }, { status: 500 });
  }
}
