import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import {
  calculateCandidateResult,
  generateResultVerificationCode,
  SubjectMarksCalculationInput,
} from "@/lib/resultCalculationService";

export const dynamic = "force-dynamic";

/**
 * GET /api/principal/academics/exams
 * Fetch examinations, jamat classes, teacher marks submission status,
 * live tabulation sheet, and published results.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "PRINCIPAL" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র মুহতামিম বা অ্যাডমিন প্রবেশ করতে পারেন।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");
    const classId = searchParams.get("classId");

    // 1. Fetch available exams and active jamat classes
    const [exams, classes] = await Promise.all([
      prisma.exam.findMany({
        include: { session: true },
        orderBy: { startDate: "desc" },
      }),
      prisma.jamatClass.findMany({
        where: { isActive: true },
        select: { id: true, nameBn: true, nameEn: true, code: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    const activeExamId = examId || (exams.length > 0 ? exams[0].id : null);
    const activeClassId = classId || (classes.length > 0 ? classes[0].id : null);

    if (!activeExamId || !activeClassId) {
      return NextResponse.json({
        success: true,
        data: {
          exams,
          classes,
          selectedExam: null,
          selectedClass: null,
          subjects: [],
          tabulation: [],
          stats: null,
        },
      });
    }

    const selectedExam = exams.find((e) => e.id === activeExamId) || null;
    const selectedClass = classes.find((c) => c.id === activeClassId) || null;

    if (!selectedExam || !selectedClass) {
      return NextResponse.json({ error: "পরীক্ষা বা জামাত পাওয়া যায়নি।" }, { status: 404 });
    }

    // 2. Fetch subjects for the selected class
    const subjects = await prisma.subject.findMany({
      where: { classId: activeClassId, isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    // 3. Fetch exam subjects to get custom fullMarks/passMarks if defined
    const examSubjects = await prisma.examSubject.findMany({
      where: { examId: activeExamId, classId: activeClassId },
    });
    const examSubjectMap = new Map(examSubjects.map((es) => [es.subjectId, es]));

    // 4. Fetch all active student enrollments for this class and exam session
    const enrollments = await prisma.enrollment.findMany({
      where: {
        sessionId: selectedExam.sessionId,
        classId: activeClassId,
        status: "ACTIVE",
      },
      include: {
        student: {
          select: {
            id: true,
            studentIdNumber: true,
            fullNameBn: true,
            fullNameEn: true,
            isOrphan: true,
            residentialStatus: true,
          },
        },
      },
      orderBy: { rollNumber: "asc" },
    });

    // 5. Fetch all marks entered for this exam and class
    const examMarks = await prisma.examMark.findMany({
      where: {
        examId: activeExamId,
        classId: activeClassId,
      },
    });

    // Build mark lookup: `${studentId}_${subjectId}` -> mark
    const markMap = new Map<string, any>();
    for (const m of examMarks) {
      markMap.set(`${m.studentId}_${m.subjectId}`, m);
    }

    // 6. Check existing Result table records
    const existingResults = await prisma.result.findMany({
      where: {
        examId: activeExamId,
        classId: activeClassId,
      },
    });
    const resultMap = new Map<string, any>();
    for (const r of existingResults) {
      resultMap.set(r.studentId, r);
    }

    // 7. Teacher submission tracker per subject
    const subjectTracking = subjects.map((sub) => {
      const subjectMarks = examMarks.filter((m) => m.subjectId === sub.id);
      const submittedCount = subjectMarks.filter((m) => m.status === "SUBMITTED").length;
      const draftCount = subjectMarks.filter((m) => m.status === "DRAFT").length;
      const isComplete = enrollments.length > 0 && submittedCount === enrollments.length;

      return {
        id: sub.id,
        nameBn: sub.nameBn,
        nameEn: sub.nameEn,
        code: sub.code,
        fullMarks: examSubjectMap.get(sub.id)?.fullMarks ?? sub.fullMarks ?? 100,
        passMarks: examSubjectMap.get(sub.id)?.passMarks ?? sub.passMarks ?? 33,
        totalEnrolled: enrollments.length,
        submittedCount,
        draftCount,
        isComplete,
      };
    });

    // 8. Tabulate live results for each student
    const rawTabulation = enrollments.map((en) => {
      const student = en.student;
      const subjectCalculations: SubjectMarksCalculationInput[] = subjects.map((sub) => {
        const mark = markMap.get(`${student.id}_${sub.id}`);
        const config = examSubjectMap.get(sub.id);
        const fullMarks = config?.fullMarks ?? sub.fullMarks ?? 100;
        const passMarks = config?.passMarks ?? sub.passMarks ?? 33;

        return {
          subjectId: sub.id,
          subjectNameBn: sub.nameBn,
          subjectNameEn: sub.nameEn,
          subjectCode: sub.code,
          fullMarks,
          passMarks,
          isOptional: sub.isOptional,
          marksObtained: mark?.marksObtained ?? null,
          isAbsent: Boolean(mark?.isAbsent),
          isExempt: Boolean(mark?.isExempt),
        };
      });

      const calculated = calculateCandidateResult({
        studentId: student.id,
        studentIdNumber: student.studentIdNumber,
        fullNameBn: student.fullNameBn,
        fullNameEn: student.fullNameEn,
        rollNumber: en.rollNumber,
        classNameBn: selectedClass.nameBn,
        subjectResults: subjectCalculations,
      });

      const savedResult = resultMap.get(student.id);

      return {
        studentId: student.id,
        studentIdNumber: student.studentIdNumber,
        fullNameBn: student.fullNameBn,
        rollNumber: en.rollNumber,
        isOrphan: student.isOrphan,
        residentialStatus: student.residentialStatus,
        subjects: calculated.subjects,
        totalFullMarks: calculated.totalFullMarks,
        totalObtained: calculated.totalObtained,
        percentage: calculated.percentage,
        finalGradeBn: calculated.finalGradeBn,
        finalGradeEn: calculated.finalGradeEn,
        letterGrade: calculated.letterGrade,
        isPassed: calculated.isPassed,
        savedResult: savedResult
          ? {
              id: savedResult.id,
              status: savedResult.status,
              verificationCode: savedResult.verificationCode,
              rankInClass: savedResult.rankInClass,
              publishedAt: savedResult.publishedAt,
            }
          : null,
      };
    });

    // 9. Assign merit ranks (sort by isPassed desc, then totalObtained desc, percentage desc)
    const sortedPassed = rawTabulation
      .filter((c) => c.isPassed)
      .sort((a, b) => b.totalObtained - a.totalObtained);

    const rankMap = new Map<string, number>();
    sortedPassed.forEach((c, index) => {
      rankMap.set(c.studentId, index + 1);
    });

    const finalTabulation = rawTabulation.map((c) => ({
      ...c,
      meritRank: rankMap.get(c.studentId) || null,
    })).sort((a, b) => a.rollNumber - b.rollNumber);

    // 10. Summary Statistics
    const totalStudents = enrollments.length;
    const passedStudents = finalTabulation.filter((c) => c.isPassed).length;
    const failedStudents = totalStudents - passedStudents;
    const passRate = totalStudents > 0 ? Number(((passedStudents / totalStudents) * 100).toFixed(1)) : 0;

    const mumtazCount = finalTabulation.filter((c) => c.letterGrade === "A+").length;
    const jayyidJiddanCount = finalTabulation.filter((c) => c.letterGrade === "A").length;
    const jayyidCount = finalTabulation.filter((c) => c.letterGrade === "B").length;
    const maqboolCount = finalTabulation.filter((c) => c.letterGrade === "C").length;
    const rasibCount = finalTabulation.filter((c) => c.letterGrade === "F").length;

    const isClassPublished =
      existingResults.length > 0 &&
      existingResults.every((r) => r.status === "PUBLISHED");

    return NextResponse.json({
      success: true,
      data: {
        exams,
        classes,
        selectedExam,
        selectedClass,
        subjects,
        subjectTracking,
        tabulation: finalTabulation,
        stats: {
          totalStudents,
          passedStudents,
          failedStudents,
          passRate,
          mumtazCount,
          jayyidJiddanCount,
          jayyidCount,
          maqboolCount,
          rasibCount,
          isClassPublished,
          examStatus: selectedExam.status,
          isExamPublished: selectedExam.isPublished,
        },
      },
    });
  } catch (error: any) {
    console.error("GET /api/principal/academics/exams error:", error);
    return NextResponse.json({ error: error.message || "পরীক্ষার তথ্য লোড করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}

/**
 * POST /api/principal/academics/exams
 * Actions:
 * 1. APPROVE_AND_PUBLISH_RESULTS: Auto-tabulate, generate verification codes, save to Result table as PUBLISHED, update Exam status, notify guardians, publish notice.
 * 2. UNPUBLISH_RESULTS: Revert results to REVIEW for corrections.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "PRINCIPAL" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র মুহতামিম বা অ্যাডমিন প্রবেশ করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { action, examId, classId } = body;

    if (!examId || !classId) {
      return NextResponse.json({ error: "পরীক্ষা ও জামাত নির্বাচন আবশ্যক।" }, { status: 400 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { session: true },
    });
    const jamatClass = await prisma.jamatClass.findUnique({
      where: { id: classId },
    });

    if (!exam || !jamatClass) {
      return NextResponse.json({ error: "পরীক্ষা বা জামাত পাওয়া যায়নি।" }, { status: 404 });
    }

    // -------------------------------------------------------------
    // ACTION 1: APPROVE_AND_PUBLISH_RESULTS
    // -------------------------------------------------------------
    if (action === "APPROVE_AND_PUBLISH_RESULTS") {
      const subjects = await prisma.subject.findMany({
        where: { classId, isActive: true },
        orderBy: { sortOrder: "asc" },
      });

      const examSubjects = await prisma.examSubject.findMany({
        where: { examId, classId },
      });
      const examSubjectMap = new Map(examSubjects.map((es) => [es.subjectId, es]));

      const enrollments = await prisma.enrollment.findMany({
        where: {
          sessionId: exam.sessionId,
          classId,
          status: "ACTIVE",
        },
        include: {
          student: true,
        },
        orderBy: { rollNumber: "asc" },
      });

      if (enrollments.length === 0) {
        return NextResponse.json({ error: "এই জামাতে কোনো সক্রিয় শিক্ষার্থী পাওয়া যায়নি।" }, { status: 400 });
      }

      const examMarks = await prisma.examMark.findMany({
        where: { examId, classId },
      });
      const markMap = new Map<string, any>();
      for (const m of examMarks) {
        markMap.set(`${m.studentId}_${m.subjectId}`, m);
      }

      // Compute candidates results
      const candidates = enrollments.map((en) => {
        const student = en.student;
        const subjectCalculations: SubjectMarksCalculationInput[] = subjects.map((sub) => {
          const mark = markMap.get(`${student.id}_${sub.id}`);
          const config = examSubjectMap.get(sub.id);
          const fullMarks = config?.fullMarks ?? sub.fullMarks ?? 100;
          const passMarks = config?.passMarks ?? sub.passMarks ?? 33;

          return {
            subjectId: sub.id,
            subjectNameBn: sub.nameBn,
            subjectNameEn: sub.nameEn,
            subjectCode: sub.code,
            fullMarks,
            passMarks,
            isOptional: sub.isOptional,
            marksObtained: mark?.marksObtained ?? null,
            isAbsent: Boolean(mark?.isAbsent),
            isExempt: Boolean(mark?.isExempt),
          };
        });

        const calculated = calculateCandidateResult({
          studentId: student.id,
          studentIdNumber: student.studentIdNumber,
          fullNameBn: student.fullNameBn,
          fullNameEn: student.fullNameEn,
          rollNumber: en.rollNumber,
          classNameBn: jamatClass.nameBn,
          subjectResults: subjectCalculations,
        });

        return calculated;
      });

      // Rank passed students
      const passedCandidates = candidates
        .filter((c) => c.isPassed)
        .sort((a, b) => b.totalObtained - a.totalObtained);

      const rankMap = new Map<string, number>();
      passedCandidates.forEach((c, index) => {
        rankMap.set(c.studentId, index + 1);
      });

      const currentYear = new Date().getFullYear();
      const publishedAt = new Date();

      // Upsert into Result table inside a transaction
      await prisma.$transaction(async (tx) => {
        for (const c of candidates) {
          const rank = rankMap.get(c.studentId) || null;
          const verificationCode = generateResultVerificationCode(currentYear);

          const snapshot = {
            result: c,
            metadata: {
              institution: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা",
              estd: "২০২১ ইং",
              examNameBn: exam.nameBn,
              sessionName: exam.session.name,
              jamatName: jamatClass.nameBn,
              publishedAt: publishedAt.toISOString(),
              approvedBy: user.name || "মুহতামিম",
            },
          };

          await tx.result.upsert({
            where: {
              examId_studentId: {
                examId,
                studentId: c.studentId,
              },
            },
            create: {
              examId,
              studentId: c.studentId,
              sessionId: exam.sessionId,
              classId,
              rollNumber: c.rollNumber,
              totalMarks: c.totalFullMarks,
              totalObtained: c.totalObtained,
              totalFullMarks: c.totalFullMarks,
              percentage: c.percentage,
              finalGradeBn: c.finalGradeBn,
              finalGradeEn: c.finalGradeEn,
              isPassed: c.isPassed,
              rankInClass: rank,
              status: "PUBLISHED",
              verificationCode,
              snapshotJson: JSON.stringify(snapshot),
              publishedAt,
            },
            update: {
              rollNumber: c.rollNumber,
              totalMarks: c.totalFullMarks,
              totalObtained: c.totalObtained,
              totalFullMarks: c.totalFullMarks,
              percentage: c.percentage,
              finalGradeBn: c.finalGradeBn,
              finalGradeEn: c.finalGradeEn,
              isPassed: c.isPassed,
              rankInClass: rank,
              status: "PUBLISHED",
              snapshotJson: JSON.stringify(snapshot),
              publishedAt,
            },
          });
        }

        // Advance exam status if needed
        await tx.exam.update({
          where: { id: examId },
          data: {
            status: "PUBLISHED",
            isPublished: true,
            publishedAt,
          },
        });
      });

      // Automatically publish official result Notice
      try {
        await prisma.notice.create({
          data: {
            titleBn: `[ফলাফল প্রকাশ] ${exam.nameBn} - ${jamatClass.nameBn} পরীক্ষার ফল প্রকাশিত`,
            titleEn: `Results Published: ${exam.nameBn} - ${jamatClass.nameEn}`,
            contentBn: `ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার ${jamatClass.nameBn}-এর ${exam.nameBn}-এর ফলাফল মুহতামিম মহোদয় কর্তৃক আনুষ্ঠানিকভাবে অনুমোদিত ও প্রকাশিত হয়েছে। অভিভাবকবৃন্দ পোর্টাল থেকে ফলাফল ও নম্বরপত্র দেখতে পারবেন।`,
            category: "EXAM",
            audience: "PUBLIC",
            priority: "IMPORTANT",
            isUrgent: false,
            isPinned: true,
            status: "PUBLISHED",
            publishedAt,
            createdByUserId: user.userId,
            publishedByUserId: user.userId,
          },
        });
      } catch (notErr) {
        console.warn("Notice publication warning:", notErr);
      }

      // Notify Guardians in-app
      try {
        const studentIds = candidates.map((c) => c.studentId);
        const guardianLinks = await prisma.guardianStudent.findMany({
          where: { studentId: { in: studentIds } },
          include: {
            guardian: { select: { userId: true } },
            student: { select: { fullNameBn: true } },
          },
        });

        const notificationsData = guardianLinks
          .filter((gl) => gl.guardian.userId)
          .map((gl) => ({
            recipientUserId: gl.guardian.userId!,
            type: "EXAM",
            title: `[ফলাফল প্রকাশিত] ${gl.student.fullNameBn}`,
            body: `মুহতামিম মহোদয় কর্তৃক ${gl.student.fullNameBn}-এর ${exam.nameBn}-এর ফলাফল আনুষ্ঠানিকভাবে প্রকাশিত হয়েছে। মার্কশিট দেখতে ক্লিক করুন।`,
            actionUrl: "/portal?tab=RESULTS",
            priority: "IMPORTANT",
            channel: "PORTAL",
          }));

        if (notificationsData.length > 0) {
          await prisma.notification.createMany({
            data: notificationsData,
          });
        }
      } catch (notifErr) {
        console.warn("Guardian result notification warning:", notifErr);
      }

      await recordAuditLog({
        userId: user.userId,
        action: "PRINCIPAL_PUBLISH_EXAM_RESULTS",
        entityType: "Exam",
        entityId: examId,
        details: {
          examId,
          classId,
          totalStudents: candidates.length,
          publishedBy: user.name,
        },
      });

      return NextResponse.json({
        success: true,
        message: `${jamatClass.nameBn}-এর ${candidates.length} জন শিক্ষার্থীর ফলাফল মুহতামিম কর্তৃক সফলভাবে অনুমোদিত ও প্রকাশিত হয়েছে।`,
      });
    }

    // -------------------------------------------------------------
    // ACTION 2: UNPUBLISH_RESULTS
    // -------------------------------------------------------------
    if (action === "UNPUBLISH_RESULTS") {
      await prisma.result.updateMany({
        where: {
          examId,
          classId,
        },
        data: {
          status: "REVIEW",
        },
      });

      await recordAuditLog({
        userId: user.userId,
        action: "PRINCIPAL_UNPUBLISH_EXAM_RESULTS",
        entityType: "Exam",
        entityId: examId,
        details: {
          examId,
          classId,
          retractedBy: user.name,
        },
      });

      return NextResponse.json({
        success: true,
        message: `${jamatClass.nameBn}-এর পরীক্ষার ফলাফল সফলভাবে অপ্রকাশিত (খসড়া মোড) করা হয়েছে। এখন সংশোধন করা যাবে।`,
      });
    }

    return NextResponse.json({ error: "অজানা কার্যক্রম।" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/principal/academics/exams error:", error);
    return NextResponse.json({ error: error.message || "ফলাফল প্রক্রিয়াকরণে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
