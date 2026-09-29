/**
 * EHRJ MADRASHA ERP — PHASE 38
 * Phase 22 RAG & Phase 33 Calendar Synchronization Bridge
 * 
 * Invariants:
 * 1. PHASE 38 OWNS DOCUMENT AUTHORITY & LIFECYCLE. PHASE 22 OWNS RETRIEVAL & RAG.
 * 2. SYNC ONLY APPROVED / EFFECTIVE POLICIES TO PHASE 22 RAG INDEX.
 * 3. NO SECOND RAG ENGINE.
 * 4. STRICTLY NO SMS — CALENDAR & IN-APP PORTAL ALERTS ONLY.
 */

import fs from "fs";
import path from "path";
import { getAllDocuments } from "./policyStore";

const KNOWLEDGE_DIR = path.join(process.cwd(), "data", "knowledge");
const P22_DOCS_FILE = path.join(KNOWLEDGE_DIR, "documents.json");

export function syncPoliciesToPhase22RAG(): {
  syncedCount: number;
  skippedDraftsCount: number;
  totalPolicies: number;
  message: string;
} {
  const allPhase38Docs = getAllDocuments();

  // Filter ONLY APPROVED, PUBLISHED, or EFFECTIVE documents
  const authoritativeDocs = allPhase38Docs.filter(
    (d) => d.status === "EFFECTIVE" || d.status === "PUBLISHED" || d.status === "APPROVED"
  );

  const skippedDraftsCount = allPhase38Docs.length - authoritativeDocs.length;

  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
  }

  // Load existing Phase 22 documents if any
  let existingP22Docs: any[] = [];
  if (fs.existsSync(P22_DOCS_FILE)) {
    try {
      existingP22Docs = JSON.parse(fs.readFileSync(P22_DOCS_FILE, "utf8"));
    } catch (e) {
      existingP22Docs = [];
    }
  }

  // Map Phase 38 docs to Phase 22 compatible format
  let synced = 0;
  for (const doc of authoritativeDocs) {
    const p22CategoryMap: Record<string, string> = {
      ACADEMIC_POLICY: "ACADEMIC",
      ADMISSION_POLICY: "ADMISSION",
      FINANCE_POLICY: "FINANCE",
      HR_POLICY: "HR",
      LIBRARY_POLICY: "LIBRARY",
      RESIDENTIAL_POLICY: "RESIDENTIAL",
      TRANSPORT_POLICY: "TRANSPORT",
      SECURITY_POLICY: "GENERAL",
      SOP: "GENERAL",
      HANDBOOK: "GENERAL",
    };

    const mappedCat = p22CategoryMap[doc.category] || "GENERAL";
    const mappedType = doc.documentType === "SOP" ? "SOP" : doc.documentType === "HANDBOOK" ? "MANUAL" : "POLICY";

    const p22Doc = {
      id: doc.id,
      documentCode: doc.documentCode,
      titleBn: doc.titleBn,
      titleEn: doc.titleEn,
      category: mappedCat,
      documentType: mappedType,
      version: doc.currentVersion,
      status: doc.status,
      effectiveDate: doc.effectiveFrom,
      author: doc.createdBy || "EHRJ Admin",
      approver: doc.approvalDate ? "মাওলানা আব্দুল করিম (প্রিন্সিপাল)" : undefined,
      securityClassification: doc.confidentiality,
      roleScope: doc.confidentiality === "PUBLIC" ? "ALL" : "ADMIN",
      language: "bn",
      contentText: doc.contentText,
      contentMarkdown: doc.contentMarkdown,
      tags: doc.tags,
      checksum: doc.checksum,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };

    const idx = existingP22Docs.findIndex((e) => e.id === doc.id || e.documentCode === doc.documentCode);
    if (idx >= 0) {
      existingP22Docs[idx] = p22Doc;
    } else {
      existingP22Docs.push(p22Doc);
    }
    synced++;
  }

  const tempPath = `${P22_DOCS_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tempPath, JSON.stringify(existingP22Docs, null, 2), "utf8");
  fs.renameSync(tempPath, P22_DOCS_FILE);

  return {
    syncedCount: synced,
    skippedDraftsCount,
    totalPolicies: allPhase38Docs.length,
    message: `সফলভাবে ${synced}টি অনুমোদিত ও কার্যকর নীতিমালা ফেজ ২২ RAG ইঞ্জিনে সিঙ্ক করা হয়েছে (${skippedDraftsCount}টি খসড়া/স্থলাভিষিক্ত বাদ রাখা হয়েছে)।`,
  };
}
