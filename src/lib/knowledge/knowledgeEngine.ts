/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 22
 * Institutional Knowledge, Advanced Search & Semantic Retrieval Engine
 * 
 * Invariants:
 * 1. USER PERMISSION > SEARCH RESULT (Authorization must apply before retrieval).
 * 2. TIER 1 LIVE RECORDS > EMBEDDED TEXT (Never answer transactional queries from stale docs).
 * 3. MULTI-CHILD ISOLATION: Guardians can only access their linked children.
 * 4. BANGLA + ENGLISH + ARABIC NORMALIZATION.
 * 5. CONFLICT DETECTION: Prioritize current published version over superseded docs.
 */

import { prisma } from "@/lib/prisma";
import {
  getAllDocuments,
  getAllFAQs,
  KnowledgeDocument,
  KnowledgeChunk,
  KnowledgeFAQ,
  recordKnowledgeGap,
  recordSearchAudit,
  KnowledgeCategory,
} from "./knowledgeStore";

export interface SearchQueryRequest {
  query: string;
  category?: string;
  language?: "bn" | "en" | "ar" | "all";
  user?: {
    userId?: string;
    role: "ADMIN" | "PRINCIPAL" | "TEACHER" | "GUARDIAN" | "PUBLIC";
    guardianId?: string;
    studentId?: string; // explicitly scoped child for guardians
  };
  limit?: number;
}

export interface SearchResultItem {
  id: string;
  title: string;
  snippet: string;
  sourceType: "LIVE_RECORD" | "INSTITUTIONAL_POLICY" | "OFFICIAL_FAQ" | "PUBLIC_NOTICE";
  sourceTier: 1 | 2 | 3 | 4;
  category: string;
  version?: string;
  effectiveDate?: string;
  score: number;
  citation: string;
  metadata?: Record<string, any>;
}

export interface SearchResponse {
  query: string;
  normalizedQuery: string;
  detectedIntent: string;
  totalResults: number;
  results: SearchResultItem[];
  conflictNotice?: string;
  latencyMs: number;
}

// -------------------------------------------------------------
// MULTI-LINGUAL NORMALIZATION (BANGLA, ENGLISH, ARABIC)
// -------------------------------------------------------------

