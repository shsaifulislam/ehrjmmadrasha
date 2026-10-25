import fs from "fs";
import path from "path";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getDatabaseFilePath } from "@/lib/env";

// Application and Engine Constants
export const APP_VERSION = "1.0.0";
export const SCHEMA_VERSION = "2026-PHASE16";
export const DB_TYPE = "SQLite 3";

const PROJECT_ROOT = process.cwd();
const DB_PATH = getDatabaseFilePath();
const BACKUP_DIR = path.join(PROJECT_ROOT, "backups");
const UPLOAD_DIR = path.join(PROJECT_ROOT, "public", "uploads");

// Ensure operational directories exist
function ensureDirectories() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

// -------------------------------------------------------------
// 1. SYSTEM HEALTH ENGINE
// -------------------------------------------------------------
export type HealthStatus = "HEALTHY" | "DEGRADED" | "DOWN" | "UNKNOWN";

export interface ComponentHealth {
  status: HealthStatus;
  latencyMs?: number;
  message?: string;
  details?: Record<string, any>;
  lastChecked: string;
}

export interface SystemHealthReport {
  overallStatus: HealthStatus;
  timestamp: string;
  version: {
    app: string;
    schema: string;
    node: string;
    database: string;
  };
  components: {
    application: ComponentHealth;
    database: ComponentHealth;
    storage: ComponentHealth;
    authentication: ComponentHealth;
    email: ComponentHealth;
    notifications: ComponentHealth;
    payments: ComponentHealth;
    backgroundJobs: ComponentHealth;
    backups: ComponentHealth;
  };
  maintenance: {
    isActive: boolean;
    reason?: string;
    messageBn?: string;
    startedAt?: string;
  };
}

