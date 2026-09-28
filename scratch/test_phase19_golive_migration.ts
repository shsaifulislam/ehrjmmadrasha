/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 19
 * Master Production Launch, Data Migration & Go-Live Verification Suite
 */

import { prisma } from "../src/lib/prisma";
import { createSessionToken } from "../src/lib/auth";
import { createDatabaseBackup, verifyDatabaseBackup, runRecoveryDrill } from "../src/lib/operationsEngine";
import {
  validateStudentMigrationPayload,
  executeStudentMigration,
  reconcileFinancialMigration,
  RawStudentMigrationRecord,
} from "../src/lib/dataMigrationEngine";
import { executeMasterCronRegistry } from "../src/lib/schedulerEngine";

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

async function runPhase19GoLive() {
  console.log("\n==================================================================");
  console.log("  PHASE 19 — PRODUCTION LAUNCH, DATA MIGRATION & GO-LIVE ENGINE");
  console.log(`  Target Server: ${BASE_URL}`);
  console.log("==================================================================\n");

  // -------------------------------------------------------------------
  // 1. RESOLVE BASELINE ENTITIES & AUTHENTIC ADMIN
  // -------------------------------------------------------------------
  console.log("[STEP 1] Resolving administrative authority and session...");
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!adminUser) throw new Error("No ADMIN user found in system database.");

  const activeSession = await prisma.academicSession.findFirst({ where: { isCurrent: true } })
    || await prisma.academicSession.findFirst();
  if (!activeSession) throw new Error("No Academic Session found.");

  const targetClass = await prisma.jamatClass.findFirst();
  if (!targetClass) throw new Error("No Jamat Class found.");

  assert(Boolean(adminUser.id), `Admin user identified: ${adminUser.name}`);
  assert(Boolean(activeSession.id), `Active session identified: ${activeSession.nameBn || activeSession.nameEn}`);

  // -------------------------------------------------------------------
  // 2. PRE-MIGRATION SAFETY BACKUP & INTEGRITY VERIFICATION
  // -------------------------------------------------------------------
  console.log("\n[STEP 2] Creating Pre-Release Safety Snapshot...");
  const preBackup = await createDatabaseBackup("PRE_MIGRATION", adminUser.id);
  assert(Boolean(preBackup.id), `Pre-release safety backup created: ${preBackup.backupCode}`);
  assert(preBackup.type === "PRE_MIGRATION", "Backup correctly tagged as PRE_MIGRATION");

  const verifiedPreBackup = await verifyDatabaseBackup(preBackup.id, adminUser.id);
  assert(verifiedPreBackup.verificationStatus === "VERIFIED", "Pre-migration backup passed SQLite 3 integrity & SHA-256 hash checks");

  // -------------------------------------------------------------------
  // 3. DATA MIGRATION ENGINE VALIDATION & EXECUTION
  // -------------------------------------------------------------------
  console.log("\n[STEP 3] Executing Controlled Student & Guardian Migration...");

  const migrationBatchTag = `MIG${Date.now().toString().slice(-4)}`;
  const guardianPhone = `017${Math.floor(10000000 + Math.random() * 90000000).toString()}`;
  const legacyRecords: RawStudentMigrationRecord[] = [
    {
      fullNameBn: `মুহাম্মদ তাওহীদ হোসেন (${migrationBatchTag})`,
      gender: "MALE",
      dateOfBirth: "2018-04-12",
      jamatClassId: targetClass.id,
      guardianNameBn: "মোঃ হারুনুর রশিদ",
      guardianPhone,
      guardianRelation: "পিতা",
      residentialStatus: "NON_RESIDENTIAL",
      openingDueAmount: 2200,
    },
    {
      fullNameBn: `মুহাম্মদ মাহদী হাসান (${migrationBatchTag})`, // Sibling sharing same guardian phone
      gender: "MALE",
      dateOfBirth: "2020-09-05",
      jamatClassId: targetClass.id,
      guardianNameBn: "মোঃ হারুনুর রশিদ",
      guardianPhone, // SAME PHONE -> Multi-child linking
      guardianRelation: "পিতা",
      residentialStatus: "NON_RESIDENTIAL",
      openingDueAmount: 1800,
    },
  ];

  // A. Validation Check
  const validation = await validateStudentMigrationPayload(legacyRecords, activeSession.id);
  assert(validation.valid, "Migration validator passed payload sanity check (0 validation errors)");
  assert(validation.validCount === 2, "Both sibling migration records validated");

  // B. Execution Check
  const migrationResult = await executeStudentMigration({
    records: legacyRecords,
    targetSessionId: activeSession.id,
    adminUserId: adminUser.id,
  });

  assert(migrationResult.success, "Migration engine executed batch transaction atomically");
  assert(migrationResult.migratedStudents === 2, `Migrated 2 students (${migrationResult.migratedStudents}/2)`);
  assert(migrationResult.reusedGuardians === 1, "Multi-child guardian reuse verified (sibling linked to existing guardian)");
  assert(migrationResult.createdInvoices === 2, "Opening balance fee invoices created for migrated students");
  assert(migrationResult.totalOpeningDuesMigrated === 4000, "Total opening balance dues aggregated correctly (৳4,000 = ৳2,200 + ৳1,800)");

  // -------------------------------------------------------------------
  // 4. FINANCIAL RECONCILIATION ENGINE
  // -------------------------------------------------------------------
  console.log("\n[STEP 4] Performing Financial Ledger Reconciliation...");
  const reconciliation = await reconcileFinancialMigration();
  assert(reconciliation.allInvoicesCount > 0, `Total institutional invoices: ${reconciliation.allInvoicesCount}`);
  assert(reconciliation.totalOpeningDues > 0, `Total opening balance dues tracked: ৳ ${reconciliation.totalOpeningDue}`);
  assert(reconciliation.mathIntegrityPassed, "Financial Integrity: 100% mathematical equality verified across all active invoices");
  assert(reconciliation.totalFundsCount === 5, "Authoritative 5-Fund structure verified (General, Lillah, Zakat, Construction, Orphan)");
  assert(reconciliation.totalFundsBalance > 0, `Total institutional funds balance: ৳ ${reconciliation.totalFundsBalance.toLocaleString()}`);

  // -------------------------------------------------------------------
  // 5. SCHEDULED JOBS & CRON MAINTENANCE ENGINE
  // -------------------------------------------------------------------
  console.log("\n[STEP 5] Testing Scheduled Jobs & Maintenance Cron Engine...");
  const cronReport = await executeMasterCronRegistry("ALL");
  assert(cronReport.totalJobs === 4, `All 4 scheduled cron maintenance jobs evaluated (${cronReport.totalJobs} jobs)`);
  assert(cronReport.failedJobs === 0, `All scheduled jobs completed with zero errors (${cronReport.passedJobs}/4 passed)`);

  for (const job of cronReport.results) {
    assert(job.status === "SUCCESS", `Cron Job [${job.jobKey}] succeeded (${job.executionTimeMs}ms)`);
  }

  // -------------------------------------------------------------------
  // 6. POST-GO-LIVE SAFETY BACKUP & RECOVERY DRILL
  // -------------------------------------------------------------------
  console.log("\n[STEP 6] Generating Post-Launch Production Snapshot & Recovery Drill...");
  const postBackup = await createDatabaseBackup("AUTOMATIC", adminUser.id);
  assert(Boolean(postBackup.id), `Post-launch snapshot generated: ${postBackup.backupCode}`);

  const postVerified = await verifyDatabaseBackup(postBackup.id, adminUser.id);
  assert(postVerified.verificationStatus === "VERIFIED", "Post-launch backup passed binary SQLite 3 header check");

  const drill = await runRecoveryDrill(postBackup.id, adminUser.id);
  assert(drill.status === "PASSED", `Disaster recovery drill passed on post-launch database (RTO: ${drill.rtoSeconds}s)`);

  // -------------------------------------------------------------------
  // 7. LIVE HTTP PRODUCTION SMOKE TESTS (ALL PERSONAS)
  // -------------------------------------------------------------------
  console.log("\n[STEP 7] Performing Live Production Smoke Tests across All Personas...");

  const adminToken = await createSessionToken({
    userId: adminUser.id,
    username: adminUser.username,
    role: "ADMIN",
    email: adminUser.email,
    name: adminUser.name,
  });

  // A. Public Smoke Test
  const publicHome = await fetch(`${BASE_URL}/`);
  assert(publicHome.status === 200, "Public Smoke: Homepage renders HTTP 200 OK");

  const publicContact = await fetch(`${BASE_URL}/contact`);
  assert(publicContact.status === 200, "Public Smoke: Contact page renders HTTP 200 OK");

  // B. Admin Operations & Cron Smoke Test
  const adminHealth = await fetch(`${BASE_URL}/api/admin/operations/health`, {
    headers: { Cookie: `ehrj_session_token=${adminToken}` },
  });
  assert(adminHealth.status === 200, "Admin Smoke: Operations health returns HTTP 200 OK");

  const adminCron = await fetch(`${BASE_URL}/api/admin/operations/cron?job=ALL`, {
    headers: { Cookie: `ehrj_session_token=${adminToken}` },
  });
  assert(adminCron.status === 200, "Admin Smoke: Scheduled cron API endpoint returns HTTP 200 OK");

  // C. Security Check: Unauthenticated access to Cron API blocked
  const anonCron = await fetch(`${BASE_URL}/api/admin/operations/cron`);
  assert(anonCron.status === 403, "Security Smoke: Anonymous access to Cron API rejected with HTTP 403 Forbidden");

  // -------------------------------------------------------------------
  // 8. FINAL SUMMARY
  // -------------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`  PHASE 19 GO-LIVE & LAUNCH VALIDATION: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("==================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase19GoLive().catch((err) => {
  console.error("Fatal error in Phase 19 Go-Live Execution:", err);
  process.exit(1);
});