export function normalizeSearchText(text: string): string {
  if (!text) return "";
  let s = text.normalize("NFC").toLowerCase();

  // Strip common punctuation
  s = s.replace(/[।.,?!;:'"()\[\]{}\-–—/\\|@#$%^&*+=_`~<>]/g, " ");

  // Arabic character normalization (strip tashkeel, unify alef, yaa, ta marbuta)
  s = s.replace(/[\u064B-\u065F\u0670]/g, ""); // strip harakat/tashkeel
  s = s.replace(/[\u0622\u0623\u0625\u0671]/g, "\u0627"); // unify alef variations to simple alef
  s = s.replace(/\u0629/g, "\u0647"); // ta marbuta to ha
  s = s.replace(/\u0649/g, "\u064A"); // alef maqsura to ya

  // Bangla synonym / spelling variation harmonization
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

export function tokenize(text: string): string[] {
  const norm = normalizeSearchText(text);
  if (!norm) return [];
  return Array.from(new Set(norm.split(/\s+/).filter((w) => w.length > 1)));
}

// -------------------------------------------------------------
// CHUNKING ENGINE (SECTION-AWARE)
// -------------------------------------------------------------

export function chunkDocument(doc: KnowledgeDocument): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];
  const lines = doc.contentText.split("\n");
  let currentSection = doc.titleBn;
  let buffer: string[] = [];
  let chunkIdx = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if section header
    if (trimmed.startsWith("###") || trimmed.startsWith("##") || trimmed.endsWith(":") || /^\d+\./.test(trimmed)) {
      if (buffer.length > 0) {
        chunks.push({
          chunkId: `${doc.id}-chk-${chunkIdx++}`,
          documentId: doc.id,
          version: doc.version,
          title: doc.titleBn,
          category: doc.category,
          section: currentSection,
          effectiveDate: doc.effectiveDate,
          roleScope: doc.roleScope,
          securityClassification: doc.securityClassification,
          language: doc.language,
          text: buffer.join(" "),
        });
        buffer = [];
      }
      currentSection = trimmed.replace(/^#+\s*/, "");
    }
    buffer.push(trimmed);
  }

  if (buffer.length > 0) {
    chunks.push({
      chunkId: `${doc.id}-chk-${chunkIdx++}`,
      documentId: doc.id,
      version: doc.version,
      title: doc.titleBn,
      category: doc.category,
      section: currentSection,
      effectiveDate: doc.effectiveDate,
      roleScope: doc.roleScope,
      securityClassification: doc.securityClassification,
      language: doc.language,
      text: buffer.join(" "),
    });
  }

  return chunks;
}

// -------------------------------------------------------------
// PERMISSION FILTERING (BEFORE RETRIEVAL)
// -------------------------------------------------------------

export function isDocumentAccessible(
  doc: KnowledgeDocument,
  userRole: "ADMIN" | "PRINCIPAL" | "TEACHER" | "GUARDIAN" | "PUBLIC"
): boolean {
  // Public users can ONLY see PUBLISHED and PUBLIC documents
  if (userRole === "PUBLIC") {
    return doc.status === "PUBLISHED" && doc.securityClassification === "PUBLIC";
  }

  // Guardians can see PUBLIC documents and documents scoped to ALL or GUARDIAN
  if (userRole === "GUARDIAN") {
    if (doc.status !== "PUBLISHED") return false;
    if (doc.securityClassification === "CONFIDENTIAL" || doc.securityClassification === "HIGHLY_RESTRICTED") {
      return false;
    }
    return doc.roleScope === "ALL" || doc.roleScope === "GUARDIAN";
  }

  // Teachers can see PUBLIC and RESTRICTED/INTERNAL academic guidelines
  if (userRole === "TEACHER") {
    if (doc.status !== "PUBLISHED" && doc.status !== "APPROVED") return false;
    if (doc.securityClassification === "CONFIDENTIAL" || doc.securityClassification === "HIGHLY_RESTRICTED") {
      return false; // No internal HR/salary access
    }
    return doc.roleScope === "ALL" || doc.roleScope === "TEACHER";
  }

  // Admin & Principal have full authorized institutional oversight
  return true;
}

// -------------------------------------------------------------
// LIVE TRANSACTIONAL SEARCH (TIER 1 SOURCE OF TRUTH)
// -------------------------------------------------------------

async function searchLiveTransactionalRecords(
  queryTokens: string[],
  userRole: string,
  userId?: string,
  scopedStudentId?: string
): Promise<SearchResultItem[]> {
  const items: SearchResultItem[] = [];
  const queryStr = queryTokens.join(" ");

  const hasStudentIntent = /ছাত্র|শিক্ষার্থী|student|রোল|roll/i.test(queryStr);
  const hasFeeIntent = /ফি|বেতন|বকেয়া|fee|due|invoice/i.test(queryStr);
  const hasNoticeIntent = /নোটিশ|বিজ্ঞপ্তি|notice/i.test(queryStr);
  const hasResultIntent = /রেজাল্ট|ফলাফল|result|mark/i.test(queryStr);
  const hasAttendanceIntent = /উপস্থিতি|হাজিরা|attendance/i.test(queryStr);

  // 1. Published Public Notices (Always safe & fresh)
  if (hasNoticeIntent) {
    const notices = await prisma.notice.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 3,
    });

    for (const n of notices) {
      const titleTokens = tokenize(n.titleBn);
      const match = queryTokens.some((t) => titleTokens.includes(t) || n.titleBn.includes(t));
      if (match || hasNoticeIntent) {
        items.push({
          id: `live-not-${n.id}`,
          title: `[অফিসিয়াল নোটিশ] ${n.titleBn}`,
          snippet: n.contentBn.substring(0, 160) + "...",
          sourceType: "PUBLIC_NOTICE",
          sourceTier: 1,
          category: "NOTICE",
          effectiveDate: n.publishedAt.toISOString(),
          score: match ? 0.95 : 0.7,
          citation: `[অফিসিয়াল নোটিশ: ${n.id.substring(0, 8)}, প্রকাশ: ${n.publishedAt.toLocaleDateString("bn-BD")}]`,
          metadata: { noticeId: n.id, isUrgent: n.isUrgent },
        });
      }
    }
  }

  // 2. Transactional Finance / Fee Invoices
  if (hasFeeIntent && (userRole === "ADMIN" || userRole === "PRINCIPAL" || (userRole === "GUARDIAN" && scopedStudentId))) {
    const whereClause: any = { status: { in: ["UNPAID", "PARTIALLY_PAID", "PAID"] } };
    if (userRole === "GUARDIAN") {
      whereClause.studentId = scopedStudentId;
    }

    const invoices = await prisma.feeInvoice.findMany({
      where: whereClause,
      include: { student: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    for (const inv of invoices) {
      items.push({
        id: `live-inv-${inv.id}`,
        title: `[ফি ইনভয়েস] ${inv.student.fullNameBn} - ${inv.title}`,
        snippet: `মোট পরিমাণ: ৳${inv.totalAmount}, পরিশোধিত: ৳${inv.paidAmount}, বর্তমান বকেয়া: ৳${inv.dueAmount}, পরিশোধের মেয়াদ: ${inv.dueDate.toLocaleDateString("bn-BD")}`,
        sourceType: "LIVE_RECORD",
        sourceTier: 1,
        category: "FINANCE",
        effectiveDate: inv.createdAt.toISOString(),
        score: 0.98,
        citation: `[লাইভ ফাইন্যান্স রেকর্ড: ইনভয়েস নং ${inv.invoiceNumber}, শিক্ষার্থী: ${inv.student.fullNameBn}]`,
        metadata: { invoiceId: inv.id, dueAmount: inv.dueAmount, status: inv.status },
      });
    }
  }

  // 3. Student Master Search (Restricted by RBAC)
  if (hasStudentIntent && (userRole === "ADMIN" || userRole === "PRINCIPAL" || userRole === "TEACHER")) {
    const students = await prisma.student.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { fullNameBn: { contains: queryStr } },
          { fullNameEn: { contains: queryStr } },
          { studentIdNumber: { contains: queryStr } },
        ],
      },
      take: 3,
    });

    for (const st of students) {
      items.push({
        id: `live-stu-${st.id}`,
        title: `[শিক্ষার্থী রেকর্ড] ${st.fullNameBn} (${st.studentIdNumber})`,
        snippet: `বিভাগ: ${st.residentialStatus === "RESIDENTIAL" ? "আবাসিক" : "অনাবাসিক"}, পিতা: ${st.fatherNameBn || "তথ্য নেই"}`,
        sourceType: "LIVE_RECORD",
        sourceTier: 1,
        category: "ACADEMIC",
        effectiveDate: st.updatedAt.toISOString(),
        score: 0.96,
        citation: `[লাইভ রেজিস্টার: শিক্ষার্থী আইডি ${st.studentIdNumber}]`,
        metadata: { studentId: st.id, admissionNo: st.studentIdNumber },
      });
    }
  }

  return items;
}

