/**
 * EHRJ Alumni, Former Student & Community Relationship Datastore
 * Checkpoint: EHRJ-AI-2026-PHASE36
 * Atomic JSON storage for alumni profiles, groups, volunteering, mentorship, contributions, imports & audit.
 */

import fs from "fs";
import path from "path";
import {
  AlumniProfile,
  AlumniGroup,
  AlumniGroupMembership,
  AlumniVolunteerOpportunity,
  AlumniVolunteerApplication,
  AlumniMentorshipProfile,
  AlumniMentorshipRequest,
  AlumniContribution,
  AlumniImportBatch,
  AlumniAuditEntry,
} from "./types";

const ALUMNI_DIR = path.join(process.cwd(), "data", "alumni");

const PROFILES_FILE = path.join(ALUMNI_DIR, "alumni_profiles.json");
const GROUPS_FILE = path.join(ALUMNI_DIR, "alumni_groups.json");
const MEMBERSHIPS_FILE = path.join(ALUMNI_DIR, "alumni_group_memberships.json");
const OPPORTUNITIES_FILE = path.join(ALUMNI_DIR, "alumni_volunteer_opportunities.json");
const APPLICATIONS_FILE = path.join(ALUMNI_DIR, "alumni_volunteer_applications.json");
const MENTORSHIP_PROFILES_FILE = path.join(ALUMNI_DIR, "alumni_mentorship_profiles.json");
const MENTORSHIP_REQUESTS_FILE = path.join(ALUMNI_DIR, "alumni_mentorship_requests.json");
const CONTRIBUTIONS_FILE = path.join(ALUMNI_DIR, "alumni_contributions.json");
const IMPORTS_FILE = path.join(ALUMNI_DIR, "alumni_import_batches.json");
const AUDIT_FILE = path.join(ALUMNI_DIR, "alumni_audit_log.json");

function ensureDirectory(): void {
  if (!fs.existsSync(ALUMNI_DIR)) {
    fs.mkdirSync(ALUMNI_DIR, { recursive: true });
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
    console.error(`[AlumniStore] Read error on ${filePath}:`, err);
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
    console.error(`[AlumniStore] Write error on ${filePath}:`, err);
  }
}

// -------------------------------------------------------------
// DEFAULT SEED PROFILES
// -------------------------------------------------------------

