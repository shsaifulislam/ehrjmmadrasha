/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 38
 * Domain Unit, Integration, Governance, and Security Test Suite
 * 
 * Checkpoint: EHRJ-AI-2026-PHASE38
 */

import {
  getAllDocuments,
  getDocumentById,
  saveDocument,
  transitionDocumentStatus,
  calculateNextVersion,
  createNewDocumentVersion,
  getEffectivePolicyOnDate,
  toggleLegalHold,
  compareDocumentVersions,
  submitDocumentForReview,
  processApprovalDecision,
  getDocumentApprovalHistory,
  recordUserAcknowledgement,
  hasUserAcknowledged,
  getPendingAcknowledgementsForUser,
  getAcknowledgementMetrics,
  detectPolicyConflicts,
  resolvePolicyConflict,
  validateSOPSteps,
  updateDocumentSOPSteps,
  recordException,
  getAllExceptions,
  syncPoliciesToPhase22RAG,
  getGovernanceStats,
} from "../src/lib/policies";

async function runTestSuite() {
  console.log("=========================================================");
  console.log("  EHRJ MADRASHA ERP — PHASE 38 GOVERNANCE TEST SUITE     ");
  console.log("=========================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, title: string) {
    if (condition) {
      console.log(`[PASS] ${title}`);
      passed++;
    } else {
      console.error(`[FAIL] ${title}`);
      failed++;
    }
  }

  // 1. Initial Seeding Verification
  const docs = getAllDocuments();
  assert(docs.length >= 8, `Store loaded ${docs.length} seed documents (minimum 8 expected)`);

  const admDoc = getDocumentById("EHRJ-POL-2026-ADM001");
  assert(!!admDoc, "Admission Policy v2.1 found in store");
  assert(admDoc?.status === "EFFECTIVE", "Admission policy status is EFFECTIVE");
  assert(admDoc?.currentVersion === "v2.1", "Admission policy current version is v2.1");

  const thfSop = getDocumentById("EHRJ-SOP-2026-THF001");
  assert(!!thfSop, "Tahfeez Sabaq/Manzil SOP found in store");
  assert(thfSop?.documentType === "SOP", "Document type is SOP");
  assert((thfSop?.sopSteps?.length || 0) >= 3, `SOP has ${thfSop?.sopSteps?.length} operational steps`);

  const hbkDoc = getDocumentById("EHRJ-HBK-2026-GUA001");
  assert(!!hbkDoc, "Guardian Handbook found in store");
  assert((hbkDoc?.handbookSections?.length || 0) >= 6, `Handbook has ${hbkDoc?.handbookSections?.length} sections in Table of Contents`);

  // 2. Version Calculation
  assert(calculateNextVersion("v1.0", false) === "v1.1", "Minor increment of v1.0 gives v1.1");
  assert(calculateNextVersion("v1.2", false) === "v1.3", "Minor increment of v1.2 gives v1.3");
  assert(calculateNextVersion("v1.3", true) === "v2.0", "Major increment of v1.3 gives v2.0");
  assert(calculateNextVersion("v2.5", true) === "v3.0", "Major increment of v2.5 gives v3.0");

  // 3. Status Transitions & State Machine
  const testDocId = "EHRJ-POL-TEST-001";
  const dummyDoc = {
    ...admDoc!,
    id: testDocId,
    documentCode: testDocId,
    titleBn: "টেস্ট পলিসি",
    status: "DRAFT" as const,
    currentVersion: "v1.0",
    isLegalHoldActive: false,
    versions: [
      {
        version: "v1.0",
        versionNotes: "খসড়া",
        isMajor: true,
        status: "DRAFT" as const,
        contentText: "টেস্ট",
        contentMarkdown: "টেস্ট",
        checksum: "abc",
        createdBy: "Admin",
        createdAt: new Date().toISOString(),
        effectiveFrom: "2026-01-01",
      },
    ],
  };
  saveDocument(dummyDoc);

  // Invalid transition: DRAFT cannot jump directly to PUBLISHED or EFFECTIVE
  const invalidRes = transitionDocumentStatus(testDocId, "PUBLISHED", {
    id: "admin-1",
    name: "Admin",
    role: "ADMIN",
  });
  assert(!invalidRes.success, "Invalid state transition DRAFT -> PUBLISHED rejected correctly");

  // Valid transition: DRAFT -> UNDER_REVIEW
  const reviewRes = submitDocumentForReview({
    documentIdOrCode: testDocId,
    submitter: { id: "admin-1", name: "Admin", role: "ADMIN" },
    notes: "Review requested",
  });
  assert(reviewRes.success, "Draft submitted for review successfully");
  assert(reviewRes.document?.status === "UNDER_REVIEW", "Document status transitioned to UNDER_REVIEW");

  // Approval Process: Principal reviews and approves
  const approvalRes = processApprovalDecision({
    documentIdOrCode: testDocId,
    decision: "APPROVED",
    reviewer: { id: "pr-01", name: "মাওলানা আব্দুল করিম (প্রিন্সিপাল)", role: "PRINCIPAL" },
    notes: "গভর্নিং বডির সিদ্ধান্ত অনুযায়ী অনুমোদিত।",
  });
  assert(approvalRes.success, "Principal approved the document successfully");
  assert(approvalRes.document?.status === "APPROVED", "Document status transitioned to APPROVED");
  assert(!!approvalRes.approvalRecord?.auditRef, "Approval audit reference generated");

  // Transition APPROVED -> PUBLISHED
  const pubRes = transitionDocumentStatus(testDocId, "PUBLISHED", {
    id: "admin-1",
    name: "Admin",
    role: "ADMIN",
  });
  assert(pubRes.success, "Document successfully transitioned to PUBLISHED");

  // Transition PUBLISHED -> EFFECTIVE
  const effRes = transitionDocumentStatus(testDocId, "EFFECTIVE", {
    id: "admin-1",
    name: "Admin",
    role: "ADMIN",
  });
  assert(effRes.success, "Document successfully transitioned to EFFECTIVE");

  // 4. Legal Hold Protection
  const holdRes = toggleLegalHold(testDocId, {
    isHoldActive: true,
    reason: "আইনি তদন্তাধীন থাকায় স্থগিত",
    authority: "জেলা আদালত ও ট্রাস্টি বোর্ড",
    actor: { id: "admin-1", name: "Admin", role: "ADMIN" },
  });
  assert(holdRes.success, "Legal Hold activated successfully");
  assert(holdRes.document?.isLegalHoldActive === true, "Document reflects isLegalHoldActive: true");

  // Attempting to archive a document under legal hold must fail
  const blockedArchive = transitionDocumentStatus(testDocId, "ARCHIVED", {
    id: "admin-1",
    name: "Admin",
    role: "ADMIN",
  });
  assert(!blockedArchive.success, "Archive transition blocked when Legal Hold is active");

  // Release legal hold
  toggleLegalHold(testDocId, {
    isHoldActive: false,
    actor: { id: "admin-1", name: "Admin", role: "ADMIN" },
  });
  assert(getDocumentById(testDocId)?.isLegalHoldActive === false, "Legal Hold released successfully");

  // 5. Immutable Historical Versions
  const newVerRes = createNewDocumentVersion(testDocId, {
    isMajor: false,
    versionNotes: "কওমি কিতাব বিভাগে নতুন জামাত সংযোজন",
    newContentText: "সংশোধিত পাঠ্য",
    actor: { id: "admin-1", name: "Admin", role: "ADMIN" },
  });
  assert(newVerRes.success, "New minor version created successfully");
  assert(newVerRes.newVersion === "v1.1", "Calculated new version is v1.1");
  assert(newVerRes.document?.status === "DRAFT", "New version starts in DRAFT status");
  assert(newVerRes.document?.versions.length === 2, "Historical v1.0 retained in versions array");

  // Compare versions
  const diffRes = compareDocumentVersions(testDocId, "v1.0", "v1.1");
  assert(diffRes.success, "Document versions v1.0 and v1.1 compared successfully");
  assert(diffRes.changesSummary.linesAdded >= 0, "Diff engine returned added lines metric");

  // 6. Historical Effective-Date Engine Resolution
  // EHRJ-POL-2026-ADM001 has v2.0 (effective 2026-01-05 to 2026-01-09) and v2.1 (effective from 2026-01-10)
  const queryJan6 = getEffectivePolicyOnDate("EHRJ-POL-2026-ADM001", "2026-01-06");
  assert(queryJan6.success, "Historical query for 2026-01-06 succeeded");
  assert(queryJan6.resolvedVersion?.version === "v2.0", `Resolved version for 2026-01-06 is v2.0 (got ${queryJan6.resolvedVersion?.version})`);
  assert(queryJan6.isHistorical === true, "Resolved version correctly identified as historical");

  const queryCurrent = getEffectivePolicyOnDate("EHRJ-POL-2026-ADM001", "2026-05-15");
  assert(queryCurrent.success, "Effective date query for 2026-05-15 succeeded");
  assert(queryCurrent.resolvedVersion?.version === "v2.1", `Resolved version for 2026-05-15 is current v2.1 (got ${queryCurrent.resolvedVersion?.version})`);

  const queryHistorical2025 = getEffectivePolicyOnDate("EHRJ-POL-2025-ADM000", "2025-06-01");
  assert(queryHistorical2025.success, "Historical policy 2025 resolution succeeded");
  assert(queryHistorical2025.resolvedVersion?.version === "v1.0", "Resolved 2025 version is v1.0");

  const queryTooEarly = getEffectivePolicyOnDate("EHRJ-POL-2026-ADM001", "2020-01-01");
  assert(!queryTooEarly.success, "Querying date prior to policy inception returns not found");

  // 7. Policy Acknowledgements & Compliance
  const ackRes = recordUserAcknowledgement({
    documentIdOrCode: "EHRJ-POL-2026-TCH001",
    version: "v1.1",
    user: {
      id: "usr-tch-007",
      name: "মুফতি মাহমুদুল হাসান",
      role: "TEACHER",
    },
    deviceMetadata: { userAgent: "PortalBrowser/Chrome", ipAddress: "10.0.0.12" },
  });
  assert(ackRes.success, "Teacher acknowledgement recorded successfully");
  assert(
    hasUserAcknowledged("usr-tch-007", "EHRJ-POL-2026-TCH001", "v1.1"),
    "hasUserAcknowledged returns true for recorded teacher"
  );
  assert(
    !hasUserAcknowledged("usr-tch-unknown", "EHRJ-POL-2026-TCH001", "v1.1"),
    "hasUserAcknowledged returns false for unacknowledged user"
  );

  const pendingAcks = getPendingAcknowledgementsForUser("usr-tch-007", "TEACHER");
  assert(Array.isArray(pendingAcks.pendingDocuments), "getPendingAcknowledgementsForUser returns pending list");
  assert(Array.isArray(pendingAcks.completedDocuments), "getPendingAcknowledgementsForUser returns completed list");

  const metrics = getAcknowledgementMetrics("EHRJ-POL-2026-TCH001");
  assert(metrics.totalAcknowledged >= 1, `Compliance metrics tracked ${metrics.totalAcknowledged} acknowledgements`);

  // 8. Policy Conflict Detection
  const conflicts = detectPolicyConflicts();
  assert(Array.isArray(conflicts), `Conflict engine scanned and returned ${conflicts.length} conflict candidates`);

  // Test resolving a conflict if any
  if (conflicts.length > 0) {
    const cId = conflicts[0].id;
    const res = resolvePolicyConflict(cId, "REVIEWED", { id: "adm-1", name: "Admin", role: "ADMIN" }, "যাচাইকৃত");
    assert(res.success, `Conflict ${cId} resolved to REVIEWED`);
  } else {
    assert(true, "No initial structural conflicts found");
  }

  // 9. SOP Engine Validation
  const validSOP = validateSOPSteps([
    {
      stepNumber: 1,
      titleBn: "পদক্ষেপ ১",
      titleEn: "Step 1",
      description: "বিবরণ",
      responsibleRole: "TEACHER",
    },
    {
      stepNumber: 2,
      titleBn: "পদক্ষেপ ২",
      titleEn: "Step 2",
      description: "বিবরণ",
      responsibleRole: "ADMIN",
    },
  ]);
  assert(validSOP.isValid, "Valid SOP steps passed validation");

  const invalidSOP = validateSOPSteps([
    {
      stepNumber: 1,
      titleBn: "",
      titleEn: "No Bengali Title",
      description: "Missing title",
      responsibleRole: "TEACHER",
    },
  ]);
  assert(!invalidSOP.isValid, "SOP with missing Bengali title failed validation as expected");

  // 10. Policy Exceptions Management
  const excId = `EHRJ-EXC-2026-TEST`;
  recordException({
    id: excId,
    documentId: "EHRJ-POL-2026-ADM001",
    documentCode: "EHRJ-POL-2026-ADM001",
    version: "v2.1",
    subject: "বয়স ছাড় অনুমোদন",
    reason: "বিশেষ কুরআনি মেধা",
    approvedBy: "মাওলানা আব্দুল করিম (প্রিন্সিপাল)",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    scope: "ছাত্র কোড STD-2026-099",
    conditions: "নিয়মিত পাঠ প্রস্তুতি",
    status: "ACTIVE",
    auditRef: "AUD-EXC-TEST",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const allExc = getAllExceptions();
  assert(allExc.some((e) => e.id === excId), "Authorized policy exception saved and retrievable");

  // 11. Phase 22 RAG Sync Bridge
  const syncRes = syncPoliciesToPhase22RAG();
  assert(syncRes.syncedCount >= 5, `Phase 22 RAG sync synced ${syncRes.syncedCount} approved/effective policies`);
  assert(syncRes.skippedDraftsCount >= 1, `Phase 22 RAG sync skipped ${syncRes.skippedDraftsCount} drafts/unapproved documents`);

  // 12. Dashboard Stats Integrity
  const govStats = getGovernanceStats();
  assert(govStats.totalDocuments >= 8, `Governance dashboard stats totalDocs: ${govStats.totalDocuments}`);
  assert(govStats.effectiveDocuments >= 4, `Governance dashboard stats effectiveDocs: ${govStats.effectiveDocuments}`);

  // 13. Invariant: NO SMS
  const fs = require("fs");
  const path = require("path");
  const policiesDir = path.join(process.cwd(), "src", "lib", "policies");
  const files = fs.readdirSync(policiesDir);
  let smsFound = false;
  for (const f of files) {
    const content = fs.readFileSync(path.join(policiesDir, f), "utf8");
    if (/sendSms|smsGateway|twilio|greenweb|onnorokom/i.test(content)) {
      smsFound = true;
      break;
    }
  }
  assert(!smsFound, "STRICT INVARIANT: No SMS services or endpoints in policies engine");

  console.log("\n=========================================================");
  console.log(`  PHASE 38 TEST RESULTS: ${passed} PASSED, ${failed} FAILED `);
  console.log("=========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
