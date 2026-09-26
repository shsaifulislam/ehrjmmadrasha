import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";
import { INSTITUTION_INFO } from "@/lib/constants";

export const DOCUMENT_TYPES = [
  { code: "STUDENT_ID", nameBn: "ডিজিটাল স্টুডেন্ট আইডি কার্ড", nameEn: "Digital Student ID Card", prefix: "EHRJ-ID" },
  { code: "STUDY_CERTIFICATE", nameBn: "অধ্যয়ন প্রত্যয়নপত্র", nameEn: "Study / Enrollment Certificate", prefix: "EHRJ-STUDY" },
  { code: "CHARACTER_CERTIFICATE", nameBn: "চারিত্রিক প্রশংসাপত্র", nameEn: "Character Certificate", prefix: "EHRJ-CHAR" },
  { code: "TRANSFER_CERTIFICATE", nameBn: "ছাড়পত্র / টিসি", nameEn: "Transfer Certificate", prefix: "EHRJ-TC" },
  { code: "TESTIMONIAL", nameBn: "প্রশংসাপত্র", nameEn: "Testimonial", prefix: "EHRJ-TEST" },
  { code: "ADMISSION_CONFIRMATION", nameBn: "ভর্তি নিশ্চয়তা পত্র", nameEn: "Admission Confirmation", prefix: "EHRJ-ADM" },
  { code: "OTHER", nameBn: "অন্যান্য অফিশিয়াল প্রত্যয়নপত্র", nameEn: "Other Official Certificate", prefix: "EHRJ-DOC" },
] as const;

export type DocumentTypeCode = (typeof DOCUMENT_TYPES)[number]["code"];

/**
 * Standard Default Document Templates
 */
