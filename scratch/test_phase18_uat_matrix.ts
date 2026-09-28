/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 18
 * Master UAT & Production Launch Readiness Test Suite
 * Tests Personas, Performance Benchmarks & Database Integrity
 */

import { prisma } from "../src/lib/prisma";
import { createSessionToken } from "../src/lib/auth";

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

async function runUATAndLaunchReadiness() {
  console.log("\n==================================================================");
  console.log("  PHASE 18 USER ACCEPTANCE TESTING (UAT) & LAUNCH READINESS SUITE");
  console.log(`  Target: ${BASE_URL}`);
  console.log("==================================================================\n");

  // -------------------------------------------------------------------
  // Setup Real Role Tokens
  // -------------------------------------------------------------------
  console.log("[SETUP] Resolving authentic users for all 4 personas...");
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const principalUser = await prisma.user.findFirst({ where: { role: "PRINCIPAL" } });
  const teacherUser = await prisma.user.findFirst({ where: { role: "TEACHER" } });
  const guardianUser = await prisma.user.findFirst({ where: { role: "GUARDIAN" } });

  const adminToken = adminUser ? await createSessionToken({ userId: adminUser.id, username: adminUser.username, role: "ADMIN", email: adminUser.email, name: adminUser.name }) : null;
  const principalToken = principalUser ? await createSessionToken({ userId: principalUser.id, username: principalUser.username, role: "PRINCIPAL", email: principalUser.email, name: principalUser.name }) : null;
  const teacherToken = teacherUser ? await createSessionToken({ userId: teacherUser.id, username: teacherUser.username, role: "TEACHER", email: teacherUser.email, name: teacherUser.name }) : null;
  const guardianToken = guardianUser ? await createSessionToken({ userId: guardianUser.id, username: guardianUser.username, role: "GUARDIAN", email: guardianUser.email, name: guardianUser.name }) : null;

  // -------------------------------------------------------------------
  // UAT PERSONA 1: ADMIN
  // -------------------------------------------------------------------
  console.log("--- UAT PERSONA 1: ADMINISTRATOR ---");
  if (adminToken) {
    const healthRes = await fetch(`${BASE_URL}/api/admin/operations/health`, {
      headers: { Cookie: `ehrj_session_token=${adminToken}` },
    });
    assert(healthRes.status === 200, "Admin UAT 1: Access operations health diagnostics (HTTP 200 OK)");

    const backupListRes = await fetch(`${BASE_URL}/api/admin/operations/backups`, {
      headers: { Cookie: `ehrj_session_token=${adminToken}` },
    });
    assert(backupListRes.status === 200, "Admin UAT 2: Query system backups catalog (HTTP 200 OK)");

    const studentListRes = await fetch(`${BASE_URL}/api/admin/students`, {
      headers: { Cookie: `ehrj_session_token=${adminToken}` },
    });
    assert(studentListRes.status === 200, "Admin UAT 3: Access comprehensive student directory (HTTP 200 OK)");

    const overviewRes = await fetch(`${BASE_URL}/api/admin/analytics/overview`, {
      headers: { Cookie: `ehrj_session_token=${adminToken}` },
    });
    assert(overviewRes.status === 200, "Admin UAT 4: Access institutional overview analytics (HTTP 200 OK)");
  }

  // -------------------------------------------------------------------
  // UAT PERSONA 2: PRINCIPAL
  // -------------------------------------------------------------------
  console.log("\n--- UAT PERSONA 2: PRINCIPAL (EXECUTIVE OVERSIGHT) ---");
  if (principalToken) {
    const principalOverview = await fetch(`${BASE_URL}/api/admin/analytics/overview`, {
      headers: { Cookie: `ehrj_session_token=${principalToken}` },
    });
    assert(principalOverview.status === 200, "Principal UAT 1: View executive oversight dashboard (HTTP 200 OK)");

    const principalRestoreAttempt = await fetch(`${BASE_URL}/api/admin/operations/backups/test/restore`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `ehrj_session_token=${principalToken}` },
      body: JSON.stringify({ confirmation: "RESTORE PRODUCTION DATABASE", reason: "Test" }),
    });
    assert(principalRestoreAttempt.status === 403, "Principal UAT 2: Prohibited from executing destructive restore (HTTP 403 Forbidden)");
  }

  // -------------------------------------------------------------------
  // UAT PERSONA 3: TEACHER
  // -------------------------------------------------------------------
  console.log("\n--- UAT PERSONA 3: TEACHER (ACADEMIC INSTRUCTION) ---");
  if (teacherToken) {
    const teacherAnalyticsRes = await fetch(`${BASE_URL}/api/teacher/analytics`, {
      headers: { Cookie: `ehrj_session_token=${teacherToken}` },
    });
    assert(teacherAnalyticsRes.status === 200, "Teacher UAT 1: Query assigned class metrics & analytics (HTTP 200 OK)");

    const teacherFinanceAttempt = await fetch(`${BASE_URL}/api/admin/finance`, {
      headers: { Cookie: `ehrj_session_token=${teacherToken}` },
    });
    assert(teacherFinanceAttempt.status === 403, "Teacher UAT 2: Prohibited from accessing administrative finance (HTTP 403 Forbidden)");
  }

  // -------------------------------------------------------------------
  // UAT PERSONA 4: GUARDIAN
  // -------------------------------------------------------------------
  console.log("\n--- UAT PERSONA 4: GUARDIAN (PORTAL & PARENT ACCESS) ---");
  if (guardianToken) {
    const childrenRes = await fetch(`${BASE_URL}/api/portal/children`, {
      headers: { Cookie: `ehrj_session_token=${guardianToken}` },
    });
    assert(childrenRes.status === 200, "Guardian UAT 1: Query authorized linked children list (HTTP 200 OK)");

    const childrenData = await childrenRes.json();
    const firstChild = (childrenData.students && childrenData.students[0]) || (childrenData.children && childrenData.children[0]);
    const financeUrl = firstChild ? `${BASE_URL}/api/portal/finance?studentId=${firstChild.id || firstChild.studentId}` : `${BASE_URL}/api/portal/finance`;
    const financeRes = await fetch(financeUrl, {
      headers: { Cookie: `ehrj_session_token=${guardianToken}` },
    });
    assert(financeRes.status === 200, "Guardian UAT 2: Access child fee invoices and payment history (HTTP 200 OK)");

    const helpdeskRes = await fetch(`${BASE_URL}/api/portal/helpdesk`, {
      headers: { Cookie: `ehrj_session_token=${guardianToken}` },
    });
    assert(helpdeskRes.status === 200, "Guardian UAT 3: Access guardian support requests and tickets (HTTP 200 OK)");

    const adminDirAttempt = await fetch(`${BASE_URL}/api/admin/students`, {
      headers: { Cookie: `ehrj_session_token=${guardianToken}` },
    });
    assert(adminDirAttempt.status === 403, "Guardian UAT 4: Prohibited from querying full administrative student directory (HTTP 403 Forbidden)");
  }

  // -------------------------------------------------------------------
  // UAT PERSONA 5: PUBLIC VISITOR & CITIZEN
  // -------------------------------------------------------------------
  console.log("\n--- UAT PERSONA 5: PUBLIC VISITOR & CITIZEN ---");
  const homeRes = await fetch(`${BASE_URL}/`);
  assert(homeRes.status === 200, "Public UAT 1: Public portal homepage loads cleanly (HTTP 200 OK)");

  const contactRes = await fetch(`${BASE_URL}/contact`);
  assert(contactRes.status === 200, "Public UAT 2: Official contact page loads cleanly (HTTP 200 OK)");

  const verifyDocRes = await fetch(`${BASE_URL}/api/verify/document/NON_EXISTENT_SAMPLE`);
  assert(verifyDocRes.status === 404, "Public UAT 3: Document verification responds safely without stack traces (HTTP 404)");

  // -------------------------------------------------------------------
  // PERFORMANCE BENCHMARKS (MEASURED LATENCIES)
  // -------------------------------------------------------------------
  console.log("\n--- PERFORMANCE LATENCY BENCHMARKS ---");
  
  // 1. Homepage Latency
  const t0 = Date.now();
  await fetch(`${BASE_URL}/`);
  const homeLatency = Date.now() - t0;
  console.log(`  Observed Homepage latency: ${homeLatency}ms`);
  assert(homeLatency < 3000, `Homepage latency is within acceptable threshold (${homeLatency}ms < 3000ms)`);

  // 2. Health Endpoint Latency
  const t1 = Date.now();
  await fetch(`${BASE_URL}/api/health`);
  const healthLatency = Date.now() - t1;
  console.log(`  Observed Health check latency: ${healthLatency}ms`);
  assert(healthLatency < 1000, `Health check latency is fast (${healthLatency}ms < 1000ms)`);

  // 3. Authenticated Overview Analytics Latency
  if (adminToken) {
    const t2 = Date.now();
    await fetch(`${BASE_URL}/api/admin/analytics/overview`, {
      headers: { Cookie: `ehrj_session_token=${adminToken}` },
    });
    const analyticsLatency = Date.now() - t2;
    console.log(`  Observed Overview Analytics latency: ${analyticsLatency}ms`);
    assert(analyticsLatency < 3000, `Overview Analytics renders within acceptable bound (${analyticsLatency}ms < 3000ms)`);
  }

  // -------------------------------------------------------------------
  // AUTHORITATIVE DATABASE INTEGRITY AUDIT
  // -------------------------------------------------------------------
  console.log("\n--- AUTHORITATIVE DATABASE INTEGRITY AUDIT ---");

  // 1. Orphan Enrollment check
  const allEnrollments = await prisma.enrollment.findMany({ select: { id: true, studentId: true } });
  const allStudentIds = new Set((await prisma.student.findMany({ select: { id: true } })).map((s) => s.id));
  const orphanEnrollments = allEnrollments.filter((e) => !allStudentIds.has(e.studentId));
  assert(orphanEnrollments.length === 0, `Database Integrity: 0 orphan student enrollments found (Checked: ${allEnrollments.length})`);

  // 2. Cash Funds Balance Consistency
  const cashFunds = await prisma.cashFund.findMany();
  let negativeFundsCount = 0;
  for (const f of cashFunds) {
    if (f.currentBalance < 0 && f.code !== "GENERAL") {
      negativeFundsCount++;
    }
  }
  assert(negativeFundsCount === 0, `Database Integrity: No unauthorized negative cash funds found (${cashFunds.length} funds verified)`);

  // 3. Invoice Math Integrity Check
  const activeInvoices = await prisma.feeInvoice.findMany();
  let mathIntegrityPassed = true;
  for (const inv of activeInvoices) {
    const computedDue = Math.max(0, inv.totalAmount - inv.paidAmount - ((inv as any).waiverAmount || 0) - ((inv as any).discountAmount || 0));
    if (Math.abs(computedDue - inv.dueAmount) > 0.01) {
      mathIntegrityPassed = false;
      break;
    }
  }
  assert(mathIntegrityPassed, `Database Integrity: All ${activeInvoices.length} invoices maintain strict due balance equality (dueAmount == totalAmount - paidAmount - waiverAmount - discountAmount)`);

  // -------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`  PHASE 18 UAT & LAUNCH READINESS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("==================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runUATAndLaunchReadiness().catch((err) => {
  console.error("Fatal error in Phase 18 UAT:", err);
  process.exit(1);
});
