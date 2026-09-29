/**
 * EHRJ MADRASHA ERP — PHASE 38
 * Institutional Policy Lifecycle, Versioning & Historical Effective-Date Engine
 * 
 * Invariants:
 * 1. ONE AUTHORITATIVE POLICY, ONE CONTROLLED VERSION.
 * 2. IMMUTABLE PUBLISHED & EFFECTIVE VERSIONS (Never silently edit historical policies).
 * 3. NO ARBITRARY STATE SKIPPING.
 * 4. LEGAL HOLD GUARDS: Documents under legal hold cannot be deleted, withdrawn or archived.
 */

import crypto from "crypto";
import {
  KnowledgeDocument,
  DocumentStatus,
  PolicyVersionRecord,
  PolicyAuditEntry,
} from "./types";
import {
  getAllDocuments,
  getDocumentById,
  saveDocument,
  recordAuditLog,
} from "./policyStore";

function calculateChecksum(content: string): string {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

/**
 * Valid Status Transitions Matrix
 */
const VALID_TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
  DRAFT: ["UNDER_REVIEW", "WITHDRAWN"],
  UNDER_REVIEW: ["APPROVED", "DRAFT", "WITHDRAWN"], // DRAFT for revision required
  APPROVED: ["PUBLISHED", "DRAFT", "WITHDRAWN"],
  PUBLISHED: ["EFFECTIVE", "SUPERSEDED", "ARCHIVED", "WITHDRAWN"],
  EFFECTIVE: ["SUPERSEDED", "EXPIRED", "ARCHIVED", "WITHDRAWN"],
  SUPERSEDED: ["ARCHIVED"],
  EXPIRED: ["ARCHIVED", "SUPERSEDED"],
  ARCHIVED: [], // Terminal, or requires explicit restore by Principal
  WITHDRAWN: ["ARCHIVED"],
};

export interface StateTransitionResult {
  success: boolean;
  message: string;
  document?: KnowledgeDocument;
  previousStatus?: DocumentStatus;
  newStatus?: DocumentStatus;
}

/**
 * Transition document status strictly abiding by governance rules
 */
export function transitionDocumentStatus(
  docIdOrCode: string,
  targetStatus: DocumentStatus,
  actor: { id: string; name: string; role: "ADMIN" | "PRINCIPAL" | "TEACHER" | "STAFF" },
  notes?: string
): StateTransitionResult {
  const doc = getDocumentById(docIdOrCode);
  if (!doc) {
    return { success: false, message: `ডকুমেন্ট খুঁজে পাওয়া যায়নি: ${docIdOrCode}` };
  }

  // Legal Hold Guard
  if (
    doc.isLegalHoldActive &&
    (targetStatus === "ARCHIVED" || targetStatus === "WITHDRAWN" || targetStatus === "SUPERSEDED")
  ) {
    return {
      success: false,
      message: `আইনি বা প্রাতিষ্ঠানিক নির্দেশিকা (Legal Hold) বহাল থাকায় এই ডকুমেন্টের স্ট্যাটাস পরিবর্তন করা নিষিদ্ধ। কারণ: ${doc.legalHoldReason || "কর্তৃপক্ষের স্থগিতাদেশ"}`,
    };
  }

  const currentStatus = doc.status;
  const allowed = VALID_TRANSITIONS[currentStatus] || [];

  if (!allowed.includes(targetStatus)) {
    return {
      success: false,
      message: `অবৈধ স্ট্যাটাস ট্রানজিশন: ${currentStatus} থেকে ${targetStatus}-এ সরাসরি পরিবর্তন করা সম্ভব নয়।`,
    };
  }

  // Authorization check for high-risk transitions
  if ((targetStatus === "APPROVED" || targetStatus === "PUBLISHED") && actor.role !== "ADMIN" && actor.role !== "PRINCIPAL") {
    return {
      success: false,
      message: "শুধুমাত্র মাদরাসা প্রিন্সিপাল অথবা অনুমোদিত এডমিন এই নথি অনুমোদন বা প্রকাশ করতে পারেন।",
    };
  }

  const previousStatus = doc.status;
  doc.status = targetStatus;
  doc.updatedBy = actor.name;
  doc.updatedAt = new Date().toISOString();

  // If marking effective, set publication and effective dates if missing
  const today = new Date().toISOString().split("T")[0];
  if (targetStatus === "PUBLISHED" && !doc.publicationDate) {
    doc.publicationDate = today;
  }
  if (targetStatus === "EFFECTIVE") {
    if (!doc.effectiveFrom) doc.effectiveFrom = today;
  }

  // Synchronize current version status
  const currentVerRecord = doc.versions.find((v) => v.version === doc.currentVersion);
  if (currentVerRecord) {
    currentVerRecord.status = targetStatus;
  }

  saveDocument(doc);

  recordAuditLog({
    documentId: doc.id,
    documentCode: doc.documentCode,
    version: doc.currentVersion,
    action: targetStatus === "EFFECTIVE" ? "MARK_EFFECTIVE" : "UPDATE_DRAFT",
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    notes: notes || `Status changed from ${previousStatus} to ${targetStatus}`,
    details: { previousStatus, targetStatus },
  });

  return {
    success: true,
    message: `স্ট্যাটাস সফলভাবে '${targetStatus}' এ হালনাগাদ করা হয়েছে।`,
    document: doc,
    previousStatus,
    newStatus: targetStatus,
  };
}

