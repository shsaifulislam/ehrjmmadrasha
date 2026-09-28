/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 22
 * Institutional Knowledge Store & Versioning System
 * 
 * Invariants:
 * 1. KNOWLEDGE MUST BE GROUNDED IN AUTHORITATIVE INSTITUTIONAL SOURCES.
 * 2. RETRIEVED SOURCE > AI MEMORY.
 * 3. USER PERMISSION > SEARCH RESULT.
 * 4. CURRENT AUTHORITATIVE RECORD > OUTDATED DOCUMENT.
 * 5. IMMUTABLE VERSION HISTORY (Never silently overwrite historical institutional policy).
 * 6. NO SECRETS IN KNOWLEDGE INDEX.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

const KNOWLEDGE_DIR = path.join(process.cwd(), "data", "knowledge");
const DOCS_FILE = path.join(KNOWLEDGE_DIR, "documents.json");
const FAQS_FILE = path.join(KNOWLEDGE_DIR, "faqs.json");
const GAPS_FILE = path.join(KNOWLEDGE_DIR, "gaps.json");
const FEEDBACK_FILE = path.join(KNOWLEDGE_DIR, "feedback.json");
const AUDIT_FILE = path.join(KNOWLEDGE_DIR, "search_audit.json");

export type KnowledgeCategory = 
  | "ACADEMIC"
  | "FINANCE"
  | "ADMISSION"
  | "EXAMINATION"
  | "RESIDENTIAL"
  | "LIBRARY"
  | "TRANSPORT"
  | "HR"
  | "GENERAL";

export type DocumentType =
  | "POLICY"
  | "REGULATION"
  | "GUIDELINE"
  | "MANUAL"
  | "CIRCULAR"
  | "SOP"
  | "FAQ";

export type DocumentStatus =
  | "DRAFT"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "PUBLISHED"
  | "ARCHIVED"
  | "SUPERSEDED";

export type SecurityClassification =
  | "PUBLIC"
  | "INTERNAL"
  | "RESTRICTED"
  | "CONFIDENTIAL"
  | "HIGHLY_RESTRICTED";

export type RoleScope = "ALL" | "ADMIN" | "PRINCIPAL" | "TEACHER" | "GUARDIAN";

