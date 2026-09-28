import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { recordSecurityEvent } from "@/lib/securityEngine";

export interface DuplicateStudentCandidate {
  id: string; // Candidate pair ID
  survivorId: string;
  duplicateId: string;
  survivorStudentId: string;
  duplicateStudentId: string;
  survivorNameBn: string;
  duplicateNameBn: string;
  survivorPhone: string;
  duplicatePhone: string;
  confidence: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  matchReason: string;
  detectedAt: string;
  status: "DETECTED" | "REVIEW_REQUIRED" | "CONFIRMED_DUPLICATE" | "FALSE_POSITIVE" | "MERGE_PLANNED" | "MERGED" | "REJECTED";
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface MergePlanPreview {
  survivor: {
    id: string;
    studentIdNumber: string;
    fullNameBn: string;
    fullNameEn: string;
    fatherPhone: string | null;
    dateOfBirth: string;
    status: string;
  };
  duplicate: {
    id: string;
    studentIdNumber: string;
    fullNameBn: string;
    fullNameEn: string;
    fatherPhone: string | null;
    dateOfBirth: string;
    status: string;
  };
  impactSummary: {
    enrollmentsCount: number;
    invoicesCount: number;
    receiptsCount: number;
    attendancesCount: number;
    examMarksCount: number;
    resultsCount: number;
    documentsCount: number;
    certificatesCount: number;
    guardiansCount: number;
    libraryCount: number;
    residentialCount: number;
    transportCount: number;
  };
  potentialConflicts: string[];
}

const CANDIDATES_FILE = path.join(process.cwd(), "data", "governance", "duplicate_candidates.json");
const MERGE_AUDIT_FILE = path.join(process.cwd(), "data", "governance", "merge_audit_log.json");

function ensureFiles() {
  const dir = path.join(process.cwd(), "data", "governance");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(CANDIDATES_FILE)) fs.writeFileSync(CANDIDATES_FILE, JSON.stringify([], null, 2), "utf-8");
  if (!fs.existsSync(MERGE_AUDIT_FILE)) fs.writeFileSync(MERGE_AUDIT_FILE, JSON.stringify([], null, 2), "utf-8");
}

export function getAllDuplicateCandidates(): DuplicateStudentCandidate[] {
  ensureFiles();
  try {
    return JSON.parse(fs.readFileSync(CANDIDATES_FILE, "utf-8"));
  } catch {
    return [];
  }
}

export function saveAllDuplicateCandidates(candidates: DuplicateStudentCandidate[]) {
  ensureFiles();
  fs.writeFileSync(CANDIDATES_FILE, JSON.stringify(candidates, null, 2), "utf-8");
}