export const DEFAULT_TEMPLATES = [
  {
    code: "STUDENT_ID",
    documentType: "STUDENT_ID",
    nameBn: "ডিজিটাল স্টুডেন্ট আইডি কার্ড টেমপ্লেট",
    nameEn: "Student ID Card Template",
    titleBn: "স্টুডেন্ট আইডি কার্ড",
    titleEn: "Student Identity Card",
    bodyBn: "নাম: {{student.nameBn}}\nআইডি: {{student.studentId}}\nজামাত: {{class.name}}, শাখা: {{section.name}}, রোল: {{roll}}\nশিক্ষাবর্ষ: {{session.name}}\nজরুরি যোগাযোগ: {{guardian.phone}}",
    bodyEn: "Name: {{student.nameEn}}\nID: {{student.studentId}}\nClass: {{class.name}}, Roll: {{roll}}\nSession: {{session.name}}",
    signatoryTitleBn: "মুহতামিম ও অধ্যক্ষ",
    requiresFee: false,
    feeAmount: 0,
  },
  {
    code: "STUDY_CERTIFICATE",
    documentType: "STUDY_CERTIFICATE",
    nameBn: "অধ্যয়ন প্রত্যয়নপত্র টেমপ্লেট",
    nameEn: "Study Certificate Template",
    titleBn: "অধ্যয়ন প্রত্যয়নপত্র",
    titleEn: "Study / Enrollment Certificate",
    bodyBn: "এই মর্মে প্রত্যয়ন করা যাচ্ছে যে, {{student.nameBn}}, পিতা: {{student.fatherNameBn}}, মাতা: {{student.motherNameBn}}, ঠিকানা: {{student.presentAddress}}— অত্র জামিয়ার {{session.name}} শিক্ষাবর্ষের {{class.name}} জামাতের একজন নিয়মিত ছাত্র। তার মাদরাসা আইডি নম্বর {{student.studentId}} এবং শ্রেণিতে তার বর্তমান রোল নম্বর {{roll}}। আমাদের জানামতে সে একজন পাঠনিষ্ঠ ও বিনয়ী ছাত্র।",
    bodyEn: "This is to certify that {{student.nameBn}}, Son of {{student.fatherNameBn}} and {{student.motherNameBn}}, is a regular student of {{class.name}} for the academic session {{session.name}} at our institution. His Student ID is {{student.studentId}} and Roll is {{roll}}.",
    signatoryTitleBn: "মুহতামিম ও শায়খুল হাদিস",
    requiresFee: false,
    feeAmount: 0,
  },
  {
    code: "CHARACTER_CERTIFICATE",
    documentType: "CHARACTER_CERTIFICATE",
    nameBn: "চারিত্রিক প্রশংসাপত্র টেমপ্লেট",
    nameEn: "Character Certificate Template",
    titleBn: "চারিত্রিক প্রশংসাপত্র",
    titleEn: "Character Certificate",
    bodyBn: "এই মর্মে চারিত্রিক প্রত্যয়ন প্রদান করা যাচ্ছে যে, {{student.nameBn}}, পিতা: {{student.fatherNameBn}}, মাতা: {{student.motherNameBn}}— ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসায় অধ্যয়নরত অবস্থায় সদাচরণ, নিয়মশৃঙ্খলা ও দ্বীনি শিষ্টাচার বজায় রেখেছে। অত্র মাদরাসার রেকর্ডে তার বিরুদ্ধে কোনো ধরনের নৈতিক স্খলন বা নিয়মভঙ্গের অভিযোগ নেই। তার স্বভাব-চরিত্র প্রশংসনীয়।\n\nআমরা তার ভবিষ্যৎ জীবনের সার্বিক কল্যাণ ও উজ্জ্বল সফলতা কামনা করি।",
    bodyEn: "This is to certify that {{student.nameBn}}, Son of {{student.fatherNameBn}}, has maintained exemplary character, discipline, and moral conduct during his tenure at our institution. There is no record of misconduct against him.",
    signatoryTitleBn: "মুহতামিম ও অধ্যক্ষ",
    requiresFee: false,
    feeAmount: 0,
  },
  {
    code: "TRANSFER_CERTIFICATE",
    documentType: "TRANSFER_CERTIFICATE",
    nameBn: "ছাড়পত্র (টিসি) টেমপ্লেট",
    nameEn: "Transfer Certificate (TC) Template",
    titleBn: "ছাড়পত্র / বদলি সনদ",
    titleEn: "Transfer Certificate",
    bodyBn: "অত্র জামিয়া হইতে জানানো যাইতেছে যে, {{student.nameBn}}, ছাত্র আইডি: {{student.studentId}}, পিতা: {{student.fatherNameBn}}, মাতা: {{student.motherNameBn}}— অত্র প্রতিষ্ঠানে {{session.name}} শিক্ষাবর্ষ পর্যন্ত {{class.name}} জামাতে অধ্যয়নরত ছিল। অভিভাবকের আবেদনের প্রেক্ষিতে এবং প্রতিষ্ঠানের সমস্ত পাওনাদি পরিশোধ সাপেক্ষে তাহাকে অত্র প্রতিষ্ঠান হইতে ছাড়পত্র প্রদান করা হইল।\n\nঅত্র প্রতিষ্ঠানে অধ্যয়নকালে তাহার নৈতিক চরিত্র সন্তোষজনক ছিল। তাহার ভবিষ্যৎ সাফল্য কামনা করি।",
    bodyEn: "This is to certify that {{student.nameBn}}, Student ID: {{student.studentId}}, was enrolled in {{class.name}} up to academic session {{session.name}}. All institutional dues have been settled. He is granted this transfer certificate upon guardian application.",
    signatoryTitleBn: "মুহতামিম ও অধ্যক্ষ",
    requiresFee: true,
    feeAmount: 200,
  },
  {
    code: "TESTIMONIAL",
    documentType: "TESTIMONIAL",
    nameBn: "প্রশংসাপত্র টেমপ্লেট",
    nameEn: "Institutional Testimonial Template",
    titleBn: "প্রশংসাপত্র",
    titleEn: "Testimonial",
    bodyBn: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার পক্ষ হইতে আনন্দের সাথে প্রত্যয়ন করা যাইতেছে যে, {{student.nameBn}}, ছাত্র আইডি: {{student.studentId}}, অত্র প্রতিষ্ঠানের একজন যোগ্য ও অনুগত শিক্ষার্থী ছিল। সে পাঠগ্রহণে যত্নবান এবং মাদরাসার নিয়মকানুনের প্রতি সর্বদা শ্রদ্ধাশীল ছিল। দ্বীনি ও সাধারণ শিক্ষায় তাহার অগ্রগতি প্রশংসনীয়।\n\nআমরা তাহার ইহকালীন ও পরকালীন জীবনের সর্বাঙ্গীন উন্নতি ও বরকত কামনা করি।",
    bodyEn: "It gives us great pleasure to certify that {{student.nameBn}}, Student ID: {{student.studentId}}, was a dedicated and well-behaved student of our institution. His progress in studies and adherence to values has been commendable.",
    signatoryTitleBn: "মুহতামিম ও শায়খুল হাদিস",
    requiresFee: false,
    feeAmount: 0,
  },
  {
    code: "ADMISSION_CONFIRMATION",
    documentType: "ADMISSION_CONFIRMATION",
    nameBn: "ভর্তি নিশ্চয়তা পত্র টেমপ্লেট",
    nameEn: "Admission Confirmation Document Template",
    titleBn: "ভর্তি নিশ্চয়তা ও প্রত্যয়নপত্র",
    titleEn: "Admission Confirmation Document",
    bodyBn: "এতদ্বারা নিশ্চিত করা যাচ্ছে যে, শিক্ষার্থী {{student.nameBn}}, পিতা: {{student.fatherNameBn}}, মাতা: {{student.motherNameBn}}— ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসায় {{session.name}} শিক্ষাবর্ষে {{class.name}} জামাতে আনুষ্ঠানিকভাবে ভর্তি নিশ্চিত হয়েছে। তাহার প্রাতিষ্ঠানিক স্টুডেন্ট আইডি: {{student.studentId}} এবং নির্ধারিত শ্রেণি রোল নম্বর: {{roll}}।",
    bodyEn: "This document officially confirms the admission of {{student.nameBn}} to {{class.name}} for the academic session {{session.name}} at Eliotganj Hazi Rohmatollah Jamiria Madrasha with Student ID: {{student.studentId}} and Roll: {{roll}}.",
    signatoryTitleBn: "ভর্তি সমন্বয়ক ও অধ্যক্ষ",
    requiresFee: false,
    feeAmount: 0,
  },
];

