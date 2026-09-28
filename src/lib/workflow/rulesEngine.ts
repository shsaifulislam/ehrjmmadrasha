/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 27
 * Declarative Business Rules Engine & Dry-Run Simulator
 *
 * Core Governance Invariants:
 * 1. Rule != Permission (Rules never bypass RBAC).
 * 2. NO ARBITRARY EXECUTABLE JAVASCRIPT OR SQL.
 * 3. Dry-run simulation mode produces zero mutations: "SIMULATION — NO DATA WILL BE CHANGED".
 * 4. Loop protection strictly aborts if execution chain depth exceeds 5.
 * 5. Rule versioning is immutable; edits produce new versions.
 */

import * as fs from "fs";
import * as path from "path";
import { DomainEvent } from "./eventBus";

export type RuleOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "GREATER_THAN"
  | "GREATER_THAN_OR_EQUAL"
  | "LESS_THAN"
  | "LESS_THAN_OR_EQUAL"
  | "IN"
  | "CONTAINS"
  | "EXISTS"
  | "NOT_EXISTS";

export interface RuleCondition {
  field: string;               // e.g. "payload.attendanceRate", "payload.amount"
  operator: RuleOperator;
  value: any;
}

export type RuleActionType =
  | "DISPATCH_NOTIFICATION"
  | "ENQUEUE_JOB"
  | "CREATE_EARLY_WARNING"
  | "REQUEST_HUMAN_APPROVAL"
  | "EMIT_DOMAIN_EVENT"
  | "CREATE_HELPDESK_TICKET";

export interface RuleActionDefinition {
  actionType: RuleActionType;
  target?: string;
  parameters: Record<string, any>;
  isHighRisk?: boolean;
}

export type RuleStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";