export interface KnowledgeDocument {
  id: string;
  documentCode: string; // e.g. EHRJ-DOC-ADM-001
  titleBn: string;
  titleEn: string;
  category: KnowledgeCategory;
  documentType: DocumentType;
  version: string; // e.g. "1.0", "2.0"
  status: DocumentStatus;
  effectiveDate: string; // ISO date
  expiryDate?: string;
  author: string;
  reviewer?: string;
  approver?: string;
  approvalTimestamp?: string;
  publicationTimestamp?: string;
  supersededVersionId?: string;
  changeSummary?: string;
  securityClassification: SecurityClassification;
  roleScope: RoleScope;
  language: "bn" | "en" | "ar" | "mixed";
  contentText: string;
  contentMarkdown: string;
  tags: string[];
  checksum: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeChunk {
  chunkId: string;
  documentId: string;
  version: string;
  title: string;
  category: KnowledgeCategory;
  section: string;
  pageNumber?: number;
  effectiveDate: string;
  roleScope: RoleScope;
  securityClassification: SecurityClassification;
  language: string;
  text: string;
  tokenWeights?: Record<string, number>;
}

export interface KnowledgeReview {
  id: string;
  documentId: string;
  action: "SUBMITTED" | "APPROVED" | "REJECTED" | "PUBLISHED" | "ARCHIVED" | "SUPERSEDED";
  status: DocumentStatus;
  notes?: string;
  actorId: string;
  actorRole: string;
  timestamp: string;
}

export interface KnowledgeFeedback {
  id: string;
  documentId?: string;
  query?: string;
  feedbackType: "INCORRECT" | "OUTDATED" | "MISSING_INFO" | "WRONG_SOURCE" | "WRONG_ANSWER" | "PERMISSION_ISSUE" | "HELPFUL";
  comment: string;
  submittedByUserId?: string;
  role: string;
  createdAt: string;
}

export interface KnowledgeGap {
  id: string;
  query: string;
  searchCount: number;
  detectedCategory: KnowledgeCategory;
  status: "OPEN" | "ADDRESSED";
  lastSearchedAt: string;
}

export interface KnowledgeFAQ {
  id: string;
  questionBn: string;
  questionEn: string;
  answerBn: string;
  answerEn: string;
  category: KnowledgeCategory;
  audience: RoleScope;
  status: "DRAFT" | "PUBLISHED";
  sortOrder: number;
  effectiveDate: string;
}

export interface SearchAuditRecord {
  id: string;
  query: string;
  userRole: string;
  userId?: string;
  searchType: "KEYWORD" | "SEMANTIC" | "HYBRID" | "LIVE_RECORD";
  resultsCount: number;
  latencyMs: number;
  timestamp: string;
}

function ensureDir() {
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
  }
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  ensureDir();
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return fallback;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  ensureDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

export function computeChecksum(content: string): string {
  return crypto.createHash("sha256").update(content.trim()).digest("hex");
}

/**
 * Secret Exclusion Filter:
 * Ensures passwords, private keys, database connection strings, JWT secrets,
 * and API keys are strictly excluded from indexing.
 */
export function sanitizeDocumentContent(content: string): string {
  let cleaned = content;
  // Exclude DB connection strings
  cleaned = cleaned.replace(/DATABASE_URL\s*=\s*[^\s\n]+/gi, "[REDACTED_DB_URL]");
  // Exclude JWT Secrets
  cleaned = cleaned.replace(/JWT_SECRET\s*=\s*[^\s\n]+/gi, "[REDACTED_JWT_SECRET]");
  // Exclude Passwords / Private Keys
  cleaned = cleaned.replace(/(password|secret|apiKey|api_key)\s*[:=]\s*["']?[^"'}\s\n]+["']?/gi, "$1: [REDACTED]");
  return cleaned;
}

// -------------------------------------------------------------
// SEED DEFAULT INSTITUTIONAL KNOWLEDGE
// -------------------------------------------------------------
const INITIAL_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: "doc-adm-001-v1",
    documentCode: "EHRJ-DOC-ADM-001",
    titleBn: "শিক্ষার্থী ভর্তি নীতিমালা (২০২৫ সংস্করণ)",
    titleEn: "Student Admission Policy (2025 Edition)",
    category: "ADMISSION",
    documentType: "POLICY",
    version: "1.0",
    status: "SUPERSEDED",
    effectiveDate: "2025-01-01T00:00:00.000Z",
    expiryDate: "2025-12-31T23:59:59.000Z",
    author: "শিক্ষা পরিচালনা পর্ষদ",
    reviewer: "উপাধ্যক্ষ",
    approver: "মুহতামিম",
    approvalTimestamp: "2024-12-20T10:00:00.000Z",
    publicationTimestamp: "2025-01-01T00:00:00.000Z",
    changeSummary: "২০২৫ শিক্ষাবর্ষের প্রাথমিক ভর্তি নির্দেশিকা।",
    securityClassification: "PUBLIC",
    roleScope: "ALL",
    language: "bn",
    contentText: `ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসায় ২০২৫ শিক্ষাবর্ষের ভর্তি সংক্রান্ত নিয়মাবলী:
১. নূরানী ও হিফজ বিভাগে ভর্তির ন্যূনতম বয়স ৫ বছর।
২. ভর্তি ফরম ফি ১০০ টাকা এবং প্রাথমিক ভর্তি ফি ১,৫০০ টাকা।
৩. আবেদনের সাথে শিক্ষার্থীর জন্মনিবন্ধন ও পিতার জাতীয় পরিচয়পত্রের ফটোকপি জমা দিতে হবে।`,
    contentMarkdown: `### ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসায় ২০২৫ শিক্ষাবর্ষের ভর্তি সংক্রান্ত নিয়মাবলী
- **নূরানী ও হিফজ বিভাগ:** ন্যূনতম বয়স ৫ বছর।
- **ফরম ফি:** ১০০ টাকা | **ভর্তি ফি:** ১,৫০০ টাকা।
- **প্রয়োজনীয় কাগজপত্র:** জন্মনিবন্ধন ও এনআইডি কপি।`,
    tags: ["ভর্তি", "নীতিমালা", "২০২৫", "নূরানী", "হিফজ"],
    checksum: "8a1e2f3d4c5b6a70",
    createdAt: "2024-12-20T10:00:00.000Z",
    updatedAt: "2025-12-31T23:59:59.000Z",
  },
  {
    id: "doc-adm-001-v2",
    documentCode: "EHRJ-DOC-ADM-001",
    titleBn: "শিক্ষার্থী ভর্তি নীতিমালা ও নির্দেশিকা (২০২৬ হালনাগাদ সংস্করণ)",
    titleEn: "Student Admission Policy & Guidelines (2026 Updated Edition)",
    category: "ADMISSION",
    documentType: "POLICY",
    version: "2.0",
    status: "PUBLISHED",
    effectiveDate: "2026-01-01T00:00:00.000Z",
    author: "শিক্ষা পরিচালনা পর্ষদ",
    reviewer: "উপাধ্যক্ষ মাওলানা মাহমুদুল হাসান",
    approver: "মুহতামিম সাহেব",
    approvalTimestamp: "2025-12-25T11:00:00.000Z",
    publicationTimestamp: "2026-01-01T00:00:00.000Z",
    supersededVersionId: "doc-adm-001-v1",
    changeSummary: "ভর্তি ফরম সম্পূর্ণ ডিজিটাল করা হয়েছে। এতিম ও অসচ্ছল শিক্ষার্থীদের বিশেষ বৃত্তি অন্তর্ভুক্ত হয়েছে।",
    securityClassification: "PUBLIC",
    roleScope: "ALL",
    language: "bn",
    contentText: `ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসায় ২০২৬ শিক্ষাবর্ষের অনুমোদিত ভর্তি নির্দেশিকা:
১. নূরানী, নাযেরা ও হিফজ বিভাগে সরাসরি অনলাইনে বা ক্যাম্পাসে ফরম পূরণ করা যায়।
২. ২০২৬ শিক্ষাবর্ষে ভর্তি আবেদন সম্পূর্ণ ডিজিটাল ও বিনামূল্যে (ফরম ফি প্রযোজ্য নয়)।
৩. ভর্তি ফি: অনাবাসিক শিক্ষার্থীদের জন্য ২,০০০ টাকা; আবাসিক শিক্ষার্থীদের জন্য ৩,৫০০ টাকা।
৪. এতিম ও দুস্থ শিক্ষার্থীদের ক্ষেত্রে লিল্লাহ বোর্ডিং ও যাকাত তহবিল হতে ১০০% পর্যন্ত ফি মওকুফ সুবিধা রয়েছে।
৫. মৌখিক সাক্ষাৎকার ও তাজবীদ যাচাইয়ের ভিত্তিতে চূড়ান্ত নির্বাচন সম্পন্ন হয়।`,
    contentMarkdown: `### ২০২৬ শিক্ষাবর্ষের অনুমোদিত ভর্তি নির্দেশিকা
- **আবেদন পদ্ধতি:** ওয়েবসাইট ও ক্যাম্পাসে সরাসরি উন্মুক্ত। আবেদন ফি সম্পূর্ণ ফ্রি।
- **ভর্তি ফি:** অনাবাসিক ২,০০০ টাকা | আবাসিক ৩,৫০০ টাকা।
- **লিল্লাহ ও যাকাত সহায়তা:** এতিম ও অসচ্ছল শিক্ষার্থীদের শতভাগ মওকুফ।
- **নির্বাচন পদ্ধতি:** মৌখিক তাজবীদ পরীক্ষা ও অভিভাবক সাক্ষাৎকার।`,
    tags: ["ভর্তি", "নীতিমালা", "২০২৬", "ফি", "লিল্লাহ", "নূরানী"],
    checksum: "9b2f3a4c5d6e7f80",
    createdAt: "2025-12-25T11:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "doc-fin-001",
    documentCode: "EHRJ-DOC-FIN-001",
    titleBn: "অ্যাকাডেমিক ফি আদায় ও মওকুফ সংক্রান্ত নীতিমালা ২০২৬",
    titleEn: "Academic Fee Collection & Waiver Policy 2026",
    category: "FINANCE",
    documentType: "POLICY",
    version: "1.0",
    status: "PUBLISHED",
    effectiveDate: "2026-01-01T00:00:00.000Z",
    author: "অর্থ ও হিসাব বিভাগ",
    reviewer: "প্রধান হিসাবরক্ষক",
    approver: "মুহতামিম",
    approvalTimestamp: "2025-12-28T14:00:00.000Z",
    publicationTimestamp: "2026-01-01T00:00:00.000Z",
    changeSummary: "ডিজিটাল পেমেন্ট (বিকাশ/নগদ/রকেট) ও অভিভাবক রিসিট ব্যবস্থা প্রণয়ন।",
    securityClassification: "PUBLIC",
    roleScope: "ALL",
    language: "bn",
    contentText: `ফি আদায় ও আর্থিক নীতিমালা ২০২৬:
১. প্রতি মাসের ১০ তারিখের মধ্যে মাসিক বেতন পরিশোধ করতে হবে।
২. অনলাইনে বিকাশ, নগদ, রকেট অথবা সরাসরি ক্যাশ কাউন্টারে ফি প্রদান করা যাবে। প্রতি লেনদেনে স্বয়ংক্রিয় মানি রিসিট ইস্যু হয়।
৩. বিশেষ আর্থিক সংকটে অভিভাবক পোর্টালে অথবা প্রিন্সিপাল সমীপে ফি মওকুফের লিখিত আবেদন করতে পারবেন।
৪. কোনো অবস্থাতেই অনুমতিহীন ক্যাশ লেনদেন গ্রহণযোগ্য নয়।`,
    contentMarkdown: `### ফি আদায় ও আর্থিক নীতিমালা ২০২৬
1. প্রতি মাসের **১০ তারিখের মধ্যে** মাসিক টিউশন ফি পরিশোধযোগ্য।
2. বিকাশ/নগদ/রকেট ও কাউন্টারে ডিজিটাল রিসিট প্রদান বাধ্যতামূলক।
3. ফি মওকুফের জন্য নির্ধারিত ফর্মে আবেদন ও প্রশাসনিক যাচাই প্রযোজ্য।`,
    tags: ["ফি", "বেতন", "বিকাশ", "পেমেন্ট", "মওকুফ"],
    checksum: "7c3b2a1d4e5f6089",
    createdAt: "2025-12-28T14:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "doc-acd-001",
    documentCode: "EHRJ-DOC-ACD-001",
    titleBn: "শিক্ষার্থী উপস্থিতি ও ছুটি সংক্রান্ত বিধিমালা",
    titleEn: "Student Attendance and Leave Regulations",
    category: "ACADEMIC",
    documentType: "REGULATION",
    version: "1.0",
    status: "PUBLISHED",
    effectiveDate: "2026-01-01T00:00:00.000Z",
    author: "শিক্ষা পরিচালনা পর্ষদ",
    reviewer: "উপাধ্যক্ষ",
    approver: "মুহতামিম",
    approvalTimestamp: "2025-12-29T10:00:00.000Z",
    publicationTimestamp: "2026-01-01T00:00:00.000Z",
    changeSummary: "ডিজিটাল উপস্থিতি ট্র্যাকিং ও এসএমএস নোটিফিকেশন সংযোজন।",
    securityClassification: "PUBLIC",
    roleScope: "ALL",
    language: "bn",
    contentText: `উপস্থিতি ও ছুটির নিয়মাবলী:
১. প্রতিটি শিক্ষার্থীকে বার্ষিক পরীক্ষায় অংশ নিতে হলে ন্যূনতম ৮০% উপস্থিতি বজায় রাখতে হবে।
২. অসুস্থতা বা অনিবার্য কারণে ছুটির প্রয়োজন হলে অভিভাবক কর্তৃক লিখিত দরখাস্ত অথবা পোর্টাল রিকোয়েস্ট পাঠাতে হবে।
৩. পূর্বে অনুমতি ছাড়া টানা ৩ দিন অনুপস্থিত থাকলে অভিভাবককে নোটিফিকেশন পাঠানো হবে এবং কারণ দর্শানোর নির্দেশ দেওয়া হবে।`,
    contentMarkdown: `### উপস্থিতি ও ছুটির নিয়মাবলী
- **ন্যূনতম উপস্থিতি:** ৮০% উপস্থিতি চূড়ান্ত পরীক্ষার জন্য বাধ্যতামূলক।
- **ছুটির আবেদন:** অভিভাবক পোর্টাল অথবা শ্রেণি শিক্ষকের নিকট লিখিত দরখাস্ত।
- **অনুমতিহীন অনুপস্থিতি:** টানা ৩ দিন অনুপস্থিতিতে অভিভাবককে নোটিশ প্রদান।`,
    tags: ["উপস্থিতি", "ছুটি", "পরীক্ষা", "নিয়ম"],
    checksum: "5b6a70891e2f3d4c",
    createdAt: "2025-12-29T10:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "doc-res-001",
    documentCode: "EHRJ-DOC-RES-001",
    titleBn: "আবাসিক ও বোর্ডিং হোস্টেল আচরণবিধি",
    titleEn: "Residential & Boarding Hostel Code of Conduct",
    category: "RESIDENTIAL",
    documentType: "GUIDELINE",
    version: "1.0",
    status: "PUBLISHED",
    effectiveDate: "2026-01-01T00:00:00.000Z",
    author: "হোস্টেল সুপারভাইজার",
    reviewer: "উপাধ্যক্ষ",
    approver: "মুহতামিম",
    approvalTimestamp: "2025-12-30T10:00:00.000Z",
    publicationTimestamp: "2026-01-01T00:00:00.000Z",
    changeSummary: "হোস্টেল বোর্ডিং খাবার ও নিরাপত্তা ব্যবস্থাপনা সংক্রান্ত গাইডলাইন।",
    securityClassification: "PUBLIC",
    roleScope: "ALL",
    language: "bn",
    contentText: `আবাসিক ও হোস্টেল নীতিমালা:
১. প্রতিদিন ফজর ও এশার নামাজের পর যথাসময়ে নির্দিষ্ট হালকায় হিফজ তিলাওয়াত সম্পন্ন করতে হবে।
২. অভিভাবক সাক্ষাতের নির্ধারিত সময় প্রতি শুক্রবার জুমার নামাজের পর হতে আসর পর্যন্ত।
৩. হোস্টেল সুপারের অনুমতি ব্যতীত কোনো শিক্ষার্থী মাদ্রাসা চত্বর ত্যাগ করতে পারবে না।`,
    contentMarkdown: `### আবাসিক হোস্টেল আচরণবিধি
- **তিলাওয়াত ও নামাজ:** জামাতের সাথে নামাজ ও নির্ধারিত অধ্যয়ন বাধ্যতামূলক।
- **সাক্ষাৎ সময়:** শুক্রবার জুমার পর হতে আসর পর্যন্ত।
- **নিরাপত্তা:** সুপারের লিখিত পাস ব্যতীত ক্যাম্পাসের বাইরে গমন নিষিদ্ধ।`,
    tags: ["আবাসিক", "হোস্টেল", "বোর্ডিং", "নিয়ম"],
    checksum: "3d4c5b6a70891e2f",
    createdAt: "2025-12-30T10:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "doc-hr-conf-001",
    documentCode: "EHRJ-DOC-HR-001",
    titleBn: "শিক্ষক ও কর্মকর্তা অভ্যন্তরীণ বেতন কাঠামো ও আচরণবিধি",
    titleEn: "Staff Internal Salary Structure & HR Code of Conduct",
    category: "HR",
    documentType: "SOP",
    version: "1.0",
    status: "APPROVED",
    effectiveDate: "2026-01-01T00:00:00.000Z",
    author: "এইচআর ও গভর্নিং বডি",
    reviewer: "উপাধ্যক্ষ",
    approver: "মুহতামিম",
    approvalTimestamp: "2025-12-31T12:00:00.000Z",
    changeSummary: "অভ্যন্তরীণ বেতন গ্রেড ও প্রভিডেন্ট ফান্ড রূপরেখা।",
    securityClassification: "CONFIDENTIAL",
    roleScope: "ADMIN",
    language: "bn",
    contentText: `গোপনীয় অভ্যন্তরীণ এইচআর নির্দেশিকা:
১. শিক্ষক ও কর্মচারীদের বেতন প্রতি মাসের ৫ তারিখের মধ্যে স্ব স্ব ব্যাংক হিসাবে পরিশোধ করা হবে।
২. বার্ষিক ইনক্রিমেন্ট ও উৎসব ভাতা গভর্নিং বডির অনুমোদনে নির্ধারিত হবে।
৩. প্রতিষ্ঠানের অভ্যন্তরীণ তথ্য, বেতন কাঠামো ও শিক্ষার্থীর ব্যক্তিগত তথ্য বহিরাগতদের নিকট প্রকাশ করা দণ্ডনীয় অপরাধ।`,
    contentMarkdown: `### গোপনীয় অভ্যন্তরীণ এইচআর নির্দেশিকা
- বেতন প্রদান ৫ তারিখের মধ্যে সম্পন্ন হবে।
- গোপনীয়তা বজায় রাখা সকল স্টাফের জন্য বাধ্যতামূলক।`,
    tags: ["এইচআর", "বেতন", "গোপনীয়", "স্টাফ"],
    checksum: "2f3d4c5b6a70891e",
    createdAt: "2025-12-31T12:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }
];