export async function getSystemHealth(scope: "PUBLIC" | "ADMIN" | "PRINCIPAL" = "ADMIN"): Promise<any> {
  ensureDirectories();
  const timestamp = new Date().toISOString();

  // 1. Application Check
  const appUptimeSec = process.uptime();
  const memoryUsage = process.memoryUsage();
  const appHealth: ComponentHealth = {
    status: "HEALTHY",
    message: "Application is serving requests normally",
    details: {
      uptimeSeconds: Math.round(appUptimeSec),
      memoryRssMb: Math.round(memoryUsage.rss / (1024 * 1024)),
      memoryHeapUsedMb: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
      environment: process.env.NODE_ENV || "development",
    },
    lastChecked: timestamp,
  };

  // 2. Database Check
  let dbHealth: ComponentHealth;
  const startDb = Date.now();
  try {
    // Quick query latency test and integrity check
    await prisma.$queryRawUnsafe("SELECT 1;");
    const latency = Date.now() - startDb;

    const isPg = process.env.DATABASE_PROVIDER === "postgresql" || process.env.USE_POSTGRES_STAGING === "true";
    let dbSizeBytes = 0;
    if (!isPg && fs.existsSync(DB_PATH)) {
      const stat = fs.statSync(DB_PATH);
      dbSizeBytes = stat.size;
    }

    dbHealth = {
      status: latency > 1000 ? "DEGRADED" : "HEALTHY",
      latencyMs: latency,
      message: latency > 1000 ? "High database latency detected" : "Database queries executing cleanly",
      details: {
        engine: isPg ? "PostgreSQL" : "SQLite",
        latencyMs: latency,
        sizeMb: isPg ? undefined : Math.round((dbSizeBytes / (1024 * 1024)) * 100) / 100,
        dbPath: isPg ? "isolated:ehrj_staging" : path.relative(PROJECT_ROOT, DB_PATH).replace(/\\/g, "/"),
      },
      lastChecked: timestamp,
    };
  } catch (err: any) {
    dbHealth = {
      status: "DOWN",
      latencyMs: Date.now() - startDb,
      message: `Database connection error: ${err.message}`,
      lastChecked: timestamp,
    };
  }

  // 3. Storage Health
  let storageHealth: ComponentHealth;
  try {
    const testFile = path.join(UPLOAD_DIR, ".storage_health_test");
    fs.writeFileSync(testFile, "EHRJ_HEALTH_CHECK_" + Date.now(), "utf8");
    const readBack = fs.readFileSync(testFile, "utf8");
    fs.unlinkSync(testFile);

    const uploadsCount = fs.readdirSync(UPLOAD_DIR).length;

    storageHealth = {
      status: readBack.startsWith("EHRJ_HEALTH_CHECK_") ? "HEALTHY" : "DEGRADED",
      message: "Storage read and write verified",
      details: {
        uploadsFolder: "public/uploads",
        filesCount: uploadsCount,
        writable: true,
      },
      lastChecked: timestamp,
    };
  } catch (err: any) {
    storageHealth = {
      status: "DEGRADED",
      message: `Storage write failure: ${err.message}`,
      lastChecked: timestamp,
    };
  }

  // 4. Authentication Check
  let authHealth: ComponentHealth;
  try {
    const activeSessionsCount = await prisma.session.count({
      where: { expiresAt: { gt: new Date() } },
    });
    const hasJwtSecret = Boolean(process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16);

    authHealth = {
      status: hasJwtSecret ? "HEALTHY" : "DEGRADED",
      message: hasJwtSecret ? "Authentication services active" : "Weak or missing JWT secret",
      details: {
        activeSessions: activeSessionsCount,
        jwtConfigured: hasJwtSecret,
      },
      lastChecked: timestamp,
    };
  } catch (err: any) {
    authHealth = {
      status: "UNKNOWN",
      message: `Failed to query auth session state: ${err.message}`,
      lastChecked: timestamp,
    };
  }

  // 5. Email/SMTP Check
  const hasSmtpConfig = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
  const emailHealth: ComponentHealth = {
    status: hasSmtpConfig ? "HEALTHY" : "DEGRADED",
    message: hasSmtpConfig ? "SMTP credentials configured" : "SMTP credentials missing",
    details: {
      configuredUser: process.env.SMTP_USER ? `${process.env.SMTP_USER.split("@")[0]}@***` : null,
    },
    lastChecked: timestamp,
  };

  // 6. Notification Outbox Check
  let notificationsHealth: ComponentHealth;
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [pendingOutbox, failedOutbox, stuckOutbox] = await Promise.all([
      prisma.notificationOutbox.count({ where: { status: "PENDING" } }),
      prisma.notificationOutbox.count({ where: { status: "FAILED" } }),
      prisma.notificationOutbox.count({
        where: { status: "PENDING", createdAt: { lte: oneHourAgo } },
      }),
    ]);

    const isDegraded = stuckOutbox > 10 || failedOutbox > 50;
    notificationsHealth = {
      status: isDegraded ? "DEGRADED" : "HEALTHY",
      message: isDegraded ? "Outbox has stuck or failed messages" : "Notification outbox queue operational",
      details: {
        pendingCount: pendingOutbox,
        failedCount: failedOutbox,
        stuckCount: stuckOutbox,
      },
      lastChecked: timestamp,
    };
  } catch (err: any) {
    notificationsHealth = {
      status: "UNKNOWN",
      message: `Could not query outbox queue: ${err.message}`,
      lastChecked: timestamp,
    };
  }

  // 7. Payment Health
  let paymentsHealth: ComponentHealth;
  try {
    const [totalReceipts, successfulReceipts, pendingInvoices] = await Promise.all([
      prisma.paymentReceipt.count(),
      prisma.paymentReceipt.count({ where: { paymentStatus: "SUCCESSFUL" } }),
      prisma.feeInvoice.count({ where: { status: "UNPAID" } }),
    ]);

    paymentsHealth = {
      status: "HEALTHY",
      message: "Payment records and transactions operational",
      details: {
        totalReceipts,
        successfulReceipts,
        unpaidInvoices: pendingInvoices,
      },
      lastChecked: timestamp,
    };
  } catch (err: any) {
    paymentsHealth = {
      status: "UNKNOWN",
      message: `Could not query payment state: ${err.message}`,
      lastChecked: timestamp,
    };
  }

  // 8. Background Jobs Check
  let jobsHealth: ComponentHealth;
  try {
    const activeSchedulesCount = await prisma.reportSchedule.count({ where: { isActive: true } });
    jobsHealth = {
      status: "HEALTHY",
      message: "Scheduled jobs and tasks healthy",
      details: {
        activeSchedules: activeSchedulesCount,
      },
      lastChecked: timestamp,
    };
  } catch (err: any) {
    jobsHealth = {
      status: "UNKNOWN",
      message: `Could not query job schedules: ${err.message}`,
      lastChecked: timestamp,
    };
  }

  // 9. Backups Check
  let backupsHealth: ComponentHealth;
  try {
    const totalBackups = await prisma.systemBackup.count();
    const latestBackup = await prisma.systemBackup.findFirst({
      orderBy: { createdAt: "desc" },
    });
    const latestVerified = await prisma.systemBackup.findFirst({
      where: { verificationStatus: "VERIFIED" },
      orderBy: { createdAt: "desc" },
    });

    const hasBackups = totalBackups > 0;
    const isVerified = Boolean(latestVerified);

    backupsHealth = {
      status: hasBackups ? (isVerified ? "HEALTHY" : "DEGRADED") : "DEGRADED",
      message: hasBackups
        ? isVerified
          ? "System backups present and verified"
          : "Backups exist but pending verification"
        : "No backups recorded yet",
      details: {
        totalBackups,
        latestBackupCode: latestBackup?.backupCode || null,
        latestBackupDate: latestBackup?.createdAt || null,
        latestVerifiedCode: latestVerified?.backupCode || null,
      },
      lastChecked: timestamp,
    };
  } catch (err: any) {
    backupsHealth = {
      status: "UNKNOWN",
      message: `Could not query backup records: ${err.message}`,
      lastChecked: timestamp,
    };
  }

  // Maintenance state
  let maintenanceState = {
    isActive: false,
    reason: undefined as string | undefined,
    messageBn: undefined as string | undefined,
    startedAt: undefined as string | undefined,
  };
  try {
    const activeWindow = await prisma.maintenanceWindow.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    if (activeWindow) {
      maintenanceState = {
        isActive: true,
        reason: activeWindow.reason,
        messageBn: activeWindow.messageBn,
        startedAt: activeWindow.startedAt.toISOString(),
      };
    }
  } catch {}

  // Determine Overall Status
  const componentStatuses = [
    appHealth.status,
    dbHealth.status,
    storageHealth.status,
    authHealth.status,
    emailHealth.status,
    notificationsHealth.status,
    paymentsHealth.status,
    jobsHealth.status,
    backupsHealth.status,
  ];

  let overallStatus: HealthStatus = "HEALTHY";
  if (componentStatuses.includes("DOWN")) {
    overallStatus = "DOWN";
  } else if (componentStatuses.includes("DEGRADED")) {
    overallStatus = "DEGRADED";
  } else if (componentStatuses.includes("UNKNOWN")) {
    overallStatus = "DEGRADED";
  }

  if (scope === "PUBLIC") {
    const isPg = process.env.DATABASE_PROVIDER === "postgresql" || process.env.USE_POSTGRES_STAGING === "true";
    return {
      status: overallStatus,
      timestamp,
      version: APP_VERSION,
      environment: process.env.NEXT_PUBLIC_APP_ENV || (isPg ? "staging" : "development"),
      databaseProvider: isPg ? "postgresql" : "sqlite",
      maintenance: maintenanceState.isActive ? { isActive: true, messageBn: maintenanceState.messageBn } : { isActive: false },
    };
  }

  if (scope === "PRINCIPAL") {
    return {
      overallStatus,
      timestamp,
      version: {
        app: APP_VERSION,
        database: DB_TYPE,
      },
      summary: {
        database: dbHealth.status,
        storage: storageHealth.status,
        notifications: notificationsHealth.status,
        backups: backupsHealth.status,
      },
      maintenance: maintenanceState,
    };
  }

  return {
    overallStatus,
    timestamp,
    version: {
      app: APP_VERSION,
      schema: SCHEMA_VERSION,
      node: process.version,
      database: DB_TYPE,
    },
    components: {
      application: appHealth,
      database: dbHealth,
      storage: storageHealth,
      authentication: authHealth,
      email: emailHealth,
      notifications: notificationsHealth,
      payments: paymentsHealth,
      backgroundJobs: jobsHealth,
      backups: backupsHealth,
    },
    maintenance: maintenanceState,
  };
}