// -------------------------------------------------------------
// 1. SCAN ALL STUDENT DUPLICATES
// -------------------------------------------------------------
export async function scanAllStudentDuplicates(): Promise<DuplicateStudentCandidate[]> {
  ensureFiles();
  const students = await prisma.student.findMany({
    select: {
      id: true,
      studentIdNumber: true,
      fullNameBn: true,
      fatherPhone: true,
      dateOfBirth: true,
      birthCertificateNo: true,
      nidNo: true,
      status: true,
      createdAt: true
    }
  });

  const existing = getAllDuplicateCandidates();
  const existingMap = new Map<string, DuplicateStudentCandidate>();
  for (const c of existing) {
    existingMap.set(`${c.survivorId}_${c.duplicateId}`, c);
    existingMap.set(`${c.duplicateId}_${c.survivorId}`, c);
  }

  const results: DuplicateStudentCandidate[] = [];

  for (let i = 0; i < students.length; i++) {
    for (let j = i + 1; j < students.length; j++) {
      const s1 = students[i];
      const s2 = students[j];

      // Identify survivor vs duplicate based on older creation or active status
      let survivor = s1;
      let duplicate = s2;
      if (s1.createdAt > s2.createdAt) {
        survivor = s2;
        duplicate = s1;
      }

      const samePhone = survivor.fatherPhone && duplicate.fatherPhone && survivor.fatherPhone.trim() === duplicate.fatherPhone.trim();
      const sameDob = survivor.dateOfBirth && duplicate.dateOfBirth && survivor.dateOfBirth.toISOString().split("T")[0] === duplicate.dateOfBirth.toISOString().split("T")[0];
      const sameName = survivor.fullNameBn.trim() === duplicate.fullNameBn.trim();
      const sameBirthCert = survivor.birthCertificateNo && duplicate.birthCertificateNo && survivor.birthCertificateNo.trim() === duplicate.birthCertificateNo.trim();
      const sameNid = survivor.nidNo && duplicate.nidNo && survivor.nidNo.trim() === duplicate.nidNo.trim();

      let confidence: "CRITICAL" | "HIGH" | "MEDIUM" | null = null;
      let matchReason = "";

      if (sameBirthCert || sameNid) {
        confidence = "CRITICAL";
        matchReason = "অনন্য জন্ম নিবন্ধন বা জাতীয় পরিচয়পত্র নম্বর অভিন্ন";
      } else if (samePhone && sameDob) {
        confidence = "HIGH";
        matchReason = "অভিভাবকের ফোন নম্বর এবং শিক্ষার্থীর জন্ম তারিখ হুবহু মিলে গেছে";
      } else if (sameName && sameDob) {
        confidence = "MEDIUM";
        matchReason = "শিক্ষার্থীর নাম এবং জন্ম তারিখ একই";
      }

      if (confidence) {
        const pairKey = `${survivor.id}_${duplicate.id}`;
        if (existingMap.has(pairKey)) {
          results.push(existingMap.get(pairKey)!);
        } else {
          const candidate: DuplicateStudentCandidate = {
            id: `DUP-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`,
            survivorId: survivor.id,
            duplicateId: duplicate.id,
            survivorStudentId: survivor.studentIdNumber,
            duplicateStudentId: duplicate.studentIdNumber,
            survivorNameBn: survivor.fullNameBn,
            duplicateNameBn: duplicate.fullNameBn,
            survivorPhone: survivor.fatherPhone || "নাই",
            duplicatePhone: duplicate.fatherPhone || "নাই",
            confidence,
            matchReason,
            detectedAt: new Date().toISOString(),
            status: "REVIEW_REQUIRED"
          };
          existingMap.set(pairKey, candidate);
          results.push(candidate);
        }
      }
    }
  }

  saveAllDuplicateCandidates(Array.from(existingMap.values()));
  return results;
}

