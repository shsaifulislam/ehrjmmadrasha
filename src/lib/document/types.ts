/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 29
 * ADVANCED DOCUMENT INTELLIGENCE, OCR, DIGITAL ARCHIVE & E-SIGNATURE ENGINE
 * Types, Enums, and State Contracts
 * 
 * Checkpoint: EHRJ-AI-2026-PHASE29
 * 
 * CORE INVARIANTS:
 * 1. A DOCUMENT IS EVIDENCE, NOT JUST A FILE.
 * 2. AI ASSISTS. AUTHORIZED HUMANS DECIDE.
 * 3. Human verification overrides OCR interpretation.
 * 4. Document source-of-truth distinction:
 *    Original Document != Extracted Data != Verified Data != Derived Data
 */

export type DocumentLifecycleStatus =
  | "UPLOADED"
  | "PROCESSING"
  | "OCR_COMPLETED"
  | "REVIEW_REQUIRED"
  | "VERIFIED"
  | "REJECTED"
  | "ARCHIVED"
  | "REVOKED"
  | "EXPIRED"
  | "DELETED";

export type DocumentEntityType =
  | "STUDENT"
  | "GUARDIAN"
  | "EMPLOYEE"
  | "ADMISSION_APPLICATION"
  | "FINANCE_TRANSACTION"
  | "PAYMENT"
  | "LIBRARY"
  | "INVENTORY"
  | "PROCUREMENT"
  | "HELPDESK"
  | "INSTITUTION";

export type DocumentCategoryType =
  // Academic & Student
  | "STUDENT_ID"
  | "ADMISSION_CONFIRMATION"
  | "STUDY_CERTIFICATE"
  | "CHARACTER_CERTIFICATE"
  | "TRANSFER_CERTIFICATE"
  | "TESTIMONIAL"
  | "RESULT_MARKSHEET"
  | "BIRTH_REGISTRATION"
  | "PREVIOUS_INSTITUTION_CERTIFICATE"
  | "ACADEMIC_CERTIFICATE"
  // Identity & Guardian
  | "NID_STUDENT"
  | "NID_GUARDIAN"
  | "GUARDIAN_DECLARATION"
  // Financial
  | "PAYMENT_RECEIPT"
  | "FEE_VOUCHER"
  | "SUPPLIER_INVOICE"
  | "BILL_VOUCHER"
  | "AUDIT_RECORD"
  // HR & Employee
  | "APPOINTMENT_LETTER"
  | "EXPERIENCE_CERTIFICATE"
  | "TRAINING_CERTIFICATE"
  | "EMPLOYEE_CONTRACT"
  // Institutional & Administrative
  | "INSTITUTIONAL_AGREEMENT"
  | "PROCUREMENT_CONTRACT"
  | "ASSET_DEED_DOCUMENT"
  | "GOVERNMENT_APPROVAL"
  | "GENERAL_ARCHIVE";

export type DocumentLanguage = "bn" | "en" | "ar" | "mixed" | "UNKNOWN";

export type ExtractionSource = "OCR" | "AI_SUGGESTION" | "HUMAN_VERIFIED" | "SYSTEM_GENERATED";

export type ExtractionReviewStatus = "PENDING" | "NEEDS_REVIEW" | "CONFIRMED" | "EDITED_AND_CONFIRMED" | "REJECTED";

export interface DocumentBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  page?: number;
}