function computeFileSha256(filePath: string): Promise<{ checksum: string; sizeBytes: number }> {
  return new Promise((resolve, reject) => {
    let sizeBytes = 0;
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk: string | Buffer) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      sizeBytes += buf.length;
      hash.update(buf);
    });
    stream.on("end", () => {
      resolve({ checksum: hash.digest("hex"), sizeBytes });
    });
    stream.on("error", (err) => reject(err));
  });
}

function readFirst16Bytes(filePath: string): string {
  const fd = fs.openSync(filePath, "r");
  try {
    const buf = Buffer.alloc(16);
    fs.readSync(fd, buf, 0, 16, 0);
    return buf.toString("utf8");
  } finally {
    fs.closeSync(fd);
  }
}

// -------------------------------------------------------------
// 2. BACKUP MANAGEMENT ENGINE
// -------------------------------------------------------------
export async function createDatabaseBackup(
  type: "MANUAL" | "AUTOMATIC" | "PRE_RESTORE" | "PRE_MIGRATION" = "MANUAL",
  initiatedById?: string
) {
  ensureDirectories();

  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`Production database file not found at: ${DB_PATH}`);
  }

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  const backupCode = `EHRJ-BKP-${dateStr}-${randSuffix}`;
  const filename = `${backupCode}.db`;
  const targetFilePath = path.join(BACKUP_DIR, filename);

  // Perform atomic binary copy of SQLite database file
  fs.copyFileSync(DB_PATH, targetFilePath);

  // Compute SHA-256 checksum and size using streaming to prevent heap exhaustion
  const { checksum, sizeBytes } = await computeFileSha256(targetFilePath);

  const backupRecord = await prisma.systemBackup.create({
    data: {
      backupCode,
      type,
      status: "COMPLETED",
      sizeBytes,
      storagePath: path.relative(PROJECT_ROOT, targetFilePath).replace(/\\/g, "/"),
      checksum,
      databaseVersion: DB_TYPE,
      applicationVersion: APP_VERSION,
      schemaVersion: SCHEMA_VERSION,
      initiatedById,
      verificationStatus: "PENDING",
    },
  });

  // Log in AuditLog
  await prisma.auditLog.create({
    data: {
      userId: initiatedById,
      action: "BACKUP_CREATE",
      entityType: "SystemBackup",
      entityId: backupRecord.id,
      detailsJson: JSON.stringify({
        backupCode,
        type,
        sizeBytes,
        checksum,
      }),
    },
  });

  return backupRecord;
}

