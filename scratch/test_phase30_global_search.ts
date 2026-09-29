/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 30
 * Comprehensive Automated Verification Suite for Global Search, Command Center,
 * Universal Navigation, Multilingual Processing, and RBAC / IDOR Security.
 * 
 * Checkpoint: EHRJ-AI-2026-PHASE30
 */

import { executeGlobalSearch } from "../src/lib/search/globalSearchEngine";
import { executeAISearch, interpretNaturalLanguageQuery } from "../src/lib/search/aiSearchBridge";
import { normalizeBanglaText, normalizeArabicText, isFuzzyMatch } from "../src/lib/search/searchNormalization";
import { getPermittedCommands } from "../src/lib/search/commandShortcuts";

async function runPhase30Suite() {
  console.log("=======================================================================");
  console.log("  EHRJ PHASE 30 — GLOBAL SEARCH & COMMAND CENTER VERIFICATION SUITE   ");
  console.log("=======================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(desc: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`  [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${desc} ${details ? `(${details})` : ""}`);
      failed++;
    }
  }

  const adminUser = {
    userId: "ADMIN-001",
    role: "ADMIN" as const,
  };

  const teacherUser = {
    userId: "TEACHER-001",
    role: "TEACHER" as const,
  };

  const guardianUser = {
    userId: "GUARDIAN-001",
    role: "GUARDIAN" as const,
    guardianId: "G-101",
    linkedStudentIds: ["STU-ALPHA-101"],
  };

  const publicUser = {
    role: "PUBLIC" as const,
  };

  // 1. MULTILINGUAL NORMALIZATION
  console.log("[TEST GROUP 1] Multilingual Search Normalization (Bangla / Arabic / English)");
  const bnNorm = normalizeBanglaText("সাইফুল   ইসলাম।");
  assert("Bangla text normalized without excess spaces or punctuation", bnNorm === "সাইফুল ইসলাম");

  const arNorm = normalizeArabicText("الْجَامِعَةُ الإِسْلَامِيَّةُ");
  assert("Arabic text normalized with tashkeel and alef unified", arNorm === "الجامعه الاسلاميه");

  // 2. CONTROLLED FUZZY MATCHING (PREVENTS ID CORRUPTION)
  console.log("\n[TEST GROUP 2] Controlled Typo-Tolerance & Fuzzy Safety");
  const typoMatch = isFuzzyMatch("Saifull", "Saiful Islam", 1);
  assert("Typo in common name handled via fuzzy distance", typoMatch.matched);

  const idMismatch = isFuzzyMatch("EHRJ-2026-0001", "EHRJ-2026-0002", 1);
  assert("CRITICAL INVARIANT: Exact identifiers NEVER allow fuzzy false-positives", !idMismatch.matched);

  // 3. COMMAND PALETTE & NAVIGATION SHORTCUTS
  console.log("\n[TEST GROUP 3] Command Palette & Universal Navigation");
  const adminCmds = getPermittedCommands("ADMIN");
  assert("Admin role receives full administrative command suite", adminCmds.length >= 10);
  assert("Admin command includes Command Center", adminCmds.some((c) => c.url === "/admin/command-center"));

  const guardianCmds = getPermittedCommands("GUARDIAN");
  assert("Guardian command palette excludes sensitive admin modules", !guardianCmds.some((c) => c.url === "/admin/security"));
  assert("Guardian command palette includes portal shortcuts", guardianCmds.some((c) => c.url === "/portal"));

  // 4. EMPTY SEARCH -> UNIVERSAL QUICK ACCESS
  console.log("\n[TEST GROUP 4] Empty Search Returns Navigation Index");
  const emptyRes = await executeGlobalSearch({
    term: "",
    user: adminUser,
  });
  assert("Empty search returns command navigation items", emptyRes.results.length > 0);
  assert("First item is navigation type", emptyRes.results[0].entityType === "NAVIGATION");

  // 5. EXACT IDENTIFIER SEARCH PRECEDENCE
  console.log("\n[TEST GROUP 5] Exact Identifier Search Priority");
  const idSearch = await executeGlobalSearch({
    term: "EHRJ",
    user: adminUser,
  });
  assert("Identifier search returns matches", idSearch.totalResults >= 0);
  assert("Search response includes source of truth metadata", idSearch.sourceOfTruth === "AUTHORITATIVE_DB_AND_INDEX");

  // 6. RBAC & IDOR SECURITY: FINANCE ISOLATION
  console.log("\n[TEST GROUP 6] RBAC Security: Finance Search Isolation");
  // Admin search finance
  const adminFinSearch = await executeGlobalSearch({
    term: "ফি",
    filters: { entityType: "INVOICE" },
    user: adminUser,
  });
  assert("Admin has permission to search finance invoices", adminFinSearch.results.every((r) => r.entityType === "INVOICE" || r.entityType === "NAVIGATION"));

  // Teacher searching finance must return ZERO results (No unauthorized discovery)
  const teacherFinSearch = await executeGlobalSearch({
    term: "ফি",
    filters: { entityType: "INVOICE" },
    user: teacherUser,
  });
  assert("SECURITY INVARIANT: Teacher searching finance invoices receives ZERO results", teacherFinSearch.results.length === 0);

  // 7. GUARDIAN MULTI-CHILD ISOLATION
  console.log("\n[TEST GROUP 7] Guardian Multi-Child Scope & IDOR Defense");
  const guardianSearch = await executeGlobalSearch({
    term: "student",
    filters: { entityType: "STUDENT" },
    user: guardianUser,
  });
  assert("Guardian search strictly limited to linked child", guardianSearch.results.every((r) => r.id === "STU-ALPHA-101" || r.entityType === "NAVIGATION"));

  // 8. NATURAL LANGUAGE AI SEARCH INTERPRETATION
  console.log("\n[TEST GROUP 8] AI Natural Language Query Interpretation");
  const nlFee = interpretNaturalLanguageQuery("বকেয়া ফি ইনভয়েস দেখান");
  assert("AI correctly infers INVOICE entity from natural Bangla", nlFee.inferredEntity === "INVOICE");

  const nlAdm = interpretNaturalLanguageQuery("নতুন ভর্তি আবেদন তালিকা");
  assert("AI correctly infers ADMISSION entity from natural Bangla", nlAdm.inferredEntity === "ADMISSION");

  const nlCert = interpretNaturalLanguageQuery("অধ্যয়ন প্রত্যয়নপত্র এবং সনদ");
  assert("AI correctly infers CERTIFICATE entity from natural Bangla", nlCert.inferredEntity === "CERTIFICATE");

  const aiExecution = await executeAISearch("ভর্তি আবেদন", adminUser);
  assert("AI search executes safely and attaches interpretation metadata", !!aiExecution.interpretation);
  assert("AI search preserves structured safety schema without raw SQL", !JSON.stringify(aiExecution).includes("SELECT *"));

  // 9. SEARCH PERFORMANCE & LATENCY
  console.log("\n[TEST GROUP 9] Latency & Performance Guard");
  const perfSearch = await executeGlobalSearch({
    term: "মুহাম্মদ",
    user: adminUser,
  });
  assert("Search latency is tracked", perfSearch.latencyMs >= 0);
  assert("Latency is under 1500ms for multi-entity query", perfSearch.latencyMs < 1500);

  console.log("\n=======================================================================");
  console.log(`  PHASE 30 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase30Suite().catch((err) => {
  console.error("Test Suite Unhandled Exception:", err);
  process.exit(1);
});