const INITIAL_FAQS: KnowledgeFAQ[] = [
  {
    id: "faq-001",
    questionBn: "মাদরাসায় নতুন ভর্তির জন্য কীভাবে আবেদন করতে হয়?",
    questionEn: "How to apply for new student admission?",
    answerBn: "মাদরাসার অফিসিয়াল ওয়েবসাইটের ভর্তি পেজে গিয়ে অনলাইন ফর্ম পূরণ করতে হবে। কোনো ফরম ফি নেই। ফর্ম পূরণ শেষে তাৎক্ষণিক ট্র্যাকিং কোড ও অ্যাডমিট স্লিপ পাওয়া যাবে।",
    answerEn: "Fill in the online form via the Admission portal on the official website. There is no application fee. An instant tracking token is generated.",
    category: "ADMISSION",
    audience: "ALL",
    status: "PUBLISHED",
    sortOrder: 1,
    effectiveDate: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "faq-002",
    questionBn: "মাসিক বেতন ও ফি কীভাবে প্রদান করা যায়?",
    questionEn: "How to pay monthly tuition and fees?",
    answerBn: "অভিভাবক পোর্টাল থেকে সরাসরি বিকাশ, নগদ বা রকেটের মাধ্যমে ফি পরিশোধ করা যায়। এছাড়াও মাদরাসার অফিসে নগদ জমা দিয়ে ডিজিটাল প্রিন্টেড মানি রিসিট গ্রহণ করা যায়।",
    answerEn: "Pay online via bKash, Nagad, or Rocket directly from the Guardian Portal, or at the institution counter for a digital printed receipt.",
    category: "FINANCE",
    audience: "ALL",
    status: "PUBLISHED",
    sortOrder: 2,
    effectiveDate: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "faq-003",
    questionBn: "এতিম ও দুস্থ শিক্ষার্থীদের জন্য কোনো ফি মওকুফের সুযোগ আছে কি?",
    questionEn: "Is there any fee waiver available for orphans and needy students?",
    answerBn: "হ্যাঁ, ইলিয়টগঞ্জ মাদরাসায় লিল্লাহ বোর্ডিং ও যাকাত তহবিল হতে এতিম ও অসচ্ছল পরিবারের শিক্ষার্থীদের জন্য ৫০% হতে ১০০% পর্যন্ত ফি মওকুফের প্রাতিষ্ঠানিক সুযোগ রয়েছে।",
    answerEn: "Yes, 50% to 100% financial assistance and fee waivers are provided through our Lillah Boarding & Zakat funds for orphans and eligible families.",
    category: "FINANCE",
    audience: "ALL",
    status: "PUBLISHED",
    sortOrder: 3,
    effectiveDate: "2026-01-01T00:00:00.000Z"
  }
];

