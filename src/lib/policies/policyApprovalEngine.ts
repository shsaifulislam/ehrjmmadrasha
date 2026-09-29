/**
 * EHRJ MADRASHA ERP — PHASE 38
 * Institutional Policy Approval & Review Engine
 * 
 * Invariants:
 * 1. NEVER STORE ONLY A BOOLEAN approved=true WITHOUT AUDIT PROOF.
 * 2. REJECTION / REVISION PRESERVES THE SUBMITTED DRAFT & REASONS.
 * 3. PRINCIPAL & ADMIN GOVERNANCE ONLY — NO SUPER ADMIN.
 */

import {
  KnowledgeDocument,
  PolicyApprovalRecord,
  PolicyAuditEntry,
} from "./types";
import {
  getDocumentById,
  saveDocument,
  recordApproval,
  recordAuditLog,
  getAllApprovals,
} from "./policyStore";
import { transitionDocumentStatus } from "./policyLifecycleEngine";

export interface ApprovalActionParams {
  documentIdOrCode: string;
  version?: string;
  decision: "APPROVED" | "REVISION_REQUIRED" | "REJECTED";
  reviewer: {
    id: string;
    name: string;
    role: "ADMIN" | "PRINCIPAL";
  };
  notes: string;
}

export interface ReviewSubmissionParams {
  documentIdOrCode: string;
  version?: string;
  submitter: {
    id: string;
    name: string;
    role: "ADMIN" | "PRINCIPAL" | "TEACHER" | "STAFF";
  };
  notes?: string;
}

/**
 * Submit Draft for Review & Principal Oversight
 */
export function submitDocumentForReview(
  params: ReviewSubmissionParams
): { success: boolean; message: string; document?: KnowledgeDocument } {
  const doc = getDocumentById(params.documentIdOrCode);
  if (!doc) {
    return { success: false, message: `ডকুমেন্ট খুঁজে পাওয়া যায়নি: ${params.documentIdOrCode}` };
  }

  if (doc.status !== "DRAFT") {
    return {
      success: false,
      message: `শুধুমাত্র 'DRAFT' অবস্থায় থাকা নথি পর্যালোচনার জন্য জমা দেওয়া যায়। বর্তমান অবস্থা: ${doc.status}`,
    };
  }

  const res = transitionDocumentStatus(
    doc.id,
    "UNDER_REVIEW",
    params.submitter,
    params.notes || "পর্যালোচনা ও অনুমোদনের জন্য পেশ করা হয়েছে।"
  );

  if (!res.success) {
    return { success: false, message: res.message };
  }

  recordAuditLog({
    documentId: doc.id,
    documentCode: doc.documentCode,
    version: doc.currentVersion,
    action: "SUBMIT_FOR_REVIEW",
    actorId: params.submitter.id,
    actorName: params.submitter.name,
    actorRole: params.submitter.role,
    notes: params.notes || "Submitted for administrative review",
  });

  return {
    success: true,
    message: "ডকুমেন্টটি সফলভাবে পর্যালোচনা ও অনুমোদনের জন্য জমা দেওয়া হয়েছে।",
    document: res.document,
  };
}

/**
 * Perform Approval, Revision Request, or Rejection
 */
export function processApprovalDecision(
  params: ApprovalActionParams
): { success: boolean; message: string; document?: KnowledgeDocument; approvalRecord?: PolicyApprovalRecord } {
  const doc = getDocumentById(params.documentIdOrCode);
  if (!doc) {
    return { success: false, message: `ডকুমেন্ট খুঁজে পাওয়া যায়নি: ${params.documentIdOrCode}` };
  }

  if (doc.status !== "UNDER_REVIEW") {
    return {
      success: false,
      message: `ডকুমেন্টটি 'UNDER_REVIEW' অবস্থায় নেই। বর্তমান অবস্থা: ${doc.status}`,
    };
  }

  const ver = params.version || doc.currentVersion;
  const auditRef = `AUD-DEC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const approvalRecord: PolicyApprovalRecord = {
    id: `APR-${Date.now()}`,
    documentId: doc.id,
    documentCode: doc.documentCode,
    version: ver,
    reviewerId: params.reviewer.id,
    reviewerName: params.reviewer.name,
    reviewerRole: params.reviewer.role,
    decision: params.decision,
    notes: params.notes,
    timestamp: new Date().toISOString(),
    auditRef,
  };

  recordApproval(approvalRecord);

  // Update document version record with approver info
  const verRec = doc.versions.find((v) => v.version === ver);
  if (verRec) {
    verRec.approvedBy = params.reviewer.name;
    verRec.approvedAt = new Date().toISOString();
    verRec.approvalNotes = params.notes;
  }

  let transitionRes;

  if (params.decision === "APPROVED") {
    doc.approvalDate = new Date().toISOString().split("T")[0];
    transitionRes = transitionDocumentStatus(
      doc.id,
      "APPROVED",
      params.reviewer,
      `অনুমোদন সম্পন্ন করেছেন: ${params.reviewer.name} (${params.notes})`
    );

    recordAuditLog({
      documentId: doc.id,
      documentCode: doc.documentCode,
      version: ver,
      action: "APPROVE",
      actorId: params.reviewer.id,
      actorName: params.reviewer.name,
      actorRole: params.reviewer.role,
      notes: `Policy approved: ${params.notes}`,
      details: { decision: "APPROVED", auditRef },
    });
  } else if (params.decision === "REVISION_REQUIRED") {
    transitionRes = transitionDocumentStatus(
      doc.id,
      "DRAFT",
      params.reviewer,
      `সংশোধন প্রয়োজন: ${params.notes}`
    );

    recordAuditLog({
      documentId: doc.id,
      documentCode: doc.documentCode,
      version: ver,
      action: "REQUEST_REVISION",
      actorId: params.reviewer.id,
      actorName: params.reviewer.name,
      actorRole: params.reviewer.role,
      notes: `Revision required: ${params.notes}`,
      details: { decision: "REVISION_REQUIRED", auditRef },
    });
  } else {
    // REJECTED
    transitionRes = transitionDocumentStatus(
      doc.id,
      "WITHDRAWN",
      params.reviewer,
      `প্রস্তাবনা বাতিল করা হয়েছে: ${params.notes}`
    );

    recordAuditLog({
      documentId: doc.id,
      documentCode: doc.documentCode,
      version: ver,
      action: "REJECT",
      actorId: params.reviewer.id,
      actorName: params.reviewer.name,
      actorRole: params.reviewer.role,
      notes: `Draft rejected: ${params.notes}`,
      details: { decision: "REJECTED", auditRef },
    });
  }

  if (!transitionRes.success) {
    return { success: false, message: transitionRes.message };
  }

  return {
    success: true,
    message:
      params.decision === "APPROVED"
        ? "নীতিমালা সফলভাবে অনুমোদিত হয়েছে।"
        : params.decision === "REVISION_REQUIRED"
        ? "সংশোধনের নির্দেশনাসহ ড্রাফট ফেরত পাঠানো হয়েছে।"
        : "নীতিমালা প্রস্তাবনা বাতিল করা হয়েছে।",
    document: transitionRes.document,
    approvalRecord,
  };
}

/**
 * Get all approval records for a specific document
 */
export function getDocumentApprovalHistory(documentIdOrCode: string): PolicyApprovalRecord[] {
  const all = getAllApprovals();
  return all.filter(
    (a) => a.documentId === documentIdOrCode || a.documentCode.toLowerCase() === documentIdOrCode.toLowerCase()
  );
}
