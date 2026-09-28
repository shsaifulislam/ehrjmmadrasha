/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 29
 * Digital Archive & Lifecycle Management Engine
 * 
 * Invariants:
 * 1. Cryptographic SHA-256 hash generated for every stored file & version.
 * 2. Immutable version history: previous versions are never overwritten or deleted destructively.
 * 3. Exact and potential duplicate detection.
 * 4. Legal Hold & Retention enforcement (held/retained documents cannot be disposed).
 * 5. Tamper detection: verify stored content matches recorded cryptographic hash.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  ArchiveDocument,
  DocumentVersion,
  DocumentLifecycleStatus,
  DuplicateDetectionResult,
  IntegrityCheckResult,
  LegalHoldRecord,
  RetentionPolicy,
} from "./types";
import { logDocumentAccess } from "./accessLogger";

const ARCHIVE_FILE = path.join(process.cwd(), "data", "documents", "archive.json");
const VERSIONS_FILE = path.join(process.cwd(), "data", "documents", "versions.json");
const HOLDS_FILE = path.join(process.cwd(), "data", "documents", "holds.json");
const STORAGE_DIR = path.join(process.cwd(), "data", "documents", "storage");

function ensureStorageDirectories() {
  const dirs = [path.dirname(ARCHIVE_FILE), STORAGE_DIR];
  for (const d of dirs) {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
    }
  }
}

// Compute SHA-256 hash of a buffer or string
export function computeSHA256(content: Buffer | string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function readArchive(): ArchiveDocument[] {
  ensureStorageDirectories();
  if (!fs.existsSync(ARCHIVE_FILE)) {
    fs.writeFileSync(ARCHIVE_FILE, JSON.stringify([], null, 2), "utf8");
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(ARCHIVE_FILE, "utf8")) as ArchiveDocument[];
  } catch {
    return [];
  }
}

function writeArchive(docs: ArchiveDocument[]) {
  ensureStorageDirectories();
  fs.writeFileSync(ARCHIVE_FILE, JSON.stringify(docs, null, 2), "utf8");
}

function readVersions(): DocumentVersion[] {
  ensureStorageDirectories();
  if (!fs.existsSync(VERSIONS_FILE)) {
    fs.writeFileSync(VERSIONS_FILE, JSON.stringify([], null, 2), "utf8");
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(VERSIONS_FILE, "utf8")) as DocumentVersion[];
  } catch {
    return [];
  }
}

function writeVersions(versions: DocumentVersion[]) {
  ensureStorageDirectories();
  fs.writeFileSync(VERSIONS_FILE, JSON.stringify(versions, null, 2), "utf8");
}

function readHolds(): LegalHoldRecord[] {
  ensureStorageDirectories();
  if (!fs.existsSync(HOLDS_FILE)) {
    fs.writeFileSync(HOLDS_FILE, JSON.stringify([], null, 2), "utf8");
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(HOLDS_FILE, "utf8")) as LegalHoldRecord[];
  } catch {
    return [];
  }
}

function writeHolds(holds: LegalHoldRecord[]) {
  ensureStorageDirectories();
  fs.writeFileSync(HOLDS_FILE, JSON.stringify(holds, null, 2), "utf8");
}

/**
 * Ingest a new document into the Digital Archive with cryptographic hash & duplicate checks
 */
