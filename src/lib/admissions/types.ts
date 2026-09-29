/**
 * EHRJ Digital Admissions 2.0 & Enrollment Onboarding Engine Types
 * Checkpoint: EHRJ-AI-2026-PHASE34
 */

export interface AvailableClassConfig {
  classId: string;
  classNameBn: string;
  classNameEn?: string;
  maxCapacity: number;
  currentApplicants: number;
  genderAllowed: "MALE" | "FEMALE" | "COMBINED";
  isActive: boolean;
}

export interface AdmissionSessionConfig {
  sessionId: string;
  sessionName: string;
  isOpen: boolean;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  availableClasses: AvailableClassConfig[];
  residentialOptions: Array<"RESIDENTIAL" | "NON_RESIDENTIAL" | "DAY_CARE">;
  requiredDocuments: Array<{
    type: "PHOTO" | "BIRTH_CERTIFICATE" | "PREVIOUS_MARKSHEET" | "GUARDIAN_NID" | "OTHER";
    nameBn: string;
    isRequired: boolean;
  }>;
  specialInstructionsBn: string;
  updatedAt: string;
  updatedBy: string;
}

export interface DraftApplication {
  draftId: string; // e.g. "DFT-ADM-2026-0001"
  resumeToken: string;
  guardianPhone: string;
  studentNameBn?: string;
  desiredClassId?: string;
  currentStep: number; // 1 to 9
  completionPercentage: number;
  formData: Record<string, any>;
  missingRequiredFields: string[];
  lastSavedAt: string;
  expiresAt: string;
}

export interface CorrectionRequest {
  id: string;
  applicationId: string;
  trackingId: string;
  requestedBy: string; // Admin userId
  requestedAt: string;
  reason: string;
  fieldsToCorrect: string[];
  applicantResponse?: string;
  resubmittedAt?: string;
  status: "PENDING" | "RESUBMITTED" | "RESOLVED";
}

export interface DocumentChecklistItem {
  type: "PHOTO" | "BIRTH_CERTIFICATE" | "PREVIOUS_MARKSHEET" | "GUARDIAN_NID" | "OTHER";
  nameBn: string;
  isRequired: boolean;
  uploaded: boolean;
  fileUrl?: string;
  fileName?: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  rejectionReason?: string;
}

export interface AdmissionFeeBreakdown {
  classId: string;
  classNameBn: string;
  admissionFee: number;
  sessionCharge: number;
  monthlyTuition: number;
  hostelFee: number;
  totalInitialPayable: number;
  isWaiverEligible: boolean;
  waiverReason?: string;
}

export interface AdmissionTimelineStep {
  step: string;
  labelBn: string;
  completed: boolean;
  current: boolean;
  timestamp?: string;
}

export interface AdmissionOnboardingChecklistItem {
  id: string;
  titleBn: string;
  descriptionBn: string;
  completed: boolean;
  category: "ACADEMIC" | "FINANCE" | "DOCUMENTS" | "FACILITIES";
}

export interface AdmissionConfirmationData {
  studentNameBn: string;
  studentIdNumber: string;
  applicationNumber: string;
  sessionName: string;
  classNameBn: string;
  sectionNameBn?: string;
  rollNumber: number;
  admissionDate: string;
  institutionNameBn: string;
  institutionAddressBn: string;
  verificationQrUrl: string;
}

export interface TrackingResult {
  trackingId: string;
  studentNameBn: string;
  desiredClass: string;
  status: string;
  applicationDate: string;
  timeline: AdmissionTimelineStep[];
  maskedPhone: string;
  maskedNid?: string;
  maskedBirthCert?: string;
  documentsChecklist: DocumentChecklistItem[];
  correctionInfo?: {
    reason: string;
    fieldsToCorrect: string[];
    requestId: string;
  };
  examScheduledAt?: string;
  nextActionInstruction: string;
  onboardingChecklist?: AdmissionOnboardingChecklistItem[];
  admissionConfirmation?: AdmissionConfirmationData;
}