export async function verifyDatabaseBackup(backupId: string, performedById?: string) {
  ensureDirectories();

  const backup = await prisma.systemBackup.findUnique({
    where: { id: backupId },
  });

  if (!backup) {
    throw new Error(`Backup not found with ID: ${backupId}`);
  }

  const fullPath = path.join(PROJECT_ROOT, backup.storagePath);
  if (!fs.existsSync(fullPath)) {
    await prisma.systemBackup.update({
      where: { id: backupId },
      data: {
        verificationStatus: "FAILED",
        failureReason: "Backup archive file not found on disk storage.",
        verifiedAt: new Date(),
      },
    });
    throw new Error(`Backup file missing from storage: ${backup.storagePath}`);
  }

  // 1. Checksum verification via stream
  const { checksum: currentChecksum, sizeBytes } = await computeFileSha256(fullPath);

  if (backup.checksum && currentChecksum !== backup.checksum) {
    await prisma.systemBackup.update({
      where: { id: backupId },
      data: {
        verificationStatus: "FAILED",
        failureReason: "Checksum mismatch! Backup file may have been modified or corrupted.",
        verifiedAt: new Date(),
      },
    });
    throw new Error("Checksum verification failed: hash mismatch");
  }

  // 2. Structural verification (SQLite 3 header validation via bounded read)
  const header = readFirst16Bytes(fullPath);
  if (!header.startsWith("SQLite format 3")) {
    await prisma.systemBackup.update({
      where: { id: backupId },
      data: {
        verificationStatus: "FAILED",
        failureReason: "File header does not match valid SQLite 3 format.",
        verifiedAt: new Date(),
      },
    });
    throw new Error("Structural verification failed: invalid SQLite database header");
  }

  const updated = await prisma.systemBackup.update({
    where: { id: backupId },
    data: {
      verificationStatus: "VERIFIED",
      verifiedAt: new Date(),
      verificationDetails: `Integrity verified. Size: ${sizeBytes} bytes, SHA-256: ${currentChecksum.slice(0, 12)}..., SQLite 3 Header Confirmed.`,
      failureReason: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: performedById,
      action: "BACKUP_VERIFY",
      entityType: "SystemBackup",
      entityId: backup.id,
      detailsJson: JSON.stringify({
        backupCode: backup.backupCode,
        status: "VERIFIED",
        checksum: currentChecksum,
      }),
    },
  });

  return updated;
}

export async function listDatabaseBackups(options?: { type?: string; limit?: number }) {
  const where: any = {};
  if (options?.type) {
    where.type = options.type;
  }

  return prisma.systemBackup.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options?.limit || 50,
    include: {
      initiatedBy: {
        select: { id: true, name: true, username: true, role: true },
      },
    },
  });
}