export async function ingestDocument(params: {
  documentType: ArchiveDocument["documentType"];
  title: string;
  description?: string;
  entityType: ArchiveDocument["entityType"];
  entityId: string;
  entityName?: string;
  fileBuffer: Buffer;
  originalFileName: string;
  mimeType: string;
  user: {
    userId: string;
    name: string;
    role: string;
  };
  retentionYears?: number;
  certificateId?: string;
  requestId?: string;
  financeId?: string;
}): Promise<{ document: ArchiveDocument; duplicates: DuplicateDetectionResult }> {
  ensureStorageDirectories();
  const fileHash = computeSHA256(params.fileBuffer);

  // 1. Duplicate Detection
  const duplicates = detectDuplicates({
    fileHash,
    entityId: params.entityId,
    documentType: params.documentType,
    title: params.title,
  });

  const docId = `DOC-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const safeFilename = `${docId}_v1_${path.basename(params.originalFileName).replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const relativeStoragePath = path.join("data", "documents", "storage", safeFilename);
  const absoluteStoragePath = path.join(process.cwd(), relativeStoragePath);

  // Write file securely to disk
  fs.writeFileSync(absoluteStoragePath, params.fileBuffer);

  const retentionYears = params.retentionYears || 5;
  const retentionDate = new Date();
  retentionDate.setFullYear(retentionDate.getFullYear() + retentionYears);

  const versionRecord: DocumentVersion = {
    versionNumber: 1,
    fileHash,
    algorithm: "SHA-256",
    filePath: relativeStoragePath,
    fileSize: params.fileBuffer.length,
    mimeType: params.mimeType,
    originalFileName: params.originalFileName,
    reason: "Initial Upload & Digital Archive Ingestion",
    uploadedBy: params.user,
    createdAt: new Date().toISOString(),
    isCurrent: true,
  };

  const archiveDoc: ArchiveDocument = {
    id: docId,
    documentType: params.documentType,
    title: params.title,
    description: params.description || "",
    entityType: params.entityType,
    entityId: params.entityId,
    entityName: params.entityName,
    status: "UPLOADED",
    currentVersion: 1,
    fileHash,
    hashAlgorithm: "SHA-256",
    originalFileName: params.originalFileName,
    mimeType: params.mimeType,
    sizeBytes: params.fileBuffer.length,
    filePath: relativeStoragePath,
    isEncrypted: false,
    hasOcrText: false,
    isOcrReviewed: false,
    extractedFields: [],
    qualityWarnings: [],
    isVerified: false,
    signatures: [],
    retentionPolicy: {
      retentionYears,
      retentionUntil: retentionDate.toISOString(),
      isLegalHoldActive: false,
      disposalEligible: false,
    },
    isArchived: false,
    relatedDocumentIds: [],
    certificateId: params.certificateId,
    requestId: params.requestId,
    financeId: params.financeId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    uploadedBy: params.user,
  };

  // Persist
  const allDocs = readArchive();
  allDocs.unshift(archiveDoc);
  writeArchive(allDocs);

  const allVersions = readVersions();
  allVersions.unshift(versionRecord);
  writeVersions(allVersions);

  await logDocumentAccess({
    documentId: docId,
    versionNumber: 1,
    user: params.user,
    action: "UPLOAD",
    purpose: "Document Ingestion & Archive Creation",
  });

  return { document: archiveDoc, duplicates };
}

/**
 * Add a new version to an existing document (non-destructive)
 */
export async function addDocumentVersion(params: {
  documentId: string;
  fileBuffer: Buffer;
  originalFileName: string;
  mimeType: string;
  reason: string;
  user: {
    userId: string;
    name: string;
    role: string;
  };
}): Promise<ArchiveDocument> {
  const docs = readArchive();
  const doc = docs.find((d) => d.id === params.documentId);
  if (!doc) throw new Error("Document not found in digital archive");

  const newVersionNumber = doc.currentVersion + 1;
  const newHash = computeSHA256(params.fileBuffer);

  const safeFilename = `${doc.id}_v${newVersionNumber}_${path.basename(params.originalFileName).replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const relativeStoragePath = path.join("data", "documents", "storage", safeFilename);
  const absoluteStoragePath = path.join(process.cwd(), relativeStoragePath);

  fs.writeFileSync(absoluteStoragePath, params.fileBuffer);

  // Update versions list
  const allVersions = readVersions();
  // Mark previous versions of this doc as not current
  for (const v of allVersions) {
    if (v.filePath.includes(doc.id)) {
      v.isCurrent = false;
    }
  }

  const newVersion: DocumentVersion = {
    versionNumber: newVersionNumber,
    fileHash: newHash,
    algorithm: "SHA-256",
    filePath: relativeStoragePath,
    fileSize: params.fileBuffer.length,
    mimeType: params.mimeType,
    originalFileName: params.originalFileName,
    reason: params.reason,
    uploadedBy: params.user,
    createdAt: new Date().toISOString(),
    isCurrent: true,
  };

  allVersions.unshift(newVersion);
  writeVersions(allVersions);

  // Update archive record
  doc.currentVersion = newVersionNumber;
  doc.fileHash = newHash;
  doc.originalFileName = params.originalFileName;
  doc.mimeType = params.mimeType;
  doc.sizeBytes = params.fileBuffer.length;
  doc.filePath = relativeStoragePath;
  doc.updatedAt = new Date().toISOString();
  // Reset OCR review status for new version
  doc.hasOcrText = false;
  doc.isOcrReviewed = false;
  doc.extractedFields = [];
  doc.status = "UPLOADED";

  writeArchive(docs);

  await logDocumentAccess({
    documentId: doc.id,
    versionNumber: newVersionNumber,
    user: params.user,
    action: "REPLACE_VERSION",
    purpose: `New version created: ${params.reason}`,
  });

  return doc;
}

/**
 * Detect exact duplicate (by cryptographic hash) or possible duplicates (same entity & type)
 */
export function detectDuplicates(params: {
  fileHash: string;
  entityId: string;
  documentType: string;
  title: string;
}): DuplicateDetectionResult {
  const docs = readArchive();
  let exactMatchDocId: string | undefined;
  const possibleDuplicates: DuplicateDetectionResult["possibleDuplicates"] = [];

  for (const d of docs) {
    // Check exact hash
    if (d.fileHash === params.fileHash) {
      exactMatchDocId = d.id;
    }
    // Check logical similarity
    if (d.entityId === params.entityId && d.documentType === params.documentType) {
      possibleDuplicates.push({
        documentId: d.id,
        title: d.title,
        matchReason: `Same entity (${d.entityId}) and same document type (${d.documentType})`,
        confidenceScore: 0.9,
      });
    } else if (d.title.trim().toLowerCase() === params.title.trim().toLowerCase() && d.entityId === params.entityId) {
      possibleDuplicates.push({
        documentId: d.id,
        title: d.title,
        matchReason: `Exact title match for the same entity`,
        confidenceScore: 0.85,
      });
    }
  }

  return {
    isExactDuplicate: !!exactMatchDocId,
    exactMatchDocId,
    possibleDuplicates,
  };
}

/**
 * Check Cryptographic Integrity of a Stored Document against tampering
 */
export function checkDocumentIntegrity(documentId: string): IntegrityCheckResult {
  const docs = readArchive();
  const doc = docs.find((d) => d.id === documentId);
  const now = new Date().toISOString();

  if (!doc) {
    return {
      documentId,
      storedHash: "",
      calculatedHash: "",
      isValid: false,
      status: "FILE_MISSING",
      checkedAt: now,
      details: "Document not found in archive registry.",
    };
  }

  const absolutePath = path.join(process.cwd(), doc.filePath);
  if (!fs.existsSync(absolutePath)) {
    return {
      documentId,
      storedHash: doc.fileHash,
      calculatedHash: "",
      isValid: false,
      status: "FILE_MISSING",
      checkedAt: now,
      details: `File physical path does not exist on disk: ${doc.filePath}`,
    };
  }

  const fileBuffer = fs.readFileSync(absolutePath);
  const calculatedHash = computeSHA256(fileBuffer);

  const isValid = calculatedHash === doc.fileHash;

  return {
    documentId,
    storedHash: doc.fileHash,
    calculatedHash,
    isValid,
    status: isValid ? "VALID" : "INTEGRITY_FAILURE",
    checkedAt: now,
    details: isValid
      ? "Cryptographic SHA-256 hash verified. Document matches original record."
      : "TAMPER DETECTED: File content on storage does not match recorded SHA-256 checksum!",
  };
}

/**
 * Apply or Release Legal Hold on an archived document
 */
export async function setLegalHold(params: {
  documentId: string;
  action: "APPLY" | "RELEASE";
  reason: string;
  caseReference?: string;
  user: {
    userId: string;
    name: string;
    role: string;
  };
}): Promise<ArchiveDocument> {
  const docs = readArchive();
  const doc = docs.find((d) => d.id === params.documentId);
  if (!doc) throw new Error("Document not found");

  const holds = readHolds();

  if (params.action === "APPLY") {
    doc.retentionPolicy.isLegalHoldActive = true;
    doc.retentionPolicy.disposalEligible = false;

    const holdRecord: LegalHoldRecord = {
      id: `HOLD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      documentId: doc.id,
      reason: params.reason,
      caseReference: params.caseReference,
      placedBy: params.user,
      placedAt: new Date().toISOString(),
      isActive: true,
    };
    holds.unshift(holdRecord);

    await logDocumentAccess({
      documentId: doc.id,
      user: params.user,
      action: "LEGAL_HOLD_APPLY",
      purpose: `Legal Hold applied: ${params.reason}`,
    });
  } else {
    doc.retentionPolicy.isLegalHoldActive = false;
    // Release existing active hold
    for (const h of holds) {
      if (h.documentId === doc.id && h.isActive) {
        h.isActive = false;
        h.releasedBy = params.user;
        h.releasedAt = new Date().toISOString();
        h.releaseReason = params.reason;
      }
    }

    await logDocumentAccess({
      documentId: doc.id,
      user: params.user,
      action: "LEGAL_HOLD_RELEASE",
      purpose: `Legal Hold released: ${params.reason}`,
    });
  }

  writeArchive(docs);
  writeHolds(holds);
  return doc;
}

