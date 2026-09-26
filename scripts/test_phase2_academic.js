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
        "x-test-suite": "ehrj-phase-2",
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

async function runPhase2Tests() {
  console.log("=================================================================");
  console.log("    EHRJ DIGITAL CAMPUS - PHASE 2 ACADEMIC CORE TEST SUITE       ");
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

  // 1. Authenticate as Admin
  console.log(">>> Step 1: Admin Authentication");
  const loginRes = await makeRequest("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      identifier: "adminehrjmadrasha@gmail.com",
      password: "AdminEhrj@2026!",
    },
  });

  assert(loginRes.statusCode === 200, "Admin login successful with 200 OK");
  assert(loginRes.json?.user?.role === "ADMIN", "Logged in role is ADMIN");

  const cookies = loginRes.headers["set-cookie"];
  const adminCookie = Array.isArray(cookies) ? cookies.map((c) => c.split(";")[0]).join("; ") : cookies;
  assert(!!adminCookie, "Session cookie received from login response");

  const adminHeaders = {
    Cookie: adminCookie,
    "Content-Type": "application/json",
  };

  // 2. Test Academic Sessions API
  console.log("\n>>> Step 2: Academic Session Lifecycle (Create, List, Activate, Close)");
  const sessionName = `সেশন-টেস্ট-${Date.now()}`;
  const createSessionRes = await makeRequest("/api/admin/academic/sessions", {
    method: "POST",
    headers: adminHeaders,
    body: {
      name: sessionName,
      startDate: "2027-01-01",
      endDate: "2027-12-31",
      status: "DRAFT",
    },
  });

  assert(createSessionRes.statusCode === 200, "Created new test academic session with status DRAFT");
  const createdSessionId = createSessionRes.json?.session?.id;
  assert(!!createdSessionId, `Session ID returned: ${createdSessionId}`);

  // Activate session
  const activateRes = await makeRequest(`/api/admin/academic/sessions/${createdSessionId}/activate`, {
    method: "POST",
    headers: adminHeaders,
  });
  assert(activateRes.statusCode === 200, "Session successfully activated via API");

  // Verify session status in DB
  const sessionInDb = await prisma.academicSession.findUnique({ where: { id: createdSessionId } });
  assert(sessionInDb?.isCurrent === true && sessionInDb?.status === "ACTIVE", "DB confirms session is ACTIVE and isCurrent=true");

  // Close session
  const closeRes = await makeRequest(`/api/admin/academic/sessions/${createdSessionId}/close`, {
    method: "POST",
    headers: adminHeaders,
  });
  assert(closeRes.statusCode === 200, "Session closed via API without deleting any data");
  const closedSessionInDb = await prisma.academicSession.findUnique({ where: { id: createdSessionId } });
  assert(closedSessionInDb?.status === "CLOSED", "DB confirms session status is CLOSED");

  // Reactivate default academic session (২০২৫-২০২৬)
  const defaultSession = await prisma.academicSession.findFirst({
    where: { name: "২০২৫-২০২৬" },
  });
  if (defaultSession) {
    await makeRequest(`/api/admin/academic/sessions/${defaultSession.id}/activate`, {
      method: "POST",
      headers: adminHeaders,
    });
  }

  // 3. Dynamic Jamat / Class Management
  console.log("\n>>> Step 3: Dynamic Class / Jamat Creation & Gender Configuration");
  const classCode = `TEST-CLS-${Date.now()}`;
  const createClassRes = await makeRequest("/api/admin/academic/classes", {
    method: "POST",
    headers: adminHeaders,
    body: {
      nameBn: "পরীক্ষামূলক জামাত",
      nameEn: "Experimental Jamat",
      nameAr: "الصف التجريبي",
      code: classCode,
      genderType: "COMBINED",
      sortOrder: 99,
    },
  });

  assert(createClassRes.statusCode === 200, "Dynamic Jamat created successfully");
  const createdClassId = createClassRes.json?.jamatClass?.id;
  assert(!!createdClassId, `Class ID returned: ${createdClassId}`);

  // Verify default Section A auto-creation
  const defaultSec = await prisma.section.findFirst({ where: { classId: createdClassId } });
  assert(!!defaultSec, "Default 'ক শাখা' automatically provisioned for new class");

  // 4. Section Management
  console.log("\n>>> Step 4: Section Creation & Capacity Management");
  const createSecRes = await makeRequest("/api/admin/academic/sections", {
    method: "POST",
    headers: adminHeaders,
    body: {
      classId: createdClassId,
      nameBn: "খ শাখা",
      nameEn: "Section B",
      roomNo: "২০৪",
      maxCapacity: 45,
    },
  });
  assert(createSecRes.statusCode === 200, "Second section 'খ শাখা' created with room and capacity");
  const createdSecId = createSecRes.json?.section?.id;

  // 5. Student Master Creation, Permanent ID Format & Enrollment
  console.log("\n>>> Step 5: Student Master Creation & Transactional Enrollment");
  const currentSession = await prisma.academicSession.findFirst({ where: { isCurrent: true } });
  assert(!!currentSession, "Active academic session identified for enrollment");

  const studentNameBn = "মুহাম্মদ আব্দুল্লাহ আল-মামুন";
  const birthReg = `BR-${Date.now()}`;
  const createStudentRes = await makeRequest("/api/admin/students", {
    method: "POST",
    headers: adminHeaders,
    body: {
      fullNameBn: studentNameBn,
      fullNameEn: "Muhammad Abdullah Al-Mamun",
      dateOfBirth: "2012-05-15",
      gender: "MALE",
      bloodGroup: "O+",
      birthCertificateNo: birthReg,
      fatherNameBn: "মোঃ রফিকুল ইসলাম",
      fatherPhone: "01811223344",
      motherNameBn: "রাশিদা বেগম",
      presentAddress: "পূর্ব লক্ষ্মীপুর, দাউদকান্দি, কুমিল্লা",
      permanentAddress: "পূর্ব লক্ষ্মীপুর, দাউদকান্দি, কুমিল্লা",
      residentialStatus: "DAY_CARE", // DAY_CARE student
      isOrphan: false,
      isFinanciallyWeak: false,
      sessionId: currentSession.id,
      classId: createdClassId,
      sectionId: createdSecId,
      customRoll: 7,
      guardianNameBn: "মোঃ রফিকুল ইসলাম",
      guardianPhone: "01811223344",
      guardianRelation: "FATHER",
    },
  });

  assert(createStudentRes.statusCode === 200, "Student created successfully via API");
  const createdStudent = createStudentRes.json?.student;
  assert(!!createdStudent?.id, `Student master ID: ${createdStudent?.id}`);

  // Test Student ID Format EHRJ-YYYY-XXXX
  const idRegex = /^EHRJ-\d{4}-\d{4}$/;
  assert(
    idRegex.test(createdStudent?.studentIdNumber),
    `Student ID format matches EHRJ-YYYY-XXXX: ${createdStudent?.studentIdNumber}`
  );

  // Verify DB Enrollment persistence
  const enrollmentInDb = await prisma.enrollment.findFirst({
    where: { studentId: createdStudent.id },
  });
  assert(!!enrollmentInDb, "Academic enrollment record persisted in DB");
  assert(enrollmentInDb?.rollNumber === 7, `Assigned roll number is 7: ${enrollmentInDb?.rollNumber}`);
  assert(enrollmentInDb?.status === "ACTIVE", "Enrollment status is ACTIVE");

  // Verify Guardian linking
  const guardianLink = await prisma.guardianStudent.findFirst({
    where: { studentId: createdStudent.id },
    include: { guardian: true },
  });
  assert(!!guardianLink, "Guardian relation created and linked to student");
  assert(guardianLink?.isPrimary === true, "Linked guardian marked as primary");
  assert(guardianLink?.guardian?.phone === "01811223344", "Guardian phone correctly linked");

  // 6. Roll Adjustment with Audit Trail
  console.log("\n>>> Step 6: Manual Roll Adjustment & Audit Logging");
  const adjustRollRes = await makeRequest(`/api/admin/students/${createdStudent.id}`, {
    method: "PATCH",
    headers: adminHeaders,
    body: {
      enrollmentId: enrollmentInDb.id,
      adjustRollNumber: 12,
    },
  });
  assert(adjustRollRes.statusCode === 200, "Roll adjusted to 12 via PATCH API");

  const updatedEnrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentInDb.id } });
  assert(updatedEnrollment?.rollNumber === 12, `DB confirms updated roll is 12: ${updatedEnrollment?.rollNumber}`);

  const rollAudit = await prisma.auditLog.findFirst({
    where: {
      action: "ROLL_CHANGE",
      entityId: enrollmentInDb.id,
    },
  });
  assert(!!rollAudit, "Institutional AuditLog entry recorded for roll change");
  const rollAuditDetails = JSON.parse(rollAudit?.detailsJson || "{}");
  assert(
    rollAuditDetails.oldRoll === 7 && rollAuditDetails.newRoll === 12,
    `Audit details show oldRoll=7, newRoll=12`
  );

  // 7. Student Document Attachment Foundation
  console.log("\n>>> Step 7: Student Document Attachment Foundation");
  const docRes = await makeRequest(`/api/admin/students/${createdStudent.id}/documents`, {
    method: "POST",
    headers: adminHeaders,
    body: {
      documentType: "BIRTH_CERTIFICATE",
      fileName: "birth_reg_certificate.pdf",
      fileUrl: "/uploads/docs/sample_birth_cert.pdf",
      verificationStatus: "VERIFIED",
    },
  });
  assert(docRes.statusCode === 200, "Student document record attached successfully");
  const docInDb = await prisma.studentDocument.findFirst({
    where: { studentId: createdStudent.id },
  });
  assert(!!docInDb && docInDb.documentType === "BIRTH_CERTIFICATE", "Document persisted with type BIRTH_CERTIFICATE");

  // 8. Promotion Foundation (Preview & Bulk/Single Promotion)
  console.log("\n>>> Step 8: Promotion Engine (Preview & Atomic Execution)");
  // Target class for promotion
  const targetClass = await prisma.jamatClass.findFirst({
    where: { id: { not: createdClassId } },
  });

  const promoPreviewRes = await makeRequest("/api/admin/promotions/preview", {
    method: "POST",
    headers: adminHeaders,
    body: {
      fromSessionId: currentSession.id,
      fromClassId: createdClassId,
      toSessionId: currentSession.id,
      toClassId: targetClass.id,
    },
  });
  assert(promoPreviewRes.statusCode === 200, "Promotion preview returned candidates");
  assert(promoPreviewRes.json?.totalCandidates >= 1, `Found ${promoPreviewRes.json?.totalCandidates} candidates for promotion`);

  // Execute promotion
  const promoExecRes = await makeRequest("/api/admin/promotions", {
    method: "POST",
    headers: adminHeaders,
    body: {
      studentIds: [createdStudent.id],
      toSessionId: currentSession.id,
      toClassId: targetClass.id,
      rollAssignments: [{ studentId: createdStudent.id, rollNumber: 1 }],
    },
  });
  assert(promoExecRes.statusCode === 200, "Promotion executed successfully via API");

  // Verify historical preservation:
  const studentEnrollments = await prisma.enrollment.findMany({
    where: { studentId: createdStudent.id },
    orderBy: { enrolledAt: "asc" },
  });
  assert(studentEnrollments.length === 2, `Student has 2 historical enrollments preserved: count=${studentEnrollments.length}`);
  assert(studentEnrollments[0].status === "PROMOTED", "Old enrollment marked as PROMOTED");
  assert(studentEnrollments[1].status === "ACTIVE", "New enrollment marked as ACTIVE");
  assert(studentEnrollments[1].classId === targetClass.id, "New enrollment points to promoted target class");
  assert(studentEnrollments[1].rollNumber === 1, "New enrollment has assigned target roll #1");

  // Verify promotion audit log
  const promoAudit = await prisma.auditLog.findFirst({
    where: { action: "PROMOTION", entityType: "Enrollment" },
    orderBy: { createdAt: "desc" },
  });
  assert(!!promoAudit, "Promotion execution created audit log entry");

  // 9. Security & IDOR Verification
  console.log("\n>>> Step 9: Security, RBAC & IDOR Protection");
  // A. Unauthorized access without login
  const unauthRes = await makeRequest("/api/admin/students");
  assert(unauthRes.statusCode === 401 || unauthRes.statusCode === 403, "Public/unauthenticated access to students API rejected (401/403)");

  // B. Teacher Scoping Check
  console.log("Testing Teacher academic scoping...");
  const teacherLogin = await makeRequest("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      identifier: "teacherehrjmadrasha@gmail.com",
      password: "Teacher@2026!",
    },
  });
  assert(teacherLogin.statusCode === 200, "Teacher logged in successfully");
  const teacherCookie = Array.isArray(teacherLogin.headers["set-cookie"])
    ? teacherLogin.headers["set-cookie"].map((c) => c.split(";")[0]).join("; ")
    : teacherLogin.headers["set-cookie"];

  // Teacher attempts to create student (forbidden)
  const teacherCreateRes = await makeRequest("/api/admin/students", {
    method: "POST",
    headers: {
      Cookie: teacherCookie,
      "Content-Type": "application/json",
    },
    body: {
      fullNameBn: "অবৈধ চেষ্টা",
      dateOfBirth: "2015-01-01",
      fatherNameBn: "পিতা",
      motherNameBn: "মাতা",
      presentAddress: "ঠিকানা",
    },
  });
  assert(teacherCreateRes.statusCode === 403, "Teacher forbidden from creating students (403 Forbidden)");

  // C. Guardian Isolation Check (IDOR protection)
  console.log("Testing Guardian data isolation (IDOR)...");
  // Create test guardian user
  const guardianUser = await prisma.user.upsert({
    where: { email: "guardian_test@ehrj.local" },
    update: {},
    create: {
      name: "টেস্ট অভিভাবক",
      username: "guardian_test_01",
      email: "guardian_test@ehrj.local",
      phone: "01799887766",
      passwordHash: "test_hash",
      role: "GUARDIAN",
      status: "ACTIVE",
    },
  });

  const { SignJWT } = require("jose");
  const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "ehrj-madrasa-digital-campus-secure-production-jwt-secret-key-2026"
  );
  const guardianToken = await new SignJWT({
    userId: guardianUser.id,
    username: guardianUser.username,
    role: "GUARDIAN",
    email: guardianUser.email,
    name: guardianUser.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  const guardianHeaders = {
    Cookie: `ehrj_session_token=${guardianToken}`,
    "Content-Type": "application/json",
  };

  // Guardian attempts to view unlinked student details (must be blocked by IDOR check)
  const idorRes = await makeRequest(`/api/admin/students/${createdStudent.id}`, {
    headers: guardianHeaders,
  });
  assert(idorRes.statusCode === 403, "IDOR check: Guardian accessing unlinked student profile blocked with 403 Forbidden");

  // Clean up test class & sections to leave DB tidy
  await prisma.section.deleteMany({ where: { classId: createdClassId } });
  await prisma.jamatClass.delete({ where: { id: createdClassId } }).catch(() => {});
  await prisma.academicSession.delete({ where: { id: createdSessionId } }).catch(() => {});

  console.log("\n=================================================================");
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("=================================================================\n");

  return failed === 0;
}

runPhase2Tests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error("Test Suite Fatal Error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
