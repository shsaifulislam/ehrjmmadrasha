/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 44
 * Source-of-Truth Registry & Authority Ownership Matrix
 * Checkpoint: EHRJ-AI-2026-PHASE44
 */

import { SourceOfTruthEntity } from "./types";

export const MASTER_SOURCE_OF_TRUTH_MAP: SourceOfTruthEntity[] = [
  {
    domain: "STUDENT_MASTER",
    authoritativePhase: "PHASE 1",
    ownerModule: "src/lib/prisma.ts (Student, JamatClass, Section, Enrollment)",
    dataStore: "SQLite (Student table, prisma/dev.db)",
    mutatorRoles: ["ADMIN", "PRINCIPAL"],
    readerRoles: ["ADMIN", "PRINCIPAL", "TEACHER", "GUARDIAN"],
    calculationEngine: "src/lib/studentId.ts",
    displayModules: ["/admin/students", "/teacher/students", "/guardian/children"],
    auditMechanism: "AuditLog (prisma/dev.db)",
    invariants: [
      "One unique institutional student ID (ERJM-YYYY-DEPT-XXXX)",
      "Student history is immutable; status transitions preserved in enrollment history",
      "Alumni (Phase 36) references Student ID, never duplicates student records"
    ]
  },
  {
    domain: "ADMISSIONS",
    authoritativePhase: "PHASE 3 / PHASE 34",
    ownerModule: "src/lib/admissions/ & src/lib/admissionApproval.ts",
    dataStore: "SQLite (Application table) & data/admissions/",
    mutatorRoles: ["ADMIN", "PRINCIPAL"],
    readerRoles: ["ADMIN", "PRINCIPAL", "PUBLIC (Applicant self-lookup)"],
    calculationEngine: "src/lib/admissionId.ts",
    displayModules: ["/admission", "/admin/admissions"],
    auditMechanism: "AuditLog & Application status histories",
    invariants: [
      "Public application does NOT create active Student record until formal human approval",
      "No hardcoded admission fee; fees driven by Phase 6 FeeStructure",
      "Financial assistance / quota approval strictly requires human authority"
    ]
  },
  {
    domain: "GUARDIAN_RELATIONSHIPS",
    authoritativePhase: "PHASE 1 / GUARDIAN PORTAL",
    ownerModule: "src/lib/prisma.ts (Guardian, GuardianStudent)",
    dataStore: "SQLite (Guardian, GuardianStudent)",
    mutatorRoles: ["ADMIN", "PRINCIPAL"],
    readerRoles: ["ADMIN", "PRINCIPAL", "GUARDIAN"],
    calculationEngine: "N/A (Relational mapping)",
    displayModules: ["/admin/guardians", "/guardian/dashboard"],
    auditMechanism: "AuditLog",
    invariants: [
      "Guardians can only view students explicitly bound in GuardianStudent table (IDOR protection)",
      "Guardian credentials tied to unique verified phone/NID"
    ]
  },
  {
    domain: "ATTENDANCE",
    authoritativePhase: "PHASE 4",
    ownerModule: "src/lib/attendanceService.ts & src/lib/attendanceCalculations.ts",
    dataStore: "SQLite (Attendance, AttendanceLock)",
    mutatorRoles: ["ADMIN", "PRINCIPAL", "TEACHER"],
    readerRoles: ["ADMIN", "PRINCIPAL", "TEACHER", "GUARDIAN"],
    calculationEngine: "src/lib/attendanceCalculations.ts",
    displayModules: ["/admin/attendance", "/teacher/attendance", "/guardian/attendance"],
    auditMechanism: "AttendanceLock & Attendance.markedByUserId",
    invariants: [
      "Locked attendance records cannot be silently modified without unlock reason",
      "Teacher can only submit attendance for assigned class/section",
      "Student attendance is separate from Employee attendance (Phase 13)"
    ]
  },
  {
    domain: "EXAMS_AND_RESULTS",
    authoritativePhase: "PHASE 5",
    ownerModule: "src/lib/resultCalculationService.ts",
    dataStore: "SQLite (Exam, ExamSubject, ExamMark, Result, AdmitCard)",
    mutatorRoles: ["ADMIN", "PRINCIPAL", "TEACHER (Marks only)"],
    readerRoles: ["ADMIN", "PRINCIPAL", "TEACHER", "GUARDIAN", "PUBLIC (Result lookup)"],
    calculationEngine: "src/lib/resultCalculationService.ts",
    displayModules: ["/admin/exams", "/teacher/marks", "/guardian/results", "/results"],
    auditMechanism: "Result publication audit & verification codes",
    invariants: [
      "Grading standard: Mumtaz (80-100%), Jayyid Jiddan (65-79%), Jayyid (50-64%), Maqbool (33-49%), Rasib (<33%)",
      "Frozen published results cannot be changed without formal reissue audit trail",
      "Online result verification uses cryptographic verification tokens"
    ]
  },
  {
    domain: "FINANCE_AND_ACCOUNTING",
    authoritativePhase: "PHASE 6",
    ownerModule: "src/lib/feeCalculationService.ts & src/lib/reconciliationEngine.ts",
    dataStore: "SQLite (FeeInvoice, PaymentReceipt, CashFund, CashTransaction, Refund)",
    mutatorRoles: ["ADMIN", "ACCOUNTANT"],
    readerRoles: ["ADMIN", "PRINCIPAL", "GUARDIAN (own dues/receipts)"],
    calculationEngine: "src/lib/feeCalculationService.ts",
    displayModules: ["/admin/finance", "/guardian/fees"],
    auditMechanism: "CashTransaction immutable ledger, duplicate check, transaction locking",
    invariants: [
      "Strict fund segregation: General, Lillah, Zakat, Construction, Orphan",
      "Zakat funds can NEVER be spent on infrastructure or operational salaries",
      "Payments are strictly idempotent; duplicate submission is blocked",
      "No hardcoded fee figures; fee structures define rates per department/class"
    ]
  },
  {
    domain: "DOCUMENTS_AND_CERTIFICATES",
    authoritativePhase: "PHASE 7 / PHASE 29",
    ownerModule: "src/lib/documentFactory.ts & src/lib/document/",
    dataStore: "SQLite (DocumentRequest, Certificate) & data/documents/",
    mutatorRoles: ["ADMIN", "PRINCIPAL"],
    readerRoles: ["ADMIN", "PRINCIPAL", "TEACHER", "GUARDIAN", "PUBLIC (verification)"],
    calculationEngine: "src/lib/documentFactory.ts",
    displayModules: ["/admin/documents", "/guardian/documents", "/verify"],
    auditMechanism: "Certificate verification token & SHA-256 hash",
    invariants: [
      "Phase 7 owns document generation, QR generation, and revocations",
      "Phase 29 owns OCR intelligence and token references; never duplicates master documents",
      "Revoked certificates immediately fail online QR verification"
    ]
  },
  {
    domain: "COMMUNICATION_AND_NOTIFICATIONS",
    authoritativePhase: "PHASE 8 / PHASE 32",
    ownerModule: "src/lib/communicationEngine.ts & src/lib/communications/",
    dataStore: "SQLite (Notice, Notification, NotificationOutbox) & data/communications/",
    mutatorRoles: ["ADMIN", "PRINCIPAL"],
    readerRoles: ["ALL_AUTHENTICATED"],
    calculationEngine: "src/lib/communicationEngine.ts",
    displayModules: ["/admin/communications", "/portal/notices", "/notices"],
    auditMechanism: "NotificationDelivery & audit trails",
    invariants: [
      "Strictly NO SMS — Delivery via Web Push, In-App Portal alerts, and transactional Email",
      "Notifications must never leak sensitive student financial assistance or Zakat status"
    ]
  },
  {
    domain: "LIBRARY",
    authoritativePhase: "PHASE 9",
    ownerModule: "src/lib/libraryEngine.ts",
    dataStore: "SQLite (LibraryBook, LibraryBookCopy, LibraryMember, LibraryIssue, LibraryRenewal)",
    mutatorRoles: ["ADMIN", "LIBRARIAN"],
    readerRoles: ["ADMIN", "PRINCIPAL", "TEACHER", "STUDENT"],
    calculationEngine: "src/lib/libraryEngine.ts",
    displayModules: ["/admin/library", "/library"],
    auditMechanism: "LibraryConditionHistory & Issue audit",
    invariants: [
      "Fines calculate deterministically but route to Phase 6 CashTransaction (no duplicate ledger)",
      "Book accession numbers are unique and physically traceable"
    ]
  },
  {
    domain: "RESIDENTIAL_AND_HOSTEL",
    authoritativePhase: "PHASE 10",
    ownerModule: "src/lib/hostelEngine.ts",
    dataStore: "SQLite (ResidentialEnrollment, ResidentialHistory, ResidentialRequest)",
    mutatorRoles: ["ADMIN", "SUPERINTENDENT"],
    readerRoles: ["ADMIN", "PRINCIPAL", "GUARDIAN"],
    calculationEngine: "src/lib/hostelEngine.ts",
    displayModules: ["/admin/hostel"],
    auditMechanism: "ResidentialHistory log",
    invariants: [
      "Day Care students are strictly exempt from meal/food charges",
      "Residential food fee invoices generate through Phase 6"
    ]
  },
  {
    domain: "TRANSPORT",
    authoritativePhase: "PHASE 11",
    ownerModule: "src/lib/transportEngine.ts",
    dataStore: "SQLite (TransportVehicle, TransportRoute, TransportStop, TransportEnrollment)",
    mutatorRoles: ["ADMIN", "TRANSPORT_MANAGER"],
    readerRoles: ["ADMIN", "PRINCIPAL", "GUARDIAN"],
    calculationEngine: "src/lib/transportEngine.ts",
    displayModules: ["/admin/transport", "/transport"],
    auditMechanism: "TransportAssignmentHistory",
    invariants: [
      "Transport vehicle capacity cannot be silently exceeded",
      "Transport monthly fee billing bridges to Phase 6 FeeInvoice"
    ]
  },
  {
    domain: "INVENTORY_AND_STOCK",
    authoritativePhase: "PHASE 12",
    ownerModule: "src/lib/inventoryEngine.ts",
    dataStore: "SQLite (InventoryItem, InventoryStockBalance, InventoryTransaction, InventoryAsset)",
    mutatorRoles: ["ADMIN", "STOREKEEPER"],
    readerRoles: ["ADMIN", "PRINCIPAL"],
    calculationEngine: "src/lib/inventoryEngine.ts",
    displayModules: ["/admin/inventory"],
    auditMechanism: "InventoryTransaction log & AssetConditionHistory",
    invariants: [
      "Stock balances cannot be negative unless explicitly marked with deficit approval",
      "Phase 12 owns physical items and stock balances; Phase 40 owns vendor relationships"
    ]
  },
  {
    domain: "HUMAN_RESOURCES_AND_PAYROLL",
    authoritativePhase: "PHASE 13",
    ownerModule: "src/lib/hrEngine.ts",
    dataStore: "SQLite (Employee, EmployeeLeaveBalance, EmployeeLeaveRequest, PayrollRecord)",
    mutatorRoles: ["ADMIN", "PRINCIPAL"],
    readerRoles: ["ADMIN", "PRINCIPAL", "EMPLOYEE (own profile)"],
    calculationEngine: "src/lib/hrEngine.ts",
    displayModules: ["/admin/hr"],
    auditMechanism: "EmployeeEmploymentHistory & audit logs",
    invariants: [
      "Employee master is the authoritative source for all madrasah staff/teachers",
      "Payroll disbursements bridge directly to Phase 6 CashTransaction",
      "Staff training records in Phase 39 link to Employee ID without duplicating HR records"
    ]
  },
  {
    domain: "HELPDESK_AND_TICKETS",
    authoritativePhase: "PHASE 14",
    ownerModule: "src/lib/helpdeskEngine.ts",
    dataStore: "SQLite (SupportRequest, SupportRequestMessage, SupportRequestAttachment)",
    mutatorRoles: ["ADMIN", "PRINCIPAL", "ASSIGNED_STAFF"],
    readerRoles: ["ADMIN", "PRINCIPAL", "GUARDIAN (own tickets)"],
    calculationEngine: "src/lib/helpdeskEngine.ts",
    displayModules: ["/admin/helpdesk", "/portal/helpdesk"],
    auditMechanism: "SupportRequestStatusHistory",
    invariants: [
      "Internal notes (isInternal=true) are strictly hidden from Guardians",
      "SLA timers monitor response and resolution targets",
      "Survey feedback (Phase 37) can bridge into Help Desk tickets with traceable ticket codes"
    ]
  },
  {
    domain: "ANALYTICS_AND_BI",
    authoritativePhase: "PHASE 15 / PHASE 26",
    ownerModule: "src/lib/analyticsEngine.ts & src/lib/biEngine.ts",
    dataStore: "SQLite (SavedReport, ReportSchedule) & read-only operational store queries",
    mutatorRoles: ["ADMIN", "PRINCIPAL"],
    readerRoles: ["ADMIN", "PRINCIPAL"],
    calculationEngine: "src/lib/biMetricDictionary.ts & src/lib/forecastingEngine.ts",
    displayModules: ["/admin/analytics", "/admin/business-intelligence"],
    auditMechanism: "N/A (Read-only analytical projection)",
    invariants: [
      "Analytics engines never mutate transactional ledgers or student records",
      "Metrics pull directly from authoritative operational tables without caching stale counts"
    ]
  },
  {
    domain: "OPERATIONS_AND_BACKUP",
    authoritativePhase: "PHASE 16",
    ownerModule: "src/lib/operationsEngine.ts",
    dataStore: "SQLite (SystemBackup, RestoreOperation, SystemIncident, RecoveryDrill)",
    mutatorRoles: ["ADMIN"],
    readerRoles: ["ADMIN"],
    calculationEngine: "src/lib/operationsEngine.ts",
    displayModules: ["/admin/operations"],
    auditMechanism: "Backup SHA-256 verification & RecoveryDrill logs",
    invariants: [
      "Database restores require pre-restore automatic snapshots",
      "Backup archives must pass SHA-256 checksum verification before restoration"
    ]
  },
  {
    domain: "SECURITY_OPERATIONS",
    authoritativePhase: "PHASE 17 / PHASE 24",
    ownerModule: "src/lib/securityEngine.ts & src/lib/security.ts",
    dataStore: "SQLite (AuditLog, LoginHistory, OtpCode) & data/security/",
    mutatorRoles: ["ADMIN"],
    readerRoles: ["ADMIN"],
    calculationEngine: "src/lib/securityEngine.ts",
    displayModules: ["/admin/security"],
    auditMechanism: "Real-time security telemetry & brute-force memory lock",
    invariants: [
      "Zero plain-text passwords or secret tokens in logs",
      "Sliding window rate-limiting on authentication and payment endpoints"
    ]
  },
  {
    domain: "KNOWLEDGE_AND_POLICIES",
    authoritativePhase: "PHASE 38 (Authority) / PHASE 22 (RAG)",
    ownerModule: "src/lib/knowledge/ & src/lib/policies/",
    dataStore: "data/institutional_knowledge/ & data/knowledge/",
    mutatorRoles: ["ADMIN", "PRINCIPAL"],
    readerRoles: ["ALL_AUTHENTICATED", "PUBLIC (Public policies)"],
    calculationEngine: "src/lib/knowledge/policyConflictDetector.ts",
    displayModules: ["/admin/knowledge", "/knowledge", "/portal/knowledge"],
    auditMechanism: "Immutable version history & digital acknowledgements",
    invariants: [
      "Phase 38 owns policy governance and legal hold rules",
      "Phase 22 owns semantic embeddings and RAG querying; RAG never overrides authoritative policy text",
      "Historical effective dates resolve exact past policy version in effect"
    ]
  },
  {
    domain: "PROCUREMENT_AND_VENDORS",
    authoritativePhase: "PHASE 40",
    ownerModule: "src/lib/procurement/",
    dataStore: "data/procurement/ (vendors.json, rfqs.json, contracts.json, etc.)",
    mutatorRoles: ["ADMIN", "PROCUREMENT_OFFICER"],
    readerRoles: ["ADMIN", "PRINCIPAL"],
    calculationEngine: "src/lib/procurement/threeWayMatchingEngine.ts",
    displayModules: ["/admin/procurement", "/admin/vendors", "/admin/contracts"],
    auditMechanism: "Audit logs & immutable contract revisions",
    invariants: [
      "Phase 40 owns vendor credentials, RFQs, evaluations, and contracts",
      "Three-way matching connects PO (Phase 12) + GRN (Phase 12) + CashTransaction (Phase 6)",
      "Zero autonomous AI contract awards; principal approval is mandatory"
    ]
  },
  {
    domain: "BUDGETS_AND_PLANNING",
    authoritativePhase: "PHASE 41",
    ownerModule: "src/lib/budget/",
    dataStore: "data/budgets/ (budgets.json, budget_periods.json, etc.)",
    mutatorRoles: ["ADMIN", "FINANCE_COMMITTEE"],
    readerRoles: ["ADMIN", "PRINCIPAL"],
    calculationEngine: "src/lib/budget/budgetCalculationEngine.ts",
    displayModules: ["/admin/budgets"],
    auditMechanism: "Immutable version snapshots on human approval",
    invariants: [
      "Budget plans allocations; it never duplicates the accounting transaction ledger (Phase 6)",
      "Shariah Zakat segregation enforced: Zakat budget lines restricted to student welfare"
    ]
  },
  {
    domain: "RISK_AND_INTERNAL_CONTROL",
    authoritativePhase: "PHASE 42",
    ownerModule: "src/lib/riskAssurance/",
    dataStore: "data/risk_assurance/ (risks.json, controls.json, findings.json, etc.)",
    mutatorRoles: ["ADMIN", "PRINCIPAL", "AUDITOR"],
    readerRoles: ["ADMIN", "PRINCIPAL"],
    calculationEngine: "src/lib/riskAssurance/riskScoringEngine.ts",
    displayModules: ["/admin/governance/risks", "/admin/governance/controls"],
    auditMechanism: "GovernanceReviewSession & anti-silent-closure validation",
    invariants: [
      "Operates strictly above operational stores to monitor risks and verify controls",
      "Principal-only authority gate for risk acceptance and finding closures"
    ]
  },
  {
    domain: "COMPLIANCE_ASSURANCE",
    authoritativePhase: "PHASE 43",
    ownerModule: "src/lib/compliance/",
    dataStore: "data/compliance/ (requirements.json, obligations.json, etc.)",
    mutatorRoles: ["ADMIN", "PRINCIPAL", "COMPLIANCE_OFFICER"],
    readerRoles: ["ADMIN", "PRINCIPAL"],
    calculationEngine: "src/lib/compliance/obligationEngine.ts",
    displayModules: ["/admin/compliance"],
    auditMechanism: "Evidence verification hashes & Principal compliance reviews",
    invariants: [
      "Authoritative statutory requirement register (BMEB, NBR, RJSC, Madrasah Constitution)",
      "Anti-silent exclusion: changing requirement applicability requires documented human justification"
    ]
  }
];

export function getAuthoritativeOwner(domain: string): SourceOfTruthEntity | undefined {
  return MASTER_SOURCE_OF_TRUTH_MAP.find(e => e.domain.toUpperCase() === domain.toUpperCase());
}

export function assertNoDuplicateAuthority(domain: string): { valid: boolean; owner: string } {
  const matching = MASTER_SOURCE_OF_TRUTH_MAP.filter(e => e.domain.toUpperCase() === domain.toUpperCase());
  if (matching.length === 0) {
    throw new Error(`Domain '${domain}' is not registered in Authoritative Source-of-Truth Map.`);
  }
  if (matching.length > 1) {
    throw new Error(`CRITICAL ARCHITECTURAL CONFLICT: Duplicate authority found for domain '${domain}'.`);
  }
  return { valid: true, owner: matching[0].ownerModule };
}
