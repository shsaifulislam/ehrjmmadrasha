/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 27
 * Human Approval Gateway Engine
 *
 * Core Governance Invariants:
 * 1. Automate the process, NOT the authority.
 * 2. High-risk actions CANNOT execute automatically without explicit human sign-off.
 * 3. Approvals have strict lifecycles: PENDING -> APPROVED | REJECTED | EXPIRED.
 * 4. Approver must independently hold required role authority (ADMIN or PRINCIPAL).
 * 5. Complete immutable audit trail with justification notes.
 */

import * as fs from "fs";
import * as path from "path";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "CANCELLED";

export type HighRiskActionType =
  | "ADMISSION_APPROVAL"
  | "RESULT_PUBLICATION"
  | "RESULT_CORRECTION"
  | "FINANCIAL_ASSISTANCE_APPROVAL"
  | "FEE_WAIVER_APPROVAL"
  | "REFUND_APPROVAL"
  | "PAYROLL_FINALIZATION"
  | "PURCHASE_REQUEST_APPROVAL"
  | "CERTIFICATE_REVOCATION"
  | "ACCOUNT_SUSPENSION"
  | "SECURITY_POLICY_CHANGE"
  | "CREATE_PURCHASE_REQUEST";

export interface ApprovalRequest {
  requestId: string;           // "EHRJ-APR-2026-000001"
  workflowCode: string;        // e.g. "WF-ADM-001", "WF-INV-001"
  actionType: HighRiskActionType;
  entityType: string;          // e.g. "AdmissionApplication", "Student", "InventoryItem"
  entityId: string;
  requiredRole: "ADMIN" | "PRINCIPAL" | "SUPER_ADMIN";
  status: ApprovalStatus;
  titleBn: string;
  reasonBn: string;
  evidence: Record<string, any>;
  requestedBy: string;         // User ID or "SYSTEM_AUTOMATION"
  createdAt: string;
  expiresAt: string;
  decidedBy?: string;
  decidedAt?: string;
  decisionReason?: string;
}

const GOVERNANCE_DIR = path.join(process.cwd(), "data", "governance");
const APPROVALS_FILE = path.join(GOVERNANCE_DIR, "approval_requests.json");

function ensureDirectory() {
  if (!fs.existsSync(GOVERNANCE_DIR)) {
    fs.mkdirSync(GOVERNANCE_DIR, { recursive: true });
  }
}

export function loadApprovalRequests(): ApprovalRequest[] {
  ensureDirectory();
  if (!fs.existsSync(APPROVALS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(APPROVALS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse approval_requests.json:", err);
    return [];
  }
}

function saveApprovalRequests(requests: ApprovalRequest[]): void {
  ensureDirectory();
  fs.writeFileSync(APPROVALS_FILE, JSON.stringify(requests, null, 2), "utf-8");
}

/**
 * Creates an approval request intercepting a high-risk automated workflow step.
 */
export function createApprovalRequest(params: {
  workflowCode: string;
  actionType: HighRiskActionType;
  entityType: string;
  entityId: string;
  requiredRole?: "ADMIN" | "PRINCIPAL" | "SUPER_ADMIN";
  titleBn: string;
  reasonBn: string;
  evidence?: Record<string, any>;
  requestedBy?: string;
  expiryDays?: number;
}): ApprovalRequest {
  ensureDirectory();
  const requests = loadApprovalRequests();

  // Deduplicate: If an active pending request already exists for this entity & action, reuse it
  const existingPending = requests.find(
    (r) =>
      r.entityType === params.entityType &&
      r.entityId === params.entityId &&
      r.actionType === params.actionType &&
      r.status === "PENDING"
  );
  if (existingPending) {
    return existingPending;
  }

  const counter = (requests.length + 1).toString().padStart(6, "0");
  const requestId = `EHRJ-APR-2026-${counter}`;
  const now = new Date();
  const expiryDays = params.expiryDays || 7;
  const expiresAt = new Date(now.getTime() + expiryDays * 86400000).toISOString();

  const req: ApprovalRequest = {
    requestId,
    workflowCode: params.workflowCode,
    actionType: params.actionType,
    entityType: params.entityType,
    entityId: params.entityId,
    requiredRole: params.requiredRole || "ADMIN",
    status: "PENDING",
    titleBn: params.titleBn,
    reasonBn: params.reasonBn,
    evidence: params.evidence || {},
    requestedBy: params.requestedBy || "SYSTEM_AUTOMATION",
    createdAt: now.toISOString(),
    expiresAt,
  };

  requests.unshift(req);
  saveApprovalRequests(requests);
  return req;
}

/**
 * Resolves an approval request with human decision and mandatory validation.
 */
export function resolveApprovalRequest(params: {
  requestId: string;
  decision: "APPROVED" | "REJECTED";
  decidedBy: { userId: string; role: string; name: string };
  decisionReason: string;
}): ApprovalRequest {
  const requests = loadApprovalRequests();
  const req = requests.find((r) => r.requestId === params.requestId);
  if (!req) {
    throw new Error(`Approval request ${params.requestId} not found`);
  }

  if (req.status !== "PENDING") {
    throw new Error(`Cannot resolve request ${params.requestId}. Current status is already ${req.status}`);
  }

  // Check expiration
  if (new Date() > new Date(req.expiresAt)) {
    req.status = "EXPIRED";
    saveApprovalRequests(requests);
    throw new Error(`Approval request ${params.requestId} has expired on ${req.expiresAt}`);
  }

  // Verify Role Authority
  const approverRole = params.decidedBy.role.toUpperCase();
  if (
    req.requiredRole === "SUPER_ADMIN" && approverRole !== "SUPER_ADMIN" ||
    req.requiredRole === "PRINCIPAL" && (approverRole !== "PRINCIPAL" && approverRole !== "SUPER_ADMIN") ||
    req.requiredRole === "ADMIN" && (approverRole !== "ADMIN" && approverRole !== "PRINCIPAL" && approverRole !== "SUPER_ADMIN")
  ) {
    throw new Error(
      `Permission Denied: Requester with role '${approverRole}' cannot approve request requiring '${req.requiredRole}' authorization.`
    );
  }

  req.status = params.decision;
  req.decidedBy = `${params.decidedBy.name} (${params.decidedBy.role})`;
  req.decidedAt = new Date().toISOString();
  req.decisionReason = params.decisionReason;

  saveApprovalRequests(requests);
  return req;
}

/**
 * Sweeps for expired approval requests and marks them EXPIRED.
 */
export function sweepExpiredApprovals(): number {
  const requests = loadApprovalRequests();
  const now = new Date();
  let expiredCount = 0;

  for (const req of requests) {
    if (req.status === "PENDING" && now > new Date(req.expiresAt)) {
      req.status = "EXPIRED";
      expiredCount++;
    }
  }

  if (expiredCount > 0) {
    saveApprovalRequests(requests);
  }
  return expiredCount;
}

/**
 * Returns summary counts of approval requests.
 */
export function getApprovalMetrics(): {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
} {
  const requests = loadApprovalRequests();
  return {
    total: requests.length,
    pending: requests.filter((r) => r.status === "PENDING").length,
    approved: requests.filter((r) => r.status === "APPROVED").length,
    rejected: requests.filter((r) => r.status === "REJECTED").length,
    expired: requests.filter((r) => r.status === "EXPIRED").length,
  };
}