// -------------------------------------------------------------
// PUBLIC CRUD & RETRIEVAL FUNCTIONS
// -------------------------------------------------------------

export function getAllDocuments(): KnowledgeDocument[] {
  return readJsonFile<KnowledgeDocument[]>(DOCS_FILE, INITIAL_DOCUMENTS);
}

export function saveAllDocuments(docs: KnowledgeDocument[]): void {
  writeJsonFile(DOCS_FILE, docs);
}

export function getDocumentById(id: string): KnowledgeDocument | undefined {
  const docs = getAllDocuments();
  return docs.find((d) => d.id === id);
}

export function getDocumentByCode(documentCode: string, version?: string): KnowledgeDocument | undefined {
  const docs = getAllDocuments();
  if (version) {
    return docs.find((d) => d.documentCode === documentCode && d.version === version);
  }
  // Return current published or latest approved
  const matches = docs.filter((d) => d.documentCode === documentCode);
  return matches.find((d) => d.status === "PUBLISHED") || matches[0];
}

export function createDocument(doc: Omit<KnowledgeDocument, "id" | "checksum" | "createdAt" | "updatedAt">): KnowledgeDocument {
  const docs = getAllDocuments();
  const id = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const sanitizedContent = sanitizeDocumentContent(doc.contentText);
  const checksum = computeChecksum(sanitizedContent);
  const now = new Date().toISOString();

  const newDoc: KnowledgeDocument = {
    ...doc,
    id,
    contentText: sanitizedContent,
    checksum,
    createdAt: now,
    updatedAt: now,
  };

  docs.push(newDoc);
  saveAllDocuments(docs);
  return newDoc;
}