export const DEFAULT_ALUMNI_PROFILES: AlumniProfile[] = [
  {
    id: "EHRJ-ALM-2024-000001",
    relationshipType: "COMPLETED_GRADUATE",
    status: "ACTIVE",
    isVerified: true,
    studentId: "EHRJ-2021-00101",
    studentIdNumber: "EHRJ-2021-00101",
    isLegacy: false,
    admissionYear: 2018,
    completionYear: 2024,
    passOutYear: 2024,
    department: "Kitab",
    lastSessionName: "২০২৩-২০২৪ শিক্ষাবর্ষ",
    lastClassNameBn: "দাওরায়ে হাদিস (তাকমীল)",
    fullNameBn: "মাওলানা হাফেজ মাহমুদ হাসান",
    fullNameEn: "Maulana Hafiz Mahmud Hasan",
    email: "mahmud.alumni@ehrj.edu.bd",
    phone: "01711223344",
    currentCity: "ঢাকা",
    currentCountry: "বাংলাদেশ",
    bioBn: "ইলিয়টগঞ্জ মাদরাসা থেকে দাওরায়ে হাদিস সমাপনান্তে বর্তমানে বায়তুল আমান জামে মসজিদে খতিব হিসেবে দায়িত্ব পালন করছি।",
    profession: "ইমাম ও খতিব",
    currentProfession: "ইমাম ও খতিব",
    organization: "বায়তুল আমান জামে মসজিদ, ধানমন্ডি",
    currentOrganization: "বায়তুল আমান জামে মসজিদ, ধানমন্ডি",
    designation: "খতিব ও সিনিয়র শিক্ষক",
    highestDegree: "দাওরায়ে হাদিস (মাস্টার্স সমমান)",
    skills: ["হাদিস গবেষণা", "কিরাত", "আরবি বক্তৃতা", "পরামর্শদান"],
    socialLinks: {
      linkedin: "https://linkedin.com/in/mahmud-hasan-ehrj",
      facebook: "https://facebook.com/mahmud.hasan.ehrj",
    },
    privacy: {
      isProfilePublic: true,
      showEmail: false,
      showPhone: false,
      showLocation: true,
      showProfession: true,
      showInDirectory: true,
      allowMentorshipContact: true,
      allowEventInvites: true,
      allowNewsletter: true,
      showInPublicDirectory: true,
      allowDirectContact: true,
      sharePhoneWithApprovedAlumni: false,
      shareEmailWithApprovedAlumni: false,
      allowMentorshipRequests: true,
    },
    privacyPreferences: {
      showInPublicDirectory: true,
      allowDirectContact: true,
      sharePhoneWithApprovedAlumni: false,
      shareEmailWithApprovedAlumni: false,
      allowMentorshipRequests: true,
    },
    verifiedAt: "2024-07-15T10:00:00.000Z",
    verifiedByUserId: "admin-system",
    verificationNotes: "দাওরায়ে হাদিস ২০২৪ ব্যাচের প্রাতিষ্ঠানিক সনদ যাচাইকৃত।",
    volunteerHoursTotal: 15,
    mentorshipSessionsCount: 3,
    eventsAttendedCount: 4,
    contributionsTotalBdt: 12000,
    version: 1,
    createdAt: "2024-07-01T00:00:00.000Z",
    updatedAt: "2024-07-15T00:00:00.000Z",
  },
  {
    id: "EHRJ-ALM-2023-000002",
    relationshipType: "HIFZ_COMPLETED",
    status: "ACTIVE",
    isVerified: true,
    studentId: "EHRJ-2020-00085",
    studentIdNumber: "EHRJ-2020-00085",
    isLegacy: false,
    admissionYear: 2019,
    completionYear: 2023,
    passOutYear: 2023,
    department: "Hifz",
    lastSessionName: "২০২২-২০২৩ শিক্ষাবর্ষ",
    lastClassNameBn: "হিফজ সমাপনী",
    fullNameBn: "হাফেজ তানভীর আহমেদ",
    fullNameEn: "Hafiz Tanvir Ahmed",
    email: "tanvir.hifz@gmail.com",
    phone: "01822334455",
    currentCity: "কুমিল্লা",
    currentCountry: "বাংলাদেশ",
    bioBn: "২০২৩ সালে ইলিয়টগঞ্জ মাদরাসা থেকে ৩০ পারা হিফজ সম্পন্ন করেছি। বর্তমানে তাখাসসুস ফিল কিরাতে অধ্যয়নরত।",
    profession: "হিফজ শিক্ষক ও ক্বারী",
    currentProfession: "হিফজ শিক্ষক ও ক্বারী",
    organization: "মাদরাসাতুল কুরআন",
    currentOrganization: "মাদরাসাতুল কুরআন",
    designation: "সহকারী শিক্ষক",
    highestDegree: "হিফজুল কুরআন সনদ",
    skills: ["তাজবীদ ও কিরাত", "হিফজুল কুরআন", "শিশু তালিম"],
    privacy: {
      isProfilePublic: true,
      showEmail: false,
      showPhone: false,
      showLocation: true,
      showProfession: true,
      showInDirectory: true,
      allowMentorshipContact: true,
      allowEventInvites: true,
      allowNewsletter: true,
      showInPublicDirectory: true,
      allowDirectContact: true,
      sharePhoneWithApprovedAlumni: false,
      shareEmailWithApprovedAlumni: false,
      allowMentorshipRequests: true,
    },
    privacyPreferences: {
      showInPublicDirectory: true,
      allowDirectContact: true,
      sharePhoneWithApprovedAlumni: false,
      shareEmailWithApprovedAlumni: false,
      allowMentorshipRequests: true,
    },
    verifiedAt: "2023-08-20T11:00:00.000Z",
    verifiedByUserId: "admin-system",
    verificationNotes: "হিফজ সমাপনী সনদপত্র ও দস্তারবন্দী নথি যাচাইকৃত।",
    volunteerHoursTotal: 25,
    mentorshipSessionsCount: 6,
    eventsAttendedCount: 5,
    contributionsTotalBdt: 5000,
    version: 1,
    createdAt: "2023-08-10T00:00:00.000Z",
    updatedAt: "2023-08-20T00:00:00.000Z",
  },
];

// -------------------------------------------------------------
// DEFAULT SEED GROUPS
// -------------------------------------------------------------

