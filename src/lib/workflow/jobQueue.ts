/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 27
 * Unified Automation Job Queue & Dead-Letter Management
 *
 * Core Governance Invariants:
 * 1. Failed automation must NEVER fail silently.
 * 2. Exponential backoff retry strategy with maximum attempts (default: 3).
 * 3. Exhausted jobs quarantine in DEAD_LETTER status for Admin/Operations inspection.
 * 4. Idempotency guarantees prevent duplicate task execution.
 */

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export type JobStatus =
  | "QUEUED"
  | "RUNNING"
  | "SUCCEEDED"
  | "RETRYING"
  | "FAILED"
  | "DEAD_LETTER"
  | "CANCELLED";

export interface AutomationJob<T = Record<string, any>, R = Record<string, any>> {
  jobId: string;              // e.g. "JOB-2026-000001"
  jobType: string;            // e.g. "DISPATCH_NOTIFICATION", "CREATE_MONTHLY_INVOICE"
  status: JobStatus;
  payload: T;
  result?: R;
  error?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  nextRetryAt?: string;
  correlationId: string;
  idempotencyKey: string;
}

export type JobHandler<T = any, R = any> = (job: AutomationJob<T>) => Promise<R>;

const GOVERNANCE_DIR = path.join(process.cwd(), "data", "governance");
const JOBS_FILE = path.join(GOVERNANCE_DIR, "automation_jobs.json");

function ensureDirectory() {
  if (!fs.existsSync(GOVERNANCE_DIR)) {
    fs.mkdirSync(GOVERNANCE_DIR, { recursive: true });
  }
}

export function loadAutomationJobs(): AutomationJob[] {
  ensureDirectory();
  if (!fs.existsSync(JOBS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(JOBS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse automation_jobs.json:", err);
    return [];
  }
}

function saveAutomationJobs(jobs: AutomationJob[]): void {
  ensureDirectory();
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2), "utf-8");
}

class JobQueueRegistry {
  private handlers: Map<string, JobHandler> = new Map();

  public registerHandler(jobType: string, handler: JobHandler): void {
    this.handlers.set(jobType, handler);
  }

  public getHandler(jobType: string): JobHandler | undefined {
    return this.handlers.get(jobType);
  }
}

export const jobQueue = new JobQueueRegistry();

/**
 * Enqueues an automation job with idempotency protection.
 */
export async function enqueueAutomationJob<T = Record<string, any>>(params: {
  jobType: string;
  payload: T;
  maxAttempts?: number;
  correlationId?: string;
  idempotencyKey?: string;
}): Promise<{ job: AutomationJob<T>; isDuplicate: boolean }> {
  ensureDirectory();
  const jobs = loadAutomationJobs();

  const key =
    params.idempotencyKey ||
    `job_${params.jobType}_${crypto
      .createHash("sha256")
      .update(JSON.stringify(params.payload || {}))
      .digest("hex")
      .slice(0, 12)}`;

  const existing = jobs.find((j) => j.idempotencyKey === key && j.status !== "DEAD_LETTER" && j.status !== "FAILED");
  if (existing) {
    return { job: existing as AutomationJob<T>, isDuplicate: true };
  }

  const jobCounter = (jobs.length + 1).toString().padStart(6, "0");
  const jobId = `JOB-2026-${jobCounter}`;

  const job: AutomationJob<T> = {
    jobId,
    jobType: params.jobType,
    status: "QUEUED",
    payload: params.payload,
    attempts: 0,
    maxAttempts: params.maxAttempts || 3,
    createdAt: new Date().toISOString(),
    correlationId: params.correlationId || jobId,
    idempotencyKey: key,
  };

  jobs.push(job as any);
  saveAutomationJobs(jobs);

  return { job, isDuplicate: false };
}

/**
 * Processes a single job immediately using registered handler.
 * Implements exponential backoff retry and transitions to DEAD_LETTER when attempts are exhausted.
 */