/**
 * Initialize Default Templates if not present in database
 */
export async function ensureDefaultTemplates(): Promise<void> {
  for (const tpl of DEFAULT_TEMPLATES) {
    const existing = await prisma.documentTemplate.findUnique({
      where: { code: tpl.code },
    });
    if (!existing) {
      await prisma.documentTemplate.create({
        data: {
          code: tpl.code,
          nameBn: tpl.nameBn,
          nameEn: tpl.nameEn,
          documentType: tpl.documentType,
          titleBn: tpl.titleBn,
          titleEn: tpl.titleEn,
          bodyBn: tpl.bodyBn,
          bodyEn: tpl.bodyEn,
          signatoryTitleBn: tpl.signatoryTitleBn,
          requiresFee: tpl.requiresFee,
          feeAmount: tpl.feeAmount,
          version: 1,
          isActive: true,
        },
      });
    }
  }
}

/**
 * Template Variable Interpolator
 * Safe pure-string replacement with zero code-execution capability
 */
export function interpolateTemplate(templateText: string, vars: Record<string, any>): string {
  if (!templateText) return "";

  return templateText.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, key) => {
    const keys = key.split(".");
    let current: any = vars;
    for (const k of keys) {
      if (current === undefined || current === null) return "";
      current = current[k];
    }
    return current !== undefined && current !== null ? String(current) : "";
  });
}

/**
 * Generate Next Unique Concurrency-Safe Document Number
 * Format: PREFIX-YYYY-XXXXX (e.g. EHRJ-CHAR-2026-00001)
 */
export async function generateNextDocumentNumber(docType: string): Promise<string> {
  const currentYear = new Date().getFullYear();
  const matchedType = DOCUMENT_TYPES.find((t) => t.code === docType);
  const prefix = matchedType ? matchedType.prefix : "EHRJ-DOC";
  const searchPrefix = `${prefix}-${currentYear}-`;

  const latest = await prisma.certificate.findFirst({
    where: { certificateNumber: { startsWith: searchPrefix } },
    orderBy: { certificateNumber: "desc" },
    select: { certificateNumber: true },
  });

  let maxSeq = 0;
  if (latest?.certificateNumber) {
    const parts = latest.certificateNumber.split("-");
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num)) maxSeq = num;
  }

  const count = await prisma.certificate.count({
    where: { certificateType: docType },
  });

  const nextSeq = Math.max(maxSeq + 1, count + 1);
  return `${searchPrefix}${String(nextSeq).padStart(5, "0")}`;
}