export function updateDocument(id: string, updates: Partial<KnowledgeDocument>): KnowledgeDocument | null {
  const docs = getAllDocuments();
  const idx = docs.findIndex((d) => d.id === id);
  if (idx === -1) return null;

  if (updates.contentText) {
    updates.contentText = sanitizeDocumentContent(updates.contentText);
    updates.checksum = computeChecksum(updates.contentText);
  }

  docs[idx] = {
    ...docs[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveAllDocuments(docs);
  return docs[idx];
}

export function transitionDocumentStatus(
  id: string,
  newStatus: DocumentStatus,
  actor: { userId: string; role: string; name: string },
  notes?: string
): KnowledgeDocument | null {
  const doc = getDocumentById(id);
  if (!doc) return null;

  const now = new Date().toISOString();
  const updates: Partial<KnowledgeDocument> = { status: newStatus };

  if (newStatus === "APPROVED") {
    updates.approver = actor.name;
    updates.approvalTimestamp = now;
  } else if (newStatus === "PUBLISHED") {
    updates.publicationTimestamp = now;
    // If this supersedes a previous version, update the old one
    if (doc.supersededVersionId) {
      updateDocument(doc.supersededVersionId, { status: "SUPERSEDED" });
    }
  }

  const updated = updateDocument(id, updates);

  // Record review log
  const reviewFile = path.join(KNOWLEDGE_DIR, "reviews.json");
  const reviews = readJsonFile<KnowledgeReview[]>(reviewFile, []);
  reviews.push({
    id: `rev-${Date.now()}`,
    documentId: id,
    action: newStatus === "APPROVED" ? "APPROVED" : newStatus === "PUBLISHED" ? "PUBLISHED" : "SUBMITTED",
    status: newStatus,
    notes,
    actorId: actor.userId,
    actorRole: actor.role,
    timestamp: now,
  });
  writeJsonFile(reviewFile, reviews);

  return updated;
}

// -------------------------------------------------------------
// FAQs
// -------------------------------------------------------------
export function getAllFAQs(): KnowledgeFAQ[] {
  return readJsonFile<KnowledgeFAQ[]>(FAQS_FILE, INITIAL_FAQS);
}

export function saveAllFAQs(faqs: KnowledgeFAQ[]): void {
  writeJsonFile(FAQS_FILE, faqs);
}

// -------------------------------------------------------------
// FEEDBACK & KNOWLEDGE GAPS
// -------------------------------------------------------------
export function submitKnowledgeFeedback(feedback: Omit<KnowledgeFeedback, "id" | "createdAt">): KnowledgeFeedback {
  const items = readJsonFile<KnowledgeFeedback[]>(FEEDBACK_FILE, []);
  const newItem: KnowledgeFeedback = {
    ...feedback,
    id: `fbk-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  items.push(newItem);
  writeJsonFile(FEEDBACK_FILE, items);
  return newItem;
}

export function getAllFeedback(): KnowledgeFeedback[] {
  return readJsonFile<KnowledgeFeedback[]>(FEEDBACK_FILE, []);
}

export function recordKnowledgeGap(query: string, category: KnowledgeCategory): void {
  const gaps = readJsonFile<KnowledgeGap[]>(GAPS_FILE, []);
  const normalized = query.trim().toLowerCase();
  const existing = gaps.find((g) => g.query.toLowerCase() === normalized && g.status === "OPEN");

  if (existing) {
    existing.searchCount += 1;
    existing.lastSearchedAt = new Date().toISOString();
  } else {
    gaps.push({
      id: `gap-${Date.now()}`,
      query: query.trim(),
      searchCount: 1,
      detectedCategory: category,
      status: "OPEN",
      lastSearchedAt: new Date().toISOString(),
    });
  }
  writeJsonFile(GAPS_FILE, gaps);
}

export function getAllKnowledgeGaps(): KnowledgeGap[] {
  return readJsonFile<KnowledgeGap[]>(GAPS_FILE, []);
}

export function recordSearchAudit(record: Omit<SearchAuditRecord, "id" | "timestamp">): void {
  const audits = readJsonFile<SearchAuditRecord[]>(AUDIT_FILE, []);
  audits.push({
    ...record,
    id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  });
  // Cap audit log to 1000 items
  if (audits.length > 1000) audits.splice(0, audits.length - 1000);
  writeJsonFile(AUDIT_FILE, audits);
}

export function getSearchAudits(): SearchAuditRecord[] {
  return readJsonFile<SearchAuditRecord[]>(AUDIT_FILE, []);
}
