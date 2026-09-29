/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 30
 * Multilingual Text Normalization & Fuzzy Search Utilities
 * Supports Bangla (বাংলা), Arabic (العربية), and English with typo-tolerance.
 */

// Strip Arabic diacritics / tashkeel and unify forms
export function normalizeArabicText(text: string): string {
  if (!text) return "";
  return text
    // Remove harakat / tashkeel
    .replace(/[\u064B-\u0652\u0670\u06D6-\u06ED]/g, "")
    // Normalize Alef forms (أ, إ, آ -> ا)
    .replace(/[أإآٱ]/g, "ا")
    // Normalize Teh Marbuta to Heh (ة -> ه)
    .replace(/ة/g, "ه")
    // Normalize Yeh forms (ى -> ي)
    .replace(/ى/g, "ي")
    .trim();
}

// Normalize Bangla text (remove zero-width chars, standardize common variations)
export function normalizeBanglaText(text: string): string {
  if (!text) return "";
  return text
    // Remove zero-width joiner & non-joiner
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    // Normalize Dari / Punctuation
    .replace(/[।,|?!]/g, " ")
    // Normalize multiple whitespace
    .replace(/\s+/g, " ")
    .trim();
}

// General text normalization for search comparison
export function normalizeSearchTerm(term: string): string {
  if (!term) return "";
  const lower = term.toLowerCase().trim();
  const arNorm = normalizeArabicText(lower);
  return normalizeBanglaText(arNorm);
}

// Levenshtein distance for controlled typo tolerance
export function calculateLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  const n = a.length;
  const m = b.length;

  if (n === 0) return m;
  if (m === 0) return n;

  for (let i = 0; i <= n; i++) matrix[i] = [i];
  for (let j = 0; j <= m; j++) matrix[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[n][m];
}

/**
 * Check if query matches target with typo tolerance
 * Strict limit: Only triggers if word is >= 4 chars and distance <= 1 or 2
 */
export function isFuzzyMatch(
  query: string,
  target: string,
  maxDistance: number = 1
): { matched: boolean; distance: number } {
  const q = normalizeSearchTerm(query);
  const t = normalizeSearchTerm(target);

  // Exact match or substring
  if (t.includes(q)) return { matched: true, distance: 0 };

  // Only allow fuzzy matching on non-identifying words of reasonable length
  if (q.length < 4 || t.length < 4) return { matched: false, distance: 99 };

  // If query is an ID pattern (e.g. EHRJ-..., STU-..., INV-...), NEVER fuzzy match!
  if (/^[A-Z0-9_-]+$/i.test(query) && query.includes("-")) {
    return { matched: false, distance: 99 };
  }

  const dist = calculateLevenshteinDistance(q, t);
  if (dist <= maxDistance) {
    return { matched: true, distance: dist };
  }

  // Also check individual words
  const words = t.split(/\s+/);
  for (const w of words) {
    if (w.length >= 4 && calculateLevenshteinDistance(q, w) <= maxDistance) {
      return { matched: true, distance: dist };
    }
  }

  return { matched: false, distance: dist };
}
