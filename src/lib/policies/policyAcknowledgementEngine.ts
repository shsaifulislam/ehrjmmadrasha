/**
 * EHRJ MADRASHA ERP — PHASE 38
 * Institutional Policy Acknowledgement Engine
 * 
 * Invariants:
 * 1. DO NOT TREAT "OPENED" AS "ACKNOWLEDGED" — EXPLICIT CONSENT REQUIRED.
 * 2. RE-ACKNOWLEDGEMENT TRIGGERED ON MAJOR MATERIAL REVISIONS.
 * 3. TRACK IDENTIFIABLE AUDIT PROOF (USER, ROLE, VERSION, TIMESTAMP).
 */

import {
  KnowledgeDocument,
  PolicyAcknowledgement,
} from "./types";
import {
  getAllDocuments,
  getDocumentById,
  getAllAcknowledgements,
  recordAcknowledgement,
  recordAuditLog,
} from "./policyStore";

export interface RecordAcknowledgementParams {
  documentIdOrCode: string;
  version?: string;
  user: {
    id: string;
    name: string;
    role: "TEACHER" | "GUARDIAN" | "STAFF" | "ADMIN" | "PRINCIPAL";
  };
  deviceMetadata?: {
    userAgent?: string;
    ipAddress?: string;
  };
}

/**
 * Check if a user has explicitly acknowledged a specific document version
 */
export function hasUserAcknowledged(
  userId: string,
  documentIdOrCode: string,
  version?: string
): boolean {
  const doc = getDocumentById(documentIdOrCode);
  if (!doc) return false;

  const targetVer = version || doc.currentVersion;
  const acks = getAllAcknowledgements();

  return acks.some(
    (a) =>
      a.userId === userId &&
      (a.documentId === doc.id || a.documentCode.toLowerCase() === doc.documentCode.toLowerCase()) &&
      a.version === targetVer
  );
}

/**
 * Record an explicit acknowledgement from a user
 */
export function recordUserAcknowledgement(
  params: RecordAcknowledgementParams
): { success: boolean; message: string; acknowledgement?: PolicyAcknowledgement } {
  const doc = getDocumentById(params.documentIdOrCode);
  if (!doc) {
    return { success: false, message: `ডকুমেন্ট খুঁজে পাওয়া যায়নি: ${params.documentIdOrCode}` };
  }

  const ver = params.version || doc.currentVersion;

  if (doc.status !== "EFFECTIVE" && doc.status !== "PUBLISHED") {
    return {
      success: false,
      message: `শুধুমাত্র প্রকাশিত বা কার্যকর নীতিমালার স্বীকৃতি (Acknowledgement) নেওয়া যায়। বর্তমান অবস্থা: ${doc.status}`,
    };
  }

  const ackId = `EHRJ-ACK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const ack: PolicyAcknowledgement = {
    id: ackId,
    documentId: doc.id,
    documentCode: doc.documentCode,
    version: ver,
    userId: params.user.id,
    userName: params.user.name,
    userRole: params.user.role,
    acknowledgedAt: new Date().toISOString(),
    deviceMetadata: params.deviceMetadata,
  };

  recordAcknowledgement(ack);

  recordAuditLog({
    documentId: doc.id,
    documentCode: doc.documentCode,
    version: ver,
    action: "ACKNOWLEDGE",
    actorId: params.user.id,
    actorName: params.user.name,
    actorRole: params.user.role,
    notes: `User acknowledged policy ${doc.documentCode} ${ver}`,
    details: { ackId, device: params.deviceMetadata },
  });

  return {
    success: true,
    message: `আপনি সফলভাবে '${doc.titleBn}' (সংস্করণ: ${ver}) পাঠপূর্বক সম্মতি নিশ্চিত করেছেন।`,
    acknowledgement: ack,
  };
}

/**
 * Get all policies requiring acknowledgement for a specific user role
 */
export function getPendingAcknowledgementsForUser(
  userId: string,
  userRole: "TEACHER" | "GUARDIAN" | "STAFF" | "ADMIN" | "PRINCIPAL"
): {
  pendingDocuments: Array<{
    document: KnowledgeDocument;
    currentVersion: string;
    requiresAction: boolean;
  }>;
  completedDocuments: Array<{
    document: KnowledgeDocument;
    acknowledgedAt: string;
    version: string;
  }>;
} {
  const allDocs = getAllDocuments().filter(
    (d) => (d.status === "EFFECTIVE" || d.status === "PUBLISHED") && d.requiresAcknowledgement
  );
  const acks = getAllAcknowledgements();

  const pending: Array<{ document: KnowledgeDocument; currentVersion: string; requiresAction: boolean }> = [];
  const completed: Array<{ document: KnowledgeDocument; acknowledgedAt: string; version: string }> = [];

  for (const doc of allDocs) {
    // Check role eligibility
    if (doc.mandatoryAckRoles && doc.mandatoryAckRoles.length > 0) {
      if (!doc.mandatoryAckRoles.includes(userRole as any)) {
        continue; // Not mandatory for this role
      }
    }

    const userAck = acks.find(
      (a) => a.userId === userId && a.documentId === doc.id && a.version === doc.currentVersion
    );

    if (userAck) {
      completed.push({
        document: doc,
        acknowledgedAt: userAck.acknowledgedAt,
        version: userAck.version,
      });
    } else {
      pending.push({
        document: doc,
        currentVersion: doc.currentVersion,
        requiresAction: true,
      });
    }
  }

  return { pendingDocuments: pending, completedDocuments: completed };
}

/**
 * Calculate acknowledgement statistics for administrative compliance monitoring
 */
export function getAcknowledgementMetrics(docIdOrCode: string): {
  documentId: string;
  documentCode: string;
  currentVersion: string;
  totalAcknowledged: number;
  acknowledgements: PolicyAcknowledgement[];
  roleBreakdown: Record<string, number>;
} {
  const doc = getDocumentById(docIdOrCode);
  if (!doc) {
    return {
      documentId: docIdOrCode,
      documentCode: docIdOrCode,
      currentVersion: "N/A",
      totalAcknowledged: 0,
      acknowledgements: [],
      roleBreakdown: {},
    };
  }

  const allAcks = getAllAcknowledgements().filter(
    (a) => a.documentId === doc.id && a.version === doc.currentVersion
  );

  const roleBreakdown: Record<string, number> = {};
  for (const ack of allAcks) {
    roleBreakdown[ack.userRole] = (roleBreakdown[ack.userRole] || 0) + 1;
  }

  return {
    documentId: doc.id,
    documentCode: doc.documentCode,
    currentVersion: doc.currentVersion,
    totalAcknowledged: allAcks.length,
    acknowledgements: allAcks,
    roleBreakdown,
  };
}