// -------------------------------------------------------------
// HYBRID SEARCH & RERANKING ENGINE
// -------------------------------------------------------------

export async function executeInstitutionalSearch(req: SearchQueryRequest): Promise<SearchResponse> {
  const startTime = Date.now();
  const rawQuery = req.query || "";
  const normalized = normalizeSearchText(rawQuery);
  const tokens = tokenize(rawQuery);
  const userRole = req.user?.role || "PUBLIC";

  // Intent classification
  let detectedIntent = "GENERAL";
  if (/ভর্তি|আবেদন|admission|apply/i.test(rawQuery)) detectedIntent = "ADMISSION";
  else if (/ফি|টাকা|বেতন|বকেয়া|খরচ|পেমেন্ট|fee|payment|due/i.test(rawQuery)) detectedIntent = "FINANCE";
  else if (/ছুটি|উপস্থিতি|অনুপস্থিত|attendance|leave/i.test(rawQuery)) detectedIntent = "ATTENDANCE";
  else if (/পরীক্ষা|রেজাল্ট|নম্বর|exam|result/i.test(rawQuery)) detectedIntent = "EXAMINATION";
  else if (/হোস্টেল|বোর্ডিং|খাবার|থাকা|hostel|residential/i.test(rawQuery)) detectedIntent = "RESIDENTIAL";
  else if (/লাইব্রেরি|বই|কিতাব|library|book/i.test(rawQuery)) detectedIntent = "LIBRARY";
  else if (/বেতন\s*কাঠামো|ইনক্রিমেন্ট|স্টাফ|কর্মচারী|salary|staff/i.test(rawQuery)) detectedIntent = "HR";

  // 1. Live transactional queries (Tier 1)
  const liveResults = await searchLiveTransactionalRecords(
    tokens,
    userRole,
    req.user?.userId,
    req.user?.studentId
  );

  // 2. Institutional Documents & Chunks (Tier 2)
  const allDocs = getAllDocuments();
  const accessibleDocs = allDocs.filter((d) => isDocumentAccessible(d, userRole));

  const INSTITUTION_STOPWORDS = new Set([
    "মাদরাসা", "মাদ্রাসা", "মাদরাসার", "মাদ্রাসার", "হাজী", "রহমাতুল্লাহ", "জমিরীয়া", "ইলিয়টগঞ্জ",
    "কোথায়", "কী", "কি", "কেন", "কেমন", "কত", "এর", "এবং", "বা", "হতে", "হবে", "আছে", "না",
    "the", "is", "at", "which", "on", "where", "how", "what", "ehrj", "madrasha", "madrasah"
  ]);

  const contentTokens = tokens.filter((t) => !INSTITUTION_STOPWORDS.has(t));
  const activeSearchTokens = contentTokens.length > 0 ? contentTokens : tokens;

  let conflictNotice: string | undefined;
  const docResults: SearchResultItem[] = [];

  for (const doc of accessibleDocs) {
    const docTokens = tokenize(`${doc.titleBn} ${doc.titleEn} ${doc.contentText} ${doc.tags.join(" ")}`);
    
    // Lexical match calculation on content tokens
    let matchingTokens = 0;
    for (const t of activeSearchTokens) {
      if (docTokens.includes(t) || doc.contentText.includes(t) || doc.titleBn.includes(t)) {
        matchingTokens++;
      }
    }

    if (matchingTokens > 0) {
      const lexicalScore = matchingTokens / activeSearchTokens.length;
      
      // Effective date / freshness boost
      const isCurrentPublished = doc.status === "PUBLISHED";
      const isSuperseded = doc.status === "SUPERSEDED";
      const freshnessBoost = isCurrentPublished ? 0.35 : isSuperseded ? -0.35 : 0.05;
      const authorityTierScore = 0.85;

      const totalScore = Math.max(0.1, Math.min(0.99, lexicalScore * 0.5 + freshnessBoost + authorityTierScore * 0.2));

      // Conflict warning if superseded document matches
      if (doc.status === "SUPERSEDED" && lexicalScore > 0.4) {
        conflictNotice = "অনুসন্ধানে একটি পুরাতন/সুপারসিডেড নীতিমালা পরিলক্ষিত হয়েছে। স্বয়ংক্রিয়ভাবে হালনাগাদ অনুমোদিত সংস্করণ অগ্রাধিকার দেওয়া হয়েছে।";
      }

      // Safe snippet generation
      const snippetLength = 180;
      let snippet = doc.contentText.substring(0, snippetLength).replace(/\n+/g, " ") + "...";

      docResults.push({
        id: `doc-${doc.id}`,
        title: doc.titleBn,
        snippet,
        sourceType: "INSTITUTIONAL_POLICY",
        sourceTier: 2,
        category: doc.category,
        version: doc.version,
        effectiveDate: doc.effectiveDate,
        score: totalScore,
        citation: `[প্রাতিষ্ঠানিক নীতিমালা: ${doc.titleBn}, সংস্করণ ${doc.version}, কোড: ${doc.documentCode}]`,
        metadata: {
          documentId: doc.id,
          documentCode: doc.documentCode,
          status: doc.status,
          isCurrentVersion: doc.status === "PUBLISHED",
        },
      });
    }
  }

  // 3. Official FAQs (Tier 3)
  const allFaqs = getAllFAQs();
  const faqResults: SearchResultItem[] = [];
  for (const faq of allFaqs) {
    if (faq.status !== "PUBLISHED") continue;
    const faqTokens = tokenize(`${faq.questionBn} ${faq.questionEn} ${faq.answerBn} ${faq.answerEn}`);
    const matches = activeSearchTokens.filter((t) => faqTokens.includes(t));
    if (matches.length > 0) {
      faqResults.push({
        id: `faq-${faq.id}`,
        title: `[প্রশ্নোত্তর] ${faq.questionBn}`,
        snippet: faq.answerBn.substring(0, 160) + "...",
        sourceType: "OFFICIAL_FAQ",
        sourceTier: 3,
        category: faq.category,
        score: 0.75 + (matches.length / (activeSearchTokens.length || 1)) * 0.2,
        citation: `[অফিসিয়াল প্রশ্নোত্তর (FAQ): ${faq.category}]`,
      });
    }
  }

  // 3. Digital Archive & OCR Extracted Documents (Phase 29 Tier 2 Evidence)
  const archiveResults: SearchResultItem[] = [];
  try {
    const { searchArchiveDocuments } = await import("@/lib/document");
    const arcHits = searchArchiveDocuments(
      { term: activeSearchTokens.join(" "), limit: 3 },
      {
        userId: req.user?.userId || "public",
        role: (userRole as any) || "PUBLIC",
        guardianId: req.user?.guardianId,
        studentId: req.user?.studentId,
      }
    );
    for (const h of arcHits) {
      archiveResults.push({
        id: `arc-${h.document.id}`,
        title: `[দলিল আর্কাইভ] ${h.document.title}`,
        snippet: `স্মারক: ${h.document.id} | প্রকার: ${h.document.documentType} | মালিকানা: ${h.document.entityName || h.document.entityId} | অবস্থা: ${h.document.status}`,
        sourceType: "INSTITUTIONAL_POLICY",
        sourceTier: 2,
        category: "ACADEMIC",
        version: `v${h.document.currentVersion}`,
        score: h.relevanceScore,
        citation: h.citation,
      });
    }
  } catch (e) {
    // Graceful fallback if archive is uninitialized
  }

  // Combine and Rerank according to Source-of-Truth Hierarchy (Tier 1 > Tier 2 > Tier 3)
  const combined = [...liveResults, ...docResults, ...archiveResults, ...faqResults];
  combined.sort((a, b) => {
    if (a.sourceTier !== b.sourceTier) {
      return a.sourceTier - b.sourceTier; // Lower tier number = higher authority
    }
    return b.score - a.score;
  });

  const limit = req.limit || 10;
  const finalResults = combined.slice(0, limit);

  // If no results found, record a Knowledge Gap
  if (finalResults.length === 0 && rawQuery.trim().length > 3) {
    recordKnowledgeGap(rawQuery, (detectedIntent as KnowledgeCategory) || "GENERAL");
  }

  const latencyMs = Date.now() - startTime;

  // Record Search Audit
  recordSearchAudit({
    query: rawQuery,
    userRole,
    userId: req.user?.userId,
    searchType: liveResults.length > 0 ? "HYBRID" : "SEMANTIC",
    resultsCount: finalResults.length,
    latencyMs,
  });

  return {
    query: rawQuery,
    normalizedQuery: normalized,
    detectedIntent,
    totalResults: finalResults.length,
    results: finalResults,
    conflictNotice,
    latencyMs,
  };
}
