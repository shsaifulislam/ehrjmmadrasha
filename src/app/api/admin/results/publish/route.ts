import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import {
  calculateCandidateResult,
  generateResultVerificationCode,
} from "@/lib/resultCalculationService";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    const body = await req.json();
    const { examId, classId, forcePublish = false } = body;

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

    // 1. Fetch Exam Subjects
    const examSubjects = await prisma.examSubject.findMany({
      where: {
        examId,
        ...(classId ? { classId } : {}),
      },
      include: { subject: true, jamatClass: true },
    });

    if (examSubjects.length === 0) {
      return NextResponse.json(
        { error: "এই পরীক্ষায় কোনো বিষয় কনফিগার করা হয়নি। ফলাফল প্রকাশ করা সম্ভব নয়।" },
        { status: 400 }
      );
    }

    // 2. Fetch Active Enrolled Students
    const enrollments = await prisma.enrollment.findMany({
      where: {
        sessionId: exam.sessionId,
        ...(classId ? { classId } : {}),
        status: "ACTIVE",
      },
      orderBy: { rollNumber: "asc" },
      include: {
        student: true,
        jamatClass: true,
        section: true,
      },
    });

    if (enrollments.length === 0) {
      return NextResponse.json(
        { error: "এই জামাত বা শিক্ষাবর্ষে কোনো সক্রিয় শিক্ষার্থী পাওয়া যায়নি।" },
        { status: 400 }
      );
    }

    const studentIds = enrollments.map((e) => e.studentId);
    const existingMarks = await prisma.examMark.findMany({
      where: {
        examId,
        studentId: { in: studentIds },
      },
    });

    const marksByStudent = new Map<string, any[]>();
    for (const m of existingMarks) {
      if (!marksByStudent.has(m.studentId)) {
        marksByStudent.set(m.studentId, []);
      }
      marksByStudent.get(m.studentId)!.push(m);
    }

    // Validation: check for missing marks
    const missingMarksIssues: string[] = [];
    for (const en of enrollments) {
      const studentMarks = marksByStudent.get(en.student.id) || [];
      const classSubjects = examSubjects.filter((es) => es.classId === en.classId);

      for (const cs of classSubjects) {
        if (!cs.subject.isOptional) {
          const m = studentMarks.find((sm) => sm.subjectId === cs.subjectId);
          if (!m || (m.marksObtained === null && !m.isAbsent && !m.isExempt)) {
            missingMarksIssues.push(
              `রোল ${en.rollNumber} (${en.student.fullNameBn}) - বিষয়: ${cs.subject.nameBn}`
            );
          }
        }
      }
    }

    if (missingMarksIssues.length > 0 && !forcePublish) {
      return NextResponse.json(
        {
          error: "নিম্নোক্ত শিক্ষার্থীদের আবশ্যিক বিষয়ের নম্বর এখনো এন্ট্রি সম্পন্ন হয়নি:",
          issues: missingMarksIssues.slice(0, 10),
          totalIssues: missingMarksIssues.length,
          canForcePublish: true,
        },
        { status: 422 }
      );
    }

    // 3. Fetch existing published results to ensure Double Publish Protection
    const existingResults = await prisma.result.findMany({
      where: {
        examId,
        studentId: { in: studentIds },
      },
    });
    const resultsMap = new Map(existingResults.map((r) => [r.studentId, r]));

    const publishedAt = new Date();
    let publishedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const en of enrollments) {
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

        // Double publish protection: reuse verification code if already assigned
        const existingRes = resultsMap.get(en.student.id);
        const verificationCode = existingRes?.verificationCode || generateResultVerificationCode();

        // Build frozen snapshot JSON
        const snapshot = {
          student: {
            id: en.student.id,
            studentIdNumber: en.student.studentIdNumber,
            fullNameBn: en.student.fullNameBn,
            fullNameEn: en.student.fullNameEn,
            fatherNameBn: en.student.fatherNameBn,
            presentAddress: en.student.presentAddress,
            photoUrl: en.student.photoUrl,
          },
          academic: {
            sessionId: exam.sessionId,
            sessionYear: exam.session.name,
            classId: en.classId,
            classNameBn: en.jamatClass.nameBn,
            classNameEn: en.jamatClass.nameEn,
            sectionId: en.sectionId,
            sectionNameBn: en.section?.nameBn || null,
            rollNumber: en.rollNumber,
          },
          exam: {
            id: exam.id,
            nameBn: exam.nameBn,
            nameEn: exam.nameEn,
            examType: exam.examType,
            startDate: exam.startDate,
            endDate: exam.endDate,
          },
          result: {
            totalFullMarks: calculated.totalFullMarks,
            totalObtained: calculated.totalObtained,
            percentage: calculated.percentage,
            finalGradeBn: calculated.finalGradeBn,
            finalGradeEn: calculated.finalGradeEn,
            letterGrade: calculated.letterGrade,
            isPassed: calculated.isPassed,
            subjects: calculated.subjects,
          },
          verificationCode,
          publishedAt: existingRes?.publishedAt || publishedAt,
          publishedByUserId: user.userId,
        };

        await tx.result.upsert({
          where: {
            examId_studentId: {
              examId,
              studentId: en.student.id,
            },
          },
          create: {
            examId,
            studentId: en.student.id,
            sessionId: exam.sessionId,
            classId: en.classId,
            rollNumber: en.rollNumber,
            totalMarks: calculated.totalObtained,
            totalObtained: calculated.totalObtained,
            totalFullMarks: calculated.totalFullMarks,
            percentage: calculated.percentage,
            finalGradeBn: calculated.finalGradeBn,
            finalGradeEn: calculated.finalGradeEn,
            isPassed: calculated.isPassed,
            status: "PUBLISHED",
            verificationCode,
            snapshotJson: JSON.stringify(snapshot),
            publishedAt: existingRes?.publishedAt || publishedAt,
          },
          update: {
            totalMarks: calculated.totalObtained,
            totalObtained: calculated.totalObtained,
            totalFullMarks: calculated.totalFullMarks,
            percentage: calculated.percentage,
            finalGradeBn: calculated.finalGradeBn,
            finalGradeEn: calculated.finalGradeEn,
            isPassed: calculated.isPassed,
            status: "PUBLISHED",
            snapshotJson: JSON.stringify(snapshot),
            publishedAt: existingRes?.publishedAt || publishedAt,
          },
        });

        publishedCount++;
      }

      // Update exam status to PUBLISHED
      await tx.exam.update({
        where: { id: examId },
        data: {
          status: "PUBLISHED",
          isPublished: true,
          publishedAt: exam.publishedAt || publishedAt,
        },
      });
    });

    await recordAuditLog({
      userId: user.userId,
      action: "EXAM_RESULTS_PUBLISHED",
      entityType: "Exam",
      entityId: examId,
      details: {
        examId,
        classId: classId || "ALL_CLASSES",
        publishedCount,
      },
    });

    return NextResponse.json({
      message: `${publishedCount} জন শিক্ষার্থীর ফলাফল সফলভাবে প্রকাশিত ও ভেরিফিকেশন কোডসহ সিলমোহরকৃত হয়েছে।`,
      publishedCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার এরর" }, { status: 500 });
  }
}
