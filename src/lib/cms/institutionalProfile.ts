/**
 * Authoritative Institutional Profile Single Source of Truth
 * Checkpoint: EHRJ-AI-2026-PHASE31
 */

import { INSTITUTION_INFO } from "@/lib/constants";
import { InstitutionalProfileData } from "./types";
import fs from "fs";
import path from "path";

const CMS_DATA_DIR = path.join(process.cwd(), "data", "cms");
const PROFILE_FILE = path.join(CMS_DATA_DIR, "institutional_profile.json");

export const DEFAULT_INSTITUTIONAL_PROFILE: InstitutionalProfileData = {
  nameBn: INSTITUTION_INFO.nameBn,
  nameEn: INSTITUTION_INFO.nameEn,
  nameAr: INSTITUTION_INFO.nameAr,
  code: INSTITUTION_INFO.code,
  established: INSTITUTION_INFO.established,
  establishedEn: INSTITUTION_INFO.establishedEn,
  founder: "হাজী রহমাতুল্লাহ্ (রহ.)",
  principal: INSTITUTION_INFO.principal,
  principalDesignationBn: "প্রতিষ্ঠাতা মুহতামিম ও পরিচালক",
  principalDesignationEn: "Founder Principal & Director",
  addressBn: INSTITUTION_INFO.addressBn,
  addressEn: INSTITUTION_INFO.addressEn,
  locationDetails: "পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা (ঢাকা-চট্টগ্রাম মহাসড়কের নিকটবর্তী)",
  phones: INSTITUTION_INFO.phones,
  primaryPhone: INSTITUTION_INFO.primaryPhone,
  email: INSTITUTION_INFO.email,
  adminEmail: INSTITUTION_INFO.adminEmail,
  domain: INSTITUTION_INFO.domain,
  website: INSTITUTION_INFO.website,
  socialLinks: {
    facebook: INSTITUTION_INFO.facebook,
    youtube: INSTITUTION_INFO.youtube,
    whatsappChannel: INSTITUTION_INFO.whatsappChannel,
  },
  missionBn:
    "কুরআন-সুন্নাহর বিশুদ্ধ জ্ঞান প্রচার, আন্তর্জাতিক মানের হিফজুল কুরআন সম্পন্নকরণ এবং চারিত্রিক গুণাবলী ও তাকওয়াবান সুনাগরিক গড়ে তোলা।",
  missionEn:
    "Promoting pure Islamic knowledge based on Quran and Sunnah, standard Hifz education, and developing righteous citizens.",
  visionBn:
    "একটি পূর্ণাঙ্গ ইসলামি বিশ্ববিদ্যালয় ও এতিমখানা কমপ্লেক্স হিসেবে সমকালীন চ্যালেঞ্জ মোকাবেলায় সক্ষম মুত্তাকী উম্মাহ গঠন।",
  visionEn:
    "To establish a comprehensive Islamic campus and orphan care complex nurturing pious leaders.",
  historyBn:
    "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা ২০২১ খ্রিস্টাব্দে কুমিল্লার দাউদকান্দি উপজেলার ঐতিহ্যবাহী ইলিয়টগঞ্জ পূর্ব লক্ষ্মীপুর গ্রামে প্রতিষ্ঠিত হয়। প্রতিষ্ঠালগ্ন থেকেই প্রতিষ্ঠানটি সহীহ কুরআন তিলাওয়াত, তাজবীদ, দরসে নেযামী ও কিতাব বিভাগের পাশাপাশি সাধারণ শিক্ষা প্রদানে নিরলস কাজ করে যাচ্ছে।",
  facilities: [
    {
      titleBn: "হিফজুল কুরআন ও নাযেরা অনুষদ",
      descriptionBn: "অভিজ্ঞ হাফেজ ও আন্তর্জাতিক মানের ক্বারীগণের সার্বক্ষণিক তত্ত্বাবধান ও সবক তদারকি।",
      icon: "BookOpen",
    },
    {
      titleBn: "লিল্লাহ বোর্ডিং ও ফ্রি এতিমখানা",
      descriptionBn: "এতিম ও দুঃস্থ মেধাবী ছাত্রদের শতভাগ ফ্রি পুষ্টিকর খাবার, বস্ত্র ও সার্বক্ষণিক আবাসন।",
      icon: "Heart",
    },
    {
      titleBn: "আবাসিক ছাত্রাবাস ও নিরিবিলি পরিবেশ",
      descriptionBn: "খোলামেলা মনোরম পরিবেশে সুপরিসর ছাত্রাবাস, সার্বক্ষণিক সুপেয় পানি ও নিরাপত্তা।",
      icon: "Home",
    },
    {
      titleBn: "লাইব্রেরি ও কিতাবাগার",
      descriptionBn: "তাফসির, হাদিস, ফিক্বহ ও ইসলামিক সাহিত্যের সমৃদ্ধ গ্রন্থগার।",
      icon: "Library",
    },
  ],
  statistics: {
    totalStudentsDisplay: "১,৪৫০+",
    huffazGraduatesDisplay: "৭২০+",
    teachersCountDisplay: "৪২ জন",
    orphanStudentsDisplay: "৩২০+",
    sourceVerified: true,
  },
  logoUrl: INSTITUTION_INFO.logoUrl,
  principalPhotoUrl: INSTITUTION_INFO.principalPhotoUrl,
  version: 1,
  updatedAt: new Date().toISOString(),
  updatedBy: "SYSTEM_INITIALIZER",
};

/**
 * Ensures data/cms directory exists
 */
function ensureCmsDirectory() {
  if (!fs.existsSync(CMS_DATA_DIR)) {
    fs.mkdirSync(CMS_DATA_DIR, { recursive: true });
  }
}

/**
 * Returns the authoritative institutional profile.
 */
export function getInstitutionalProfile(): InstitutionalProfileData {
  try {
    ensureCmsDirectory();
    if (fs.existsSync(PROFILE_FILE)) {
      const raw = fs.readFileSync(PROFILE_FILE, "utf-8");
      return JSON.parse(raw);
    }
    // Write default if not present
    fs.writeFileSync(PROFILE_FILE, JSON.stringify(DEFAULT_INSTITUTIONAL_PROFILE, null, 2), "utf-8");
    return DEFAULT_INSTITUTIONAL_PROFILE;
  } catch (err) {
    console.error("Error reading institutional profile, falling back to default:", err);
    return DEFAULT_INSTITUTIONAL_PROFILE;
  }
}

/**
 * Saves/updates the authoritative institutional profile.
 */
export function saveInstitutionalProfile(
  profile: Partial<InstitutionalProfileData>,
  performedBy: string
): InstitutionalProfileData {
  ensureCmsDirectory();
  let current: InstitutionalProfileData = DEFAULT_INSTITUTIONAL_PROFILE;
  try {
    if (fs.existsSync(PROFILE_FILE)) {
      const raw = fs.readFileSync(PROFILE_FILE, "utf-8");
      current = JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error reading current profile for update, using default:", err);
  }

  const updated: InstitutionalProfileData = {
    ...current,
    ...profile,
    nameBn: INSTITUTION_INFO.nameBn, // Institutional name locked to prevent accidental corruption
    nameEn: INSTITUTION_INFO.nameEn,
    code: INSTITUTION_INFO.code,
    version: (current.version || 1) + 1,
    updatedAt: new Date().toISOString(),
    updatedBy: performedBy,
  };

  fs.writeFileSync(PROFILE_FILE, JSON.stringify(updated, null, 2), "utf-8");
  return updated;
}
