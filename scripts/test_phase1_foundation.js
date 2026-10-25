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
        "x-test-suite": "ehrj-test-suite",
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

async function runTests() {
  console.log("=================================================================");
  console.log("       EHRJ DIGITAL CAMPUS - PHASE 1 FOUNDATION TEST SUITE       ");
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

  // 1. ADMIN AUTHENTICATION
  console.log("--- 1. AUTHENTICATION & LOGIN ---");
  const adminLogin = await makeRequest("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      identifier: "adminehrjmadrasha@gmail.com",
      password: "AdminEhrj@2026!",
    },
  });
  assert(adminLogin.statusCode === 200 && adminLogin.json?.success === true, "Admin login succeeds with 200 OK");
  const adminCookieHeader = adminLogin.headers["set-cookie"]?.[0] || "";
  const adminCookie = adminCookieHeader.split(";")[0];
  assert(adminCookie.startsWith("ehrj_session_token="), "HttpOnly session cookie set for Admin");

  // 2. TEACHER AUTHENTICATION
  const teacherLogin = await makeRequest("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      identifier: "teacherehrjmadrasha@gmail.com",
      password: "Teacher@2026!",
    },
  });
  assert(teacherLogin.statusCode === 200 && teacherLogin.json?.success === true, "Teacher login succeeds with 200 OK");
  const teacherCookieHeader = teacherLogin.headers["set-cookie"]?.[0] || "";
  const teacherCookie = teacherCookieHeader.split(";")[0];
  assert(teacherCookie.startsWith("ehrj_session_token="), "HttpOnly session cookie set for Teacher");

  // 3. INVALID CREDENTIALS
  const invalidLogin = await makeRequest("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: {
      identifier: "adminehrjmadrasha@gmail.com",
      password: "WrongPassword123!",
    },
  });
  assert(invalidLogin.statusCode === 401, "Invalid password returns 401 Unauthorized");

  // 4. MISSING FIELDS
  const missingLogin = await makeRequest("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { identifier: "adminehrjmadrasha@gmail.com" },
  });
  assert(missingLogin.statusCode === 400, "Missing password returns 400 Bad Request");

  // 4b. RATE LIMITING (Brute-Force Protection)
  let rateLimited = false;
  for (let i = 0; i < 15; i++) {
    const res = await makeRequest("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-test-suite": "rate-limit-test" },
      body: { identifier: "test@unknown.com", password: "bad" },
    });
    if (res.statusCode === 429) {
      rateLimited = true;
      break;
    }
  }
  assert(rateLimited, "Brute-force protection: Rate limit triggered (returns 429 Too Many Requests)");

  // 5. SESSION VERIFICATION (/api/auth/me)
  console.log("\n--- 2. SESSION & RBAC VERIFICATION ---");
  const adminMe = await makeRequest("/api/auth/me", {
    headers: { Cookie: adminCookie },
  });
  assert(adminMe.statusCode === 200 && adminMe.json?.user?.role === "ADMIN", "/api/auth/me returns authenticated role=ADMIN");

  const teacherMe = await makeRequest("/api/auth/me", {
    headers: { Cookie: teacherCookie },
  });
  assert(teacherMe.statusCode === 200 && teacherMe.json?.user?.role === "TEACHER", "/api/auth/me returns authenticated role=TEACHER");

  const anonMe = await makeRequest("/api/auth/me");
  assert(anonMe.statusCode === 401, "Anonymous request to /api/auth/me returns 401");

  // 6. IDOR / RBAC PROTECTION
  console.log("\n--- 3. IDOR & AUTHORIZATION BOUNDARIES ---");
  const teacherFinanceAttempt = await makeRequest("/api/admin/finance", {
    headers: { Cookie: teacherCookie },
  });
  assert(teacherFinanceAttempt.statusCode === 403, "Teacher accessing /api/admin/finance rejected with 403 Forbidden");

  const teacherUsersAttempt = await makeRequest("/api/admin/users", {
    headers: { Cookie: teacherCookie },
  });
  assert(teacherUsersAttempt.statusCode === 403, "Teacher accessing /api/admin/users rejected with 403 Forbidden");

  const anonFinanceAttempt = await makeRequest("/api/admin/finance");
  assert(
    anonFinanceAttempt.statusCode === 401 || anonFinanceAttempt.statusCode === 403,
    "Anonymous accessing /api/admin/finance rejected with 401/403"
  );

  // 7. USER MANAGEMENT (/api/admin/users)
  console.log("\n--- 4. USER MANAGEMENT CRUD & INTEGRITY ---");
  const listUsers = await makeRequest("/api/admin/users", {
    headers: { Cookie: adminCookie },
  });
  assert(listUsers.statusCode === 200 && Array.isArray(listUsers.json?.data?.users), "Admin successfully lists users");
  const hasPasswordHash = listUsers.json?.data?.users?.some((u) => u.passwordHash);
  assert(!hasPasswordHash, "Security check: passwordHash is strictly excluded from user list response");

  // 8. SUPER ADMIN CREATION PREVENTION
  const superAdminAttempt = await makeRequest("/api/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: {
      name: "Fake Super Admin",
      email: "superadmin@ehrjmadrasha.com",
      password: "Password123!",
      role: "SUPER_ADMIN",
    },
  });
  assert(superAdminAttempt.statusCode === 400, "Creation of SUPER_ADMIN role strictly forbidden (returns 400)");

  // 9. TEACHER ACCOUNT CREATION
  const testEmail = `teacher_${Date.now()}@ehrjmadrasha.com`;
  const createTeacher = await makeRequest("/api/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: {
      name: "মাওলানা মাহমুদুল হাসান",
      email: testEmail,
      phone: "018" + Math.floor(10000000 + Math.random() * 90000000),
      password: "TestTeacher@2026!",
      role: "TEACHER",
    },
  });
  assert(createTeacher.statusCode === 200 && createTeacher.json?.success === true, "Admin creates new Teacher account with 200 OK");
  const newTeacherId = createTeacher.json?.data?.user?.id;

  // 10. STATUS TOGGLE & SELF-LOCKOUT PREVENTION
  const selfDeactivateAttempt = await makeRequest("/api/admin/users", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: {
      userId: adminMe.json.user.userId,
      action: "UPDATE_STATUS",
      status: "INACTIVE",
    },
  });
  assert(selfDeactivateAttempt.statusCode === 400, "Admin attempting self-deactivation rejected (prevents lockout)");

  if (newTeacherId) {
    const deactivateTeacher = await makeRequest("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: {
        userId: newTeacherId,
        action: "UPDATE_STATUS",
        status: "INACTIVE",
      },
    });
    assert(deactivateTeacher.statusCode === 200 && deactivateTeacher.json?.data?.user?.status === "INACTIVE", "Teacher status updated to INACTIVE");

    // Login with inactive teacher must be blocked
    const inactiveLogin = await makeRequest("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        identifier: testEmail,
        password: "TestTeacher@2026!",
      },
    });
    assert(inactiveLogin.statusCode === 403, "Inactive user login blocked with 403 Forbidden");

    // Reset password
    const resetPw = await makeRequest("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: {
        userId: newTeacherId,
        action: "RESET_PASSWORD",
        newPassword: "NewResetPass@2026!",
      },
    });
    assert(resetPw.statusCode === 200 && resetPw.json?.success === true, "Password reset by Admin succeeds");
  }

  // 11. ROUTE & PAGE ACCESSIBILITY
  console.log("\n--- 5. ROUTE & PAGE INVENTORY CHECK ---");
  const publicRoutes = [
    "/",
    "/about",
    "/academic",
    "/admission",
    "/admission/track",
    "/notices",
    "/results",
    "/gallery",
    "/downloads",
    "/verify",
    "/contact",
    "/login",
  ];

  for (const route of publicRoutes) {
    const res = await makeRequest(route);
    assert(res.statusCode === 200, `Public route ${route} returns 200 OK`);
  }

  // 12. MIDDLEWARE ROUTE PROTECTION
  console.log("\n--- 6. MIDDLEWARE ROUTE PROTECTION & REDIRECTS ---");
  const anonAdminRoute = await makeRequest("/admin/users");
  assert(
    anonAdminRoute.statusCode === 307 || anonAdminRoute.statusCode === 302,
    `Anonymous request to /admin/users redirects to /login (Status: ${anonAdminRoute.statusCode})`
  );

  const teacherAdminRoute = await makeRequest("/admin/users", {
    headers: { Cookie: teacherCookie },
  });
  assert(
    teacherAdminRoute.statusCode === 403,
    `Teacher attempting to access /admin/users rejected with 403 Forbidden`
  );

  const authAdminRoute = await makeRequest("/admin/users", {
    headers: { Cookie: adminCookie },
  });
  assert(
    authAdminRoute.statusCode === 200,
    `Authenticated Admin accessing /admin/users returns 200 OK`
  );

  const anonTeacherRoute = await makeRequest("/teacher");
  assert(
    anonTeacherRoute.statusCode === 307 || anonTeacherRoute.statusCode === 302,
    `Anonymous request to /teacher redirects to /login (Status: ${anonTeacherRoute.statusCode})`
  );

  const authTeacherRoute = await makeRequest("/teacher", {
    headers: { Cookie: teacherCookie },
  });
  assert(
    authTeacherRoute.statusCode === 200,
    `Authenticated Teacher accessing /teacher returns 200 OK`
  );

  // 12. AUDIT LOG PERSISTENCE
  console.log("\n--- 6. AUDIT LOG VALIDATION ---");
  const auditLogs = await prisma.auditLog.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
  });
  assert(auditLogs.length > 0, `Database has ${auditLogs.length} recent AuditLog entries`);
  console.log(`  Latest audit action: [${auditLogs[0]?.action}] on [${auditLogs[0]?.entityType}]`);

  console.log("\n=================================================================");
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("=================================================================");

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error(err);
  prisma.$disconnect().then(() => process.exit(1));
});
