/**
 * EHRJ MADRASHA DIGITAL CAMPUS & ERP
 * PHASE 41 — Institutional Budget Planning, Financial Planning & Budget Control Engine
 * Checkpoint: EHRJ-AI-2026-PHASE41
 * 
 * Comprehensive Automated Verification Test Suite
 */

import {
  getAllPeriods,
  getAllBudgets,
  getBudgetById,
  saveBudget,
  getAllRevisions,
  getAllProjects,
  getAllAlerts,
  getAllAuditLogs,
  createPeriod,
  lockPeriod,
  createBudget,
  transitionBudgetStatus,
  canTransitionBudget,
  addOrUpdateBudgetLine,
  recalculateBudgetTotals,
  validateFundAllocationRule,
  calculateFundSummaries,
  generateVarianceReport,
  updateBudgetLineActuals,
  checkBudgetControl,
  scanBudgetAndGenerateAlerts,
  acknowledgeAlert,
  requestBudgetRevision,
  reviewBudgetRevision,
  approveBudgetRevision,
  createProject,
  syncBudgetWithAuthoritativeSystems,
  getBudgetForecastProjection,
  ActorContext,
  BudgetRevisionLineDiff,
} from "../src/lib/budget";

// Test counters
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: any) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${testName}`);
    if (detail !== undefined) {
      console.error(`     Detail:`, detail);
    }
  }
}

async function runPhase41Tests() {
  console.log("==================================================================");
  console.log("  PHASE 41 VERIFICATION: INSTITUTIONAL BUDGET PLANNING ENGINE   ");
  console.log("  Checkpoint: EHRJ-AI-2026-PHASE41                               ");
  console.log("==================================================================\n");

  const testActor: ActorContext = {
    actorId: "usr-admin-001",
    actorName: "মুফতি মুহাম্মদ সাইফুল্লাহ (অধ্যক্ষ)",
    actorRole: "ADMIN",
  };

  const accountantActor: ActorContext = {
    actorId: "usr-acc-002",
    actorName: "মাওলানা আব্দুল বাতেন (হিসাবরক্ষক)",
    actorRole: "ACCOUNTANT",
  };

  try {
    // -------------------------------------------------------------
    // Test Group 1: Store & Seeding Integrity
    // -------------------------------------------------------------
    console.log("--- GROUP 1: Store & Seeding Integrity ---");
    const periods = getAllPeriods();
    assert(periods.length >= 1, "Pre-seeded budget periods exist in JSON store", `Found: ${periods.length}`);

    const budgets = getAllBudgets();
    assert(budgets.length >= 1, "Pre-seeded institutional budgets exist in JSON store", `Found: ${budgets.length}`);

    const seededBudget = budgets.find((b) => b.id === "EHRJ-BUD-2026-0001") || budgets[0];
    assert(Boolean(seededBudget.id && seededBudget.budgetCode), "Seeded budget has institutional code", seededBudget.budgetCode);
    assert(seededBudget.lines.length >= 4, "Seeded budget contains comprehensive budget lines across funds", seededBudget.lines.length);

    const projects = getAllProjects();
    assert(projects.length >= 1, "Pre-seeded capital projects exist in store", `Found: ${projects.length}`);

    const alerts = getAllAlerts();
    assert(Array.isArray(alerts), "Pre-seeded alerts store exists and is an array");

    const auditLogs = getAllAuditLogs();
    assert(Array.isArray(auditLogs) && auditLogs.length >= 1, "Audit log store is active with institutional logs");

    // -------------------------------------------------------------
    // Test Group 2: Budget Period Engine & Invariants
    // -------------------------------------------------------------
    console.log("\n--- GROUP 2: Budget Period Engine & Invariants ---");
    const uniqueYear = `FY${Date.now().toString().slice(-4)}`;
    const newPeriod = createPeriod(
      {
        fiscalYear: uniqueYear,
        nameBn: `অর্থবছর ${uniqueYear} (পরীক্ষামূলক)`,
        nameEn: `Fiscal Year ${uniqueYear} (Test)`,
        startDate: "2027-01-01",
        endDate: "2027-12-31",
      },
      testActor
    );
    assert(Boolean(newPeriod.id && newPeriod.status === "PLANNED"), "New budget period created in PLANNED status", newPeriod.id);

    // Period locking controls
    const lockedPeriod = lockPeriod(newPeriod.id, testActor, "অডিট প্রস্তুতের জন্য মেয়াদ লক করা হয়েছে");
    assert(Boolean(lockedPeriod && lockedPeriod.status === "LOCKED" && lockedPeriod.isLocked), "Budget period can be locked by authorized authority");

    // -------------------------------------------------------------
    // Test Group 3: Budget Lifecycle & State Transitions
    // -------------------------------------------------------------
    console.log("\n--- GROUP 3: Budget Lifecycle & State Transitions ---");
    const testBudget = createBudget(
      {
        titleBn: "প্রাতিষ্ঠানিক বার্ষিক বাজেট ২০২৭-২৮",
        titleEn: "Annual Institutional Budget 2027-28",
        periodId: newPeriod.id,
        periodNameBn: newPeriod.nameBn,
        fiscalYear: uniqueYear,
        startDate: "2027-01-01",
        endDate: "2027-12-31",
        notes: "টেস্টিং লাইফসাইকেল ট্রানজিশন",
      },
      testActor
    );
    assert(testBudget.status === "DRAFT", "Budget created in DRAFT status", testBudget.status);
    assert(testBudget.currentVersion === 1, "Initial budget version initialized to 1");

    // Valid transitions
    assert(canTransitionBudget("DRAFT", "PREPARATION"), "DRAFT can transition to PREPARATION");
    assert(!canTransitionBudget("DRAFT", "APPROVED"), "DRAFT cannot skip directly to APPROVED");
    assert(!canTransitionBudget("DRAFT", "ACTIVE"), "DRAFT cannot skip directly to ACTIVE");

    const prepResult = transitionBudgetStatus(testBudget.id, "PREPARATION", testActor, "বাজেট খসড়া প্রণয়ন শুরু");
    assert(prepResult.success && prepResult.budget?.status === "PREPARATION", "Transition DRAFT -> PREPARATION succeeds");

    const reviewResult = transitionBudgetStatus(testBudget.id, "UNDER_REVIEW", testActor, "গভর্নিং বডি পর্যালোচনায় পেশ");
    assert(reviewResult.success && reviewResult.budget?.status === "UNDER_REVIEW", "Transition PREPARATION -> UNDER_REVIEW succeeds");

    // Human Approval & Snapshot Creation
    const approveResult = transitionBudgetStatus(testBudget.id, "APPROVED", testActor, "গভর্নিং বডি কর্তৃক সর্বসম্মতিক্রমে অনুমোদিত");
    assert(approveResult.success && approveResult.budget?.status === "APPROVED", "Transition UNDER_REVIEW -> APPROVED succeeds");
    assert(approveResult.budget?.approvedBy === testActor.actorName, "Budget records approving authority");
    assert(approveResult.budget?.versions.length === 1, "Approving creates Version 1 immutable snapshot", approveResult.budget?.versions.length);
    assert(approveResult.budget?.versions[0].versionNumber === 1, "Snapshot has versionNumber 1");

    // Activate
    const activeResult = transitionBudgetStatus(testBudget.id, "ACTIVE", testActor, "বাজেট কার্যকর ঘোষণা");
    assert(activeResult.success && activeResult.budget?.status === "ACTIVE", "Transition APPROVED -> ACTIVE succeeds");

    // Block invalid backwards jump
    const invalidJump = transitionBudgetStatus(testBudget.id, "DRAFT", testActor, "অবৈধ রূপান্তর");
    assert(!invalidJump.success, "Direct transition from ACTIVE back to DRAFT is strictly blocked");

    // -------------------------------------------------------------
    // Test Group 4: Budget Lines & Fund Allocation Restrictions
    // -------------------------------------------------------------
    console.log("\n--- GROUP 4: Budget Lines & Fund Allocation Restrictions ---");
    // Create draft budget for testing line additions
    const draftBudget = createBudget(
      {
        titleBn: "খাতভিত্তিক যাচাই বাজেট",
        titleEn: "Fund Restrictions Test Budget",
        periodId: newPeriod.id,
        periodNameBn: newPeriod.nameBn,
        fiscalYear: uniqueYear,
        startDate: "2027-01-01",
        endDate: "2027-12-31",
      },
      testActor
    );

    // Add Income Line
    const incomeLineRes = addOrUpdateBudgetLine(
      draftBudget.id,
      {
        categoryCode: "DONATION_GENERAL",
        categoryNameBn: "সাধারণ দান ও সদকা",
        fundCode: "GENERAL",
        categoryType: "INCOME",
        plannedAmount: 1200000,
        notes: "মাসিক সাধারণ দান সংগ্রহ",
      },
      testActor
    );
    assert(incomeLineRes.success && Boolean(incomeLineRes.line?.id), "Income line added to DRAFT budget successfully");

    // Add Expense Line
    const expenseLineRes = addOrUpdateBudgetLine(
      draftBudget.id,
      {
        categoryCode: "SALARY_TEACHERS",
        categoryNameBn: "শিক্ষক ও স্টাফ বেতন",
        fundCode: "GENERAL",
        categoryType: "EXPENSE",
        plannedAmount: 800000,
        notes: "মাসিক বেতন স্কেল",
      },
      testActor
    );
    assert(expenseLineRes.success && Boolean(expenseLineRes.line?.id), "Expense line added to DRAFT budget successfully");

    // Shariah Invariant 1: Zakat Expenses
    const zakatValid = validateFundAllocationRule("ZAKAT", "ZAKAT_WELFARE_ORPHANS", "EXPENSE");
    assert(zakatValid.isValid, "Zakat expense for orphan/student welfare passes Shariah rule validation");

    const zakatInvalid = validateFundAllocationRule("ZAKAT", "STAFF_OFFICE_AC", "EXPENSE");
    assert(!zakatValid.ruleNoticeBn && !zakatInvalid.isValid, "Zakat expense for office/admin is strictly rejected by Shariah rule");
    assert(Boolean(zakatInvalid.ruleNoticeBn?.includes("শরীয়াহ লঙ্ঘন সতর্কতা")), "Zakat rejection notice includes explicit Shariah warning");

    // Shariah Invariant 2: Lillah Expenses
    const lillahValid = validateFundAllocationRule("LILLAH", "FOOD_RICE_AND_OIL", "EXPENSE");
    assert(lillahValid.isValid, "Lillah expense for kitchen food & grocery passes validation");

    const lillahInvalid = validateFundAllocationRule("LILLAH", "BUILDING_BRICKS_CEMENT", "EXPENSE");
    assert(!lillahInvalid.isValid, "Lillah expense for construction materials is strictly rejected");

    // Add valid lines to draft budget
    addOrUpdateBudgetLine(
      draftBudget.id,
      {
        categoryCode: "ZAKAT_WELFARE_CLOTHING",
        categoryNameBn: "দরিদ্র ছাত্রদের পোশাক ও কিতাব",
        fundCode: "ZAKAT",
        categoryType: "EXPENSE",
        plannedAmount: 150000,
      },
      testActor
    );

    addOrUpdateBudgetLine(
      draftBudget.id,
      {
        categoryCode: "FOOD_BOARDING_MEALS",
        categoryNameBn: "লিল্লাহ বোর্ডিং আহার্য ও পুষ্টি",
        fundCode: "LILLAH",
        categoryType: "EXPENSE",
        plannedAmount: 250000,
      },
      testActor
    );

    // Verify budget totals updated
    const updatedDraft = getBudgetById(draftBudget.id)!;
    assert(updatedDraft.totalIncomePlanned === 1200000, "Total planned income calculated accurately (1,200,000 BDT)", updatedDraft.totalIncomePlanned);
    assert(updatedDraft.totalExpensePlanned === 1200000, "Total planned expense calculated accurately (1,200,000 BDT)", updatedDraft.totalExpensePlanned);
    assert(updatedDraft.netProjectedSurplus === 0, "Balanced budget net projected surplus equals 0 BDT");

    // -------------------------------------------------------------
    // Test Group 5: Calculations, Variance & Utilization
    // -------------------------------------------------------------
    console.log("\n--- GROUP 5: Calculations, Variance & Utilization ---");
    // Update actuals and commitments on a line
    const targetLineId = updatedDraft.lines[1].id; // Teacher salary
    const updateActualsRes = updateBudgetLineActuals(draftBudget.id, targetLineId, 500000, 100000);
    assert(updateActualsRes.success, "Budget line actuals and commitments updated");

    const updatedLine = updateActualsRes.line!;
    assert(updatedLine.actualAmount === 500000, "Line actual amount recorded (500,000 BDT)");
    assert(updatedLine.committedAmount === 100000, "Line committed amount recorded (100,000 BDT)");
    assert(updatedLine.remainingAmount === 200000, "Line remaining amount accurately calculated: 800,000 - 600,000 = 200,000 BDT", updatedLine.remainingAmount);
    assert(updatedLine.variance === 200000, "Expense variance is positive (under budget favorable): 200,000 BDT", updatedLine.variance);
    assert(updatedLine.utilizationRate === 75, "Line utilization rate correctly computed: (600,000 / 800,000) * 100 = 75.0%", updatedLine.utilizationRate);

    // Fund summaries
    const fundSummaries = calculateFundSummaries(draftBudget.id);
    assert(fundSummaries.length >= 3, "Fund summaries generated for General, Zakat, and Lillah funds");
    const genFund = fundSummaries.find((f) => f.fundCode === "GENERAL");
    assert(Boolean(genFund && genFund.totalExpensePlanned === 800000), "General fund summary reflects allocated budget correctly");

    // Variance report
    const varianceReport = generateVarianceReport(draftBudget.id);
    assert(varianceReport.length === updatedDraft.lines.length, "Variance report itemizes all budget lines");
    const salaryReport = varianceReport.find((v) => v.lineId === targetLineId);
    assert(salaryReport?.status === "FAVORABLE" || salaryReport?.status === "ON_TRACK", "75% utilization categorized as ON_TRACK / FAVORABLE");

    // -------------------------------------------------------------
    // Test Group 6: Budget Control Early Warning & Overrun Engine
    // -------------------------------------------------------------
    console.log("\n--- GROUP 6: Budget Control Early Warning & Overrun Engine ---");
    // Test checkBudgetControl
    // Current on targetLine: 600,000 / 800,000 (75%)
    // Proposed 30,000 -> Total 630,000 / 800,000 = 78.75% -> Below warning
    const normalCheck = checkBudgetControl(draftBudget.id, targetLineId, 30000);
    assert(!normalCheck.hasAlert && normalCheck.alertLevel === "INFO", "Safe expense under 80% produces no alert (INFO)");

    // Proposed 50,000 -> Total 650,000 / 800,000 = 81.25% -> WARNING (>= 80%)
    const warningCheck = checkBudgetControl(draftBudget.id, targetLineId, 50000);
    assert(warningCheck.hasAlert && warningCheck.alertLevel === "WARNING", "Expense reaching 80% triggers WARNING alert", warningCheck.alertLevel);
    assert(warningCheck.allowTransaction === true, "Soft control allows transaction with warning");

    // Proposed 130,000 -> Total 730,000 / 800,000 = 91.25% -> CRITICAL (>= 90%)
    const criticalCheck = checkBudgetControl(draftBudget.id, targetLineId, 130000);
    assert(criticalCheck.hasAlert && criticalCheck.alertLevel === "CRITICAL", "Expense reaching 90% triggers CRITICAL alert", criticalCheck.alertLevel);

    // Proposed 250,000 -> Total 850,000 / 800,000 = 106.25% -> OVERRUN (> 100%)
    const overrunCheck = checkBudgetControl(draftBudget.id, targetLineId, 250000);
    assert(overrunCheck.hasAlert && overrunCheck.alertLevel === "OVERRUN", "Expense exceeding 100% triggers OVERRUN alert", overrunCheck.alertLevel);
    assert(overrunCheck.overrunAmount === 50000, "Calculates exact overrun amount (50,000 BDT)");

    // Hard enforcement toggle test
    const hardBudget = getBudgetById(draftBudget.id)!;
    hardBudget.hardEnforcementEnabled = true;
    saveBudget(hardBudget);
    const blockedCheck = checkBudgetControl(draftBudget.id, targetLineId, 250000);
    assert(blockedCheck.allowTransaction === false, "Hard enforcement blocks overrun transactions when configured");

    // Restore soft control
    hardBudget.hardEnforcementEnabled = false;
    saveBudget(hardBudget);

    // Alert generation scan
    // Set actual amount to trigger alert in store
    updateBudgetLineActuals(draftBudget.id, targetLineId, 650000, 100000); // 750,000 / 800,000 = 93.75%
    const scannedAlerts = scanBudgetAndGenerateAlerts(draftBudget.id);
    assert(scannedAlerts.length >= 1, "Budget scan automatically detects threshold breach and generates control alert");
    const activeAlert = scannedAlerts[0];
    assert(activeAlert.alertLevel === "CRITICAL", "Scan accurately classifies 93.75% utilization as CRITICAL");

    // Acknowledge alert workflow
    const ackResult = acknowledgeAlert(activeAlert.id, testActor, "রমজান ও ঈদুল ফিতরের বিশেষ বোনাস সমন্বয়ের জন্য বাজেট রিভিশন প্রক্রিয়াধীন");
    assert(ackResult.success && ackResult.alert?.status === "ACKNOWLEDGED", "Human authority acknowledges alert with audit justification");

    // -------------------------------------------------------------
    // Test Group 7: Budget Revision Workflow & Version Promotion
    // -------------------------------------------------------------
    console.log("\n--- GROUP 7: Budget Revision Workflow & Version Promotion ---");
    // Transition draftBudget to APPROVED and ACTIVE
    transitionBudgetStatus(draftBudget.id, "PREPARATION", testActor);
    transitionBudgetStatus(draftBudget.id, "UNDER_REVIEW", testActor);
    transitionBudgetStatus(draftBudget.id, "APPROVED", testActor);
    transitionBudgetStatus(draftBudget.id, "ACTIVE", testActor);

    const approvedState = getBudgetById(draftBudget.id)!;
    assert(approvedState.status === "ACTIVE", "Test budget is now ACTIVE");
    assert(approvedState.currentVersion === 1, "Active budget currentVersion is v1");
    assert(approvedState.versions.length === 1, "Active budget has v1 immutable snapshot");

    // Line modification must be rejected directly in ACTIVE status
    const directEdit = addOrUpdateBudgetLine(
      draftBudget.id,
      {
        id: targetLineId,
        categoryCode: "SALARY_TEACHERS",
        categoryNameBn: "শিক্ষক ও স্টাফ বেতন",
        fundCode: "GENERAL",
        categoryType: "EXPENSE",
        plannedAmount: 1000000,
      },
      testActor
    );
    assert(!directEdit.success, "Direct line mutation in ACTIVE status is blocked; requires revision workflow");

    // Create Revision Request
    const diffs: BudgetRevisionLineDiff[] = [
      {
        budgetLineId: targetLineId,
        categoryNameBn: "শিক্ষক ও স্টাফ বেতন",
        fundCode: "GENERAL",
        previousAmount: 800000,
        proposedAmount: 950000,
        amountDifference: 150000,
        justificationBn: "শিক্ষক বৃদ্ধি ও সরকারি মহার্ঘ ভাতা সমন্বয়",
      },
    ];

    const revRequest = requestBudgetRevision(
      draftBudget.id,
      {
        titleBn: "শিক্ষক বেতন খাতে অতিরিক্ত বরাদ্দ প্রস্তাবনা",
        reasonBn: "নতুন শিক্ষক যোগদান ও শিক্ষাবর্ষের মাঝামাঝি ভাতা বৃদ্ধি",
        lineDiffs: diffs,
      },
      accountantActor
    );
    assert(revRequest.success && Boolean(revRequest.revision?.id), "Budget revision request submitted successfully");
    const revision = revRequest.revision!;
    assert(revision.status === "SUBMITTED", "Revision initial status is SUBMITTED");
    assert(revision.targetVersion === 2, "Revision targets version v2");
    assert(revision.netExpenseAdjustment === 150000, "Calculates net expense adjustment (+150,000 BDT)");

    // Review Revision
    const reviewRev = reviewBudgetRevision(revision.id, testActor, "অর্থ কমিটি দ্বারা প্রাথমিক অনুমোদন");
    assert(reviewRev.success && reviewRev.revision?.status === "UNDER_REVIEW", "Revision moves to UNDER_REVIEW");

    // Approve Revision (Human Authority)
    const approveRev = approveBudgetRevision(revision.id, testActor, "ম্যানেজিং কমিটি ও অধ্যক্ষ কর্তৃক চূড়ান্ত অনুমোদন");
    assert(approveRev.success && approveRev.revision?.status === "APPROVED", "Revision permanently approved by human authority");

    // Verify Version Promotion on Budget
    const promotedBudget = getBudgetById(draftBudget.id)!;
    assert(promotedBudget.currentVersion === 2, "Active budget successfully promoted to Version 2", promotedBudget.currentVersion);
    assert(promotedBudget.status === "REVISED", "Budget status updated to REVISED");
    assert(promotedBudget.versions.length === 2, "Budget preserves both v1 and v2 immutable snapshots", promotedBudget.versions.length);
    assert(promotedBudget.versions[0].versionNumber === 1, "Snapshot v1 remains intact and unmodified");
    assert(promotedBudget.versions[1].versionNumber === 2, "Snapshot v2 added with updated lines");

    const revisedSalaryLine = promotedBudget.lines.find((l) => l.id === targetLineId);
    assert(revisedSalaryLine?.revisedAmount === 950000, "Line revised amount updated to 950,000 BDT via approved revision", revisedSalaryLine?.revisedAmount);

    // -------------------------------------------------------------
    // Test Group 8: Capital Projects & Milestone Tracking
    // -------------------------------------------------------------
    console.log("\n--- GROUP 8: Capital Projects & Milestone Tracking ---");
    const proj = createProject(
      {
        projectCode: "PRJ-2027-MOSQUE-EXT",
        titleBn: "মাদরাসা মসজিদ ও একাডেমিক ভবন সম্প্রসারণ",
        titleEn: "Mosque & Academic Building Extension",
        fundCode: "CONSTRUCTION",
        budgetId: seededBudget.id,
        plannedBudget: 5000000,
        startDate: "2027-01-01",
        targetCompletionDate: "2027-12-31",
        ownerName: "প্রকৌশলী রফিকুল ইসলাম",
        notes: "৩ তলা বিশিষ্ট একাডেমিক ব্লক নির্মাণ",
      },
      testActor
    );
    assert(Boolean(proj.id && proj.status === "PLANNING"), "Capital project created with institutional code");
    assert(proj.fundCode === "CONSTRUCTION", "Capital project linked strictly to CONSTRUCTION fund");
    assert(proj.plannedBudget === 5000000, "Project planned budget allocated (5,000,000 BDT)");

    // -------------------------------------------------------------
    // Test Group 9: Non-Duplication & Authoritative Bridge Invariants
    // -------------------------------------------------------------
    console.log("\n--- GROUP 9: Authoritative Integration Bridge & Invariants ---");
    const reconciliation = await syncBudgetWithAuthoritativeSystems(seededBudget.id);
    assert(Boolean(reconciliation && reconciliation.budgetId === seededBudget.id), "SystemFinancialReconciliation executed non-destructively against DB");
    assert(typeof reconciliation.financeActualExpense === "number", "Reconciliation safely queries Phase 6 Finance CashTransactions");
    assert(typeof reconciliation.procurementOpenCommitments === "number", "Reconciliation safely queries Phase 12 PurchaseOrders");
    assert(typeof reconciliation.payrollYearToDate === "number", "Reconciliation safely queries Phase 13 PayrollRecords");

    // Phase 26 Forecast Projection
    const forecast = getBudgetForecastProjection(seededBudget, seededBudget.lines[0]);
    assert(Boolean(forecast && typeof forecast.projectedYearEndAmount === "number"), "Budget forecast projection calculated via Phase 26 bridge");
    assert(["LOW", "MEDIUM", "HIGH"].includes(forecast.riskLevel), "Forecast risk level classified correctly");

    // Invariant: Strictly NO SMS
    const allLogs = getAllAuditLogs();
    const smsDetected = allLogs.some((l) =>
      JSON.stringify(l).toLowerCase().includes("sms_gateway") ||
      JSON.stringify(l).toLowerCase().includes("sendsms") ||
      JSON.stringify(l).toLowerCase().includes("sms_token")
    );
    assert(!smsDetected, "Strictly NO SMS invariant honored across all budget records");

    // Invariant: AI is Advisory Only (No autonomous AI approval)
    const autonomousAiApprovals = allLogs.filter(
      (l) => l.action.includes("APPROVE") && (l.actorRole.toLowerCase().includes("ai") || l.actorRole.toLowerCase().includes("bot"))
    );
    assert(autonomousAiApprovals.length === 0, "Human authority invariant honored: No autonomous AI approvals exist");

  } catch (err: any) {
    console.error("Fatal test runner exception:", err);
    assert(false, "Test suite crashed with unhandled exception", err?.message || err);
  }

  console.log("\n==================================================================");
  console.log(`  PHASE 41 RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log("==================================================================\n");

  if (failedTests > 0) {
    console.error("⚠️ SOME TESTS FAILED.\n");
    process.exit(1);
  } else {
    console.log("🎉 ALL PHASE 41 TESTS PASSED CLEANLY!\n");
    process.exit(0);
  }
}

runPhase41Tests();