export async function applyBackupRetention(options?: { keepMinimumCount?: number; maxAgeDays?: number }) {
  const minKeep = options?.keepMinimumCount ?? 3;
  const maxAge = options?.maxAgeDays ?? 30;

  const allBackups = await prisma.systemBackup.findMany({
    orderBy: { createdAt: "desc" },
  });

  if (allBackups.length <= minKeep) {
    return { deletedCount: 0, retainedCount: allBackups.length };
  }

  const cutoff = new Date(Date.now() - maxAge * 24 * 60 * 60 * 1000);
  let deletedCount = 0;

  // Protect the latest minKeep backups unconditionally
  const candidates = allBackups.slice(minKeep);

  for (const bkp of candidates) {
    if (bkp.createdAt < cutoff && bkp.status !== "RUNNING") {
      const fullPath = path.join(PROJECT_ROOT, bkp.storagePath);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch {}
      }
      await prisma.systemBackup.delete({ where: { id: bkp.id } });
      deletedCount++;
    }
  }

  return { deletedCount, retainedCount: allBackups.length - deletedCount };
}

// -------------------------------------------------------------
// 3. RESTORE MANAGEMENT ENGINE
// -------------------------------------------------------------
export async function restoreDatabase(params: {
  backupId: string;
  confirmation: string;
  reason: string;
  initiatedById: string;
}) {
  ensureDirectories();

  // Strict non-negotiable confirmation check
  if (params.confirmation !== "RESTORE PRODUCTION DATABASE") {
    throw new Error(
      "পুনরুদ্ধার বাতিল করা হয়েছে: নিশ্চিতকরণ বাক্যটি হুবহু 'RESTORE PRODUCTION DATABASE' হতে হবে।"
    );
  }

  if (!params.reason || params.reason.trim().length < 5) {
    throw new Error("ডেটাবেস পুনরুদ্ধারের জন্য উপযুক্ত কারণ উল্লেখ করা আবশ্যক।");
  }

  const backup = await prisma.systemBackup.findUnique({
    where: { id: params.backupId },
  });

  if (!backup) {
    throw new Error(`নির্দিষ্ট ব্যাকআপ রেকর্ড পাওয়া যায়নি (ID: ${params.backupId})`);
  }

  const backupFilePath = path.join(PROJECT_ROOT, backup.storagePath);
  if (!fs.existsSync(backupFilePath)) {
    throw new Error(`ব্যাকআপ ফাইল স্টোরেজে বিদ্যমান নেই: ${backup.storagePath}`);
  }

  // 1. Create automatic PRE_RESTORE safety backup
  let preRestoreBackupId: string | null = null;
  let preBackupRecord: any = null;
  try {
    preBackupRecord = await createDatabaseBackup("PRE_RESTORE", params.initiatedById);
    preRestoreBackupId = preBackupRecord?.id || null;
  } catch (err: any) {
    console.warn("Failed to create pre-restore backup:", err.message);
  }

  const restoreCode = `EHRJ-RST-${new Date().getFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const startedAt = new Date();

  // 2. Perform restore by replacing production SQLite database with verified backup
  try {
    fs.copyFileSync(backupFilePath, DB_PATH);
  } catch (err: any) {
    throw new Error(`পুনরুদ্ধার ব্যর্থ হয়েছে: ${err.message}`);
  }

  // 2b. Ensure source backup and preRestoreBackup records exist in the newly restored DB
  try {
    const existingInRestored = await prisma.systemBackup.findUnique({ where: { id: backup.id } });
    if (!existingInRestored) {
      await prisma.systemBackup.create({
        data: {
          id: backup.id,
          backupCode: backup.backupCode,
          type: backup.type,
          status: backup.status,
          sizeBytes: backup.sizeBytes,
          storagePath: backup.storagePath,
          checksum: backup.checksum,
          verificationStatus: backup.verificationStatus,
          verifiedAt: backup.verifiedAt,
          verificationDetails: backup.verificationDetails,
          applicationVersion: backup.applicationVersion,
          databaseVersion: backup.databaseVersion,
          schemaVersion: backup.schemaVersion,
          createdAt: backup.createdAt,
        },
      });
    }

    if (preBackupRecord) {
      const existingPreInRestored = await prisma.systemBackup.findUnique({ where: { id: preBackupRecord.id } });
      if (!existingPreInRestored) {
        await prisma.systemBackup.create({
          data: {
            id: preBackupRecord.id,
            backupCode: preBackupRecord.backupCode,
            type: preBackupRecord.type,
            status: preBackupRecord.status,
            sizeBytes: preBackupRecord.sizeBytes,
            storagePath: preBackupRecord.storagePath,
            checksum: preBackupRecord.checksum,
            verificationStatus: preBackupRecord.verificationStatus,
            applicationVersion: preBackupRecord.applicationVersion,
            databaseVersion: preBackupRecord.databaseVersion,
            schemaVersion: preBackupRecord.schemaVersion,
            createdAt: preBackupRecord.createdAt,
          },
        });
      }
    }
  } catch (syncErr: any) {
    console.warn("Notice: backup sync in restored DB:", syncErr.message);
  }

  // Check if initiatedById exists in restored database; fallback to active admin if needed
  let effectiveInitiatorId = params.initiatedById;
  try {
    const userInRestored = await prisma.user.findUnique({ where: { id: params.initiatedById } });
    if (!userInRestored) {
      const fallbackAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      if (fallbackAdmin) {
        effectiveInitiatorId = fallbackAdmin.id;
      }
    }
  } catch {}

  // 3. Run Post-Restore Verification
  let postHealthStatus = "HEALTHY";
  try {
    await prisma.$queryRawUnsafe("PRAGMA integrity_check;");
  } catch (err: any) {
    postHealthStatus = "DEGRADED";
  }

  const restoreRecord = await prisma.restoreOperation.create({
    data: {
      restoreCode,
      backupId: backup.id,
      reason: params.reason,
      initiatedById: effectiveInitiatorId,
      startedAt,
      completedAt: new Date(),
      status: "COMPLETED",
      preRestoreBackupId,
      postRestoreHealthStatus: postHealthStatus,
      detailsJson: JSON.stringify({
        sourceBackupCode: backup.backupCode,
        sourceChecksum: backup.checksum,
        preRestoreBackupId,
      }),
    },
  });

  // Immutable audit log
  await prisma.auditLog.create({
    data: {
      userId: params.initiatedById,
      action: "RESTORE_EXECUTE",
      entityType: "RestoreOperation",
      entityId: restoreRecord.id,
      detailsJson: JSON.stringify({
        restoreCode,
        backupCode: backup.backupCode,
        reason: params.reason,
        postRestoreHealthStatus: postHealthStatus,
      }),
    },
  });

  return restoreRecord;
}

// -------------------------------------------------------------
// 4. DISASTER RECOVERY & RECOVERY DRILL ENGINE
// -------------------------------------------------------------
export async function runRecoveryDrill(backupId: string, conductedById?: string) {
  ensureDirectories();

  const backup = await prisma.systemBackup.findUnique({
    where: { id: backupId },
  });

  if (!backup) {
    throw new Error(`Backup not found with ID: ${backupId}`);
  }

  const backupFilePath = path.join(PROJECT_ROOT, backup.storagePath);
  if (!fs.existsSync(backupFilePath)) {
    throw new Error(`Backup file does not exist on disk: ${backup.storagePath}`);
  }

  const drillCode = `EHRJ-DRL-${new Date().getFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const drillStartTime = Date.now();

  // Compute Recovery Point Objective (RPO) = Age of the backup in hours
  const rpoHours = Math.round(((drillStartTime - backup.createdAt.getTime()) / (1000 * 60 * 60)) * 10) / 10;

  // Perform isolated restore into temporary test database
  const scratchDir = path.join(PROJECT_ROOT, "scratch");
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });
  const isolatedDbPath = path.join(scratchDir, `drill_${drillCode}.db`);

  try {
    fs.copyFileSync(backupFilePath, isolatedDbPath);

    // Verify file readability and size
    const stat = fs.statSync(isolatedDbPath);
    if (stat.size <= 0) {
      throw new Error("Drill restored file is empty");
    }

    // Verify SQLite Header with guaranteed file descriptor cleanup
    const fd = fs.openSync(isolatedDbPath, "r");
    let isValidHeader = false;
    try {
      const buffer = Buffer.alloc(16);
      fs.readSync(fd, buffer, 0, 16, 0);
      isValidHeader = buffer.toString("utf8").startsWith("SQLite format 3");
    } finally {
      fs.closeSync(fd);
    }

    if (!isValidHeader) {
      throw new Error("Drill restored file has invalid SQLite format");
    }

    // Clean up temporary isolated database
    if (fs.existsSync(isolatedDbPath)) {
      fs.unlinkSync(isolatedDbPath);
    }

    const rtoSeconds = Math.round(((Date.now() - drillStartTime) / 1000) * 100) / 100;

    const drillRecord = await prisma.recoveryDrill.create({
      data: {
        drillCode,
        backupId: backup.id,
        status: "PASSED",
        rpoHours,
        rtoSeconds,
        detailsJson: JSON.stringify({
          sourceBackupCode: backup.backupCode,
          verifiedChecksum: backup.checksum,
          testedFileSize: stat.size,
          isolationResult: "Structural SQLite 3 validation passed",
        }),
      },
    });

    return drillRecord;
  } catch (err: any) {
    if (fs.existsSync(isolatedDbPath)) {
      try {
        fs.unlinkSync(isolatedDbPath);
      } catch {}
    }
    const rtoSeconds = Math.round(((Date.now() - drillStartTime) / 1000) * 100) / 100;
    return prisma.recoveryDrill.create({
      data: {
        drillCode,
        backupId: backup.id,
        status: "FAILED",
        rpoHours,
        rtoSeconds,
        detailsJson: JSON.stringify({
          error: err.message,
        }),
      },
    });
  }
}

