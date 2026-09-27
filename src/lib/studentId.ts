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

  // Find all existing IDs with this year's prefix
  const students = await prisma.student.findMany({
    where: {
      studentIdNumber: {
        startsWith: prefix,
      },
    },
    select: {
      studentIdNumber: true,
    },
  });

  let maxSeq = 0;
  for (const s of students) {
    const rest = s.studentIdNumber.slice(prefix.length);
    if (/^\d+$/.test(rest)) {
      const num = parseInt(rest, 10);
      if (num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  const nextSequence = maxSeq + 1;
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
