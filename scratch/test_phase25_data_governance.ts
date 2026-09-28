import { prisma } from "../src/lib/prisma";
import {
  AUTHORITATIVE_DOMAINS,
  DATA_QUALITY_RULES,
  runDataQualityScan,
  getAllDataQualityIssues,
  updateIssueStatus
} from "../src/lib/dataGovernanceEngine";
import {
  scanAllStudentDuplicates,
  planStudentMerge,
  executeStudentMerge,
  getAllDuplicateCandidates
} from "../src/lib/duplicateMergeEngine";
import { runMasterReconciliation, getLatestReconciliationReport } from "../src/lib/reconciliationEngine";
import { METRIC_LINEAGE_REGISTRY, traceMetricValue } from "../src/lib/dataLineage";
import {
  validateStudentImportBatch,
  commitStudentImportBatch,
  submitGuardianCorrectionRequest,
  reviewGuardianCorrectionRequest,
  getAllCorrectionRequests
} from "../src/lib/importValidator";
import { createSessionToken } from "../src/lib/auth";

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✔ PASS: ${msg}`);
    passCount++;
  } else {
    console.error(`  ✘ FAIL: ${msg}`);
    failCount++;
  }
}

async function runPhase25Tests() {
  console.log("==================================================================");
  console.log("  PHASE 25 — DATA GOVERNANCE, QUALITY & MASTER DATA ENGINE TESTS  ");
  console.log("  Target Server: http://localhost:3000                            ");
  console.log("==================================================================\n");

  // -------------------------------------------------------------
  // STEP 1: Authoritative Source of Truth & Rules Inventory
  // -------------------------------------------------------------
  console.log("[STEP 1] Testing Authoritative Source Directory & Rules Registry...");
  assert(AUTHORITATIVE_DOMAINS.length >= 12, `Registered ${AUTHORITATIVE_DOMAINS.length} Authoritative Domains`);
  
  const studentDomain = AUTHORITATIVE_DOMAINS.find(d => d.domain === "STUDENT_IDENTITY");
  assert(studentDomain?.authoritativeModel === "Student", "Student identity authoritative model is 'Student'");

  const financeDomain = AUTHORITATIVE_DOMAINS.find(d => d.domain === "CASH_FUNDS");
  assert(financeDomain?.authoritativeModel === "CashFund, CashTransaction", "Cash funds authoritative models mapped");

  assert(DATA_QUALITY_RULES.length >= 10, `Registered ${DATA_QUALITY_RULES.length} Data Quality Rules`);
  const ruleCodes = DATA_QUALITY_RULES.map(r => r.code);
  const uniqueRuleCodes = new Set(ruleCodes);
  assert(ruleCodes.length === uniqueRuleCodes.size, "All Data Quality Rule codes are strictly unique");

  // -------------------------------------------------------------
  // STEP 2: Live Data Quality Scanner Execution
  // -------------------------------------------------------------
  console.log("\n[STEP 2] Testing Live Data Quality Scanner...");
  const scanResult = await runDataQualityScan();
  assert(scanResult.totalIssuesFound > 0, `Quality scan executed: Found ${scanResult.totalIssuesFound} issues`);
  assert(["HEALTHY", "WARNING", "ERROR", "REVIEW_REQUIRED"].includes(scanResult.status), `Overall status calculated: ${scanResult.status}`);

  const allIssues = getAllDataQualityIssues();
  assert(allIssues.length === scanResult.totalIssuesFound, "Issues persisted to append-only JSON ledger");

  const sampleIssue = allIssues[0];
  assert(sampleIssue.id.startsWith("EHRJ-DQ-"), `Issue ID canonical format verified: ${sampleIssue?.id}`);
  assert(sampleIssue.evidence !== undefined, "Issue includes structured forensic evidence");

  // -------------------------------------------------------------
  // STEP 3: Issue Lifecycle Management
  // -------------------------------------------------------------
  console.log("\n[STEP 3] Testing Issue Lifecycle Management...");
  const updatedIssue = updateIssueStatus(
    sampleIssue.id,
    "INVESTIGATING",
    "Admin Examiner",
    "অসঙ্গতি খতিয়ে দেখা হচ্ছে।"
  );
  assert(updatedIssue.status === "INVESTIGATING", "Issue transitioned to INVESTIGATING");
  assert(updatedIssue.resolutionNotes === "অসঙ্গতি খতিয়ে দেখা হচ্ছে।", "Resolution notes recorded");

  const resolvedIssue = updateIssueStatus(
    sampleIssue.id,
    "RESOLVED",
    "Admin Super Lead",
    "সমাধান নিশ্চিত করা হয়েছে।"
  );
  assert(resolvedIssue.status === "RESOLVED", "Issue transitioned to RESOLVED");
  assert(resolvedIssue.resolvedAt !== null, "Resolved timestamp recorded");
  assert(resolvedIssue.resolvedBy === "Admin Super Lead", "Resolved actor recorded");

  // -------------------------------------------------------------
  // STEP 4: Duplicate Student Detection & Candidate Scoring
  // -------------------------------------------------------------
  console.log("\n[STEP 4] Testing Duplicate Student Detection & Candidate Scoring...");
  const candidates = await scanAllStudentDuplicates();
  assert(Array.isArray(candidates), `Scanned student duplicates: ${candidates.length} candidates identified`);

  // Verify candidate store
  const storedCandidates = getAllDuplicateCandidates();
  assert(storedCandidates.length >= candidates.length, "Duplicate candidates saved to governance ledger");

  // -------------------------------------------------------------
  // STEP 5: Pre-Merge Simulation & Safe Merge Execution
  // -------------------------------------------------------------
  console.log("\n[STEP 5] Testing Student Pre-Merge Simulation & Safe Merge Execution...");
  // Create two temporary test students for merge testing
  const currentSession = await prisma.academicSession.findFirst({ where: { status: "ACTIVE" } });
  const testClass = await prisma.jamatClass.findFirst();

  const survivorStudent = await prisma.student.create({
    data: {
      studentIdNumber: `EHRJ-TEST-SURV-${Date.now()}`,
      fullNameBn: "মুহাম্মদ উমর ফারুক (টেস্ট সারভাইভার)",
      fullNameEn: "Muhammad Umar Farooq (Survivor)",
      dateOfBirth: new Date("2014-06-15"),
      gender: "MALE",
      fatherNameBn: "ফারুক আহমেদ",
      motherNameBn: "মরিয়ম বেগম",
      fatherPhone: "01799887766",
      presentAddress: "ইলিয়টগঞ্জ",
      permanentAddress: "ইলিয়টগঞ্জ",
      status: "ACTIVE"
    }
  });

  const duplicateStudent = await prisma.student.create({
    data: {
      studentIdNumber: `EHRJ-TEST-DUPL-${Date.now()}`,
      fullNameBn: "মুহাম্মদ উমর ফারুক (টেস্ট ডুপ্লিকেট)",
      fullNameEn: "Muhammad Umar Farooq (Duplicate)",
      dateOfBirth: new Date("2014-06-15"),
      gender: "MALE",
      fatherNameBn: "ফারুক আহমেদ",
      motherNameBn: "মরিয়ম বেগম",
      fatherPhone: "01799887766",
      presentAddress: "ইলিয়টগঞ্জ",
      permanentAddress: "ইলিয়টগঞ্জ",
      status: "ACTIVE"
    }
  });

  // Attach a test fee invoice to the duplicate student
  const testInvoice = await prisma.feeInvoice.create({
    data: {
      invoiceNumber: `INV-MERGE-TEST-${Date.now()}`,
      studentId: duplicateStudent.id,
      sessionId: currentSession!.id,
      title: "মার্জ টেস্ট ইনভয়েস",
      dueDate: new Date(),
      totalAmount: 1500,
      netAmount: 1500,
      dueAmount: 1500,
      status: "UNPAID"
    }
  });

  // A. Pre-Merge Plan
  const mergePlan = await planStudentMerge(survivorStudent.id, duplicateStudent.id);
  assert(mergePlan.survivor.studentIdNumber === survivorStudent.studentIdNumber, "Merge preview identifies correct survivor");
  assert(mergePlan.duplicate.studentIdNumber === duplicateStudent.studentIdNumber, "Merge preview identifies correct duplicate");
  assert(mergePlan.impactSummary.invoicesCount >= 1, "Impact summary reflects duplicate's attached fee invoices");

  // B. Step-Up Verification failure
  let stepUpFailed = false;
  try {
    await executeStudentMerge(
      survivorStudent.id,
      duplicateStudent.id,
      "Admin Operator",
      "পরীক্ষামূলক মার্জ",
      "WRONG-PHRASE"
    );
  } catch {
    stepUpFailed = true;
  }
  assert(stepUpFailed, "Merge rejected when confirmation phrase is invalid");

  // C. Successful Step-Up Merge
  const mergeResult = await executeStudentMerge(
    survivorStudent.id,
    duplicateStudent.id,
    "Admin Operator",
    "পরীক্ষামূলক মার্জ সফলকরণ",
    "CONFIRM-STUDENT-MERGE"
  );
  assert(mergeResult.success, "Merge executed successfully with step-up verification");

  // Verify invoice was moved to survivor
  const movedInvoice = await prisma.feeInvoice.findUnique({ where: { id: testInvoice.id } });
  assert(movedInvoice?.studentId === survivorStudent.id, "Fee invoice reassigned to survivor student in DB");

  // Verify duplicate student status is TRANSFERRED
  const postMergeDup = await prisma.student.findUnique({ where: { id: duplicateStudent.id } });
  assert(postMergeDup?.status === "TRANSFERRED", "Duplicate student record marked as TRANSFERRED (Merged)");

  // -------------------------------------------------------------
  // STEP 6: Master Reconciliation Engine
  // -------------------------------------------------------------
  console.log("\n[STEP 6] Testing Master Reconciliation Engine...");
  const recReport = await runMasterReconciliation();
  assert(recReport.totalChecks > 0, `Reconciliation ran: Total ${recReport.totalChecks} checks across 4 domains`);
  assert(recReport.domainSummaries.finance.total > 0, "Finance domain reconciliation complete");
  assert(recReport.domainSummaries.library.total > 0, "Library domain reconciliation complete");
  assert(recReport.domainSummaries.inventory.total > 0, "Inventory domain reconciliation complete");
  assert(recReport.domainSummaries.payroll.total > 0, "Payroll domain reconciliation complete");

  const latestSaved = getLatestReconciliationReport();
  assert(latestSaved?.id === recReport.id, "Reconciliation report persisted to historical audit runs");

  // -------------------------------------------------------------
  // STEP 7: Data Lineage & Authoritative Reporting Matrix
  // -------------------------------------------------------------
  console.log("\n[STEP 7] Testing Data Lineage & Metric Tracing...");
  assert(METRIC_LINEAGE_REGISTRY.length >= 5, `Registered ${METRIC_LINEAGE_REGISTRY.length} Key Metric Lineage Nodes`);

  const feeTrace = await traceMetricValue("TOTAL_FEES_COLLECTED");
  assert(feeTrace.metric.authoritativeEntity === "PaymentReceipt", "Total fees collected metric traces to PaymentReceipt");
  assert(typeof feeTrace.calculatedValue === "number", `Calculated fees collected value: ৳${feeTrace.calculatedValue}`);

  const duesTrace = await traceMetricValue("OUTSTANDING_STUDENT_DUES");
  assert(duesTrace.metric.authoritativeEntity === "FeeInvoice", "Outstanding dues metric traces to FeeInvoice");

  const enrTrace = await traceMetricValue("ACTIVE_ENROLLED_STUDENTS");
  assert(enrTrace.metric.authoritativeEntity === "Enrollment", "Enrolled students metric traces to Enrollment");

  // -------------------------------------------------------------
  // STEP 8: Import Validation & Safe Commit Pipeline
  // -------------------------------------------------------------
  console.log("\n[STEP 8] Testing Batch Import Validation & Safe Commit...");
  // Test invalid rows (missing name, invalid phone, non-existent class)
  const invalidRows = [
    {
      fullNameBn: "মু", // Too short
      dateOfBirth: "invalid-date",
      gender: "UNKNOWN",
      fatherPhone: "12345",
      classCode: "NON_EXISTENT_CLASS"
    }
  ];

  const invalidVal = await validateStudentImportBatch(invalidRows);
  assert(!invalidVal.isValid, "Validation correctly rejected malformed rows");
  assert(invalidVal.errors.length >= 4, `Detected ${invalidVal.errors.length} distinct schema & reference errors`);

  // Test valid row
  const validRows = [
    {
      fullNameBn: "মুহাম্মদ আব্দুল্লাহ আল মামুন",
      fullNameEn: "Muhammad Abdullah Al Mamun",
      dateOfBirth: "2016-03-20",
      gender: "MALE",
      fatherNameBn: "মামুনুর রশীদ",
      fatherPhone: "01811223344",
      classCode: testClass!.code,
      presentAddress: "ইলিয়টগঞ্জ, দাউদকান্দি"
    }
  ];

  const validVal = await validateStudentImportBatch(validRows);
  assert(validVal.isValid, "Validation approved valid student row");

  // Commit valid row
  const commitResult = await commitStudentImportBatch(validRows, "TEST-ADMIN-ACTOR");
  assert(commitResult.success, "Batch student import committed in safe transaction");
  assert(commitResult.insertedCount === 1, "Import inserted 1 new student");

  // -------------------------------------------------------------
  // STEP 9: Guardian Data Correction Request Pipeline
  // -------------------------------------------------------------
  console.log("\n[STEP 9] Testing Guardian Data Correction Request Pipeline...");
  // Create guardian linked to survivorStudent
  const guardianUser = await prisma.user.findFirst({ where: { role: "GUARDIAN" } });
  let guardian = await prisma.guardian.findFirst();
  if (!guardian && guardianUser) {
    guardian = await prisma.guardian.create({
      data: {
        userId: guardianUser.id,
        fullNameBn: "টেস্ট অভিভাবক",
        phone: "01700112233",
        relation: "FATHER"
      }
    });
  }

  // Link guardian to survivorStudent
  await prisma.guardianStudent.upsert({
    where: {
      guardianId_studentId: {
        guardianId: guardian!.id,
        studentId: survivorStudent.id
      }
    },
    create: {
      guardianId: guardian!.id,
      studentId: survivorStudent.id,
      isPrimary: true
    },
    update: {}
  });

  const corrReq = await submitGuardianCorrectionRequest(
    guardian!.id,
    survivorStudent.id,
    {
      presentAddress: { oldValue: "ইলিয়টগঞ্জ", requestedValue: "পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি" }
    },
    "বাসা পরিবর্তন হয়েছে।"
  );
  assert(corrReq.status === "SUBMITTED", "Guardian correction request submitted with status SUBMITTED");

  // Review & Approve
  const approvedReq = await reviewGuardianCorrectionRequest(
    corrReq.id,
    "APPROVED",
    "Admin Lead",
    "যাচাইপূর্বক তথ্য অনুমোদন করা হলো।"
  );
  assert(approvedReq.status === "APPROVED", "Correction request reviewed and APPROVED");

  // Verify Student Master is updated
  const updatedStudent = await prisma.student.findUnique({ where: { id: survivorStudent.id } });
  assert(
    updatedStudent?.presentAddress === "পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি",
    "Authoritative Student Master updated safely with approved corrections"
  );

  // -------------------------------------------------------------
  // STEP 10: Live HTTP Smoke Tests on Next.js Endpoints
  // -------------------------------------------------------------
  console.log("\n[STEP 10] Performing Live HTTP Smoke Tests on Phase 25 Endpoints...");
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const adminToken = await createSessionToken({
    userId: adminUser!.id,
    username: adminUser!.username,
    role: adminUser!.role,
    email: adminUser!.email,
    name: adminUser!.name
  });

  const headers = {
    "Cookie": `ehrj_session_token=${adminToken}`,
    "Authorization": `Bearer ${adminToken}`,
    "Content-Type": "application/json"
  };

  // 1. Overview API
  const resOverview = await fetch("http://localhost:3000/api/admin/data-quality/overview", { headers });
  assert(resOverview.status === 200, `GET /api/admin/data-quality/overview returned 200`);
  const jsonOverview = await resOverview.json();
  assert(jsonOverview.success && jsonOverview.data.summary.totalIssues > 0, "Overview API returned summary data");

  // 2. Issues API
  const resIssues = await fetch("http://localhost:3000/api/admin/data-quality/issues", { headers });
  assert(resIssues.status === 200, `GET /api/admin/data-quality/issues returned 200`);
  const jsonIssues = await resIssues.json();
  assert(jsonIssues.success && Array.isArray(jsonIssues.data.issues), "Issues API returned issues list");

  // 3. Duplicates API
  const resDuplicates = await fetch("http://localhost:3000/api/admin/data-quality/duplicates", { headers });
  assert(resDuplicates.status === 200, `GET /api/admin/data-quality/duplicates returned 200`);
  const jsonDuplicates = await resDuplicates.json();
  assert(jsonDuplicates.success && Array.isArray(jsonDuplicates.data.candidates), "Duplicates API returned candidates");

  // 4. Reconciliation API
  const resReconciliation = await fetch("http://localhost:3000/api/admin/data-quality/reconciliation", { headers });
  assert(resReconciliation.status === 200, `GET /api/admin/data-quality/reconciliation returned 200`);
  const jsonReconciliation = await resReconciliation.json();
  assert(jsonReconciliation.success && jsonReconciliation.data.totalChecks > 0, "Reconciliation API returned report");

  // 5. Lineage API
  const resLineage = await fetch("http://localhost:3000/api/admin/data-quality/lineage", { headers });
  assert(resLineage.status === 200, `GET /api/admin/data-quality/lineage returned 200`);
  const jsonLineage = await resLineage.json();
  assert(jsonLineage.success && Array.isArray(jsonLineage.data), "Lineage API returned metric trace array");

  // 6. Import Validate API
  const resImportVal = await fetch("http://localhost:3000/api/admin/data-quality/import/validate", {
    method: "POST",
    headers,
    body: JSON.stringify({ rows: invalidRows })
  });
  assert(resImportVal.status === 200, `POST /api/admin/data-quality/import/validate returned 200`);
  const jsonImportVal = await resImportVal.json();
  assert(!jsonImportVal.data.isValid, "Import validate endpoint correctly flagged invalid rows");

  // 7. Corrections API
  const resCorrections = await fetch("http://localhost:3000/api/portal/data-correction", { headers });
  assert(resCorrections.status === 200, `GET /api/portal/data-correction returned 200`);
  const jsonCorrections = await resCorrections.json();
  assert(jsonCorrections.success && Array.isArray(jsonCorrections.data), "Corrections API returned request array");

  // Cleanup test students
  await prisma.feeInvoice.deleteMany({ where: { invoiceNumber: testInvoice.invoiceNumber } });
  await prisma.guardianStudent.deleteMany({ where: { studentId: survivorStudent.id } });
  await prisma.student.deleteMany({ where: { id: { in: [survivorStudent.id, duplicateStudent.id] } } });

  console.log("\n==================================================================");
  console.log(`  PHASE 25 DATA GOVERNANCE ENGINE: ${passCount} PASSED, ${failCount} FAILED`);
  console.log("==================================================================\n");

  if (failCount > 0) {
    process.exit(1);
  }
}

runPhase25Tests()
  .catch((err) => {
    console.error("Test execution fatal error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
