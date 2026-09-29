/**
 * Public Search Bridge — Phase 30 Integration
 * Strictly queries approved public institutional content.
 * Checkpoint: EHRJ-AI-2026-PHASE31
 */

import { prisma } from "@/lib/prisma";
import { getCmsEvents, getCmsFaqs, getCmsDownloads } from "./cmsStore";
import { normalizeBanglaText, normalizeArabicText } from "@/lib/search/searchNormalization";

export interface PublicSearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  snippet: string;
  entityType: "NOTICE" | "EVENT" | "FAQ" | "DOWNLOAD" | "ACADEMIC";
  url: string;
  badge: string;
  date?: string;
}

export async function executePublicSearch(rawQuery: string): Promise<{
  query: string;
  count: number;
  results: PublicSearchResultItem[];
  latencyMs: number;
}> {
  const start = Date.now();
  const q = rawQuery.trim();
  if (!q) {
    return { query: "", count: 0, results: [], latencyMs: 0 };
  }

  const normalized = normalizeBanglaText(normalizeArabicText(q)).toLowerCase();
  const results: PublicSearchResultItem[] = [];

  // 1 & 2. Run Notice and Academic Class queries concurrently
  try {
    const [notices, classes] = await Promise.all([
      prisma.notice.findMany({
        where: {
          isPublished: true,
          audience: "PUBLIC",
          OR: [
            { titleBn: { contains: q } },
            { titleEn: { contains: q } },
            { contentBn: { contains: q } },
          ],
        },
        take: 6,
        orderBy: { publishedAt: "desc" },
      }),
      prisma.jamatClass.findMany({
        where: {
          isActive: true,
          OR: [
            { nameBn: { contains: q } },
            { nameEn: { contains: q } },
            { code: { contains: q } },
          ],
        },
        take: 4,
      }),
    ]);

    for (const n of notices) {
      results.push({
        id: n.id,
        title: n.titleBn,
        subtitle: n.titleEn || undefined,
        snippet: n.contentBn.slice(0, 150) + (n.contentBn.length > 150 ? "..." : ""),
        entityType: "NOTICE",
        url: `/notices/${n.id}`,
        badge: `নোটিশ • ${n.category}`,
        date: new Date(n.publishedAt).toLocaleDateString("bn-BD"),
      });
    }

    for (const c of classes) {
      results.push({
        id: c.id,
        title: `${c.nameBn} (${c.code})`,
        subtitle: c.nameEn,
        snippet: `অনুমোদিত জামাত ও শিক্ষা কার্যক্রম। শিক্ষাবর্ষের সক্রিয় ক্লাস।`,
        entityType: "ACADEMIC",
        url: `/academic`,
        badge: "অনুষদ / জামাত",
      });
    }
  } catch (err) {
    console.error("Error in public database search queries:", err);
  }

  // 2. Search Public Events from CMS Store
  try {
    const events = getCmsEvents(true);
    for (const e of events) {
      if (
        e.titleBn.toLowerCase().includes(normalized) ||
        (e.titleEn && e.titleEn.toLowerCase().includes(normalized)) ||
        e.descriptionBn.toLowerCase().includes(normalized) ||
        e.location.toLowerCase().includes(normalized)
      ) {
        results.push({
          id: e.id,
          title: e.titleBn,
          subtitle: e.titleEn,
          snippet: e.descriptionBn.slice(0, 140) + "...",
          entityType: "EVENT",
          url: `/#events`,
          badge: `অনুষ্ঠান • ${e.category}`,
          date: e.eventDate,
        });
      }
    }
  } catch (err) {
    console.error("Error searching public events:", err);
  }

  // 3. Search Public FAQs from CMS Store
  try {
    const faqs = getCmsFaqs(true);
    for (const f of faqs) {
      if (
        f.questionBn.toLowerCase().includes(normalized) ||
        (f.questionEn && f.questionEn.toLowerCase().includes(normalized)) ||
        f.answerBn.toLowerCase().includes(normalized)
      ) {
        results.push({
          id: f.id,
          title: f.questionBn,
          subtitle: f.questionEn,
          snippet: f.answerBn.slice(0, 150) + "...",
          entityType: "FAQ",
          url: `/#faq`,
          badge: `প্রশ্নোত্তর • ${f.category}`,
        });
      }
    }
  } catch (err) {
    console.error("Error searching public faqs:", err);
  }

  // 4. Search Public Downloads from CMS Store
  try {
    const downloads = getCmsDownloads(true);
    for (const d of downloads) {
      if (
        d.titleBn.toLowerCase().includes(normalized) ||
        (d.titleEn && d.titleEn.toLowerCase().includes(normalized)) ||
        d.descriptionBn.toLowerCase().includes(normalized)
      ) {
        results.push({
          id: d.id,
          title: d.titleBn,
          subtitle: d.versionString,
          snippet: d.descriptionBn,
          entityType: "DOWNLOAD",
          url: `/downloads`,
          badge: `ডাউনলোড • ${d.fileType}`,
        });
      }
    }
  } catch (err) {
    console.error("Error searching public downloads:", err);
  }

  const latencyMs = Date.now() - start;
  return {
    query: q,
    count: results.length,
    results,
    latencyMs,
  };
}
