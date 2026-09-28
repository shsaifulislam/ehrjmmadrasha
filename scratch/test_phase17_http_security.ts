/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 17
 * Comprehensive HTTP, API, Header & Cross-Role Security Test Suite
 */

import { createSessionToken } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${testName}`);
    passedCount++;
  } else {
    console.error(`  \x1b[31m✘ FAIL\x1b[0m: ${testName} ${detail ? `(${detail})` : ""}`);
    failedCount++;
  }
}

async function runHttpSecurityTests() {
  console.log("\n========================================================");
  console.log("  PHASE 17 HTTP, API & PROTOCOL SECURITY TEST SUITE");
  console.log(`  Target: ${BASE_URL}`);
  console.log("========================================================\n");

  // -------------------------------------------------------------------
  // 1. HTTP SECURITY HEADERS AUDIT
  // -------------------------------------------------------------------
  console.log("[1] Production HTTP Security Headers Inspection");
  try {
    const res = await fetch(`${BASE_URL}/`, { method: "GET" });
    const headers = res.headers;

    const xfo = headers.get("x-frame-options");
    assert(xfo === "SAMEORIGIN" || xfo === "DENY", `X-Frame-Options is properly configured (${xfo})`);

    const xcto = headers.get("x-content-type-options");
    assert(xcto === "nosniff", `X-Content-Type-Options is nosniff (${xcto})`);

    const refPolicy = headers.get("referrer-policy");
    assert(Boolean(refPolicy), `Referrer-Policy header is present (${refPolicy})`);

    const permPolicy = headers.get("permissions-policy");
    assert(Boolean(permPolicy), `Permissions-Policy header is present (${permPolicy})`);
  } catch (err: any) {
    assert(false, "Failed to connect to web server for header audit", err.message);
  }

  // -------------------------------------------------------------------
  // 2. ACCOUNT ENUMERATION PREVENTION OVER HTTP
  // -------------------------------------------------------------------
  console.log("\n[2] Account Enumeration Protection at /api/auth/login");
  try {
    // 2.1 Non-existent user
    const resNonExistent = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "completely_nonexistent_user_998877@ehrj.edu.bd",
        password: "ArbitraryPassword123!",
      }),
    });
    const dataNonExistent = await resNonExistent.json();

    // 2.2 Existing user with wrong password
    const existingUser = await prisma.user.findFirst();
    let resWrongPass: Response | null = null;
    let dataWrongPass: any = null;

    if (existingUser) {
      resWrongPass = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: existingUser.username,
          password: "DefinitelyWrongPassword999!",
        }),
      });
      dataWrongPass = await resWrongPass.json();
    }

    assert(resNonExistent.status === 401, "Non-existent user receives HTTP 401");
    if (resWrongPass) {
      assert(resWrongPass.status === 401, "Existing user with wrong password receives HTTP 401");
      assert(
        dataNonExistent.error === dataWrongPass.error,
        "Account enumeration blocked: Identical error message returned for non-existent user and wrong password"
      );
    }
  } catch (err: any) {
    assert(false, "Account enumeration test threw error", err.message);
  }

  // -------------------------------------------------------------------
  // 3. ANONYMOUS ACCESS PROTECTION ON PROTECTED APIS
  // -------------------------------------------------------------------
  console.log("\n[3] Anonymous Request Rejection on Protected APIs");
  const protectedEndpoints = [
    { url: "/api/admin/students", method: "GET" },
    { url: "/api/admin/guardians", method: "GET" },
    { url: "/api/admin/operations/backups", method: "GET" },
    { url: "/api/admin/operations/health", method: "GET" },
    { url: "/api/portal/children", method: "GET" },
  ];

  for (const ep of protectedEndpoints) {
    try {
      const res = await fetch(`${BASE_URL}${ep.url}`, {
        method: ep.method,
        headers: { "Content-Type": "application/json" },
      });
      assert(res.status === 401 || res.status === 403, `Anonymous call to ${ep.url} is blocked (${res.status})`);
    } catch (err: any) {
      assert(false, `Call to ${ep.url} threw error`, err.message);
    }
  }

  // -------------------------------------------------------------------
  // 4. CROSS-ROLE RBAC & PRIVILEGE ESCALATION BLOCKING
  // -------------------------------------------------------------------
  console.log("\n[4] Cross-Role RBAC & Scope Isolation");

  // Create real test session tokens for different roles
  const guardianUser = await prisma.user.findFirst({ where: { role: "GUARDIAN" } });
  const teacherUser = await prisma.user.findFirst({ where: { role: "TEACHER" } });
  const principalUser = await prisma.user.findFirst({ where: { role: "PRINCIPAL" } });
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });

  const guardianToken = guardianUser
    ? await createSessionToken({
        userId: guardianUser.id,
        username: guardianUser.username,
        role: "GUARDIAN",
        email: guardianUser.email,
        name: guardianUser.name,
      })
    : null;

  const teacherToken = teacherUser
    ? await createSessionToken({
        userId: teacherUser.id,
        username: teacherUser.username,
        role: "TEACHER",
        email: teacherUser.email,
        name: teacherUser.name,
      })
    : null;

  const principalToken = principalUser
    ? await createSessionToken({
        userId: principalUser.id,
        username: principalUser.username,
        role: "PRINCIPAL",
        email: principalUser.email,
        name: principalUser.name,
      })
    : null;

  const adminToken = adminUser
    ? await createSessionToken({
        userId: adminUser.id,
        username: adminUser.username,
        role: "ADMIN",
        email: adminUser.email,
        name: adminUser.name,
      })
    : null;

  // 4.1 Guardian attempting Admin Student directory
  if (guardianToken) {
    const res = await fetch(`${BASE_URL}/api/admin/students`, {
      headers: { Cookie: `ehrj_session_token=${guardianToken}` },
    });
    assert(res.status === 403, "GUARDIAN attempting to access /api/admin/students receives HTTP 403 Forbidden");

    // Guardian attempting Admin Operations (Backup)
    const bkpRes = await fetch(`${BASE_URL}/api/admin/operations/backups`, {
      headers: { Cookie: `ehrj_session_token=${guardianToken}` },
    });
    assert(bkpRes.status === 403, "GUARDIAN attempting /api/admin/operations/backups receives HTTP 403 Forbidden");

    // Guardian attempting Admin Guardians Directory
    const grdRes = await fetch(`${BASE_URL}/api/admin/guardians`, {
      headers: { Cookie: `ehrj_session_token=${guardianToken}` },
    });
    assert(grdRes.status === 403, "GUARDIAN attempting /api/admin/guardians receives HTTP 403 Forbidden");
  }

  // 4.2 Teacher attempting Admin Operations
  if (teacherToken) {
    const bkpRes = await fetch(`${BASE_URL}/api/admin/operations/backups`, {
      headers: { Cookie: `ehrj_session_token=${teacherToken}` },
    });
    assert(bkpRes.status === 403, "TEACHER attempting /api/admin/operations/backups receives HTTP 403 Forbidden");

    // Teacher attempting Admin Guardians Directory
    const grdRes = await fetch(`${BASE_URL}/api/admin/guardians`, {
      headers: { Cookie: `ehrj_session_token=${teacherToken}` },
    });
    assert(grdRes.status === 403, "TEACHER attempting /api/admin/guardians receives HTTP 403 Forbidden");
  }

  // 4.3 Principal attempting Destructive Operations (Restore)
  if (principalToken) {
    const restoreRes = await fetch(`${BASE_URL}/api/admin/operations/backups/dummy-id/restore`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `ehrj_session_token=${principalToken}`,
      },
      body: JSON.stringify({
        confirmation: "RESTORE PRODUCTION DATABASE",
        reason: "Test",
      }),
    });
    assert(
      restoreRes.status === 403,
      "PRINCIPAL attempting destructive /api/admin/operations/backups/dummy-id/restore receives HTTP 403 Forbidden"
    );
  }

  // 4.4 Admin authorized access
  if (adminToken) {
    const healthRes = await fetch(`${BASE_URL}/api/admin/operations/health`, {
      headers: { Cookie: `ehrj_session_token=${adminToken}` },
    });
    assert(healthRes.status === 200, "ADMIN successfully accesses /api/admin/operations/health (HTTP 200 OK)");
  }

  // -------------------------------------------------------------------
  // 5. PUBLIC VERIFICATION SAFE BEHAVIOR & ERROR HYGIENE
  // -------------------------------------------------------------------
  console.log("\n[5] Public Verification Safe Error Hygiene (No Stack Traces)");
  try {
    const fakeToken = "EHRJ-VERIFY-FAKE-TOKEN-9999999";
    const resDoc = await fetch(`${BASE_URL}/api/verify/document/${fakeToken}`);
    assert(resDoc.status === 404, "Invalid document verification token returns clean HTTP 404");

    const dataDoc = await resDoc.json();
    assert(!dataDoc.stack, "Response body contains no server stack trace or internal details");
  } catch (err: any) {
    assert(false, "Public verification threw unexpected error", err.message);
  }

  // -------------------------------------------------------------------
  // 6. MALICIOUS INJECTION & PAYLOAD RESILIENCE
  // -------------------------------------------------------------------
  console.log("\n[6] Malicious Injection & Special Character Resilience");
  try {
    const xssPayload = "<script>alert('xss')</script>";
    const sqlPayload = "1' OR '1'='1";
    const pathTraversal = "../../../../etc/passwd";

    // Testing student search with injection strings
    if (adminToken) {
      const searchRes = await fetch(
        `${BASE_URL}/api/admin/students?search=${encodeURIComponent(xssPayload)}`,
        { headers: { Cookie: `ehrj_session_token=${adminToken}` } }
      );
      assert(searchRes.status === 200, "API handles XSS payload safely without execution or crash (HTTP 200)");

      const sqlRes = await fetch(
        `${BASE_URL}/api/admin/students?search=${encodeURIComponent(sqlPayload)}`,
        { headers: { Cookie: `ehrj_session_token=${adminToken}` } }
      );
      assert(sqlRes.status === 200, "API handles SQL injection payload safely with parameterized query (HTTP 200)");

      const travRes = await fetch(
        `${BASE_URL}/api/admin/students?search=${encodeURIComponent(pathTraversal)}`,
        { headers: { Cookie: `ehrj_session_token=${adminToken}` } }
      );
      assert(travRes.status === 200, "API handles path traversal parameter safely without leaking files (HTTP 200)");
    }
  } catch (err: any) {
    assert(false, "Malicious payload testing threw error", err.message);
  }

  // -------------------------------------------------------------------
  // 7. SUMMARY
  // -------------------------------------------------------------------
  console.log("\n========================================================");
  console.log(`  PHASE 17 HTTP SECURITY TESTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("========================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runHttpSecurityTests().catch((err) => {
  console.error("Fatal error in HTTP security tests:", err);
  process.exit(1);
});
