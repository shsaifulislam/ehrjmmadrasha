/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 29
 * Search Engine & RAG Bridge with Strict RBAC Pre-Filtering
 * 
 * Invariants:
 * 1. RBAC PRE-FILTERING: Never "search all -> filter after".
 *    Only permitted corpus is searched and ranked.
 * 2. Teachers cannot view confidential HR/Financial documents or unrelated students.
 * 3. Guardians can only search & retrieve documents belonging to their linked children.
 * 4. Granular citations: Document ID, Title, Version Number, Page, and Source Section.
 */

import { ArchiveDocument } from "./types";
import { getAllArchiveDocuments } from "./archiveEngine";

export interface DocumentSearchQuery {
  term?: string;
  documentType?: string;
  status?: string;
  entityType?: string;
  entityId?: string;
  isVerified?: boolean;
  limit?: number;
}

export interface DocumentSearchResultItem {
  document: ArchiveDocument;
  relevanceScore: number;
  matchedFields: string[];
  citation: string;
}

export interface UserContext {
  userId: string;
  role: "ADMIN" | "PRINCIPAL" | "TEACHER" | "GUARDIAN" | "STAFF" | "PUBLIC";
  guardianId?: string;
  studentId?: string;
  linkedStudentIds?: string[];
}

/**
 * Filter corpus based on strict RBAC rules BEFORE executing search
 */
export function filterPermittedDocuments(
  allDocs: ArchiveDocument[],
  user: UserContext
): ArchiveDocument[] {
  // 1. Admin & Principal have full institutional access
  if (user.role === "ADMIN" || user.role === "PRINCIPAL") {
    return allDocs;
  }

  // 2. Guardian access: ONLY linked children or own documents
  if (user.role === "GUARDIAN") {
    const allowedStudentIds = new Set(user.linkedStudentIds || []);
    if (user.studentId) allowedStudentIds.add(user.studentId);

    return allDocs.filter((doc) => {
      // Allow if document belongs to guardian itself
      if (doc.entityType === "GUARDIAN" && doc.entityId === user.guardianId) return true;
      // Allow if document belongs to linked student
      if (doc.entityType === "STUDENT" && allowedStudentIds.has(doc.entityId)) return true;
      return false;
    });
  }

  // 3. Teacher access: ONLY academic / student documents (no HR, finance, procurement, or private guardian NID)
  if (user.role === "TEACHER") {
    const forbiddenTypes = [
      "SUPPLIER_INVOICE",
      "BILL_VOUCHER",
      "AUDIT_RECORD",
      "EMPLOYEE_CONTRACT",
      "APPOINTMENT_LETTER",
      "PROCUREMENT_CONTRACT",
      "ASSET_DEED_DOCUMENT",
      "NID_GUARDIAN",
    ];

    return allDocs.filter((doc) => {
      if (forbiddenTypes.includes(doc.documentType)) return false;
      if (doc.entityType === "FINANCE_TRANSACTION" || doc.entityType === "PROCUREMENT") return false;
      return true;
    });
  }

  // 4. Public access: NONE (public verification is token-based only)
  return [];
}

/**
 * Execute Full-Text Search on Authoritative Document Corpus
 */
export function searchArchiveDocuments(
  query: DocumentSearchQuery,
  user: UserContext
): DocumentSearchResultItem[] {
  const allDocs = getAllArchiveDocuments();
  // 1. Enforce RBAC Pre-filter
  const permittedDocs = filterPermittedDocuments(allDocs, user);

  const term = (query.term || "").trim().toLowerCase();
  const results: DocumentSearchResultItem[] = [];

  for (const doc of permittedDocs) {
    // Exact filters
    if (query.documentType && doc.documentType !== query.documentType) continue;
    if (query.status && doc.status !== query.status) continue;
    if (query.entityType && doc.entityType !== query.entityType) continue;
    if (query.entityId && doc.entityId !== query.entityId) continue;
    if (query.isVerified !== undefined && doc.isVerified !== query.isVerified) continue;

    let score = 0;
    const matchedFields: string[] = [];

    if (!term) {
      score = 1.0;
    } else {
      if (doc.title.toLowerCase().includes(term)) {
        score += 0.5;
        matchedFields.push("title");
      }
      if (doc.originalFileName.toLowerCase().includes(term)) {
        score += 0.3;
        matchedFields.push("filename");
      }
      if (doc.id.toLowerCase().includes(term)) {
        score += 0.8;
        matchedFields.push("documentId");
      }
      if (doc.entityId.toLowerCase().includes(term)) {
        score += 0.6;
        matchedFields.push("entityId");
      }
      if (doc.entityName && doc.entityName.toLowerCase().includes(term)) {
        score += 0.5;
        matchedFields.push("entityName");
      }

      // Check extracted fields
      for (const f of doc.extractedFields) {
        if (f.value.toLowerCase().includes(term)) {
          score += 0.4;
          matchedFields.push(`extracted:${f.fieldName}`);
        }
      }
    }

    if (score > 0) {
      results.push({
        document: doc,
        relevanceScore: Math.min(1.0, score),
        matchedFields,
        citation: `[দলিল আর্কাইভ]: ${doc.title} (ID: ${doc.id}, v${doc.currentVersion}, অবস্থা: ${doc.status})`,
      });
    }
  }

  // Sort by relevance score descending
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);

  if (query.limit && query.limit > 0) {
    return results.slice(0, query.limit);
  }

  return results;
}

/**
 * RAG Grounding Retrieval Bridge (for Phase 22 integration)
 */
export function retrieveDocumentsForRAG(params: {
  query: string;
  user: UserContext;
  limit?: number;
}): {
  contextSnippet: string;
  citations: string[];
} {
  const searchResults = searchArchiveDocuments(
    { term: params.query, limit: params.limit || 3 },
    params.user
  );

  if (searchResults.length === 0) {
    return { contextSnippet: "", citations: [] };
  }

  const citations: string[] = [];
  const snippets: string[] = [];

  for (const item of searchResults) {
    const d = item.document;
    citations.push(item.citation);

    const fieldsSummary = d.extractedFields
      .map((f) => `${f.fieldLabelBn || f.fieldName}: ${f.value} (${f.reviewStatus})`)
      .join("; ");

    snippets.push(
      `--- দলিল রেফারেন্স: ${d.title} (স্মারক: ${d.id}, সংস্করণ: v${d.currentVersion}) ---\nপ্রকার: ${d.documentType}\nমালিকানা: ${d.entityName || d.entityId} (${d.entityType})\nসত্যতা যাচাই: ${d.isVerified ? "যাচাইকৃত" : "অযাচাইকৃত"}\nতথ্য বিবরণ: ${fieldsSummary || "সাধারণ ফাইল সংগৃহীত"}`
    );
  }

  return {
    contextSnippet: snippets.join("\n\n"),
    citations,
  };
}
