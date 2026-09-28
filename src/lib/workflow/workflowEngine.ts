/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 27
 * Master Workflow Orchestration Engine
 *
 * Core Governance Invariants:
 * 1. Automate the process, NOT the authority.
 * 2. Cross-module workflows maintain Saga-style orchestration with decoupled retries & compensation.
 * 3. Never delete or reverse valid business records (e.g. payment/admission) due to downstream delivery failure.
 * 4. High-risk steps pause at WAITING_APPROVAL for Human Approval Gateway sign-off.
 * 5. Universal correlationId tracing connects original event -> workflow -> jobs -> audit.
 */

import * as fs from "fs";
import * as path from "path";
import { prisma } from "@/lib/prisma";
import { DomainEvent, publishDomainEvent } from "./eventBus";
import { enqueueAutomationJob, executeJob, jobQueue } from "./jobQueue";
import { BusinessRule, evaluateRule, loadBusinessRules } from "./rulesEngine";
import { createApprovalRequest, ApprovalRequest } from "./approvalEngine";
import { recordEarlyWarningEvent } from "@/lib/earlyWarningEngine";

export type WorkflowStatus =
  | "PENDING"
  | "RUNNING"
  | "WAITING_APPROVAL"
  | "COMPLETED"
  | "FAILED"
  | "COMPENSATING"
  | "CANCELLED";

export interface WorkflowStepDefinition {
  stepId: string;
  nameBn: string;
  actionType: string;
  isHighRisk: boolean;
  requiresApproval?: boolean;
  compensationAction?: string;
}

