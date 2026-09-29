import { NextResponse } from "next/server";
import {
  getInstitutionalProfile,
  getCmsEvents,
  getCmsFaqs,
  getCmsDownloads,
  getCmsGallery,
  getHomepageConfig,
  getSeoConfig,
  getCmsAuditLogs,
} from "@/lib/cms";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [profile, events, faqs, downloads, gallery, homepage, seo, auditLogs, totalNotices] =
      await Promise.all([
        getInstitutionalProfile(),
        getCmsEvents(false),
        getCmsFaqs(false),
        getCmsDownloads(false),
        getCmsGallery(false),
        getHomepageConfig(),
        getSeoConfig(),
        getCmsAuditLogs(),
        prisma.notice.count(),
      ]);

    const publishedEvents = events.filter((e) => e.isPublic).length;
    const approvedFaqs = faqs.filter((f) => f.isApproved).length;
    const pendingFaqs = faqs.filter((f) => !f.isApproved).length;
    const publicDownloads = downloads.filter((d) => d.isPublic).length;
    const consentVerifiedGallery = gallery.filter((g) => g.consentVerified).length;

    return NextResponse.json({
      success: true,
      metrics: {
        totalNotices,
        totalEvents: events.length,
        publishedEvents,
        totalFaqs: faqs.length,
        approvedFaqs,
        pendingFaqs,
        totalDownloads: downloads.length,
        publicDownloads,
        totalGallery: gallery.length,
        consentVerifiedGallery,
        admissionState: homepage.admissionState,
      },
      profile,
      homepage,
      seo,
      recentAudits: auditLogs.slice(0, 10),
    });
  } catch (error) {
    console.error("Admin CMS Overview API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load CMS overview" },
      { status: 500 }
    );
  }
}
