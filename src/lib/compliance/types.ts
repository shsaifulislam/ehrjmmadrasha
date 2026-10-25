/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 43
 * Institutional Compliance Obligation, Requirement Tracking & Compliance Assurance Engine
 * Types, Schemas, Enums & Contracts
 * 
 * Checkpoint: EHRJ-AI-2026-PHASE43
 * 
 * CORE PRINCIPLES:
 * 1. KNOW THE REQUIREMENT. ASSIGN THE OBLIGATION. TRACK THE EVIDENCE. VERIFY COMPLIANCE.
 * 2. AUTOMATE THE PROCESS, NOT THE AUTHORITY.
 * 3. NO DUPLICATE OPERATIONAL SYSTEM (Phase 38 owns Policies; Phase 42 owns Risks/Controls; Phase 29 owns Documents; Phase 33 owns Calendar; Phase 27 owns Workflow).
 * 4. STRICTLY NO SMS.
 * 5. NO AUTONOMOUS LEGAL OR COMPLIANCE CONCLUSIONS.
 */

export interface ActorContext {
  userId: string;
  userName: string;
  userRole: string;
  ipAddress?: string;
}

export type RequirementSource =
  | "INTERNAL_POLICY"
  | "INSTITUTIONAL_SOP"
  | "CONTRACT"
  | "FUNDING_DONOR"
  | "ACCREDITATION"
  | "AUTHORITY"
  | "REGULATORY"
  | "INSPECTION"
  | "OPERATIONAL"
  | "OTHER";

export type ComplianceScope =
  | "INSTITUTION_WIDE"
  | "DEPARTMENT"
  | "ACADEMIC_SECTION"
  | "FINANCE"
  | "HR"
  | "PROCUREMENT"
  | "RESIDENTIAL"
  | "LIBRARY"
  | "TRANSPORT"
  | "TECHNOLOGY"
  | "SPECIFIC_PROJECT"
  | "SPECIFIC_CONTRACT"
  | "SPECIFIC_FUND";

export type RequirementCategory =
  | "ACADEMIC_CURRICULUM"
  | "FINANCIAL_SHARIAH"
  | "STUDENT_WELFARE"
  | "SAFETY_INFRASTRUCTURE"
  | "DATA_PRIVACY"
  | "EMPLOYEE_HR"
  | "PROCUREMENT_VENDOR"
  | "GOVERNANCE_STATUTORY";

export type RequirementStatus =
  | "ACTIVE"
  | "UNDER_REVIEW"
  | "SUPERSEDED"
  | "RETIRED"
  | "ARCHIVED";