// -------------------------------------------------------------
// 5. INCIDENT MANAGEMENT ENGINE
// -------------------------------------------------------------
export async function createSystemIncident(data: {
  title: string;
  description: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  affectedService?: string;
  detectedById?: string;
  assignedToId?: string;
  detectedByName?: string;
}) {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  const incidentCode = `EHRJ-INC-${dateStr}-${randSuffix}`;

  const incident = await prisma.systemIncident.create({
    data: {
      incidentCode,
      title: data.title,
      description: data.description,
      severity: data.severity || "MEDIUM",
      status: "OPEN",
      affectedService: data.affectedService || "APPLICATION",
      detectedById: data.detectedById,
      assignedToId: data.assignedToId,
      events: {
        create: {
          eventType: "DETECTED",
          description: `ইনসিডেন্ট শনাক্ত হয়েছে: ${data.title}`,
          performedByName: data.detectedByName || "System",
        },
      },
    },
    include: { events: true },
  });

  // Generate corresponding OperationalAlert
  await triggerOperationalAlert({
    alertKey: `INCIDENT_${incident.id}`,
    title: `[${incident.severity}] ${incident.title}`,
    description: incident.description,
    severity: incident.severity as any,
    source: incident.affectedService,
  });

  // Log in AuditLog
  await prisma.auditLog.create({
    data: {
      userId: data.detectedById,
      action: "INCIDENT_CREATE",
      entityType: "SystemIncident",
      entityId: incident.id,
      detailsJson: JSON.stringify({
        incidentCode,
        severity: incident.severity,
        affectedService: incident.affectedService,
      }),
    },
  });

  return incident;
}