/**
 * Transition document lifecycle status (strictly governed)
 */
export async function updateDocumentStatus(
  documentId: string,
  newStatus: DocumentLifecycleStatus,
  user: { userId: string; name: string; role: string },
  reason?: string
): Promise<ArchiveDocument> {
  const docs = readArchive();
  const doc = docs.find((d) => d.id === documentId);
  if (!doc) throw new Error("Document not found");

  // Disposal protection
  if ((newStatus === "DELETED" || newStatus === "EXPIRED") && doc.retentionPolicy.isLegalHoldActive) {
    throw new Error("CANNOT_DISPOSE: Document is protected by an active Legal Hold.");
  }

  const previousStatus = doc.status;
  doc.status = newStatus;
  doc.updatedAt = new Date().toISOString();

  if (newStatus === "ARCHIVED") {
    doc.isArchived = true;
    doc.archivedAt = new Date().toISOString();
    doc.archivedBy = user.name;
  }

  writeArchive(docs);

  await logDocumentAccess({
    documentId: doc.id,
    user,
    action: newStatus === "ARCHIVED" ? "ARCHIVE" : newStatus === "REVOKED" ? "REVOKE" : "VIEW",
    purpose: `Lifecycle status transitioned: ${previousStatus} -> ${newStatus} (${reason || "Standard Admin Flow"})`,
  });

  return doc;
}

export function getArchiveDocumentById(id: string): ArchiveDocument | null {
  const docs = readArchive();
  return docs.find((d) => d.id === id) || null;
}

export function getAllArchiveDocuments(): ArchiveDocument[] {
  return readArchive();
}

export function getDocumentVersions(documentId: string): DocumentVersion[] {
  const all = readVersions();
  return all.filter((v) => v.filePath.includes(documentId));
}

export function getDocumentHolds(documentId: string): LegalHoldRecord[] {
  const all = readHolds();
  return all.filter((h) => h.documentId === documentId);
}
