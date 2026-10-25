/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 44
 * Final Gap Analysis, Architecture Consolidation & System Completeness Engine
 * Checkpoint: EHRJ-AI-2026-PHASE44
 */

export type FeatureStatus =
  | "IMPLEMENTED"
  | "PARTIALLY_IMPLEMENTED"
  | "PLANNED"
  | "MISSING"
  | "BROKEN"
  | "DUPLICATED"
  | "DISCONNECTED"
  | "BLOCKED"
  | "UNVERIFIED";

export type GapSeverity = "P0" | "P1" | "P2" | "P3" | "P4";

export type SystemCompletenessStatus =
  | "READY_FOR_PHASE45"
  | "CONDITIONAL_FOR_PHASE45"
  | "BLOCKED";

export interface SourceOfTruthEntity {
  domain: string;
  authoritativePhase: string;
  ownerModule: string;
  dataStore: string;
  mutatorRoles: string[];
  readerRoles: string[];
  calculationEngine: string;
  displayModules: string[];
  auditMechanism: string;
  invariants: string[];
}

export interface PhaseCoverageRecord {
  phase: number;
  code: string;
  nameBn: string;
  nameEn: string;
  capability: string;
  database: string;
  apiCount: number;
  uiRoutesCount: number;
  authorization: string;
  integrationLinks: string[];
  testFile: string;
  testCount: number;
  browserQA: string;
  status: FeatureStatus;
  evidence: string;
}

export interface DuplicationAuditRecord {
  id: string;
  systemA: string;
  systemB: string;
  conflict: string;
  authoritativeSource: string;
  requiredAction: string;
  remediationStatus: "CONSOLIDATED" | "RESOLVED" | "BY_DESIGN";
  evidenceNotes: string;
}

export interface GapFindingRecord {
  id: string;
  title: string;
  severity: GapSeverity;
  phase: number;
  category: "SECURITY" | "FINANCE" | "DATA_INTEGRITY" | "INTEGRATION" | "UX" | "DEPLOYMENT" | "WORKFLOW";
  description: string;
  impact: string;
  remediationRequired: string;
  remediationStatus: "RESOLVED" | "IN_PROGRESS" | "BACKLOG";
  evidenceRef: string;
}

export interface SecurityAuditItem {
  id: string;
  vector: string;
  scope: string;
  testedMethod: string;
  result: "PASSED" | "FLAGGED" | "HARDENED";
  evidence: string;
}

export interface SystemCompletenessAuditResult {
  checkpoint: string;
  timestamp: string;
  institutionBn: string;
  institutionEn: string;
  totalPhasesAudited: number;
  phaseCoverage: PhaseCoverageRecord[];
  sourceOfTruthMap: SourceOfTruthEntity[];
  duplications: DuplicationAuditRecord[];
  gapFindings: GapFindingRecord[];
  securityAudit: SecurityAuditItem[];
  financialIntegrityAudit: {
    status: "VERIFIED" | "FAILED";
    totalFunds: number;
    hardcodedFeesFound: boolean;
    duplicatePaymentProtection: boolean;
    cashBalanceReconciled: boolean;
    evidenceNotes: string;
  };
  humanAuthorityGates: {
    aiHighStakesEnforced: boolean;
    admissionApprovalHumanGated: boolean;
    resultApprovalHumanGated: boolean;
    financialRefundHumanGated: boolean;
    riskAcceptanceHumanGated: boolean;
    complianceExceptionHumanGated: boolean;
  };
  noSmsRuleEnforced: boolean;
  phase45GateStatus: SystemCompletenessStatus;
  summary: {
    implementedCount: number;
    partiallyImplementedCount: number;
    p0Count: number;
    p1Count: number;
    p2Count: number;
    p3Count: number;
    p4Count: number;
  };
}
