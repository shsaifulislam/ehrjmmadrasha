/**
 * EHRJ MADRASHA ERP — PHASE 38
 * Institutional Knowledge, SOP, Policy, Handbook & Governance Document Management Engine
 * 
 * Checkpoint: EHRJ-AI-2026-PHASE38
 * 
 * Invariants:
 * 1. ONE AUTHORITATIVE POLICY, ONE CONTROLLED VERSION, MANY AUTHORIZED EXPERIENCES.
 * 2. PHASE 38 OWNS DOCUMENT AUTHORITY & LIFECYCLE. PHASE 22 OWNS RETRIEVAL & RAG.
 * 3. DOCUMENT TEXT DOES NOT AUTOMATICALLY BECOME CODE.
 * 4. AI-GENERATED ASSISTANCE IS DRAFT ONLY — HUMAN REVIEW & APPROVAL REQUIRED.
 * 5. IMMUTABLE HISTORICAL VERSIONS — NEVER OVERWRITE EFFECTIVE POLICY CONTENT.
 * 6. NO SMS. In-app portal alerts only.
 */

export type KnowledgeCategory =
  | "INSTITUTIONAL_POLICY"
  | "ACADEMIC_POLICY"
  | "ADMISSION_POLICY"
  | "STUDENT_RULE"
  | "GUARDIAN_GUIDELINE"
  | "TEACHER_GUIDELINE"
  | "FINANCE_POLICY"
  | "HR_POLICY"
  | "IT_POLICY"
  | "SECURITY_POLICY"
  | "PRIVACY_POLICY"
  | "LIBRARY_POLICY"
  | "RESIDENTIAL_POLICY"
  | "TRANSPORT_POLICY"
  | "INVENTORY_POLICY"
  | "COMMUNICATION_POLICY"
  | "EVENT_POLICY"
  | "SOP"
  | "HANDBOOK"
  | "MANUAL"
  | "FAQ"
  | "FORM_INSTRUCTION"
  | "EMERGENCY_PROCEDURE"
  | "GOVERNANCE"
  | "OTHER";

export type DocumentType =
  | "POLICY"
  | "SOP"
  | "HANDBOOK"
  | "GUIDELINE"
  | "MANUAL"
  | "PROCEDURE"
  | "RULE"
  | "FAQ"
  | "CHECKLIST"
  | "INSTRUCTION"
  | "GOVERNANCE_DOCUMENT"
  | "INTERNAL_MEMO"
  | "PUBLIC_INFORMATION";

export type DocumentStatus =
  | "DRAFT"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "PUBLISHED"
  | "EFFECTIVE"
  | "SUPERSEDED"
  | "EXPIRED"
  | "ARCHIVED"
  | "WITHDRAWN";

export type ConfidentialityLevel =
  | "PUBLIC"
  | "INTERNAL"
  | "RESTRICTED"
  | "CONFIDENTIAL";

export type AudienceType =
  | "PUBLIC"
  | "GUARDIAN"
  | "TEACHER"
  | "PRINCIPAL"
  | "ADMIN"
  | "ALUMNI"
  | "STAFF"
  | "INTERNAL_AUTHORIZED";

export type DocumentOwnerDepartment =
  | "INSTITUTION"
  | "ADMINISTRATION"
  | "ACADEMIC"
  | "FINANCE"
  | "HR"
  | "IT"
  | "LIBRARY"
  | "RESIDENTIAL"
  | "TRANSPORT"
  | "SECURITY";

export type PolicyRelationshipType =
  | "SUPERSEDES"
  | "SUPERSEDED_BY"
  | "RELATED_TO"
  | "IMPLEMENTS"
  | "DEPENDS_ON"
  | "REFERENCED_BY"
  | "APPLIES_TO"
  | "EXCEPTION_TO";

export interface PolicyRelationship {
  targetDocId: string;
  targetDocCode: string;
  relationshipType: PolicyRelationshipType;
  notes?: string;
}

export interface SOPStep {
  stepNumber: number;
  titleBn: string;
  titleEn: string;
  description: string;
  responsibleRole: string; // e.g. "TEACHER", "ACCOUNTS_OFFICER", "HOSTEL_SUPER"
  decisionPoint?: string;
  requiredDocuments?: string[];
  exceptions?: string;
  escalationRole?: string;
  completionCriteria?: string;
  evidenceRequirements?: string;
}

export interface HandbookSection {
  sectionNumber: string; // e.g. "1.0", "1.1", "2.0"
  titleBn: string;
  titleEn: string;
  contentMarkdown: string;
  order: number;
  subSections?: HandbookSection[];
}

export interface PolicyVersionRecord {
  version: string; // e.g. "v1.0", "v1.1", "v2.0"
  versionNotes: string;
  isMajor: boolean;
  status: DocumentStatus;
  contentText: string;
  contentMarkdown: string;
  sopSteps?: SOPStep[];
  handbookSections?: HandbookSection[];
  checksum: string; // SHA-256 hash
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  approvalNotes?: string;
  effectiveFrom: string; // ISO Date YYYY-MM-DD
  effectiveUntil?: string; // ISO Date YYYY-MM-DD
}

export interface PolicyApprovalRecord {
  id: string;
  documentId: string;
  documentCode: string;
  version: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: "ADMIN" | "PRINCIPAL";
  decision: "APPROVED" | "REVISION_REQUIRED" | "REJECTED";
  notes: string;
  timestamp: string;
  auditRef: string;
}