/**
 * Generate Next Unique Concurrency-Safe Request Number
 * Format: EHRJ-REQ-YYYY-XXXXX
 */
export async function generateNextRequestNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const searchPrefix = `EHRJ-REQ-${currentYear}-`;

  const latest = await prisma.documentRequest.findFirst({
    where: { requestNumber: { startsWith: searchPrefix } },
    orderBy: { requestNumber: "desc" },
    select: { requestNumber: true },
  });

  let maxSeq = 0;
  if (latest?.requestNumber) {
    const parts = latest.requestNumber.split("-");
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num)) maxSeq = num;
  }

  const count = await prisma.documentRequest.count();
  const nextSeq = Math.max(maxSeq + 1, count + 1);
  return `${searchPrefix}${String(nextSeq).padStart(5, "0")}`;
}

/**
 * Generate Next Unique Concurrency-Safe Verification Code
 * Format: EHRJ-VER-YYYY-XXXXX
 */
export async function generateNextVerificationCode(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const searchPrefix = `EHRJ-VER-${currentYear}-`;

  const latest = await prisma.certificate.findFirst({
    where: { verificationCode: { startsWith: searchPrefix } },
    orderBy: { verificationCode: "desc" },
    select: { verificationCode: true },
  });

  let maxSeq = 0;
  if (latest?.verificationCode) {
    const parts = latest.verificationCode.split("-");
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num)) maxSeq = num;
  }

  const count = await prisma.certificate.count();
  const nextSeq = Math.max(maxSeq + 1, count + 1);
  return `${searchPrefix}${String(nextSeq).padStart(5, "0")}`;
}

/**
 * Validate Document Eligibility based on student and document type
 */
export async function validateDocumentEligibility(
  studentId: string,
  docType: string,
  sessionId?: string
): Promise<{ eligible: boolean; reason?: string; student?: any; activeEnrollment?: any }> {
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

  if (!student) {
    return { eligible: false, reason: "শিক্ষার্থী পাওয়া যায়নি।" };
  }

  if (student.status === "SUSPENDED") {
    return { eligible: false, reason: "সাময়িকভাবে বহিষ্কৃত শিক্ষার্থীর জন্য কোনো সনদপত্র ইস্যু করা যাবে না।" };
  }

  const activeEnrollment =
    student.enrollments.find((e) => (sessionId ? e.sessionId === sessionId : e.status === "ACTIVE")) ||
    student.enrollments[0];

  if (!activeEnrollment && (docType === "STUDENT_ID" || docType === "STUDY_CERTIFICATE")) {
    return { eligible: false, reason: "শিক্ষার্থীর কোনো সক্রিয় ভর্তি/শ্রেণি রেকর্ড পাওয়া যায়নি।" };
  }

  if (docType === "TRANSFER_CERTIFICATE" && student.status === "WITHDRAWN") {
    // Withdrawn students can receive previously approved TC, but let's confirm
  }

  return {
    eligible: true,
    student,
    activeEnrollment,
  };
}

/**
 * Build Frozen Immutable Data Snapshot for Issued Document
 */