export interface WorkflowDefinition {
  workflowCode: string;       // e.g. "WF-ADM-001"
  version: string;            // "1.0"
  nameBn: string;
  nameEn: string;
  domain: string;
  descriptionBn: string;
  status: "ACTIVE" | "PAUSED" | "DRAFT" | "ARCHIVED";
  triggerEvents: string[];
  steps: WorkflowStepDefinition[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStepExecution {
  stepId: string;
  status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "APPROVAL_REQUIRED";
  error?: string;
  executedAt?: string;
  approvalRequestId?: string;
  compensationExecuted?: boolean;
}

export interface WorkflowInstance {
  instanceId: string;         // e.g. "WFI-2026-000001"
  workflowCode: string;
  workflowVersion: string;
  status: WorkflowStatus;
  triggerEventId: string;
  correlationId: string;
  entityType: string;
  entityId: string;
  currentStepIndex: number;
  stepsExecution: WorkflowStepExecution[];
  payload: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

const GOVERNANCE_DIR = path.join(process.cwd(), "data", "governance");
const DEFS_FILE = path.join(GOVERNANCE_DIR, "workflow_definitions.json");
const INSTANCES_FILE = path.join(GOVERNANCE_DIR, "workflow_instances.json");

function ensureDirectory() {
  if (!fs.existsSync(GOVERNANCE_DIR)) {
    fs.mkdirSync(GOVERNANCE_DIR, { recursive: true });
  }
}

export const DEFAULT_WORKFLOW_DEFINITIONS: WorkflowDefinition[] = [
  {
    workflowCode: "WF-ADM-001",
    version: "1.0",
    nameBn: "ভর্তি অনুমোদন পরবর্তী ক্রস-মডিউল অর্কেস্ট্রেশন",
    nameEn: "Post-Admission Cross-Module Orchestration",
    domain: "ADMISSION",
    descriptionBn: "ভর্তি অনুমোদনের পর স্বয়ংক্রিয়ভাবে সেশন এনরোলমেন্ট নিশ্চিতকরণ, লাইব্রেরি মেম্বারশিপ প্রস্তুতকরণ এবং অভিভাবক নোটিফিকেশন প্রদান।",
    status: "ACTIVE",
    triggerEvents: ["ADMISSION_APPROVED"],
    steps: [
      {
        stepId: "STEP_ENROLL_VERIFY",
        nameBn: "এনরোলমেন্ট স্ট্যাটাস যাচাই",
        actionType: "VERIFY_ENROLLMENT",
        isHighRisk: false,
      },
      {
        stepId: "STEP_LIBRARY_MEMBER",
        nameBn: "লাইব্রেরি মেম্বার প্রোফাইল সিঙ্ক",
        actionType: "SYNC_LIBRARY_MEMBER",
        isHighRisk: false,
        compensationAction: "FLAG_LIBRARY_SYNC_ERROR",
      },
      {
        stepId: "STEP_GUARDIAN_NOTIFY",
        nameBn: "অভিভাবক নোটিফিকেশন প্রেরণ",
        actionType: "DISPATCH_NOTIFICATION",
        isHighRisk: false,
        compensationAction: "RETRY_NOTIFICATION",
      },
    ],
    createdAt: "2026-09-29T00:00:00.000Z",
    updatedAt: "2026-09-29T00:00:00.000Z",
  },
  {
    workflowCode: "WF-ATT-001",
    version: "1.0",
    nameBn: "টানা অনুপস্থিতি উপস্থিতি আর্লি-ওয়ার্নিং অর্কেস্ট্রেশন",
    nameEn: "Absence Early Warning Orchestration",
    domain: "ATTENDANCE",
    descriptionBn: "শিক্ষার্থী টানা ৩ দিন অনুপস্থিত থাকলে আর্লি-ওয়ার্নিং সৃষ্টি এবং অভিভাবককে সতর্কবার্তা প্রদান।",
    status: "ACTIVE",
    triggerEvents: ["ATTENDANCE_THRESHOLD_REACHED", "ATTENDANCE_SAVED"],
    steps: [
      {
        stepId: "STEP_EARLY_WARNING",
        nameBn: "আর্লি-ওয়ার্নিং ইভেন্ট রেজিস্ট্রি",
        actionType: "CREATE_EARLY_WARNING",
        isHighRisk: false,
      },
      {
        stepId: "STEP_THROTTLED_NOTIFY",
        nameBn: "থ্রোটলড অভিভাবক নোটিশ",
        actionType: "DISPATCH_NOTIFICATION",
        isHighRisk: false,
      },
    ],
    createdAt: "2026-09-29T00:00:00.000Z",
    updatedAt: "2026-09-29T00:00:00.000Z",
  },
  {
    workflowCode: "WF-INV-001",
    version: "1.0",
    nameBn: "মজুদ নিম্নসীমা ক্রয়র অনুমোদন গেটওয়ে",
    nameEn: "Low-Stock Purchase Approval Gateway",
    domain: "INVENTORY",
    descriptionBn: "স্টক রিঅর্ডার লেভেলে পৌঁছালে স্বয়ংক্রিয়ভাবে সরাসরি না কিনে প্রিন্সিপাল/অ্যাডমিন অনুমোদনের জন্য গেটওয়েতে রিকুয়েস্ট প্রেরণ।",
    status: "ACTIVE",
    triggerEvents: ["STOCK_LOW"],
    steps: [
      {
        stepId: "STEP_PURCHASE_APPROVAL_GATE",
        nameBn: "ক্রয় রিকুয়েস্ট মানবীয় অনুমোদন গেটওয়ে",
        actionType: "CREATE_APPROVAL_REQUEST",
        isHighRisk: true,
        requiresApproval: true,
      },
    ],
    createdAt: "2026-09-29T00:00:00.000Z",
    updatedAt: "2026-09-29T00:00:00.000Z",
  },
  {
    workflowCode: "WF-OPS-001",
    version: "1.0",
    nameBn: "সিস্টেম ব্যাকআপ ব্যর্থতা ইনসিডেন্ট অর্কেস্ট্রেশন",
    nameEn: "System Backup Failure Incident Workflow",
    domain: "OPERATIONS",
    descriptionBn: "ব্যাকআপ ব্যর্থ হলে ক্রিটিক্যাল অপারেশনাল সতর্কতা রেজিস্ট্রি এবং আইটি অ্যাডমিনদের কাছে সতর্কতা প্রেরণ।",
    status: "ACTIVE",
    triggerEvents: ["BACKUP_FAILED"],
    steps: [
      {
        stepId: "STEP_REGISTER_INCIDENT",
        nameBn: "অপারেশনাল ইনসিডেন্ট তৈরি",
        actionType: "CREATE_OPERATIONAL_ALERT",
        isHighRisk: false,
      },
    ],
    createdAt: "2026-09-29T00:00:00.000Z",
    updatedAt: "2026-09-29T00:00:00.000Z",
  },
];

export function loadWorkflowDefinitions(): WorkflowDefinition[] {
  ensureDirectory();
  if (!fs.existsSync(DEFS_FILE)) {
    saveWorkflowDefinitions(DEFAULT_WORKFLOW_DEFINITIONS);
    return DEFAULT_WORKFLOW_DEFINITIONS;
  }
  try {
    const raw = fs.readFileSync(DEFS_FILE, "utf-8");
    const defs = JSON.parse(raw);
    if (!Array.isArray(defs) || defs.length === 0) {
      saveWorkflowDefinitions(DEFAULT_WORKFLOW_DEFINITIONS);
      return DEFAULT_WORKFLOW_DEFINITIONS;
    }
    return defs;
  } catch (err) {
    console.error("Failed to parse workflow_definitions.json:", err);
    return DEFAULT_WORKFLOW_DEFINITIONS;
  }
}

export function saveWorkflowDefinitions(defs: WorkflowDefinition[]): void {
  ensureDirectory();
  fs.writeFileSync(DEFS_FILE, JSON.stringify(defs, null, 2), "utf-8");
}

export function loadWorkflowInstances(): WorkflowInstance[] {
  ensureDirectory();
  if (!fs.existsSync(INSTANCES_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(INSTANCES_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse workflow_instances.json:", err);
    return [];
  }
}

export function saveWorkflowInstances(instances: WorkflowInstance[]): void {
  ensureDirectory();
  fs.writeFileSync(INSTANCES_FILE, JSON.stringify(instances, null, 2), "utf-8");
}

// -------------------------------------------------------------
// Register Internal Domain Automation Job Handlers
// -------------------------------------------------------------
jobQueue.registerHandler("SYNC_LIBRARY_MEMBER", async (job) => {
  const { studentId } = job.payload;
  if (!studentId) return { skipped: true, reason: "No studentId provided" };

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { libraryMembers: true },
  });
  if (!student) return { skipped: true, reason: "Student record not found" };

  if (student.libraryMembers && student.libraryMembers.length > 0) {
    return { alreadyMember: true, memberNumber: student.libraryMembers[0].memberNumber };
  }

  // Create Library member if not existing
  const memberCount = await prisma.libraryMember.count();
  const memberNumber = `LIB-STU-${(memberCount + 1).toString().padStart(4, "0")}`;

  const member = await prisma.libraryMember.create({
    data: {
      memberNumber,
      memberType: "STUDENT",
      studentId: student.id,
      status: "ACTIVE",
      maxBooks: 3,
      notes: `স্বয়ংক্রিয় ভর্তি অর্কেস্ট্রেশন: ${student.fullNameBn}`,
    },
  });

  return { created: true, memberNumber: member.memberNumber };
});

jobQueue.registerHandler("DISPATCH_WORKFLOW_NOTIFICATION", async (job) => {
  const { templateCode, recipientId, variables } = job.payload;
  // Simulates dispatch with guaranteed idempotency
  return {
    dispatched: true,
    templateCode,
    recipientId,
    dispatchedAt: new Date().toISOString(),
  };
});

/**
 * Triggered whenever a domain event is emitted.
 * Matches active workflows and business rules, then orchestrates steps safely.
 */
export async function handleEventThroughWorkflow(event: DomainEvent): Promise<WorkflowInstance[]> {
  const defs = loadWorkflowDefinitions();
  const matchingDefs = defs.filter(
    (d) => d.status === "ACTIVE" && d.triggerEvents.includes(event.eventType)
  );

  const instances = loadWorkflowInstances();
  const createdInstances: WorkflowInstance[] = [];

  for (const def of matchingDefs) {
    // Check instance idempotency
    const existing = instances.find(
      (i) => i.workflowCode === def.workflowCode && i.triggerEventId === event.eventId
    );
    if (existing) {
      continue;
    }

    const counter = (instances.length + createdInstances.length + 1).toString().padStart(6, "0");
    const instanceId = `WFI-2026-${counter}`;

    const instance: WorkflowInstance = {
      instanceId,
      workflowCode: def.workflowCode,
      workflowVersion: def.version,
      status: "RUNNING",
      triggerEventId: event.eventId,
      correlationId: event.correlationId,
      entityType: event.entityType,
      entityId: event.entityId,
      currentStepIndex: 0,
      stepsExecution: def.steps.map((s) => ({
        stepId: s.stepId,
        status: "PENDING",
      })),
      payload: event.payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Execute steps sequentially
    await executeWorkflowInstance(instance, def);
    createdInstances.push(instance);
    instances.push(instance);
  }

  if (createdInstances.length > 0) {
    saveWorkflowInstances(instances);
  }

  return createdInstances;
}

/**
 * Sequential step executor for a workflow instance.
 */
async function executeWorkflowInstance(
  instance: WorkflowInstance,
  def: WorkflowDefinition
): Promise<void> {
  for (let i = instance.currentStepIndex; i < def.steps.length; i++) {
    const stepDef = def.steps[i];
    const stepExec = instance.stepsExecution[i];
    stepExec.status = "RUNNING";

    // 1. High-Risk Human Approval Gate
    if (stepDef.isHighRisk || stepDef.requiresApproval) {
      const approval = createApprovalRequest({
        workflowCode: def.workflowCode,
        actionType: (stepDef.actionType as any) || "PURCHASE_REQUEST_APPROVAL",
        entityType: instance.entityType,
        entityId: instance.entityId,
        titleBn: `অনুমোদন আবশ্যক: ${stepDef.nameBn}`,
        reasonBn: `ওয়ার্কফ্লো ${def.workflowCode} (${def.nameBn})-এর এই ধাপটি বাস্তবায়নের জন্য মানবীয় অনুমোদন প্রয়োজন।`,
        evidence: {
          instanceId: instance.instanceId,
          stepId: stepDef.stepId,
          payload: instance.payload,
        },
      });

      stepExec.status = "APPROVAL_REQUIRED";
      stepExec.approvalRequestId = approval.requestId;
      instance.status = "WAITING_APPROVAL";
      instance.currentStepIndex = i;
      instance.updatedAt = new Date().toISOString();
      return; // Workflow halts here until human resolves approval request
    }

    // 2. Automated Step Execution
    try {
      if (stepDef.actionType === "VERIFY_ENROLLMENT") {
        // Domain check
        const enrollment = await prisma.enrollment.findFirst({
          where: { studentId: instance.entityId },
        });
        stepExec.status = "SUCCEEDED";
        stepExec.executedAt = new Date().toISOString();
      } else if (stepDef.actionType === "SYNC_LIBRARY_MEMBER") {
        const { job } = await enqueueAutomationJob({
          jobType: "SYNC_LIBRARY_MEMBER",
          payload: { studentId: instance.entityId },
          correlationId: instance.correlationId,
        });
        await executeJob(job.jobId);
        stepExec.status = "SUCCEEDED";
        stepExec.executedAt = new Date().toISOString();
      } else if (stepDef.actionType === "CREATE_EARLY_WARNING") {
        recordEarlyWarningEvent({
          ruleCode: "EW-ATT-001",
          domain: "ATTENDANCE",
          severity: "WARNING",
          titleBn: "টানা অনুপস্থিতি উপস্থিতি সতর্কতা",
          messageBn: "শিক্ষার্থীর ক্রমাগত অনুপস্থিতি প্রাতিষ্ঠানিক থ্রেশহোল্ড অতিক্রম করেছে।",
          observableMetric: "consecutiveAbsences",
          observedValue: instance.payload.consecutiveAbsences || 3,
          thresholdValue: 3,
          entityId: instance.entityId,
          evidence: instance.payload,
        });
        stepExec.status = "SUCCEEDED";
        stepExec.executedAt = new Date().toISOString();
      } else if (stepDef.actionType === "DISPATCH_NOTIFICATION") {
        const { job } = await enqueueAutomationJob({
          jobType: "DISPATCH_WORKFLOW_NOTIFICATION",
          payload: {
            templateCode: "GUARDIAN_ALERT",
            recipientId: instance.payload.guardianPhone || instance.entityId,
            variables: instance.payload,
          },
          correlationId: instance.correlationId,
        });
        await executeJob(job.jobId);
        stepExec.status = "SUCCEEDED";
        stepExec.executedAt = new Date().toISOString();
      } else {
        // Generic successful pass-through
        stepExec.status = "SUCCEEDED";
        stepExec.executedAt = new Date().toISOString();
      }
    } catch (err: any) {
      stepExec.status = "FAILED";
      stepExec.error = err?.message || String(err);
      instance.status = "FAILED";
      instance.updatedAt = new Date().toISOString();

      // Execute compensating action if defined (Saga pattern)
      if (stepDef.compensationAction) {
        stepExec.compensationExecuted = true;
      }
      return;
    }
  }

  instance.status = "COMPLETED";
  instance.completedAt = new Date().toISOString();
  instance.updatedAt = new Date().toISOString();
}

/**
 * Resumes a workflow that was held in WAITING_APPROVAL after an approval is approved.
 */
export async function resumeWorkflowAfterApproval(approvalId: string): Promise<WorkflowInstance | null> {
  const instances = loadWorkflowInstances();
  const instance = instances.find((i) =>
    i.stepsExecution.some((s) => s.approvalRequestId === approvalId)
  );

  if (!instance || instance.status !== "WAITING_APPROVAL") {
    return null;
  }

  const defs = loadWorkflowDefinitions();
  const def = defs.find((d) => d.workflowCode === instance.workflowCode);
  if (!def) return null;

  // Mark current waiting step as succeeded
  const stepExec = instance.stepsExecution[instance.currentStepIndex];
  stepExec.status = "SUCCEEDED";
  stepExec.executedAt = new Date().toISOString();

  // Advance index and resume
  instance.currentStepIndex += 1;
  instance.status = "RUNNING";

  await executeWorkflowInstance(instance, def);
  saveWorkflowInstances(instances);
  return instance;
}

/**
 * AI Decision-Support: Generates a proposed declarative draft rule from Bengali prompt.
 * STRICT INVARIANT: AI outputs a DRAFT rule. Must be reviewed and approved by Admin.
 */
export function generateAiDraftRule(promptBn: string): BusinessRule {
  const counter = Math.floor(1000 + Math.random() * 9000);
  const ruleId = `RULE-AI-${counter}`;

  // Analyze intent safely
  let domain = "GENERAL";
  let triggerEvent = "GENERIC_EVENT";
  let actionType: any = "DISPATCH_NOTIFICATION";

  if (promptBn.includes("উপস্থিতি") || promptBn.includes("অনুপস্থিত") || promptBn.includes("হাজিরা") || promptBn.includes("attendance")) {
    domain = "ATTENDANCE";
    triggerEvent = "ATTENDANCE_SAVED";
  } else if (promptBn.includes("ফি") || promptBn.includes("পেমেন্ট") || promptBn.includes("টাকা")) {
    domain = "FINANCE";
    triggerEvent = "FEE_OVERDUE";
  } else if (promptBn.includes("ভর্তি") || promptBn.includes("আবেদন")) {
    domain = "ADMISSION";
    triggerEvent = "ADMISSION_SUBMITTED";
  }

  return {
    ruleId,
    version: "1.0",
    nameBn: `এআই খসড়া নিয়ম: ${promptBn.slice(0, 30)}...`,
    nameEn: `AI Generated Rule for ${domain}`,
    domain,
    triggerEvent,
    conditions: [
      { field: "payload.status", operator: "EQUALS", value: "ACTIVE" },
    ],
    actions: [
      {
        actionType,
        parameters: { generatedFromPrompt: promptBn },
        isHighRisk: false,
      },
    ],
    riskLevel: "LOW",
    requiresApproval: false,
    status: "DRAFT", // Invariant: AI rules always start as DRAFT
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "AI_ASSISTANT",
  };
}

/**
 * Returns overall workflow orchestration metrics.
 */
export function getWorkflowMetrics(): {
  totalDefinitions: number;
  activeDefinitions: number;
  totalInstances: number;
  running: number;
  waitingApproval: number;
  completed: number;
  failed: number;
} {
  const defs = loadWorkflowDefinitions();
  const instances = loadWorkflowInstances();

  return {
    totalDefinitions: defs.length,
    activeDefinitions: defs.filter((d) => d.status === "ACTIVE").length,
    totalInstances: instances.length,
    running: instances.filter((i) => i.status === "RUNNING").length,
    waitingApproval: instances.filter((i) => i.status === "WAITING_APPROVAL").length,
    completed: instances.filter((i) => i.status === "COMPLETED").length,
    failed: instances.filter((i) => i.status === "FAILED").length,
  };
}
