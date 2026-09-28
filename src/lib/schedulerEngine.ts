/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 19
 * Master Scheduled Jobs & Maintenance Cron Engine
 * 
 * Provides automated background execution for:
 * 1. Notification Outbox queue retries.
 * 2. Automated daily backup snapshots with retention.
 * 3. Daily attendance submission monitoring.
 * 4. Expiring document scans & administrative alerts.
 */

import { prisma } from "@/lib/prisma";
import { createDatabaseBackup, applyBackupRetention, triggerOperationalAlert } from "@/lib/operationsEngine";

export interface ScheduledJobResult {
  jobKey: string;
  jobName: string;
  status: "SUCCESS" | "FAILED" | "SKIPPED";
  executionTimeMs: number;
  details: string;
  error?: string;
}

export interface MasterCronExecutionReport {
  timestamp: string;
  totalJobs: number;
  passedJobs: number;
  failedJobs: number;
  results: ScheduledJobResult[];
}

/**
 * 1. Process Pending Notification Outbox Queue
 */
export async function processNotificationOutboxQueue(): Promise<ScheduledJobResult> {
  const startTime = Date.now();
  const jobKey = "NOTIFICATION_OUTBOX_PROCESSOR";
  const jobName = "বিজ্ঞপ্তি প্রেরণ কিউ প্রসেসর (Notification Outbox Queue)";

  try {
    const pendingEvents = await prisma.notificationOutbox.findMany({
      where: {
        status: { in: ["PENDING", "FAILED"] },
        attempts: { lt: 3 },
      },
      take: 20,
    });

    let processedCount = 0;
    for (const evt of pendingEvents) {
      // Simulate/trigger delivery dispatch
      await prisma.notificationOutbox.update({
        where: { id: evt.id },
        data: {
          status: "SENT",
          attempts: { increment: 1 },
          processedAt: new Date(),
        },
      });
      processedCount++;
    }

    return {
      jobKey,
      jobName,
      status: "SUCCESS",
      executionTimeMs: Date.now() - startTime,
      details: `Processed ${processedCount} pending notification events out of ${pendingEvents.length} found.`,
    };
  } catch (err: any) {
    return {
      jobKey,
      jobName,
      status: "FAILED",
      executionTimeMs: Date.now() - startTime,
      details: "Notification outbox processor encountered an error.",
      error: err.message,
    };
  }
}

/**
 * 2. Automated Daily Database Backup & Retention
 */
export async function runAutomatedDailyBackup(): Promise<ScheduledJobResult> {
  const startTime = Date.now();
  const jobKey = "DAILY_DATABASE_BACKUP";
  const jobName = "দৈনিক স্বয়ংক্রিয় ব্যাকআপ ও সংরক্ষণ (Daily Automated Backup)";

  try {
    const backup = await createDatabaseBackup("AUTOMATIC");
    const retention = await applyBackupRetention({ keepMinimumCount: 3, maxAgeDays: 30 });

    return {
      jobKey,
      jobName,
      status: "SUCCESS",
      executionTimeMs: Date.now() - startTime,
      details: `Snapshot created: ${backup.backupCode} (${(((backup.sizeBytes || 0)) / (1024 * 1024)).toFixed(2)} MB, SHA: ${(backup.checksum || "").slice(0, 10)}...). Retained: ${retention.retainedCount}, Purged: ${retention.deletedCount}.`,
    };
  } catch (err: any) {
    return {
      jobKey,
      jobName,
      status: "FAILED",
      executionTimeMs: Date.now() - startTime,
      details: "Automated daily backup failed.",
      error: err.message,
    };
  }
}

/**
 * 3. Daily Attendance Submission Monitoring
 */
export async function runDailyAttendanceMonitor(): Promise<ScheduledJobResult> {
  const startTime = Date.now();
  const jobKey = "DAILY_ATTENDANCE_MONITOR";
  const jobName = "দৈনিক হাজিরা পর্যবেক্ষণ ও মনিটরিং (Attendance Monitor)";

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAttendanceCount = await prisma.attendance.count({
      where: { date: today },
    });

    const activeClasses = await prisma.jamatClass.count();

    return {
      jobKey,
      jobName,
      status: "SUCCESS",
      executionTimeMs: Date.now() - startTime,
      details: `Today's attendance records registered: ${todayAttendanceCount} across ${activeClasses} active Jamat classes.`,
    };
  } catch (err: any) {
    return {
      jobKey,
      jobName,
      status: "FAILED",
      executionTimeMs: Date.now() - startTime,
      details: "Daily attendance monitor encountered an error.",
      error: err.message,
    };
  }
}

/**
 * 4. Expiring Employee Documents & License Scanner
 */
export async function scanExpiringDocumentsJob(): Promise<ScheduledJobResult> {
  const startTime = Date.now();
  const jobKey = "EXPIRING_DOCUMENTS_SCANNER";
  const jobName = "মেয়াদোত্তীর্ণ ডকুমেন্ট ও সনদ স্ক্যানার (Document Expiry Scanner)";

  try {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 86400000);
    const expiringDocs = await prisma.employeeDocument.findMany({
      where: {
        expiryDate: {
          lte: thirtyDaysFromNow,
          gte: new Date(),
        },
      },
      include: { employee: true },
    });

    if (expiringDocs.length > 0) {
      await triggerOperationalAlert({
        alertKey: "EXPIRING_EMPLOYEE_DOCS",
        title: `${expiringDocs.length}টি শিক্ষক/কর্মচারী ডকুমেন্টের মেয়াদ দ্রুত শেষ হতে যাচ্ছে`,
        description: `আসন্ন ৩০ দিনের মধ্যে ${expiringDocs.length}টি ডকুমেন্টের নবায়ন আবশ্যক।`,
        severity: "WARNING",
        source: "HR",
      });
    }

    return {
      jobKey,
      jobName,
      status: "SUCCESS",
      executionTimeMs: Date.now() - startTime,
      details: `Scanned employee records. Found ${expiringDocs.length} documents approaching expiry in next 30 days.`,
    };
  } catch (err: any) {
    return {
      jobKey,
      jobName,
      status: "FAILED",
      executionTimeMs: Date.now() - startTime,
      details: "Expiring documents scan failed.",
      error: err.message,
    };
  }
}

/**
 * Master Scheduled Jobs Execution Registry
 */
export async function executeMasterCronRegistry(targetJobKey?: string): Promise<MasterCronExecutionReport> {
  const jobs = [
    { key: "NOTIFICATION_OUTBOX_PROCESSOR", fn: processNotificationOutboxQueue },
    { key: "DAILY_DATABASE_BACKUP", fn: runAutomatedDailyBackup },
    { key: "DAILY_ATTENDANCE_MONITOR", fn: runDailyAttendanceMonitor },
    { key: "EXPIRING_DOCUMENTS_SCANNER", fn: scanExpiringDocumentsJob },
  ];

  const results: ScheduledJobResult[] = [];

  for (const job of jobs) {
    if (!targetJobKey || targetJobKey === "ALL" || targetJobKey === job.key) {
      const res = await job.fn();
      results.push(res);
    }
  }

  const passedJobs = results.filter((r) => r.status === "SUCCESS").length;
  const failedJobs = results.filter((r) => r.status === "FAILED").length;

  return {
    timestamp: new Date().toISOString(),
    totalJobs: results.length,
    passedJobs,
    failedJobs,
    results,
  };
}
