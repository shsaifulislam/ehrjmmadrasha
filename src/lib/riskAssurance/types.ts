/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 42
 * Institutional Risk Management, Internal Control & Governance Assurance Engine
 * Checkpoint: EHRJ-AI-2026-PHASE42
 * 
 * CORE PRINCIPLES:
 * 1. "IDENTIFY RISK. CONTROL RISK. VERIFY CONTROL. EVIDENCE THE RESULT."
 * 2. "AUTOMATE THE PROCESS, NOT THE AUTHORITY."
 * 3. Operational modules create the facts; Phase 42 examines the facts.
 * 4. Controls reduce risk; evidence proves control; authorized humans make governance decisions.
 */

export type RiskCategory =
  | "FINANCIAL"
  | "ACADEMIC"
  | "STUDENT_AFFAIRS"
  | "OPERATIONAL"
  | "SECURITY"
  | "TECHNOLOGY"
  | "COMPLIANCE_GOVERNANCE"
  | "VENDOR_PROCUREMENT"
  | "SHARIAH_COMPLIANCE";

export type RiskSourceModule =
  | "FINANCE"
  | "ACADEMIC"
  | "STUDENT"
  | "OPERATIONS"
  | "SECURITY"
  | "INFRASTRUCTURE"
  | "GOVERNANCE"
  | "PROCUREMENT"
  | "HR"
  | "DATA_GOVERNANCE";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RiskLikelihood = 1 | 2 | 3 | 4 | 5; // 1: Rare, 2: Unlikely, 3: Possible, 4: Likely, 5: Almost Certain
export type RiskImpact = 1 | 2 | 3 | 4 | 5;     // 1: Insignificant, 2: Minor, 3: Moderate, 4: Major, 5: Severe

export type RiskStatus =
  | "OPEN"
  | "UNDER_ASSESSMENT"
  | "TREATMENT_PLANNED"
  | "MITIGATING"
  | "MONITORING"
  | "ACCEPTED"
  | "TRANSFERRED"
  | "MITIGATED"
  | "CLOSED"
  | "ARCHIVED";

export type RiskTreatmentType = "MITIGATE" | "ACCEPT" | "TRANSFER" | "AVOID";

export type ControlType = "PREVENTIVE" | "DETECTIVE" | "CORRECTIVE";
export type ExecutionType = "MANUAL" | "AUTOMATED" | "HYBRID";

export type ControlFrequency =
  | "REAL_TIME"
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "SESSION_WISE"
  | "ANNUAL"
  | "EVENT_BASED"
  | "AD_HOC";

export type ControlStatus = "ACTIVE" | "DRAFT" | "UNDER_REVIEW" | "RETIRED";

export type ControlEffectiveness =
  | "EFFECTIVE"
  | "PARTIALLY_EFFECTIVE"
  | "INEFFECTIVE"
  | "NOT_TESTED"
  | "NOT_APPLICABLE";

export type ExceptionStatus = "ACTIVE" | "EXPIRED" | "REVOKED";

export type FindingSourceType =
  | "AUDIT"
  | "CONTROL_TEST"
  | "SECURITY_INCIDENT"
  | "FINANCIAL_DISCREPANCY"
  | "DATA_QUALITY_SCAN"
  | "GOVERNANCE_REVIEW"
  | "HELPDESK_ESCALATION";

export type FindingStatus =
  | "OPEN"
  | "UNDER_REVIEW"
  | "ACTION_REQUIRED"
  | "IN_PROGRESS"
  | "PENDING_VERIFICATION"
  | "RESOLVED"
  | "REOPENED"
  | "CLOSED";

export type RootCauseCategory =
  | "PROCESS"
  | "PEOPLE"
  | "TECHNOLOGY"
  | "DATA"
  | "CONFIGURATION"
  | "TRAINING"
  | "GOVERNANCE"
  | "VENDOR"
  | "EXTERNAL";

export type ActionStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "VERIFIED";

export type GovernanceReviewStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface ActorContext {
  actorId: string;
  actorName: string;
  actorRole: string;
}

// -------------------------------------------------------------
// 1. RISK ENTITIES
// -------------------------------------------------------------

export interface InstitutionalRisk {
  id: string; // EHRJ-RISK-YYYY-XXXX
  riskCode: string;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  riskCategory: RiskCategory;
  sourceModule: RiskSourceModule;
  relatedEntityId?: string;
  ownerName: string;
  ownerRole: string;
  reviewerName: string;
  reviewerRole: string;

  // Inherent Scoring (Before Controls)
  inherentLikelihood: RiskLikelihood;
  inherentImpact: RiskImpact;
  inherentScore: number; // 1-25
  inherentLevel: RiskLevel;

  // Control & Residual Scoring (After Controls)
  existingControlIds: string[];
  residualLikelihood: RiskLikelihood;
  residualImpact: RiskImpact;
  residualScore: number; // 1-25
  residualLevel: RiskLevel;