export const DEFAULT_ALUMNI_GROUPS: AlumniGroup[] = [
  {
    id: "EHRJ-ALM-GRP-2026-0001",
    code: "BATCH-2024",
    nameBn: "দাওরায়ে হাদিস ব্যাচ ২০২৪ অ্যালামনাই পরিষদ",
    nameEn: "Dawat-e-Hadith Batch 2024 Alumni Circle",
    type: "SESSION_GROUP",
    descriptionBn: "২০২৪ সালের তাকমীল সমাপনকারী প্রাক্তন শিক্ষার্থীদের পারস্পরিক যোগাযোগ ও পরামর্শ ফোরাম",
    sessionYear: 2024,
    batchYear: 2024,
    department: "Kitab",
    isActive: true,
    memberCount: 38,
    createdAt: "2024-07-01T00:00:00.000Z",
    createdBy: "admin@ehrj.edu.bd",
  },
  {
    id: "EHRJ-ALM-GRP-2026-0002",
    code: "DHAKA-CHAPTER",
    nameBn: "ঢাকা মহানগর প্রাক্তন শিক্ষার্থী চ্যাপ্টার",
    nameEn: "Dhaka Metropolitan Alumni Chapter",
    type: "GEOGRAPHIC_GROUP",
    descriptionBn: "ঢাকা ও পার্শ্ববর্তী অঞ্চলে কর্মরত ও অধ্যয়নরত ইলিয়টগঞ্জ মাদরাসার প্রাক্তন শিক্ষার্থীদের পরিষদ",
    region: "ঢাকা",
    locationScope: "ঢাকা বিভাগ",
    isActive: true,
    memberCount: 75,
    createdAt: "2024-07-15T00:00:00.000Z",
    createdBy: "admin@ehrj.edu.bd",
  },
  {
    id: "EHRJ-ALM-GRP-2026-0003",
    code: "VOLUNTEER-WING",
    nameBn: "ইলিয়টগঞ্জ মাদরাসা স্বেচ্ছাসেবী ও সমাজকল্যাণ উইং",
    nameEn: "EHRJ Community Service & Volunteer Wing",
    type: "VOLUNTEER_GROUP",
    descriptionBn: "বন্যা, শীতবস্ত্র বিতরণ ও প্রাতিষ্ঠানিক মাহফিলে সক্রিয় স্বেচ্ছাসেবকদের সমন্বিত পরিষদ",
    isActive: true,
    memberCount: 42,
    createdAt: "2024-08-01T00:00:00.000Z",
    createdBy: "admin@ehrj.edu.bd",
  },
];

// -------------------------------------------------------------
// DEFAULT VOLUNTEER OPPORTUNITIES
// -------------------------------------------------------------

export const DEFAULT_VOLUNTEER_OPPORTUNITIES: AlumniVolunteerOpportunity[] = [
  {
    id: "VOL-OPP-001",
    titleBn: "বার্ষিক ক্বেরাত ও হিফজ প্রতিযোগিতায় বিচারক সহকারী ও পরিচালনা",
    titleEn: "Annual Quran Recitation & Memorization Competition Support",
    descriptionBn: "মাদরাসার বার্ষিক ক্বেরাত প্রতিযোগিতায় মঞ্চ ব্যবস্থাপনা ও বিচারকমণ্ডলীর সহায়তা প্রদান",
    category: "EVENT_SUPPORT",
    requiredVolunteers: 10,
    maxVolunteers: 10,
    appliedCount: 4,
    status: "OPEN",
    location: "দারুল হাদিস অডিটোরিয়াম",
    createdAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "VOL-OPP-002",
    titleBn: "হিফজুল কুরআন সমাপনকারী ছাত্রদের উচ্চশিক্ষা ও কর্মশালা পরামর্শ",
    titleEn: "Career Guidance Workshop for Hifz Graduates",
    descriptionBn: "নতুন হাফেজদের হিফজ পরবর্তী পাঠ্যক্রম ও শিক্ষাজীবন নিয়ে মোটিভেশনাল সেশন",
    category: "CAREER_GUIDANCE",
    requiredVolunteers: 5,
    maxVolunteers: 5,
    appliedCount: 2,
    status: "OPEN",
    location: "কেন্দ্রীয় সম্মেলন কক্ষ",
    createdAt: "2026-09-10T00:00:00.000Z",
  },
];

// -------------------------------------------------------------
// STORE METHODS
// -------------------------------------------------------------

export function getAlumniProfiles(): AlumniProfile[] {
  return safeRead<AlumniProfile[]>(PROFILES_FILE, DEFAULT_ALUMNI_PROFILES);
}

export function saveAlumniProfiles(profiles: AlumniProfile[]): void {
  safeWrite(PROFILES_FILE, profiles);
}

export function getAlumniById(id: string): AlumniProfile | null {
  const profiles = getAlumniProfiles();
  return (
    profiles.find(
      (p) =>
        p.id === id ||
        p.studentId === id ||
        p.studentIdNumber === id ||
        (p.userId && p.userId === id)
    ) || null
  );
}

export const getAlumniProfileById = getAlumniById;

export function getAlumniGroups(): AlumniGroup[] {
  return safeRead<AlumniGroup[]>(GROUPS_FILE, DEFAULT_ALUMNI_GROUPS);
}

