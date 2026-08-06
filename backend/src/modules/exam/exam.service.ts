// backend/src/modules/exam/exam.service.ts

import prisma from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { CreateExamInput, UpdateExamInput, BulkMarksEntryInput, PublicResultSearchQuery } from './exam.schema';

export interface GradeResult {
  grade: string;
  gradePoint: number;
}

export class ExamService {
  /**
   * Standard Grading System Logic based on Percentage
   */
  calculateGradeAndPoint(obtainedMarks: number, fullMarks: number, passMarks: number): GradeResult {
    if (obtainedMarks < passMarks) {
      return { grade: 'F', gradePoint: 0.0 };
    }

    const percentage = fullMarks > 0 ? (obtainedMarks / fullMarks) * 100 : 0;

    if (percentage >= 80) return { grade: 'A+', gradePoint: 5.0 };
    if (percentage >= 70) return { grade: 'A', gradePoint: 4.0 };
    if (percentage >= 60) return { grade: 'A-', gradePoint: 3.5 };
    if (percentage >= 50) return { grade: 'B', gradePoint: 3.0 };
    if (percentage >= 40) return { grade: 'C', gradePoint: 2.0 };
    if (percentage >= 33) return { grade: 'D', gradePoint: 1.0 };
    return { grade: 'F', gradePoint: 0.0 };
  }

  /**
   * Convert Overall GPA to Letter Grade
   */
  gpaToGrade(gpa: number, hasFailed: boolean): string {
    if (hasFailed || gpa < 1.0) return 'F';
    if (gpa >= 5.0) return 'A+';
    if (gpa >= 4.0) return 'A';
    if (gpa >= 3.5) return 'A-';
    if (gpa >= 3.0) return 'B';
    if (gpa >= 2.0) return 'C';
    if (gpa >= 1.0) return 'D';
    return 'F';
  }

  // ─── EXAM CRUD ───────────────────────────────────────

  async createExam(input: CreateExamInput, userId: string) {
    const session = await prisma.session.findUnique({ where: { id: input.sessionId } });
    if (!session) throw new AppError('সেশনটি পাওয়া যায়নি', 404);

    const exam = await prisma.exam.create({
      data: {
        name: input.name,
        sessionId: input.sessionId,
        isPublished: input.isPublished ?? false,
      },
      include: { session: true },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_EXAM',
        resource: 'Exam',
        details: `পরীক্ষা: ${exam.name}, সেশন: ${session.year}`,
      },
    });

