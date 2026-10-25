/**
 * EHRJ Institutional Calendar Datastore
 * Checkpoint: EHRJ-AI-2026-PHASE33
 * Persistent atomic JSON storage with pre-seeded institutional resources, holidays, and routines
 */

import fs from "fs";
import path from "path";
import { atomicWriteFileSync } from "@/lib/storageUtils";
import {
  CalendarEvent,
  ClassRoutineSlot,
  InstitutionalHoliday,
  InstitutionalResource,
  ResourceBooking,
  InternalMeeting,
  ScheduleReminder,
  CalendarAuditEntry,
} from "./types";

const CALENDAR_DATA_DIR = path.join(process.cwd(), "data", "calendar");

const EVENTS_FILE = path.join(CALENDAR_DATA_DIR, "calendar_events.json");
const ROUTINES_FILE = path.join(CALENDAR_DATA_DIR, "class_routines.json");
const HOLIDAYS_FILE = path.join(CALENDAR_DATA_DIR, "holidays.json");
const RESOURCES_FILE = path.join(CALENDAR_DATA_DIR, "resources.json");
const BOOKINGS_FILE = path.join(CALENDAR_DATA_DIR, "bookings.json");
const MEETINGS_FILE = path.join(CALENDAR_DATA_DIR, "meetings.json");
const REMINDERS_FILE = path.join(CALENDAR_DATA_DIR, "reminders.json");
const AUDIT_FILE = path.join(CALENDAR_DATA_DIR, "audit_log.json");

function ensureDirectory() {
  if (!fs.existsSync(CALENDAR_DATA_DIR)) {
    fs.mkdirSync(CALENDAR_DATA_DIR, { recursive: true });
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
    console.error(`[CalendarStore] Read error on ${filePath}:`, err);
    return fallback;
  }
}

function safeWrite<T>(filePath: string, data: T): void {
  try {
    atomicWriteFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`[CalendarStore] Write error on ${filePath}:`, err);
  }
}

// -------------------------------------------------------------
// DEFAULT SEED DATA
// -------------------------------------------------------------

