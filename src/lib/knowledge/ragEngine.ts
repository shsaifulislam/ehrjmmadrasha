/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 22
 * Retrieval-Augmented Generation (RAG) Grounding & Citation Engine
 * 
 * Invariants:
 * 1. AI ANSWER != SOURCE OF TRUTH.
 * 2. RETRIEVED SOURCE > AI MEMORY.
 * 3. NO UNSOURCED INSTITUTIONAL CLAIMS: If no authoritative source is found, do not hallucinate.
 * 4. PROMPT INJECTION DEFENSE: Retrieved documents are DATA, never instructions.
 * 5. CONFLICT HANDLING: Flag contradictory or superseded sources.
 */

import { executeInstitutionalSearch, SearchResultItem } from "./knowledgeEngine";
import { sanitizeAIInput } from "@/lib/ai/aiEngine";
import { logAIUsage } from "@/lib/ai/aiGovernance";

export interface RAGAnswerRequest {
  query: string;
  user: {
    userId?: string;
    role: "ADMIN" | "PRINCIPAL" | "TEACHER" | "GUARDIAN" | "PUBLIC";
    guardianId?: string;
    studentId?: string;
  };
  preferredLanguage?: "bn" | "en" | "ar";
}

export interface RAGAnswerResponse {
  query: string;
  answer: string;
  isGrounded: boolean;
  confidenceTier: "HIGH" | "MEDIUM" | "UNGROUNDED";
  citations: string[];
  sourcesUsed: {
    title: string;
    sourceType: string;
    version?: string;
    citation: string;
  }[];
  conflictWarning?: string;
  promptInjectionDetected: boolean;
  latencyMs: number;
}

export async function generateGroundedRAGAnswer(req: RAGAnswerRequest): Promise<RAGAnswerResponse> {
  const startTime = Date.now();
  const rawQuery = req.query || "";

  // 1. Prompt Injection Defense on User Input
  const sanitizedQuery = sanitizeAIInput(rawQuery);
  const injectionDetected = sanitizedQuery !== rawQuery;

  // 2. Permission-Aware Search & Semantic Retrieval
  const searchResults = await executeInstitutionalSearch({
    query: sanitizedQuery,
    user: req.user,
    limit: 5,
  });

  const validSources = searchResults.results.filter((r) => r.score >= 0.65);
  const citations = validSources.map((s) => s.citation);
  const sourcesUsed = validSources.map((s) => ({
    title: s.title,
    sourceType: s.sourceType,
    version: s.version,
    citation: s.citation,
  }));

  // 3. Fallback when NO authoritative source exists
  if (validSources.length === 0) {
    const latencyMs = Date.now() - startTime;
    return {
      query: rawQuery,
      answer: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার বর্তমান ডাটাবেজ ও অনুমোদিত নীতিমালায় এই বিষয়ে কোনো তথ্য সংরক্ষিত নেই। কোনো অনুমাননির্ভর তথ্য প্রদান করা সম্ভব নয়। অনুগ্রহ করে মাদরাসা অফিসে সরাসরি যোগাযোগ করুন।",
      isGrounded: false,
      confidenceTier: "UNGROUNDED",
      citations: [],
      sourcesUsed: [],
      promptInjectionDetected: injectionDetected,
      latencyMs,
    };
  }

  // 4. Grounded Synthesis with Context Assembly
  const topSource = validSources[0];
  let answer = "";
  const isBangla = req.preferredLanguage !== "en";

  if (topSource.sourceType === "LIVE_RECORD") {
    answer = isBangla
      ? `সরাসরি ইআরপি ডাটাবেজ অনুযায়ী: ${topSource.title} — ${topSource.snippet}`
      : `According to authoritative ERP live records: ${topSource.title} — ${topSource.snippet}`;
  } else if (topSource.sourceType === "INSTITUTIONAL_POLICY") {
    answer = isBangla
      ? `ইলিয়টগঞ্জ মাদরাসার অনুমোদিত নীতিমালা (${topSource.title}, সংস্করণ ${topSource.version || "১.০"}) অনুযায়ী:\n${topSource.snippet}`
      : `According to Eliotganj Madrasha's approved policy (${topSource.title}, v${topSource.version || "1.0"}):\n${topSource.snippet}`;
  } else if (topSource.sourceType === "OFFICIAL_FAQ") {
    answer = isBangla
      ? `মাদরাসার অফিসিয়াল নির্দেশিকা অনুযায়ী:\n${topSource.snippet}`
      : `According to official institution guidelines:\n${topSource.snippet}`;
  } else {
    answer = topSource.snippet;
  }

  // Append any conflict notices
  if (searchResults.conflictNotice) {
    answer += `\n\n[সতর্কবার্তা: ${searchResults.conflictNotice}]`;
  }

  const latencyMs = Date.now() - startTime;

  // Audit RAG interaction
  logAIUsage({
    requestId: `rag-${Date.now()}`,
    userId: req.user.userId,
    userRole: req.user.role,
    module: (searchResults.detectedIntent as any) || "GENERAL",
    queryIntent: `RAG_QUERY_${searchResults.detectedIntent}`,
    model: "EHRJ-RAG-GROUNDING-v1",
    provider: "LOCAL_FALLBACK",
    estimatedTokens: 140,
    latencyMs,
    status: "SUCCESS",
    humanReviewRequired: false,
    timestamp: new Date().toISOString(),
  });

  return {
    query: rawQuery,
    answer,
    isGrounded: true,
    confidenceTier: topSource.sourceTier === 1 ? "HIGH" : "MEDIUM",
    citations,
    sourcesUsed,
    conflictWarning: searchResults.conflictNotice,
    promptInjectionDetected: injectionDetected,
    latencyMs,
  };
}