export interface BusinessRule {
  ruleId: string;              // e.g. "RULE-ATT-001"
  version: string;             // e.g. "1.0"
  nameBn: string;
  nameEn: string;
  domain: string;
  triggerEvent: string;        // e.g. "ATTENDANCE_SAVED", "ADMISSION_APPROVED"
  conditions: RuleCondition[];
  actions: RuleActionDefinition[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  requiresApproval: boolean;
  status: RuleStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface RuleEvaluationResult {
  ruleId: string;
  matched: boolean;
  matchedConditions: string[];
  failedConditions: string[];
  actionsToExecute: RuleActionDefinition[];
  isSimulation: boolean;
  requiresHumanApproval: boolean;
  explanationBn: string;
}

const GOVERNANCE_DIR = path.join(process.cwd(), "data", "governance");
const RULES_FILE = path.join(GOVERNANCE_DIR, "business_rules.json");

function ensureDirectory() {
  if (!fs.existsSync(GOVERNANCE_DIR)) {
    fs.mkdirSync(GOVERNANCE_DIR, { recursive: true });
  }
}

export const DEFAULT_BUSINESS_RULES: BusinessRule[] = [
  {
    ruleId: "RULE-ADM-001",
    version: "1.0",
    nameBn: "ভর্তি অনুমোদন পরবর্তী স্বয়ংক্রিয় প্রসেসিং",
    nameEn: "Post-Admission Approval Processing",
    domain: "ADMISSION",
    triggerEvent: "ADMISSION_APPROVED",
    conditions: [
      { field: "payload.studentId", operator: "EXISTS", value: null },
      { field: "payload.status", operator: "EQUALS", value: "APPROVED" },
    ],
    actions: [
      {
        actionType: "DISPATCH_NOTIFICATION",
        target: "GUARDIAN",
        parameters: { template: "ADMISSION_APPROVED" },
        isHighRisk: false,
      },
      {
        actionType: "ENQUEUE_JOB",
        target: "CREATE_ADMISSION_INVOICE",
        parameters: { autoGenerate: true },
        isHighRisk: false,
      },
    ],
    riskLevel: "MEDIUM",
    requiresApproval: false,
    status: "ACTIVE",
    createdAt: "2026-09-29T00:00:00.000Z",
    updatedAt: "2026-09-29T00:00:00.000Z",
    createdBy: "SYSTEM_INIT",
  },
  {
    ruleId: "RULE-ATT-001",
    version: "1.0",
    nameBn: "টানা অনুপস্থিতি উপস্থিতি সতর্কতা ও নোটিফিকেশন",
    nameEn: "Consecutive Absence Early Warning",
    domain: "ATTENDANCE",
    triggerEvent: "ATTENDANCE_SAVED",
    conditions: [
      { field: "payload.consecutiveAbsences", operator: "GREATER_THAN_OR_EQUAL", value: 3 },
    ],
    actions: [
      {
        actionType: "CREATE_EARLY_WARNING",
        target: "ATTENDANCE_ENGINE",
        parameters: { ruleCode: "EW-ATT-001", severity: "WARNING" },
        isHighRisk: false,
      },
      {
        actionType: "DISPATCH_NOTIFICATION",
        target: "GUARDIAN",
        parameters: { template: "ATTENDANCE_WARNING", throttleMinutes: 1440 },
        isHighRisk: false,
      },
    ],
    riskLevel: "MEDIUM",
    requiresApproval: false,
    status: "ACTIVE",
    createdAt: "2026-09-29T00:00:00.000Z",
    updatedAt: "2026-09-29T00:00:00.000Z",
    createdBy: "SYSTEM_INIT",
  },
  {
    ruleId: "RULE-FIN-001",
    version: "1.0",
    nameBn: "বকেয়া ফি রিমাইন্ডার ও থ্রোটলড অভিভাবক নোটিশ",
    nameEn: "Overdue Fee Reminder Dispatch",
    domain: "FINANCE",
    triggerEvent: "FEE_OVERDUE",
    conditions: [
      { field: "payload.daysOverdue", operator: "GREATER_THAN", value: 7 },
      { field: "payload.dueAmount", operator: "GREATER_THAN", value: 0 },
    ],
    actions: [
      {
        actionType: "DISPATCH_NOTIFICATION",
        target: "GUARDIAN",
        parameters: { template: "FEE_REMINDER", throttleMinutes: 10080 },
        isHighRisk: false,
      },
    ],
    riskLevel: "LOW",
    requiresApproval: false,
    status: "ACTIVE",
    createdAt: "2026-09-29T00:00:00.000Z",
    updatedAt: "2026-09-29T00:00:00.000Z",
    createdBy: "SYSTEM_INIT",
  },
  {
    ruleId: "RULE-INV-001",
    version: "1.0",
    nameBn: "মজুদ নিম্নসীমা সতর্কতায় অনুমোদন সাপেক্ষ ক্রয় রিকুয়েস্ট",
    nameEn: "Low Stock Purchase Request Gate",
    domain: "INVENTORY",
    triggerEvent: "STOCK_LOW",
    conditions: [
      { field: "payload.currentStock", operator: "LESS_THAN_OR_EQUAL", value: "payload.reorderLevel" },
    ],
    actions: [
      {
        actionType: "REQUEST_HUMAN_APPROVAL",
        target: "PRINCIPAL",
        parameters: { action: "CREATE_PURCHASE_REQUEST", role: "PRINCIPAL" },
        isHighRisk: true,
      },
    ],
    riskLevel: "HIGH",
    requiresApproval: true,
    status: "ACTIVE",
    createdAt: "2026-09-29T00:00:00.000Z",
    updatedAt: "2026-09-29T00:00:00.000Z",
    createdBy: "SYSTEM_INIT",
  },
  {
    ruleId: "RULE-OPS-001",
    version: "1.0",
    nameBn: "সিস্টেম ব্যাকআপ ব্যর্থতায় ক্রিটিক্যাল অপারেশনাল সতর্কতা",
    nameEn: "Backup Failure Critical Incident Trigger",
    domain: "OPERATIONS",
    triggerEvent: "BACKUP_FAILED",
    conditions: [
      { field: "payload.status", operator: "EQUALS", value: "FAILED" },
    ],
    actions: [
      {
        actionType: "CREATE_EARLY_WARNING",
        target: "OPERATIONS",
        parameters: { ruleCode: "EW-OPS-001", severity: "CRITICAL" },
        isHighRisk: false,
      },
      {
        actionType: "DISPATCH_NOTIFICATION",
        target: "ADMIN",
        parameters: { template: "OPERATIONAL_ALERT", severity: "CRITICAL" },
        isHighRisk: false,
      },
    ],
    riskLevel: "CRITICAL",
    requiresApproval: false,
    status: "ACTIVE",
    createdAt: "2026-09-29T00:00:00.000Z",
    updatedAt: "2026-09-29T00:00:00.000Z",
    createdBy: "SYSTEM_INIT",
  },
];

export function loadBusinessRules(): BusinessRule[] {
  ensureDirectory();
  if (!fs.existsSync(RULES_FILE)) {
    saveBusinessRules(DEFAULT_BUSINESS_RULES);
    return DEFAULT_BUSINESS_RULES;
  }
  try {
    const raw = fs.readFileSync(RULES_FILE, "utf-8");
    const rules = JSON.parse(raw);
    if (!Array.isArray(rules) || rules.length === 0) {
      saveBusinessRules(DEFAULT_BUSINESS_RULES);
      return DEFAULT_BUSINESS_RULES;
    }
    return rules;
  } catch (err) {
    console.error("Failed to parse business_rules.json:", err);
    return DEFAULT_BUSINESS_RULES;
  }
}

export function saveBusinessRules(rules: BusinessRule[]): void {
  ensureDirectory();
  fs.writeFileSync(RULES_FILE, JSON.stringify(rules, null, 2), "utf-8");
}

/**
 * Extracts a nested property value using dot-notation safely.
 */
function resolveFieldValue(obj: any, pathStr: string): any {
  if (!obj || typeof obj !== "object") return undefined;
  const parts = pathStr.split(".");
  let curr = obj;
  for (const part of parts) {
    if (curr === undefined || curr === null) return undefined;
    curr = curr[part];
  }
  return curr;
}

/**
 * Evaluates a single declarative condition safely without eval or arbitrary code execution.
 */
export function evaluateCondition(condition: RuleCondition, context: any): boolean {
  const actualValue = resolveFieldValue(context, condition.field);
  let expectedValue = condition.value;

  // If expectedValue references another field in context (e.g. "payload.reorderLevel")
  if (typeof expectedValue === "string" && expectedValue.startsWith("payload.")) {
    expectedValue = resolveFieldValue(context, expectedValue);
  }

  switch (condition.operator) {
    case "EQUALS":
      return actualValue === expectedValue;
    case "NOT_EQUALS":
      return actualValue !== expectedValue;
    case "GREATER_THAN":
      return typeof actualValue === "number" && actualValue > Number(expectedValue);
    case "GREATER_THAN_OR_EQUAL":
      return typeof actualValue === "number" && actualValue >= Number(expectedValue);
    case "LESS_THAN":
      return typeof actualValue === "number" && actualValue < Number(expectedValue);
    case "LESS_THAN_OR_EQUAL":
      return typeof actualValue === "number" && actualValue <= Number(expectedValue);
    case "IN":
      return Array.isArray(expectedValue) && expectedValue.includes(actualValue);
    case "CONTAINS":
      if (typeof actualValue === "string") return actualValue.includes(String(expectedValue));
      if (Array.isArray(actualValue)) return actualValue.includes(expectedValue);
      return false;
    case "EXISTS":
      return actualValue !== undefined && actualValue !== null;
    case "NOT_EXISTS":
      return actualValue === undefined || actualValue === null;
    default:
      return false;
  }
}

/**
 * Evaluates a business rule against a domain event or object context.
 * Can be run in dry-run simulation mode where NO actions are executed.
 */
export function evaluateRule(
  rule: BusinessRule,
  event: DomainEvent | Record<string, any>,
  options?: { isSimulation?: boolean; executionDepth?: number }
): RuleEvaluationResult {
  const depth = options?.executionDepth || 0;
  if (depth > 5) {
    throw new Error(
      `Rule evaluation loop protection triggered for rule ${rule.ruleId}. Execution depth (${depth}) exceeded maximum allowed cascade limit (5).`
    );
  }

  const matchedConditions: string[] = [];
  const failedConditions: string[] = [];

  for (const cond of rule.conditions) {
    const passed = evaluateCondition(cond, event);
    const condStr = `${cond.field} ${cond.operator} ${JSON.stringify(cond.value)}`;
    if (passed) {
      matchedConditions.push(condStr);
    } else {
      failedConditions.push(condStr);
    }
  }

  const matched = failedConditions.length === 0;

  return {
    ruleId: rule.ruleId,
    matched,
    matchedConditions,
    failedConditions,
    actionsToExecute: matched ? rule.actions : [],
    isSimulation: Boolean(options?.isSimulation),
    requiresHumanApproval: rule.requiresApproval,
    explanationBn: matched
      ? `রুল ${rule.ruleId} সফলভাবে ম্যাচ করেছে (${matchedConditions.length}টি শর্ত পূরণ হয়েছে)।`
      : `রুল ${rule.ruleId} ম্যাচ করেনি (${failedConditions.length}টি শর্ত অপূর্ণ)।`,
  };
}

/**
 * Dry-run simulation of a rule or set of rules against sample data.
 * STRICT INVARIANT: "SIMULATION — NO DATA WILL BE CHANGED"
 */
export function runRuleSimulation(
  ruleId: string,
  samplePayload: Record<string, any>
): {
  simulationNotice: string;
  rule: BusinessRule;
  result: RuleEvaluationResult;
} {
  const rules = loadBusinessRules();
  const rule = rules.find((r) => r.ruleId === ruleId);
  if (!rule) {
    throw new Error(`Rule ${ruleId} not found`);
  }

  const result = evaluateRule(rule, { payload: samplePayload }, { isSimulation: true });

  return {
    simulationNotice: "SIMULATION — NO DATA WILL BE CHANGED. No mutations, jobs, or notifications dispatched.",
    rule,
    result,
  };
}

/**
 * Detects contradictory or conflicting rules.
 */
export function detectRuleConflicts(rules: BusinessRule[]): Array<{
  ruleA: string;
  ruleB: string;
  domain: string;
  reasonBn: string;
}> {
  const conflicts: Array<{ ruleA: string; ruleB: string; domain: string; reasonBn: string }> = [];

  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const a = rules[i];
      const b = rules[j];

      if (a.triggerEvent === b.triggerEvent && a.status === "ACTIVE" && b.status === "ACTIVE") {
        // Check for opposing actions or conflicting threshold requirements
        const aHasApproval = a.requiresApproval;
        const bHasApproval = b.requiresApproval;
        if (aHasApproval !== bHasApproval && a.domain === b.domain) {
          conflicts.push({
            ruleA: a.ruleId,
            ruleB: b.ruleId,
            domain: a.domain,
            reasonBn: `একই ট্রিগার (${a.triggerEvent})-এ রুলদ্বয়ের মধ্যে অনুমোদন রিকোয়ারমেন্টের অসামঞ্জস্য রয়েছে।`,
          });
        }
      }
    }
  }

  return conflicts;
}
