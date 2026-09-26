import { prisma } from "@/lib/prisma";

export interface DuplicateMatch {
  confidence: "HIGH" | "MEDIUM" | "LOW";
  matchReason: string;
  sourceType: "APPLICATION" | "STUDENT";
  recordId: string;
  identifier: string; // tracking number or studentId
  fullNameBn: string;
  guardianPhone: string;
  dateOfBirth?: string;
  status: string;
}

export interface DuplicateCheckInput {
  studentNameBn: string;
  dateOfBirth?: string | Date;
  fatherNameBn?: string;
  guardianPhone: string;
  birthCertificateNo?: string | null;
  nidNo?: string | null;
  excludeApplicationId?: string;
}

/**
 * Searches for potential duplicate records across existing Applications and enrolled Students.
 * Classifies findings into HIGH, MEDIUM, and LOW confidence matches.
 * 
 * Invariant: Never automatically rejects an application; returns findings for Admin review.
 */
export async function detectDuplicates(input: DuplicateCheckInput): Promise<DuplicateMatch[]> {
  const matches: DuplicateMatch[] = [];
  const cleanName = input.studentNameBn ? input.studentNameBn.trim() : "";
  const cleanPhone = input.guardianPhone ? input.guardianPhone.trim() : "";
  const cleanBirthReg = input.birthCertificateNo ? input.birthCertificateNo.trim() : null;
  const cleanNid = input.nidNo ? input.nidNo.trim() : null;
  const dobDate = input.dateOfBirth ? new Date(input.dateOfBirth) : null;

  // 1. HIGH CONFIDENCE: Match on unique legal identifiers (Birth Registration or NID)
  if (cleanBirthReg || cleanNid) {
    // Check in Student Master
    const studentLegalMatches = await prisma.student.findMany({
      where: {
        OR: [
          ...(cleanBirthReg ? [{ birthCertificateNo: cleanBirthReg }] : []),
          ...(cleanNid ? [{ nidNo: cleanNid }] : []),
        ],
      },
      select: {
        id: true,
        studentIdNumber: true,
        fullNameBn: true,
        fatherPhone: true,
        dateOfBirth: true,
        status: true,
      },
    });

    for (const sm of studentLegalMatches) {
      matches.push({
        confidence: "HIGH",
        matchReason: "জন্ম নিবন্ধন বা জাতীয় পরিচয়পত্র নম্বর ইতিমধ্যে নিবন্ধিত শিক্ষার্থীর সাথে সম্পূর্ণ মিলে গেছে।",
        sourceType: "STUDENT",
        recordId: sm.id,
        identifier: sm.studentIdNumber,
        fullNameBn: sm.fullNameBn,
        guardianPhone: sm.fatherPhone || "যোগাযোগ নেই",
        dateOfBirth: sm.dateOfBirth.toISOString().split("T")[0],
        status: sm.status,
      });
    }

    // Check in Applications
    const appLegalMatches = await prisma.application.findMany({
      where: {
        ...(input.excludeApplicationId ? { id: { not: input.excludeApplicationId } } : {}),
        OR: [
          ...(cleanBirthReg ? [{ birthCertificateNo: cleanBirthReg }] : []),
          ...(cleanNid ? [{ nidNo: cleanNid }] : []),
        ],
      },
      select: {
        id: true,
        applicationNumber: true,
        studentNameBn: true,
        guardianPhone: true,
        dateOfBirth: true,
        status: true,
      },
    });

    for (const am of appLegalMatches) {
      matches.push({
        confidence: "HIGH",
        matchReason: "জন্ম নিবন্ধন বা জাতীয় পরিচয়পত্র নম্বর পূর্ববর্তী ভর্তি আবেদনের সাথে মিলে গেছে।",
        sourceType: "APPLICATION",
        recordId: am.id,
        identifier: am.applicationNumber,
        fullNameBn: am.studentNameBn,
        guardianPhone: am.guardianPhone,
        dateOfBirth: am.dateOfBirth.toISOString().split("T")[0],
        status: am.status,
      });
    }
  }

  // 2. MEDIUM CONFIDENCE: Same Phone + Same Date of Birth OR Same Father Name
  if (cleanPhone) {
    // In Students
    const studentPhoneMatches = await prisma.student.findMany({
      where: {
        fatherPhone: cleanPhone,
      },
      select: {
        id: true,
        studentIdNumber: true,
        fullNameBn: true,
        fatherPhone: true,
        fatherNameBn: true,
        dateOfBirth: true,
        status: true,
      },
    });

    for (const spm of studentPhoneMatches) {
      // Check if already in matches
      if (matches.some((m) => m.recordId === spm.id)) continue;

      const sameDob = dobDate && spm.dateOfBirth.toISOString().split("T")[0] === dobDate.toISOString().split("T")[0];
      const sameName = cleanName && spm.fullNameBn.includes(cleanName);

      if (sameDob || sameName) {
        matches.push({
          confidence: "MEDIUM",
          matchReason: sameDob
            ? "একই অভিভাবকের ফোন নম্বর এবং একই জন্ম তারিখের শিক্ষার্থী পাওয়া গেছে।"
            : "একই অভিভাবকের ফোন নম্বর এবং সমরূপ নামের শিক্ষার্থী পাওয়া গেছে।",
          sourceType: "STUDENT",
          recordId: spm.id,
          identifier: spm.studentIdNumber,
          fullNameBn: spm.fullNameBn,
          guardianPhone: spm.fatherPhone || cleanPhone,
          dateOfBirth: spm.dateOfBirth.toISOString().split("T")[0],
          status: spm.status,
        });
      }
    }

    // In Applications
    const appPhoneMatches = await prisma.application.findMany({
      where: {
        ...(input.excludeApplicationId ? { id: { not: input.excludeApplicationId } } : {}),
        guardianPhone: cleanPhone,
      },
      select: {
        id: true,
        applicationNumber: true,
        studentNameBn: true,
        guardianPhone: true,
        dateOfBirth: true,
        status: true,
      },
    });

    for (const apm of appPhoneMatches) {
      if (matches.some((m) => m.recordId === apm.id)) continue;

      const sameDob = dobDate && apm.dateOfBirth.toISOString().split("T")[0] === dobDate.toISOString().split("T")[0];
      const sameName = cleanName && apm.studentNameBn.includes(cleanName);

      if (sameDob || sameName) {
        matches.push({
          confidence: "MEDIUM",
          matchReason: sameDob
            ? "একই ফোন নম্বর এবং একই জন্ম তারিখের পূর্ববর্তী ভর্তি আবেদন বিদ্যমান।"
            : "একই ফোন নম্বর এবং সমরূপ নামের পূর্ববর্তী আবেদন বিদ্যমান।",
          sourceType: "APPLICATION",
          recordId: apm.id,
          identifier: apm.applicationNumber,
          fullNameBn: apm.studentNameBn,
          guardianPhone: apm.guardianPhone,
          dateOfBirth: apm.dateOfBirth.toISOString().split("T")[0],
          status: apm.status,
        });
      }
    }
  }

  // 3. LOW CONFIDENCE: Exact Name Match with different phone/details
  if (cleanName && matches.length === 0) {
    const nameMatches = await prisma.student.findMany({
      where: {
        fullNameBn: cleanName,
      },
      take: 3,
      select: {
        id: true,
        studentIdNumber: true,
        fullNameBn: true,
        fatherPhone: true,
        dateOfBirth: true,
        status: true,
      },
    });

    for (const nm of nameMatches) {
      matches.push({
        confidence: "LOW",
        matchReason: "শুধুমাত্র সমরূপ নামের সাধারণ শিক্ষার্থী রেকর্ড পাওয়া গেছে (ফোন ভিন্ন)।",
        sourceType: "STUDENT",
        recordId: nm.id,
        identifier: nm.studentIdNumber,
        fullNameBn: nm.fullNameBn,
        guardianPhone: nm.fatherPhone || "ভিন্ন",
        dateOfBirth: nm.dateOfBirth.toISOString().split("T")[0],
        status: nm.status,
      });
    }
  }

  return matches;
}