/**
 * Increment Version String: e.g. "v1.2" -> minor: "v1.3", major: "v2.0"
 */
export function calculateNextVersion(currentVer: string, isMajor: boolean): string {
  const clean = currentVer.replace(/^v/i, "");
  const parts = clean.split(".").map(Number);
  const major = isNaN(parts[0]) ? 1 : parts[0];
  const minor = isNaN(parts[1]) ? 0 : parts[1];

  if (isMajor) {
    return `v${major + 1}.0`;
  } else {
    return `v${major}.${minor + 1}`;
  }
}

/**
 * Create a new controlled version (Revision / Major overhaul)
 * Invariant: Preserves the historical approved version immutably.
 */
export function createNewDocumentVersion(
  docIdOrCode: string,
  params: {
    isMajor: boolean;
    versionNotes: string;
    newContentText?: string;
    newContentMarkdown?: string;
    actor: { id: string; name: string; role: "ADMIN" | "PRINCIPAL" | "TEACHER" | "STAFF" };
  }
): { success: boolean; message: string; document?: KnowledgeDocument; newVersion?: string } {
  const doc = getDocumentById(docIdOrCode);
  if (!doc) {
    return { success: false, message: `ডকুমেন্ট খুঁজে পাওয়া যায়নি: ${docIdOrCode}` };
  }

  if (doc.isLegalHoldActive) {
    return {
      success: false,
      message: "লিগ্যাল হোল্ড কার্যকর থাকা অবস্থায় নতুন সংস্করণ খসড়া তৈরি করা নিষিদ্ধ।",
    };
  }

  const nextVer = calculateNextVersion(doc.currentVersion, params.isMajor);

  // If current version is approved/effective, snapshot it if not already in versions array
  const existingSnapshot = doc.versions.find((v) => v.version === doc.currentVersion);
  if (!existingSnapshot) {
    doc.versions.push({
      version: doc.currentVersion,
      versionNotes: "পূর্ববর্তী কার্যকর সংস্করণ।",
      isMajor: false,
      status: doc.status,
      contentText: doc.contentText,
      contentMarkdown: doc.contentMarkdown,
      sopSteps: doc.sopSteps,
      handbookSections: doc.handbookSections,
      checksum: doc.checksum || calculateChecksum(doc.contentText),
      createdBy: doc.createdBy,
      createdAt: doc.createdAt,
      effectiveFrom: doc.effectiveFrom,
      effectiveUntil: doc.effectiveUntil,
    });
  }

  const contentText = params.newContentText ?? doc.contentText;
  const contentMarkdown = params.newContentMarkdown ?? doc.contentMarkdown;
  const checksum = calculateChecksum(contentText);
  const today = new Date().toISOString().split("T")[0];

  const newVersionRecord: PolicyVersionRecord = {
    version: nextVer,
    versionNotes: params.versionNotes,
    isMajor: params.isMajor,
    status: "DRAFT",
    contentText,
    contentMarkdown,
    sopSteps: doc.sopSteps ? JSON.parse(JSON.stringify(doc.sopSteps)) : undefined,
    handbookSections: doc.handbookSections ? JSON.parse(JSON.stringify(doc.handbookSections)) : undefined,
    checksum,
    createdBy: params.actor.name,
    createdAt: new Date().toISOString(),
    effectiveFrom: today,
  };

  doc.currentVersion = nextVer;
  doc.status = "DRAFT";
  doc.contentText = contentText;
  doc.contentMarkdown = contentMarkdown;
  doc.checksum = checksum;
  doc.versions.push(newVersionRecord);
  doc.updatedBy = params.actor.name;
  doc.updatedAt = new Date().toISOString();

  saveDocument(doc);

  recordAuditLog({
    documentId: doc.id,
    documentCode: doc.documentCode,
    version: nextVer,
    action: "CREATE_NEW_VERSION",
    actorId: params.actor.id,
    actorName: params.actor.name,
    actorRole: params.actor.role,
    notes: `New version ${nextVer} created (${params.isMajor ? "Major" : "Minor"}). Reason: ${params.versionNotes}`,
    details: { newVersion: nextVer, isMajor: params.isMajor },
  });

  return {
    success: true,
    message: `নতুন সংস্করণ ${nextVer} ড্রাফট সফলভাবে তৈরি করা হয়েছে।`,
    document: doc,
    newVersion: nextVer,
  };
}