// -------------------------------------------------------------
// 2. PLAN STUDENT MERGE (PREVIEW IMPACT)
// -------------------------------------------------------------
export async function planStudentMerge(survivorId: string, duplicateId: string): Promise<MergePlanPreview> {
  const survivor = await prisma.student.findUnique({ where: { id: survivorId } });
  const duplicate = await prisma.student.findUnique({ where: { id: duplicateId } });

  if (!survivor || !duplicate) {
    throw new Error("Survivor or duplicate student record not found.");
  }
  if (survivor.id === duplicate.id) {
    throw new Error("Survivor and duplicate cannot be the same record.");
  }

  const [
    enrollmentsCount,
    invoicesCount,
    receiptsCount,
    attendancesCount,
    examMarksCount,
    resultsCount,
    documentsCount,
    certificatesCount,
    guardiansCount,
    libraryCount,
    residentialCount,
    transportCount
  ] = await Promise.all([
    prisma.enrollment.count({ where: { studentId: duplicate.id } }),
    prisma.feeInvoice.count({ where: { studentId: duplicate.id } }),
    prisma.paymentReceipt.count({ where: { studentId: duplicate.id } }),
    prisma.attendance.count({ where: { studentId: duplicate.id } }),
    prisma.examMark.count({ where: { studentId: duplicate.id } }),
    prisma.result.count({ where: { studentId: duplicate.id } }),
    prisma.studentDocument.count({ where: { studentId: duplicate.id } }),
    prisma.certificate.count({ where: { studentId: duplicate.id } }),
    prisma.guardianStudent.count({ where: { studentId: duplicate.id } }),
    prisma.libraryMember.count({ where: { studentId: duplicate.id } }),
    prisma.residentialEnrollment.count({ where: { studentId: duplicate.id } }),
    prisma.transportEnrollment.count({ where: { studentId: duplicate.id } })
  ]);

  const potentialConflicts: string[] = [];
  if (enrollmentsCount > 0) {
    // Check if duplicate has enrollment in same session as survivor
    const survivorEnrollments = await prisma.enrollment.findMany({ where: { studentId: survivor.id } });
    const duplicateEnrollments = await prisma.enrollment.findMany({ where: { studentId: duplicate.id } });
    for (const de of duplicateEnrollments) {
      if (survivorEnrollments.some(se => se.sessionId === de.sessionId)) {
        potentialConflicts.push(`একই শিক্ষাবর্ষে (${de.sessionId}) উভয় শিক্ষার্থীর পৃথক এনরোলমেন্ট বিদ্যমান; মার্জের সময় ডুপ্লিকেট এনরোলমেন্ট আর্কাইভ করতে হবে।`);
      }
    }
  }

  return {
    survivor: {
      id: survivor.id,
      studentIdNumber: survivor.studentIdNumber,
      fullNameBn: survivor.fullNameBn,
      fullNameEn: survivor.fullNameEn,
      fatherPhone: survivor.fatherPhone,
      dateOfBirth: survivor.dateOfBirth.toISOString().split("T")[0],
      status: survivor.status
    },
    duplicate: {
      id: duplicate.id,
      studentIdNumber: duplicate.studentIdNumber,
      fullNameBn: duplicate.fullNameBn,
      fullNameEn: duplicate.fullNameEn,
      fatherPhone: duplicate.fatherPhone,
      dateOfBirth: duplicate.dateOfBirth.toISOString().split("T")[0],
      status: duplicate.status
    },
    impactSummary: {
      enrollmentsCount,
      invoicesCount,
      receiptsCount,
      attendancesCount,
      examMarksCount,
      resultsCount,
      documentsCount,
      certificatesCount,
      guardiansCount,
      libraryCount,
      residentialCount,
      transportCount
    },
    potentialConflicts
  };
}

