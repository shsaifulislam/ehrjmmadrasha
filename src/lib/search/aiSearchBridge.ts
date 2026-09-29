/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 30
 * Natural Language AI Search Interpreter
 * Translates conversational queries ("Show unpaid fees", "Active Hifz students") into safe structured search filters
 * 
 * Invariants:
 * 1. AI MUST NOT generate raw SQL or database queries.
 * 2. Translates only to approved search filter schemas.
 * 3. Enforces user role permissions before running the query.
 */

import { SearchFilter, SearchUserContext, GlobalSearchResponse } from "./types";
import { executeGlobalSearch } from "./globalSearchEngine";

export interface NLSearchInterpretation {
  rawQuery: string;
  inferredTerm: string;
  inferredEntity: SearchFilter["entityType"];
  confidence: number;
  interpretedExplanationBn: string;
}

/**
 * Interpret Natural Language Query into structured filter
 */
export function interpretNaturalLanguageQuery(query: string): NLSearchInterpretation {
  const q = query.trim().toLowerCase();

  // 1. Fee / Invoice / Payment intent
  if (/ফি|টাকা|বেতন|বকেয়া|রসিদ|ইনভয়েস|paid|unpaid|fee|invoice/i.test(q)) {
    const term = q.replace(/ফি|টাকা|বেতন|বকেয়া|ইনভয়েস|invoice|fees|show|find|সকল|সব/gi, "").trim();
    return {
      rawQuery: query,
      inferredTerm: term || "ইনভয়েস",
      inferredEntity: "INVOICE",
      confidence: 0.9,
      interpretedExplanationBn: "ফি ও হিসাব সংক্রান্ত তথ্য অনুসন্ধান",
    };
  }

  // 2. Admission intent
  if (/ভর্তি|আবেদন|দরখাস্ত|admission|apply|applicant/i.test(q)) {
    const term = q.replace(/ভর্তি|আবেদন|admission|show|find|সকল/gi, "").trim();
    return {
      rawQuery: query,
      inferredTerm: term || "ভর্তি",
      inferredEntity: "ADMISSION",
      confidence: 0.92,
      interpretedExplanationBn: "নতুন ভর্তি আবেদন ও ট্র্যাকিং তথ্য অনুসন্ধান",
    };
  }

  // 3. Certificates & Official Documents
  if (/সনদ|প্রত্যয়ন|সার্টিফিকেট|certificate|document|tc/i.test(q)) {
    const term = q.replace(/সনদ|প্রত্যয়ন|সার্টিফিকেট|certificate|document|show/gi, "").trim();
    return {
      rawQuery: query,
      inferredTerm: term || "প্রত্যয়নপত্র",
      inferredEntity: "CERTIFICATE",
      confidence: 0.88,
      interpretedExplanationBn: "অফিশিয়াল প্রত্যয়নপত্র ও সনদ অনুসন্ধান",
    };
  }

  // 4. Employees / Teachers
  if (/শিক্ষক|উস্তাদ|স্টাফ|কর্মকর্তা|teacher|employee|staff/i.test(q)) {
    const term = q.replace(/শিক্ষক|উস্তাদ|স্টাফ|কর্মকর্তা|teacher|staff|show/gi, "").trim();
    return {
      rawQuery: query,
      inferredTerm: term || "শিক্ষক",
      inferredEntity: "EMPLOYEE",
      confidence: 0.85,
      interpretedExplanationBn: "শিক্ষক ও কর্মকর্তা (HR) তথ্য অনুসন্ধান",
    };
  }

  // 5. Library Books
  if (/বই|কিতাব|লাইব্রেরি|গ্রন্থ|book|library/i.test(q)) {
    const term = q.replace(/বই|কিতাব|লাইব্রেরি|গ্রন্থ|book|library|show/gi, "").trim();
    return {
      rawQuery: query,
      inferredTerm: term || "কিতাব",
      inferredEntity: "LIBRARY_BOOK",
      confidence: 0.88,
      interpretedExplanationBn: "লাইব্রেরি ও কিতাবাগারের ক্যাটালগ অনুসন্ধান",
    };
  }

  // 6. Helpdesk Support
  if (/টিকিট|অভিযোগ|সহায়তা|সমস্যা|ticket|helpdesk|support/i.test(q)) {
    const term = q.replace(/টিকিট|অভিযোগ|সহায়তা|সমস্যা|ticket|helpdesk/gi, "").trim();
    return {
      rawQuery: query,
      inferredTerm: term || "টিকিট",
      inferredEntity: "HELPDESK",
      confidence: 0.86,
      interpretedExplanationBn: "হেল্পডেস্ক টিকিট ও অভিযোগ অনুসন্ধান",
    };
  }

  // Default: General Search
  return {
    rawQuery: query,
    inferredTerm: query,
    inferredEntity: "ALL",
    confidence: 0.7,
    interpretedExplanationBn: "সার্বজনীন সার্বিক অনুসন্ধান",
  };
}

/**
 * Execute AI Natural Language Assisted Search
 */
export async function executeAISearch(
  query: string,
  user: SearchUserContext
): Promise<GlobalSearchResponse & { interpretation: NLSearchInterpretation }> {
  const interpretation = interpretNaturalLanguageQuery(query);

  const searchRes = await executeGlobalSearch({
    term: interpretation.inferredTerm,
    filters: {
      entityType: interpretation.inferredEntity,
      limit: 20,
    },
    user,
  });

  return {
    ...searchRes,
    interpretation,
  };
}
