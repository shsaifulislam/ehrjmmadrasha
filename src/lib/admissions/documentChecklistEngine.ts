/**
 * EHRJ Digital Admissions 2.0 — Document Checklist & Security Engine
 * Checkpoint: EHRJ-AI-2026-PHASE34
 * Handles document checklist generation, upload security validation, and verification tracking.
 */

import { DocumentChecklistItem } from "./types";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateAdmissionUpload(file: {
  name: string;
  size: number;
  type: string;
}): { isValid: boolean; error?: string } {
  // 1. Size check
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `ফাইলের সাইজ (${(file.size / (1024 * 1024)).toFixed(1)} MB) অনুমোদিত সীমা (৫ MB) অতিক্রম করেছে।`,
    };
  }

  // 2. Extension check
  const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      isValid: false,
      error: `অননুমোদিত ফাইল ফরম্যাট '${ext}'। শুধু JPG, PNG, WEBP বা PDF ফাইল গ্রহণযোগ্য।`,
    };
  }

  // 3. MIME check
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      isValid: false,
      error: "ফাইলের MIME টাইপ অননুমোদিত। অনুগ্রহ করে বৈধ ছবি বা পিডিএফ ফাইল আপলোড করুন।",
    };
  }

  return { isValid: true };
}

/**
 * Builds the comprehensive document checklist for an application
 */
export function buildDocumentChecklist(
  documentsJson?: string | null,
  isKitabDepartment: boolean = false
): DocumentChecklistItem[] {
  let uploadedList: Array<{
    type: string;
    url?: string;
    fileName?: string;
    verificationStatus?: string;
    rejectionReason?: string;
  }> = [];

  if (documentsJson) {
    try {
      uploadedList = JSON.parse(documentsJson);
      if (!Array.isArray(uploadedList)) uploadedList = [];
    } catch (e) {
      uploadedList = [];
    }
  }

  const standardChecklist: Array<{
    type: DocumentChecklistItem["type"];
    nameBn: string;
    isRequired: boolean;
  }> = [
    { type: "PHOTO", nameBn: "শিক্ষার্থীর পাসপোর্ট সাইজ ছবি", isRequired: true },
    { type: "BIRTH_CERTIFICATE", nameBn: "ডিজিটাল জন্ম নিবন্ধন সনদ", isRequired: true },
    { type: "GUARDIAN_NID", nameBn: "অভিভাবকের জাতীয় পরিচয়পত্র (NID)", isRequired: true },
    {
      type: "PREVIOUS_MARKSHEET",
      nameBn: "পূর্ববর্তী জামাতের ছাড়পত্র / প্রশংসাপত্র",
      isRequired: isKitabDepartment, // Required for Kitab classes, optional for Noorani/Hifz
    },
  ];

  return standardChecklist.map((item) => {
    const uploaded = uploadedList.find((u) => u.type === item.type);
    return {
      type: item.type,
      nameBn: item.nameBn,
      isRequired: item.isRequired,
      uploaded: Boolean(uploaded && uploaded.url),
      fileUrl: uploaded?.url,
      fileName: uploaded?.fileName,
      verificationStatus: (uploaded?.verificationStatus as any) || "PENDING",
      rejectionReason: uploaded?.rejectionReason,
    };
  });
}