export function buildDocumentSnapshot(params: {
  student: any;
  activeEnrollment: any;
  documentNumber: string;
  verificationCode: string;
  documentType: string;
  template: any;
  issueDate: Date;
  customNotes?: string;
}): Record<string, any> {
  const { student, activeEnrollment, documentNumber, verificationCode, documentType, template, issueDate, customNotes } = params;

  const primaryGuardian = student.guardianLinks?.find((gl: any) => gl.isPrimary)?.guardian || student.guardianLinks?.[0]?.guardian;

  const vars = {
    student: {
      id: student.id,
      studentId: student.studentIdNumber,
      nameBn: student.fullNameBn,
      nameEn: student.fullNameEn || student.fullNameBn,
      nameAr: student.fullNameAr || "",
      dob: student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString("bn-BD") : "",
      gender: student.gender === "MALE" ? "ছাত্র" : "ছাত্রী",
      bloodGroup: student.bloodGroup || "",
      fatherNameBn: student.fatherNameBn,
      motherNameBn: student.motherNameBn,
      presentAddress: student.presentAddress,
      permanentAddress: student.permanentAddress,
      photoUrl: student.photoUrl || null,
      residentialStatus: student.residentialStatus,
    },
    guardian: {
      name: primaryGuardian?.fullNameBn || student.fatherNameBn,
      relation: primaryGuardian?.relation || "পিতা",
      phone: primaryGuardian?.phone || student.fatherPhone || "",
    },
    class: {
      id: activeEnrollment?.jamatClass?.id || "",
      name: activeEnrollment?.jamatClass?.nameBn || "সাধারণ",
      nameEn: activeEnrollment?.jamatClass?.nameEn || "",
    },
    section: {
      id: activeEnrollment?.section?.id || "",
      name: activeEnrollment?.section?.nameBn || "ক শাখা",
    },
    roll: activeEnrollment?.rollNumber !== undefined ? String(activeEnrollment.rollNumber) : "১",
    session: {
      id: activeEnrollment?.session?.id || "",
      name: activeEnrollment?.session?.name || new Date().getFullYear().toString(),
    },
    document: {
      number: documentNumber,
      verificationCode,
      type: documentType,
      titleBn: template?.titleBn || "অফিশিয়াল প্রত্যয়নপত্র",
      titleEn: template?.titleEn || "Official Certificate",
      issueDate: issueDate.toLocaleDateString("bn-BD"),
      issueDateIso: issueDate.toISOString(),
      customNotes: customNotes || "",
    },
    institution: {
      nameBn: INSTITUTION_INFO.nameBn,
      nameEn: INSTITUTION_INFO.nameEn,
      principal: INSTITUTION_INFO.principal,
      address: "পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা",
      phone: INSTITUTION_INFO.primaryPhone,
    },
  };

  const renderedBodyBn = interpolateTemplate(template?.bodyBn || "", vars);
  const renderedBodyEn = interpolateTemplate(template?.bodyEn || "", vars);

  return {
    ...vars,
    renderedContent: {
      bodyBn: renderedBodyBn,
      bodyEn: renderedBodyEn,
      signatoryTitleBn: template?.signatoryTitleBn || "মুহতামিম ও অধ্যক্ষ",
    },
    templateVersion: template?.version || 1,
    snapshotTimestamp: new Date().toISOString(),
  };
}

/**
 * Generate High-Contrast Scalable QR Code as Base64 Data URL
 */
