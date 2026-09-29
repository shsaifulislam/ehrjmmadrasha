/**
 * EHRJ Institutional Student Life, Events & Activities Datastore
 * Checkpoint: EHRJ-AI-2026-PHASE35
 * Atomic JSON persistence for event master, types, registrations, attendance, results, certificates, feedback & audit logs.
 */

import fs from "fs";
import path from "path";
import {
  InstitutionalEvent,
  EventTypeConfig,
  EventRegistration,
  EventAttendanceRecord,
  EventCompetitionResult,
  EventCertificateLink,
  EventFeedback,
  EventAuditEntry,
} from "./types";

const EVENTS_DIR = path.join(process.cwd(), "data", "events");

const EVENTS_FILE = path.join(EVENTS_DIR, "events.json");
const TYPES_FILE = path.join(EVENTS_DIR, "event_types.json");
const REGISTRATIONS_FILE = path.join(EVENTS_DIR, "registrations.json");
const ATTENDANCE_FILE = path.join(EVENTS_DIR, "attendance.json");
const RESULTS_FILE = path.join(EVENTS_DIR, "results.json");
const CERTIFICATES_FILE = path.join(EVENTS_DIR, "certificates.json");
const FEEDBACK_FILE = path.join(EVENTS_DIR, "feedback.json");
const AUDIT_FILE = path.join(EVENTS_DIR, "audit_log.json");

function ensureDirectory(): void {
  if (!fs.existsSync(EVENTS_DIR)) {
    fs.mkdirSync(EVENTS_DIR, { recursive: true });
  }
}

