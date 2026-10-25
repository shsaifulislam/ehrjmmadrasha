/**
 * EHRJ Madrasha Digital Campus & ERP
 * Phase 42 — Institutional Risk Management, Internal Control & Governance Assurance Engine
 * Comprehensive Automated Verification & Regression Suite
 * Checkpoint: EHRJ-AI-2026-PHASE42
 */

import {
  RiskAssuranceStore,
  RiskRegisterEngine,
  ControlRegisterEngine,
  FindingsActionEngine,
  GovernanceReviewEngine,
  GovernanceCrossModuleBridge,
  ActorContext,
} from "../src/lib/riskAssurance";

const ADMIN_ACTOR: ActorContext = {
  actorId: "usr_admin_001",
  actorName: "Moulana Admin",
  actorRole: "ADMIN",
};

const PRINCIPAL_ACTOR: ActorContext = {
  actorId: "usr_principal_001",
  actorName: "Muhtamim Principal",
  actorRole: "PRINCIPAL",
};

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  ✗ [FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
  }
}

async function runSuite() {
  console.log("===============================================================================");
  console.log("  PHASE 42: RISK MANAGEMENT, INTERNAL CONTROL & GOVERNANCE ASSURANCE TEST SUITE");
  console.log("  Institutional Checkpoint: EHRJ-AI-2026-PHASE42");
  console.log("===============================================================================\n");

  // -------------------------------------------------------------------------
  // GROUP 1: Store & Seeding Integrity
  // -------------------------------------------------------------------------
  console.log("--- Group 1: Store Persistence & Institutional Seeding ---");
  const seededRisks = RiskAssuranceStore.getRisks();
  assert(seededRisks.length >= 5, "Pre-seeded institutional risks loaded", `Found ${seededRisks.length}`);

  const shariahRisk = seededRisks.find((r) => r.id === "EHRJ-RISK-2026-0001");
  assert(!!shariahRisk, "Shariah fund segregation risk (EHRJ-RISK-2026-0001) exists");
  assert(
    shariahRisk?.riskCategory === "SHARIAH_COMPLIANCE" || shariahRisk?.riskCategory === "FINANCIAL",
    "Shariah risk is categorized as SHARIAH_COMPLIANCE / FINANCIAL"
  );
  assert(shariahRisk?.inherentLevel === "CRITICAL", "Shariah risk inherent level is CRITICAL");

  const seededControls = RiskAssuranceStore.getControls();
  assert(seededControls.length >= 5, "Pre-seeded internal controls loaded", `Found ${seededControls.length}`);

  const bankControl = seededControls.find((c) => c.id === "EHRJ-CTRL-2026-0001");
  assert(!!bankControl, "Two-person bank authorization control (EHRJ-CTRL-2026-0001) exists");
  assert(bankControl?.controlType === "PREVENTIVE", "Bank control type is PREVENTIVE");

  // -------------------------------------------------------------------------
  // GROUP 2: 5x5 Matrix Scoring & Level Calculation
  // -------------------------------------------------------------------------
  console.log("\n--- Group 2: 5x5 Matrix Scoring & Inherent/Residual Calculation ---");
  const score1 = RiskRegisterEngine.evaluateRiskLevel(5, 5);
  assert(score1.score === 25 && score1.level === "CRITICAL", "5x5 Likelihood 5 x Impact 5 = 25 (CRITICAL)");

  const score2 = RiskRegisterEngine.evaluateRiskLevel(4, 3);
  assert(score2.score === 12 && score2.level === "HIGH", "Likelihood 4 x Impact 3 = 12 (HIGH)");

  const score3 = RiskRegisterEngine.evaluateRiskLevel(3, 2);
  assert(score3.score === 6 && score3.level === "MEDIUM", "Likelihood 3 x Impact 2 = 6 (MEDIUM)");

  const score4 = RiskRegisterEngine.evaluateRiskLevel(2, 2);
  assert(score4.score === 4 && score4.level === "LOW", "Likelihood 2 x Impact 2 = 4 (LOW)");

  const score5 = RiskRegisterEngine.evaluateRiskLevel(1, 1);
  assert(score5.score === 1 && score5.level === "LOW", "Likelihood 1 x Impact 1 = 1 (LOW)");

  // -------------------------------------------------------------------------
  // GROUP 3: Risk Creation, Assessment & Lifecycle
  // -------------------------------------------------------------------------
  console.log("\n--- Group 3: Risk Creation & Dynamic Assessment Engine ---");
  const newRisk = RiskRegisterEngine.createRisk(
    {
      titleBn: "পরীক্ষা প্রশ্নপত্র ফাঁস ও বিতরণ অনিয়ম ঝুঁকি",
      titleEn: "Exam paper leak and unauthorized distribution risk",
      descriptionBn: "মুদ্রণ ও হেফাজতের সময় অননুমোদিত শিক্ষক বা কর্মচারীর প্রশ্নপত্রে প্রবেশাধিকারের ঝুঁকি",
      riskCategory: "ACADEMIC",
      sourceModule: "ACADEMIC",
      ownerName: "মুফতি পরীক্ষা নিয়ন্ত্রক",
      ownerRole: "EXAM_CONTROLLER",
      inherentLikelihood: 4,
      inherentImpact: 4,
      treatmentType: "MITIGATE",
      treatmentPlanBn: "দুই স্তরের সিলগালা ও সিসিটিভি হেফাজত ব্যবস্থা",
      treatmentOwner: "পরীক্ষা কমিটি",
      treatmentTargetDate: "2026-10-15",
    },
    ADMIN_ACTOR
  );

  assert(newRisk.id.startsWith("EHRJ-RISK-"), "New risk has structured ID: " + newRisk.id);
  assert(newRisk.inherentScore === 16 && newRisk.inherentLevel === "CRITICAL", "Inherent score correctly computed as 16 CRITICAL");
  assert(newRisk.status === "OPEN", "Initial status is OPEN");

  // Re-assess with controls
  const assessedRisk = RiskRegisterEngine.assessRisk(
    newRisk.id,
    {
      inherentLikelihood: 4,
      inherentImpact: 4,
      existingControlIds: ["EHRJ-CTRL-2026-0002"],
      residualLikelihood: 1,
      residualImpact: 3,
      assessmentNotesBn: "দ্বৈত সিলগালা নিয়ন্ত্রণ প্রয়োগের ফলে সম্ভাব্যতা ৪ থেকে কমে ১ হয়েছে।",
    },
    ADMIN_ACTOR
  );

  assert(assessedRisk.residualScore === 3 && assessedRisk.residualLevel === "LOW", "Residual score correctly computed as 3 LOW");
  assert(assessedRisk.existingControlIds.includes("EHRJ-CTRL-2026-0002"), "Existing control correctly mapped to risk");

  // -------------------------------------------------------------------------
  // GROUP 4: Human Authority Gates: Formal Acceptance & Formal Closure
  // -------------------------------------------------------------------------
  console.log("\n--- Group 4: Human Authority Gates (Risk Acceptance & Closure) ---");

  // Test that non-Principal/non-Admin cannot accept risk
  let caughtUnauthorized = false;
  try {
    RiskRegisterEngine.acceptRisk(
      newRisk.id,
      {
        acceptanceReasonBn: "পরীক্ষা কমিটির বিশেষ অনুমোদন",
        nextReviewDate: "2026-11-01",
      },
      { actorId: "usr_teacher_01", actorName: "Teacher User", actorRole: "TEACHER" }
    );
  } catch (err: any) {
    caughtUnauthorized = true;
  }
  assert(caughtUnauthorized, "Teacher cannot accept institutional risk (Human Authority Gate enforced)");

  // Test Principal Acceptance
  const acceptedRisk = RiskRegisterEngine.acceptRisk(
    newRisk.id,
    {
      acceptanceReasonBn: "মুহতামিম কর্তৃক সতর্কতামূলক তত্ত্বাবধানে সাময়িক অনুমোদন",
      nextReviewDate: "2026-11-01",
      conditionsBn: "সাপ্তাহিক পরীক্ষার হলে সিসিটিভি সচল থাকতে হবে",
    },
    PRINCIPAL_ACTOR
  );
  assert(acceptedRisk.status === "ACCEPTED", "Risk status successfully transitioned to ACCEPTED by Principal");
  assert(acceptedRisk.acceptedBy === "Muhtamim Principal", "Principal actor correctly logged on acceptance");

  // Test Formal Closure Invariant (requires reason)
  let caughtClosureWithoutReason = false;
  try {
    RiskRegisterEngine.closeRisk(newRisk.id, { closureReasonBn: "" }, ADMIN_ACTOR);
  } catch {
    caughtClosureWithoutReason = true;
  }
  assert(caughtClosureWithoutReason, "Risk closure strictly rejected if closureReasonBn is empty");

  const closedRisk = RiskRegisterEngine.closeRisk(
    newRisk.id,
    {
      closureReasonBn: "পরীক্ষা সম্পন্ন এবং নতুন ডিজিটাল এনক্রিপ্টেড প্রশ্ন ব্যবস্থা সফলভাবে প্রতিস্থাপিত",
      evidenceRef: "DOC-EXAM-2026-999",
    },
    ADMIN_ACTOR
  );
  assert(closedRisk.status === "CLOSED", "Risk formally CLOSED with audit trail");

  // Verify that an audit record was written
  const auditLogs = RiskAssuranceStore.getAuditLogs();
  assert(auditLogs.length > 0, "Audit logs recorded and accessible");

  // -------------------------------------------------------------------------
  // GROUP 5: Control Register & Control Testing Engine
  // -------------------------------------------------------------------------
  console.log("\n--- Group 5: Control Register & Testing Engine ---");
  const newControl = ControlRegisterEngine.createControl(
    {
      nameBn: "শিক্ষার্থী হোস্টেল ফি আদায়ের দৈনিক ব্যাংক জমার রিকনসিলিয়েশন",
      nameEn: "Daily bank deposit reconciliation for student hostel fees",
      descriptionBn: "নগদ আদায়কৃত সকল ফি ঐদিনই মাদরাসার ডেজিগনেটেড ব্যাংক অ্যাকাউন্টে জমা ও রসিদ যাচাই",
      controlObjectiveBn: "নগদ টাকা অপচয় ও তছরুপের সম্পূর্ণ নিবারণ",
      category: "FINANCIAL",
      ownerName: "হোস্টেল হিসাব কর্মকর্তা",
      ownerRole: "HOSTEL_ACCOUNTANT",
      frequency: "DAILY",
      controlType: "PREVENTIVE",
      executionType: "HYBRID",
      sourceModule: "FINANCE",
      evidenceRequirementBn: "ব্যাংক জমা স্লিপ ও দৈনিক ক্যাশ লেজারের কপি",
      testingMethodBn: "দৈনিক জমা স্লিপ ও ব্যাঙ্ক স্টেটমেন্টের শতভাগ নমুনা যাচাই",
    },
    ADMIN_ACTOR
  );

  assert(newControl.id.startsWith("EHRJ-CTRL-"), "New control ID correctly generated: " + newControl.id);
  assert(newControl.status === "ACTIVE", "Control status is ACTIVE");

  // Record a Control Test
  const testRecord = ControlRegisterEngine.recordControlTest(
    {
      controlId: newControl.id,
      testMethod: "SAMPLE_AUDIT",
      populationDescription: "২০২৬ সালের সেপ্টেম্বর মাসের মোট ৩০ দিনের ব্যাংক জমা",
      sampleSize: 30,
      expectedResultBn: "৩০ দিনের স্লিপ ও ব্যাংক ক্রেডিট এন্ট্রির ১০০% নির্ভুল মিল",
      actualResultBn: "সকল ৩০ দিনের জমা স্লিপ ব্যাংক স্টেটমেন্টের সাথে হুবহু মিলেছে, কোনো গরমিল নেই",
      result: "EFFECTIVE",
      exceptionCount: 0,
      evidenceRef: "BANK-REC-2026-SEP-30",
      notes: "নিয়ন্ত্রণ ব্যবস্থা শতভাগ কার্যকর পরিলক্ষিত হয়েছে",
    },
    ADMIN_ACTOR
  );

  assert(testRecord.id.startsWith("EHRJ-CTEST-"), "Control test generated structured test ID: " + testRecord.id);
  assert(testRecord.result === "EFFECTIVE", "Test result recorded as EFFECTIVE");

  // Verify control was updated with test result
  const refreshedControl = RiskAssuranceStore.getControlById(newControl.id);
  assert(refreshedControl?.lastTestResult === "EFFECTIVE", "Control lastTestResult updated to EFFECTIVE");

  // -------------------------------------------------------------------------
  // GROUP 6: Time-Bounded Exceptions & Compensating Controls
  // -------------------------------------------------------------------------
  console.log("\n--- Group 6: Control Exceptions & Compensating Controls ---");
  const pastDate = new Date(Date.now() - 86400000 * 5).toISOString().slice(0, 10);
  const futureDate = new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10);

  const activeException = ControlRegisterEngine.recordException(
    {
      controlId: newControl.id,
      exceptionReasonBn: "ব্যাংক সার্ভার রক্ষণাবেক্ষণের কারণে ১ দিন অনলাইন জমা স্থগিত",
      scopeBn: "শুধুমাত্র ১ দিনের নগদ লেনদেন",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: futureDate,
      compensatingControlBn: "লকারে নগদ টাকা হেফাজত এবং মুহতামিম ও হিসাবরক্ষকের যৌথ স্বাক্ষরে সিলগালা",
      evidenceRef: "RES-EXC-2026-090",
    },
    ADMIN_ACTOR
  );

  assert(activeException.id.startsWith("EHRJ-EXC-"), "Exception created with ID: " + activeException.id);
  assert(activeException.status === "ACTIVE", "Exception status is ACTIVE");
  assert(activeException.compensatingControlBn.length > 10, "Compensating control documented");

  // Create an expired exception to verify Section 39 scanning rule
  const expiredException = ControlRegisterEngine.recordException(
    {
      controlId: "EHRJ-CTRL-2026-0004",
      exceptionReasonBn: "বিদ্যুৎ সংযোগ মেরামতকালীন সাময়িক বিকল্প",
      scopeBn: "আইটি রুম",
      startDate: "2026-08-01",
      endDate: pastDate, // Already past!
      compensatingControlBn: "ম্যানুয়াল খাতা ব্যবহার",
    },
    ADMIN_ACTOR
  );

  const scanResult = ControlRegisterEngine.scanExpiredExceptions();
  assert(scanResult.expiredCount > 0, "Expired exception correctly detected and transitioned (Section 39)");

  // -------------------------------------------------------------------------
  // GROUP 7: Findings & Verified Closure Invariant
  // -------------------------------------------------------------------------
  console.log("\n--- Group 7: Findings & Verified Closure Invariant ---");
  const newFinding = FindingsActionEngine.createFinding(
    {
      titleBn: "বিদ্যুৎ জেনারেটরের মাসিক জ্বালানি লগ খাতায় ৩ দিনের এন্ট্রি অসম্পূর্ণ",
      descriptionBn: "অপারেশন ব্যাকআপ জেনারেটরের ডিজেল খরচের হিসাবে ৩ দিনের ভাউচার এন্ট্রি রেজিস্টারে ওঠানো হয়নি",
      sourceType: "CONTROL_TEST",
      relatedRiskId: "EHRJ-RISK-2026-0005",
      relatedControlId: "EHRJ-CTRL-2026-0005",
      severity: "MEDIUM",
      ownerName: "মেইনটেন্যান্স ইনচার্জ",
      rootCauseCategory: "PEOPLE",
      rootCauseAnalysisBn: "দায়িত্বপ্রাপ্ত স্টাফের অসুস্থতাজনিত কারণে সাময়িক এন্ট্রি বিলম্ব",
      recommendationBn: "ডিজিটাল স্টক মডিউলে সরাসরি এন্ট্রি দেওয়ার ব্যবস্থা করা",
      dueDate: "2026-10-10",
    },
    ADMIN_ACTOR
  );

  assert(newFinding.id.startsWith("EHRJ-FND-"), "Finding ID generated: " + newFinding.id);
  assert(newFinding.status === "OPEN", "Initial finding status is OPEN");

  // Invariant Test: Finding cannot be closed without verification notes
  let caughtClosureWithoutNotes = false;
  try {
    FindingsActionEngine.verifyAndCloseFinding(newFinding.id, { resolutionNotesBn: "" }, ADMIN_ACTOR);
  } catch {
    caughtClosureWithoutNotes = true;
  }
  assert(caughtClosureWithoutNotes, "Finding closure strictly rejected if resolutionNotesBn is empty (Section 19 Invariant)");

  // Verified Closure by Principal
  const closedFinding = FindingsActionEngine.verifyAndCloseFinding(
    newFinding.id,
    {
      resolutionNotesBn: "অনুপস্থিত ৩ দিনের ভাউচার ও তেলের মাপকাঠি নিরীক্ষা করে শতভাগ সামঞ্জস্য পাওয়া গেছে।",
      evidenceRef: "GEN-LOG-VERIFY-2026-10",
    },
    PRINCIPAL_ACTOR
  );
  assert(closedFinding.status === "CLOSED", "Finding successfully closed after verification");
  assert(closedFinding.verifiedBy === "Muhtamim Principal", "Verified by Principal actor correctly logged");

  // -------------------------------------------------------------------------
  // GROUP 8: CAPA Actions Lifecycle & Overdue Tracking
  // -------------------------------------------------------------------------
  console.log("\n--- Group 8: CAPA Actions Management & Lifecycle ---");
  const newAction = FindingsActionEngine.createAction(
    {
      findingId: newFinding.id,
      actionType: "CORRECTIVE",
      actionDescriptionBn: "জেনারেটর জ্বালানি ব্যয়ের জন্য ডিজিটাল লগ ফরম বাধ্যতামূলক করা",
      assignedTo: "সিস্টেম অ্যাডমিন",
      priority: "MEDIUM",
      dueDate: "2026-10-12",
    },
    ADMIN_ACTOR
  );

  assert(newAction.id.startsWith("EHRJ-ACT-"), "CAPA Action ID generated: " + newAction.id);
  assert(newAction.status === "PLANNED", "Action initially PLANNED");

  // Progress to completed
  const completedAction = FindingsActionEngine.completeAction(
    newAction.id,
    {
      completionNotesBn: "ফর্ম প্রস্তুত ও ব্যবহারকারীদের প্রশিক্ষণ প্রদান সম্পন্ন",
      evidenceRef: "PHASE-16-FORM-READY",
    },
    ADMIN_ACTOR
  );
  assert(completedAction.status === "COMPLETED", "Action transitioned to COMPLETED");

  // Verify Overdue Detection
  const overdueActions = FindingsActionEngine.getOverdueActions();
  assert(Array.isArray(overdueActions), "getOverdueActions returns list of overdue actions without error");

  // -------------------------------------------------------------------------
  // GROUP 9: Governance Review Sessions & Phase 33 Calendar Sync
  // -------------------------------------------------------------------------
  console.log("\n--- Group 9: Governance Reviews & Calendar Synchronization ---");
  const reviewSession = GovernanceReviewEngine.scheduleReview(
    {
      periodTitleBn: "২০২৬ শিক্ষাবর্ষের শরৎকালীন সুশাসন ও অভ্যন্তরীণ নিয়ন্ত্রণ পর্যালোচনা",
      reviewDate: "2026-10-20",
      leadReviewerName: "মুহতামিম ও গভর্নিং বডি সভাপতি",
      leadReviewerRole: "GOVERNING_BODY",
      summaryDecisionsBn: "সকল হিসাব ত্রৈমাসিক এক্সটার্নাল অডিটর দ্বারা সম্পাদন করতে হবে",
    },
    PRINCIPAL_ACTOR
  );

  assert(reviewSession.id.startsWith("EHRJ-REV-"), "Review session ID generated: " + reviewSession.id);
  assert(reviewSession.status === "SCHEDULED", "Review session status is SCHEDULED");

  const syncRes = await GovernanceReviewEngine.syncReviewToPhase33Calendar(reviewSession.id);
  assert(syncRes.success, "Phase 33 Calendar event synchronized successfully");

  // -------------------------------------------------------------------------
  // GROUP 10: Cross-Module Fact-Based Probes
  // -------------------------------------------------------------------------
  console.log("\n--- Group 10: Non-Destructive Cross-Module Governance Probes ---");
  const financeProbe = await GovernanceCrossModuleBridge.probeFinanceAndBudget();
  assert(financeProbe.moduleName.includes("Finance"), "Finance probe returns results for Phase 6 & 41");
  assert(financeProbe.factualChecks.length >= 2, "Finance probe conducted at least 2 factual checks");

  const procProbe = await GovernanceCrossModuleBridge.probeProcurementAndContracts();
  assert(procProbe.moduleName.includes("Procurement"), "Procurement probe returns results for Phase 12 & 40");
  assert(procProbe.factualChecks.length >= 2, "Procurement probe conducted at least 2 factual checks");

  const secProbe = await GovernanceCrossModuleBridge.probeSecurityAndAccess();
  assert(secProbe.moduleName.includes("Security"), "Security probe returns results for Phase 17 & 24");
  assert(secProbe.factualChecks.length >= 2, "Security probe conducted at least 2 factual checks");

  // -------------------------------------------------------------------------
  // GROUP 11: Phase 30 Global Search Integration & Strict RBAC
  // -------------------------------------------------------------------------
  console.log("\n--- Group 11: Phase 30 Universal Search & Strict RBAC Privacy ---");
  const { executeGlobalSearch } = await import("../src/lib/search/globalSearchEngine");
  const searchAdmin = await executeGlobalSearch({
    term: "EHRJ-RISK-2026-0001",
    user: {
      userId: "u1",
      role: "ADMIN",
    },
  });
  assert(searchAdmin.results.length >= 1, "ADMIN can search and find EHRJ-RISK-2026-0001");

  const searchPrincipal = await executeGlobalSearch({
    term: "EHRJ-CTRL-2026-0001",
    user: {
      userId: "u2",
      role: "PRINCIPAL",
    },
  });
  assert(searchPrincipal.results.length >= 1, "PRINCIPAL can search and find EHRJ-CTRL-2026-0001");

  // Strict RBAC: Teacher must NOT get risk/control results
  const searchTeacher = await executeGlobalSearch({
    term: "EHRJ-RISK-2026-0001",
    user: {
      userId: "u3",
      role: "TEACHER",
    },
  });
  const leakedToTeacher = searchTeacher.results.filter(
    (r) => r.entityType === "RISK" || r.entityType === "CONTROL"
  );
  assert(leakedToTeacher.length === 0, "TEACHER cannot see risk/control governance records (Strict RBAC preserved)");

  // Strict RBAC: Guardian must NOT get risk/control results
  const searchGuardian = await executeGlobalSearch({
    term: "EHRJ-RISK-2026-0001",
    user: {
      userId: "u4",
      role: "GUARDIAN",
    },
  });
  const leakedToGuardian = searchGuardian.results.filter(
    (r) => r.entityType === "RISK" || r.entityType === "CONTROL"
  );
  assert(leakedToGuardian.length === 0, "GUARDIAN cannot see risk/control governance records (Strict RBAC preserved)");

  // -------------------------------------------------------------------------
  // GROUP 12: 12 Institutional Governance Report Types
  // -------------------------------------------------------------------------
  console.log("\n--- Group 12: 12 Institutional Governance Reports Generation ---");
  const reportTypes = [
    "RISK_REGISTER",
    "RISK_ASSESSMENT",
    "CONTROL_REGISTER",
    "CONTROL_EFFECTIVENESS",
    "FINDINGS_REPORT",
    "CORRECTIVE_ACTION",
    "OVERDUE_ACTIONS",
    "EXCEPTIONS_REPORT",
    "GOVERNANCE_REVIEW",
    "MANAGEMENT_ASSURANCE",
    "RISK_TREND",
    "CONTROL_GAP",
  ] as const;

  for (const repType of reportTypes) {
    const rep = GovernanceCrossModuleBridge.generateInstitutionalReport(repType);
    assert(rep.reportType === repType, `Report generated: ${repType}`);
    assert(!!rep.generatedAt && rep.data !== undefined, `Report ${repType} has valid structure & payload`);
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log("\n===============================================================================");
  console.log(`  PHASE 42 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error("Test execution aborted with error:", err);
  process.exit(1);
});
