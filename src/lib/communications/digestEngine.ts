/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 32
 * Notification Digest Generator & Broadcaster
 * Aggregates notices, events, and highlights into clean, role-tailored summaries.
 * Checkpoint: EHRJ-AI-2026-PHASE32
 */

import { prisma } from "@/lib/prisma";
import { getCmsEvents } from "@/lib/cms/cmsStore";
import { CommunicationDigest, DigestItem } from "./types";
import { saveCommunicationDigest, recordCommunicationAudit } from "./communicationStore";
import { resolveAudienceRecipients } from "./audienceResolver";
import { dispatchNotification } from "@/lib/communicationEngine";

/**
 * Generates an institutional digest for a specific role
 */
export async function generateInstitutionalDigest(params: {
  digestType: "DAILY" | "WEEKLY";
  targetRole: "GUARDIAN" | "TEACHER" | "ADMIN";
  dispatchLive?: boolean;
  actorId?: string;
}): Promise<CommunicationDigest> {
  const { digestType, targetRole, dispatchLive, actorId = "SYSTEM_SCHEDULER" } = params;

  const now = new Date();
  const daysBack = digestType === "DAILY" ? 1 : 7;
  const periodStart = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

  const digestItems: DigestItem[] = [];

  // 1. Fetch recent published notices from Prisma
  try {
    const recentNotices = await prisma.notice.findMany({
      where: {
        isPublished: true,
        publishedAt: { gte: periodStart },
      },
      take: 5,
      orderBy: { publishedAt: "desc" },
    });

    for (const n of recentNotices) {
      digestItems.push({
        title: n.titleBn,
        category: `বিজ্ঞপ্তি • ${n.category}`,
        summary: n.contentBn.slice(0, 120) + (n.contentBn.length > 120 ? "..." : ""),
        url: `/notices/${n.id}`,
        date: new Date(n.publishedAt).toLocaleDateString("bn-BD"),
      });
    }
  } catch (err) {
    console.error("Error fetching notices for digest:", err);
  }

  // 2. Fetch upcoming events from CMS Store
  try {
    const events = getCmsEvents(true);
    for (const e of events.slice(0, 3)) {
      digestItems.push({
        title: e.titleBn,
        category: `অনুষ্ঠান • ${e.category}`,
        summary: `${e.eventDate} | স্থান: ${e.location}`,
        url: `/#events`,
        date: e.eventDate,
      });
    }
  } catch (err) {
    console.error("Error fetching events for digest:", err);
  }

  const digestId = `DIG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

  const digest: CommunicationDigest = {
    id: digestId,
    digestType,
    targetRole,
    generatedAt: now.toISOString(),
    periodStart: periodStart.toISOString(),
    periodEnd: now.toISOString(),
    totalItems: digestItems.length,
    items: digestItems,
    status: dispatchLive ? "DISPATCHED" : "GENERATED",
  };

  // If live dispatch is requested
  if (dispatchLive && digestItems.length > 0) {
    const audienceType = targetRole === "GUARDIAN" ? "ALL_GUARDIANS" : targetRole === "TEACHER" ? "ALL_TEACHERS" : "ALL_PRINCIPAL_OVERSIGHT";
    const recipients = await resolveAudienceRecipients(audienceType);

    const titleBn = `${digestType === "DAILY" ? "দৈনিক" : "সাপ্তাহিক"} ডাইজেস্ট ও সংবাদ সারসংক্ষেপ - ${now.toLocaleDateString("bn-BD")}`;
    const itemsPreview = digestItems.map((item, idx) => `${idx + 1}. [${item.category}] ${item.title}\n   ${item.summary}`).join("\n\n");
    const bodyBn = `আসসালামু আলাইকুম,\n\nইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার সাম্প্রতিক গুরুত্বপূর্ণ সংবাদ ও তথ্যের সংক্ষিপ্ত বিবরণ:\n\n${itemsPreview}\n\nবিস্তারিত জানতে অনুগ্রহ করে আপনার অনলাইন পোর্টালে লগইন করুন।`;

    let sent = 0;
    for (const r of recipients.slice(0, 20)) { // Bounded batch
      try {
        await dispatchNotification({
          templateCode: "OFFICIAL_NOTICE_ANNOUNCEMENT",
          recipients: [{ userId: r.userId, name: r.name, email: r.email || null, role: r.role }],
          customTitle: titleBn,
          customBody: bodyBn,
          variables: {},
          priority: "NORMAL",
          idempotencyBaseKey: `digest-${digestId}-${r.userId}`,
        });
        sent++;
      } catch (e) {
        // Continue batch
      }
    }
    digest.dispatchedRecipientsCount = sent;
  }

  saveCommunicationDigest(digest);

  recordCommunicationAudit({
    actorId,
    actorRole: "SYSTEM",
    action: "GENERATE_DIGEST",
    details: {
      digestId,
      digestType,
      targetRole,
      totalItems: digestItems.length,
      dispatchedLive: !!dispatchLive,
    },
  });

  return digest;
}
