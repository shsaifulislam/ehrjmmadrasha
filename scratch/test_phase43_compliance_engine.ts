/**
 * Phase 43 Automated Test Suite
 * Institutional Compliance Obligation, Requirement Tracking & Compliance Assurance Engine
 * Checkpoint: EHRJ-AI-2026-PHASE43
 */

import {
  ComplianceStore,
  RequirementRegisterEngine,
  ObligationEngine,
  EvidenceVerificationEngine,
  ComplianceReviewEngine,
  ComplianceCrossModuleBridge,
  ActorContext,
} from "../src/lib/compliance";
import { executeGlobalSearch } from "../src/lib/search/globalSearchEngine";

const adminActor: ActorContext = {
  userId: "ADMIN-01",
  userName: "অ্যাডমিনিস্ট্রেটর",
  userRole: "ADMIN",
};

const principalActor: ActorContext = {
  userId: "EMP-0001",
  userName: "মুহতামিম / অধ্যক্ষ সাহেব",
  userRole: "PRINCIPAL",
};

const teacherActor: ActorContext = {
  userId: "EMP-0012",
  userName: "মাওলানা মোহাম্মদ রফিক",
  userRole: "TEACHER",
};

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log("\n============================================================");
  console.log("Running Phase 43 Compliance Engine Test Suite...");
  console.log("============================================================\n");

  // ------------------------------------------------------------------------
  // GROUP 1: Requirement Register & Versioning
  // ------------------------------------------------------------------------
  console.log("Group 1: Requirement Register & Versioning");
  const req = RequirementRegisterEngine.createRequirement(
    {
      title: "বাংলাদেশ মাদ্রাসা শিক্ষা বোর্ড বার্ষিক পাঠদান অনুমতি নবায়ন",
      description: "২০২৬ শিক্ষাবর্ষের স্বীকৃতি ও পাঠদান অনুমতি নবায়নের আবেদন বোর্ড সমীপে দাখিল।",
      source: "AUTHORITY",
      sourceReference: "BMEB/Renewal/2026/08",
      jurisdiction: "বাংলাদেশ মাদ্রাসা শিক্ষা বোর্ড (ঢাকা)",
      category: "ACADEMIC_CURRICULUM",
      applicabilityScope: "INSTITUTION_WIDE",
      effectiveDate: "2026-01-01",
      reviewDate: "2026-12-31",
      isLegallyMandatedVerified: true,
      authoritativeSourceRef: "বোর্ড স্বীকৃতি বিধিমালা ২০২৪",
    },
    adminActor
  );

  assert(
    req.id.startsWith("EHRJ-REQ-CMP-") && req.id.includes("-2026-"),
    `Requirement ID generated conforming to format: ${req.id}`
  );
  assert(req.version === 1, "Requirement initial version is 1");
  assert(req.status === "ACTIVE", "Requirement status is ACTIVE");
  assert(req.isApplicable === true, "Requirement is initially applicable");

  // Update requirement with major change (increments version)
  const updatedReq = RequirementRegisterEngine.updateRequirement(
    req.id,
    { title: "বাংলাদেশ মাদ্রাসা শিক্ষা বোর্ড বার্ষিক পাঠদান ও দাখিল অনুমতি নবায়ন (সংশোধিত)" },
    adminActor,
    true
  );
  assert(updatedReq.version === 2, `Major update increments version to 2 (v${updatedReq.version})`);

  // ------------------------------------------------------------------------
  // GROUP 2: Section 9 & 40 Applicability Controls (Anti-Silent Exclusion)
  // ------------------------------------------------------------------------
  console.log("\nGroup 2: Section 9 & 40 Applicability Controls (Anti-Silent Exclusion)");
  let blockedEmptyReason = false;
  try {
    RequirementRegisterEngine.updateApplicability(
      req.id,
      false,
      { reason: "", reviewer: "অধ্যক্ষ সাহেব" },
      adminActor
    );
  } catch (err: any) {
    blockedEmptyReason = true;
  }
  assert(blockedEmptyReason, "Applicability change rejected without mandatory reason");

  const nonApplicableReq = RequirementRegisterEngine.updateApplicability(
    req.id,
    false,
    {
      reason: "শুধুমাত্র কারিগরি শাখার জন্য প্রযোজ্য হওয়ায় সাধারণ শাখায় রেয়াত প্রদান।",
      reviewer: "মুহতামিম / অধ্যক্ষ সাহেব",
      evidenceRef: "DOC-BOARD-RES-2026-01",
    },
    adminActor
  );
  assert(nonApplicableReq.isApplicable === false, "Requirement successfully marked not applicable");
  assert(
    nonApplicableReq.applicabilityReason?.includes("কারিগরি শাখার জন্য"),
    "Applicability documented reason preserved"
  );

  // Restore applicability
  RequirementRegisterEngine.updateApplicability(
    req.id,
    true,
    { reason: "পুনরায় সমগ্র মাদরাসায় প্রযোজ্য ঘোষণা", reviewer: "মুহতামিম / অধ্যক্ষ সাহেব" },
    adminActor
  );

  // ------------------------------------------------------------------------
  // GROUP 3: Compliance Obligations Lifecycle & Tracking
  // ------------------------------------------------------------------------
  console.log("\nGroup 3: Compliance Obligations Lifecycle & Tracking");
  const obl = ObligationEngine.createObligation(
    {
      requirementId: req.id,
      title: "বোর্ড স্বীকৃতি নবায়ন ফি জমাদান ও চালান স্লিপ সংরক্ষণ",
      description: "সোনালী ব্যাংকে বোর্ড ফি জমা দিয়ে চালানের স্ক্যান কপি সংরক্ষণ করা।",
      ownerId: "EMP-0012",
      ownerName: "মাওলানা মোহাম্মদ রফিক",
      ownerRole: "সহকারী প্রধান শিক্ষক",
      reviewerId: "EMP-0001",
      reviewerName: "মুহতামিম / অধ্যক্ষ সাহেব",
      responsibilityType: "RESPONSIBLE",
      frequency: "ANNUAL",
      startDate: "2026-01-01",
      dueDate: "2026-04-30",
      deadlineSource: "বোর্ড প্রজ্ঞাপন সময়সীমা",
    },
    adminActor
  );

  assert(
    obl.id.startsWith("EHRJ-COMP-") && obl.id.includes("-2026-"),
    `Obligation ID generated conforming to format: ${obl.id}`
  );
  assert(obl.status === "NOT_STARTED", "Obligation starts in NOT_STARTED status");

  // Progress obligation to IN_PROGRESS
  const inProgressObl = ObligationEngine.updateObligationStatus(
    obl.id,
    "IN_PROGRESS",
    "চালান ফর্ম পূরণ চলছে",
    adminActor
  );
  assert(inProgressObl.status === "IN_PROGRESS", "Obligation progresses to IN_PROGRESS");

  // Reassign owner
  const reassignedObl = ObligationEngine.assignOwner(
    obl.id,
    {
      ownerId: "EMP-0005",
      ownerName: "মুহাম্মদ আব্দুল্লাহ",
      ownerRole: "প্রধান হিসাবরক্ষক",
    },
    adminActor
  );
  assert(reassignedObl.ownerName === "মুহাম্মদ আব্দুল্লাহ", "Obligation owner successfully reassigned");

  // ------------------------------------------------------------------------
  // GROUP 4: Evidence Management & Human Verification Gate (Section 15)
  // ------------------------------------------------------------------------
  console.log("\nGroup 4: Evidence Management & Human Verification Gate (Section 15)");
  const evd = EvidenceVerificationEngine.recordEvidence(
    {
      obligationId: obl.id,
      title: "সোনালী ব্যাংক চালান রশিদ - পাঠদান নবায়ন ফি",
      source: "সোনালী ব্যাংক পিএলসি, ইলিয়টগঞ্জ শাখা",
      evidenceType: "SUBMISSION_RECEIPT",
      fileToken: "DOC-EVD-2026-CHALAN-0012",
      expiryDate: "2026-12-31",
    },
    teacherActor
  );

  assert(
    evd.id.startsWith("EHRJ-EVD-CMP-"),
    `Evidence ID conforms to format: ${evd.id}`
  );
  assert(evd.verificationStatus === "PENDING", "Evidence initial status is PENDING");
  assert(Boolean(evd.hash), `Evidence SHA-256 cryptographic hash generated: ${evd.hash?.slice(0, 16)}...`);

  // Unauthorized verification attempt
  let blockedTeacherVerify = false;
  try {
    EvidenceVerificationEngine.verifyEvidence(
      evd.id,
      "VERIFIED",
      "শিক্ষক কর্তৃক যাচাই",
      teacherActor
    );
  } catch (err) {
    blockedTeacherVerify = true;
  }
  assert(blockedTeacherVerify, "Teacher blocked from verifying evidence (Principal/Admin gate)");

  // Authorized verification by Principal
  const verifiedEvd = EvidenceVerificationEngine.verifyEvidence(
    evd.id,
    "VERIFIED",
    "চালান যাচাইকৃত ও ব্যাংক সিল স্বাক্ষরিত পাওয়া গেছে।",
    principalActor
  );
  assert(verifiedEvd.verificationStatus === "VERIFIED", "Principal verified evidence successfully");
  assert(verifiedEvd.verifiedBy?.includes("মুহতামিম"), "Verification provenance recorded");

  // ------------------------------------------------------------------------
  // GROUP 5: Formal Compliance Review & Checklist (Section 16/17)
  // ------------------------------------------------------------------------
  console.log("\nGroup 5: Formal Compliance Review & Checklist (Section 16/17)");
  const review = ComplianceReviewEngine.recordComplianceReview(
    {
      obligationId: obl.id,
      requirementId: req.id,
      evidenceReviewed: [evd.id],
      checklistAnswers: {
        requirementExists: true,
        evidenceAvailable: true,
        responsibleAssigned: true,
        deadlineMet: true,
        requiredDocumentValid: true,
        requiredApprovalObtained: true,
        requiredReportSubmitted: true,
      },
      decision: "COMPLIANT",
      findingsNotes: "বোর্ড স্বীকৃতি নবায়ন চালান ও প্রমাণপত্র শতভাগ সন্তোষজনক।",
      nextReviewDate: "2027-01-10",
    },
    principalActor
  );

  assert(
    review.id.startsWith("EHRJ-REV-CMP-"),
    `Review ID conforms to format: ${review.id}`
  );
  assert(review.decision === "COMPLIANT", "Review decision recorded as COMPLIANT");

  // Obligation status should be automatically updated to COMPLIANT
  const refreshedObl = ComplianceStore.getObligations().find((o) => o.id === obl.id);
  assert(refreshedObl?.status === "COMPLIANT", "Obligation status auto-updated to COMPLIANT following review");
  assert(Boolean(refreshedObl?.completionDate), "Obligation completion date recorded");

  // ------------------------------------------------------------------------
  // GROUP 6: Exceptions & Compensating Controls (Section 18)
  // ------------------------------------------------------------------------
  console.log("\nGroup 6: Exceptions & Compensating Controls (Section 18)");
  const exc = ObligationEngine.requestException(
    {
      obligationId: obl.id,
      requirementId: req.id,
      reason: "বোর্ড অনলাইন পোর্টালে সার্ভার ডাউন থাকায় হার্ডকপি দাখিলের সাময়িক অনুমোদন",
      scope: "অনলাইন পোর্টাল জটিলতা ছাড়",
      startDate: "2026-03-01",
      endDate: "2026-04-15",
      compensatingControl: "জেলা শিক্ষা অফিসে সশরীরে হার্ডকপি জমা দিয়ে প্রাপ্তি স্বীকার সংরক্ষণ",
    },
    adminActor
  );

  assert(exc.id.startsWith("EHRJ-EXC-CMP-"), `Exception ID conforms to format: ${exc.id}`);
  assert(exc.status === "REQUESTED", "Exception starts in REQUESTED status");

  // Non-Principal attempt to approve
  let blockedTeacherDecision = false;
  try {
    ObligationEngine.decideException(exc.id, "APPROVED", "অনুমোদিত", teacherActor);
  } catch (e) {
    blockedTeacherDecision = true;
  }
  assert(blockedTeacherDecision, "Teacher blocked from approving compliance exception");

  // Principal approval
  const approvedExc = ObligationEngine.decideException(
    exc.id,
    "APPROVED",
    "বোর্ডের সার্ভার রক্ষণাবেক্ষণ সাপেক্ষে সাময়িক হার্ডকপি বিকল্প অনুমোদন করা হলো।",
    principalActor
  );
  assert(approvedExc.status === "APPROVED", "Principal approved exception successfully");

  // ------------------------------------------------------------------------
  // GROUP 7: Remediation & Anti-Silent-Closure (Section 19)
  // ------------------------------------------------------------------------
  console.log("\nGroup 7: Remediation & Anti-Silent-Closure (Section 19)");
  const rem = ComplianceReviewEngine.createRemediation(
    {
      obligationId: obl.id,
      problem: "ব্যাংক চালানের একটি কপিতে হিসাব শাখার সিলের অস্পষ্টতা",
      rootCause: "প্রক্রিয়াগত বিলম্ব ও প্রিন্টারের কালি স্বল্পতা",
      correctiveAction: "ব্যাংক থেকে নতুন প্রত্যায়িত কপি সংগ্রহপূর্বক ফাইলে সংরক্ষণ",
      ownerId: "EMP-0005",
      ownerName: "মুহাম্মদ আব্দুল্লাহ",
      dueDate: "2026-04-10",
    },
    adminActor
  );

  assert(rem.id.startsWith("EHRJ-REM-CMP-"), `Remediation ID conforms to format: ${rem.id}`);
  assert(rem.status === "OPEN", "Remediation starts in OPEN status");

  // Verify and close remediation
  const closedRem = ComplianceReviewEngine.verifyAndCloseRemediation(
    rem.id,
    true,
    "ব্যাংক থেকে সিলযুক্ত ফ্রেশ কপি সংগৃহীত ও সংযুক্ত করা হয়েছে।",
    principalActor
  );
  assert(closedRem.status === "CLOSED", "Remediation verified and closed with notes");
  assert(closedRem.isVerified === true, "Remediation verified flag is true");

  // ------------------------------------------------------------------------
  // GROUP 8: Phase 33 Calendar Synchronization
  // ------------------------------------------------------------------------
  console.log("\nGroup 8: Phase 33 Calendar Synchronization");
  const calSyncResult = await ComplianceCrossModuleBridge.syncObligationToCalendar(obl.id);
  assert(calSyncResult.success === true, "Compliance obligation deadline synced to Phase 33 calendar");
  assert(
    calSyncResult.calendarEventId?.startsWith("CAL-CMP-"),
    `Calendar event generated with CAL-CMP- prefix: ${calSyncResult.calendarEventId}`
  );

  // ------------------------------------------------------------------------
  // GROUP 9: Phase 30 Universal Search & Strict RBAC Protection
  // ------------------------------------------------------------------------
  console.log("\nGroup 9: Phase 30 Universal Search & Strict RBAC Protection");
  const adminSearchResult = await executeGlobalSearch({
    term: "বোর্ড",
    user: { role: "ADMIN", userId: "ADMIN-01" },
  });
  const adminFoundComp = adminSearchResult.results.some(
    (r) => r.entityType === "COMPLIANCE_REQUIREMENT" || r.entityType === "COMPLIANCE_OBLIGATION"
  );
  assert(adminFoundComp, "Admin search finds compliance items");

  const teacherSearchResult = await executeGlobalSearch({
    term: "বোর্ড",
    user: { role: "TEACHER", userId: "EMP-0012" },
  });
  const teacherFoundComp = teacherSearchResult.results.some(
    (r) => r.entityType === "COMPLIANCE_REQUIREMENT" || r.entityType === "COMPLIANCE_OBLIGATION"
  );
  assert(!teacherFoundComp, "Strict RBAC: Teacher search returns 0 compliance requirements or obligations");

  const guardianSearchResult = await executeGlobalSearch({
    term: "বোর্ড",
    user: { role: "GUARDIAN", userId: "G-001" },
  });
  const guardianFoundComp = guardianSearchResult.results.some(
    (r) => r.entityType === "COMPLIANCE_REQUIREMENT" || r.entityType === "COMPLIANCE_OBLIGATION"
  );
  assert(!guardianFoundComp, "Strict RBAC: Guardian search returns 0 compliance items");

  // ------------------------------------------------------------------------
  // GROUP 10: Compliance Matrix & Gap Analysis (Section 44)
  // ------------------------------------------------------------------------
  console.log("\nGroup 10: Compliance Matrix & Gap Analysis (Section 44)");
  const matrix = ComplianceCrossModuleBridge.buildComplianceMatrix();
  assert(matrix.length > 0, `Compliance matrix constructed with ${matrix.length} rows`);
  const hasValidFields = matrix.every((row) => row.requirementId && row.category && row.status);
  assert(hasValidFields, "All matrix rows have requirementId, category, and status");

  // ------------------------------------------------------------------------
  // GROUP 11: 12 Institutional Compliance Reports (Section 43)
  // ------------------------------------------------------------------------
  console.log("\nGroup 11: 12 Institutional Compliance Reports (Section 43)");
  const reportTypes = [
    "REQUIREMENT_REGISTER",
    "OBLIGATION_REGISTER",
    "COMPLIANCE_STATUS_REPORT",
    "OVERDUE_OBLIGATIONS_REPORT",
    "EVIDENCE_STATUS_REPORT",
    "EXPIRY_REPORT",
    "EXCEPTION_REPORT",
    "REMEDIATION_REPORT",
    "POLICY_TO_REQUIREMENT_MAPPING",
    "REQUIREMENT_TO_CONTROL_MAPPING",
    "CONTRACT_COMPLIANCE_REPORT",
    "MANAGEMENT_ASSURANCE_REPORT",
  ] as const;

  let allReportsPassed = true;
  for (const rType of reportTypes) {
    const report = ComplianceCrossModuleBridge.generateInstitutionalReport(rType);
    if (!report.reportTitleBn || !report.summary || !Array.isArray(report.data)) {
      allReportsPassed = false;
      break;
    }
  }
  assert(allReportsPassed, "All 12 Institutional Compliance Reports generated with valid metadata and data");

  // ------------------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------------------
  console.log("\n============================================================");
  console.log(`Phase 43 Test Suite Results: ${passed} PASSED, ${failed} FAILED`);
  console.log("============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