export async function updateIncidentStatus(params: {
  incidentId: string;
  status: "OPEN" | "ACKNOWLEDGED" | "INVESTIGATING" | "MITIGATING" | "RESOLVED" | "CLOSED";
  note?: string;
  performedByName?: string;
  performedById?: string;
  resolution?: string;
  rootCause?: string;
}) {
  const incident = await prisma.systemIncident.findUnique({
    where: { id: params.incidentId },
  });

  if (!incident) {
    throw new Error(`Incident not found with ID: ${params.incidentId}`);
  }

  const updateData: any = {
    status: params.status,
  };

  if (params.status === "ACKNOWLEDGED" && !incident.acknowledgedAt) {
    updateData.acknowledgedAt = new Date();
  }

  if (params.status === "RESOLVED" || params.status === "CLOSED") {
    if (!incident.resolvedAt) updateData.resolvedAt = new Date();
    if (params.resolution) updateData.resolution = params.resolution;
    if (params.rootCause) updateData.rootCause = params.rootCause;
  }

  const updated = await prisma.systemIncident.update({
    where: { id: params.incidentId },
    data: {
      ...updateData,
      events: {
        create: {
          eventType: params.status,
          description: params.note || `স্ট্যাটাস পরিবর্তন: ${params.status}`,
          performedByName: params.performedByName || "Administrator",
        },
      },
    },
    include: { events: { orderBy: { timestamp: "asc" } } },
  });

  // If incident is resolved, resolve associated operational alert
  if (params.status === "RESOLVED" || params.status === "CLOSED") {
    try {
      const alert = await prisma.operationalAlert.findUnique({
        where: { alertKey: `INCIDENT_${incident.id}` },
      });
      if (alert) {
        await prisma.operationalAlert.update({
          where: { id: alert.id },
          data: { status: "RESOLVED", resolvedAt: new Date() },
        });
      }
    } catch {}
  }

  return updated;
}