export interface ExtractedField {
  id: string;
  fieldName: string;
  fieldLabelBn: string;
  value: string;
  normalizedValue?: string;
  confidence: number; // 0.0 to 1.0
  source: ExtractionSource;
  pageNumber?: number;
  boundingBox?: DocumentBoundingBox;
  reviewStatus: ExtractionReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

export interface OCRJobRecord {
  id: string;
  documentId: string;
  versionNumber: number;
  provider: "EHRJ_OCR_ENGINE" | "TESSERACT_MULTI_LANG" | "GOOGLE_VISION_ADAPTER" | "FALLBACK_TEXT_EXTRACTOR";
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "RETRYING" | "CANCELLED";
  languageDetected: DocumentLanguage;
  rawText: string;
  normalizedText: string;
  pageCount: number;
  confidenceScore: number;
  processingTimeMs: number;
  error?: string;
  attemptCount: number;
  maxAttempts: number;
  startedAt: string;
  completedAt?: string;
}

export interface DocumentVersion {
  versionNumber: number;
  fileHash: string;
  algorithm: "SHA-256";
  filePath: string;
  fileSize: number;
  mimeType: string;
  originalFileName: string;
  reason: string;
  uploadedBy: {
    userId: string;
    name: string;
    role: string;
  };
  createdAt: string;
  isCurrent: boolean;
}

export interface DocumentSignatureRecord {
  id: string;
  documentId: string;
  versionNumber: number;
  signer: {
    userId: string;
    name: string;
    role: "ADMIN" | "PRINCIPAL" | "AUTHORIZED_OFFICER";
    designation: string;
  };
  signingMethod: "CRYPTOGRAPHIC_LOCAL_KEY" | "INSTITUTIONAL_PKI" | "E_SIGN_PROVIDER_PORTAL" | "OFFICIAL_DIGITAL_STAMP";
  signatureStatus: "PENDING" | "SIGNED" | "FAILED" | "REVOKED" | "INVALID";
  signatureReference: string;
  documentHash: string;
  signatureToken: string;
  watermark: "OFFICIAL" | "DRAFT" | "COPY" | "REVOKED" | "ARCHIVED";
  signedAt?: string;
  revokedAt?: string;
  revokedBy?: string;
  revocationReason?: string;
  verificationResult?: {
    valid: boolean;
    checkedAt: string;
    details: string;
  };
}

export interface LegalHoldRecord {
  id: string;
  documentId: string;
  reason: string;
  caseReference?: string;
  placedBy: {
    userId: string;
    name: string;
    role: string;
  };
  placedAt: string;
  isActive: boolean;
  releasedBy?: {
    userId: string;
    name: string;
    role: string;
  };
  releasedAt?: string;
  releaseReason?: string;
}

export interface RetentionPolicy {
  retentionYears: number;
  retentionUntil: string;
  isLegalHoldActive: boolean;
  disposalEligible: boolean;
  notes?: string;
}

export type DocumentActionType =
  | "VIEW"
  | "DOWNLOAD"
  | "PRINT"
  | "SHARE"
  | "VERIFY"
  | "UPLOAD"
  | "REPLACE_VERSION"
  | "ARCHIVE"
  | "RESTORE"
  | "REVOKE"
  | "SIGN"
  | "OCR_TRIGGER"
  | "FIELD_VERIFY"
  | "LEGAL_HOLD_APPLY"
  | "LEGAL_HOLD_RELEASE";

export interface DocumentAccessLog {
  id: string;
  documentId: string;
  versionNumber: number;
  userId: string;
  userName: string;
  userRole: string;
  action: DocumentActionType;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  purpose?: string;
  success: boolean;
}

export interface ArchiveDocument {
  id: string;
  documentType: DocumentCategoryType;
  title: string;
  description?: string;
  entityType: DocumentEntityType;
  entityId: string;
  entityName?: string;
  status: DocumentLifecycleStatus;
  
  // Storage & Integrity
  currentVersion: number;
  fileHash: string; // SHA-256
  hashAlgorithm: "SHA-256";
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  filePath: string;
  isEncrypted: boolean;
  
  // OCR & Intelligence
  hasOcrText: boolean;
  ocrLanguage?: DocumentLanguage;
  ocrConfidence?: number;
  isOcrReviewed: boolean;
  extractedFields: ExtractedField[];
  qualityWarnings?: string[];
  
  // Verification & Signatures
  isVerified: boolean;
  verifiedBy?: {
    userId: string;
    name: string;
  };
  verifiedAt?: string;
  signatures: DocumentSignatureRecord[];
  
  // Retention & Archival
  retentionPolicy: RetentionPolicy;
  isArchived: boolean;
  archivedAt?: string;
  archivedBy?: string;
  
  // Links & Relations
  relatedDocumentIds: string[];
  certificateId?: string; // Phase 7 link
  requestId?: string;     // Phase 7 link
  financeId?: string;     // Phase 6 link
  
  // Metadata & Timestamps
  createdAt: string;
  updatedAt: string;
  uploadedBy: {
    userId: string;
    name: string;
    role: string;
  };
}

export interface DuplicateDetectionResult {
  isExactDuplicate: boolean;
  exactMatchDocId?: string;
  possibleDuplicates: {
    documentId: string;
    title: string;
    matchReason: string;
    confidenceScore: number;
  }[];
}

export interface IntegrityCheckResult {
  documentId: string;
  storedHash: string;
  calculatedHash: string;
  isValid: boolean;
  status: "VALID" | "INTEGRITY_FAILURE" | "FILE_MISSING";
  checkedAt: string;
  details?: string;
}
