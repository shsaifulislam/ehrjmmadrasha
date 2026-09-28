/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 20
 * Automated Continuous Improvement & Governance Test Suite
 * 
 * Verifies:
 * 1. Change Request Registration & Objective Risk Calculation
 * 2. Cross-Module Dependency Impact Analysis
 * 3. Change Request Lifecycle Transitions (Request -> Review -> Implement -> Verify)
 * 4. Live Data Quality & Ledger Integrity Audit
 * 5. Authoritative Metric Dictionary (Single Source of Truth)
 * 6. Technical Debt Register Operations
 * 7. Periodic Multi-Persona Access Review & Privileged Account Audit
 * 8. Governance API Endpoints & Role-Based Security
 */

import { prisma } from "../src/lib/prisma";
import { createSessionToken } from "../src/lib/auth";
import {
  registerChangeRequest,
  reviewChangeRequest,
  updateChangeImplementation,
  verifyChangeRequest,
  listChangeRequests,
  analyzeChangeImpact,
  runDataQualityAudit,
  getAuthoritativeMetrics,
  listTechnicalDebt,
  registerTechnicalDebt,
  performPeriodicAccessReview,
  getMasterGovernanceSummary,
} from "../src/lib/governanceEngine";

const BASE_URL = process.env.TEST_APP_URL || "http://localhost:3000";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✔ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ✘ FAIL: ${message}`);
    failedCount++;
  }
}

async function runPhase20GovernanceSuite() {
  console.log("==================================================================");
  console.log("  PHASE 20 — PRODUCT GOVERNANCE, CHANGE MANAGEMENT & EVOLUTION   ");
  console.log(`  Target Server: ${BASE_URL}`);
  console.log("==================================================================");

  // -------------------------------------------------------------------
  // 1. RESOLVE AUTHORITY & TEST ADMIN USER
  // -------------------------------------------------------------------
  console.log("\n[STEP 1] Resolving administrative authority and session...");
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    include: { sessions: { where: { expiresAt: { gt: new Date() } } } },
  });

  assert(Boolean(adminUser), `Admin user identified: ${adminUser?.name || "Unknown"}`);
  const adminSessionToken = await createSessionToken({
    userId: adminUser!.id,
    username: adminUser!.username,
    role: adminUser!.role,
    email: adminUser!.email,
    name: adminUser!.name,
  });
  assert(Boolean(adminSessionToken), `Active administrative session established: ${adminSessionToken.slice(0, 15)}...`);

  // -------------------------------------------------------------------
  // 2. DEPENDENCY IMPACT ANALYSIS ENGINE
  // -------------------------------------------------------------------
  console.log("\n[STEP 2] Testing Cross-Module Dependency Impact Analysis...");
  
  // Test A: Emergency auth change -> must be CRITICAL
  const criticalImpact = analyzeChangeImpact(["AUTHENTICATION"], "EMERGENCY", true);
  assert(criticalImpact.riskCalculated === "CRITICAL", "Emergency authentication change correctly classified as CRITICAL risk");
  assert(criticalImpact.securityImpact === true, "Security impact flag correctly detected for Auth module");

  // Test B: Multi-module change with Finance -> must be HIGH or CRITICAL
  const financeImpact = analyzeChangeImpact(["STUDENTS", "FINANCE"], "ENHANCEMENT", true);
  assert(financeImpact.riskCalculated === "HIGH" || financeImpact.riskCalculated === "CRITICAL", "Multi-module database change with Finance classified as HIGH/CRITICAL");
  assert(financeImpact.financialImpact === true, "Financial impact flag correctly identified");
  assert(financeImpact.directDependencies.length > 0, `Direct dependencies successfully resolved: ${financeImpact.directDependencies.join(", ")}`);

  // Test C: Cosmetic single module change -> must be LOW or MEDIUM
  const lowImpact = analyzeChangeImpact(["DOCUMENTS"], "ENHANCEMENT", false);
  assert(lowImpact.riskCalculated === "LOW" || lowImpact.riskCalculated === "MEDIUM", "Cosmetic single-module change classified as LOW/MEDIUM risk");

  // -------------------------------------------------------------------
  // 3. CHANGE REQUEST REGISTRATION & LIFECYCLE
  // -------------------------------------------------------------------
  console.log("\n[STEP 3] Testing Change Request Registration & State Transitions...");
  const uniqueTag = Date.now().toString().slice(-4);
  const newChange = await registerChangeRequest({
    title: `স্বয়ংক্রিয় পরীক্ষার ফলাফল এসএমএস বিজ্ঞপ্তি সিস্টেম (${uniqueTag})`,
    requesterName: adminUser?.name || "অ্যাডমিন",
    requesterRole: "ADMIN",
    objective: "পরীক্ষার চূড়ান্ত ফলাফল প্রকাশের সাথে সাথে অভিভাবকদের মোবাইলে এসএমএস প্রেরণ।",
    businessJustification: "অভিভাবকদের রিয়েল-টাইম তথ্যপ্রাপ্তি নিশ্চিতকরণ।",
    affectedModules: ["EXAMS", "NOTIFICATIONS"],
    changeType: "FEATURE",
    priority: "HIGH",
    databaseImpact: false,
    rollbackPlan: "রিলিজ ট্যাগ রোলব্যাক এবং এসএমএস কিউ নিষ্ক্রিয়করণ।",
    adminUserId: adminUser?.id,
  });

  assert(Boolean(newChange.changeId.startsWith("EHRJ-CHG-")), `Change Request registered with canonical code: ${newChange.changeId}`);
  assert(newChange.status === "REQUESTED", "Initial lifecycle status is REQUESTED");
  assert(newChange.risk === "MEDIUM" || newChange.risk === "HIGH", `Calculated risk tier: ${newChange.risk}`);

  // Transition A: Review & Approve
  const approvedChange = await reviewChangeRequest({
    changeId: newChange.changeId,
    reviewerName: "প্রধান অ্যাডমিন (অপারেশনাল)",
    decision: "APPROVED",
    reviewNotes: "আর্কিটেকচারাল ইমপ্যাক্ট বিশ্লেষণ সন্তোষজনক। রিলিজ অনুমোদন করা হলো।",
    adminUserId: adminUser?.id,
  });
  assert(approvedChange.status === "APPROVED", "Transitioned to APPROVED status");
  assert(Boolean(approvedChange.reviewedAt), "Review timestamp recorded");

  // Transition B: Implementation Update
  const implementedChange = await updateChangeImplementation({
    changeId: newChange.changeId,
    commitHash: "c0ffee1",
    implementationDetails: "Notification outbox listener bound to exam publication event.",
  });
  assert(implementedChange.status === "IMPLEMENTED", "Transitioned to IMPLEMENTED status");
  assert(implementedChange.commitHash === "c0ffee1", "Git commit hash linked to change record");

  // Transition C: Evidence-based Verification
  const verifiedChange = await verifyChangeRequest({
    changeId: newChange.changeId,
    verifierName: "Senior QA Architect",
    verificationEvidence: "All 5 automated exam publication tests passed cleanly. SMS payload validated.",
  });
  assert(verifiedChange.status === "VERIFIED", "Transitioned to VERIFIED status with empirical evidence");
  assert(Boolean(verifiedChange.verificationEvidence), "Verification evidence successfully stored");

  // -------------------------------------------------------------------
  // 4. DATA QUALITY & LEDGER INTEGRITY AUDIT
  // -------------------------------------------------------------------
  console.log("\n[STEP 4] Executing Live Data Quality & Ledger Integrity Audit...");
  const dataQualityReport = await runDataQualityAudit();

  assert(dataQualityReport.totalChecksConducted >= 5, `All ${dataQualityReport.totalChecksConducted} integrity checks conducted`);
  assert(dataQualityReport.summary.totalStudentsScanned > 0, `Scanned active students: ${dataQualityReport.summary.totalStudentsScanned}`);
  assert(dataQualityReport.summary.totalInvoicesAudited > 0, `Scanned total fee invoices: ${dataQualityReport.summary.totalInvoicesAudited}`);
  assert(dataQualityReport.summary.arithmeticDisparityCount === 0, "Arithmetic Invariant: 0 fee invoice balance disparities found");
  assert(dataQualityReport.summary.negativeFundCount === 0, "Financial Invariant: 0 unauthorized negative cash funds found");
  assert(dataQualityReport.summary.orphanEnrollmentCount === 0, "Relational Invariant: 0 orphan student enrollments found");

  // -------------------------------------------------------------------
  // 5. AUTHORITATIVE METRIC DICTIONARY
  // -------------------------------------------------------------------
  console.log("\n[STEP 5] Querying Authoritative Metric Dictionary (Single Source of Truth)...");
  const metrics = await getAuthoritativeMetrics();

  assert(Boolean(metrics.ACTIVE_STUDENTS), "ACTIVE_STUDENTS metric definition exists");
  assert(typeof metrics.ACTIVE_STUDENTS.currentValue === "number" && metrics.ACTIVE_STUDENTS.currentValue > 0, `Active students count authoritative: ${metrics.ACTIVE_STUDENTS.currentValue}`);
  assert(Boolean(metrics.ACTIVE_GUARDIANS), "ACTIVE_GUARDIANS metric definition exists");
  assert(Boolean(metrics.FEE_COLLECTION_EFFICIENCY), "FEE_COLLECTION_EFFICIENCY metric definition exists");
  assert(Boolean(metrics.CASH_FUNDS_LIQUIDITY), `CASH_FUNDS_LIQUIDITY authoritative balance: ${metrics.CASH_FUNDS_LIQUIDITY.currentValue}`);
  assert(Boolean(metrics.DISASTER_RECOVERY_RTO), `DISASTER_RECOVERY_RTO metric present: ${metrics.DISASTER_RECOVERY_RTO.currentValue}`);

  // -------------------------------------------------------------------
  // 6. TECHNICAL DEBT REGISTER
  // -------------------------------------------------------------------
  console.log("\n[STEP 6] Testing Technical Debt Register & Operations...");
  const debtItems = listTechnicalDebt();
  assert(debtItems.length >= 3, `Initial technical debt catalog tracked (${debtItems.length} items)`);
  assert(debtItems.some((d) => d.debtId === "EHRJ-DEBT-001"), "EHRJ-DEBT-001 (Biometric Integration) tracked");

  const newDebt = registerTechnicalDebt({
    module: "REPORTS",
    title: "Excel Generation Memory Optimization for Large Batches",
    risk: "LOW",
    impact: "Large batch downloads of 1000+ rows consume temporary heap memory.",
    workaround: "Paginated export chunks of 200 rows.",
    priority: "LOW",
    plannedResolution: "Phase 22 streaming CSV/Excel worker.",
    status: "OPEN",
  });
  assert(Boolean(newDebt.debtId), `New technical debt registered: ${newDebt.debtId} - ${newDebt.title}`);

  // -------------------------------------------------------------------
  // 7. MULTI-PERSONA ACCESS REVIEW
  // -------------------------------------------------------------------
  console.log("\n[STEP 7] Performing Periodic Multi-Persona Access Review...");
  const accessReport = await performPeriodicAccessReview();

  assert(accessReport.totalUsersAudited > 0, `Total system users audited: ${accessReport.totalUsersAudited}`);
  assert(accessReport.usersByRole.ADMIN > 0, `Active Admin accounts: ${accessReport.usersByRole.ADMIN}`);
  assert(accessReport.privilegedUsers.length <= 15, `Privileged accounts count under strict institutional threshold (${accessReport.privilegedUsers.length} accounts <= 15)`);
  assert(accessReport.healthAssessment === "OPTIMAL" || accessReport.healthAssessment === "ACTION_REQUIRED", `Access health assessment: ${accessReport.healthAssessment}`);

  // -------------------------------------------------------------------
  // 8. MASTER SUMMARY & API SMOKE TESTS
  // -------------------------------------------------------------------
  console.log("\n[STEP 8] Performing HTTP Smoke Tests on Governance Endpoints...");
  
  // A. Public / Unauthenticated access to Governance API -> MUST BE 403 Forbidden
  const unauthRes = await fetch(`${BASE_URL}/api/admin/governance`);
  assert(unauthRes.status === 403, `Security Check: Anonymous access rejected with HTTP ${unauthRes.status} Forbidden`);

  // B. Authenticated Admin access to Governance Summary -> 200 OK
  const authRes = await fetch(`${BASE_URL}/api/admin/governance`, {
    headers: { Cookie: `ehrj_session_token=${adminSessionToken}` },
  });
  assert(authRes.status === 200, `Admin Check: Authenticated query returned HTTP ${authRes.status} OK`);
  const authJson = await authRes.json();
  assert(authJson.success === true, "Governance API returned success=true payload");
  assert(Boolean(authJson.summary?.authoritativeMetrics), "Payload contains authoritative metrics dictionary");

  // C. Authenticated Data Quality API -> 200 OK
  const dqRes = await fetch(`${BASE_URL}/api/admin/governance/data-quality`, {
    headers: { Cookie: `ehrj_session_token=${adminSessionToken}` },
  });
  assert(dqRes.status === 200, `Admin Check: Live Data Quality API returned HTTP ${dqRes.status} OK`);

  console.log("\n==================================================================");
  console.log(`  PHASE 20 GOVERNANCE & EVOLUTION: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("==================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase20GovernanceSuite().catch((err) => {
  console.error("FATAL: Phase 20 test runner encountered an unhandled exception:", err);
  process.exit(1);
});