export async function executeJob(jobId: string): Promise<AutomationJob> {
  const jobs = loadAutomationJobs();
  const jobIndex = jobs.findIndex((j) => j.jobId === jobId);
  if (jobIndex === -1) {
    throw new Error(`Job not found: ${jobId}`);
  }

  const job = jobs[jobIndex];
  if (job.status === "SUCCEEDED" || job.status === "CANCELLED") {
    return job;
  }

  const handler = jobQueue.getHandler(job.jobType);
  if (!handler) {
    job.status = "DEAD_LETTER";
    job.error = `No handler registered for job type: ${job.jobType}`;
    job.completedAt = new Date().toISOString();
    jobs[jobIndex] = job;
    saveAutomationJobs(jobs);
    return job;
  }

  job.status = "RUNNING";
  job.startedAt = new Date().toISOString();
  job.attempts += 1;
  jobs[jobIndex] = job;
  saveAutomationJobs(jobs);

  try {
    const result = await handler(job);
    job.status = "SUCCEEDED";
    job.result = result;
    job.error = undefined;
    job.completedAt = new Date().toISOString();
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    if (job.attempts < job.maxAttempts) {
      job.status = "RETRYING";
      job.error = errorMsg;
      // Exponential backoff: 2^attempts * 1000ms
      const delayMs = Math.pow(2, job.attempts) * 1000;
      job.nextRetryAt = new Date(Date.now() + delayMs).toISOString();
    } else {
      job.status = "DEAD_LETTER";
      job.error = `Max attempts (${job.maxAttempts}) reached. Error: ${errorMsg}`;
      job.completedAt = new Date().toISOString();
    }
  }

  jobs[jobIndex] = job;
  saveAutomationJobs(jobs);
  return job;
}

/**
 * Manually replays a dead-letter or failed job.
 */
export async function replayDeadLetterJob(jobId: string): Promise<AutomationJob> {
  const jobs = loadAutomationJobs();
  const job = jobs.find((j) => j.jobId === jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }
  if (job.status !== "DEAD_LETTER" && job.status !== "FAILED") {
    throw new Error(`Only DEAD_LETTER or FAILED jobs can be replayed. Current status: ${job.status}`);
  }

  job.status = "QUEUED";
  job.attempts = 0; // Reset attempts for manual replay
  job.error = undefined;
  job.startedAt = undefined;
  job.completedAt = undefined;
  job.nextRetryAt = undefined;
  saveAutomationJobs(jobs);

  return executeJob(jobId);
}

/**
 * Cancels a pending or queued job.
 */
export function cancelJob(jobId: string, reason?: string): AutomationJob {
  const jobs = loadAutomationJobs();
  const job = jobs.find((j) => j.jobId === jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }
  if (job.status === "SUCCEEDED" || job.status === "CANCELLED") {
    return job;
  }

  job.status = "CANCELLED";
  job.error = reason ? `Cancelled: ${reason}` : "Cancelled by administrator";
  job.completedAt = new Date().toISOString();
  saveAutomationJobs(jobs);
  return job;
}

/**
 * Returns overall queue health and depth metrics.
 */
export function getJobQueueMetrics(): {
  totalJobs: number;
  queued: number;
  running: number;
  succeeded: number;
  retrying: number;
  deadLetter: number;
  cancelled: number;
} {
  const jobs = loadAutomationJobs();
  return {
    totalJobs: jobs.length,
    queued: jobs.filter((j) => j.status === "QUEUED").length,
    running: jobs.filter((j) => j.status === "RUNNING").length,
    succeeded: jobs.filter((j) => j.status === "SUCCEEDED").length,
    retrying: jobs.filter((j) => j.status === "RETRYING").length,
    deadLetter: jobs.filter((j) => j.status === "DEAD_LETTER").length,
    cancelled: jobs.filter((j) => j.status === "CANCELLED").length,
  };
}