/**
 * Historical Effective-Date Engine:
 * Resolves which policy version was authoritative on a given date.
 */
export function getEffectivePolicyOnDate(
  docIdOrCode: string,
  targetDateStr: string
): {
  success: boolean;
  document?: KnowledgeDocument;
  resolvedVersion?: PolicyVersionRecord;
  isHistorical: boolean;
  message: string;
} {
  const doc = getDocumentById(docIdOrCode);
  if (!doc) {
    return { success: false, isHistorical: false, message: `ডকুমেন্ট খুঁজে পাওয়া যায়নি: ${docIdOrCode}` };
  }

  const allVersions = [...doc.versions];
  // Sort versions descending
  allVersions.sort((a, b) => (b.effectiveFrom || "").localeCompare(a.effectiveFrom || ""));

  for (const ver of allVersions) {
    const from = ver.effectiveFrom;
    const until = ver.effectiveUntil;

    if (from && from <= targetDateStr) {
      if (!until || until >= targetDateStr) {
        const isCurrent = ver.version === doc.currentVersion && doc.status === "EFFECTIVE";
        return {
          success: true,
          document: doc,
          resolvedVersion: ver,
          isHistorical: !isCurrent,
          message: `${targetDateStr} তারিখে কার্যকর সংস্করণ ছিল: ${ver.version} (${ver.status})`,
        };
      }
    }
  }

  return {
    success: false,
    document: doc,
    isHistorical: true,
    message: `${targetDateStr} তারিখে অত্র ডকুমেন্টের কোনো অনুমোদিত/কার্যকর সংস্করণ পাওয়া যায়নি।`,
  };
}

/**
 * Legal / Institutional Hold Management
 */