function safeRead<T>(filePath: string, fallback: T): T {
  try {
    ensureDirectory();
    if (!fs.existsSync(filePath)) {
      safeWrite(filePath, fallback);
      return fallback;
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[EventStore] Read error on ${filePath}:`, err);
    return fallback;
  }
}

function safeWrite<T>(filePath: string, data: T): void {
  try {
    ensureDirectory();
    const tempFile = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 6)}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempFile, filePath);
  } catch (err) {
    console.error(`[EventStore] Write error on ${filePath}:`, err);
  }
}

// -------------------------------------------------------------
// DEFAULT SEED EVENT TYPES
// -------------------------------------------------------------

export const DEFAULT_EVENT_TYPES: EventTypeConfig[] = [
  {
    id: "TYPE-01",
    code: "QURAN_COMPETITION",
    nameBn: "কুরআন হিফজ ও হুসনে সওত প্রতিযোগিতা",
    nameEn: "Quran Hifz & Tilawat Competition",
    descriptionBn: "হিফজুল কুরআন এবং সহিহ সুন্দর তিলাওয়াতের বার্ষিক অভ্যন্তরীণ প্রতিযোগিতা",
    isCompetitive: true,
    requiresRegistration: true,
    requiresAttendance: true,
    awardsCertificates: true,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "TYPE-02",
    code: "HADITH_COMPETITION",
    nameBn: "হাদিস পাঠ ও মুখস্থ প্রতিযোগিতা",
    nameEn: "Hadith Memorization Competition",
    descriptionBn: "নির্বাচিত ৪০ হাদিস ও মিশকাতুল মাসাবিহ হাদিস পাঠ প্রতিযোগিতা",
    isCompetitive: true,
    requiresRegistration: true,
    requiresAttendance: true,
    awardsCertificates: true,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "TYPE-03",
    code: "DEBATE_SPEECH",
    nameBn: "বিতর্ক ও আরবি/বাংলা উপস্থিত বক্তৃতা",
    nameEn: "Debate & Extempore Speech",
    descriptionBn: "শিক্ষার্থীদের ভাষার দখল ও যুক্তিনির্ভর উপস্থাপনা দক্ষতা উন্নয়ন",
    isCompetitive: true,
    requiresRegistration: true,
    requiresAttendance: true,
    awardsCertificates: true,
    isActive: true,
    sortOrder: 3,
  },
  {
    id: "TYPE-04",
    code: "PRIZE_GIVING",
    nameBn: "দস্তারবন্দী ও বার্ষিক পুরস্কার বিতরণী",
    nameEn: "Dastarbandi Convocation & Prize Giving",
    descriptionBn: "কৃতি শিক্ষার্থীদের সম্মাননা, পাগড়ী প্রদান ও বার্ষিক পুরস্কার বিতরণী মহাসম্মেলন",
    isCompetitive: false,
    requiresRegistration: false,
    requiresAttendance: true,
    awardsCertificates: true,
    isActive: true,
    sortOrder: 4,
  },
  {
    id: "TYPE-05",
    code: "ACADEMIC_PROGRAM",
    nameBn: "প্রাতিষ্ঠানিক সেমিনার ও কর্মশালা",
    nameEn: "Institutional Seminar & Workshop",
    descriptionBn: "শিক্ষাবিদ ও উলামায়ে কেরামের পরিচালনায় বিশেষ কর্মশালা",
    isCompetitive: false,
    requiresRegistration: true,
    requiresAttendance: true,
    awardsCertificates: true,
    isActive: true,
    sortOrder: 5,
  },
  {
    id: "TYPE-06",
    code: "PARENT_MEETING",
    nameBn: "অভিভাবক সমাবেশ ও কাউন্সিলিং",
    nameEn: "Parent-Guardian Assembly",
    descriptionBn: "শিক্ষার্থীদের সার্বিক অগ্রগতি ও দ্বীনি তারবিয়াত বিষয়ক মতবিনিময়",
    isCompetitive: false,
    requiresRegistration: true,
    requiresAttendance: true,
    awardsCertificates: false,
    isActive: true,
    sortOrder: 6,
  },
  {
    id: "TYPE-07",
    code: "SPORTS_GAMES",
    nameBn: "বার্ষিক ক্রীড়া ও শারীরিক কসরত",
    nameEn: "Annual Sports & Physical Athletics",
    descriptionBn: "শিক্ষার্থীদের শারীরিক সুস্থতা ও উদ্দীপনামূলক ক্রীড়া উৎসব",
    isCompetitive: true,
    requiresRegistration: true,
    requiresAttendance: true,
    awardsCertificates: true,
    isActive: true,
    sortOrder: 7,
  },
  {
    id: "TYPE-08",
    code: "VOLUNTEER_COMMUNITY",
    nameBn: "সমাজসেবা ও স্বেচ্ছাসেবী কার্যক্রম",
    nameEn: "Community Service & Volunteering",
    descriptionBn: "পরিচ্ছন্নতা অভিযান, বৃক্ষরোপণ ও সমাজকল্যাণমূলক প্রাতিষ্ঠানিক কার্যক্রম",
    isCompetitive: false,
    requiresRegistration: true,
    requiresAttendance: true,
    awardsCertificates: true,
    isActive: true,
    sortOrder: 8,
  },
  {
    id: "TYPE-09",
    code: "OTHER",
    nameBn: "অন্যান্য প্রাতিষ্ঠানিক আয়োজন",
    nameEn: "Other Institutional Event",
    descriptionBn: "বিশেষ আয়োজন ও ধর্মীয় সমাবেশ",
    isCompetitive: false,
    requiresRegistration: false,
    requiresAttendance: false,
    awardsCertificates: false,
    isActive: true,
    sortOrder: 9,
  },
];

// -------------------------------------------------------------
// DEFAULT SEED EVENTS
// -------------------------------------------------------------

export const DEFAULT_EVENTS: InstitutionalEvent[] = [
  {
    id: "EHRJ-EVT-2026-000001",
    typeCode: "QURAN_COMPETITION",
    titleBn: "বার্ষিক কেন্দ্রীয় কুরআন হিফজ ও হুসনে সওত প্রতিযোগিতা ২০২৬",
    titleEn: "Annual Quran Memorization & Recitation Championship 2026",
    titleAr: "مسابقة تحفيظ القرآن الكريم وحسن التلاوة السنوية",
    descriptionBn: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার সকল বিভাগের শিক্ষার্থীদের অংশগ্রহণে বার্ষিক হিফজ ও সহিহ তিলাওয়াত প্রতিযোগিতা। দেশবরেণ্য ক্বারীগণ বিচারক হিসেবে উপস্থিত থাকবেন।",
    organizer: "কুরআন শিক্ষা ও তিলাওয়াত বিভাগ, EHRJ",
    sessionId: "SESSION-2026",
    sessionName: "২০২৬ শিক্ষাবর্ষ",
    audienceRule: {
      audienceTypes: ["ALL_STUDENTS", "BOYS_ONLY"],
      genders: ["MALE"],
    },
    startAt: "2026-10-15T09:00:00.000Z",
    endAt: "2026-10-15T17:00:00.000Z",
    registrationOpensAt: "2026-09-01T00:00:00.000Z",
    registrationClosesAt: "2026-10-10T23:59:59.000Z",
    venueText: "দারুল হাদিস অডিটোরিয়াম, প্রধান একাডেমি ভবন",
    resourceId: "RES-001",
    calendarEventId: "EVT-CAL-2026-000001",
    isRegistrationRequired: true,
    maxCapacity: 100,
    registeredCount: 2,
    waitlistCapacity: 20,
    waitlistedCount: 0,
    isPublic: true,
    status: "REGISTRATION_OPEN",
    leadTeacherId: "TEACHER-001",
    assignedTeacherIds: ["TEACHER-001", "TEACHER-002"],
    hasFee: false,
    version: 1,
    instructionsBn: "অংশগ্রহণকারী ছাত্রদের অবশ্যই নির্ধারিত সময় অনুযায়ী উপস্থিত হয়ে মঞ্চে উপস্থিত থাকতে হবে। তিলাওয়াতের জন্য নির্ধারিত পারা অনুযায়ী বিচারকগণ প্রশ্ন করবেন।",
    contactPhone: "+8801712345678",
    createdAt: "2026-09-01T00:00:00.000Z",
    createdBy: "admin@ehrj.edu.bd",
    updatedAt: "2026-09-01T00:00:00.000Z",
    updatedBy: "admin@ehrj.edu.bd",
  },
  {
    id: "EHRJ-EVT-2026-000002",
    typeCode: "DEBATE_SPEECH",
    titleBn: "আন্তঃবিভাগ বাংলা ও আরবি বিতর্ক প্রতিযোগিতা ২০২৬",
    titleEn: "Inter-Department Bangla & Arabic Debate Competition 2026",
    descriptionBn: "শিক্ষার্থীদের সমসাময়িক যুক্তি ও জ্ঞান বিকাশের লক্ষ্যে বার্ষিক প্রাতিষ্ঠানিক বিতর্ক প্রতিযোগিতা।",
    organizer: "সাহিত্য ও বিতর্ক পরিষদ, EHRJ",
    sessionId: "SESSION-2026",
    sessionName: "২০২৬ শিক্ষাবর্ষ",
    audienceRule: {
      audienceTypes: ["SPECIFIC_CLASS"],
    },
    startAt: "2026-11-05T10:00:00.000Z",
    endAt: "2026-11-05T15:30:00.000Z",
    registrationOpensAt: "2026-09-15T00:00:00.000Z",
    registrationClosesAt: "2026-10-25T23:59:59.000Z",
    venueText: "কেন্দ্রীয় সম্মেলন কক্ষ",
    resourceId: "RES-002",
    isRegistrationRequired: true,
    maxCapacity: 40,
    registeredCount: 0,
    waitlistCapacity: 10,
    waitlistedCount: 0,
    isPublic: true,
    status: "REGISTRATION_OPEN",
    leadTeacherId: "TEACHER-003",
    hasFee: false,
    version: 1,
    instructionsBn: "বিতর্কের বিষয়সমূহ রেজিস্ট্রেশন চূড়ান্ত হওয়ার পর অংশগ্রহণকারী দলসমূহের নিকট সরবরাহ করা হবে।",
    createdAt: "2026-09-15T00:00:00.000Z",
    createdBy: "admin@ehrj.edu.bd",
    updatedAt: "2026-09-15T00:00:00.000Z",
    updatedBy: "admin@ehrj.edu.bd",
  },
  {
    id: "EHRJ-EVT-2026-000003",
    typeCode: "PRIZE_GIVING",
    titleBn: "বার্ষিক দস্তারবন্দী ও হিফজ সমাপনী মহাসম্মেলন ২০২৬",
    titleEn: "Annual Dastarbandi Convocation & Prize Giving Ceremony 2026",
    descriptionBn: "হিফজুল কুরআন সমাপ্তকারী কৃতি শিক্ষার্থীদের সম্মানসূচক দস্তার (পাগড়ী) প্রদান, বার্ষিক পরীক্ষার পুরস্কার বিতরণ ও সার্বজনীন দোয়া মাহফিল।",
    organizer: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা এন্তেজামিয়া কমিটি",
    sessionId: "SESSION-2026",
    sessionName: "২০২৬ শিক্ষাবর্ষ",
    audienceRule: {
      audienceTypes: ["ALL_STUDENTS", "GUARDIANS", "TEACHERS", "PUBLIC"],
    },
    startAt: "2026-11-20T09:00:00.000Z",
    endAt: "2026-11-20T17:00:00.000Z",
    venueText: "মাদরাসা প্রাঙ্গণ ও অডিটোরিয়াম",
    resourceId: "RES-001",
    isRegistrationRequired: false,
    maxCapacity: 600,
    registeredCount: 0,
    waitlistCapacity: 0,
    waitlistedCount: 0,
    isPublic: true,
    status: "PUBLISHED",
    hasFee: false,
    version: 1,
    contactPhone: "+8801712345678",
    createdAt: "2026-09-10T00:00:00.000Z",
    createdBy: "admin@ehrj.edu.bd",
    updatedAt: "2026-09-10T00:00:00.000Z",
    updatedBy: "admin@ehrj.edu.bd",
  },
];

// -------------------------------------------------------------
// STORE METHODS
// -------------------------------------------------------------

export function getEvents(): InstitutionalEvent[] {
  return safeRead<InstitutionalEvent[]>(EVENTS_FILE, DEFAULT_EVENTS);
}

export function saveEvents(events: InstitutionalEvent[]): void {
  safeWrite(EVENTS_FILE, events);
}

export function getEventById(id: string): InstitutionalEvent | null {
  const events = getEvents();
  return events.find((e) => e.id === id) || null;
}

export function getEventTypes(): EventTypeConfig[] {
  return safeRead<EventTypeConfig[]>(TYPES_FILE, DEFAULT_EVENT_TYPES);
}

export function saveEventTypes(types: EventTypeConfig[]): void {
  safeWrite(TYPES_FILE, types);
}

export function getRegistrations(): EventRegistration[] {
  return safeRead<EventRegistration[]>(REGISTRATIONS_FILE, []);
}

export function saveRegistrations(registrations: EventRegistration[]): void {
  safeWrite(REGISTRATIONS_FILE, registrations);
}

export function getAttendanceRecords(): EventAttendanceRecord[] {
  return safeRead<EventAttendanceRecord[]>(ATTENDANCE_FILE, []);
}

export function saveAttendanceRecords(records: EventAttendanceRecord[]): void {
  safeWrite(ATTENDANCE_FILE, records);
}

export function getCompetitionResults(): EventCompetitionResult[] {
  return safeRead<EventCompetitionResult[]>(RESULTS_FILE, []);
}

export function saveCompetitionResults(results: EventCompetitionResult[]): void {
  safeWrite(RESULTS_FILE, results);
}

export function getCertificateLinks(): EventCertificateLink[] {
  return safeRead<EventCertificateLink[]>(CERTIFICATES_FILE, []);
}

export function saveCertificateLinks(links: EventCertificateLink[]): void {
  safeWrite(CERTIFICATES_FILE, links);
}

export function getEventFeedbacks(): EventFeedback[] {
  return safeRead<EventFeedback[]>(FEEDBACK_FILE, []);
}

export function saveEventFeedbacks(feedbacks: EventFeedback[]): void {
  safeWrite(FEEDBACK_FILE, feedbacks);
}

export function getEventAuditLog(): EventAuditEntry[] {
  return safeRead<EventAuditEntry[]>(AUDIT_FILE, []);
}

export function appendEventAudit(entry: Omit<EventAuditEntry, "id" | "timestamp">): void {
  const log = getEventAuditLog();
  const newEntry: EventAuditEntry = {
    ...entry,
    id: `AUD-EVT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    timestamp: new Date().toISOString(),
  };
  log.unshift(newEntry);
  if (log.length > 1000) log.length = 1000;
  safeWrite(AUDIT_FILE, log);
}
