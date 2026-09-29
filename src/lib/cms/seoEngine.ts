/**
 * SEO Engine & Structured Data (JSON-LD) Generator
 * Checkpoint: EHRJ-AI-2026-PHASE31
 */

import { getInstitutionalProfile } from "./institutionalProfile";
import { getSeoConfig } from "./cmsStore";
import { CmsEvent } from "./types";

/**
 * Builds canonical URL
 */
export function buildCanonicalUrl(path: string): string {
  const seo = getSeoConfig();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${seo.canonicalBaseUrl}${cleanPath}`;
}

/**
 * Generates JSON-LD for EducationalOrganization & WebSite
 */
export function generateInstitutionalJsonLd(): Record<string, any> {
  const profile = getInstitutionalProfile();
  const seo = getSeoConfig();

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": `${seo.canonicalBaseUrl}/#organization`,
        name: profile.nameBn,
        alternateName: [profile.nameEn, profile.nameAr, profile.code],
        url: seo.canonicalBaseUrl,
        logo: {
          "@type": "ImageObject",
          url: `${seo.canonicalBaseUrl}${profile.logoUrl}`,
          caption: profile.nameBn,
        },
        image: `${seo.canonicalBaseUrl}${seo.ogImageUrl}`,
        foundingDate: profile.establishedEn,
        address: {
          "@type": "PostalAddress",
          streetAddress: "পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ",
          addressLocality: "দাউদকান্দি",
          addressRegion: "কুমিল্লা",
          addressCountry: "BD",
        },
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: profile.primaryPhone,
            contactType: "admissions / customer service",
            areaServed: "BD",
            availableLanguage: ["bn", "en", "ar"],
          },
        ],
        email: profile.email,
        sameAs: [
          profile.socialLinks.facebook,
          profile.socialLinks.youtube,
          profile.socialLinks.whatsappChannel,
        ].filter(Boolean),
      },
      {
        "@type": "WebSite",
        "@id": `${seo.canonicalBaseUrl}/#website`,
        url: seo.canonicalBaseUrl,
        name: profile.nameBn,
        description: seo.defaultDescriptionBn,
        publisher: {
          "@id": `${seo.canonicalBaseUrl}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${seo.canonicalBaseUrl}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
        inLanguage: ["bn-BD", "en", "ar"],
      },
    ],
  };
}

/**
 * Generates JSON-LD for a published Notice (NewsArticle)
 */
export function generateNoticeJsonLd(notice: {
  id: string;
  titleBn: string;
  contentBn: string;
  category: string;
  publishedAt: string | Date;
}): Record<string, any> {
  const profile = getInstitutionalProfile();
  const seo = getSeoConfig();
  const noticeUrl = buildCanonicalUrl(`/notices/${notice.id}`);

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": noticeUrl,
    },
    headline: notice.titleBn,
    articleSection: notice.category,
    datePublished: new Date(notice.publishedAt).toISOString(),
    dateModified: new Date(notice.publishedAt).toISOString(),
    publisher: {
      "@type": "EducationalOrganization",
      name: profile.nameBn,
      logo: {
        "@type": "ImageObject",
        url: `${seo.canonicalBaseUrl}${profile.logoUrl}`,
      },
    },
    description: notice.contentBn.slice(0, 160),
  };
}

/**
 * Generates JSON-LD for a public Event
 */
export function generateEventJsonLd(event: CmsEvent): Record<string, any> {
  const profile = getInstitutionalProfile();
  const seo = getSeoConfig();

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.titleBn,
    description: event.descriptionBn,
    startDate: `${event.eventDate}T09:00:00+06:00`,
    endDate: `${event.eventDate}T17:00:00+06:00`,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.location,
      address: {
        "@type": "PostalAddress",
        streetAddress: "পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ",
        addressLocality: "দাউদকান্দি",
        addressRegion: "কুমিল্লা",
        addressCountry: "BD",
      },
    },
    organizer: {
      "@type": "Organization",
      name: profile.nameBn,
      url: seo.canonicalBaseUrl,
    },
  };
}

/**
 * Generates BreadcrumbList schema
 */
export function generateBreadcrumbJsonLd(
  items: Array<{ name: string; path: string }>
): Record<string, any> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: buildCanonicalUrl(item.path),
    })),
  };
}
