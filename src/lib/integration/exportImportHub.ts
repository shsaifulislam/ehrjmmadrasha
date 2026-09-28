/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 28
 * Institutional Data Import/Export Hub & RBAC Data Minimization
 *
 * Core Governance Invariants:
 * 1. RBAC & IDOR: Teachers cannot export finance/HR data; Guardians only export their children.
 * 2. Field-Level Minimization: Sensitive IDs/NIDs omitted unless strictly required.
 * 3. Batch Job Tracking: Job IDs (EHRJ-IMP-2026-XXXXXX, EHRJ-EXP-2026-XXXXXX).
 * 4. Preview before commit.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { ImportExportJob, JobType } from "./types";
import { validateStudentImportBatch, commitStudentImportBatch } from "@/lib/importValidator";
import { recordAuditLog } from "@/lib/security";

const DATA_DIR = path.join(process.cwd(), "data", "integrations");
const JOBS_FILE = path.join(DATA_DIR, "import_export_jobs.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadImportExportJobs(): ImportExportJob[] {
  ensureDir();
  if (!fs.existsSync(JOBS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(JOBS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

export function saveImportExportJobs(jobs: ImportExportJob[]): void {
  ensureDir();
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs.slice(-500), null, 2), "utf-8");
}

/**
 * Execute controlled export with RBAC and privacy minimization
 */
export async function executeInstitutionalExport(params: {
  entityType: "STUDENT" | "ATTENDANCE" | "FINANCE" | "EXAM";
  format?: "JSON" | "CSV";
  actorRole: string;
  actorId: string;
  filterClassId?: string;
  filterSessionId?: string;
}): Promise<{
  job: ImportExportJob;
  data: any[];
  csvString?: string;
}> {
  // 1. RBAC Verification
  if (params.entityType === "FINANCE" && params.actorRole !== "ADMIN" && params.actorRole !== "PRINCIPAL") {
    throw new Error("অননুমোদিত অ্যাক্সেস। ফিন্যান্সিয়াল এক্সপোর্টের জন্য অ্যাডমিন পারমিশন আবশ্যক।");
  }

  if (params.actorRole === "GUARDIAN") {
    throw new Error("অভিভাবকদের জন্য বাল্ক সিস্টেম এক্সপোর্ট অনুমোদিত নয়।");
  }

  const jobCounter = (loadImportExportJobs().length + 1).toString().padStart(6, "0");
  const jobId = `EHRJ-EXP-2026-${jobCounter}`;

  let exportedRecords: any[] = [];

  switch (params.entityType) {
    case "STUDENT": {
      const whereClause: any = { status: "ACTIVE" };
      const rawStudents = await prisma.student.findMany({
        where: whereClause,
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
            include: { jamatClass: true, session: true },
          },
          guardianLinks: {
            include: { guardian: true },
          },
        },
        take: 500,
      });

      // Apply field-level privacy minimization
      exportedRecords = rawStudents.map((s: any) => {
        const primaryEnrollment = s.enrollments?.[0];
        const primaryGuardian = s.guardianLinks?.[0]?.guardian;

        return {
          studentIdNumber: s.studentIdNumber,
          fullNameBn: s.fullNameBn,
          fullNameEn: s.fullNameEn || "",
          gender: s.gender,
          className: primaryEnrollment?.jamatClass?.nameBn || "N/A",
          rollNumber: primaryEnrollment?.rollNumber || 0,
          sessionName: primaryEnrollment?.session?.name || "N/A",
          fatherNameBn: s.fatherNameBn,
          guardianPhone: primaryGuardian?.phone ? primaryGuardian.phone.slice(0, 7) + "****" : "N/A", // Masked
          status: s.status,
        };
      });
      break;
    }

    case "ATTENDANCE": {
      const attendances = await prisma.attendance.findMany({
        include: {
          student: { select: { studentIdNumber: true, fullNameBn: true } },
          jamatClass: { select: { nameBn: true } },
        },
        orderBy: { date: "desc" },
        take: 500,
      });

      exportedRecords = attendances.map((a: any) => ({
        studentIdNumber: a.student?.studentIdNumber || "",
        fullNameBn: a.student?.fullNameBn || "",
        className: a.jamatClass?.nameBn || "",
        date: a.date.toISOString().split("T")[0],
        status: a.status,
        remarks: a.remarks || "",
      }));
      break;
    }

    case "FINANCE": {
      const invoices = await prisma.feeInvoice.findMany({
        include: {
          student: { select: { studentIdNumber: true, fullNameBn: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 500,
      });

      exportedRecords = invoices.map((inv) => ({
        invoiceNumber: inv.invoiceNumber,
        studentIdNumber: inv.student.studentIdNumber,
        studentName: inv.student.fullNameBn,
        feeType: inv.feeType,
        netAmount: inv.netAmount,
        paidAmount: inv.paidAmount,
        dueAmount: inv.dueAmount,
        status: inv.status,
        dueDate: inv.dueDate.toISOString().split("T")[0],
      }));
      break;
    }

    case "EXAM": {
      const exams = await prisma.exam.findMany({
        include: {
          session: true,
        },
        take: 100,
      });

      exportedRecords = exams.map((e: any) => ({
        examNameBn: e.nameBn,
        examType: e.examType,
        sessionName: e.session?.name || "N/A",
        startDate: e.startDate.toISOString().split("T")[0],
        endDate: e.endDate.toISOString().split("T")[0],
        status: e.status,
      }));
      break;
    }
  }

  // Convert to CSV if requested
  let csvString: string | undefined = undefined;
  if (params.format === "CSV" && exportedRecords.length > 0) {
    const headers = Object.keys(exportedRecords[0]);
    const rows = exportedRecords.map((row) =>
      headers
        .map((h) => {
          const val = row[h]?.toString() || "";
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(",")
    );
    csvString = [headers.join(","), ...rows].join("\n");
  }

  const job: ImportExportJob = {
    id: jobId,
    jobType: "EXPORT",
    entityType: params.entityType,
    status: "COMPLETED",
    totalCount: exportedRecords.length,
    successCount: exportedRecords.length,
    failureCount: 0,
    initiatedBy: params.actorId,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };

  const jobs = loadImportExportJobs();
  jobs.unshift(job);
  saveImportExportJobs(jobs);

  await recordAuditLog({
    userId: params.actorId,
    action: "INSTITUTIONAL_DATA_EXPORT",
    entityType: "ImportExportJob",
    entityId: jobId,
    details: {
      entityType: params.entityType,
      recordCount: exportedRecords.length,
      format: params.format || "JSON",
    },
  });

  return { job, data: exportedRecords, csvString };
}

/**
 * Controlled bulk student import with schema validation & safety checks
 */
export async function executeInstitutionalImport(params: {
  entityType: "STUDENT";
  rows: any[];
  previewOnly?: boolean;
  actorId: string;
}): Promise<{
  job?: ImportExportJob;
  validationResult: any;
  committed: boolean;
  message: string;
}> {
  const valResult = await validateStudentImportBatch(params.rows);

  if (params.previewOnly || !valResult.isValid) {
    return {
      validationResult: valResult,
      committed: false,
      message: valResult.isValid
        ? "প্রিভিউ যাচাই সফল হয়েছে। ডেটাবেজে সংরক্ষণের জন্য প্রস্তুত।"
        : `ইমপোর্ট ফাইলে ${valResult.errors.length} টি ত্রুটি পাওয়া গেছে।`,
    };
  }

  // Execute commit safely
  const jobCounter = (loadImportExportJobs().length + 1).toString().padStart(6, "0");
  const jobId = `EHRJ-IMP-2026-${jobCounter}`;

  const commitResult = await commitStudentImportBatch(params.rows, params.actorId);

  const job: ImportExportJob = {
    id: jobId,
    jobType: "IMPORT",
    entityType: "STUDENT",
    status: "COMPLETED",
    totalCount: params.rows.length,
    successCount: commitResult.insertedCount,
    failureCount: 0,
    initiatedBy: params.actorId,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };

  const jobs = loadImportExportJobs();
  jobs.unshift(job);
  saveImportExportJobs(jobs);

  return {
    job,
    validationResult: valResult,
    committed: true,
    message: commitResult.messageBn,
  };
}