export interface ComplianceRequirement {
  id: string; // EHRJ-REQ-CMP-YYYY-XXXX
  version: number;
  title: string;
  description: string;
  source: RequirementSource;
  sourceReference: string; // Document title, section or official gazette ref
  isLegallyMandatedVerified: boolean;
  authoritativeSourceRef: string;
  jurisdiction: string;
  category: RequirementCategory;
  applicabilityScope: ComplianceScope;
  isApplicable: boolean;
  applicabilityReason?: string;
  applicabilityEvidenceRef?: string;
  applicabilityReviewer?: string;
  applicabilityDate?: string;
  effectiveDate: string;
  reviewDate: string;
  status: RequirementStatus;
  relatedPolicyId?: string; // Phase 38
  relatedRiskId?: string; // Phase 42
  relatedControlId?: string; // Phase 42
  relatedContractId?: string; // Phase 40
  relatedDocumentToken?: string; // Phase 29
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export type ObligationFrequency =
  | "ONE_TIME"
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "HALF_YEARLY"
  | "ANNUAL"
  | "SESSION_WISE"
  | "EVENT_BASED"
  | "CONTRACT_BASED"
  | "CUSTOM";

export type ComplianceStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "READY_FOR_REVIEW"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "COMPLIANT"
  | "PARTIALLY_COMPLIANT"
  | "NON_COMPLIANT"
  | "EXCEPTION_GRANTED"
  | "OVERDUE"
  | "NOT_APPLICABLE"
  | "CLOSED"
  | "ARCHIVED";

export type ResponsibilityType =
  | "RESPONSIBLE"
  | "ACCOUNTABLE"
  | "REVIEWER"
  | "APPROVER"
  | "EVIDENCE_PROVIDER";

export interface ComplianceObligation {
  id: string; // EHRJ-COMP-YYYY-XXXX
  requirementId: string;
  title: string;
  description: string;
  ownerId: string;
  ownerName: string;
  ownerRole: string;
  reviewerId: string;
  reviewerName: string;
  backupOwnerId?: string;
  backupOwnerName?: string;
  responsibilityType: ResponsibilityType;
  frequency: ObligationFrequency;
  startDate: string;
  dueDate: string;
  deadlineSource: string; // Basis for deadline
  reminderDate?: string;
  escalationDate?: string;
  completionDate?: string;
  status: ComplianceStatus;
  evidenceIds: string[];
  latestReviewId?: string;
  relatedRiskId?: string;
  relatedControlId?: string;
  relatedFindingId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type EvidenceType =
  | "OFFICIAL_DOCUMENT"
  | "CERTIFICATE"
  | "SUBMISSION_RECEIPT"
  | "APPROVAL"
  | "REPORT"
  | "TRANSACTION_REF"
  | "AUDIT_RECORD"
  | "TRAINING_RECORD"
  | "INSPECTION_RECORD"
  | "SCREENSHOT_REF";

export type EvidenceVerificationStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "EXPIRED"
  | "SUPERSEDED";

export interface ComplianceEvidence {
  id: string; // EHRJ-EVD-CMP-YYYY-XXXX
  obligationId: string;
  title: string;
  source: string;
  evidenceType: EvidenceType;
  fileToken?: string; // Phase 29 Token
  hash?: string; // SHA-256
  dateCollected: string;
  expiryDate?: string;
  collectorId: string;
  collectorName: string;
  verificationStatus: EvidenceVerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  createdAt: string;
}

export type ReviewDecision =
  | "COMPLIANT"
  | "PARTIALLY_COMPLIANT"
  | "NON_COMPLIANT"
  | "INSUFFICIENT_EVIDENCE"
  | "NOT_APPLICABLE";

export interface ComplianceReview {
  id: string; // EHRJ-REV-CMP-YYYY-XXXX
  obligationId: string;
  requirementId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: string;
  reviewDate: string;
  evidenceReviewed: string[];
  checklistAnswers: Record<string, boolean>;
  decision: ReviewDecision;
  findingsNotes: string;
  remediationRequired: boolean;
  linkedFindingId?: string; // Phase 42 Finding ID
  nextReviewDate: string;
  createdAt: string;
}

export type ExceptionStatus =
  | "REQUESTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export interface ComplianceException {
  id: string; // EHRJ-EXC-CMP-YYYY-XXXX
  obligationId: string;
  requirementId: string;
  reason: string;
  scope: string;
  startDate: string;
  endDate: string;
  compensatingControl: string;
  requestedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  status: ExceptionStatus;
  evidenceRef?: string;
  reviewDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceRemediation {
  id: string; // EHRJ-REM-CMP-YYYY-XXXX
  obligationId: string;
  problem: string;
  rootCause: string;
  correctiveAction: string;
  ownerId: string;
  ownerName: string;
  dueDate: string;
  completionDate?: string;
  phase42FindingId?: string;
  phase42ActionId?: string;
  evidenceRef?: string;
  verificationNotes?: string;
  isVerified: boolean;
  verifiedBy?: string;
  status: "OPEN" | "IN_PROGRESS" | "PENDING_VERIFICATION" | "RESOLVED" | "CLOSED";
  createdAt: string;
}

export interface ComplianceAuditLog {
  id: string;
  entityType: "REQUIREMENT" | "OBLIGATION" | "EVIDENCE" | "REVIEW" | "EXCEPTION" | "REMEDIATION";
  entityId: string;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  timestamp: string;
  changes: Record<string, any>;
  ipAddress?: string;
}

export interface ComplianceMatrixRow {
  requirementId: string;
  requirementTitle: string;
  category: RequirementCategory;
  obligationId?: string;
  obligationTitle?: string;
  ownerName?: string;
  dueDate?: string;
  status: ComplianceStatus;
  evidenceCount: number;
  latestVerifiedEvidence?: string;
  relatedControlId?: string;
  relatedRiskId?: string;
  gapType?: "ASSIGNMENT_GAP" | "EVIDENCE_GAP" | "RENEWAL_GAP" | "RISK_LINK_GAP" | "NONE";
}

export interface ComplianceEarlyWarning {
  type: "OVERDUE_IMMINENT" | "DOCUMENT_EXPIRING" | "UNASSIGNED_OBLIGATION" | "REPEATED_FAILURE" | "EXPIRED_EXCEPTION";
  obligationId?: string;
  requirementId?: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
  dueDate?: string;
  owner?: string;
  isForecast: true; // Principle 36: Forecasts must be clearly labeled as forecasts
}
