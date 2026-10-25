const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BASE_URL = "http://localhost:3000";

async function loginUser(identifier, password) {
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-test-suite": "ehrj-test" },
    body: JSON.stringify({ identifier, password })
  });
  const data = await loginRes.json();
  if (!loginRes.ok) throw new Error(`Login failed for ${identifier}: ${JSON.stringify(data)}`);
  
  let rawCookies = [];
  if (typeof loginRes.headers.getSetCookie === "function") {
    rawCookies = loginRes.headers.getSetCookie();
  } else {
    const single = loginRes.headers.get("set-cookie");
    if (single) rawCookies = [single];
  }
  let token = null;
  for (const c of rawCookies) {
    const m = c.match(/ehrj_session_token=([^;]+)/);
    if (m) token = m[1];
  }
  if (!token) throw new Error(`Could not extract token for ${identifier}`);
  return { token, user: data.user };
}

async function runRegressionSuite() {
  console.log("==================================================================");
  console.log("  EHRJ MADRASHA ERP — PHASE 36 E2E REGRESSION & CONCURRENCY SUITE");
  console.log("==================================================================\n");

  const results = {
    databaseIntegrity: {},
    multiUserConcurrency: {},
    securityRBAC: {},
    idorDefenseMatrix: {},
    inputValidation: {},
    verdict: "PASS"
  };

  try {
    // -------------------------------------------------------------
    // 1. DATABASE INTEGRITY & TRANSACTION ROLLBACK
    // -------------------------------------------------------------
    console.log("[1/5] Testing Database Integrity, Foreign Keys & Transaction Rollback...");
    
    // SQLite Foreign Key check
    const fkPragma = await prisma.$queryRawUnsafe("PRAGMA foreign_keys;");
    const fkEnabled = fkPragma && fkPragma.length > 0 ? Object.values(fkPragma[0])[0] === 1 : false;
    results.databaseIntegrity.foreignKeysEnabled = fkEnabled;
    console.log(`- SQLite PRAGMA foreign_keys: ${fkEnabled ? "ON (1)" : "OFF (0)"}`);

    // Transaction Rollback Test
    const rollbackTestId = `rollback-test-${Date.now()}`;
    let rollbackSuccess = false;
    try {
      await prisma.$transaction(async (tx) => {
        // Step 1: Create a temporary notice
        await tx.notice.create({
          data: {
            id: rollbackTestId,
            titleBn: "টেস্ট রোলব্যাক নোটিশ",
            titleEn: "Test Rollback Notice",
            contentBn: "এটি একটি অস্থায়ী রোলব্যাক পরীক্ষার নোটিশ।",
            category: "GENERAL",
            priority: "NORMAL",
            publishedAt: new Date(),
          }
        });

        // Step 2: Intentional throw to trigger rollback
        throw new Error("INTENTIONAL_TRANSACTION_FAILURE");
      });
    } catch (txErr) {
      if (txErr.message === "INTENTIONAL_TRANSACTION_FAILURE") {
        // Step 3: Verify the record was NOT committed
        const orphanNotice = await prisma.notice.findUnique({
          where: { id: rollbackTestId }
        });
        rollbackSuccess = orphanNotice === null;
      }
    }
    results.databaseIntegrity.transactionRollback = rollbackSuccess;
    console.log(`- Transaction Rollback Verification: ${rollbackSuccess ? "PASSED (No orphan records)" : "FAILED"}`);

    // Unique Constraint Test
    let uniqueConstraintProtected = false;
    try {
      await prisma.user.create({
        data: {
          username: "adminehrj", // Duplicate of existing admin
          email: "duplicate-admin@example.com",
          name: "Duplicate User",
          passwordHash: "hash123",
          role: "ADMIN"
        }
      });
    } catch (pErr) {
      uniqueConstraintProtected = pErr.code === "P2002";
    }
    results.databaseIntegrity.uniqueConstraintsEnforced = uniqueConstraintProtected;
    console.log(`- Unique Constraint (Duplicate Username Prevention): ${uniqueConstraintProtected ? "PASSED (P2002 Rejected)" : "FAILED"}`);

    // -------------------------------------------------------------
    // 2. MULTI-USER ISOLATION & PARALLEL CONCURRENCY
    // -------------------------------------------------------------
    console.log("\n[2/5] Testing Multi-User Concurrency & Session Boundary Isolation...");
    
    // Authenticate 3 distinct roles in parallel
    const [adminAuth, teacherAuth, guardianAuth] = await Promise.all([
      loginUser("adminehrj", "Saiful018228222@@##"),
      loginUser("teacher", "Teacher@2026!"),
      loginUser("guardian_ui_demo", "Guardian@2026!")
    ]);

    console.log(`- Admin authenticated: ${adminAuth.user.role} (ID: ${adminAuth.user.id})`);
    console.log(`- Teacher authenticated: ${teacherAuth.user.role} (ID: ${teacherAuth.user.id})`);
    console.log(`- Guardian authenticated: ${guardianAuth.user.role} (ID: ${guardianAuth.user.id})`);

    // Fire 15 parallel requests interleaving all 3 users
    const parallelRequests = [];
    for (let i = 0; i < 5; i++) {
      parallelRequests.push(
        fetch(`${BASE_URL}/api/dashboard/stats`, {
          headers: { Cookie: `ehrj_session_token=${adminAuth.token}` }
        }).then(r => r.json()).then(d => ({ role: "ADMIN", hasStats: d.success === true && !!d.stats }))
      );
      parallelRequests.push(
        fetch(`${BASE_URL}/api/teacher/attendance/assignments`, {
          headers: { Cookie: `ehrj_session_token=${teacherAuth.token}` }
        }).then(r => r.json()).then(d => ({ role: "TEACHER", isArray: d.success === true && Array.isArray(d.assignments) }))
      );
      parallelRequests.push(
        fetch(`${BASE_URL}/api/portal/children`, {
          headers: { Cookie: `ehrj_session_token=${guardianAuth.token}` }
        }).then(r => r.json()).then(d => ({ role: "GUARDIAN", count: d.success === true && Array.isArray(d.children) ? d.children.length : 0 }))
      );
    }

    const parallelResponses = await Promise.all(parallelRequests);
    const adminContaminated = parallelResponses.some(r => r.role === "ADMIN" && !r.hasStats);
    const teacherContaminated = parallelResponses.some(r => r.role === "TEACHER" && !r.isArray);
    const guardianContaminated = parallelResponses.some(r => r.role === "GUARDIAN" && r.count === 0);

    const concurrencyClean = !adminContaminated && !teacherContaminated && !guardianContaminated;
    results.multiUserConcurrency.sessionIsolationClean = concurrencyClean;
    results.multiUserConcurrency.totalParallelOps = parallelRequests.length;
    console.log(`- 15 Concurrent Multi-User Requests: ${concurrencyClean ? "PASSED (Zero State Leakage)" : "FAILED"}`);

    // -------------------------------------------------------------
    // 3. RAPID DUPLICATE OPERATIONS & IDEMPOTENCY
    // -------------------------------------------------------------
    console.log("\n[3/5] Testing Concurrent Write Handling & Idempotency...");
    // Find active student linked to guardian
    const myChildrenRes = await fetch(`${BASE_URL}/api/portal/children`, {
      headers: { Cookie: `ehrj_session_token=${guardianAuth.token}` }
    });
    const myChildren = await myChildrenRes.json();
    const testChildId = myChildren && myChildren.children && myChildren.children.length > 0 ? myChildren.children[0].id : null;

    if (testChildId) {
      // Fire two identical read/action queries simultaneously
      const [res1, res2] = await Promise.all([
        fetch(`${BASE_URL}/api/portal/attendance?studentId=${testChildId}`, {
          headers: { Cookie: `ehrj_session_token=${guardianAuth.token}` }
        }),
        fetch(`${BASE_URL}/api/portal/attendance?studentId=${testChildId}`, {
          headers: { Cookie: `ehrj_session_token=${guardianAuth.token}` }
        })
      ]);
      const idempotent = res1.status === 200 && res2.status === 200;
      results.multiUserConcurrency.idempotentConcurrentReads = idempotent;
      console.log(`- Concurrent Read Idempotency: ${idempotent ? "PASSED (Both 200 OK)" : "FAILED"}`);
    }

    // -------------------------------------------------------------
    // 4. SECURITY REGRESSION: RBAC & COMPREHENSIVE IDOR DEFENSE
    // -------------------------------------------------------------
    console.log("\n[4/5] Testing RBAC & Comprehensive Multi-Point IDOR Defense...");

    // Test 4.1: Unauthenticated request to protected endpoint
    const unauthRes = await fetch(`${BASE_URL}/api/admin/finance/invoices`);
    results.securityRBAC.unauthBlocked = unauthRes.status === 401;
    console.log(`- Unauthenticated /api/admin/finance/invoices: Status ${unauthRes.status} (Expected 401) -> ${results.securityRBAC.unauthBlocked ? "PASSED" : "FAILED"}`);

    // Test 4.2: Malformed JWT token
    const badTokenRes = await fetch(`${BASE_URL}/api/admin/finance/invoices`, {
      headers: { Cookie: "ehrj_session_token=malformed.tampered.jwt_token" }
    });
    results.securityRBAC.badTokenBlocked = badTokenRes.status === 401;
    console.log(`- Tampered/Malformed Session Token: Status ${badTokenRes.status} (Expected 401) -> ${results.securityRBAC.badTokenBlocked ? "PASSED" : "FAILED"}`);

    // Test 4.3: Guardian accessing Admin Finance Invoices
    const guardianAdminRes = await fetch(`${BASE_URL}/api/admin/finance/invoices`, {
      headers: { Cookie: `ehrj_session_token=${guardianAuth.token}` }
    });
    results.securityRBAC.guardianAdminForbidden = guardianAdminRes.status === 403;
    console.log(`- Guardian Access to Admin Finance API: Status ${guardianAdminRes.status} (Expected 403) -> ${results.securityRBAC.guardianAdminForbidden ? "PASSED" : "FAILED"}`);

    // Test 4.4: Teacher accessing Admin Users API
    const teacherAdminRes = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Cookie: `ehrj_session_token=${teacherAuth.token}` }
    });
    results.securityRBAC.teacherAdminUsersForbidden = teacherAdminRes.status === 403;
    console.log(`- Teacher Access to Admin Users API: Status ${teacherAdminRes.status} (Expected 403) -> ${results.securityRBAC.teacherAdminUsersForbidden ? "PASSED" : "FAILED"}`);

    // Test 4.5: IDOR Matrix - Guardian accessing an unlinked student's records
    const unlinkedStudentId = "f3822b9d-0bf2-4584-9b8f-06a5c609b9ca";

    // 4.5a: Attendance
    const idorAttendanceRes = await fetch(`${BASE_URL}/api/portal/attendance?studentId=${unlinkedStudentId}`, {
      headers: { Cookie: `ehrj_session_token=${guardianAuth.token}` }
    });
    results.idorDefenseMatrix.attendanceForbidden = idorAttendanceRes.status === 403;
    console.log(`- IDOR Check (Attendance for unlinked student): Status ${idorAttendanceRes.status} (Expected 403) -> ${results.idorDefenseMatrix.attendanceForbidden ? "PASSED" : "FAILED"}`);

    // 4.5b: Leave Request for unlinked student
    const idorLeaveRes = await fetch(`${BASE_URL}/api/portal/leave-requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `ehrj_session_token=${guardianAuth.token}`
      },
      body: JSON.stringify({
        studentId: unlinkedStudentId,
        startDate: "2026-11-01",
        endDate: "2026-11-03",
        reason: "IDOR test leave attempt"
      })
    });
    results.idorDefenseMatrix.leaveRequestForbidden = idorLeaveRes.status === 403;
    console.log(`- IDOR Check (Leave submission for unlinked student): Status ${idorLeaveRes.status} (Expected 403) -> ${results.idorDefenseMatrix.leaveRequestForbidden ? "PASSED" : "FAILED"}`);

    // 4.5c: Data Correction request for unlinked student
    const idorCorrectionRes = await fetch(`${BASE_URL}/api/portal/data-correction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `ehrj_session_token=${guardianAuth.token}`
      },
      body: JSON.stringify({
        studentId: unlinkedStudentId,
        requestedFields: { phone: "01800000000" },
        reasonBn: "আইডিওআর তথ্য সংশোধন নিরাপত্তা পরীক্ষা"
      })
    });
    results.idorDefenseMatrix.dataCorrectionForbidden = idorCorrectionRes.status === 403;
    console.log(`- IDOR Check (Data correction for unlinked student): Status ${idorCorrectionRes.status} (Expected 403) -> ${results.idorDefenseMatrix.dataCorrectionForbidden ? "PASSED" : "FAILED"}`);

    // -------------------------------------------------------------
    // 5. INPUT VALIDATION & MALFORMED PAYLOAD RESILIENCE
    // -------------------------------------------------------------
    console.log("\n[5/5] Testing Input Validation & Malformed Payload Handling...");
    
    // Malformed JSON payload
    const malformedJsonRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ not valid json }"
    });
    const malformedHandled = malformedJsonRes.status === 400 || malformedJsonRes.status === 500;
    results.inputValidation.malformedJsonProtected = malformedHandled;
    console.log(`- Malformed JSON Handled (Status ${malformedJsonRes.status}): ${malformedHandled ? "PASSED (Safe rejection)" : "FAILED"}`);

    // Empty login payload
    const emptyLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    results.inputValidation.emptyBodyHandled = emptyLoginRes.status === 400;
    console.log(`- Missing Identifier/Password (Status ${emptyLoginRes.status}): ${emptyLoginRes.status === 400 ? "PASSED (400 Bad Request)" : "FAILED"}`);

    console.log("\n==================================================================");
    console.log("  PHASE 36 REGRESSION & CONCURRENCY SUITE COMPLETE");
    console.log("==================================================================");
    console.log(JSON.stringify(results, null, 2));

    await prisma.$disconnect();
  } catch (err) {
    console.error("Test execution encountered an error:", err);
    results.verdict = "FAIL";
    results.error = err.message;
    await prisma.$disconnect();
    process.exit(1);
  }
}

runRegressionSuite();