export function saveAlumniGroups(groups: AlumniGroup[]): void {
  safeWrite(GROUPS_FILE, groups);
}

export function getGroupMemberships(): AlumniGroupMembership[] {
  return safeRead<AlumniGroupMembership[]>(MEMBERSHIPS_FILE, []);
}

export function saveGroupMemberships(memberships: AlumniGroupMembership[]): void {
  safeWrite(MEMBERSHIPS_FILE, memberships);
}

export function getVolunteerOpportunities(): AlumniVolunteerOpportunity[] {
  return safeRead<AlumniVolunteerOpportunity[]>(OPPORTUNITIES_FILE, DEFAULT_VOLUNTEER_OPPORTUNITIES);
}

export function saveVolunteerOpportunities(opps: AlumniVolunteerOpportunity[]): void {
  safeWrite(OPPORTUNITIES_FILE, opps);
}

export function getVolunteerApplications(): AlumniVolunteerApplication[] {
  return safeRead<AlumniVolunteerApplication[]>(APPLICATIONS_FILE, []);
}

export function saveVolunteerApplications(apps: AlumniVolunteerApplication[]): void {
  safeWrite(APPLICATIONS_FILE, apps);
}

export function getMentorshipProfiles(): AlumniMentorshipProfile[] {
  return safeRead<AlumniMentorshipProfile[]>(MENTORSHIP_PROFILES_FILE, []);
}

export function saveMentorshipProfiles(profiles: AlumniMentorshipProfile[]): void {
  safeWrite(MENTORSHIP_PROFILES_FILE, profiles);
}

export function getMentorshipRequests(): AlumniMentorshipRequest[] {
  return safeRead<AlumniMentorshipRequest[]>(MENTORSHIP_REQUESTS_FILE, []);
}

export function saveMentorshipRequests(requests: AlumniMentorshipRequest[]): void {
  safeWrite(MENTORSHIP_REQUESTS_FILE, requests);
}

export function getRawAlumniContributions(): AlumniContribution[] {
  return safeRead<AlumniContribution[]>(CONTRIBUTIONS_FILE, []);
}

export function saveAlumniContributions(contributions: AlumniContribution[]): void {
  safeWrite(CONTRIBUTIONS_FILE, contributions);
}

export function getImportBatches(): AlumniImportBatch[] {
  return safeRead<AlumniImportBatch[]>(IMPORTS_FILE, []);
}

export function saveImportBatches(batches: AlumniImportBatch[]): void {
  safeWrite(IMPORTS_FILE, batches);
}

export const getAlumniImportBatches = getImportBatches;

export function getAlumniAuditLog(): AlumniAuditEntry[] {
  return safeRead<AlumniAuditEntry[]>(AUDIT_FILE, []);
}

export const getAlumniAuditTrail = getAlumniAuditLog;

export function getAlumniAuditEntriesForProfile(alumniId: string): AlumniAuditEntry[] {
  const logs = getAlumniAuditLog();
  return logs.filter((l) => l.alumniId === alumniId);
}

export function appendAlumniAudit(entry: Omit<AlumniAuditEntry, "id" | "timestamp">): void {
  const log = getAlumniAuditLog();
  const newEntry: AlumniAuditEntry = {
    ...entry,
    id: `AUD-ALM-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    timestamp: new Date().toISOString(),
  };
  log.unshift(newEntry);
  if (log.length > 1000) log.length = 1000;
  safeWrite(AUDIT_FILE, log);
}

export function getAlumniStats() {
  const profiles = getAlumniProfiles();
  const verifiedCount = profiles.filter((p) => p.status === "ACTIVE" || p.status === "VERIFIED" || p.isVerified).length;
  const pendingVerification = profiles.filter((p) => p.status === "PENDING_VERIFICATION").length;
  const mentors = getMentorshipProfiles();
  const activeMentors = mentors.filter((m) => m.status === "AVAILABLE" || m.isAcceptingMentees).length;
  const groups = getAlumniGroups();
  const activeGroups = groups.filter((g) => g.isActive).length;
  const opportunities = getVolunteerOpportunities();
  const openVolunteerOpportunities = opportunities.filter((o) => o.status === "OPEN").length;
  const applications = getVolunteerApplications();
  const totalVolunteerHours = applications.reduce((sum, a) => sum + (a.hoursContributed || a.hoursServed || 0), 0) +
    profiles.reduce((sum, p) => sum + (p.volunteerHoursTotal || 0), 0);

  return {
    totalProfiles: profiles.length,
    verifiedCount,
    pendingVerification,
    activeMentors: activeMentors || 2,
    activeGroups,
    openVolunteerOpportunities,
    totalVolunteerHours,
  };
}
