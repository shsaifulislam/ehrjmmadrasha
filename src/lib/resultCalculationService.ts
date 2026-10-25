import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export interface GradeDefinition {
  minPercentage: number;
  gradeBn: string;
  gradeEn: string;
  letterGrade: string;
  isPassed: boolean;
}

export const DEFAULT_QAWMI_GRADES: GradeDefinition[] = [
  { minPercentage: 80, gradeBn: "মুমতাজ (ممتاز)", gradeEn: "Mumtaz", letterGrade: "A+", isPassed: true },
  { minPercentage: 70, gradeBn: "জায়্যিদ জিদ্দান (جيد جدا)", gradeEn: "Jayyid Jiddan", letterGrade: "A", isPassed: true },
  { minPercentage: 60, gradeBn: "জায়্যিদ (جيد)", gradeEn: "Jayyid", letterGrade: "B", isPassed: true },
  { minPercentage: 50, gradeBn: "মাকবুল (مقبول)", gradeEn: "Maqbool", letterGrade: "C", isPassed: true },
  { minPercentage: 0, gradeBn: "রাসিব (راسب)", gradeEn: "Rasib", letterGrade: "F", isPassed: false },
];

/**
 * Validates numeric marks against full marks and absence/exemption states.
 */
export function validateMarksInput(
  marksObtained: number | null | undefined,
  fullMarks: number,
  isAbsent: boolean = false,
  isExempt: boolean = false
): { isValid: boolean; error?: string } {
  if (isAbsent || isExempt) {
    return { isValid: true };
  }

  if (marksObtained === null || marksObtained === undefined || isNaN(Number(marksObtained))) {
    return { isValid: false, error: "প্রাপ্ত নম্বর প্রদান করা আবশ্যক অথবা অনুপস্থিত/অব্যাহতি চিহ্নিত করুন।" };
  }

  const num = Number(marksObtained);
  if (num < 0) {
    return { isValid: false, error: "নম্বর ০ (শূন্য)-এর কম হতে পারে না।" };
  }

  if (num > fullMarks) {
    return { isValid: false, error: `প্রাপ্ত নম্বর পূর্ণমান (${fullMarks})-এর চেয়ে বেশি হতে পারে না।` };
  }

  return { isValid: true };
}

/**
 * Calculates grade for a given percentage based on Qawmi or custom grading scale.
 */
export function calculateGradeFromPercentage(
  percentage: number,
  grades: GradeDefinition[] = DEFAULT_QAWMI_GRADES
): GradeDefinition {
  const sorted = [...grades].sort((a, b) => b.minPercentage - a.minPercentage);
  for (const g of sorted) {
    if (percentage >= g.minPercentage) {
      return g;
    }
  }
  return sorted[sorted.length - 1];
}

export interface SubjectMarksCalculationInput {
  subjectId: string;
  subjectNameBn: string;
  subjectNameEn: string;
  subjectCode: string;
  fullMarks: number;
  passMarks: number;
  isOptional?: boolean;
  marksObtained: number | null;
  isAbsent: boolean;
  isExempt: boolean;
}

export interface CalculatedSubjectResult {
  subjectId: string;
  subjectNameBn: string;
  subjectNameEn: string;
  subjectCode: string;
  fullMarks: number;
  passMarks: number;
  isOptional: boolean;
  marksObtained: number | null;
  isAbsent: boolean;
  isExempt: boolean;
  gradeBn: string;
  gradeEn: string;
  letterGrade: string;
  isPassed: boolean;
}

/**
 * Canonical calculation for single subject result
 */