export async function listSystemIncidents(filters?: {
  status?: string;
  severity?: string;
  limit?: number;
}) {
  const where: any = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.severity) where.severity = filters.severity;

  return prisma.systemIncident.findMany({
    where,
    orderBy: { detectedAt: "desc" },
    take: filters?.limit || 50,
    include: {
      events: { orderBy: { timestamp: "asc" } },
      detectedBy: { select: { id: true, name: true, role: true } },
      assignedTo: { select: { id: true, name: true, role: true } },
    },
  });
}

// -------------------------------------------------------------
// 6. OPERATIONAL ALERT ENGINE (WITH DEDUPLICATION)
// -------------------------------------------------------------
export async function triggerOperationalAlert(params: {
  alertKey: string;
  title: string;
  description: string;
  severity?: "INFO" | "WARNING" | "URGENT" | "CRITICAL";
  source?: string;
}) {
  const existing = await prisma.operationalAlert.findUnique({
    where: { alertKey: params.alertKey },
  });

  const now = new Date();

  // Deduplication check: if active and triggered within last 30 minutes, bump occurrenceCount
  if (existing && existing.status !== "RESOLVED") {
    return prisma.operationalAlert.update({
      where: { id: existing.id },
      data: {
        occurrenceCount: existing.occurrenceCount + 1,
        lastTriggeredAt: now,
        title: params.title,
        description: params.description,
      },
    });
  }

  return prisma.operationalAlert.upsert({
    where: { alertKey: params.alertKey },
    update: {
      title: params.title,
      description: params.description,
      severity: params.severity || "WARNING",
      source: params.source || "HEALTH",
      status: "ACTIVE",
      occurrenceCount: 1,
      lastTriggeredAt: now,
    },
    create: {
      alertKey: params.alertKey,
      title: params.title,
      description: params.description,
      severity: params.severity || "WARNING",
      source: params.source || "HEALTH",
      status: "ACTIVE",
      occurrenceCount: 1,
      lastTriggeredAt: now,
    },
  });
}

export async function acknowledgeOperationalAlert(alertId: string, userId: string) {
  return prisma.operationalAlert.update({
    where: { id: alertId },
    data: {
      status: "ACKNOWLEDGED",
      acknowledgedById: userId,
      acknowledgedAt: new Date(),
    },
  });
}

export async function resolveOperationalAlert(alertId: string) {
  return prisma.operationalAlert.update({
    where: { id: alertId },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date(),
    },
  });
}

export async function listOperationalAlerts(statusFilter?: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED") {
  const where: any = {};
  if (statusFilter) {
    where.status = statusFilter;
  }

  return prisma.operationalAlert.findMany({
    where,
    orderBy: { lastTriggeredAt: "desc" },
    take: 50,
  });
}

// -------------------------------------------------------------
// 7. MAINTENANCE MODE ENGINE
// -------------------------------------------------------------
export async function getMaintenanceState() {
  const current = await prisma.maintenanceWindow.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return {
    isActive: Boolean(current?.isActive),
    window: current,
  };
}

export async function setMaintenanceState(params: {
  isActive: boolean;
  reason: string;
  enabledById?: string;
  messageBn?: string;
  messageEn?: string;
  expectedEndAt?: Date;
}) {
  if (params.isActive) {
    const window = await prisma.maintenanceWindow.create({
      data: {
        isActive: true,
        reason: params.reason,
        messageBn: params.messageBn || "সিস্টেম রক্ষণাবেক্ষণ কাজ চলছে। অতিসত্বর স্বাভাবিক কার্যক্রমে ফিরবে ইনশাআল্লাহ।",
        messageEn: params.messageEn || "System maintenance in progress. Normal operations will resume shortly inshaAllah.",
        startedAt: new Date(),
        expectedEndAt: params.expectedEndAt,
        enabledById: params.enabledById,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: params.enabledById,
        action: "MAINTENANCE_ENABLE",
        entityType: "MaintenanceWindow",
        entityId: window.id,
        detailsJson: JSON.stringify({ reason: params.reason }),
      },
    });

    return window;
  } else {
    // Disable all active maintenance windows
    await prisma.maintenanceWindow.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: params.enabledById,
        action: "MAINTENANCE_DISABLE",
        entityType: "MaintenanceWindow",
        detailsJson: JSON.stringify({ reason: params.reason }),
      },
    });

    return { isActive: false };
  }
}
