import { prisma } from "../src/lib/prisma";
import fs from "fs";
import path from "path";
import {
  getSystemHealth,
  createDatabaseBackup,
  verifyDatabaseBackup,
  listDatabaseBackups,
  applyBackupRetention,
  restoreDatabase,
  runRecoveryDrill,
  createSystemIncident,
  updateIncidentStatus,
  listSystemIncidents,
  triggerOperationalAlert,
  acknowledgeOperationalAlert,
  resolveOperationalAlert,
  listOperationalAlerts,
  getMaintenanceState,
  setMaintenanceState,
} from "../src/lib/operationsEngine";

async function runPhase16ApiTests() {
  console.log("=================================================================");
  console.log("  PHASE 16 — OPERATIONS, BACKUP & DISASTER RECOVERY UNIT TESTS");
  console.log("=================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Setup Test Fixtures
    // -------------------------------------------------------------
    console.log("--- Setting Up Phase 16 Fixtures ---");
    const testAdmin = await prisma.user.upsert({
      where: { username: "admin_p16" },
      update: {},
      create: {
        username: "admin_p16",
        name: "Admin Phase 16",
        email: "admin_p16@ehrj.local",
        passwordHash: "$2a$12$eXAMPLehashForPhase16TestsAdminSecureKey99",
        role: "ADMIN",
        status: "ACTIVE",
      },
    });

    const testPrincipal = await prisma.user.upsert({
      where: { username: "principal_p16" },
      update: {},
      create: {
        username: "principal_p16",
        name: "মুহতামিম মহোদয় (Test P16)",
        email: "principal_p16@ehrj.local",
        passwordHash: "$2a$12$eXAMPLehashForPhase16TestsPrincipalSecure99",
        role: "PRINCIPAL",
        status: "ACTIVE",
      },
    });

    assert(!!testAdmin && testAdmin.role === "ADMIN", "Test Admin created/found");
    assert(!!testPrincipal && testPrincipal.role === "PRINCIPAL", "Test Principal created/found");

    // -------------------------------------------------------------
    // 1. System Health Checks
    // -------------------------------------------------------------
    console.log("\n--- Testing Multi-Component Health Checks ---");
    const adminHealth = await getSystemHealth("ADMIN");
    assert(
      ["HEALTHY", "DEGRADED"].includes(adminHealth.overallStatus),
      `Admin Health check overall status is ${adminHealth.overallStatus}`
    );
    assert(
      typeof adminHealth.components === "object" && adminHealth.components !== null,
      "Admin Health returns components object"
    );

    const compKeys = Object.keys(adminHealth.components);
    assert(
      compKeys.includes("database") &&
        compKeys.includes("storage") &&
        compKeys.includes("authentication") &&
        compKeys.includes("notifications") &&
        compKeys.includes("backups") &&
        compKeys.includes("backgroundJobs") &&
        compKeys.includes("email") &&
        compKeys.includes("payments"),
      "All critical system components are monitored in health report"
    );

    const dbComp = adminHealth.components.database;
    assert(
      dbComp?.status === "HEALTHY" && typeof dbComp.latencyMs === "number",
      `Database component is HEALTHY with latency: ${dbComp?.latencyMs}ms`
    );

    const storageComp = adminHealth.components.storage;
    assert(
      storageComp?.status === "HEALTHY",
      `Uploads directory storage is HEALTHY with read/write access`
    );

    // Public health check minimal redaction
    const publicHealth = await getSystemHealth("PUBLIC");
    assert(
      ["HEALTHY", "DEGRADED"].includes(publicHealth.status),
      `Public Health returns basic status: ${publicHealth.status}`
    );
    assert(
      (publicHealth as any).components === undefined,
      "Public Health does not leak internal component breakdown"
    );
    assert(
      (publicHealth as any).systemMetrics === undefined,
      "Public Health does not leak OS/memory metrics"
    );

    // -------------------------------------------------------------
    // 2. Backup Engine & Integrity Verification
    // -------------------------------------------------------------
    console.log("\n--- Testing Database Backup Creation & Verification ---");
    const manualBackup = await createDatabaseBackup("MANUAL", testAdmin.id);
    assert(!!manualBackup && !!manualBackup.id, "createDatabaseBackup created backup record");
    assert(manualBackup.type === "MANUAL", "Backup type is MANUAL");
    assert(
      typeof manualBackup.sizeBytes === "number" && manualBackup.sizeBytes > 0,
      `Backup file size is positive (${manualBackup.sizeBytes} bytes)`
    );
    assert(
      manualBackup.checksum !== null && manualBackup.checksum.length === 64,
      `SHA-256 checksum generated with valid 64-char length: ${manualBackup.checksum?.substring(0, 16)}...`
    );

    const backupFilePath = path.resolve(process.cwd(), manualBackup.storagePath);
    assert(fs.existsSync(backupFilePath), "Backup file physically exists in backups directory");

    const verifiedRecord = await verifyDatabaseBackup(manualBackup.id, testAdmin.id);
    assert(verifiedRecord.verificationStatus === "VERIFIED", "Backup verification returned status VERIFIED");
    assert(
      verifiedRecord.verificationDetails !== null &&
        verifiedRecord.verificationDetails.includes("SQLite 3 Header Confirmed"),
      "Backup file passed SQLite format 3 magic header check"
    );

    // -------------------------------------------------------------
    // 3. Backup Retention Logic
    // -------------------------------------------------------------
    console.log("\n--- Testing Backup Retention Policy ---");
    const backup2 = await createDatabaseBackup("MANUAL", testAdmin.id);
    const backup3 = await createDatabaseBackup("MANUAL", testAdmin.id);
    assert(!!backup2 && !!backup3, "Additional test backups created");

    const retentionResult = await applyBackupRetention({ keepMinimumCount: 2, maxAgeDays: 0 });
    assert(retentionResult.retainedCount >= 2, `Retention policy preserved ${retentionResult.retainedCount} backups`);

    const listAfterRetention = await listDatabaseBackups({ limit: 10 });
    assert(listAfterRetention.length >= 2, `Database has ${listAfterRetention.length} backups after retention run`);

    // -------------------------------------------------------------
    // 4. Disaster Recovery Drill
    // -------------------------------------------------------------
    console.log("\n--- Testing Disaster Recovery Drill ---");
    const drillBackup = await createDatabaseBackup("MANUAL", testAdmin.id);
    await verifyDatabaseBackup(drillBackup.id, testAdmin.id);

    const drill = await runRecoveryDrill(drillBackup.id, testAdmin.id);
    assert(drill.status === "PASSED", `Recovery drill succeeded with status: ${drill.status}`);
    assert(typeof drill.rtoSeconds === "number" && drill.rtoSeconds >= 0, `RTO measured: ${drill.rtoSeconds} seconds`);
    assert(typeof drill.rpoHours === "number" && drill.rpoHours >= 0, `RPO measured: ${drill.rpoHours} hours`);

    const isolatedTestFile = path.resolve(process.cwd(), "scratch", `drill_${drill.drillCode}.db`);
    assert(!fs.existsSync(isolatedTestFile), "Isolated drill database was safely and automatically cleaned up");

    // -------------------------------------------------------------
    // 5. Database Restore Engine & Safety Locks
    // -------------------------------------------------------------
    console.log("\n--- Testing Database Restore Engine & Safety Locks ---");

    // Test rejection with invalid confirmation
    let failedConfirmation = false;
    try {
      await restoreDatabase({
        backupId: drillBackup.id,
        confirmation: "RESTORE",
        reason: "Emergency Test Verification",
        initiatedById: testAdmin.id,
      });
    } catch (err: any) {
      failedConfirmation = err.message.includes("হুবহু 'RESTORE PRODUCTION DATABASE'");
    }
    assert(failedConfirmation, "Rejected restore attempt when confirmation string is incorrect");

    // Test rejection with empty reason
    let failedReason = false;
    try {
      await restoreDatabase({
        backupId: drillBackup.id,
        confirmation: "RESTORE PRODUCTION DATABASE",
        reason: "   ",
        initiatedById: testAdmin.id,
      });
    } catch (err: any) {
      failedReason = err.message.includes("কারণ");
    }
    assert(failedReason, "Rejected restore attempt when reason is empty");

    // Test successful controlled restore
    const restoreResult = await restoreDatabase({
      backupId: drillBackup.id,
      confirmation: "RESTORE PRODUCTION DATABASE",
      reason: "Automated Phase 16 Recovery Simulation Drill",
      initiatedById: testAdmin.id,
    });
    assert(restoreResult.status === "COMPLETED", `Restore completed successfully with status: ${restoreResult.status}`);
    assert(!!restoreResult.preRestoreBackupId, "Pre-restore snapshot was automatically created before restore");

    const preRestoreRecord = await prisma.systemBackup.findUnique({
      where: { id: restoreResult.preRestoreBackupId! },
    });
    assert(preRestoreRecord?.type === "PRE_RESTORE", "Pre-restore backup correctly tagged as PRE_RESTORE");

    // Verify DB is functioning post-restore
    const userCount = await prisma.user.count();
    assert(userCount > 0, `Database functional post-restore: ${userCount} users present`);

    // -------------------------------------------------------------
    // 6. Incident Management State Machine
    // -------------------------------------------------------------
    console.log("\n--- Testing System Incident State Machine ---");
    const testIncident = await createSystemIncident({
      title: "Temporary High Latency Spike",
      description: "Database latency exceeded 150ms during automated backup execution.",
      severity: "MEDIUM",
      affectedService: "DATABASE",
      detectedById: testAdmin.id,
      detectedByName: "Admin Phase 16",
    });

    assert(
      testIncident.incidentCode.startsWith("EHRJ-INC-"),
      `Incident created with canonical code: ${testIncident.incidentCode}`
    );
    assert(testIncident.status === "OPEN", "Initial incident status is OPEN");

    // Transition: OPEN -> ACKNOWLEDGED
    const ackIncident = await updateIncidentStatus({
      incidentId: testIncident.id,
      status: "ACKNOWLEDGED",
      note: "Incident acknowledged by Admin on-call.",
      performedById: testAdmin.id,
    });
    assert(ackIncident.status === "ACKNOWLEDGED", "Incident transitioned to ACKNOWLEDGED");

    // Transition: ACKNOWLEDGED -> INVESTIGATING
    const invIncident = await updateIncidentStatus({
      incidentId: testIncident.id,
      status: "INVESTIGATING",
      note: "Investigating I/O throughput.",
      performedById: testAdmin.id,
    });
    assert(invIncident.status === "INVESTIGATING", "Incident transitioned to INVESTIGATING");

    // Transition: INVESTIGATING -> MITIGATING
    const mitIncident = await updateIncidentStatus({
      incidentId: testIncident.id,
      status: "MITIGATING",
      note: "Adjusting retention cleanup schedule.",
      performedById: testAdmin.id,
    });
    assert(mitIncident.status === "MITIGATING", "Incident transitioned to MITIGATING");

    // Transition: MITIGATING -> RESOLVED
    const resIncident = await updateIncidentStatus({
      incidentId: testIncident.id,
      status: "RESOLVED",
      note: "I/O latency normalized to < 10ms.",
      performedById: testAdmin.id,
      resolution: "Retention cleaned up temporary files and vacuumed indices.",
    });
    assert(resIncident.status === "RESOLVED", "Incident transitioned to RESOLVED");

    // Transition: RESOLVED -> CLOSED
    const closedIncident = await updateIncidentStatus({
      incidentId: testIncident.id,
      status: "CLOSED",
      note: "Post-incident review completed. Incident closed.",
      performedById: testAdmin.id,
    });
    assert(closedIncident.status === "CLOSED", "Incident transitioned to CLOSED");

    // Verify timeline events recorded
    const timeline = await prisma.incidentEvent.findMany({
      where: { incidentId: testIncident.id },
      orderBy: { timestamp: "asc" },
    });
    assert(timeline.length >= 6, `All 6 lifecycle events recorded in timeline (found: ${timeline.length})`);

    // -------------------------------------------------------------
    // 7. Operational Alerts & Deduplication
    // -------------------------------------------------------------
    console.log("\n--- Testing Operational Alerts & Deduplication ---");
    const testKey = `storage_warning_p16_${Date.now()}`;
    const alert1 = await triggerOperationalAlert({
      alertKey: testKey,
      severity: "WARNING",
      source: "STORAGE",
      title: "Storage utilization high",
      description: "Uploads folder reached 80% disk space.",
    });
    assert(alert1.occurrenceCount === 1, "First alert occurrenceCount is 1");
    assert(alert1.status === "ACTIVE", "Alert status is ACTIVE");

    // Trigger duplicate within 30 min deduplication window
    const alert2 = await triggerOperationalAlert({
      alertKey: testKey,
      severity: "WARNING",
      source: "STORAGE",
      title: "Storage utilization high (repeated)",
      description: "Uploads folder reached 80% disk space.",
    });
    assert(alert2.id === alert1.id, "Deduplication matched the same alert ID");
    assert(alert2.occurrenceCount === 2, `occurrenceCount incremented to ${alert2.occurrenceCount}`);

    // Acknowledge alert
    const ackAlert = await acknowledgeOperationalAlert(alert1.id, testAdmin.id);
    assert(ackAlert.status === "ACKNOWLEDGED", "Alert transitioned to ACKNOWLEDGED");

    // Resolve alert
    const resAlert = await resolveOperationalAlert(alert1.id);
    assert(resAlert.status === "RESOLVED", "Alert transitioned to RESOLVED");

    // -------------------------------------------------------------
    // 8. Maintenance Mode Engine
    // -------------------------------------------------------------
    console.log("\n--- Testing Maintenance Mode Engine ---");
    const initialMaint = await getMaintenanceState();
    assert(typeof initialMaint.isActive === "boolean", "getMaintenanceState returns valid state");

    // Enable maintenance mode
    const enabledMaint = await setMaintenanceState({
      isActive: true,
      reason: "নিয়মিত ডাটাবেজ অপ্টিমাইজেশন ও রক্ষণাবেক্ষণ চলছে।",
      enabledById: testAdmin.id,
      messageBn: "সিস্টেম সাময়িক রক্ষণাবেক্ষণের জন্য ডাউন রয়েছে।",
    });
    assert(enabledMaint.isActive === true, "Maintenance mode enabled successfully");

    // Verify state from getter
    const activeMaint = await getMaintenanceState();
    assert(activeMaint.isActive === true, "getMaintenanceState reflects active maintenance");
    assert(activeMaint.window?.reason.includes("অপ্টিমাইজেশন"), "Active maintenance window has reason");

    // Disable maintenance mode
    await setMaintenanceState({
      isActive: false,
      reason: "রক্ষণাবেক্ষণ সম্পন্ন হয়েছে।",
      enabledById: testAdmin.id,
    });

    const finalMaint = await getMaintenanceState();
    assert(finalMaint.isActive === false, "getMaintenanceState confirms maintenance is disabled");

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log("\n=================================================================");
    console.log(`  PHASE 16 API TESTS SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution failed with error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase16ApiTests();
