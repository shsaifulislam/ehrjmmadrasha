import { prisma } from "@/lib/prisma";

/**
 * Generates the next institutional Student ID in the format: EHRJ-YYYY-XXXX
 * Example: EHRJ-2026-0001
 * 
 * Rules:
 * 1. ID is unique and permanent for the student's lifetime.
 * 2. Independent of class roll number.
 * 3. Never reused.
 */
export async function generateStudentIdNumber(targetYear?: number): Promise<string> {
  const year = targetYear || new Date().getFullYear();
  const prefix = `EHRJ-${year}-`;

  // Find the highest existing ID with this year's prefix
  const latestStudent = await prisma.student.findFirst({
    where: {
      studentIdNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      studentIdNumber: "desc",
    },
    select: {
      studentIdNumber: true,
    },
  });

  let nextSequence = 1;
  if (latestStudent && latestStudent.studentIdNumber) {
    const parts = latestStudent.studentIdNumber.split("-");
    if (parts.length === 3) {
      const currentSeq = parseInt(parts[2], 10);
      if (!isNaN(currentSeq)) {
        nextSequence = currentSeq + 1;
      }
    }
  }

  const paddedSeq = String(nextSequence).padStart(4, "0");
  return `${prefix}${paddedSeq}`;
}

/**
 * Calculates the next available Roll Number for a given Session, Class, and optional Section.
 */
export async function getNextRollNumber(
  sessionId: string,
  classId: string,
  sectionId?: string | null
): Promise<number> {
  const latestEnrollment = await prisma.enrollment.findFirst({
    where: {
      sessionId,
      classId,
      ...(sectionId ? { sectionId } : {}),
    },
    orderBy: {
      rollNumber: "desc",
    },
    select: {
      rollNumber: true,
    },
  });

  return (latestEnrollment?.rollNumber || 0) + 1;
}