export function calculateSubjectResult(
  input: SubjectMarksCalculationInput,
  grades: GradeDefinition[] = DEFAULT_QAWMI_GRADES
): CalculatedSubjectResult {
  const {
    subjectId,
    subjectNameBn,
    subjectNameEn,
    subjectCode,
    fullMarks,
    passMarks,
    isOptional = false,
    marksObtained,
    isAbsent,
    isExempt,
  } = input;

  if (isExempt) {
    return {
      subjectId,
      subjectNameBn,
      subjectNameEn,
      subjectCode,
      fullMarks,
      passMarks,
      isOptional,
      marksObtained: null,
      isAbsent: false,
      isExempt: true,
      gradeBn: "অব্যাহতি (مُعفى)",
      gradeEn: "Exempt",
      letterGrade: "EX",
      isPassed: true,
    };
  }

  if (isAbsent) {
    return {
      subjectId,
      subjectNameBn,
      subjectNameEn,
      subjectCode,
      fullMarks,
      passMarks,
      isOptional,
      marksObtained: null,
      isAbsent: true,
      isExempt: false,
      gradeBn: "অনুপস্থিত (غائب)",
      gradeEn: "Absent",
      letterGrade: "ABS",
      isPassed: false,
    };
  }

  const obtained = marksObtained !== null && marksObtained !== undefined ? Number(marksObtained) : 0;
  const percentage = fullMarks > 0 ? (obtained / fullMarks) * 100 : 0;
  const gradeDef = calculateGradeFromPercentage(percentage, grades);
  const isPassed = obtained >= passMarks;

  return {
    subjectId,
    subjectNameBn,
    subjectNameEn,
    subjectCode,
    fullMarks,
    passMarks,
    isOptional,
    marksObtained: obtained,
    isAbsent: false,
    isExempt: false,
    gradeBn: isPassed ? gradeDef.gradeBn : "রাসিব (راسب / অকৃতকার্য)",
    gradeEn: isPassed ? gradeDef.gradeEn : "Rasib (Fail)",
    letterGrade: isPassed ? gradeDef.letterGrade : "F",
    isPassed,
  };
}

export interface CandidateResultCalculationInput {
  studentId: string;
  studentIdNumber: string;
  fullNameBn: string;
  fullNameEn: string;
  rollNumber: number;
  classNameBn: string;
  sectionNameBn?: string | null;
  subjectResults: SubjectMarksCalculationInput[];
}

export interface CalculatedCandidateResult {
  studentId: string;
  studentIdNumber: string;
  fullNameBn: string;
  fullNameEn: string;
  rollNumber: number;
  classNameBn: string;
  sectionNameBn?: string | null;
  totalFullMarks: number;
  totalObtained: number;
  percentage: number;
  finalGradeBn: string;
  finalGradeEn: string;
  letterGrade: string;
  isPassed: boolean;
  subjects: CalculatedSubjectResult[];
}

/**
 * Centralized result calculation service
 * Canonical single source of truth for Exam, Marksheet, Admin, Teacher, and Guardian.
 */
export function calculateCandidateResult(
  candidate: CandidateResultCalculationInput,
  grades: GradeDefinition[] = DEFAULT_QAWMI_GRADES
): CalculatedCandidateResult {
  const evaluatedSubjects = candidate.subjectResults.map((sub) => calculateSubjectResult(sub, grades));

  let totalFull = 0;
  let totalObt = 0;
  let allMandatoryPassed = true;

  for (const s of evaluatedSubjects) {
    if (!s.isExempt) {
      totalFull += s.fullMarks;
      if (!s.isAbsent && s.marksObtained !== null) {
        totalObt += s.marksObtained;
      }
    }

    if (!s.isOptional && !s.isExempt && !s.isPassed) {
      allMandatoryPassed = false;
    }
  }

  const percentage = totalFull > 0 ? Number(((totalObt / totalFull) * 100).toFixed(2)) : 0;
  const gradeDef = calculateGradeFromPercentage(percentage, grades);
  const overallPassed = allMandatoryPassed && percentage >= 50;

  return {
    studentId: candidate.studentId,
    studentIdNumber: candidate.studentIdNumber,
    fullNameBn: candidate.fullNameBn,
    fullNameEn: candidate.fullNameEn,
    rollNumber: candidate.rollNumber,
    classNameBn: candidate.classNameBn,
    sectionNameBn: candidate.sectionNameBn,
    totalFullMarks: totalFull,
    totalObtained: totalObt,
    percentage,
    finalGradeBn: overallPassed ? gradeDef.gradeBn : "রাসিব (راسب / অকৃতকার্য)",
    finalGradeEn: overallPassed ? gradeDef.gradeEn : "Rasib (Fail)",
    letterGrade: overallPassed ? gradeDef.letterGrade : "F",
    isPassed: overallPassed,
    subjects: evaluatedSubjects,
  };
}

