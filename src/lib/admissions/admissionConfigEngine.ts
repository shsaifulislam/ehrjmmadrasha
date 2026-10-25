/**
 * EHRJ Digital Admissions 2.0 — Admission Configuration & Availability Engine
 * Checkpoint: EHRJ-AI-2026-PHASE34
 * Manages configuration-driven admission availability, dates, class quotas, and document rules.
 */

import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import { AdmissionSessionConfig, AvailableClassConfig } from "./types";

const ADMISSIONS_DATA_DIR = path.join(process.cwd(), "data", "admissions");
const CONFIG_FILE = path.join(ADMISSIONS_DATA_DIR, "admission_config.json");

function ensureDirectory() {
  if (!fs.existsSync(ADMISSIONS_DATA_DIR)) {
    fs.mkdirSync(ADMISSIONS_DATA_DIR, { recursive: true });
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
    console.error(`[AdmissionConfig] Read error on ${filePath}:`, err);
    return fallback;
  }
}

function safeWrite<T>(filePath: string, data: T): void {
  try {
    ensureDirectory();
    const tempFile = `${filePath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempFile, filePath);
  } catch (err) {
    console.error(`[AdmissionConfig] Write error on ${filePath}:`, err);
    throw err;
  }
}

const DEFAULT_CONFIG: AdmissionSessionConfig = {
  sessionId: "",
  sessionName: "শিক্ষাবর্ষ নির্ধারিত নয়",
  isOpen: false,
  startDate: "",
  endDate: "",
  availableClasses: [],
  residentialOptions: ["RESIDENTIAL", "NON_RESIDENTIAL", "DAY_CARE"],
  requiredDocuments: [
    { type: "PHOTO", nameBn: "শিক্ষার্থীর পাসপোর্ট সাইজ ছবি", isRequired: true },
    { type: "BIRTH_CERTIFICATE", nameBn: "অনলাইন জন্ম নিবন্ধন সনদ", isRequired: true },
    { type: "GUARDIAN_NID", nameBn: "অভিভাবকের জাতীয় পরিচয়পত্র (NID)", isRequired: true },
    { type: "PREVIOUS_MARKSHEET", nameBn: "পূর্ববর্তী মাদরাসা/স্কুলের প্রশংসাপত্র বা ছাড়পত্র", isRequired: false },
  ],
  specialInstructionsBn:
    "অনলাইনে আবেদন সাবমিট করার পর প্রাপ্ত ট্র্যাকিং নম্বরটি সংরক্ষণ করুন। এতিম ও আর্থিকভাবে অসচ্ছল শিক্ষার্থীদের জন্য মাদরাসা তহবিলের পক্ষ থেকে বিশেষ সুবিধার সুযোগ রয়েছে।",
  updatedAt: "",
  updatedBy: "",
};

function parseDateOnly(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value
    ? timestamp
    : null;
}

export function isValidAdmissionDateRange(startDate: string, endDate: string): boolean {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  return start !== null && end !== null && start <= end;
}

/**
 * Returns dynamic admission configuration enriched with authoritative database counts
 */
export async function getAdmissionConfig(): Promise<AdmissionSessionConfig> {
  const config = safeRead<AdmissionSessionConfig>(CONFIG_FILE, DEFAULT_CONFIG);

  try {
    // Enrich real applicant counts from Prisma
    const counts = await prisma.application.groupBy({
      by: ["desiredClassId"],
      _count: { id: true },
    });

    const countMap = new Map<string, number>();
    for (const c of counts) {
      countMap.set(c.desiredClassId, c._count.id);
    }

    config.availableClasses = config.availableClasses.map((ac) => ({
      ...ac,
      currentApplicants: countMap.get(ac.classId) || 0,
    }));
  } catch (err) {
    // If DB is offline, return raw config
  }

  return config;
}

/**
 * Updates admission configuration
 */
export async function updateAdmissionConfig(
  updates: Partial<AdmissionSessionConfig>,
  adminUserId: string
): Promise<AdmissionSessionConfig> {
  const current = await getAdmissionConfig();
  const updated: AdmissionSessionConfig = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: adminUserId,
  };
  if (updated.isOpen && !isValidAdmissionDateRange(updated.startDate, updated.endDate)) {
    throw new Error("ভর্তি চালু করতে একটি বৈধ শুরু ও শেষ তারিখ নির্ধারণ করুন।");
  }
  safeWrite(CONFIG_FILE, updated);
  return updated;
}

// Aliases for compatibility
export const getAdmissionSessionConfig = getAdmissionConfig;
export const updateAdmissionSessionConfig = updateAdmissionConfig;

/**
 * Verifies if admissions are currently open based on configuration and date range
 */
export async function isAdmissionCurrentlyOpen(): Promise<{
  isOpen: boolean;
  reason?: string;
  config: AdmissionSessionConfig;
}> {
  const config = await getAdmissionConfig();
  if (!config.isOpen) {
    return {
      isOpen: false,
      reason: "মাদরাসার বর্তমান শিক্ষাবর্ষের ভর্তি কার্যক্রম সাময়িকভাবে বন্ধ রয়েছে।",
      config,
    };
  }

  if (!isValidAdmissionDateRange(config.startDate, config.endDate)) {
    return {
      isOpen: false,
      reason: "ভর্তির সময়সীমা নির্ধারিত হয়নি বা সঠিক নয়।",
      config,
    };
  }

  const dateParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => dateParts.find((item) => item.type === type)?.value ?? "";
  const today = `${part("year")}-${part("month")}-${part("day")}`;
  if (today < config.startDate) {
    return {
      isOpen: false,
      reason: `ভর্তি আবেদন কার্যক্রম শুরু হবে আগামী ${config.startDate} তারিখ থেকে।`,
      config,
    };
  }

  if (today > config.endDate) {
    return {
      isOpen: false,
      reason: `ভর্তি আবেদনের নির্ধারিত সময়সীমা (${config.endDate}) সমাপ্ত হয়েছে।`,
      config,
    };
  }

  return { isOpen: true, config };
}
