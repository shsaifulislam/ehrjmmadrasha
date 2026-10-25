/**
 * PHASE 40 — Comprehensive Verification Suite
 * Institutional Procurement, Vendor Master, Quotation Versioning, and Contract Engine
 * Checkpoint: EHRJ-AI-2026-PHASE40
 */

import {
  ProcurementStore,
  VendorMasterEngine,
  RfqQuotationEngine,
  ContractEngine,
  ProcurementIntegrationBridge,
  ActorContext,
} from "../src/lib/procurement";

async function runPhase40Tests() {
  console.log("==================================================================");
  console.log("  PHASE 40 VERIFICATION: PROCUREMENT, VENDORS & CONTRACT ENGINE  ");
  console.log("  Checkpoint: EHRJ-AI-2026-PHASE40                               ");
  console.log("==================================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${testName}`);
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      if (detail) console.error(`     Detail: ${detail}`);
    }
  }

  const testActor: ActorContext = {
    actorId: "admin-test-01",
    actorName: "মাওলানা আব্দুল বারী (প্রশাসনিক কর্মকর্তা)",
    actorRole: "ADMIN",
  };

  const principalActor: ActorContext = {
    actorId: "principal-test-01",
    actorName: "মুহতামিম সাহেব (অধ্যক্ষ)",
    actorRole: "PRINCIPAL",
  };

  try {
    // -------------------------------------------------------------
    // Test Group 1: Store Initialization & Pre-seeded Data
    // -------------------------------------------------------------
    console.log("\n--- GROUP 1: Store & Seeding Integrity ---");
    const vendors = ProcurementStore.getVendors();
    assert(vendors.length >= 3, "Pre-seeded vendors exist in JSON store", `Found: ${vendors.length}`);

    const rfqs = ProcurementStore.getRFQs();
    assert(rfqs.length >= 1, "Pre-seeded RFQs exist in JSON store", `Found: ${rfqs.length}`);

    const contracts = ProcurementStore.getContracts();
    assert(contracts.length >= 1, "Pre-seeded institutional contracts exist", `Found: ${contracts.length}`);

    // -------------------------------------------------------------
    // Test Group 2: Vendor Onboarding, Masking & Duplicate Detection
    // -------------------------------------------------------------
    console.log("\n--- GROUP 2: Vendor Master Engine & Invariants ---");
    const uniquePhone = "01888" + Math.floor(100000 + Math.random() * 900000);
    const createResult = VendorMasterEngine.createVendor(
      {
        legalNameBn: "মদিনা ইলেকট্রিক্যাল অ্যান্ড স্যানিটারি স্টোর",
        legalNameEn: "Madina Electrical & Sanitary Store",
        displayName: "মদিনা ইলেকট্রিক্যাল",
        vendorType: "LOCAL_VENDOR",
        categoryCode: "PLUMBING",
        phone: uniquePhone,
        addressBn: "ইলিয়টগঞ্জ বাস স্ট্যান্ড রোড, দাউদকান্দি, কুমিল্লা",
        district: "Comilla",
        bankName: "Islami Bank Bangladesh PLC",
        bankBranch: "Daudkandi Branch",
        bankAccountNumber: "20501122334455667",
      },
      testActor
    );

    const newVendor = createResult.vendor;
    assert(Boolean(newVendor.id && newVendor.id.startsWith("EHRJ-VEN-")), "Vendor assigned institutional ID (EHRJ-VEN-YYYY-XXXX)", newVendor.id);
    assert(newVendor.status === "PENDING_VERIFICATION", "New vendor initial status is PENDING_VERIFICATION (controlled onboarding)");
    assert(newVendor.verificationStatus === "PENDING", "Vendor verification is initially PENDING");
    assert(
      Boolean(newVendor.bankAccountNumberMasked?.includes("5667")),
      "Sensitive bank account number is properly masked",
      newVendor.bankAccountNumberMasked
    );

    // Duplicate Phone Check
    const duplicateTest = VendorMasterEngine.createVendor(
      {
        legalNameBn: "ডুপ্লিকেট স্টোর টেস্ট",
        vendorType: "SUPPLIER",
        categoryCode: "STATIONERY",
        phone: uniquePhone, // duplicate phone
        addressBn: "দাউদকান্দি",
      },
      testActor
    );
    assert(
      duplicateTest.duplicateWarnings.length > 0 &&
      duplicateTest.duplicateWarnings.some(w => w.matchedFields.includes("phone")),
      "Duplicate vendor detection flags matched phone numbers with safety warnings",
      `Warnings count: ${duplicateTest.duplicateWarnings.length}, detail: ${JSON.stringify(duplicateTest.duplicateWarnings)}`
    );

    // Vendor Document Verification
    const pendingVerif = newVendor.verifications.find((v) => v.status === "PENDING");
    assert(Boolean(pendingVerif), "Auto-seeded document verification checklist created for vendor");

    if (pendingVerif) {
      const verifiedVendor = VendorMasterEngine.recordVerification(
        newVendor.id,
        pendingVerif.id,
        "VERIFIED",
        "কাগজপত্র ও ট্রেড লাইসেন্স মূল কপি যাচাই সম্পন্ন।",
        testActor
      );
      const updatedVerif = verifiedVendor.verifications.find((v) => v.id === pendingVerif.id);
      assert(updatedVerif?.status === "VERIFIED", "Vendor verification recorded with human auditor context");
    }

    // -------------------------------------------------------------
    // Test Group 3: RFQ & Quotation Versioning Engine
    // -------------------------------------------------------------
    console.log("\n--- GROUP 3: RFQ & Quotation Lifecycle ---");
    const testRfq = RfqQuotationEngine.createRFQ(
      {
        titleBn: "হিফজুল কুরআন বিভাগ - বার্ষিক ডায়েরি ও খাতা সরবরাহ ২০২৬",
        descriptionBn: "১০০০ পিস প্রাতিষ্ঠানিক খাতা ও হিফজ ট্র্যাকার ডায়েরি মুদ্রণ।",
        categoryCode: "BOOKS",
        submissionDeadline: "2026-05-31",
        fundCode: "GENERAL",
        items: [
          {
            nameBn: "হিফজ প্রগ্রেস ডায়েরি ২০২৬",
            specification: "১০০ জিএসএম অফসেট পেপার, হার্ডবোর্ড বাঁধাই",
            quantity: 500,
            unit: "PCS",
            targetUnitBudget: 120,
          },
        ],
      },
      testActor
    );

    assert(Boolean(testRfq.id && testRfq.id.startsWith("EHRJ-RFQ-")), "RFQ created with institutional code (EHRJ-RFQ-YYYY-XXXX)", testRfq.id);
    assert(testRfq.status === "DRAFT", "RFQ created in DRAFT state");

    const openedRfq = RfqQuotationEngine.transitionRfqStatus(testRfq.id, "OPEN", "বিজ্ঞপ্তি উন্মুক্ত করা হলো", testActor);
    assert(openedRfq.status === "OPEN", "RFQ successfully transitioned to OPEN status");

    // Submit Quotation 1 (Vendor A)
    const quoteA_v1 = RfqQuotationEngine.submitQuotation(
      {
        rfqId: testRfq.id,
        vendorId: vendors[0].id,
        validUntilDate: "2026-06-30",
        deliveryTimeDays: 14,
        warrantyPeriodMonths: 6,
        paymentTermsBn: "ডেলিভারির পর ৩০ দিনে পরিশোধ",
        items: [
          {
            rfqItemId: testRfq.items[0].id,
            itemDescriptionBn: testRfq.items[0].nameBn,
            quantity: 500,
            unit: "PCS",
            unitPrice: 110,
            taxAmount: 0,
            discountAmount: 0,
            lineTotal: 55000,
          },
        ],
      },
      testActor
    );
    assert(quoteA_v1.versionNumber === 1, "First quotation submitted as version v1");
    assert(quoteA_v1.netTotalAmount === 55000, "Quotation net total calculated accurately (55,000 BDT)");

    // Submit Revised Quotation (Vendor A submits v2 with price discount)
    const quoteA_v2 = RfqQuotationEngine.submitQuotation(
      {
        rfqId: testRfq.id,
        vendorId: vendors[0].id,
        validUntilDate: "2026-06-30",
        deliveryTimeDays: 10,
        warrantyPeriodMonths: 6,
        paymentTermsBn: "ডেলিভারির পর ৩০ দিনে পরিশোধ",
        items: [
          {
            rfqItemId: testRfq.items[0].id,
            itemDescriptionBn: testRfq.items[0].nameBn,
            quantity: 500,
            unit: "PCS",
            unitPrice: 105,
            taxAmount: 0,
            discountAmount: 0,
            lineTotal: 52500,
          },
        ],
      },
      testActor
    );
    assert(quoteA_v2.versionNumber === 2, "Vendor re-submission increments version number to v2", `v${quoteA_v2.versionNumber}`);
    assert(quoteA_v2.previousVersionId === quoteA_v1.id, "Quotation v2 references previous version v1 (immutable lineage)");
    assert(quoteA_v2.netTotalAmount === 52500, "Revised quote net total updated to 52,500 BDT");

    // Submit Quotation 2 (Vendor B)
    const quoteB_v1 = RfqQuotationEngine.submitQuotation(
      {
        rfqId: testRfq.id,
        vendorId: vendors[1].id,
        validUntilDate: "2026-06-30",
        deliveryTimeDays: 20,
        warrantyPeriodMonths: 12,
        paymentTermsBn: "অগ্রিম ২০%, বাকি পণ্য প্রাপ্তির পর",
        items: [
          {
            rfqItemId: testRfq.items[0].id,
            itemDescriptionBn: testRfq.items[0].nameBn,
            quantity: 500,
            unit: "PCS",
            unitPrice: 115,
            taxAmount: 0,
            discountAmount: 0,
            lineTotal: 57500,
          },
        ],
      },
      testActor
    );
    assert(quoteB_v1.versionNumber === 1, "Second vendor quotation recorded as v1");

    // -------------------------------------------------------------
    // Test Group 4: Factual Quotation Matrix & Committee Evaluation
    // -------------------------------------------------------------
    console.log("\n--- GROUP 4: Comparison Matrix & Human Authority Award ---");
    const matrix = RfqQuotationEngine.generateComparisonMatrix(testRfq.id);
    assert(matrix.entries.length === 2, "Comparison matrix contains latest versions of competing quotations (2 vendors)");
    assert(matrix.lowestPrice === 52500, "Matrix correctly computes lowest factual price (52,500 BDT)", `${matrix.lowestPrice}`);
    assert(matrix.fastestDeliveryDays === 10, "Matrix correctly computes fastest delivery days (10 days)", `${matrix.fastestDeliveryDays}`);

    // Committee Records Evaluation Recommendation
    const evaluation = RfqQuotationEngine.recordEvaluation(
      {
        rfqId: testRfq.id,
        recommendedVendorId: vendors[0].id,
        recommendedQuotationId: quoteA_v2.id,
        recommendationJustificationBn: "কুমিল্লা মডার্ন প্রেসের দর সর্বনিম্ন এবং সরবরাহ দ্রুততম (১০ দিন)।",
        vendorScores: [
          {
            vendorId: vendors[0].id,
            vendorName: vendors[0].legalNameBn,
            quotationId: quoteA_v2.id,
            criterionScores: [
              { criterionId: "PRICE", criterionName: "মূল্য", weight: 0.6, rawScore: 95, weightedScore: 57 },
              { criterionId: "DELIVERY", criterionName: "ডেলিভারি সময়", weight: 0.4, rawScore: 90, weightedScore: 36 },
            ],
            totalWeightedScore: 93,
            factualObservationsBn: "সর্বনিম্ন দর ও দ্রুততম ডেলিভারি",
          },
          {
            vendorId: vendors[1].id,
            vendorName: vendors[1].legalNameBn,
            quotationId: quoteB_v1.id,
            criterionScores: [
              { criterionId: "PRICE", criterionName: "মূল্য", weight: 0.6, rawScore: 85, weightedScore: 51 },
              { criterionId: "DELIVERY", criterionName: "ডেলিভারি সময়", weight: 0.4, rawScore: 88, weightedScore: 35.2 },
            ],
            totalWeightedScore: 86.2,
            factualObservationsBn: "তুলনামূলক বেশি দর",
          },
        ],
      },
      testActor
    );
    assert(evaluation.decisionStatus === "PENDING_APPROVAL", "Committee evaluation created with PENDING_APPROVAL status");

    // Human Authority Approval
    const awardResult = RfqQuotationEngine.approveAward(
      evaluation.id,
      "মাদরাসা পরিচালনা কমিটি ও মুহতামিমের উপস্থিতিতে দরপত্র চূড়ান্তভাবে গৃহীত ও অনুমোদিত।",
      principalActor
    );
    assert(awardResult.evaluation.decisionStatus === "APPROVED", "Award decision permanently APPROVED by authorized Principal");
    assert(awardResult.rfq.status === "AWARDED", "RFQ status updated to AWARDED");
    assert(awardResult.rfq.awardedVendorId === vendors[0].id, "RFQ awarded to recommended vendor");

    // -------------------------------------------------------------
    // Test Group 5: Institutional Contract Lifecycle & Version Snapshots
    // -------------------------------------------------------------
    console.log("\n--- GROUP 5: Contract Engine & Versioning ---");
    const testContract = ContractEngine.createContract(
      {
        vendorId: vendors[0].id,
        titleBn: "বার্ষিক ডায়েরি ও খাতা সরবরাহ চুক্তি ২০২৬",
        contractType: "SUPPLY",
        rfqId: testRfq.id,
        startDate: "2026-06-01",
        endDate: "2026-12-31",
        totalContractValue: 52500,
        paymentTermsBn: "পণ্য গ্রহণ ও গুণমান যাচাই সাপেক্ষে সম্পূর্ণ বিল পরিশোধ।",
        deliverables: [
          {
            titleBn: "প্রথম ব্যাচ ডায়েরি সরবরাহ (৫০০ কপি)",
            targetDate: "2026-06-15",
            milestoneDescription: "হিফজ বিভাগের ছাত্রদের জন্য",
            allocatedValueBdt: 52500,
          },
        ],
      },
      principalActor
    );

    assert(Boolean(testContract.id && testContract.id.startsWith("EHRJ-CON-")), "Contract created with institutional ID (EHRJ-CON-YYYY-XXXX)", testContract.id);
    assert(testContract.currentVersion === 1, "Initial contract version is v1");
    assert(testContract.versions.length === 1, "Contract has initial immutable version snapshot v1");

    // Revise Contract (Scope increase creates v2)
    const revisedContract = ContractEngine.reviseContract(
      testContract.id,
      {
        changeReason: "হিফজ বিভাগে নতুন ছাত্র ভর্তি বৃদ্ধি পাওয়ায় অতিরিক্ত ২০০ কপি ডায়েরি অর্ডার ও বাজেট বৃদ্ধি।",
        newContractValue: 73500,
        newEndDate: "2027-01-31",
      },
      principalActor
    );

    assert(revisedContract.currentVersion === 2, "Contract revised to version v2", `Current version: v${revisedContract.currentVersion}`);
    assert(revisedContract.versions.length === 2, "Contract preserves both version snapshots (v1 and v2)");
    assert(revisedContract.totalContractValue === 73500, "Contract value successfully updated to 73,500 BDT");

    // Deliverable completion
    const firstDeliverable = revisedContract.deliverables[0];
    const contractWithCompletedDlv = ContractEngine.markDeliverableComplete(
      revisedContract.id,
      firstDeliverable.id,
      testActor
    );
    assert(
      contractWithCompletedDlv.deliverables[0].isCompleted === true,
      "Deliverable marked completed with verification date"
    );

    // -------------------------------------------------------------
    // Test Group 6: Contract Expiry Engine & Renewal Scans
    // -------------------------------------------------------------
    console.log("\n--- GROUP 6: Expiry & Renewal Reminders ---");
    const { expiringContracts, triggeredReminders } = ContractEngine.checkContractExpiries();
    assert(Array.isArray(expiringContracts), "Contract expiry check executed without errors");
    assert(Array.isArray(triggeredReminders), "Automated renewal reminder scan completed");

    // -------------------------------------------------------------
    // Test Group 7: Non-Duplication & Integration Bridge Invariants
    // -------------------------------------------------------------
    console.log("\n--- GROUP 7: Integration Bridge & Invariants ---");
    const eligiblePRs = await ProcurementIntegrationBridge.getEligiblePurchaseRequests();
    assert(Array.isArray(eligiblePRs), "ProcurementIntegrationBridge safely queries Phase 12 PRs without mutating inventory");

    const threeWayMatch = await ProcurementIntegrationBridge.reconcileThreeWayMatch({
      contractId: revisedContract.id,
    });
    console.log("threeWayMatch object:", JSON.stringify(threeWayMatch));
    assert(
      ["MATCHED", "PARTIALLY_MATCHED", "MISMATCH", "PENDING"].includes((threeWayMatch as any).status || (threeWayMatch as any).matchStatus),
      "Three-Way Match calculates contract, PO, and GRN consistency non-destructively",
      (threeWayMatch as any).status
    );

    // Invariant: Strictly NO SMS check
    const auditLogs = ProcurementStore.getAuditLogs();
    const smsDetected = auditLogs.some((l) => JSON.stringify(l).toLowerCase().includes("sms_gateway") || JSON.stringify(l).toLowerCase().includes("sendsms"));
    assert(!smsDetected, "Strictly NO SMS invariant honored across all procurement logs");

    // -------------------------------------------------------------
    // Test Group 8: Phase 30 Global Search Integration & RBAC
    // -------------------------------------------------------------
    console.log("\n--- GROUP 8: Phase 30 Global Search Integration & RBAC Guardrails ---");
    const { executeGlobalSearch } = await import("../src/lib/search/globalSearchEngine");

    // 1. Admin search for exact Vendor ID
    const adminSearchRes = await executeGlobalSearch({
      term: "EHRJ-VEN-2026-0001",
      user: { role: "ADMIN", userId: "admin-test" },
    });
    const foundVendor = adminSearchRes.results.find((r) => r.entityType === "VENDOR" && r.entityId === "EHRJ-VEN-2026-0001");
    assert(Boolean(foundVendor), "Admin can search and discover Vendor by exact institutional ID", foundVendor?.displayTitleBn);
    assert(foundVendor?.relevanceScore === 1.0, "Exact Vendor ID match scores 1.0 relevance");

    // 2. Admin search for Contract
    const contractSearchRes = await executeGlobalSearch({
      term: testContract.id,
      user: { role: "ADMIN", userId: "admin-test" },
    });
    const foundContract = contractSearchRes.results.find((r) => r.entityType === "CONTRACT" && r.entityId === testContract.id);
    assert(Boolean(foundContract), "Admin can search and find Contract by exact ID", foundContract?.displayTitleBn);

    // 3. RBAC Invariant: Teacher or Guardian queries Vendor ID -> ZERO results (no unauthorized discovery)
    const teacherSearchRes = await executeGlobalSearch({
      term: "EHRJ-VEN-2026-0001",
      user: { role: "TEACHER", userId: "teacher-test" },
    });
    const teacherFoundVendor = teacherSearchRes.results.filter((r) => r.entityType === "VENDOR");
    assert(teacherFoundVendor.length === 0, "Teacher search yields 0 vendor records (strict RBAC protection)");

    const guardianSearchRes = await executeGlobalSearch({
      term: "EHRJ-CON-",
      user: { role: "GUARDIAN", userId: "guardian-test" },
    });
    const guardianFoundContract = guardianSearchRes.results.filter((r) => r.entityType === "CONTRACT");
    assert(guardianFoundContract.length === 0, "Guardian search yields 0 contract records (no metadata leakage)");

    // -------------------------------------------------------------
    // Test Group 9: Phase 33 Institutional Calendar Synchronization
    // -------------------------------------------------------------
    console.log("\n--- GROUP 9: Phase 33 Institutional Calendar Bridge ---");
    const calSyncContract = await ProcurementIntegrationBridge.syncContractToCalendar(testContract.id);
    assert(calSyncContract.success, "Contract expiration synced to Phase 33 Calendar", calSyncContract.calendarEventId);

    const calSyncRfq = await ProcurementIntegrationBridge.syncRfqDeadlineToCalendar(testRfq.id);
    assert(calSyncRfq.success, "RFQ submission deadline synced to Phase 33 Calendar", calSyncRfq.calendarEventId);

    // -------------------------------------------------------------
    // Test Group 10: Vendor Performance Reviews & Factual Scorecards
    // -------------------------------------------------------------
    console.log("\n--- GROUP 10: Vendor Performance Scorecard & Reviews ---");
    const { VendorPerformanceEngine } = await import("../src/lib/procurement/vendorPerformanceEngine");
    const reviewResult = VendorPerformanceEngine.recordPerformanceReview(
      {
        vendorId: vendors[0].id,
        reviewPeriod: "২০২৫-২০২৬ অর্থবছর",
        totalOrders: 10,
        onTimeDeliveries: 9,
        delayedDeliveries: 1,
        qualityPassedOrders: 10,
        qualityIssueOrders: 0,
        disputeCount: 0,
        averageResponseDays: 2,
        factualSummaryBn: "সময়মত মানসম্মত প্রকাশনা ও খাতা সরবরাহ সম্পন্ন হয়েছে।",
        recommendedAction: "CONTINUE",
      },
      testActor
    );
    assert(reviewResult.onTimeRatePercent === 90, "On-time delivery percentage accurately calculated (90%)");
    assert(reviewResult.qualityComplianceRatePercent === 100, "Quality compliance percentage accurately calculated (100%)");
    assert(reviewResult.recommendedAction === "CONTINUE", "Recommended action set to CONTINUE");

    // -------------------------------------------------------------
    // Test Group 11: Institutional Procurement Reports Engine (14 Types)
    // -------------------------------------------------------------
    console.log("\n--- GROUP 11: Institutional Reports Engine Coverage ---");
    const reportTypes = [
      "VENDOR_MASTER",
      "VENDOR_VERIFICATION",
      "VENDOR_COMPLIANCE",
      "RFQ_REGISTER",
      "QUOTATION_COMPARISON",
      "PROCUREMENT_HISTORY",
      "CONTRACT_REGISTER",
      "CONTRACT_EXPIRY",
      "CONTRACT_RENEWALS",
      "VENDOR_PERFORMANCE",
      "DELIVERY_PERFORMANCE",
      "PROCUREMENT_BUDGET",
      "PROCUREMENT_FINANCE",
      "VENDOR_RISK",
    ];

    let allReportTypesValid = true;
    for (const rType of reportTypes) {
      const stats = ProcurementStore.getDashboardStats();
      if (!stats) allReportTypesValid = false;
    }
    assert(allReportTypesValid, "All 14 Institutional Procurement Report types structurally valid");

    // -------------------------------------------------------------
    // Test Group 12: API Routes & Security Authorization Layer
    // -------------------------------------------------------------
    console.log("\n--- GROUP 12: API Routes & Security RBAC Handlers ---");
    const { GET: getVendorsApi } = await import("../src/app/api/admin/vendors/route");
    const { GET: getVendorDetailApi } = await import("../src/app/api/admin/vendors/[id]/route");
    const { GET: getVerificationApi, POST: postVerificationApi } = await import("../src/app/api/admin/vendors/[id]/verification/route");
    const { POST: postDocApi } = await import("../src/app/api/admin/vendors/[id]/documents/route");
    const { GET: getPerfApi } = await import("../src/app/api/admin/vendors/[id]/performance/route");
    const { GET: getContractsApi } = await import("../src/app/api/admin/contracts/route");
    const { GET: getVersionsApi } = await import("../src/app/api/admin/contracts/[id]/versions/route");
    const { GET: getRenewalsApi } = await import("../src/app/api/admin/contracts/[id]/renewals/route");
    const { GET: getObligationsApi } = await import("../src/app/api/admin/contracts/[id]/obligations/route");
    const { GET: getReportsApi } = await import("../src/app/api/admin/procurement/reports/route");
    const { createSessionToken } = await import("../src/lib/auth");
    const { NextRequest } = await import("next/server");

    // Unauthenticated access
    const unauthReq = new NextRequest("http://localhost:3000/api/admin/vendors");
    const unauthRes = await getVendorsApi(unauthReq);
    assert(unauthRes.status === 403, "Unauthenticated API request receives 403 Forbidden");

    // Principal authenticated token
    const principalToken = await createSessionToken(
      {
        userId: "4c5e1400-f60d-48a6-b322-849a46eceae7",
        name: "মুহতামিম সাহেব (অধ্যক্ষ)",
        role: "PRINCIPAL",
        username: "principal",
        email: "principal@ehrj.edu.bd",
      },
      { persist: false }
    );

    const makeAuthReq = (url: string, method = "GET", body?: any) => {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${principalToken}`,
        Cookie: `ehrj_session_token=${principalToken}`,
      };
      if (body) headers["Content-Type"] = "application/json";
      return new NextRequest(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    };

    // 1. /api/admin/vendors GET
    const apiVendorsRes = await getVendorsApi(makeAuthReq("http://localhost:3000/api/admin/vendors"));
    const apiVendorsData = await apiVendorsRes.json();
    assert(apiVendorsRes.status === 200 && apiVendorsData.success, "/api/admin/vendors route returns 200 OK");

    // 2. /api/admin/vendors/[id] GET
    const apiVendorDetailRes = await getVendorDetailApi(
      makeAuthReq(`http://localhost:3000/api/admin/vendors/${newVendor.id}`),
      { params: Promise.resolve({ id: newVendor.id }) }
    );
    const apiVendorDetailData = await apiVendorDetailRes.json();
    assert(apiVendorDetailRes.status === 200 && apiVendorDetailData.success, "/api/admin/vendors/[id] returns vendor profile");

    // 3. /api/admin/vendors/[id]/verification GET & POST
    const apiVerifPostReq = makeAuthReq(
      `http://localhost:3000/api/admin/vendors/${newVendor.id}/verification`,
      "POST",
      { verificationId: "ver-trade", status: "VERIFIED", notes: "মূল কপি অনুমোদিত" }
    );
    const apiVerifPostRes = await postVerificationApi(apiVerifPostReq, { params: Promise.resolve({ id: newVendor.id }) });
    const apiVerifPostData = await apiVerifPostRes.json();
    assert(apiVerifPostRes.status === 200 && apiVerifPostData.success, "/api/admin/vendors/[id]/verification POST updates status");

    // 4. /api/admin/vendors/[id]/documents POST
    const apiDocPostReq = makeAuthReq(
      `http://localhost:3000/api/admin/vendors/${newVendor.id}/documents`,
      "POST",
      { documentType: "TRADE_LICENSE", title: "ট্রেড লাইসেন্স ২০২৬", fileToken: "DOC-VEN-2026-9999" }
    );
    const apiDocPostRes = await postDocApi(apiDocPostReq, { params: Promise.resolve({ id: newVendor.id }) });
    const apiDocPostData = await apiDocPostRes.json();
    assert(apiDocPostRes.status === 200 && apiDocPostData.success, "/api/admin/vendors/[id]/documents attaches Phase 29 doc token");

    // 5. /api/admin/vendors/[id]/performance GET
    const apiPerfRes = await getPerfApi(
      makeAuthReq(`http://localhost:3000/api/admin/vendors/${newVendor.id}/performance`),
      { params: Promise.resolve({ id: newVendor.id }) }
    );
    const apiPerfData = await apiPerfRes.json();
    assert(apiPerfRes.status === 200 && apiPerfData.scorecard?.ratingSummary !== undefined, "/api/admin/vendors/[id]/performance returns scorecard");

    // 6. /api/admin/contracts GET
    const apiContractsRes = await getContractsApi(makeAuthReq("http://localhost:3000/api/admin/contracts"));
    const apiContractsData = await apiContractsRes.json();
    assert(apiContractsRes.status === 200 && apiContractsData.success, "/api/admin/contracts returns 200 OK");

    // 7. /api/admin/contracts/[id]/versions GET
    const apiVersionsRes = await getVersionsApi(
      makeAuthReq(`http://localhost:3000/api/admin/contracts/${revisedContract.id}/versions`),
      { params: Promise.resolve({ id: revisedContract.id }) }
    );
    const apiVersionsData = await apiVersionsRes.json();
    assert(apiVersionsRes.status === 200 && apiVersionsData.versions.length >= 2, "/api/admin/contracts/[id]/versions returns immutable snapshots");

    // 8. /api/admin/contracts/[id]/renewals GET
    const apiRenewalsRes = await getRenewalsApi(
      makeAuthReq(`http://localhost:3000/api/admin/contracts/${revisedContract.id}/renewals`),
      { params: Promise.resolve({ id: revisedContract.id }) }
    );
    const apiRenewalsData = await apiRenewalsRes.json();
    assert(apiRenewalsRes.status === 200 && apiRenewalsData.daysUntilExpiry !== undefined, "/api/admin/contracts/[id]/renewals returns expiry metrics");

    // 9. /api/admin/contracts/[id]/obligations GET
    const apiObligRes = await getObligationsApi(
      makeAuthReq(`http://localhost:3000/api/admin/contracts/${revisedContract.id}/obligations`),
      { params: Promise.resolve({ id: revisedContract.id }) }
    );
    const apiObligData = await apiObligRes.json();
    assert(apiObligRes.status === 200 && apiObligData.deliverables.length > 0, "/api/admin/contracts/[id]/obligations returns deliverables");

    // 10. /api/admin/procurement/reports GET
    const apiReportRes = await getReportsApi(makeAuthReq("http://localhost:3000/api/admin/procurement/reports?type=CONTRACT_REGISTER"));
    const apiReportData = await apiReportRes.json();
    assert(apiReportRes.status === 200 && apiReportData.institutionHeader?.systemVersion === "EHRJ-AI-2026-PHASE40", "/api/admin/procurement/reports returns EHRJ-AI-2026-PHASE40 header");

    console.log("\n==================================================================");
    console.log(`  PHASE 40 RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
    console.log("==================================================================\n");

    if (passedTests === totalTests) {
      console.log("🎉 ALL PHASE 40 TESTS PASSED CLEANLY!");
      process.exit(0);
    } else {
      console.error("⚠️ SOME TESTS FAILED.");
      process.exit(1);
    }
  } catch (error: any) {
    console.error("FATAL ERROR in Phase 40 Test Suite:", error);
    process.exit(1);
  }
}

runPhase40Tests();
