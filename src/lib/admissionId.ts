import { prisma } from "@/lib/prisma";

/**
 * Generates the next unique Application Tracking ID in the format: EHRJ-ADM-YYYY-XXXX
 * Example: EHRJ-ADM-2026-0001
 * 
 * Rules:
 * 1. Generated server-side only.
 * 2. Concurrency-safe and unique.
 * 3. Immutable after creation.
 * 4. Distinct from Student ID and roll number.
 */
export async function generateApplicationNumber(targetYear?: number): Promise<string> {
  const year = targetYear || new Date().getFullYear();
  const prefix = `EHRJ-ADM-${year}-`;

  const latestApp = await prisma.application.findFirst({
    where: {
      applicationNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      applicationNumber: "desc",
    },
    select: {
      applicationNumber: true,
    },
  });

  let nextSequence = 1;
  if (latestApp && latestApp.applicationNumber) {
    const parts = latestApp.applicationNumber.split("-");
    if (parts.length === 4) {
      const currentSeq = parseInt(parts[3], 10);
      if (!isNaN(currentSeq)) {
        nextSequence = currentSeq + 1;
      }
    }
  }

  const paddedSeq = String(nextSequence).padStart(4, "0");
  return `${prefix}${paddedSeq}`;
}
