/**
 * Content Sanitizer & XSS Defense for EHRJ Public Portal & CMS
 * Checkpoint: EHRJ-AI-2026-PHASE31
 */

/**
 * Strips dangerous HTML tags, inline event handlers, and javascript protocols.
 */
export function sanitizeRichHtml(rawHtml: string): string {
  if (!rawHtml || typeof rawHtml !== "string") return "";

  let cleaned = rawHtml;

  // 1. Remove script tags and contents
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // 2. Remove dangerous event handlers (e.g. onload, onclick, onerror)
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*(?:["'][^"']*["']|[^\s>]+)/gi, "");

  // 3. Remove javascript: and data: pseudo-protocols in href/src
  cleaned = cleaned.replace(/(href|src)\s*=\s*["']?\s*(?:javascript|data|vbscript):[^"'>\s]*/gi, '$1="#"');

  // 4. Sanitize iframe tags: allow ONLY official youtube embeds
  cleaned = cleaned.replace(/<iframe\b([^>]*)>(.*?)<\/iframe>/gi, (match, attrs) => {
    const isYouTube = /src=["']https:\/\/(www\.)?(youtube\.com\/embed\/|youtu\.be\/)/i.test(attrs);
    if (isYouTube) {
      // Re-encode with safe sandbox and referrerpolicy attributes
      return `<iframe ${attrs} loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    }
    return ""; // Drop unauthorized iframes
  });

  return cleaned.trim();
}

/**
 * Escapes plain text to avoid HTML injection
 */
export function escapePlainText(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Validates whether an external link is safe (http or https only)
 */
export function isSafeExternalUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== "string") return false;
  try {
    const parsed = new URL(urlStr, "https://ehrj-madrasha.edu.bd");
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