  // Treatment Plan
  treatmentType: RiskTreatmentType;
  treatmentPlanBn: string;
  treatmentOwner: string;
  treatmentTargetDate: string;
  treatmentCompletionDate?: string;

  // Lifecycle Status
  status: RiskStatus;
  acceptanceReasonBn?: string;
  acceptedBy?: string;
  acceptedAt?: string;
  closureReasonBn?: string;
  closedBy?: string;
  closedAt?: string;

  nextReviewDate: string;
  evidenceDocRefs: string[];
  notes?: string;

  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// 2. CONTROL ENTITIES
// -------------------------------------------------------------

export interface InstitutionalControl {
  id: string; // EHRJ-CTRL-YYYY-XXXX
  controlCode: string;
  nameBn: string;
  nameEn: string;
  descriptionBn: string;
  controlObjectiveBn: string;
  category: RiskCategory;
  controlType: ControlType;
  executionType: ExecutionType;
  frequency: ControlFrequency;
  ownerName: string;
  ownerRole: string;
  relatedRiskIds: string[];
  sourceModule: RiskSourceModule;
  evidenceRequirementBn: string;
  testingMethodBn: string;
  status: ControlStatus;

  lastTestedDate?: string;
  lastTestResult?: ControlEffectiveness;
  nextTestDueDate: string;
  exceptionCount: number;

  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface ControlTestRecord {
  id: string; // EHRJ-CTEST-YYYY-XXXX
  controlId: string;
  testDate: string;
  testerName: string;
  testerRole: string;
  testMethod: string;
  populationDescription: string;
  sampleSize: number;
  expectedResultBn: string;
  actualResultBn: string;
  result: ControlEffectiveness;
  exceptionCount: number;
  evidenceRef: string;
  phase29DocToken?: string;
  notes: string;
  createdAt: string;
}

export interface ControlException {
  id: string; // EHRJ-EXC-YYYY-XXXX
  controlId: string;
  exceptionReasonBn: string;
  scopeBn: string;
  startDate: string;
  endDate: string;
  compensatingControlBn: string;
  approvedBy: string;
  approvedAt: string;
  status: ExceptionStatus;
  evidenceRef?: string;
  reviewDate: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// 3. FINDINGS & CORRECTIVE ACTIONS
// -------------------------------------------------------------

export interface GovernanceFinding {
  id: string; // EHRJ-FND-YYYY-XXXX
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  sourceType: FindingSourceType;
  sourceReferenceId?: string;
  relatedRiskId?: string;
  relatedControlId?: string;
  severity: RiskLevel;
  ownerName: string;
  status: FindingStatus;
  rootCauseCategory: RootCauseCategory;
  rootCauseAnalysisBn: string;
  recommendationBn: string;
  resolutionNotesBn?: string;
  evidenceDocRefs: string[];
  dueDate: string;
  verifiedBy?: string;
  verifiedAt?: string;
  closedBy?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CorrectiveAction {
  id: string; // EHRJ-ACT-YYYY-XXXX
  findingId: string;
  actionType: "CORRECTIVE" | "PREVENTIVE";
  actionDescriptionBn: string;
  assignedTo: string;
  dueDate: string;
  priority: RiskLevel;
  status: ActionStatus;
  evidenceRef?: string;
  completionNotesBn?: string;
  completedAt?: string;
  verificationNotesBn?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// 4. GOVERNANCE REVIEWS
// -------------------------------------------------------------

export interface GovernanceReviewSession {
  id: string; // EHRJ-REV-YYYY-XXXX
  periodTitleBn: string;
  reviewDate: string;
  leadReviewerName: string;
  leadReviewerRole: string;
  participatingRoles: string[];
  risksReviewedCount: number;
  controlsReviewedCount: number;
  findingsReviewedCount: number;
  exceptionsReviewedCount: number;
  summaryDecisionsBn: string;
  actionItemsCount: number;
  status: GovernanceReviewStatus;
  evidenceRef?: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// 5. AUDIT & DASHBOARD
// -------------------------------------------------------------

export interface GovernanceAuditEntry {
  id: string;
  timestamp: string;
  entityType: "RISK" | "CONTROL" | "CONTROL_TEST" | "EXCEPTION" | "FINDING" | "ACTION" | "REVIEW";
  entityId: string;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  notes: string;
  details?: Record<string, any>;
}

export interface GovernanceDashboardStats {
  totalRisks: number;
  openRisks: number;
  criticalRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  mitigatedRisks: number;
  acceptedRisks: number;

  totalControls: number;
  activeControls: number;
  effectiveControls: number;
  partiallyEffectiveControls: number;
  ineffectiveControls: number;
  untestedControls: number;
  controlHealthPercentage: number;

  totalFindings: number;
  openFindings: number;
  overdueFindings: number;
  pendingVerificationFindings: number;

  totalActions: number;
  completedActions: number;
  overdueActions: number;

  activeExceptionsCount: number;
  upcomingReviewsCount: number;
}