export function toggleLegalHold(
  docIdOrCode: string,
  params: {
    isHoldActive: boolean;
    reason?: string;
    authority?: string;
    actor: { id: string; name: string; role: "ADMIN" | "PRINCIPAL" };
  }
): { success: boolean; message: string; document?: KnowledgeDocument } {
  const doc = getDocumentById(docIdOrCode);
  if (!doc) {
    return { success: false, message: `ডকুমেন্ট পাওয়া যায়নি: ${docIdOrCode}` };
  }

  doc.isLegalHoldActive = params.isHoldActive;
  doc.legalHoldReason = params.isHoldActive ? params.reason || "কর্তৃপক্ষের নির্দেশে স্থগিত" : undefined;
  doc.legalHoldAuthority = params.isHoldActive ? params.authority || params.actor.name : undefined;
  doc.legalHoldStartDate = params.isHoldActive ? new Date().toISOString() : undefined;
  doc.updatedBy = params.actor.name;
  doc.updatedAt = new Date().toISOString();

  saveDocument(doc);

  recordAuditLog({
    documentId: doc.id,
    documentCode: doc.documentCode,
    version: doc.currentVersion,
    action: "TOGGLE_LEGAL_HOLD",
    actorId: params.actor.id,
    actorName: params.actor.name,
    actorRole: params.actor.role,
    notes: `Legal Hold ${params.isHoldActive ? "ACTIVATED" : "RELEASED"}. Reason: ${params.reason || "N/A"}`,
    details: { isHoldActive: params.isHoldActive, reason: params.reason },
  });

  return {
    success: true,
    message: `লিগ্যাল হোল্ড সফলভাবে ${params.isHoldActive ? "সক্রিয়" : "উত্তোলন"} করা হয়েছে।`,
    document: doc,
  };
}

/**
 * Version Diff Helper: Compares two versions of a document
 */
export function compareDocumentVersions(
  docIdOrCode: string,
  verAStr: string,
  verBStr: string
): {
  success: boolean;
  versionA?: PolicyVersionRecord;
  versionB?: PolicyVersionRecord;
  changesSummary: {
    linesAdded: number;
    linesRemoved: number;
    metadataChanged: boolean;
    sopStepsChanged: boolean;
    handbookSectionsChanged: boolean;
  };
  message: string;
} {
  const doc = getDocumentById(docIdOrCode);
  if (!doc) {
    return {
      success: false,
      changesSummary: { linesAdded: 0, linesRemoved: 0, metadataChanged: false, sopStepsChanged: false, handbookSectionsChanged: false },
      message: `ডকুমেন্ট খুঁজে পাওয়া যায়নি: ${docIdOrCode}`,
    };
  }

  const verA = doc.versions.find((v) => v.version === verAStr);
  const verB = doc.versions.find((v) => v.version === verBStr);

  if (!verA || !verB) {
    return {
      success: false,
      changesSummary: { linesAdded: 0, linesRemoved: 0, metadataChanged: false, sopStepsChanged: false, handbookSectionsChanged: false },
      message: `সংস্করণদ্বয় পাওয়া যায়নি (${verAStr}, ${verBStr})`,
    };
  }

  const linesA = (verA.contentText || "").split("\n");
  const linesB = (verB.contentText || "").split("\n");

  const setA = new Set(linesA);
  const setB = new Set(linesB);

  let added = 0;
  let removed = 0;

  for (const line of linesB) {
    if (!setA.has(line)) added++;
  }
  for (const line of linesA) {
    if (!setB.has(line)) removed++;
  }

  const metadataChanged = verA.effectiveFrom !== verB.effectiveFrom || verA.status !== verB.status;
  const sopStepsChanged = JSON.stringify(verA.sopSteps || []) !== JSON.stringify(verB.sopSteps || []);
  const handbookSectionsChanged = JSON.stringify(verA.handbookSections || []) !== JSON.stringify(verB.handbookSections || []);

  return {
    success: true,
    versionA: verA,
    versionB: verB,
    changesSummary: {
      linesAdded: added,
      linesRemoved: removed,
      metadataChanged,
      sopStepsChanged,
      handbookSectionsChanged,
    },
    message: `সংস্করণ ${verAStr} এবং ${verBStr} এর পার্থক্য সফলভাবে নিরূপণ করা হয়েছে।`,
  };
}
