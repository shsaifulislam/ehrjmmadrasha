import { prisma } from "../src/lib/prisma";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "ehrj-madrasa-digital-campus-secure-production-jwt-secret-key-2026"
);

async function createAuthToken(user: { id: string; username: string; role: string; email: string; name: string }) {
  return new SignJWT({
    userId: user.id,
    username: user.username,
    role: user.role,
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

async function runPhase16HttpEndpointTests() {
  const BASE_URL = "http://localhost:3000";
  console.log("=================================================");
  console.log("🌐 STARTING PHASE 16 HTTP API & SECURITY TESTS");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      failed++;
    }
  }

  // 1. Fetch test users for all 4 authentic roles
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN", status: "ACTIVE" } });
  if (!admin) throw new Error("No active ADMIN user found");

  const principal = await prisma.user.findFirst({ where: { role: "PRINCIPAL", status: "ACTIVE" } });
  if (!principal) throw new Error("No active PRINCIPAL user found");

  const teacher = await prisma.user.findFirst({ where: { role: "TEACHER", status: "ACTIVE" } });
  if (!teacher) throw new Error("No active TEACHER user found");

  const guardian = await prisma.user.findFirst({ where: { role: "GUARDIAN", status: "ACTIVE" } });
  if (!guardian) throw new Error("No active GUARDIAN user found");

  const adminToken = await createAuthToken(admin);
  const principalToken = await createAuthToken(principal);
  const teacherToken = await createAuthToken(teacher);
  const guardianToken = await createAuthToken(guardian);

  const getHeaders = (token?: string) => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Cookie"] = `ehrj_session_token=${token}`;
    return headers;
  };

  try {
    // -----------------------------------------------------------------
    // TEST 1: Public Health Endpoint (Liveness / Readiness)
    // -----------------------------------------------------------------
    console.log("--- 1. Public Health Check (/api/health) ---");
    const pubRes = await fetch(`${BASE_URL}/api/health`);
    assert(pubRes.status === 200, `Public /api/health returned 200 OK (got: ${pubRes.status})`);
    const pubData = await pubRes.json();
    assert(
      ["HEALTHY", "DEGRADED"].includes(pubData.status),
      `Public status is valid (${pubData.status})`
    );
    assert(pubData.timestamp !== undefined, "Timestamp returned in public health response");
    assert(pubData.components === undefined, "Internal component diagnostics are NOT leaked to public");

    // -----------------------------------------------------------------
    // TEST 2: RBAC & Operations Health Check (/api/admin/operations/health)
    // -----------------------------------------------------------------
    console.log("\n--- 2. Operations Health Diagnostics RBAC ---");
    const unauthHealth = await fetch(`${BASE_URL}/api/admin/operations/health`);
    assert(unauthHealth.status === 403 || unauthHealth.status === 401, "Unauthenticated health check blocked with 401/403");

    const teacherHealth = await fetch(`${BASE_URL}/api/admin/operations/health`, { headers: getHeaders(teacherToken) });
    assert(teacherHealth.status === 403, "TEACHER role blocked from operations health check (403)");

    const guardianHealth = await fetch(`${BASE_URL}/api/admin/operations/health`, { headers: getHeaders(guardianToken) });
    assert(guardianHealth.status === 403, "GUARDIAN role blocked from operations health check (403)");

    const principalHealth = await fetch(`${BASE_URL}/api/admin/operations/health`, { headers: getHeaders(principalToken) });
    assert(principalHealth.status === 200, "PRINCIPAL role allowed read-only operations health check (200)");
    const principalHealthData = await principalHealth.json();
    assert(principalHealthData.success === true, "Principal health check returned success: true");

    const adminHealth = await fetch(`${BASE_URL}/api/admin/operations/health`, { headers: getHeaders(adminToken) });
    assert(adminHealth.status === 200, "ADMIN role allowed full operations health diagnostics (200)");
    const adminHealthData = await adminHealth.json();
    assert(adminHealthData.health.components !== undefined, "Admin receives full component breakdown");

    // -----------------------------------------------------------------
    // TEST 3: Backups List & Creation RBAC
    // -----------------------------------------------------------------
    console.log("\n--- 3. Backups API & RBAC ---");
    const unauthBackups = await fetch(`${BASE_URL}/api/admin/operations/backups`);
    assert(unauthBackups.status === 403 || unauthBackups.status === 401, "Unauthenticated backups listing blocked (403/401)");

    const teacherBackups = await fetch(`${BASE_URL}/api/admin/operations/backups`, { headers: getHeaders(teacherToken) });
    assert(teacherBackups.status === 403, "TEACHER role blocked from backups listing (403)");

    const principalBackups = await fetch(`${BASE_URL}/api/admin/operations/backups`, { headers: getHeaders(principalToken) });
    assert(principalBackups.status === 200, "PRINCIPAL role allowed read-only backups listing (200)");

    // Principal cannot trigger backups (Admin only)
    const principalCreateBkp = await fetch(`${BASE_URL}/api/admin/operations/backups`, {
      method: "POST",
      headers: getHeaders(principalToken),
      body: JSON.stringify({ type: "MANUAL" }),
    });
    assert(principalCreateBkp.status === 403, "PRINCIPAL role blocked from creating backup (403 - Admin only)");

    // Admin creates backup
    const adminCreateBkp = await fetch(`${BASE_URL}/api/admin/operations/backups`, {
      method: "POST",
      headers: getHeaders(adminToken),
      body: JSON.stringify({ type: "MANUAL" }),
    });
    assert(adminCreateBkp.status === 201, `ADMIN role created backup via HTTP POST (201, got: ${adminCreateBkp.status})`);
    const createdBkpData = await adminCreateBkp.json();
    assert(!!createdBkpData.backup?.id, "Created backup returned valid ID");
    const testBackupId = createdBkpData.backup.id;

    // -----------------------------------------------------------------
    // TEST 4: Backup Verification & Recovery Drill API
    // -----------------------------------------------------------------
    console.log("\n--- 4. Backup Verification & Recovery Drill API ---");
    // Verify backup
    const verifyRes = await fetch(`${BASE_URL}/api/admin/operations/backups/${testBackupId}/verify`, {
      method: "POST",
      headers: getHeaders(adminToken),
    });
    assert(verifyRes.status === 200, `ADMIN verified backup via HTTP POST (200, got: ${verifyRes.status})`);
    const verifyData = await verifyRes.json();
    assert(verifyData.backup?.verificationStatus === "VERIFIED", "Backup marked VERIFIED");

    // Drill on backup
    const drillRes = await fetch(`${BASE_URL}/api/admin/operations/backups/${testBackupId}/drill`, {
      method: "POST",
      headers: getHeaders(adminToken),
    });
    assert(drillRes.status === 200, `ADMIN conducted recovery drill via HTTP POST (200, got: ${drillRes.status})`);
    const drillData = await drillRes.json();
    assert(drillData.drill?.status === "PASSED", "Recovery drill status is PASSED");

    // -----------------------------------------------------------------
    // TEST 5: Backup Restore API & Danger Confirmation Lock
    // -----------------------------------------------------------------
    console.log("\n--- 5. Backup Restore API & Safety Phrase Verification ---");
    // Principal blocked from restore
    const principalRestore = await fetch(`${BASE_URL}/api/admin/operations/backups/${testBackupId}/restore`, {
      method: "POST",
      headers: getHeaders(principalToken),
      body: JSON.stringify({
        confirmation: "RESTORE PRODUCTION DATABASE",
        reason: "Disaster Recovery Testing",
      }),
    });
    assert(principalRestore.status === 403, "PRINCIPAL blocked from executing restore (403)");

    // Admin with wrong confirmation
    const adminBadConfirm = await fetch(`${BASE_URL}/api/admin/operations/backups/${testBackupId}/restore`, {
      method: "POST",
      headers: getHeaders(adminToken),
      body: JSON.stringify({
        confirmation: "RESTORE",
        reason: "Disaster Recovery Testing",
      }),
    });
    assert(adminBadConfirm.status === 400, "ADMIN restore rejected when confirmation string is incorrect (400)");

    // Admin with empty reason
    const adminBadReason = await fetch(`${BASE_URL}/api/admin/operations/backups/${testBackupId}/restore`, {
      method: "POST",
      headers: getHeaders(adminToken),
      body: JSON.stringify({
        confirmation: "RESTORE PRODUCTION DATABASE",
        reason: "",
      }),
    });
    assert(adminBadReason.status === 400, "ADMIN restore rejected when reason is empty (400)");

    // Admin with valid confirmation
    const adminRestore = await fetch(`${BASE_URL}/api/admin/operations/backups/${testBackupId}/restore`, {
      method: "POST",
      headers: getHeaders(adminToken),
      body: JSON.stringify({
        confirmation: "RESTORE PRODUCTION DATABASE",
        reason: "Valid Disaster Recovery Simulation",
      }),
    });
    assert(adminRestore.status === 200, `ADMIN executed restore with exact safety phrase (200, got: ${adminRestore.status})`);
    const restoreData = await adminRestore.json();
    assert(restoreData.restore?.status === "COMPLETED", "Restore operation status is COMPLETED");

    // -----------------------------------------------------------------
    // TEST 6: Incident Management API & Status Patch
    // -----------------------------------------------------------------
    console.log("\n--- 6. Incidents API & RBAC ---");
    // List incidents with Principal (allowed)
    const principalIncidents = await fetch(`${BASE_URL}/api/admin/operations/incidents`, {
      headers: getHeaders(principalToken),
    });
    assert(principalIncidents.status === 200, "PRINCIPAL allowed to view incidents (200)");

    // Teacher cannot create incident
    const teacherCreateInc = await fetch(`${BASE_URL}/api/admin/operations/incidents`, {
      method: "POST",
      headers: getHeaders(teacherToken),
      body: JSON.stringify({
        title: "Unauthorized incident",
        description: "Testing RBAC",
      }),
    });
    assert(teacherCreateInc.status === 403, "TEACHER blocked from creating incident (403)");

    // Admin creates incident
    const adminCreateInc = await fetch(`${BASE_URL}/api/admin/operations/incidents`, {
      method: "POST",
      headers: getHeaders(adminToken),
      body: JSON.stringify({
        title: "Network Latency Spike Detected",
        description: "Upstream ISP packet loss observed during morning session.",
        severity: "HIGH",
        affectedService: "APPLICATION",
      }),
    });
    assert(adminCreateInc.status === 201, `ADMIN created incident via HTTP POST (201, got: ${adminCreateInc.status})`);
    const incData = await adminCreateInc.json();
    const incidentId = incData.incident.id;

    // Admin patches status to ACKNOWLEDGED
    const ackInc = await fetch(`${BASE_URL}/api/admin/operations/incidents/${incidentId}/status`, {
      method: "PATCH",
      headers: getHeaders(adminToken),
      body: JSON.stringify({
        status: "ACKNOWLEDGED",
        note: "ISP ticket opened with technical provider.",
      }),
    });
    assert(ackInc.status === 200, "ADMIN updated incident status to ACKNOWLEDGED (200)");

    // Admin patches status to RESOLVED
    const resInc = await fetch(`${BASE_URL}/api/admin/operations/incidents/${incidentId}/status`, {
      method: "PATCH",
      headers: getHeaders(adminToken),
      body: JSON.stringify({
        status: "RESOLVED",
        note: "ISP fiber link restored to 100Mbps full duplex.",
      }),
    });
    assert(resInc.status === 200, "ADMIN updated incident status to RESOLVED (200)");

    // -----------------------------------------------------------------
    // TEST 7: Operational Alerts API
    // -----------------------------------------------------------------
    console.log("\n--- 7. Operational Alerts API & Actions ---");
    const alertsRes = await fetch(`${BASE_URL}/api/admin/operations/alerts`, {
      headers: getHeaders(adminToken),
    });
    assert(alertsRes.status === 200, "ADMIN retrieved alerts list (200)");
    const alertsData = await alertsRes.json();
    assert(Array.isArray(alertsData.alerts), "Alerts array returned");

    if (alertsData.alerts.length > 0) {
      const targetAlertId = alertsData.alerts[0].id;
      const ackAlert = await fetch(`${BASE_URL}/api/admin/operations/alerts/${targetAlertId}/acknowledge`, {
        method: "PATCH",
        headers: getHeaders(adminToken),
      });
      assert(ackAlert.status === 200, "ADMIN acknowledged operational alert (200)");

      const resAlert = await fetch(`${BASE_URL}/api/admin/operations/alerts/${targetAlertId}/resolve`, {
        method: "PATCH",
        headers: getHeaders(adminToken),
      });
      assert(resAlert.status === 200, "ADMIN resolved operational alert (200)");
    }

    // -----------------------------------------------------------------
    // TEST 8: Maintenance Mode API
    // -----------------------------------------------------------------
    console.log("\n--- 8. Maintenance Mode API & Toggle ---");
    // Principal blocked from enabling maintenance
    const principalMaint = await fetch(`${BASE_URL}/api/admin/operations/maintenance`, {
      method: "POST",
      headers: getHeaders(principalToken),
      body: JSON.stringify({ isActive: true, reason: "Maintenance test" }),
    });
    assert(principalMaint.status === 403, "PRINCIPAL blocked from toggling maintenance mode (403)");

    // Admin enables maintenance
    const enableMaint = await fetch(`${BASE_URL}/api/admin/operations/maintenance`, {
      method: "POST",
      headers: getHeaders(adminToken),
      body: JSON.stringify({
        isActive: true,
        reason: "সিস্টেম নিয়মিত অডিট ও ব্যাকআপ রক্ষণাবেক্ষণ",
      }),
    });
    assert(enableMaint.status === 200, "ADMIN enabled maintenance mode (200)");

    // Admin disables maintenance
    const disableMaint = await fetch(`${BASE_URL}/api/admin/operations/maintenance`, {
      method: "POST",
      headers: getHeaders(adminToken),
      body: JSON.stringify({
        isActive: false,
        reason: "রক্ষণাবেক্ষণ সফলভাবে সম্পন্ন হয়েছে",
      }),
    });
    assert(disableMaint.status === 200, "ADMIN disabled maintenance mode (200)");

    // Verify GET maintenance
    const getMaint = await fetch(`${BASE_URL}/api/admin/operations/maintenance`, {
      headers: getHeaders(adminToken),
    });
    assert(getMaint.status === 200, "ADMIN retrieved maintenance state (200)");
    const maintData = await getMaint.json();
    assert(maintData.maintenance.isActive === false, "Maintenance is confirmed inactive");

    // -----------------------------------------------------------------
    // SUMMARY
    // -----------------------------------------------------------------
    console.log("\n=================================================");
    console.log(`🌐 HTTP TESTS SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("HTTP endpoint testing failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase16HttpEndpointTests();