// -------------------------------------------------------------
// 3. EXECUTE STUDENT MERGE (STEP-UP VERIFIED)
// -------------------------------------------------------------
export async function executeStudentMerge(
  survivorId: string,
  duplicateId: string,
  actor: string,
  reason: string,
  confirmationPhrase: string
): Promise<{ success: boolean; messageBn: string; auditRecord: any }> {
  if (confirmationPhrase !== "CONFIRM-STUDENT-MERGE") {
    throw new Error("নিরাপত্তা নিশ্চয়তা বাক্য 'CONFIRM-STUDENT-MERGE' সঠিক নয়। মার্জ বাতিল করা হলো।");
  }

  const preview = await planStudentMerge(survivorId, duplicateId);
  const now = new Date();

  // Execute inside safe transaction
  await prisma.$transaction(async (tx) => {
    // 1. Move Fee Invoices
    await tx.feeInvoice.updateMany({
      where: { studentId: duplicateId },
      data: { studentId: survivorId }
    });

    // 2. Move Payment Receipts
    await tx.paymentReceipt.updateMany({
      where: { studentId: duplicateId },
      data: { studentId: survivorId }
    });

    // 3. Move Documents & Certificates
    await tx.studentDocument.updateMany({
      where: { studentId: duplicateId },
      data: { studentId: survivorId }
    });
    await tx.certificate.updateMany({
      where: { studentId: duplicateId },
      data: { studentId: survivorId }
    });

    // 4. Move Support Requests
    await tx.supportRequest.updateMany({
      where: { studentId: duplicateId },
      data: { studentId: survivorId }
    });

    // 5. Re-link Guardian links if not already linked
    const survivorGuardians = await tx.guardianStudent.findMany({ where: { studentId: survivorId } });
    const duplicateGuardians = await tx.guardianStudent.findMany({ where: { studentId: duplicateId } });
    for (const dg of duplicateGuardians) {
      if (!survivorGuardians.some(sg => sg.guardianId === dg.guardianId)) {
        await tx.guardianStudent.create({
          data: {
            guardianId: dg.guardianId,
            studentId: survivorId,
            isPrimary: false
          }
        });
      }
    }
    // Remove duplicate guardian links
    await tx.guardianStudent.deleteMany({ where: { studentId: duplicateId } });

    // 6. Mark duplicate student as MERGED (TRANSFERRED status with notes)
    await tx.student.update({
      where: { id: duplicateId },
      data: {
        status: "TRANSFERRED",
        permanentAddress: `[MERGED into ${preview.survivor.studentIdNumber} by ${actor} on ${now.toISOString()}] ${preview.duplicate.fullNameBn}`
      }
    });

    // 7. Record Audit Log in database
    const userRecord = await tx.user.findFirst({ where: { OR: [{ id: actor }, { username: actor }] } });
    const validUserId = userRecord ? userRecord.id : null;

    await tx.auditLog.create({
      data: {
        action: "STUDENT_DATA_MERGE",
        entityType: "Student",
        entityId: preview.duplicate.id,
        detailsJson: JSON.stringify({
          action: "STUDENT_DATA_MERGE",
          survivorId,
          duplicateId,
          survivorStudentId: preview.survivor.studentIdNumber,
          duplicateStudentId: preview.duplicate.studentIdNumber,
          reason,
          actor
        }),
        userId: validUserId
      }
    });
  });

  // Record Security Event
  await recordSecurityEvent({
    eventType: "HIGH_RISK_ACTION",
    severity: "HIGH",
    userId: actor,
    details: {
      action: "STUDENT_MERGE",
      survivorStudentId: preview.survivor.studentIdNumber,
      duplicateStudentId: preview.duplicate.studentIdNumber,
      reason
    }
  });

  // Update candidate status in local store
  const candidates = getAllDuplicateCandidates();
  const cand = candidates.find(c => 
    (c.survivorId === survivorId && c.duplicateId === duplicateId) ||
    (c.survivorId === duplicateId && c.duplicateId === survivorId)
  );
  if (cand) {
    cand.status = "MERGED";
    cand.reviewNotes = reason;
    cand.reviewedBy = actor;
    cand.reviewedAt = now.toISOString();
    saveAllDuplicateCandidates(candidates);
  }

  // Record into merge audit file
  const auditRecord = {
    id: `MRG-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
    survivorStudentId: preview.survivor.studentIdNumber,
    duplicateStudentId: preview.duplicate.studentIdNumber,
    survivorId,
    duplicateId,
    actor,
    reason,
    timestamp: now.toISOString(),
    recordsMoved: preview.impactSummary
  };

  try {
    const rawAudit = fs.readFileSync(MERGE_AUDIT_FILE, "utf-8");
    const auditLogs = JSON.parse(rawAudit);
    auditLogs.unshift(auditRecord);
    fs.writeFileSync(MERGE_AUDIT_FILE, JSON.stringify(auditLogs, null, 2), "utf-8");
  } catch {}

  return {
    success: true,
    messageBn: `শিক্ষার্থী ${preview.duplicate.studentIdNumber} সফলভাবে মূল শিক্ষার্থী ${preview.survivor.studentIdNumber} এর সাথে মার্জ করা হয়েছে।`,
    auditRecord
  };
}
