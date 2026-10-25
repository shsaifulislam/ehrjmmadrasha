import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/security";
import {
  issueOfficialDocument,
  validateDocumentEligibility,
  reissueDocument,
  revokeDocument,
  DOCUMENT_TYPES,
  DOCUMENT_CATEGORIES,
} from "@/lib/documentFactory";
import {
  getDocumentAutomationSettings,
  DocumentAutomationSettings,
} from "@/lib/systemSettings";

export interface StudentDocumentOverview {
  student: any;
  categories: {
    id: string;
    nameBn: string;
    icon: string;
    documents: Array<{
      code: string;
      nameBn: string;
      nameEn: string;
      category: string;
      prefix: string;
      eligible: boolean;
      eligibilityReason?: string;
      currentDocument?: any;
      activeStatus: "ACTIVE" | "ISSUED" | "REISSUED" | "REVOKED" | "NOT_ISSUED";
      canGenerate: boolean;
      canReissue: boolean;
      canRevoke: boolean;
    }>;
  }[];
  activeIdCard: any | null;
  totalDocumentsCount: number;
  eligibleCount: number;
}

/**
 * Resolve Complete Central Document Center Overview for a Single Student
 * Shows all document types grouped by category with live server-side eligibility checks.
 */
export async function resolveStudentDocumentCenterOverview(studentId: string): Promise<StudentDocumentOverview | null> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      enrollments: {
        include: {
          jamatClass: true,
          section: true,
          session: true,
        },
        orderBy: { enrolledAt: "desc" },
      },
      guardianLinks: {
        include: { guardian: true },
      },
    },
  });

  if (!student) return null;

  // Retrieve all certificates issued to this student
  const certificates = await prisma.certificate.findMany({
    where: { studentId },
    include: {
      template: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const activeIdCard = certificates.find(
    (c) => c.certificateType === "STUDENT_ID" && !c.isRevoked && c.status === "ISSUED"
  ) || null;

  // Group by category
  const categoriesMap: Record<string, any[]> = {};
  for (const cat of DOCUMENT_CATEGORIES) {
    categoriesMap[cat.id] = [];
  }

  let totalDocs = certificates.length;
  let eligibleCount = 0;

  for (const docType of DOCUMENT_TYPES) {
    const matchedCerts = certificates.filter((c) => c.certificateType === docType.code);
    const activeDoc = matchedCerts.find((c) => !c.isRevoked && c.status === "ISSUED");
    const latestDoc = activeDoc || matchedCerts[0] || null;

    // Validate eligibility server-side
    const eligibility = await validateDocumentEligibility(studentId, docType.code);
    if (eligibility.eligible) eligibleCount++;

    const isCompletionType = ["HIFZ_CERTIFICATE", "MISHKAT_CERTIFICATE", "DAWRA_CERTIFICATE"].includes(docType.code);

    let activeStatus: "ACTIVE" | "ISSUED" | "REISSUED" | "REVOKED" | "NOT_ISSUED" = "NOT_ISSUED";
    if (activeDoc) {
      activeStatus = docType.code === "STUDENT_ID" ? "ACTIVE" : "ISSUED";
    } else if (latestDoc) {
      if (latestDoc.isRevoked) {
        activeStatus = latestDoc.reissuedFromId ? "REISSUED" : "REVOKED";
      } else {
        activeStatus = latestDoc.status as any;
      }
    }

    const canGenerate = eligibility.eligible && (!activeDoc || docType.code === "PAYMENT_RECEIPT" || docType.code === "FEE_INVOICE");
    const canReissue = Boolean(activeDoc);
    const canRevoke = Boolean(activeDoc);

    const docItem = {
      code: docType.code,
      nameBn: docType.nameBn,
      nameEn: docType.nameEn,
      category: docType.category,
      prefix: docType.prefix,
      eligible: eligibility.eligible,
      eligibilityReason: eligibility.reason,
      currentDocument: latestDoc,
      activeStatus,
      canGenerate,
      canReissue,
      canRevoke,
      isCompletionType,
    };

    if (categoriesMap[docType.category]) {
      categoriesMap[docType.category].push(docItem);
    } else {
      categoriesMap["INSTITUTIONAL"].push(docItem);
    }
  }

  const structuredCategories = DOCUMENT_CATEGORIES.map((cat) => ({
    id: cat.id,
    nameBn: cat.nameBn,
    icon: cat.icon,
    documents: categoriesMap[cat.id] || [],
  }));

  return {
    student,
    categories: structuredCategories,
    activeIdCard,
    totalDocumentsCount: totalDocs,
    eligibleCount,
  };
}

/**
 * Trigger Automatic Document Issuance upon Admission Approval
 * Invariant: Idempotent. Does NOT create duplicate active ID cards or admission confirmations.
 */
export async function triggerAdmissionApprovedAutomation(params: {
  studentId: string;
  adminUserId?: string;
  sessionId?: string;
}): Promise<{
  idCardIssued: boolean;
  admissionConfirmationIssued: boolean;
  certificates: any[];
  reasons: string[];
}> {
  const { studentId, adminUserId, sessionId } = params;
  const settings = getDocumentAutomationSettings();
  const issuedCerts: any[] = [];
  const reasons: string[] = [];

  let idCardIssued = false;
  let admissionConfirmationIssued = false;

  // 1. Automatic Student ID Card
  if (settings.autoIssueIdCardOnAdmission) {
    try {
      // Check existing active ID card to guarantee idempotency
      const existingIdCard = await prisma.certificate.findFirst({
        where: {
          studentId,
          certificateType: "STUDENT_ID",
          isRevoked: false,
          status: "ISSUED",
        },
      });

      if (existingIdCard) {
        reasons.push(`সক্রিয় আইডি কার্ড ইতিমধ্যে বিদ্যমান (${existingIdCard.certificateNumber})`);
      } else {
        const idCard = await issueOfficialDocument({
          studentId,
          documentType: "STUDENT_ID",
          sessionId,
          issuedByUserId: adminUserId,
          customNotes: "ভর্তি অনুমোদনের পর সিস্টেম কর্তৃক স্বয়ংক্রিয়ভাবে প্রস্তুতকৃত অফিসিয়াল ডিজিটাল আইডি কার্ড।",
        });
        issuedCerts.push(idCard);
        idCardIssued = true;

        await recordAuditLog({
          userId: adminUserId || "SYSTEM",
          action: "AUTO_ISSUE_STUDENT_ID",
          entityType: "Certificate",
          entityId: idCard.id,
          details: {
            studentId,
            certificateNumber: idCard.certificateNumber,
            event: "ADMISSION_APPROVED",
          },
        });
      }
    } catch (err: any) {
      reasons.push(`আইডি কার্ড তৈরি ব্যর্থ: ${err.message}`);
      console.error("Auto ID Card issuance error:", err);
    }
  }

  // 2. Automatic Admission Confirmation Document
  if (settings.autoIssueAdmissionConfirmation) {
    try {
      const existingAdmConf = await prisma.certificate.findFirst({
        where: {
          studentId,
          certificateType: "ADMISSION_CONFIRMATION",
          isRevoked: false,
          status: "ISSUED",
        },
      });

      if (existingAdmConf) {
        reasons.push(`ভর্তি নিশ্চয়তাপত্র ইতিমধ্যে বিদ্যমান (${existingAdmConf.certificateNumber})`);
      } else {
        const admDoc = await issueOfficialDocument({
          studentId,
          documentType: "ADMISSION_CONFIRMATION",
          sessionId,
          issuedByUserId: adminUserId,
          customNotes: "ভর্তি অনুমোদন সাপেক্ষে স্বয়ংক্রিয়ভাবে নিশ্চিতকৃত অফিশিয়াল ভর্তি নিশ্চয়তাপত্র।",
        });
        issuedCerts.push(admDoc);
        admissionConfirmationIssued = true;

        await recordAuditLog({
          userId: adminUserId || "SYSTEM",
          action: "AUTO_ISSUE_ADMISSION_CONFIRMATION",
          entityType: "Certificate",
          entityId: admDoc.id,
          details: {
            studentId,
            certificateNumber: admDoc.certificateNumber,
            event: "ADMISSION_APPROVED",
          },
        });
      }
    } catch (err: any) {
      reasons.push(`ভর্তি নিশ্চয়তাপত্র তৈরি ব্যর্থ: ${err.message}`);
      console.error("Auto Admission Confirmation issuance error:", err);
    }
  }

  return {
    idCardIssued,
    admissionConfirmationIssued,
    certificates: issuedCerts,
    reasons,
  };
}

/**
 * Generate All Available / Eligible Documents for a Single Student
 * Carefully determines which documents are eligible and not already actively issued.
 */
export async function generateAllAvailableDocumentsForStudent(params: {
  studentId: string;
  adminUserId?: string;
  sessionId?: string;
}): Promise<{
  generated: any[];
  skipped: Array<{ code: string; nameBn: string; reason: string }>;
}> {
  const { studentId, adminUserId, sessionId } = params;
  const overview = await resolveStudentDocumentCenterOverview(studentId);

  if (!overview) {
    throw new Error("শিক্ষার্থী রেকর্ড খুঁজে পাওয়া যায়নি।");
  }

  const generated: any[] = [];
  const skipped: Array<{ code: string; nameBn: string; reason: string }> = [];

  // Iterate over all candidate document types
  const candidateTypes = [
    "STUDENT_ID",
    "ADMISSION_CONFIRMATION",
    "HIFZ_CERTIFICATE",
    "MISHKAT_CERTIFICATE",
    "DAWRA_CERTIFICATE",
    "STUDY_CERTIFICATE",
    "PRATYAYAN_PATRA",
    "CHARACTER_CERTIFICATE",
    "TESTIMONIAL",
    "STUDENT_STATUS",
  ];

  for (const typeCode of candidateTypes) {
    const docMeta = DOCUMENT_TYPES.find((d) => d.code === typeCode);
    const nameBn = docMeta?.nameBn || typeCode;

    // 1. Check server-side eligibility
    const eligibility = await validateDocumentEligibility(studentId, typeCode, sessionId);
    if (!eligibility.eligible) {
      skipped.push({
        code: typeCode,
        nameBn,
        reason: eligibility.reason || "অযোগ্য",
      });
      continue;
    }

    // 2. Check if active document already exists
    const existingActive = await prisma.certificate.findFirst({
      where: {
        studentId,
        certificateType: typeCode,
        isRevoked: false,
        status: "ISSUED",
      },
    });

    if (existingActive) {
      skipped.push({
        code: typeCode,
        nameBn,
        reason: `ইতিমধ্যে সক্রিয় রয়েছে (নম্বর: ${existingActive.certificateNumber})`,
      });
      continue;
    }

    // 3. Issue Document
    try {
      const cert = await issueOfficialDocument({
        studentId,
        documentType: typeCode,
        sessionId,
        issuedByUserId: adminUserId,
        customNotes: "সেন্ট্রাল স্টুডেন্ট কন্ট্রোল সেন্টার হইতে যৌথভাবে প্রস্তুতকৃত অফিশিয়াল সনদ।",
      });
      generated.push(cert);
    } catch (err: any) {
      skipped.push({
        code: typeCode,
        nameBn,
        reason: err.message || "ইস্যু প্রক্রিয়াকরণে ত্রুটি",
      });
    }
  }

  return { generated, skipped };
}