export interface PolicyException {
  id: string; // e.g. EHRJ-EXC-2026-0001
  documentId: string;
  documentCode: string;
  version: string;
  subject: string;
  reason: string;
  approvedBy: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  scope: string; // who/what is exempt
  conditions: string;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  auditRef: string;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyAcknowledgement {
  id: string; // e.g. EHRJ-ACK-2026-0001
  documentId: string;
  documentCode: string;
  version: string;
  userId: string;
  userName: string;
  userRole: "TEACHER" | "GUARDIAN" | "STAFF" | "ADMIN" | "PRINCIPAL";
  acknowledgedAt: string; // ISO string
  deviceMetadata?: {
    userAgent?: string;
    ipAddress?: string;
  };
}

export interface PolicyConflict {
  id: string;
  documentIdA: string;
  documentCodeA: string;
  titleA: string;
  documentIdB: string;
  documentCodeB: string;
  titleB: string;
  conflictType:
    | "DUPLICATE_ACTIVE_CATEGORY"
    | "OVERLAPPING_EFFECTIVE_DATES"
    | "SUPERSEDED_ACTIVE_COLLISION"
    | "CONTRADICTORY_POLICY_RULES";
  description: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  detectedAt: string;
  status: "OPEN" | "REVIEWED" | "RESOLVED";
}

export interface PolicyChangeImpact {
  affectedModules: string[]; // e.g. ["Phase 34 Admission", "Phase 6 Finance"]
  affectedWorkflows: string[];
  affectedForms: string[];
  affectedAudiences: AudienceType[];
  requiresReacknowledgement: boolean;
  changeSummary: string;
}

export interface KnowledgeDocument {
  id: string; // UUID or EHRJ-POL-2026-XXXXXX
  documentCode: string; // e.g. EHRJ-POL-2026-ADM001
  titleBn: string;
  titleEn: string;
  titleAr?: string;
  documentType: DocumentType;
  category: KnowledgeCategory;
  ownerDepartment: DocumentOwnerDepartment;
  description: string;
  tags: string[];
  status: DocumentStatus;
  currentVersion: string; // e.g. "v2.1"
  versions: PolicyVersionRecord[];
  
  // Date Management
  approvalDate?: string;
  publicationDate?: string;
  effectiveFrom: string; // ISO Date YYYY-MM-DD
  effectiveUntil?: string; // ISO Date YYYY-MM-DD
  reviewDate: string; // ISO Date YYYY-MM-DD
  expiryDate?: string;
  
  // Governance & Permissions
  confidentiality: ConfidentialityLevel;
  targetAudiences: AudienceType[];
  requiresApproval: boolean;
  requiresAcknowledgement: boolean;
  mandatoryAckRoles?: ("TEACHER" | "GUARDIAN" | "STAFF" | "ADMIN")[];
  
  // Content & Structures
  contentText: string;
  contentMarkdown: string;
  sopSteps?: SOPStep[];
  handbookSections?: HandbookSection[];
  
  // Relationships & System Links
  relationships: PolicyRelationship[];
  relatedSystemModules: string[];
  linkedWorkflowId?: string; // Phase 27 Workflow execution link
  sourceReferences?: string[];
  attachments?: {
    id: string;
    filename: string;
    fileUrl: string;
    fileSize: number;
    fileHash: string;
  }[];
  
  // Integrity & Legal Hold
  checksum: string;
  isLegalHoldActive: boolean;
  legalHoldReason?: string;
  legalHoldAuthority?: string;
  legalHoldStartDate?: string;
  
  // Tracking
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface PolicyAuditEntry {
  id: string;
  timestamp: string;
  documentId: string;
  documentCode: string;
  version: string;
  action:
    | "CREATE_DRAFT"
    | "UPDATE_DRAFT"
    | "SUBMIT_FOR_REVIEW"
    | "APPROVE"
    | "REQUEST_REVISION"
    | "REJECT"
    | "PUBLISH"
    | "MARK_EFFECTIVE"
    | "SUPERSEDE"
    | "EXPIRE"
    | "ARCHIVE"
    | "WITHDRAW"
    | "CREATE_NEW_VERSION"
    | "ACKNOWLEDGE"
    | "GRANT_EXCEPTION"
    | "TOGGLE_LEGAL_HOLD"
    | "SYNC_TO_RAG";
  actorId: string;
  actorName: string;
  actorRole: string;
  notes?: string;
  details?: Record<string, any>;
}

export interface DocumentFilterOptions {
  search?: string;
  category?: KnowledgeCategory;
  documentType?: DocumentType;
  status?: DocumentStatus;
  confidentiality?: ConfidentialityLevel;
  audience?: AudienceType;
  ownerDepartment?: DocumentOwnerDepartment;
  effectiveOnDate?: string; // YYYY-MM-DD
}

export interface GovernanceDashboardStats {
  totalDocuments: number;
  effectiveDocuments: number;
  draftDocuments: number;
  underReviewDocuments: number;
  approvedDocuments: number;
  reviewOverdueCount: number;
  reviewDueSoonCount: number;
  acknowledgementsPendingCount: number;
  totalAcknowledgementsRecorded: number;
  activeConflictsCount: number;
  activeExceptionsCount: number;
  legalHoldsCount: number;
  categoryDistribution: Record<string, number>;
}
