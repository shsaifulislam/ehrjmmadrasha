/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 45
 * Production Release Candidate, Full QA & UAT Engine
 * Checkpoint: EHRJ-AI-2026-PHASE45
 */

export type UATPersona = "ADMIN" | "PRINCIPAL" | "TEACHER" | "GUARDIAN" | "PUBLIC";

export type UATStatus = "PASS" | "FAIL" | "BLOCKED" | "NOT_APPLICABLE";

export type ReleaseDecision = "GO" | "CONDITIONAL_GO" | "NO_GO";

export interface UATTestCase {
  id: string;
  category: string;
  persona: UATPersona;
  journeyTitle: string;
  steps: string[];
  expectedResult: string;
  actualResult: string;
  status: UATStatus;
  evidence: string;
}

export interface BackupRestoreDrillRecord {
  drillId: string;
  backupId: string;
  timestamp: string;
  sourceDatabase: string;
  targetDatabase: string;
  checksumOriginal: string;
  checksumRestored: string;
  checksumVerified: boolean;
  restoreDurationMs: number;
  dataIntegrityChecks: {
    usersCount: number;
    studentsCount: number;
    cashTransactionsCount: number;
    certificatesCount: number;
    auditLogsCount: number;
  };
  status: "PASSED" | "FAILED";
  evidenceNotes: string;
}

export interface SecurityHardeningAudit {
  authSessionFlagged: boolean;
  rbacProtected: boolean;
  idorProtected: boolean;
  sqlInjectionImmune: boolean;
  xssSanitized: boolean;
  csrfProtected: boolean;
  secretsClean: boolean;
  rateLimiterActive: boolean;
  securityHeadersConfigured: boolean;
  overallSecurityStatus: "PASSED" | "FAILED";
}

export interface PerformanceBenchmark {
  endpoint: string;
  method: string;
  latencyMs: number;
  status: number;
  acceptable: boolean;
}

export interface ReleaseCandidateEvaluation {
  checkpoint: string;
  institutionBn: string;
  institutionEn: string;
  timestamp: string;
  buildVersion: string;
  phase44RemediationsVerified: boolean;
  totalUatCases: number;
  passedUatCases: number;
  failedUatCases: number;
  p0BlockersRemaining: number;
  p1IssuesRemaining: number;
  securityHardening: SecurityHardeningAudit;
  backupRestoreDrill: BackupRestoreDrillRecord;
  performanceBenchmarks: PerformanceBenchmark[];
  uatResultsByPersona: Record<UATPersona, { total: number; passed: number; status: UATStatus }>;
  uatCases: UATTestCase[];
  releaseDecision: ReleaseDecision;
  decisionJustification: string;
  phase46Readiness: boolean;
}
