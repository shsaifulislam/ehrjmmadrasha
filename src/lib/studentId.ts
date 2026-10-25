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
export async function generateStudentIdNumber(targetYear?: number, client: any = prisma): Promise<string> {
  const year = targetYear || new Date().getFullYear();
  const prefix = `EHRJ-${year}-`;

  const latestStudent = await client.student.findFirst({
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

  let maxSeq = 0;
  if (latestStudent?.studentIdNumber) {
    const rest = latestStudent.studentIdNumber.slice(prefix.length);
    if (/^\d+$/.test(rest)) {
      maxSeq = parseInt(rest, 10);
    }
  }

  const count = await client.student.count({
    where: { studentIdNumber: { startsWith: prefix } },
  });

  const nextSequence = Math.max(maxSeq + 1, count + 1);
  const paddedSeq = String(nextSequence).padStart(4, "0");
  return `${prefix}${paddedSeq}`;
}

/**
 * Calculates the next available Roll Number for a given Session, Class, and optional Section.
 */
export async function getNextRollNumber(
  sessionId: string,
  classId: string,
  sectionId?: string | null,
  client: any = prisma
): Promise<number> {
  const latestEnrollment = await client.enrollment.findFirst({
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