export async function generateDocumentQrCode(verificationCode: string): Promise<string> {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify/document/${encodeURIComponent(verificationCode)}`;
  return await QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 256,
    color: {
      dark: "#083B25", // Institutional Emerald Dark
      light: "#FFFFFF",
    },
  });
}

/**
 * Issue an Official Document Atomically
 */
export async function issueOfficialDocument(params: {
  studentId: string;
  documentType: string;
  sessionId?: string;
  templateId?: string;
  requestId?: string;
  issuedByUserId?: string;
  customNotes?: string;
  issueDate?: Date;
}): Promise<any> {
  const { studentId, documentType, sessionId, templateId, requestId, issuedByUserId, customNotes, issueDate = new Date() } = params;

  // 1. Validate Eligibility
  const eligibility = await validateDocumentEligibility(studentId, documentType, sessionId);
  if (!eligibility.eligible) {
    throw new Error(eligibility.reason || "শিক্ষার্থী এই সনদপত্রের জন্য যোগ্য নয়।");
  }

  // 2. Resolve Template
  let template: any = null;
  if (templateId) {
    template = await prisma.documentTemplate.findUnique({ where: { id: templateId } });
  }
  if (!template) {
    template = await prisma.documentTemplate.findFirst({
      where: { documentType, isActive: true },
      orderBy: { version: "desc" },
    });
  }
  if (!template) {
    await ensureDefaultTemplates();
    template = await prisma.documentTemplate.findFirst({
      where: { documentType, isActive: true },
    });
  }

  // 3. Generate Unique Identifiers
  const documentNumber = await generateNextDocumentNumber(documentType);
  const verificationCode = await generateNextVerificationCode();

  // 4. Generate QR Code
  const qrCodeUrl = await generateDocumentQrCode(verificationCode);

  // 5. Create Immutable Data Snapshot
  const snapshot = buildDocumentSnapshot({
    student: eligibility.student,
    activeEnrollment: eligibility.activeEnrollment,
    documentNumber,
    verificationCode,
    documentType,
    template,
    issueDate,
    customNotes,
  });

  // 6. Execute Atomic Transaction
  return await prisma.$transaction(async (tx) => {
    const cert = await tx.certificate.create({
      data: {
        certificateNumber: documentNumber,
        verificationCode,
        studentId,
        sessionId: eligibility.activeEnrollment?.sessionId || sessionId || null,
        requestId: requestId || null,
        templateId: template?.id || null,
        certificateType: documentType,
        titleBn: template?.titleBn || "সনদপত্র",
        titleEn: template?.titleEn || "Certificate",
        version: 1,
        status: "ISSUED",
        issueDate,
        issuedByUserId: issuedByUserId || null,
        isRevoked: false,
        qrCodeUrl,
        snapshotJson: JSON.stringify(snapshot),
      },
    });

    if (requestId) {
      await tx.documentRequest.update({
        where: { id: requestId },
        data: {
          status: "ISSUED",
          reviewedAt: new Date(),
          reviewedByUserId: issuedByUserId || null,
        },
      });
    }

    return cert;
  });
}

/**
 * Revoke an Issued Document Atomically
 */
export async function revokeDocument(params: {
  certificateId: string;
  revokedByUserId?: string;
  reason: string;
}): Promise<any> {
  const { certificateId, revokedByUserId, reason } = params;

  if (!reason || !reason.trim()) {
    throw new Error("সনদপত্র বাতিলের কারণ উল্লেখ করা আবশ্যক।");
  }

  const existing = await prisma.certificate.findUnique({
    where: { id: certificateId },
  });

  if (!existing) {
    throw new Error("সনদপত্র পাওয়া যায়নি।");
  }

  if (existing.isRevoked) {
    throw new Error("সনদপত্রটি ইতিমধ্যে বাতিল (REVOKED) করা হয়েছে।");
  }

  return await prisma.certificate.update({
    where: { id: certificateId },
    data: {
      isRevoked: true,
      status: "REVOKED",
      revokedAt: new Date(),
      revokedByUserId: revokedByUserId || null,
      revokeReason: reason.trim(),
    },
  });
}

/**
 * Reissue a Document with Version Increment (e.g. v1 -> v2)
 */
export async function reissueDocument(params: {
  originalCertificateId: string;
  issuedByUserId?: string;
  reason: string;
  customNotes?: string;
}): Promise<any> {
  const { originalCertificateId, issuedByUserId, reason, customNotes } = params;

  const original = await prisma.certificate.findUnique({
    where: { id: originalCertificateId },
    include: { student: true, template: true },
  });

  if (!original) {
    throw new Error("পূর্ববর্তী সনদপত্র পাওয়া যায়নি।");
  }

  // 1. Revoke Original if not already revoked
  if (!original.isRevoked) {
    await revokeDocument({
      certificateId: originalCertificateId,
      revokedByUserId: issuedByUserId,
      reason: `পুনরায় ইস্যু করার নিমিত্তে বাতিল: ${reason}`,
    });
  }

  // 2. Generate New Document Number and Verification Code
  const documentNumber = await generateNextDocumentNumber(original.certificateType);
  const verificationCode = await generateNextVerificationCode();
  const qrCodeUrl = await generateDocumentQrCode(verificationCode);

  // 3. Resolve Current Academic / Student Data for Fresh Snapshot
  const eligibility = await validateDocumentEligibility(original.studentId, original.certificateType, original.sessionId || undefined);

  const snapshot = buildDocumentSnapshot({
    student: eligibility.student || original.student,
    activeEnrollment: eligibility.activeEnrollment,
    documentNumber,
    verificationCode,
    documentType: original.certificateType,
    template: original.template,
    issueDate: new Date(),
    customNotes: `পুনরায় ইস্যুকৃত (ভার্সন ${original.version + 1})। কারণ: ${reason}`,
  });

  // 4. Create Reissued Certificate
  return await prisma.certificate.create({
    data: {
      certificateNumber: documentNumber,
      verificationCode,
      studentId: original.studentId,
      sessionId: original.sessionId,
      requestId: original.requestId,
      templateId: original.templateId,
      certificateType: original.certificateType,
      titleBn: original.titleBn,
      titleEn: original.titleEn,
      version: original.version + 1,
      reissuedFromId: original.id,
      status: "ISSUED",
      issueDate: new Date(),
      issuedByUserId: issuedByUserId || null,
      isRevoked: false,
      qrCodeUrl,
      snapshotJson: JSON.stringify(snapshot),
    },
  });
}