    return exam;
  }

  async findAllExams(sessionId?: string) {
    return prisma.exam.findMany({
      where: sessionId ? { sessionId } : undefined,
      include: { session: true, _count: { select: { results: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPublicExams(sessionId?: string) {
    return prisma.exam.findMany({
      where: {
        isPublished: true,
        ...(sessionId ? { sessionId } : {}),
      },
      include: { session: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findExamById(id: string) {
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: { session: true },
    });
    if (!exam) throw new AppError('পরীক্ষাটি পাওয়া যায়নি', 404);
    return exam;
  }

  async updateExam(id: string, input: UpdateExamInput, userId: string) {
    await this.findExamById(id);
    const updated = await prisma.exam.update({
      where: { id },
      data: input,
      include: { session: true },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_EXAM',
        resource: 'Exam',
        details: `পরীক্ষা আপডেট: ${updated.name}, প্রকাশিত: ${updated.isPublished}`,
      },
    });

    return updated;
  }

  async deleteExam(id: string, userId: string) {
    const exam = await this.findExamById(id);
    await prisma.result.deleteMany({ where: { examId: id } });
    await prisma.exam.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE_EXAM',
        resource: 'Exam',
        details: `পরীক্ষা ডিলেট: ${exam.name}`,
      },
    });
  }

  // ─── MARKS ENTRY ──────────────────────────────────────

  async getMarksEntrySheet(examId: string, classId: string, subjectId: string) {
    const [exam, targetClass, subject] = await Promise.all([
      prisma.exam.findUnique({ where: { id: examId } }),
      prisma.class.findFirst({ where: { id: classId, isDeleted: false } }),
      prisma.subject.findFirst({ where: { id: subjectId, classId, isDeleted: false } }),
    ]);

    if (!exam) throw new AppError('পরীক্ষাটি পাওয়া যায়নি', 404);
    if (!targetClass) throw new AppError('শ্রেণীটি পাওয়া যায়নি', 404);
    if (!subject) throw new AppError('বিষয়টি এই শ্রেণীর সাথে সামঞ্জস্যপূর্ণ নয়', 400);

    const students = await prisma.student.findMany({
      where: { classId, isDeleted: false },
      orderBy: { roll: 'asc' },
      select: { id: true, studentId: true, roll: true, nameBn: true, nameEn: true },
    });

    const results = await prisma.result.findMany({
      where: { examId, subjectId },
    });

    const resultMap = new Map<string, { marks: number; grade: string }>();
    results.forEach((r) => resultMap.set(r.studentId, { marks: Number(r.marks), grade: r.grade }));

    const studentItems = students.map((s) => {
      const existing = resultMap.get(s.id);
      return {
        id: s.id,
        studentId: s.studentId,
        roll: s.roll,
        nameBn: s.nameBn,
        nameEn: s.nameEn,
        marks: existing ? existing.marks : null,
        grade: existing ? existing.grade : null,
      };
    });

    return {
      exam: { id: exam.id, name: exam.name },
      class: { id: targetClass.id, name: targetClass.name },
      subject: {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        fullMarks: Number(subject.fullMarks),
        passMarks: Number(subject.passMarks),
      },
      students: studentItems,
    };
  }

  async bulkSaveMarks(input: BulkMarksEntryInput, recordedById: string) {
    const [exam, targetClass, subject] = await Promise.all([
      prisma.exam.findUnique({ where: { id: input.examId } }),
      prisma.class.findFirst({ where: { id: input.classId, isDeleted: false } }),
      prisma.subject.findFirst({ where: { id: input.subjectId, classId: input.classId, isDeleted: false } }),
    ]);

    if (!exam) throw new AppError('পরীক্ষাটি পাওয়া যায়নি', 404);
    if (!targetClass) throw new AppError('শ্রেণীটি পাওয়া যায়নি', 404);
    if (!subject) throw new AppError('বিষয়টি উক্ত শ্রেণীর অন্তর্ভুক্ত নয়', 400);

    const fullMarks = Number(subject.fullMarks);
    const passMarks = Number(subject.passMarks);

    // Validate students belong to the class
    const studentIds = input.marks.map((m) => m.studentId);
    const validStudents = await prisma.student.findMany({
      where: { id: { in: studentIds }, classId: input.classId, isDeleted: false },
      select: { id: true },
    });
    const validStudentSet = new Set(validStudents.map((s) => s.id));

    const invalidStudents = studentIds.filter((id) => !validStudentSet.has(id));
    if (invalidStudents.length > 0) {
      throw new AppError('কিছু ছাত্র উক্ত শ্রেণীর অন্তর্ভুক্ত নয় অথবা নিষ্ক্রিয়', 400);
    }

    // Validate marks bounds
    for (const item of input.marks) {
      if (item.marks > fullMarks) {
        throw new AppError(`প্রাপ্ত নম্বর (${item.marks}) পূর্ণমানের (${fullMarks}) চেয়ে বেশি হতে পারে না`, 400);
      }
    }

    const saved = await prisma.$transaction(async (tx) => {
      const records: any[] = [];
      for (const item of input.marks) {
        const { grade } = this.calculateGradeAndPoint(item.marks, fullMarks, passMarks);
        const record = await tx.result.upsert({
          where: {
            studentId_examId_subjectId: {
              studentId: item.studentId,
              examId: input.examId,
              subjectId: input.subjectId,
            },
          },
          update: {
            marks: item.marks,
            grade,
          },
          create: {
            studentId: item.studentId,
            examId: input.examId,
            subjectId: input.subjectId,
            marks: item.marks,
            grade,
          },
        });
        records.push(record);
      }

      await tx.auditLog.create({
        data: {
          userId: recordedById,
          action: 'BULK_MARKS_SAVE',
          resource: 'Result',
          details: `পরীক্ষা: ${exam.name}, শ্রেণী: ${targetClass.name}, বিষয়: ${subject.name}, মোট এন্ট্রি: ${records.length}`,
        },
      });

      return records;
    });

    return {
      message: 'নম্বর সফলভাবে সংরক্ষণ করা হয়েছে',
      savedCount: saved.length,
    };
  }

  // ─── RESULT CALCULATIONS & MARKSHEET ─────────────────

  async getClassResultSheet(examId: string, classId: string) {
    const [exam, targetClass, subjects] = await Promise.all([
      prisma.exam.findUnique({ where: { id: examId }, include: { session: true } }),
      prisma.class.findFirst({ where: { id: classId, isDeleted: false } }),
      prisma.subject.findMany({ where: { classId, isDeleted: false }, orderBy: { name: 'asc' } }),
    ]);

    if (!exam) throw new AppError('পরীক্ষাটি পাওয়া যায়নি', 404);
    if (!targetClass) throw new AppError('শ্রেণীটি পাওয়া যায়নি', 404);

    const students = await prisma.student.findMany({
      where: { classId, isDeleted: false },
      orderBy: { roll: 'asc' },
      select: { id: true, studentId: true, roll: true, nameBn: true, nameEn: true },
    });

    const results = await prisma.result.findMany({
      where: { examId, subject: { classId } },
      include: { subject: true },
    });

    // Group results by studentId
    const studentResultMap = new Map<string, Map<string, { marks: number; grade: string }>>();
    results.forEach((r) => {
      if (!studentResultMap.has(r.studentId)) {
        studentResultMap.set(r.studentId, new Map());
      }
      studentResultMap.get(r.studentId)!.set(r.subjectId, {
        marks: Number(r.marks),
        grade: r.grade,
      });
    });

    const studentCalculations = students.map((std) => {
      const subjectMap = studentResultMap.get(std.id) || new Map();
      let totalObtained = 0;
      let totalFullMarks = 0;
      let sumGradePoints = 0;
      let hasFailed = false;

      const subjectBreakdown = subjects.map((subj) => {
        const full = Number(subj.fullMarks);
        const pass = Number(subj.passMarks);
        const entry = subjectMap.get(subj.id);
        const obtained = entry ? entry.marks : 0;
        const { grade, gradePoint } = entry
          ? this.calculateGradeAndPoint(entry.marks, full, pass)
          : { grade: 'F', gradePoint: 0.0 };

        totalObtained += obtained;
        totalFullMarks += full;
        sumGradePoints += gradePoint;
        if (grade === 'F' || !entry) {
          hasFailed = true;
        }

        return {
          subjectId: subj.id,
          subjectName: subj.name,
          subjectCode: subj.code,
          fullMarks: full,
          passMarks: pass,
          obtainedMarks: entry ? obtained : null,
          grade,
          gradePoint,
        };
      });

      const totalSubjects = subjects.length;
      const gpa = totalSubjects > 0 && !hasFailed ? Number((sumGradePoints / totalSubjects).toFixed(2)) : 0.0;
      const finalGrade = this.gpaToGrade(gpa, hasFailed);

      return {
        student: std,
        subjectBreakdown,
        totalObtained,
        totalFullMarks,
        gpa,
        finalGrade,
        hasFailed,
      };
    });

    // Ranking / Position calculation among students in the same class and exam
    // Primary sort: gpa desc, Secondary sort: totalObtained desc
    const sorted = [...studentCalculations].sort((a, b) => {
      if (b.gpa !== a.gpa) return b.gpa - a.gpa;
      return b.totalObtained - a.totalObtained;
    });

    const rankMap = new Map<string, number>();
    let currentRank = 1;
    sorted.forEach((item, idx) => {
      if (idx > 0) {
        const prev = sorted[idx - 1];
        if (item.gpa === prev.gpa && item.totalObtained === prev.totalObtained) {
          // Tie: same rank
          rankMap.set(item.student.id, rankMap.get(prev.student.id)!);
        } else {
          currentRank = idx + 1;
          rankMap.set(item.student.id, currentRank);
        }
      } else {
        rankMap.set(item.student.id, 1);
      }
    });

    const rankedStudents = studentCalculations.map((item) => ({
      ...item,
      position: rankMap.get(item.student.id) || 0,
    }));

    return {
      exam: { id: exam.id, name: exam.name, session: exam.session.year, isPublished: exam.isPublished },
      class: { id: targetClass.id, name: targetClass.name },
      subjects: subjects.map((s) => ({ id: s.id, name: s.name, fullMarks: Number(s.fullMarks) })),
      students: rankedStudents,
    };
  }

  async getStudentResultCard(examId: string, studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true, session: true, department: true },
    });
    if (!student) throw new AppError('ছাত্রের তথ্য পাওয়া যায়নি', 404);

    const sheet = await this.getClassResultSheet(examId, student.classId);
    const studentResult = sheet.students.find((s) => s.student.id === studentId);

    if (!studentResult) throw new AppError('ছাত্রের পরীক্ষার ফলাফল পাওয়া যায়নি', 404);

    return {
      madrasaInfo: {
        nameBn: 'ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ জমিরীয়া মাদ্রাসা',
        address: 'ইলিয়টগঞ্জ, চান্দিনা, কুমিল্লা',
        established: '১৯৭৫',
      },
      exam: sheet.exam,
      student: {
        id: student.id,
        studentId: student.studentId,
        roll: student.roll,
        nameBn: student.nameBn,
        nameEn: student.nameEn,
        className: student.class.name,
        sessionYear: student.session.year,
        departmentName: student.department?.name || null,
      },
      results: studentResult.subjectBreakdown,
      summary: {
        totalObtained: studentResult.totalObtained,
        totalFullMarks: studentResult.totalFullMarks,
        gpa: studentResult.gpa,
        finalGrade: studentResult.finalGrade,
        position: studentResult.position,
        hasFailed: studentResult.hasFailed,
      },
    };
  }

  async searchPublicResult(input: PublicResultSearchQuery) {
    const exam = await prisma.exam.findUnique({
      where: { id: input.examId },
    });
    if (!exam || !exam.isPublished) {
      throw new AppError('উক্ত পরীক্ষার ফলাফল এখনও প্রকাশিত হয়নি', 404);
    }

    const student = await prisma.student.findFirst({
      where: {
        roll: input.roll,
        sessionId: input.sessionId,
        isDeleted: false,
        studentId: input.studentId ? input.studentId : undefined,
      },
    });

    if (!student) {
      throw new AppError('প্রদত্ত রোল নম্বর বা তথ্যের সাথে কোনো ছাত্রের রেকর্ড মিলেনি', 404);
    }

    return this.getStudentResultCard(exam.id, student.id);
  }

  async verifyPublicResultCard(resultId: string) {
    if (!resultId) throw new AppError('ফলাফল আইডি আবশ্যক', 400);

    const student = await prisma.student.findUnique({
      where: { id: resultId },
      include: { class: true, session: true },
    });

    if (!student) {
      throw new AppError('ফলাফল ভেরিফিকেশন রেকর্ড পাওয়া যায়নি', 404);
    }

    const latestExam = await prisma.exam.findFirst({
      where: { isPublished: true, sessionId: student.sessionId },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestExam) {
      throw new AppError('উক্ত শিক্ষার্থীর কোনো প্রকাশিত ফলাফল পাওয়া যায়নি', 404);
    }

    return this.getStudentResultCard(latestExam.id, student.id);
  }
}

export const examService = new ExamService();

