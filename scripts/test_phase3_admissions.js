const http = require("http");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BASE_URL = "http://localhost:3000";

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || "GET",
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      headers: {
        "x-test-suite": "ehrj-phase-3",
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          json,
        });
      });
    });

    req.on("error", reject);

    if (options.body) {
      req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runPhase3Tests() {
  console.log("=================================================================");
  console.log("  EHRJ DIGITAL CAMPUS - PHASE 3 ADMISSION & ENROLLMENT TEST SUITE");
  console.log("=================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 0. Setup: Log in as Admin and Teacher to get session cookies
    console.log("--- 0. Authentication Setup ---");
    const adminLoginRes = await makeRequest("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        identifier: "adminehrjmadrasha@gmail.com",
        password: "AdminEhrj@2026!",
      },
    });

    const adminCookies = adminLoginRes.headers["set-cookie"]
      ? adminLoginRes.headers["set-cookie"].map((c) => c.split(";")[0]).join("; ")
      : "";

    assert(adminLoginRes.statusCode === 200 && adminCookies.includes("ehrj_session_token"), "Admin login succeeded with session cookie");

    const teacherLoginRes = await makeRequest("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        identifier: "teacherehrjmadrasha@gmail.com",
        password: "Teacher@2026!",
      },
    });

    const teacherCookies = teacherLoginRes.headers["set-cookie"]
      ? teacherLoginRes.headers["set-cookie"].map((c) => c.split(";")[0]).join("; ")
      : "";

    assert(teacherLoginRes.statusCode === 200 && teacherCookies.includes("ehrj_session_token"), "Teacher login succeeded with session cookie");

    // Fetch an existing class to use for test admissions
    const targetClass = await prisma.jamatClass.findFirst({ where: { isActive: true } });
    assert(!!targetClass, `Active JamatClass found for testing (${targetClass?.nameBn})`);
    const testClassId = targetClass.id;

    // 1. Online Application Submission & Tracking ID Generation
    console.log("\n--- 1. Online Application Submission & Tracking ID ---");
    const testBirthReg1 = `20159999${Date.now().toString().slice(-9)}`;
    const idempotencyToken1 = `TOKEN-PH3-${Date.now()}`;

    const app1Res = await makeRequest("/api/admissions/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        studentNameBn: "মুহাম্মদ আবু বকর সিদ্দিক",
        studentNameEn: "MUHAMMAD ABU BAKR SIDDIQUE",
        studentNameAr: "محمد أبو بكر الصديق",
        dateOfBirth: "2015-05-15",
        gender: "MALE",
        desiredClassId: testClassId,
        desiredResidentialStatus: "RESIDENTIAL",
        guardianName: "মাওলানা আব্দুর রহমান",
        guardianPhone: "01811223344",
        guardianRelation: "FATHER",
        address: "পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি",
        birthCertificateNo: testBirthReg1,
        isOrphan: true, // test orphan fee waiver
        submissionToken: idempotencyToken1,
      },
    });

    assert(app1Res.statusCode === 200, "Online application submitted successfully (HTTP 200)");
    const app1Data = app1Res.json;
    const trackingId1 = app1Data?.applicationNumber;
    assert(
      /^EHRJ-ADM-\d{4}-\d{4}$/.test(trackingId1),
      `Tracking ID correctly formatted as EHRJ-ADM-YYYY-XXXX: ${trackingId1}`
    );
    assert(app1Data?.application?.status === "SUBMITTED", "Initial application status is SUBMITTED");
    assert(app1Data?.application?.source === "ONLINE", "Application source marked as ONLINE");

    // 2. Duplicate Submission Protection (Idempotency Token)
    console.log("\n--- 2. Duplicate Submission Idempotency Guard ---");
    const duplicateSubmitRes = await makeRequest("/api/admissions/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        studentNameBn: "মুহাম্মদ আবু বকর সিদ্দিক",
        dateOfBirth: "2015-05-15",
        desiredClassId: testClassId,
        guardianName: "মাওলানা আব্দুর রহমান",
        guardianPhone: "01811223344",
        submissionToken: idempotencyToken1, // SAME token
      },
    });

    assert(duplicateSubmitRes.statusCode === 200, "Duplicate submit returned 200 without error");
    assert(
      duplicateSubmitRes.json?.isDuplicateSubmission === true,
      "Duplicate submission flagged and prevented re-creation"
    );
    assert(
      duplicateSubmitRes.json?.applicationNumber === trackingId1,
      "Returned existing tracking ID safely"
    );

    // 3. Duplicate Detection Engine (High, Medium, Low Confidence)
    console.log("\n--- 3. Duplicate Record Detection Engine ---");
    // HIGH Confidence check: Same birth certificate number
    const dupCheckHigh = await makeRequest("/api/admissions/check-duplicate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        studentNameBn: "ভিন্ন নামধারী ছাত্র",
        guardianPhone: "01999887766",
        birthCertificateNo: testBirthReg1, // MATCHES previous application
      },
    });

    assert(dupCheckHigh.statusCode === 200, "Check duplicate API returned 200");
    const highMatches = dupCheckHigh.json?.matches || [];
    assert(
      highMatches.some((m) => m.confidence === "HIGH" && m.identifier === trackingId1),
      "HIGH confidence match detected by birth certificate number without blocking"
    );

    // MEDIUM Confidence check: Same phone + same DOB
    const dupCheckMed = await makeRequest("/api/admissions/check-duplicate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        studentNameBn: "আরেকজন শিক্ষার্থী",
        dateOfBirth: "2015-05-15",
        guardianPhone: "01811223344", // MATCHES phone
      },
    });
    const medMatches = dupCheckMed.json?.matches || [];
    assert(
      medMatches.some((m) => m.confidence === "MEDIUM"),
      "MEDIUM confidence match detected by Guardian phone + DOB"
    );

    // Non-blocking submission with duplicate warning
    const appWithWarningRes = await makeRequest("/api/admissions/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        studentNameBn: "মুহাম্মদ আবু বকর সিদ্দিক (২য় আবেদন)",
        dateOfBirth: "2015-05-15",
        desiredClassId: testClassId,
        guardianName: "মাওলানা আব্দুর রহমান",
        guardianPhone: "01811223344",
        address: "ইলিয়টগঞ্জ",
        birthCertificateNo: testBirthReg1,
      },
    });

    assert(appWithWarningRes.statusCode === 200, "Application with duplicate record was NOT rejected automatically");
    assert(appWithWarningRes.json?.hasDuplicateWarning === true, "Returned hasDuplicateWarning: true for Admin review");

    // 4. Office Admission Submission by Admin
    console.log("\n--- 4. Office Admission by Admin ---");
    const officeAppRes = await makeRequest("/api/admin/admissions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: {
        studentNameBn: "ওমর ফারুক",
        studentNameEn: "OMAR FARUK",
        dateOfBirth: "2016-01-20",
        gender: "MALE",
        desiredClassId: testClassId,
        desiredResidentialStatus: "DAY_CARE",
        guardianName: "মোঃ নুরুল ইসলাম",
        guardianPhone: "01722334455",
        guardianRelation: "FATHER",
        presentAddress: "দাউদকান্দি, কুমিল্লা",
        isOrphan: false,
      },
    });

    assert(officeAppRes.statusCode === 200, "Office admission created successfully by Admin");
    const officeAppData = officeAppRes.json?.application;
    assert(officeAppData?.source === "OFFICE", "Office application source is OFFICE");
    const officeAppId = officeAppData?.id;

    // 5. Admin Admission Dashboard & Metrics Listing
    console.log("\n--- 5. Admin Admission Dashboard & Filter API ---");
    const listRes = await makeRequest("/api/admin/admissions?status=ALL", {
      headers: { Cookie: adminCookies },
    });

    assert(listRes.statusCode === 200, "Admin admissions list fetched successfully");
    const stats = listRes.json?.stats;
    assert(stats && stats.TOTAL >= 2, `Stats total correctly counted: ${stats?.TOTAL}`);
    assert(listRes.json?.admissions?.length > 0, "Admissions records array returned");

    // 6. Admin Review Workflow Transitions
    console.log("\n--- 6. Workflow Transitions: Review, Verify, Exam, Correction ---");
    // SUBMITTED -> UNDER_REVIEW
    const reviewRes = await makeRequest(`/api/admin/admissions/${officeAppId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: { reviewNotes: "কাগজপত্র নিরীক্ষা করা হচ্ছে।" },
    });
    assert(reviewRes.statusCode === 200, "Transition to UNDER_REVIEW succeeded");
    assert(reviewRes.json?.application?.status === "UNDER_REVIEW", "Application status updated to UNDER_REVIEW");

    // UNDER_REVIEW -> VERIFICATION
    const verifyRes = await makeRequest(`/api/admin/admissions/${officeAppId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: { verificationStatus: "VERIFIED", verificationNotes: "মূল সনদসমূহ সঠিক পাওয়া গেছে।" },
    });
    assert(verifyRes.statusCode === 200, "Transition to VERIFICATION succeeded");
    assert(verifyRes.json?.application?.status === "VERIFICATION", "Status updated to VERIFICATION");
    assert(verifyRes.json?.application?.verificationStatus === "VERIFIED", "Verification status is VERIFIED");

    // VERIFICATION -> EXAM_INTERVIEW
    const examRes = await makeRequest(`/api/admin/admissions/${officeAppId}/exam-interview`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: { scheduledAt: new Date(Date.now() + 86400000).toISOString(), result: "PASS" },
    });
    assert(examRes.statusCode === 200, "Transition to EXAM_INTERVIEW succeeded");
    assert(examRes.json?.application?.status === "EXAM_INTERVIEW", "Status updated to EXAM_INTERVIEW");
    assert(examRes.json?.application?.examInterviewResult === "PASS", "Exam result set to PASS");

    // Correction Request on a test application
    const appToCorrect = await prisma.application.create({
      data: {
        applicationNumber: `EHRJ-ADM-${new Date().getFullYear()}-9901`,
        studentNameBn: "সংশোধন পরীক্ষার্থী",
        studentNameEn: "CORRECTION CANDIDATE",
        dateOfBirth: new Date("2016-02-02"),
        gender: "MALE",
        desiredClassId: testClassId,
        guardianName: "অভিভাবক",
        guardianPhone: "01700000001",
        address: "ইলিয়টগঞ্জ",
        status: "UNDER_REVIEW",
      },
    });

    const correctionRes = await makeRequest(`/api/admin/admissions/${appToCorrect.id}/correction`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: { correctionReason: "জন্ম নিবন্ধন সনদের স্পষ্ট কপি আবশ্যক।" },
    });
    assert(correctionRes.statusCode === 200, "Correction request submitted successfully");
    assert(
      correctionRes.json?.application?.status === "CORRECTION_REQUESTED",
      "Status updated to CORRECTION_REQUESTED"
    );

    // Rejection on another test application (with mandatory reason)
    const appToReject = await prisma.application.create({
      data: {
        applicationNumber: `EHRJ-ADM-${new Date().getFullYear()}-9902`,
        studentNameBn: "বাতিল পরীক্ষার্থী",
        studentNameEn: "REJECTED CANDIDATE",
        dateOfBirth: new Date("2016-03-03"),
        gender: "MALE",
        desiredClassId: testClassId,
        guardianName: "অভিভাবক",
        guardianPhone: "01700000002",
        address: "ইলিয়টগঞ্জ",
        status: "SUBMITTED",
      },
    });

    const rejectRes = await makeRequest(`/api/admin/admissions/${appToReject.id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: { rejectionReason: "এই জামাতে কোনো আবাসিক আসন খালি নেই।" },
    });
    assert(rejectRes.statusCode === 200, "Rejection recorded successfully with reason");
    assert(rejectRes.json?.application?.status === "REJECTED", "Application status updated to REJECTED");

    // Verify rejected application is NOT deleted
    const preservedApp = await prisma.application.findUnique({ where: { id: appToReject.id } });
    assert(preservedApp !== null, "Rejected application remains preserved in database (never deleted)");

    // 7. Atomic Transactional Admission Approval
    console.log("\n--- 7. Transactional Admission Approval (Orphan 100% Fee Waiver) ---");
    const orphanAppId = app1Data?.application?.id;

    const approveRes = await makeRequest(`/api/admin/admissions/${orphanAppId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: {
        approvalNotes: "মৌখিক পরীক্ষায় উত্তীর্ণ সাপেক্ষে চূড়ান্ত অনুমোদন।",
      },
    });

    assert(approveRes.statusCode === 200, "Admission approval transaction succeeded (HTTP 200)");
    const approveData = approveRes.json;
    const permanentStudentId = approveData?.studentIdNumber;
    assert(
      /^EHRJ-\d{4}-\d{4}$/.test(permanentStudentId),
      `Permanent Student ID generated correctly (EHRJ-YYYY-XXXX): ${permanentStudentId}`
    );
    assert(approveData?.rollNumber > 0, `Valid roll number assigned: ${approveData?.rollNumber}`);

    // Verify created Student record in Database
    const createdStudent = await prisma.student.findUnique({
      where: { id: approveData?.student?.id },
    });
    assert(createdStudent !== null, "Student master profile created in database");
    assert(createdStudent?.studentIdNumber === permanentStudentId, "Student ID matches in DB");
    assert(createdStudent?.isOrphan === true, "Student orphan status preserved");

    // Verify Guardian & GuardianStudent link
    const guardianLink = await prisma.guardianStudent.findFirst({
      where: { studentId: createdStudent?.id },
      include: { guardian: true },
    });
    assert(guardianLink !== null && guardianLink.isPrimary === true, "Guardian linked as primary guardian");
    assert(guardianLink?.guardian?.phone === "01811223344", "Guardian phone matches application");

    // Verify Enrollment record
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: createdStudent?.id },
    });
    assert(enrollment !== null && enrollment.status === "ACTIVE", "Active enrollment record created");
    assert(enrollment?.rollNumber === approveData?.rollNumber, "Enrollment roll matches approval output");

    // Verify Initial Fee Invoice & Orphan 100% Waiver
    const invoice = await prisma.feeInvoice.findFirst({
      where: { studentId: createdStudent?.id },
    });
    assert(invoice !== null, "Initial FeeInvoice created for new student");
    assert(
      invoice?.discountAmount === 1500 && invoice?.netAmount === 0 && invoice?.status === "WAIVED",
      "Orphan student granted 100% waiver (netAmount: 0, status: WAIVED)"
    );

    // Verify Application status updated to APPROVED
    const finalApp = await prisma.application.findUnique({ where: { id: orphanAppId } });
    assert(finalApp?.status === "APPROVED", "Application status updated to APPROVED");
    assert(finalApp?.createdStudentId === createdStudent?.id, "Application points to created student ID");

    // 8. Double Approval Protection Guard
    console.log("\n--- 8. Double Approval Prevention Guard ---");
    const studentCountBefore = await prisma.student.count();
    const enrollmentCountBefore = await prisma.enrollment.count();

    const doubleApproveRes = await makeRequest(`/api/admin/admissions/${orphanAppId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: {},
    });

    assert(
      doubleApproveRes.statusCode === 409 || doubleApproveRes.statusCode === 400,
      `Double approval safely rejected with Conflict (HTTP ${doubleApproveRes.statusCode})`
    );

    const studentCountAfter = await prisma.student.count();
    const enrollmentCountAfter = await prisma.enrollment.count();
    assert(studentCountBefore === studentCountAfter, "No duplicate student created on repeated approval");
    assert(enrollmentCountBefore === enrollmentCountAfter, "No duplicate enrollment created");

    // 9. Non-Orphan Approval Fee Validation
    console.log("\n--- 9. Non-Orphan Approval (Payable Invoice) ---");
    const approveOfficeRes = await makeRequest(`/api/admin/admissions/${officeAppId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: {
        approvalNotes: "অফিস ভর্তি অনুমোদন।",
      },
    });

    assert(approveOfficeRes.statusCode === 200, "Non-orphan office admission approved");
    const officeStudentId = approveOfficeRes.json?.student?.id;
    const officeInvoice = await prisma.feeInvoice.findFirst({
      where: { studentId: officeStudentId },
    });
    assert(
      officeInvoice?.netAmount === 1500 && officeInvoice?.status === "UNPAID",
      "Non-orphan receives payable invoice (netAmount: 1500, status: UNPAID)"
    );

    // 10. Public Tracking Privacy & Security
    console.log("\n--- 10. Public Tracking Privacy Audit ---");
    const trackRes = await makeRequest(`/api/admissions/track?trackingId=${trackingId1}`);
    assert(trackRes.statusCode === 200, "Public tracking endpoint returned 200");
    const trackedApp = trackRes.json?.application;
    assert(trackedApp?.trackingId === trackingId1, "Tracking ID returned correctly");
    assert(trackedApp?.status === "APPROVED", "Status returned correctly");
    assert(!!trackedApp?.nextActionInstruction, "Public next action instruction returned");
    // Verify privacy invariants: NO sensitive fields exposed
    assert(trackedApp?.nidNo === undefined, "NID number is NOT exposed to public tracking");
    assert(trackedApp?.birthCertificateNo === undefined, "Birth registration number is NOT exposed");
    assert(trackedApp?.auditLogs === undefined, "Internal audit logs are NOT exposed");
    assert(trackedApp?.guardianPhone === undefined, "Guardian phone is NOT exposed publicly");

    // 11. RBAC & IDOR Security Enforcements
    console.log("\n--- 11. RBAC & IDOR Security Tests ---");
    // Test: Teacher cannot approve admission
    const teacherApproveRes = await makeRequest(`/api/admin/admissions/${orphanAppId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: teacherCookies },
      body: {},
    });
    assert(teacherApproveRes.statusCode === 403, "Teacher approval request blocked with 403 Forbidden");

    // Test: Public/Anonymous cannot view admin admissions list
    const anonListRes = await makeRequest("/api/admin/admissions");
    assert(anonListRes.statusCode === 403, "Anonymous request to /api/admin/admissions blocked with 403");

    // Test: Teacher cannot view audit history of application
    const teacherAuditRes = await makeRequest(`/api/admin/admissions/${orphanAppId}/audit`, {
      headers: { Cookie: teacherCookies },
    });
    assert(teacherAuditRes.statusCode === 403, "Teacher cannot view admission audit history (403 Forbidden)");

    console.log("\n=================================================================");
    console.log(` PHASE 3 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log("=================================================================\n");

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error("Test execution exception:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase3Tests();
