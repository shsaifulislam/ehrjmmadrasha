/**
 * EHRJ Madrasha ERP — Phase 24 Test Suite
 * Advanced Security Operations, Identity, Access Governance & Zero-Trust Engine
 * Target: http://localhost:3000
 */

import { prisma } from "../src/lib/prisma";
import {
  createSessionToken,
  verifySessionToken,
  revokeToken,
  isTokenRevoked,
  getUserActiveSessions,
  revokeAllUserSessions,
} from "../src/lib/auth";
import {
  recordSecurityEvent,
  getSecurityEvents,
  checkAccountLockout,
  handleFailedLoginAttempt,
  clearFailedLoginAttempts,
  verifyZeroTrustAccess,
  verifyHighRiskAction,
  createSecurityIncident,
  updateIncidentStatus,
} from "../src/lib/securityEngine";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

let totalPassed = 0;
let totalFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✔ PASS: ${message}`);
    totalPassed++;
  } else {
    console.error(`  ✖ FAIL: ${message}`);
    totalFailed++;
  }
}

async function runPhase24Tests() {
  console.log("==================================================================");
  console.log("  PHASE 24 — ADVANCED SECURITY OPERATIONS & ZERO-TRUST ENGINE     ");
  console.log(`  Target Server: ${BASE_URL}`);
  console.log("==================================================================\n");

  // -------------------------------------------------------------
  // STEP 1: Account Enumeration Defense on Password Reset
  // -------------------------------------------------------------
  console.log("[STEP 1] Testing Account Enumeration Defense on Password Reset (/api/auth/forgot-password/send-otp)...");
  try {
    const fakeEmail = `nonexistent-user-${Date.now()}@example.com`;
    const res = await fetch(`${BASE_URL}/api/auth/forgot-password/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: fakeEmail }),
    });

    assert(res.status === 200, `Unknown email returned HTTP 200 OK (${res.status}) without enumeration`);
    const data = await res.json();
    assert(data.success === true, "Response payload success is true");
    assert(
      data.message.includes("যদি এই ইমেইল ঠিকানায় কোনো সক্রিয় অ্যাকাউন্ট থাকে"),
      "Generic message returned to prevent user/email enumeration"
    );
  } catch (err: any) {
    assert(false, `Password reset enumeration test failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // STEP 2: Stateful Session Tracking & Database Registration
  // -------------------------------------------------------------
  console.log("\n[STEP 2] Testing Stateful Session Tracking & Database Registration...");
  let adminUser: any = null;
  let guardianUser: any = null;
  let teacherUser: any = null;
  let testSessionToken: string = "";

  try {
    adminUser = await prisma.user.findFirst({ where: { role: "ADMIN", status: "ACTIVE" } });
    guardianUser = await prisma.user.findFirst({ where: { role: "GUARDIAN", status: "ACTIVE" } });
    teacherUser = await prisma.user.findFirst({ where: { role: "TEACHER", status: "ACTIVE" } });

    assert(!!adminUser, `Active Admin resolved: ${adminUser?.name}`);
    assert(!!guardianUser, `Active Guardian resolved: ${guardianUser?.name}`);
    assert(!!teacherUser, `Active Teacher resolved: ${teacherUser?.name}`);

    // Create session token with client metadata
    const ip = "192.168.1.105";
    const userAgent = "EHRJ-SecurityAgent/2.4 (Android; Mobile)";
    testSessionToken = await createSessionToken(
      {
        userId: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
        email: adminUser.email,
        name: adminUser.name,
      },
      { ipAddress: ip, userAgent, persist: true }
    );

    assert(typeof testSessionToken === "string" && testSessionToken.length > 50, "Signed JWT session token generated");

    // Check DB session record
    const dbSession = await prisma.session.findFirst({
      where: { token: testSessionToken },
    });
    assert(!!dbSession, "Stateful session successfully persisted in prisma.session table");
    assert(dbSession?.ipAddress === ip, "Session IP address correctly recorded in database");
    assert(dbSession?.userAgent === userAgent, "Session User-Agent correctly recorded in database");

    // Query active sessions helper
    const activeSessions = await getUserActiveSessions(adminUser.id);
    assert(activeSessions.length > 0, `User active sessions queried via helper (Found: ${activeSessions.length})`);
  } catch (err: any) {
    assert(false, `Session tracking test failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // STEP 3: Remote Session Revocation & Instant Invalidation
  // -------------------------------------------------------------
  console.log("\n[STEP 3] Testing Remote Session Revocation & Instant Token Invalidation...");
  try {
    // Verify token initially valid
    const preVerification = await verifySessionToken(testSessionToken);
    assert(preVerification?.userId === adminUser.id, "Session token initially verifies as valid");

    // Revoke token
    await revokeToken(testSessionToken, "Test Remote Session Revocation");
    assert(isTokenRevoked(testSessionToken) === true, "Token marked as revoked in security revocation ledger");

    // Verify token rejected after revocation
    const postVerification = await verifySessionToken(testSessionToken);
    assert(postVerification === null, "Revoked token immediately fails verification (returns null)");

    // Verify token deleted from prisma.session
    const deletedDbSession = await prisma.session.findUnique({
      where: { token: testSessionToken },
    });
    assert(!deletedDbSession, "Revoked session deleted from active prisma.session database table");
  } catch (err: any) {
    assert(false, `Session revocation test failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // STEP 4: Brute-Force Detection & Temporary Account Lockout
  // -------------------------------------------------------------
  console.log("\n[STEP 4] Testing Brute-Force Detection & Temporary Account Lockout...");
  try {
    const testIdentifier = `test_account_${Date.now()}`;
    const testIp = "192.168.1.200";

    clearFailedLoginAttempts(testIdentifier);
    let lockStatus = checkAccountLockout(testIdentifier, testIp);
    assert(!lockStatus.isLocked, "Fresh identifier is not locked");

    // Simulate 4 failed attempts (under threshold)
    for (let i = 1; i <= 4; i++) {
      const res = await handleFailedLoginAttempt(testIdentifier, testIp, "Mozilla/5.0 TestAgent");
      assert(!res.isLocked, `Attempt ${i}: Account remains unlocked (Remaining: ${res.remainingAttempts})`);
    }

    // 5th attempt triggers lockout
    const fifthAttempt = await handleFailedLoginAttempt(testIdentifier, testIp, "Mozilla/5.0 TestAgent");
    assert(fifthAttempt.isLocked === true, "5th failed attempt triggers account lockout (isLocked = true)");
    assert(fifthAttempt.remainingAttempts === 0, "Zero remaining attempts available");

    const activeLock = checkAccountLockout(testIdentifier, testIp);
    assert(activeLock.isLocked === true, "Account lockout verified via checkAccountLockout");
    assert((activeLock.remainingMinutes || 0) > 0, `Lockout duration remaining: ${activeLock.remainingMinutes} minutes`);

    // Clean up
    clearFailedLoginAttempts(testIdentifier);
    assert(!checkAccountLockout(testIdentifier, testIp).isLocked, "Failed attempt counter successfully cleared");
  } catch (err: any) {
    assert(false, `Brute-force test failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // STEP 5: Zero-Trust Authorization & Scoped Role Access
  // -------------------------------------------------------------
  console.log("\n[STEP 5] Testing Zero-Trust Authorization & Scoped Role Access...");
  try {
    // 1. Admin Zero-Trust Check
    const adminVerdict = await verifyZeroTrustAccess({
      user: {
        userId: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
        email: adminUser.email,
        name: adminUser.name,
      },
      requiredRole: "ADMIN",
      resourceType: "FinanceLedger",
    });
    assert(adminVerdict.authorized === true, "Admin granted access to administrative resources");

    // 2. Role Boundary Check: Teacher blocked from Admin resource
    const teacherBlocked = await verifyZeroTrustAccess({
      user: {
        userId: teacherUser.id,
        username: teacherUser.username,
        role: teacherUser.role,
        email: teacherUser.email,
        name: teacherUser.name,
      },
      requiredRole: "ADMIN",
      resourceType: "OperationsBackup",
    });
    assert(teacherBlocked.authorized === false, "Teacher strictly blocked from ADMIN resources (403)");
    assert(teacherBlocked.status === 403, "Status code is 403 Forbidden");

    // 3. IDOR Defense: Guardian querying unlinked child
    const fakeStudentId = "fake-student-id-99999";
    const guardianIdorVerdict = await verifyZeroTrustAccess({
      user: {
        userId: guardianUser.id,
        username: guardianUser.username,
        role: guardianUser.role,
        email: guardianUser.email,
        name: guardianUser.name,
      },
      requiredRole: "GUARDIAN",
      targetStudentId: fakeStudentId,
      resourceType: "StudentAcademicReport",
    });
    assert(guardianIdorVerdict.authorized === false, "Guardian strictly blocked from unlinked student record (IDOR Defense)");
    assert(guardianIdorVerdict.reason?.includes("IDOR"), "Reason clearly flags IDOR security violation");
  } catch (err: any) {
    assert(false, `Zero-Trust authorization test failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // STEP 6: High-Risk Privileged Action Protection
  // -------------------------------------------------------------
  console.log("\n[STEP 6] Testing High-Risk Privileged Action Protection (Step-Up Confirmation)...");
  try {
    // Incorrect confirmation phrase
    const badStepUp = verifyHighRiskAction("ACCOUNT_SUSPEND", "WRONG-PHRASE");
    assert(!badStepUp.allowed, "Invalid confirmation phrase rejected for ACCOUNT_SUSPEND");
    assert(badStepUp.error?.includes("CONFIRM-ACCOUNT-SUSPEND"), "Error clearly states required confirmation phrase");

    // Correct confirmation phrase
    const goodStepUp = verifyHighRiskAction("ACCOUNT_SUSPEND", "CONFIRM-ACCOUNT-SUSPEND");
    assert(goodStepUp.allowed === true, "Correct phrase verified for ACCOUNT_SUSPEND");

    // Database Restore step-up
    const restoreStepUp = verifyHighRiskAction("DATABASE_RESTORE", "RESTORE-DATABASE-CONFIRM");
    assert(restoreStepUp.allowed === true, "Database restore step-up phrase verified (RESTORE-DATABASE-CONFIRM)");
  } catch (err: any) {
    assert(false, `High-risk action protection test failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // STEP 7: Security Event Recording & Immutability
  // -------------------------------------------------------------
  console.log("\n[STEP 7] Testing Security Event Recording & Immutability...");
  try {
    const customEvent = await recordSecurityEvent({
      eventType: "AI_INJECTION_DETECTED",
      severity: "CRITICAL",
      userId: adminUser.id,
      username: adminUser.username,
      ipAddress: "10.0.0.99",
      resource: "PromptFirewall",
      details: { attackVector: "ignore_previous_rules_test" },
    });

    assert(customEvent.id.startsWith("EHRJ-SEC-"), `Canonical event ID generated: ${customEvent.id}`);
    assert(customEvent.severity === "CRITICAL", "Critical severity stamped correctly");

    // Query events
    const criticalEvents = getSecurityEvents({ severity: "CRITICAL", limit: 10 });
    const found = criticalEvents.some((e) => e.id === customEvent.id);
    assert(found, "Custom security event retrieved from append-only security log");
  } catch (err: any) {
    assert(false, `Security event recording test failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // STEP 8: Security Incident Lifecycle (P0-P4)
  // -------------------------------------------------------------
  console.log("\n[STEP 8] Testing Security Incident Lifecycle (P0-P4 Priorities)...");
  try {
    const incidentTitle = `টেস্ট নিরাপত্তা ইনসিডেন্ট - ${Date.now()}`;
    const incident = await createSecurityIncident({
      title: incidentTitle,
      description: "স্বয়ংক্রিয় নিরাপত্তা পরীক্ষার অংশ হিসেবে কৃত্রিম ইনসিডেন্ট সৃষ্টি",
      severity: "HIGH",
      affectedService: "AUTHENTICATION",
      detectedById: adminUser.id,
    });

    assert(incident.incidentCode.startsWith("EHRJ-INC-"), `Incident code generated: ${incident.incidentCode}`);
    assert(incident.status === "OPEN", "Initial incident status is OPEN");
    assert(incident.severity === "HIGH", "Incident priority is HIGH (P2)");

    // Transition to INVESTIGATING
    const investigating = await updateIncidentStatus(
      incident.id,
      "INVESTIGATING",
      adminUser.name,
      "তদন্ত প্রক্রিয়া শুরু হয়েছে।"
    );
    assert(investigating.status === "INVESTIGATING", "Incident status transitioned to INVESTIGATING");

    // Transition to RESOLVED
    const resolved = await updateIncidentStatus(
      incident.id,
      "RESOLVED",
      adminUser.name,
      "নিরাপত্তা অডিট সম্পন্ন এবং হুমকি প্রতিরোধ করা হয়েছে।"
    );
    assert(resolved.status === "RESOLVED", "Incident status transitioned to RESOLVED");
    assert(!!resolved.resolvedAt, "Incident resolution timestamp recorded");
  } catch (err: any) {
    assert(false, `Incident lifecycle test failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // STEP 9: Live HTTP Smoke Tests on Phase 24 Endpoints
  // -------------------------------------------------------------
  console.log("\n[STEP 9] Performing Live HTTP Smoke Tests on Phase 24 Endpoints...");
  try {
    // Generate fresh valid admin session token for HTTP requests
    const httpAdminToken = await createSessionToken(
      {
        userId: adminUser.id,
        username: adminUser.username,
        role: "ADMIN",
        email: adminUser.email,
        name: adminUser.name,
      },
      { persist: true }
    );

    const httpGuardianToken = await createSessionToken(
      {
        userId: guardianUser.id,
        username: guardianUser.username,
        role: "GUARDIAN",
        email: guardianUser.email,
        name: guardianUser.name,
      },
      { persist: true }
    );

    // 1. Anonymous access rejected on /api/admin/security/overview
    const anonRes = await fetch(`${BASE_URL}/api/admin/security/overview`);
    assert(anonRes.status === 403, `Anonymous /api/admin/security/overview rejected with HTTP 403 (${anonRes.status})`);

    // 2. Admin access granted on /api/admin/security/overview
    const authOvRes = await fetch(`${BASE_URL}/api/admin/security/overview`, {
      headers: {
        Cookie: `ehrj_session_token=${httpAdminToken}`,
        Authorization: `Bearer ${httpAdminToken}`,
      },
    });
    assert(authOvRes.status === 200, `Admin /api/admin/security/overview returned HTTP 200 OK (${authOvRes.status})`);
    const ovData = await authOvRes.json();
    assert(ovData.success === true, "Overview API returned success: true");
    assert(typeof ovData?.data?.stats?.activeSessions === "number", "Active sessions count present in stats");

    // 3. Admin access on /api/admin/security/events
    const eventsRes = await fetch(`${BASE_URL}/api/admin/security/events?limit=5`, {
      headers: {
        Cookie: `ehrj_session_token=${httpAdminToken}`,
        Authorization: `Bearer ${httpAdminToken}`,
      },
    });
    assert(eventsRes.status === 200, `Admin /api/admin/security/events returned HTTP 200 OK (${eventsRes.status})`);
    const eventsData = await eventsRes.json();
    assert(Array.isArray(eventsData?.data?.events), "Events array present in response");

    // 4. Admin access on /api/admin/security/sessions
    const sessRes = await fetch(`${BASE_URL}/api/admin/security/sessions`, {
      headers: {
        Cookie: `ehrj_session_token=${httpAdminToken}`,
        Authorization: `Bearer ${httpAdminToken}`,
      },
    });
    assert(sessRes.status === 200, `Admin /api/admin/security/sessions returned HTTP 200 OK (${sessRes.status})`);
    const sessData = await sessRes.json();
    assert(Array.isArray(sessData?.data?.sessions), "Sessions array present in response");

    // 5. Admin access on /api/admin/security/incidents
    const incRes = await fetch(`${BASE_URL}/api/admin/security/incidents`, {
      headers: {
        Cookie: `ehrj_session_token=${httpAdminToken}`,
        Authorization: `Bearer ${httpAdminToken}`,
      },
    });
    assert(incRes.status === 200, `Admin /api/admin/security/incidents returned HTTP 200 OK (${incRes.status})`);
    const incData = await incRes.json();
    assert(Array.isArray(incData?.data?.incidents), "Incidents array present in response");

    // 6. Guardian access on /api/portal/security/sessions
    const portalSessRes = await fetch(`${BASE_URL}/api/portal/security/sessions`, {
      headers: {
        Cookie: `ehrj_session_token=${httpGuardianToken}`,
        Authorization: `Bearer ${httpGuardianToken}`,
      },
    });
    assert(portalSessRes.status === 200, `Guardian /api/portal/security/sessions returned HTTP 200 OK (${portalSessRes.status})`);
    const portalSessData = await portalSessRes.json();
    assert(Array.isArray(portalSessData.data.sessions), "Guardian sessions array present in response");
  } catch (err: any) {
    assert(false, `HTTP smoke tests failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`  PHASE 24 SECURITY ENGINE: ${totalPassed} PASSED, ${totalFailed} FAILED`);
  console.log("==================================================================\n");

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runPhase24Tests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test execution error:", err);
    process.exit(1);
  });
