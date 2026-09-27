/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 10 HOSTEL HTTP API TEST SUITE
 * Validates actual HTTP route handlers, sessions, RBAC, and IDOR protection over localhost:3000.
 */

const http = require("http");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

const BASE_URL = "http://localhost:3000";
let adminCookies = "";
let guardianCookies = "";
let teacherCookies = "";

let testStudentId = "";
let unlinkedStudentId = "";
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
      headers: {
        "Content-Type": "application/json",
        ...(options.cookies ? { Cookie: options.cookies } : {}),
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
        } catch (e) {
          json = { raw: data };
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json,
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

async function runApiTests() {
  console.log("==================================================================");
  console.log("EHRJ DIGITAL CAMPUS — PHASE 10 HOSTEL HTTP API & RBAC TEST SUITE");
  console.log("==================================================================");

  try {
    // 1. Setup credentials for testing
    console.log("\n--- 1. Authenticating Roles (ADMIN, GUARDIAN, TEACHER) ---");
    const testPassword = "HostelPassword123!";
    const passwordHash = await bcrypt.hash(testPassword, 10);

    // Admin
    const adminEmail = "admin_hostel_api@ehrjmadrasha.com";
    await prisma.user.upsert({
      where: { email: adminEmail },
      create: {
        username: "admin_hostel_api",
        email: adminEmail,
        name: "মাওলানা মহা. আবুল কালাম সরকার (Admin API)",
        role: "ADMIN",
        passwordHash,
      },
      update: { passwordHash },
    });

    const adminLoginRes = await makeRequest("/api/auth/login", {
      method: "POST",
      body: { identifier: adminEmail, password: testPassword },
    });
    assert(adminLoginRes.statusCode === 200, "Admin login successful via /api/auth/login");
    const adminSetCookie = adminLoginRes.headers["set-cookie"];
    adminCookies = adminSetCookie ? adminSetCookie.map((c) => c.split(";")[0]).join("; ") : "";
    assert(adminCookies.length > 0, "Admin session cookie obtained");

    // Guardian
    const guardianEmail = "guardian_hostel_api@ehrjmadrasha.com";
    const guardianUser = await prisma.user.upsert({
      where: { email: guardianEmail },
      create: {
        username: "guardian_hostel_api",
        email: guardianEmail,
        name: "মুহাম্মদ রফিকুল ইসলাম (Guardian API)",
        role: "GUARDIAN",
        passwordHash,
      },
      update: { passwordHash },
    });

    let guardianProfile = await prisma.guardian.findFirst({
      where: { userId: guardianUser.id },
    });
    if (!guardianProfile) {
      guardianProfile = await prisma.guardian.create({
        data: {
          userId: guardianUser.id,
          fullNameBn: "মুহাম্মদ রফিকুল ইসলাম",
          phone: "01811999888",
          relation: "FATHER",
        },
      });
    }

    const guardianLoginRes = await makeRequest("/api/auth/login", {
      method: "POST",
      body: { identifier: guardianEmail, password: testPassword },
    });
    assert(guardianLoginRes.statusCode === 200, "Guardian login successful via /api/auth/login");
    const guardianSetCookie = guardianLoginRes.headers["set-cookie"];
    guardianCookies = guardianSetCookie ? guardianSetCookie.map((c) => c.split(";")[0]).join("; ") : "";
    assert(guardianCookies.length > 0, "Guardian session cookie obtained");

    // Teacher
    const teacherEmail = "teacher_hostel_api@ehrjmadrasha.com";
    await prisma.user.upsert({
      where: { email: teacherEmail },
      create: {
        username: "teacher_hostel_api",
        email: teacherEmail,
        name: "মাওলানা উস্তাদ রফিক (Teacher API)",
        role: "TEACHER",
        passwordHash,
      },
      update: { passwordHash },
    });

    const teacherLoginRes = await makeRequest("/api/auth/login", {
      method: "POST",
      body: { identifier: teacherEmail, password: testPassword },
    });
    assert(teacherLoginRes.statusCode === 200, "Teacher login successful via /api/auth/login");
    const teacherSetCookie = teacherLoginRes.headers["set-cookie"];
    teacherCookies = teacherSetCookie ? teacherSetCookie.map((c) => c.split(";")[0]).join("; ") : "";
    assert(teacherCookies.length > 0, "Teacher session cookie obtained");

    // Link a student to this guardian
    const session = await prisma.academicSession.findFirst({ where: { isCurrent: true } });
    const jamat = await prisma.jamatClass.findFirst();

    const linkedStudent = await prisma.student.create({
      data: {
        studentIdNumber: `EHRJ-API-L-${Date.now()}`,
        fullNameBn: "মুহাম্মদ তালহা (API Test Linked Child)",
        fullNameEn: "Muhammad Talha",
        dateOfBirth: new Date("2016-04-10"),
        gender: "MALE",
        residentialStatus: "NON_RESIDENTIAL",
        fatherNameBn: "মুহাম্মদ রফিকুল ইসলাম",
        motherNameBn: "মোসাম্মৎ কুলসুম",
        presentAddress: "দাউদকান্দি",
        permanentAddress: "দাউদকান্দি",
        guardianLinks: {
          create: {
            guardianId: guardianProfile.id,
            isPrimary: true,
          },
        },
        enrollments: {
          create: {
            classId: jamat.id,
            sessionId: session.id,
            rollNumber: 501,
            status: "ACTIVE",
          },
        },
      },
    });
    testStudentId = linkedStudent.id;

    // Create an unlinked student for IDOR testing
    const unlinkedStudent = await prisma.student.create({
      data: {
        studentIdNumber: `EHRJ-API-U-${Date.now()}`,
        fullNameBn: "মুহাম্মদ ইয়াসিন (Unlinked Child)",
        fullNameEn: "Muhammad Yasin",
        dateOfBirth: new Date("2015-08-12"),
        gender: "MALE",
        residentialStatus: "NON_RESIDENTIAL",
        fatherNameBn: "অন্য অভিভাবক",
        motherNameBn: "অন্য অভিভাবক",
        presentAddress: "কুমিল্লা",
        permanentAddress: "কুমিল্লা",
        enrollments: {
          create: {
            classId: jamat.id,
            sessionId: session.id,
            rollNumber: 502,
            status: "ACTIVE",
          },
        },
      },
    });
    unlinkedStudentId = unlinkedStudent.id;

    // 2. Admin Hostel Stats API
    console.log("\n--- 2. Admin Hostel Stats Endpoint ---");
    const statsRes = await makeRequest("/api/admin/hostel/stats", {
      cookies: adminCookies,
    });
    assert(statsRes.statusCode === 200, "GET /api/admin/hostel/stats returns HTTP 200");
    assert(statsRes.data.stats && typeof statsRes.data.stats.totalResidents === "number", "Hostel stats contains totalResidents metric");
    assert(typeof statsRes.data.stats.dayCareCount === "number", "Hostel stats contains dayCareCount metric");
    assert(typeof statsRes.data.stats.nonResidentialCount === "number", "Hostel stats contains nonResidentialCount metric");

    // 3. Admin Residents List & Pagination API
    console.log("\n--- 3. Admin Residents List Endpoint ---");
    const residentsRes = await makeRequest("/api/admin/hostel/residents?page=1&limit=10", {
      cookies: adminCookies,
    });
    assert(residentsRes.statusCode === 200, "GET /api/admin/hostel/residents returns HTTP 200");
    assert(Array.isArray(residentsRes.data.residents), "Residents endpoint returns array of residents");
    assert(residentsRes.data.pagination && residentsRes.data.pagination.totalPages >= 1, "Residents endpoint provides server-side pagination");

    // 4. Admin Check-In API
    console.log("\n--- 4. Admin Check-In Endpoint ---");
    const checkInRes = await makeRequest("/api/admin/hostel/check-in", {
      method: "POST",
      cookies: adminCookies,
      body: {
        studentId: testStudentId,
        checkInDate: "2026-03-01",
        notes: "API মাধ্যমে চেক-ইন পরীক্ষা",
      },
    });
    assert(checkInRes.statusCode === 200, "POST /api/admin/hostel/check-in returns HTTP 200");
    assert(checkInRes.data.enrollment && checkInRes.data.enrollment.status === "CHECKED_IN", "Enrollment status returned as CHECKED_IN");

    // Verify double check-in blocked via API
    const doubleCheckInRes = await makeRequest("/api/admin/hostel/check-in", {
      method: "POST",
      cookies: adminCookies,
      body: {
        studentId: testStudentId,
        checkInDate: "2026-03-01",
      },
    });
    assert(doubleCheckInRes.statusCode === 400, "POST /api/admin/hostel/check-in blocks duplicate check-in with HTTP 400");

    // 5. Admin Status Change API
    console.log("\n--- 5. Admin Status Change Endpoint ---");
    const statusChangeRes = await makeRequest("/api/admin/hostel/status-change", {
      method: "POST",
      cookies: adminCookies,
      body: {
        studentId: testStudentId,
        newStatus: "DAY_CARE",
        effectiveDate: "2026-04-01",
        reason: "পারিবারিক অনুরোধে ডে-কেয়ার পরিবর্তন",
      },
    });
    assert(statusChangeRes.statusCode === 200, "POST /api/admin/hostel/status-change returns HTTP 200");

    // 6. Admin Check-Out API
    console.log("\n--- 6. Admin Check-Out Endpoint ---");
    // Return to RESIDENTIAL first to test checkout
    await makeRequest("/api/admin/hostel/status-change", {
      method: "POST",
      cookies: adminCookies,
      body: {
        studentId: testStudentId,
        newStatus: "RESIDENTIAL",
        effectiveDate: "2026-04-15",
        reason: "পুনরায় আবাসিক প্রত্যাবর্তন",
      },
    });

    const checkOutRes = await makeRequest("/api/admin/hostel/check-out", {
      method: "POST",
      cookies: adminCookies,
      body: {
        studentId: testStudentId,
        checkOutDate: "2026-08-31",
        reason: "নিয়মিত চেক-আউট",
      },
    });
    assert(checkOutRes.statusCode === 200, "POST /api/admin/hostel/check-out returns HTTP 200");

    // 7. Guardian Portal Hostel API & IDOR Protection
    console.log("\n--- 7. Guardian Portal Hostel & IDOR Isolation ---");
    // Authorized child query
    const guardianAuthRes = await makeRequest(`/api/portal/hostel?studentId=${testStudentId}`, {
      cookies: guardianCookies,
    });
    assert(guardianAuthRes.statusCode === 200, "Guardian successfully views linked child hostel profile (HTTP 200)");
    assert(guardianAuthRes.data.student && guardianAuthRes.data.student.id === testStudentId, "Returned student matches requested linked child");

    // Unauthorized child query (IDOR attack attempt)
    const guardianIdorRes = await makeRequest(`/api/portal/hostel?studentId=${unlinkedStudentId}`, {
      cookies: guardianCookies,
    });
    assert(guardianIdorRes.statusCode === 403, "Guardian access to unlinked child BLOCKED with HTTP 403 Forbidden (IDOR Protected)");

    // 8. Guardian Request Submission & Duplicate Guard
    console.log("\n--- 8. Guardian Request Submission Endpoint ---");
    const guardianReqRes = await makeRequest("/api/portal/hostel/request", {
      method: "POST",
      cookies: guardianCookies,
      body: {
        studentId: testStudentId,
        requestType: "ADMISSION",
        targetStatus: "RESIDENTIAL",
        desiredEffectiveDate: "2026-09-01",
        reason: "আবাসিক ভর্তি আবেদন",
      },
    });
    assert(guardianReqRes.statusCode === 200, "Guardian submits residential request successfully (HTTP 200)");
    assert(guardianReqRes.data.request && guardianReqRes.data.request.requestNumber.startsWith("EHRJ-HRQ-"), "Request number generated with EHRJ-HRQ- prefix");

    // IDOR on submission: Guardian submitting request for unlinked student
    const guardianIdorReqRes = await makeRequest("/api/portal/hostel/request", {
      method: "POST",
      cookies: guardianCookies,
      body: {
        studentId: unlinkedStudentId,
        requestType: "ADMISSION",
        targetStatus: "RESIDENTIAL",
        desiredEffectiveDate: "2026-09-01",
        reason: "অবৈধ আবেদন চেষ্টা",
      },
    });
    assert(guardianIdorReqRes.statusCode === 403, "Guardian request submission for unlinked child BLOCKED with HTTP 403 (IDOR Protected)");

    // 9. Teacher Scoped Read-Only Access & Mutation Protection
    console.log("\n--- 9. Teacher Access & Mutation Blocking ---");
    const teacherRosterRes = await makeRequest("/api/teacher/hostel", {
      cookies: teacherCookies,
    });
    assert(teacherRosterRes.statusCode === 200, "Teacher can view scoped residential student roster (HTTP 200)");
    assert(Array.isArray(teacherRosterRes.data.students), "Teacher roster returns student list");

    // Teacher attempting Admin operation (Check-in)
    const teacherCheckInMutation = await makeRequest("/api/admin/hostel/check-in", {
      method: "POST",
      cookies: teacherCookies,
      body: {
        studentId: testStudentId,
        checkInDate: "2026-09-01",
      },
    });
    assert(teacherCheckInMutation.statusCode === 403, "Teacher attempting admin check-in mutation BLOCKED with HTTP 403");

    console.log("\n==================================================================");
    console.log(`PHASE 10 API TEST SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED`);
    console.log("==================================================================");

    if (totalFailed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error("API test execution threw exception:", err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

runApiTests();
