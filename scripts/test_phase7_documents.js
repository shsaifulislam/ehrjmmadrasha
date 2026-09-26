/**
 * EHRJ DIGITAL CAMPUS - PHASE 7 DOCUMENT & CERTIFICATE FACTORY TEST SUITE
 * Complete automated assertions for official document generation, templates,
 * snapshot immutability, QR verification, revocation, reissue, guardian requests & IDOR.
 */

const http = require("http");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BASE_URL = "http://localhost:3000";
let adminCookies = "";
let teacherCookies = "";
let guardianCookies = "";

let testStudentId = "";
let otherStudentId = "";
let testSessionId = "";
let testStudentIdCardId = "";
let testStudyCertId = "";
let testCharCertId = "";
let testRevokedCertId = "";
let testReissuedCertId = "";
let testCertToken = "";
let testRevokedToken = "";
let testRequestId = "";

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    totalPassed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    totalFailed++;
    process.exitCode = 1;
  }
}

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || "GET",
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ statusCode: res.statusCode, headers: res.headers, json });
      });
    });

    req.on("error", reject);

    if (options.body) {
      req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runPhase7TestSuite() {
  console.log("=================================================================");
  console.log("  EHRJ DIGITAL CAMPUS - PHASE 7 DOCUMENT FACTORY TEST SUITE");
  console.log("=================================================================\n");

  try {
    // 0. AUTHENTICATION & FIXTURES SETUP
    console.log("--- 0. Authentication & Academic Fixtures Setup ---");

    // Admin Login
    const adminLoginRes = await makeRequest("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { identifier: "adminehrjmadrasha@gmail.com", password: "AdminEhrj@2026!" },
    });
    adminCookies = adminLoginRes.headers["set-cookie"]
      ? adminLoginRes.headers["set-cookie"].map((c) => c.split(";")[0]).join("; ")
      : "";
    assert(adminLoginRes.statusCode === 200, "Admin login succeeded with session cookie");

    // Teacher Login
    const teacherLoginRes = await makeRequest("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { identifier: "teacherehrjmadrasha@gmail.com", password: "Teacher@2026!" },
    });
    teacherCookies = teacherLoginRes.headers["set-cookie"]
      ? teacherLoginRes.headers["set-cookie"].map((c) => c.split(";")[0]).join("; ")
      : "";
    assert(teacherLoginRes.statusCode === 200, "Teacher login succeeded with session cookie");

    // Active AcademicSession
    const session = await prisma.academicSession.findFirst({ where: { isCurrent: true } });
    assert(!!session, "Active current AcademicSession found");
    testSessionId = session.id;

    // Active JamatClass with enrolled students
    const jamatClass = await prisma.jamatClass.findFirst({
      where: { enrollments: { some: { status: "ACTIVE" } } },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: { student: true },
          take: 2,
        },
      },
    });
    assert(!!jamatClass && jamatClass.enrollments.length >= 1, "Active JamatClass with students found");
    testStudentId = jamatClass.enrollments[0].student.id;

    if (jamatClass.enrollments.length > 1) {
      otherStudentId = jamatClass.enrollments[1].student.id;
    } else {
      const other = await prisma.student.findFirst({ where: { id: { not: testStudentId } } });
      otherStudentId = other ? other.id : "unlinked-student-id";
    }

    // Guardian fixture
    const guardianUser = await prisma.user.findFirst({ where: { role: "GUARDIAN" } });
    assert(!!guardianUser, "Guardian user found in database");

    const guardianRecord = await prisma.guardian.findFirst({
      where: {
        OR: [{ userId: guardianUser.id }, { phone: guardianUser.username }],
      },
    });
    assert(!!guardianRecord, "Guardian master record found");

    // Ensure student is linked to guardian
    await prisma.guardianStudent.upsert({
      where: {
        guardianId_studentId: {
          guardianId: guardianRecord.id,
          studentId: testStudentId,
        },
      },
      create: {
        guardianId: guardianRecord.id,
        studentId: testStudentId,
        isPrimary: true,
      },
      update: {},
    });

    // Clean up any test document requests for idempotency
    await prisma.documentRequest.deleteMany({ where: { studentId: testStudentId } });

    const guardianLoginRes = await makeRequest("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        identifier: guardianUser.username || guardianUser.email,
        password: "Guardian@2026!",
      },
    });
    assert(guardianLoginRes.statusCode === 200, "Guardian login succeeded with session cookie");
    guardianCookies = guardianLoginRes.headers["set-cookie"]
      ? guardianLoginRes.headers["set-cookie"].map((c) => c.split(";")[0]).join("; ")
      : "";

    // 1. TEMPLATES INITIALIZATION & CRUD
    console.log("\n--- 1. Document Template Engine Tests ---");

    const templatesRes = await makeRequest("/api/admin/documents/templates", {
      method: "GET",
      headers: { Cookie: adminCookies },
    });
    assert(templatesRes.statusCode === 200, "Admin can list document templates");
    assert(templatesRes.json.templates.length >= 6, "At least 6 official default document templates initialized");

    const studyTpl = templatesRes.json.templates.find((t) => t.documentType === "STUDY_CERTIFICATE");
    assert(!!studyTpl, "Official Study Certificate template present");
    assert(studyTpl.bodyBn.includes("{{student.nameBn}}"), "Template includes student name variable placeholder");
    assert(studyTpl.bodyBn.includes("{{class.name}}"), "Template includes class variable placeholder");

    // 2. STUDENT ID CARD GENERATION
    console.log("\n--- 2. Student ID Card Generation Tests ---");

    const idCardRes = await makeRequest("/api/admin/documents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: {
        studentId: testStudentId,
        documentType: "STUDENT_ID",
        sessionId: testSessionId,
      },
    });
    assert(idCardRes.statusCode === 200, "Admin successfully generated Digital Student ID Card");
    assert(idCardRes.json.certificate.certificateNumber.startsWith("EHRJ-ID-"), "Student ID Card formatted as EHRJ-ID-YYYY-XXXXX");
    assert(idCardRes.json.certificate.verificationCode.startsWith("EHRJ-VER-"), "Verification token formatted as EHRJ-VER-YYYY-XXXXX");
    assert(idCardRes.json.certificate.status === "ISSUED", "Student ID status is ISSUED");
    assert(!!idCardRes.json.certificate.qrCodeUrl, "Base64 scalable QR Code generated for Student ID");
    testStudentIdCardId = idCardRes.json.certificate.id;

    // 3. STUDY CERTIFICATE GENERATION
    console.log("\n--- 3. Study / Enrollment Certificate Tests ---");

    const studyCertRes = await makeRequest("/api/admin/documents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: {
        studentId: testStudentId,
        documentType: "STUDY_CERTIFICATE",
        sessionId: testSessionId,
        customNotes: "পাসপোর্ট ভেরিফিকেশনের জন্য",
      },
    });
    assert(studyCertRes.statusCode === 200, "Admin successfully generated Study Certificate");
    assert(studyCertRes.json.certificate.certificateNumber.startsWith("EHRJ-STUDY-"), "Study Certificate formatted as EHRJ-STUDY-YYYY-XXXXX");
    testStudyCertId = studyCertRes.json.certificate.id;
    testCertToken = studyCertRes.json.certificate.verificationCode;

    // 4. CHARACTER & TRANSFER CERTIFICATE GENERATION
    console.log("\n--- 4. Character & Transfer Certificate Tests ---");

    const charCertRes = await makeRequest("/api/admin/documents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: {
        studentId: testStudentId,
        documentType: "CHARACTER_CERTIFICATE",
      },
    });
    assert(charCertRes.statusCode === 200, "Admin successfully generated Character Certificate");
    assert(charCertRes.json.certificate.certificateNumber.startsWith("EHRJ-CHAR-"), "Character Certificate formatted as EHRJ-CHAR-YYYY-XXXXX");
    testCharCertId = charCertRes.json.certificate.id;

    const tcRes = await makeRequest("/api/admin/documents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: {
        studentId: testStudentId,
        documentType: "TRANSFER_CERTIFICATE",
      },
    });
    assert(tcRes.statusCode === 200, "Admin successfully generated Transfer Certificate (TC)");
    assert(tcRes.json.certificate.certificateNumber.startsWith("EHRJ-TC-"), "Transfer Certificate formatted as EHRJ-TC-YYYY-XXXXX");
    testRevokedCertId = tcRes.json.certificate.id;
    testRevokedToken = tcRes.json.certificate.verificationCode;

    // 5. HISTORICAL IMMUTABILITY SNAPSHOT TEST
    console.log("\n--- 5. Historical Data Snapshot Immutability Tests ---");

    // Fetch original study cert detail
    const docDetailBefore = await makeRequest(`/api/admin/documents/${testStudyCertId}`, {
      method: "GET",
      headers: { Cookie: adminCookies },
    });
    assert(docDetailBefore.statusCode === 200, "Admin can fetch document detail with parsed snapshot");
    const originalSnapshotName = docDetailBefore.json.document.parsedSnapshot.student.nameBn;

    // Temporarily mutate student's live database record
    await prisma.student.update({
      where: { id: testStudentId },
      data: { fullNameBn: "মুহাম্মদ সাময়িক নাম পরিবর্তন টেস্ট" },
    });

    // Re-fetch document detail: snapshot MUST remain unchanged!
    const docDetailAfter = await makeRequest(`/api/admin/documents/${testStudyCertId}`, {
      method: "GET",
      headers: { Cookie: adminCookies },
    });
    assert(
      docDetailAfter.json.document.parsedSnapshot.student.nameBn === originalSnapshotName,
      "Historical immutability: Live student update does NOT mutate issued certificate snapshot"
    );

    // Restore original student name
    await prisma.student.update({
      where: { id: testStudentId },
      data: { fullNameBn: originalSnapshotName },
    });

    // 6. REVOCATION ENGINE & MANDATORY REASON
    console.log("\n--- 6. Revocation Engine & Audit Tests ---");

    // Attempt revocation without reason
    const badRevokeRes = await makeRequest(`/api/admin/documents/${testRevokedCertId}/revoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: { reason: "" },
    });
    assert(badRevokeRes.statusCode === 400, "Revocation without mandatory reason rejected with 400 Bad Request");

    // Legitimate revocation
    const revokeRes = await makeRequest(`/api/admin/documents/${testRevokedCertId}/revoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: { reason: "অভিভাবকের অনুরোধে ও তথ্য সংশোধনের প্রয়োজনে বাতিল করা হলো।" },
    });
    assert(revokeRes.statusCode === 200, "Admin successfully revoked certificate");
    assert(revokeRes.json.certificate.isRevoked === true, "Certificate isRevoked flag updated to true");
    assert(revokeRes.json.certificate.status === "REVOKED", "Certificate status updated to REVOKED");

    // Attempt to revoke already revoked certificate
    const doubleRevokeRes = await makeRequest(`/api/admin/documents/${testRevokedCertId}/revoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: { reason: "আবার বাতিল করার চেষ্টা" },
    });
    assert(doubleRevokeRes.statusCode === 400, "Repeated revocation of already revoked document safely rejected");

    // Check AuditLog for revocation
    const revokeAudit = await prisma.auditLog.findFirst({
      where: { action: "REVOKE_OFFICIAL_DOCUMENT", entityId: testRevokedCertId },
    });
    assert(!!revokeAudit, "AuditLog recorded for REVOKE_OFFICIAL_DOCUMENT");

    // 7. REISSUE ENGINE & VERSION INCREMENT
    console.log("\n--- 7. Reissue Engine & Version Increment Tests ---");

    const reissueRes = await makeRequest(`/api/admin/documents/${testRevokedCertId}/reissue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: {
        reason: "সংশোধিত তথ্যাবলি সহ টিসি পুনঃইস্যু",
      },
    });
    assert(reissueRes.statusCode === 200, "Admin successfully reissued certificate");
    assert(reissueRes.json.certificate.version === 2, "Reissued certificate version incremented from 1 to 2");
    assert(
      reissueRes.json.certificate.reissuedFromId === testRevokedCertId,
      "Reissued certificate accurately preserves link to previous version"
    );
    assert(
      reissueRes.json.certificate.certificateNumber !== docDetailBefore.json.document.certificateNumber,
      "Reissued certificate assigned new unique document number"
    );
    assert(reissueRes.json.certificate.status === "ISSUED", "Reissued certificate status is ISSUED (active)");
    testReissuedCertId = reissueRes.json.certificate.id;

    // 8. GUARDIAN REQUEST WORKFLOW & IDOR PROTECTION
    console.log("\n--- 8. Guardian Portal & IDOR Protection Tests ---");

    // Guardian views linked child's documents
    const guardianDocsRes = await makeRequest(`/api/portal/documents?studentId=${testStudentId}`, {
      method: "GET",
      headers: { Cookie: guardianCookies },
    });
    assert(guardianDocsRes.statusCode === 200, "Guardian can view linked child's documents");
    assert(guardianDocsRes.json.student.id === testStudentId, "Returned student matches linked child");
    assert(Array.isArray(guardianDocsRes.json.certificates), "Returns certificates array for child");

    // IDOR Attack: Guardian attempts to query unlinked student's documents
    const idorDocsRes = await makeRequest(`/api/portal/documents?studentId=${otherStudentId}`, {
      method: "GET",
      headers: { Cookie: guardianCookies },
    });
    assert(idorDocsRes.statusCode === 403, "Guardian IDOR query for unlinked student blocked with 403 Forbidden");

    // Guardian submits document request for linked child
    const submitReqRes = await makeRequest("/api/portal/documents/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: guardianCookies,
      },
      body: {
        studentId: testStudentId,
        documentType: "CHARACTER_CERTIFICATE",
        purpose: "নতুন মাদরাসায় হিফজ বিভাগে স্থানান্তরের জন্য চারিত্রিক সনদ প্রয়োজন।",
      },
    });
    assert(submitReqRes.statusCode === 200, "Guardian successfully submitted document request");
    assert(submitReqRes.json.request.requestNumber.startsWith("EHRJ-REQ-"), "Request number formatted as EHRJ-REQ-YYYY-XXXXX");
    assert(submitReqRes.json.request.status === "SUBMITTED", "Initial request status is SUBMITTED");
    testRequestId = submitReqRes.json.request.id;

    // Duplicate submission prevention
    const dupReqRes = await makeRequest("/api/portal/documents/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: guardianCookies,
      },
      body: {
        studentId: testStudentId,
        documentType: "CHARACTER_CERTIFICATE",
        purpose: "আবার একই আবেদন",
      },
    });
    assert(dupReqRes.statusCode === 409, "Duplicate pending request for same child and document type blocked with 409 Conflict");

    // IDOR Attack: Guardian submits request for unlinked child
    const idorSubmitRes = await makeRequest("/api/portal/documents/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: guardianCookies,
      },
      body: {
        studentId: otherStudentId,
        documentType: "STUDY_CERTIFICATE",
        purpose: "অননুমোদিত শিক্ষার্থীর আবেদন",
      },
    });
    assert(idorSubmitRes.statusCode === 403, "Guardian submitting request for unlinked student blocked with 403 Forbidden");

    // 9. ADMIN REVIEW & ONE-CLICK ISSUANCE
    console.log("\n--- 9. Admin Request Review & Issuance Tests ---");

    // Admin lists requests
    const adminReqsRes = await makeRequest("/api/admin/documents/requests", {
      method: "GET",
      headers: { Cookie: adminCookies },
    });
    assert(adminReqsRes.statusCode === 200, "Admin can list guardian document requests");
    assert(adminReqsRes.json.requests.some((r) => r.id === testRequestId), "Submitted request visible in Admin queue");

    // Admin approves request
    const reviewApproveRes = await makeRequest(`/api/admin/documents/requests/${testRequestId}/review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: { action: "APPROVE" },
    });
    assert(reviewApproveRes.statusCode === 200, "Admin successfully approved document request");
    assert(reviewApproveRes.json.request.status === "APPROVED", "Request status updated to APPROVED");

    // Admin issues approved request
    const issueApprovedRes = await makeRequest(`/api/admin/documents/requests/${testRequestId}/issue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
    });
    assert(issueApprovedRes.statusCode === 200, "Admin issued document directly from approved request");
    assert(issueApprovedRes.json.certificate.requestId === testRequestId, "Generated certificate points to request ID");

    // Check request is now marked ISSUED
    const updatedReqInDb = await prisma.documentRequest.findUnique({ where: { id: testRequestId } });
    assert(updatedReqInDb.status === "ISSUED", "DocumentRequest status finalized to ISSUED");

    // 10. PUBLIC PRIVACY-SAFE VERIFICATION
    console.log("\n--- 10. Public Privacy-Safe Verification Tests ---");

    // Valid verification
    const publicVerifyRes = await makeRequest(`/api/verify/document/${testCertToken}`, {
      method: "GET",
    });
    assert(publicVerifyRes.statusCode === 200, "Public document verification returned 200 OK");
    assert(publicVerifyRes.json.verified === true, "Valid document verified as authentic (verified: true)");
    assert(publicVerifyRes.json.document.status === "VALID", "Document status is VALID");
    assert(!!publicVerifyRes.json.document.studentName, "Safe student name displayed");
    assert(!!publicVerifyRes.json.document.certificateNumber, "Official certificate number displayed");

    // Privacy Checks
    assert(!publicVerifyRes.json.document.phone, "Privacy check: Guardian phone strictly omitted");
    assert(!publicVerifyRes.json.document.nid, "Privacy check: NID strictly omitted");
    assert(!publicVerifyRes.json.document.address, "Privacy check: Private home address strictly omitted");
    assert(!publicVerifyRes.json.document.internalNotes, "Privacy check: Internal notes strictly omitted");

    // Revoked verification
    const revokedVerifyRes = await makeRequest(`/api/verify/document/${testRevokedToken}`, {
      method: "GET",
    });
    assert(revokedVerifyRes.statusCode === 200, "Revoked document verification returned 200 OK");
    assert(revokedVerifyRes.json.verified === false, "Revoked document marked as invalid (verified: false)");
    assert(revokedVerifyRes.json.document.status === "REVOKED", "Document status is REVOKED");
    assert(!!revokedVerifyRes.json.document.revocationNotice, "Official revocation notice displayed to public");

    // Invalid Token
    const invalidVerifyRes = await makeRequest("/api/verify/document/NON-EXISTENT-TOKEN-9999", {
      method: "GET",
    });
    assert(invalidVerifyRes.statusCode === 404, "Invalid verification token returned 404 Not Found");

    // 11. RBAC & SECURITY BOUNDARIES
    console.log("\n--- 11. RBAC & Security Boundaries Tests ---");

    // Teacher accessing Admin documents API
    const teacherDocsRes = await makeRequest("/api/admin/documents", {
      method: "GET",
      headers: { Cookie: teacherCookies },
    });
    assert(teacherDocsRes.statusCode === 403, "Teacher accessing Admin documents API blocked with 403 Forbidden");

    // Anonymous accessing Admin documents API
    const anonDocsRes = await makeRequest("/api/admin/documents", {
      method: "GET",
    });
    assert(anonDocsRes.statusCode === 403, "Anonymous accessing Admin documents API blocked with 403 Forbidden");

    // Teacher attempting to issue document
    const teacherIssueRes = await makeRequest("/api/admin/documents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: teacherCookies,
      },
      body: {
        studentId: testStudentId,
        documentType: "CHARACTER_CERTIFICATE",
      },
    });
    assert(teacherIssueRes.statusCode === 403, "Teacher attempting to issue certificate blocked with 403 Forbidden");

    console.log("\n=================================================================");
    console.log(`  PHASE 7 TEST SUMMARY: ${totalPassed} PASSED | ${totalFailed} FAILED`);
    console.log("=================================================================\n");

    if (totalFailed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase7TestSuite();
