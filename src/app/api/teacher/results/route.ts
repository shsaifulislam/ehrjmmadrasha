import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import {
  validateMarksInput,
  calculateSubjectResult,
  verifyTeacherSubjectAssignment,
} from "@/lib/resultCalculationService";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র শিক্ষক বা অ্যাডমিন প্রবেশ করতে পারেন।" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");
    const classId = searchParams.get("classId");
    const sectionId = searchParams.get("sectionId");
    const subjectId = searchParams.get("subjectId");

    if (!examId || !classId || !subjectId) {
      return NextResponse.json(
        { error: "পরীক্ষা, জামাত এবং বিষয় নির্বাচন আবশ্যক।" },
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

    // 1. Teacher Authorization Scoping Check
    if (user.role === "TEACHER") {
      const isAssigned = await verifyTeacherSubjectAssignment(
        user.userId,
        exam.sessionId,
        classId,
        sectionId,
        subjectId
      );

      if (!isAssigned) {
        return NextResponse.json(
          { error: "নিরাপত্তা সতর্কতা: আপনি এই জামাত বা বিষয়ের জন্য অ্যাসাইনকৃত শিক্ষক নন।" },
          { status: 403 }
        );
      }
    }

    // 2. Fetch ExamSubject configuration (fullMarks, passMarks)
    let examSubject = await prisma.examSubject.findFirst({
      where: { examId, classId, subjectId },
    });

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      return NextResponse.json({ error: "বিষয়টি পাওয়া যায়নি।" }, { status: 404 });
    }

    const fullMarks = examSubject?.fullMarks ?? subject.fullMarks ?? 100;
    const passMarks = examSubject?.passMarks ?? subject.passMarks ?? 33;

    // 3. Fetch roll-ordered students actively enrolled in this class/section and session
    const enrollments = await prisma.enrollment.findMany({
      where: {
        sessionId: exam.sessionId,
        classId,
        ...(sectionId ? { sectionId } : {}),
        status: "ACTIVE",
      },
      orderBy: { rollNumber: "asc" },
      include: {
        student: {
          select: {
            id: true,
            studentIdNumber: true,
            fullNameBn: true,
            fullNameEn: true,
            residentialStatus: true,
          },
        },
      },
    });

    // 4. Fetch existing marks entered for this exam, subject, and student list
    const studentIds = enrollments.map((e) => e.studentId);
    const existingMarks = await prisma.examMark.findMany({
      where: {
        examId,
        subjectId,
        studentId: { in: studentIds },
      },
    });

    const marksMap = new Map(existingMarks.map((m) => [m.studentId, m]));

    // Check if result is published or submitted
    const isExamPublished = exam.status === "PUBLISHED" || exam.status === "CLOSED";

    const students = enrollments.map((en) => {
      const markRecord = marksMap.get(en.student.id);
      return {
        studentId: en.student.id,
        studentIdNumber: en.student.studentIdNumber,
        rollNumber: en.rollNumber,
        fullNameBn: en.student.fullNameBn,
        fullNameEn: en.student.fullNameEn,
        residentialStatus: en.student.residentialStatus,
        marksObtained: markRecord?.marksObtained ?? null,
        isAbsent: markRecord?.isAbsent ?? false,
        isExempt: markRecord?.isExempt ?? false,
        letterGrade: markRecord?.letterGrade ?? null,
        gradeRemarks: markRecord?.gradeRemarks ?? null,
        status: markRecord?.status ?? "DRAFT",
      };
    });

    return NextResponse.json({
      exam: {
        id: exam.id,
        nameBn: exam.nameBn,
        nameEn: exam.nameEn,
        status: exam.status,
        isPublished: isExamPublished,
      },
      subject: {
        id: subject.id,
        nameBn: subject.nameBn,
        nameEn: subject.nameEn,
        code: subject.code,
        fullMarks,
        passMarks,
      },
      students,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার এরর" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    const body = await req.json();
    const {
      examId,
      classId,
      sectionId,
      subjectId,
      entries, // Array<{ studentId, marksObtained, isAbsent, isExempt, remarks }>
      action = "DRAFT", // "DRAFT" | "SUBMIT"
    } = body;

    if (!examId || !classId || !subjectId || !Array.isArray(entries)) {
      return NextResponse.json(
        { error: "পরীক্ষা, জামাত, বিষয় এবং নম্বর তালিকা আবশ্যক।" },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    });
    if (!exam) {
      return NextResponse.json({ error: "পরীক্ষাটি পাওয়া যায়নি।" }, { status: 404 });
    }

    if (exam.status === "PUBLISHED" || exam.status === "CLOSED") {
      return NextResponse.json(
        { error: "এই পরীক্ষাটি ইতিমধ্যে প্রকাশিত বা সমাপ্ত। এতে আর নতুন নম্বর এন্ট্রি করা যাবে না।" },
        { status: 403 }
      );
    }

    // Teacher authorization scoping check
    if (user.role === "TEACHER") {
      const isAssigned = await verifyTeacherSubjectAssignment(
        user.userId,
        exam.sessionId,
        classId,
        sectionId,
        subjectId
      );

      if (!isAssigned) {
        return NextResponse.json(
          { error: "নিরাপত্তা সতর্কতা: আপনি এই জামাত বা বিষয়ের জন্য অ্যাসাইনকৃত শিক্ষক নন।" },
          { status: 403 }
        );
      }
    }

    // Get subject configuration
    let examSubject = await prisma.examSubject.findFirst({
      where: { examId, classId, subjectId },
    });
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
      return NextResponse.json({ error: "বিষয়টি পাওয়া যায়নি।" }, { status: 404 });
    }

    const fullMarks = examSubject?.fullMarks ?? subject.fullMarks ?? 100;
    const passMarks = examSubject?.passMarks ?? subject.passMarks ?? 33;

    // Validate all entries before database transaction
    for (const entry of entries) {
      const validation = validateMarksInput(
        entry.marksObtained,
        fullMarks,
        Boolean(entry.isAbsent),
        Boolean(entry.isExempt)
      );
      if (!validation.isValid) {
        return NextResponse.json(
          { error: `শিক্ষার্থী আইডি (${entry.studentId}): ${validation.error}` },
          { status: 400 }
        );
      }
    }

    // Save/update marks inside an atomic transaction
    await prisma.$transaction(async (tx) => {
      for (const entry of entries) {
        const isAbsent = Boolean(entry.isAbsent);
        const isExempt = Boolean(entry.isExempt);
        const marksObtained = isAbsent || isExempt ? null : Number(entry.marksObtained);

        const subResult = calculateSubjectResult({
          subjectId,
          subjectNameBn: subject.nameBn,
          subjectNameEn: subject.nameEn,
          subjectCode: subject.code,
          fullMarks,
          passMarks,
          isOptional: subject.isOptional,
          marksObtained,
          isAbsent,
          isExempt,
        });

        const newStatus = action === "SUBMIT" ? "SUBMITTED" : "DRAFT";

        await tx.examMark.upsert({
          where: {
            examId_studentId_subjectId: {
              examId,
              studentId: entry.studentId,
              subjectId,
            },
          },
          create: {
            examId,
            studentId: entry.studentId,
            subjectId,
            classId,
            sectionId: sectionId || null,
            marksObtained,
            isAbsent,
            isExempt,
            letterGrade: subResult.gradeBn,
            gradeRemarks: entry.remarks || subResult.letterGrade,
            status: newStatus,
            submittedAt: action === "SUBMIT" ? new Date() : null,
            recordedByUserId: user.userId,
          },
          update: {
            classId,
            sectionId: sectionId || null,
            marksObtained,
            isAbsent,
            isExempt,
            letterGrade: subResult.gradeBn,
            gradeRemarks: entry.remarks || subResult.letterGrade,
            status: newStatus,
            submittedAt: action === "SUBMIT" ? new Date() : undefined,
            recordedByUserId: user.userId,
          },
        });
      }

      // If action is submit and exam is still SCHEDULED/DRAFT, advance status to MARKS_ENTRY or REVIEW
      if (action === "SUBMIT" && (exam.status === "DRAFT" || exam.status === "SCHEDULED")) {
        await tx.exam.update({
          where: { id: examId },
          data: { status: "MARKS_ENTRY" },
        });
      }
    });

    await recordAuditLog({
      userId: user.userId,
      action: action === "SUBMIT" ? "TEACHER_MARKS_SUBMITTED" : "TEACHER_MARKS_DRAFT_SAVED",
      entityType: "ExamMark",
      entityId: `${examId}-${subjectId}`,
      details: {
        examId,
        classId,
        subjectId,
        count: entries.length,
        action,
      },
    });

    const msg =
      action === "SUBMIT"
        ? "নম্বর সফলভাবে উস্তাদ প্যানেল থেকে দাখিল (Submit) করা হয়েছে।"
        : "নম্বর সফলভাবে খসড়া (Draft) হিসেবে সংরক্ষিত হয়েছে।";

    return NextResponse.json({ message: msg, status: action === "SUBMIT" ? "SUBMITTED" : "DRAFT" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার এরর" }, { status: 500 });
  }
}
