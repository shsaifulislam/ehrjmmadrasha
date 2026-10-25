/**
 * CMS Persistent Storage Engine with Audit Trail & Dependency Checking
 * Checkpoint: EHRJ-AI-2026-PHASE31
 */

import fs from "fs";
import path from "path";
import {
  CmsEvent,
  CmsFaq,
  CmsDownloadItem,
  CmsGalleryItem,
  HomepageConfig,
  SeoConfig,
  CmsAuditEntry,
} from "./types";
import { INSTITUTION_INFO } from "@/lib/constants";

const CMS_DATA_DIR = path.join(process.cwd(), "data", "cms");

function getFilePath(filename: string): string {
  if (!fs.existsSync(CMS_DATA_DIR)) {
    fs.mkdirSync(CMS_DATA_DIR, { recursive: true });
  }
  return path.join(CMS_DATA_DIR, filename);
}

function readJsonFile<T>(filename: string, defaultValue: T): T {
  try {
    const file = getFilePath(filename);
    if (!fs.existsSync(file)) {
      writeJsonFile(filename, defaultValue);
      return defaultValue;
    }
    const raw = fs.readFileSync(file, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    return defaultValue;
  }
}

function writeJsonFile<T>(filename: string, data: T): void {
  const file = getFilePath(filename);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

// -------------------------------------------------------------
// 1. AUDIT LOGGING
// -------------------------------------------------------------
export function recordCmsAudit(entry: Omit<CmsAuditEntry, "id" | "timestamp">): void {
  const audits = readJsonFile<CmsAuditEntry[]>("audit_log.json", []);
  const newEntry: CmsAuditEntry = {
    id: `CMS-AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...entry,
    timestamp: new Date().toISOString(),
  };
  audits.unshift(newEntry);
  if (audits.length > 500) audits.length = 500; // retain last 500 events
  writeJsonFile("audit_log.json", audits);
}

export function getCmsAuditLogs(): CmsAuditEntry[] {
  return readJsonFile<CmsAuditEntry[]>("audit_log.json", []);
}

// -------------------------------------------------------------
// 2. EVENTS STORE
// -------------------------------------------------------------
const DEFAULT_EVENTS: CmsEvent[] = [];
const LEGACY_DEMO_EVENT_IDS = new Set(["EVT-2026-001", "EVT-2026-002"]);

export function getCmsEvents(onlyPublic = false): CmsEvent[] {
  const events = readJsonFile<CmsEvent[]>("events.json", DEFAULT_EVENTS);
  if (onlyPublic) {
    return events.filter(
      (e) =>
        !LEGACY_DEMO_EVENT_IDS.has(e.id) &&
        e.isPublic &&
        (e.status === "UPCOMING" || e.status === "ONGOING" || e.status === "COMPLETED")
    );
  }
  return events;
}

export function saveCmsEvent(eventData: Partial<CmsEvent> & { id?: string }, performedBy: string): CmsEvent {
  const events = getCmsEvents(false);
  const now = new Date().toISOString();

  let target: CmsEvent;
  if (eventData.id) {
    const idx = events.findIndex((e) => e.id === eventData.id);
    if (idx >= 0) {
      target = {
        ...events[idx],
        ...eventData,
        version: (events[idx].version || 1) + 1,
        updatedAt: now,
      };
      events[idx] = target;
      recordCmsAudit({
        action: "UPDATE",
        contentType: "EVENT",
        contentId: target.id,
        details: `Updated event: ${target.titleBn}`,
        performedBy,
      });
    } else {
      throw new Error(`Event not found: ${eventData.id}`);
    }
  } else {
    target = {
      id: `EVT-${Date.now().toString(36).toUpperCase()}`,
      titleBn: eventData.titleBn || "শিরোনামহীন অনুষ্ঠান",
      titleEn: eventData.titleEn,
      descriptionBn: eventData.descriptionBn || "",
      category: eventData.category || "GENERAL",
      eventDate: eventData.eventDate || new Date().toISOString().split("T")[0],
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      location: eventData.location || "মাদরাসা প্রাঙ্গণ",
      organizer: eventData.organizer || "মাদরাসা কর্তৃপক্ষ",
      status: eventData.status || "DRAFT",
      isPublic: eventData.isPublic ?? false,
      isPinned: eventData.isPinned ?? false,
      version: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: performedBy,
    };
    events.unshift(target);
    recordCmsAudit({
      action: "CREATE",
      contentType: "EVENT",
      contentId: target.id,
      details: `Created new event: ${target.titleBn}`,
      performedBy,
    });
  }

  writeJsonFile("events.json", events);
  return target;
}

export function archiveCmsEvent(eventId: string, performedBy: string): boolean {
  const events = getCmsEvents(false);
  const event = events.find((e) => e.id === eventId);
  if (!event) return false;

  event.status = "ARCHIVED";
  event.isPublic = false;
  event.updatedAt = new Date().toISOString();
  writeJsonFile("events.json", events);

  recordCmsAudit({
    action: "ARCHIVE",
    contentType: "EVENT",
    contentId: eventId,
    details: `Archived event: ${event.titleBn}`,
    performedBy,
  });
  return true;
}

// -------------------------------------------------------------
// 3. FAQS STORE
// -------------------------------------------------------------
const DEFAULT_FAQS: CmsFaq[] = [
  {
    id: "FAQ-001",
    questionBn: "মাদরাসায় ভর্তির বয়সসীমা এবং যোগ্যতা কী?",
    answerBn:
      "নূরানী ও নাযেরা বিভাগে ৪ থেকে ৮ বছর বয়সী শিশুদের ভর্তি নেওয়া হয়। হিফজ বিভাগে ভর্তির জন্য নাযেরা বিশুদ্ধ পড়া আবশ্যক। কিতাব বিভাগে পূর্ববর্তী জামাতের ফলাফল ও মৌখিক যাচাইয়ের ভিত্তিতে ভর্তি সম্পন্ন হয়।",
    category: "ADMISSION",
    order: 1,
    status: "PUBLISHED",
    isApproved: true,
    approvedBy: "PRINCIPAL",
    version: 1,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    createdBy: "ADMIN",
  },
  {
    id: "FAQ-002",
    questionBn: "লিল্লাহ বোর্ডিং ও এতিমখানায় কীভাবে সুবিধাপ্রাপ্ত হওয়া যায়?",
    answerBn:
      "অসহায়, এতিম ও দুস্থ পরিবারের মেধাবী শিক্ষার্থীদের অভিভাবকগণ প্রয়োজনীয় সনদপত্র (পিতার মৃত্যুসনদ/ইউপি চেয়ারম্যানের প্রত্যয়ন) সহ আবেদন করলে কর্তৃপক্ষ যাচাইপূর্বক ১০০% ফ্রি আবাসন ও খাবার সুবিধা অনুমোদন করে।",
    category: "RESIDENTIAL",
    order: 2,
    status: "PUBLISHED",
    isApproved: true,
    approvedBy: "PRINCIPAL",
    version: 1,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    createdBy: "ADMIN",
  },
  {
    id: "FAQ-003",
    questionBn: "অভিভাবকগণ কি ডিজিটাল পোর্টালে শিক্ষার্থীর উপস্থিতি ও ফলাফল দেখতে পারেন?",
    answerBn:
      "হ্যাঁ, আমাদের মাদরাসা সম্পূর্ণ ডিজিটাল ক্যাম্পাস। অভিভাবকগণ তাদের সংরক্ষিত ফোন নম্বর ও পাসওয়ার্ড দিয়ে অভিভাবক পোর্টেলে লগইন করে রিয়েল-টাইম উপস্থিতি, পরীক্ষার ফলাফল এবং ফি-এর হিসাব দেখতে পারেন।",
    category: "ACADEMIC",
    order: 3,
    status: "PUBLISHED",
    isApproved: true,
    approvedBy: "PRINCIPAL",
    version: 1,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    createdBy: "ADMIN",
  },
  {
    id: "FAQ-004",
    questionBn: "অনলাইনে কি যাকাত ও দান পাঠানো সম্ভব?",
    answerBn:
      "হ্যাঁ, আমাদের অফিসিয়াল অনলাইন ডোনেশন গেটওয়ে অথবা অনুমোদিত ডিজিটাল চ্যানেলের মাধ্যমে সরাসরি যেকোনো পরিমাণ যাকাত ও সাধারণ অনুদান প্রদান করা যায়। দান সম্পন্ন করার পর তাৎক্ষণিক ডিজিটাল রশিদ সংরক্ষণ করা সম্ভব।",
    category: "FEES",
    order: 4,
    status: "PUBLISHED",
    isApproved: true,
    approvedBy: "PRINCIPAL",
    version: 1,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    createdBy: "ADMIN",
  },
];

export function getCmsFaqs(onlyApproved = false): CmsFaq[] {
  const faqs = readJsonFile<CmsFaq[]>("faqs.json", DEFAULT_FAQS);
  if (onlyApproved) {
    return faqs.filter((f) => f.isApproved && f.status === "PUBLISHED").sort((a, b) => a.order - b.order);
  }
  return faqs.sort((a, b) => a.order - b.order);
}

export function saveCmsFaq(faqData: Partial<CmsFaq> & { id?: string }, performedBy: string): CmsFaq {
  const faqs = getCmsFaqs(false);
  const now = new Date().toISOString();

  let target: CmsFaq;
  if (faqData.id) {
    const idx = faqs.findIndex((f) => f.id === faqData.id);
    if (idx >= 0) {
      target = {
        ...faqs[idx],
        ...faqData,
        version: (faqs[idx].version || 1) + 1,
        updatedAt: now,
      };
      faqs[idx] = target;
      recordCmsAudit({
        action: "UPDATE",
        contentType: "FAQ",
        contentId: target.id,
        details: `Updated FAQ: ${target.questionBn}`,
        performedBy,
      });
    } else {
      throw new Error(`FAQ not found: ${faqData.id}`);
    }
  } else {
    target = {
      id: `FAQ-${Date.now().toString(36).toUpperCase()}`,
      questionBn: faqData.questionBn || "নতুন প্রশ্ন",
      questionEn: faqData.questionEn,
      answerBn: faqData.answerBn || "",
      answerEn: faqData.answerEn,
      category: faqData.category || "GENERAL",
      order: faqData.order || faqs.length + 1,
      status: faqData.status || "DRAFT",
      isApproved: faqData.isApproved ?? false,
      version: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: performedBy,
    };
    faqs.push(target);
    recordCmsAudit({
      action: "CREATE",
      contentType: "FAQ",
      contentId: target.id,
      details: `Created new FAQ: ${target.questionBn}`,
      performedBy,
    });
  }

  writeJsonFile("faqs.json", faqs);
  return target;
}

// -------------------------------------------------------------
// 4. DOWNLOADS STORE
// -------------------------------------------------------------
const DEFAULT_DOWNLOADS: CmsDownloadItem[] = [];
const LEGACY_DEMO_DOWNLOAD_IDS = new Set(["DL-001", "DL-002", "DL-003", "DL-004"]);

export function getCmsDownloads(onlyPublic = false): CmsDownloadItem[] {
  const downloads = readJsonFile<CmsDownloadItem[]>("downloads.json", DEFAULT_DOWNLOADS);
  if (onlyPublic) {
    return downloads.filter(
      (d) => !LEGACY_DEMO_DOWNLOAD_IDS.has(d.id) && d.isPublic && d.status === "PUBLISHED"
    );
  }
  return downloads;
}

export function saveCmsDownload(itemData: Partial<CmsDownloadItem> & { id?: string }, performedBy: string): CmsDownloadItem {
  const items = getCmsDownloads(false);
  const now = new Date().toISOString();

  let target: CmsDownloadItem;
  if (itemData.id) {
    const idx = items.findIndex((d) => d.id === itemData.id);
    if (idx >= 0) {
      target = {
        ...items[idx],
        ...itemData,
        updatedAt: now,
      };
      items[idx] = target;
      recordCmsAudit({
        action: "UPDATE",
        contentType: "DOWNLOAD",
        contentId: target.id,
        details: `Updated download item: ${target.titleBn}`,
        performedBy,
      });
    } else {
      throw new Error(`Download item not found: ${itemData.id}`);
    }
  } else {
    target = {
      id: `DL-${Date.now().toString(36).toUpperCase()}`,
      titleBn: itemData.titleBn || "শিরোনামহীন নথি",
      titleEn: itemData.titleEn,
      descriptionBn: itemData.descriptionBn || "",
      category: itemData.category || "OTHER",
      fileUrl: itemData.fileUrl || "/downloads/sample.pdf",
      fileType: itemData.fileType || "PDF",
      fileSizeBytes: itemData.fileSizeBytes || 500000,
      fileSizeDisplay: itemData.fileSizeDisplay || "৫০০ কিলোবাইট",
      versionString: itemData.versionString || "১.০",
      status: itemData.status || "DRAFT",
      isPublic: itemData.isPublic ?? false,
      downloadCount: 0,
      uploadedAt: now,
      updatedAt: now,
      createdBy: performedBy,
    };
    items.unshift(target);
    recordCmsAudit({
      action: "CREATE",
      contentType: "DOWNLOAD",
      contentId: target.id,
      details: `Created new download item: ${target.titleBn}`,
      performedBy,
    });
  }

  writeJsonFile("downloads.json", items);
  return target;
}

// -------------------------------------------------------------
// 5. GALLERY STORE WITH IMAGE CONSENT GUARD
// -------------------------------------------------------------
const DEFAULT_GALLERY: CmsGalleryItem[] = [
  {
    id: "GAL-001",
    titleBn: "নূরানী ও নাযেরা বিভাগের শ্রেণিকক্ষ",
    descriptionBn: "শৃঙ্খলাবদ্ধ পোশাকে আইডি কার্ড পরিহিত কোমলমতি শিক্ষার্থীরা ক্লাসে পাঠগ্রহণ করছে।",
    category: "CLASSROOM" as any,
    imageUrl: "/images/students-class.jpg",
    altText: "মাদরাসার শ্রেণিকক্ষে শিক্ষার্থীরা",
    consentVerified: true,
    consentReference: "CONSENT-INSTITUTIONAL-CLASSROOM-001",
    status: "PUBLISHED",
    isPublic: true,
    order: 1,
    uploadedAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    createdBy: "ADMIN",
  },
  {
    id: "GAL-002",
    titleBn: "জাতীয় ও দ্বীনি দিবসের বিশেষ সমাবেশ",
    descriptionBn: "জাতীয় পতাকা হাতে মাদরাসা প্রাঙ্গণে আনন্দঘন পরিবেশে ছাত্রদের সমাবেশ।",
    category: "EVENTS",
    imageUrl: "/images/students-celebration.jpg",
    altText: "কুরআনের বাগানে আপনাকে স্বাগতম - মাদরাসার ছাত্ররা",
    consentVerified: true,
    consentReference: "CONSENT-INSTITUTIONAL-PUBLIC-002",
    status: "PUBLISHED",
    isPublic: true,
    order: 2,
    uploadedAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    createdBy: "ADMIN",
  },
  {
    id: "GAL-003",
    titleBn: "মাদরাসা ক্যাম্পাস ও সুসজ্জিত শিক্ষার্থী",
    descriptionBn: "মাদরাসার অফিসিয়াল ব্যানার ও লোগোর সামনে সুশৃঙ্খল শিক্ষার্থী।",
    category: "CAMPUS",
    imageUrl: "/images/student-banner.jpg",
    altText: "মাদরাসার অফিসিয়াল ব্যানারের সামনে শিক্ষার্থী",
    consentVerified: true,
    consentReference: "CONSENT-INSTITUTIONAL-BANNER-003",
    status: "PUBLISHED",
    isPublic: true,
    order: 3,
    uploadedAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    createdBy: "ADMIN",
  },
];

export function getCmsGallery(onlyPublic = false): CmsGalleryItem[] {
  const items = readJsonFile<CmsGalleryItem[]>("gallery.json", DEFAULT_GALLERY);
  if (onlyPublic) {
    // SECURITY INVARIANT: Public gallery requires BOTH isPublic: true AND consentVerified: true
    return items.filter((g) => g.isPublic && g.consentVerified && g.status === "PUBLISHED").sort((a, b) => a.order - b.order);
  }
  return items.sort((a, b) => a.order - b.order);
}

export function saveCmsGalleryItem(itemData: Partial<CmsGalleryItem> & { id?: string }, performedBy: string): CmsGalleryItem {
  const items = getCmsGallery(false);
  const now = new Date().toISOString();

  let target: CmsGalleryItem;
  if (itemData.id) {
    const idx = items.findIndex((g) => g.id === itemData.id);
    if (idx >= 0) {
      target = {
        ...items[idx],
        ...itemData,
        updatedAt: now,
      };
      items[idx] = target;
      recordCmsAudit({
        action: "UPDATE",
        contentType: "GALLERY",
        contentId: target.id,
        details: `Updated gallery item: ${target.titleBn}`,
        performedBy,
      });
    } else {
      throw new Error(`Gallery item not found: ${itemData.id}`);
    }
  } else {
    target = {
      id: `GAL-${Date.now().toString(36).toUpperCase()}`,
      titleBn: itemData.titleBn || "শিরোনামহীন ছবি",
      descriptionBn: itemData.descriptionBn,
      category: itemData.category || "CAMPUS",
      imageUrl: itemData.imageUrl || "/images/sample.jpg",
      altText: itemData.altText || "মাদরাসা ক্যাম্পাস ছবি",
      consentVerified: itemData.consentVerified ?? false,
      consentReference: itemData.consentReference,
      status: itemData.status || "DRAFT",
      isPublic: itemData.isPublic ?? false,
      order: itemData.order || items.length + 1,
      uploadedAt: now,
      updatedAt: now,
      createdBy: performedBy,
    };
    items.push(target);
    recordCmsAudit({
      action: "CREATE",
      contentType: "GALLERY",
      contentId: target.id,
      details: `Created new gallery item: ${target.titleBn}`,
      performedBy,
    });
  }

  writeJsonFile("gallery.json", items);
  return target;
}

// -------------------------------------------------------------
// 6. HOMEPAGE CONFIGURATION
// -------------------------------------------------------------
const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  admissionState: "CLOSED",
  admissionAnnouncementBn: "ভর্তি বিজ্ঞপ্তি প্রকাশিত হলে এখানে হালনাগাদ তথ্য জানানো হবে।",
  sections: [
    { id: "hero", titleBn: "হিরো ব্যানার ও মোবারকবাদ", enabled: true, order: 1 },
    { id: "stats", titleBn: "প্রাতিষ্ঠানিক পরিসংখ্যান চার্ট", enabled: true, order: 2 },
    { id: "gallery", titleBn: "ক্যাম্পাস ও শিক্ষার্থী গ্যালারি", enabled: true, order: 3 },
    { id: "notices", titleBn: "নোটিশ বোর্ড ও লাইভ ঘোষণা", enabled: true, order: 4 },
    { id: "principal", titleBn: "মুহতামিম সাহেবের বাণী", enabled: true, order: 5 },
    { id: "departments", titleBn: "শিক্ষা বিভাগসমূহ ও কারিকুলাম", enabled: true, order: 6 },
    { id: "events", titleBn: "আসন্ন অনুষ্ঠান ও মাহফিল", enabled: true, order: 7 },
    { id: "donate", titleBn: "সদকা ও যাকাত ফান্ড আহ্বান", enabled: true, order: 8 },
    { id: "faq", titleBn: "সাধারণ প্রশ্নোত্তর (FAQ)", enabled: true, order: 9 },
    { id: "contact", titleBn: "যোগাযোগ ও ঠিকানা", enabled: true, order: 10 },
  ],
  version: 1,
  updatedAt: new Date().toISOString(),
  updatedBy: "SYSTEM_INITIALIZER",
};

export function getHomepageConfig(): HomepageConfig {
  return readJsonFile<HomepageConfig>("homepage_config.json", DEFAULT_HOMEPAGE_CONFIG);
}

export function saveHomepageConfig(config: Partial<HomepageConfig>, performedBy: string): HomepageConfig {
  const current = getHomepageConfig();
  const updated: HomepageConfig = {
    ...current,
    ...config,
    version: (current.version || 1) + 1,
    updatedAt: new Date().toISOString(),
    updatedBy: performedBy,
  };
  writeJsonFile("homepage_config.json", updated);

  recordCmsAudit({
    action: "UPDATE",
    contentType: "HOMEPAGE",
    contentId: "HOMEPAGE_SECTIONS",
    details: `Updated homepage section configuration (Admission state: ${updated.admissionState})`,
    performedBy,
  });

  return updated;
}

// -------------------------------------------------------------
// 7. SEO CONFIGURATION
// -------------------------------------------------------------
const DEFAULT_SEO_CONFIG: SeoConfig = {
  defaultTitleBn: `${INSTITUTION_INFO.nameBn} | অফিসিয়াল ডিজিটাল ক্যাম্পাস পোর্টাল`,
  defaultTitleEn: `${INSTITUTION_INFO.nameEn} | Official Digital Campus`,
  defaultDescriptionBn:
    "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা — কুমিল্লা জেলার অন্যতম শীর্ষস্থানীয় কওমি ও হাফিজিয়া দ্বীনি শিক্ষাপ্রতিষ্ঠান, এতিমখানা এবং ডিজিটাল ক্যাম্পাস।",
  canonicalBaseUrl: "https://www.ehrjmadrasha.com",
  ogImageUrl: "/images/student-banner.jpg",
  twitterCard: "summary_large_image",
  siteKeywords: [
    "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা",
    "Eliotganj Hazi Rohmatollah Jamiria Madrasha",
    "EHRJ Madrasha",
    "কওমি মাদরাসা কুমিল্লা",
    "হিফজুল কুরআন মাদরাসা দাউদকান্দি",
    "লিল্লাহ বোর্ডিং এতিমখানা",
    "দাওরায়ে হাদিস",
    "অনলাইন ভর্তি মাদরাসা",
  ],
  version: 1,
  updatedAt: new Date().toISOString(),
};

export function getSeoConfig(): SeoConfig {
  return readJsonFile<SeoConfig>("seo_config.json", DEFAULT_SEO_CONFIG);
}

export function saveSeoConfig(config: Partial<SeoConfig>, performedBy: string): SeoConfig {
  const current = getSeoConfig();
  const updated: SeoConfig = {
    ...current,
    ...config,
    version: (current.version || 1) + 1,
    updatedAt: new Date().toISOString(),
  };
  writeJsonFile("seo_config.json", updated);

  recordCmsAudit({
    action: "UPDATE",
    contentType: "SEO",
    contentId: "SEO_CONFIG",
    details: "Updated SEO meta configuration",
    performedBy,
  });

  return updated;
}

// -------------------------------------------------------------
// 8. DELETION & TOGGLE HELPERS
// -------------------------------------------------------------
export function deleteCmsEvent(id: string, performedBy: string): boolean {
  const events = getCmsEvents(false);
  const idx = events.findIndex((e) => e.id === id);
  if (idx === -1) return false;

  const [removed] = events.splice(idx, 1);
  writeJsonFile("events.json", events);

  recordCmsAudit({
    action: "DELETE",
    contentType: "EVENT",
    contentId: id,
    details: `Deleted event: ${removed.titleBn}`,
    performedBy,
  });
  return true;
}

export function deleteCmsFaq(id: string, performedBy: string): boolean {
  const faqs = getCmsFaqs(false);
  const idx = faqs.findIndex((f) => f.id === id);
  if (idx === -1) return false;

  const [removed] = faqs.splice(idx, 1);
  writeJsonFile("faqs.json", faqs);

  recordCmsAudit({
    action: "DELETE",
    contentType: "FAQ",
    contentId: id,
    details: `Deleted FAQ: ${removed.questionBn}`,
    performedBy,
  });
  return true;
}

export function toggleFaqApproval(id: string, performedBy: string): CmsFaq | null {
  const faqs = getCmsFaqs(false);
  const faq = faqs.find((f) => f.id === id);
  if (!faq) return null;

  faq.isApproved = !faq.isApproved;
  faq.status = faq.isApproved ? "PUBLISHED" : "DRAFT";
  faq.updatedAt = new Date().toISOString();
  writeJsonFile("faqs.json", faqs);

  recordCmsAudit({
    action: "UPDATE",
    contentType: "FAQ",
    contentId: id,
    details: `Toggled FAQ approval to: ${faq.isApproved}`,
    performedBy,
  });
  return faq;
}

export function deleteCmsDownload(id: string, performedBy: string): boolean {
  const downloads = getCmsDownloads(false);
  const idx = downloads.findIndex((d) => d.id === id);
  if (idx === -1) return false;

  const [removed] = downloads.splice(idx, 1);
  writeJsonFile("downloads.json", downloads);

  recordCmsAudit({
    action: "DELETE",
    contentType: "DOWNLOAD",
    contentId: id,
    details: `Deleted download item: ${removed.titleBn}`,
    performedBy,
  });
  return true;
}

export function deleteCmsGalleryItem(id: string, performedBy: string): boolean {
  const gallery = getCmsGallery(false);
  const idx = gallery.findIndex((g) => g.id === id);
  if (idx === -1) return false;

  const [removed] = gallery.splice(idx, 1);
  writeJsonFile("gallery.json", gallery);

  recordCmsAudit({
    action: "DELETE",
    contentType: "GALLERY",
    contentId: id,
    details: `Deleted gallery image: ${removed.titleBn}`,
    performedBy,
  });
  return true;
}