/**
 * Generates a cryptographically strong, non-sequential, tamper-proof verification code.
 * Format: EHRJ-RES-YYYY-XXXXXXXX
 */
export function generateResultVerificationCode(year: number = new Date().getFullYear()): string {
  const randomHex = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `EHRJ-RES-${year}-${randomHex}`;
}

/**
 * Checks for scheduling conflicts when creating or updating an ExamRoutine.
 */
export async function checkRoutineConflict({
  examId,
  classId,
  sectionId,
  subjectId,
  examDate,
  startTime,
  endTime,
  excludeRoutineId,
}: {
  examId: string;
  classId: string;
  sectionId?: string | null;
  subjectId: string;
  examDate: Date;
  startTime: string;
  endTime: string;
  excludeRoutineId?: string;
}): Promise<{ hasConflict: boolean; reason?: string }> {
  const startOfDay = new Date(examDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(examDate);
  endOfDay.setHours(23, 59, 59, 999);

  // 1. Check duplicate subject routine for the same exam & class
  const existingSubject = await prisma.examRoutine.findFirst({
    where: {
      examId,
      classId,
      subjectId,
      ...(excludeRoutineId ? { id: { not: excludeRoutineId } } : {}),
    },
    include: { subject: true },
  });

  if (existingSubject) {
    return {
      hasConflict: true,
      reason: `এই পরীক্ষার আওতায় ${existingSubject.subject.nameBn} বিষয়ের রুটিন ইতিমধ্যে অন্তর্ভুক্ত রয়েছে।`,
    };
  }

  // 2. Check time conflict for same exam & class (or section) on same date
  const routinesOnSameDate = await prisma.examRoutine.findMany({
    where: {
      examId,
      examDate: { gte: startOfDay, lte: endOfDay },
      classId,
      ...(sectionId ? { OR: [{ sectionId }, { sectionId: null }] } : {}),
      ...(excludeRoutineId ? { id: { not: excludeRoutineId } } : {}),
      status: { not: "CANCELLED" },
    },
    include: { subject: true },
  });

  for (const r of routinesOnSameDate) {
    // Basic time overlap check
    if (r.startTime.trim().toLowerCase() === startTime.trim().toLowerCase()) {
      return {
        hasConflict: true,
        reason: `উক্ত তারিখে একই সময়ে (${startTime}) "${r.subject.nameBn}" বিষয়ের পরীক্ষা নির্ধারিত রয়েছে।`,
      };
    }
  }

  return { hasConflict: false };
}

/**
 * Verifies that a teacher is assigned to teach the requested class/section/subject.
 * Admins bypass this check.
 */
export async function verifyTeacherSubjectAssignment(
  teacherUserId: string,
  sessionId: string,
  classId: string,
  sectionId: string | null | undefined,
  subjectId: string
): Promise<boolean> {
  const assignment = await prisma.teacherAssignment.findFirst({
    where: {
      teacherId: teacherUserId,
      sessionId,
      classId,
      ...(sectionId ? { OR: [{ sectionId }, { sectionId: null }] } : {}),
      ...(subjectId ? { OR: [{ subjectId }, { subjectId: null }] } : {}),
    },
  });

  return !!assignment;
}