const DEFAULT_RESOURCES: InstitutionalResource[] = [
  {
    id: "RES-001",
    nameBn: "দারুল হাদিস অডিটোরিয়াম",
    nameEn: "Darul Hadith Auditorium",
    type: "AUDITORIUM",
    capacity: 450,
    location: "প্রধান একাডেমি ভবন, ২য় তলা",
    status: "AVAILABLE",
    isExclusive: true,
    requiresApproval: true,
    description: "প্রধান অডিটোরিয়াম ও প্রাতিষ্ঠানিক সম্মেলন কক্ষ, উন্নত সাউন্ড সিস্টেম সম্বলিত",
    equipment: ["সাউন্ড সিস্টেম", "ওয়্যারলেস মাইক্রোফোন", "প্রজেক্টর ও স্ক্রিন", "পডিয়াম"],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "RES-002",
    nameBn: "কেন্দ্রীয় শিক্ষক ও প্রশাসনিক সম্মেলন কক্ষ",
    nameEn: "Central Faculty & Admin Conference Room",
    type: "MEETING_ROOM",
    capacity: 35,
    location: "প্রশাসনিক ভবন, ১ম তলা",
    status: "AVAILABLE",
    isExclusive: true,
    requiresApproval: true,
    description: "মুহতামিম ও শিক্ষক পরিষদের যৌথ বৈঠকের জন্য শীতাতপ নিয়ন্ত্রিত মিটিং রুম",
    equipment: ["কনফারেন্স টেবিল", "হোয়াইটবোর্ড", "ডিজিটাল ডিসপ্লে", "ভিডিও কনফারেন্সিং ক্যামেরা"],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "RES-003",
    nameBn: "কম্পিউটার ও ডিজিটাল শিক্ষা ল্যাব",
    nameEn: "Computer & Digital Learning Lab",
    type: "LAB",
    capacity: 40,
    location: "একাডেমিক ভবন, ৩য় তলা",
    status: "AVAILABLE",
    isExclusive: true,
    requiresApproval: true,
    description: "আইসিটি ও আধুনিক ডিজিটাল শিক্ষা কার্যক্রমে ব্যবহারের জন্য কম্পিউটার ল্যাব",
    equipment: ["৩০টি ডেস্কটপ কম্পিউটার", "হাই-স্পিড ব্রডব্যান্ড", "প্রজেক্টর", "ইউপিএস ব্যাকআপ"],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "RES-004",
    nameBn: "মুভেবল ডিজিটাল প্রজেক্টর ইউনিট-১",
    nameEn: "Portable Digital Projector Unit 1",
    type: "PROJECTOR",
    capacity: 1,
    location: "মিডিয়া ও আইসিটি শাখা",
    status: "AVAILABLE",
    isExclusive: true,
    requiresApproval: false,
    description: "যেকোনো শ্রেণিকক্ষে প্রেজেন্টেশন ও বিশেষ ক্লাসের জন্য স্থানান্তরযোগ্য প্রজেক্টর",
    equipment: ["HD Projector", "HDMI/Type-C Cables", "Portable Screen", "Extension Cord"],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "RES-005",
    nameBn: "কুতুবখানা কেন্দ্রীয় অধ্যয়ন হল",
    nameEn: "Central Library Study Hall",
    type: "MEETING_ROOM",
    capacity: 90,
    location: "কুতুবখানা ভবন, নীচতলা",
    status: "AVAILABLE",
    isExclusive: false,
    requiresApproval: true,
    description: "কিতাব অধ্যয়ন, মুতালাআ ও কিতাব প্রদর্শনী অনুষ্ঠানের জন্য উন্মুক্ত হল",
    equipment: ["অধ্যয়ন ডেস্ক", "রেফারেন্স কিতাবের তাকসমূহ", "পর্যাপ্ত আলোকসজ্জা"],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const DEFAULT_HOLIDAYS: InstitutionalHoliday[] = [];
const LEGACY_DEMO_HOLIDAY_IDS = new Set([
  "HOL-2026-001",
  "HOL-2026-002",
  "HOL-2026-003",
  "HOL-2026-004",
  "HOL-2026-005",
  "HOL-2026-006",
  "HOL-2026-007",
]);
const DEFAULT_CALENDAR_EVENTS: CalendarEvent[] = [];
const LEGACY_DEMO_EVENT_IDS = new Set([
  "CAL-EVT-2026-0001",
  "CAL-EVT-2026-0002",
  "CAL-EVT-2026-0003",
]);

// -------------------------------------------------------------
// STORE METHODS
// -------------------------------------------------------------

export function getCalendarEvents(): CalendarEvent[] {
  return safeRead<CalendarEvent[]>(EVENTS_FILE, DEFAULT_CALENDAR_EVENTS).filter(
    (event) => !LEGACY_DEMO_EVENT_IDS.has(event.id)
  );
}

export function saveCalendarEvents(events: CalendarEvent[]): void {
  safeWrite(EVENTS_FILE, events);
}

export function getClassRoutineSlots(): ClassRoutineSlot[] {
  return safeRead<ClassRoutineSlot[]>(ROUTINES_FILE, []);
}

export function saveClassRoutineSlots(slots: ClassRoutineSlot[]): void {
  safeWrite(ROUTINES_FILE, slots);
}

export function getInstitutionalHolidays(): InstitutionalHoliday[] {
  return safeRead<InstitutionalHoliday[]>(HOLIDAYS_FILE, DEFAULT_HOLIDAYS);
}

export function getPublicInstitutionalHolidays(): InstitutionalHoliday[] {
  return getInstitutionalHolidays().filter(
    (holiday) => holiday.isPublic && !LEGACY_DEMO_HOLIDAY_IDS.has(holiday.id)
  );
}

export function saveInstitutionalHolidays(holidays: InstitutionalHoliday[]): void {
  safeWrite(HOLIDAYS_FILE, holidays);
}

export function getInstitutionalResources(): InstitutionalResource[] {
  return safeRead<InstitutionalResource[]>(RESOURCES_FILE, DEFAULT_RESOURCES);
}

export function saveInstitutionalResources(resources: InstitutionalResource[]): void {
  safeWrite(RESOURCES_FILE, resources);
}

export function getResourceBookings(): ResourceBooking[] {
  return safeRead<ResourceBooking[]>(BOOKINGS_FILE, []);
}

export function saveResourceBookings(bookings: ResourceBooking[]): void {
  safeWrite(BOOKINGS_FILE, bookings);
}

export function getInternalMeetings(): InternalMeeting[] {
  return safeRead<InternalMeeting[]>(MEETINGS_FILE, []);
}

export function saveInternalMeetings(meetings: InternalMeeting[]): void {
  safeWrite(MEETINGS_FILE, meetings);
}

export function getScheduleReminders(): ScheduleReminder[] {
  return safeRead<ScheduleReminder[]>(REMINDERS_FILE, []);
}

export function saveScheduleReminders(reminders: ScheduleReminder[]): void {
  safeWrite(REMINDERS_FILE, reminders);
}

export function getCalendarAuditLog(): CalendarAuditEntry[] {
  return safeRead<CalendarAuditEntry[]>(AUDIT_FILE, []);
}

export function appendCalendarAuditLog(entry: Omit<CalendarAuditEntry, "id" | "timestamp">): void {
  const log = getCalendarAuditLog();
  const record: CalendarAuditEntry = {
    ...entry,
    id: `AUD-CAL-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    timestamp: new Date().toISOString(),
  };
  log.unshift(record);
  if (log.length > 500) log.length = 500;
  safeWrite(AUDIT_FILE, log);
}
