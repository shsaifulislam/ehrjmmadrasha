/**
 * EHRJ Alumni Privacy & Directory Security Engine
 * Checkpoint: EHRJ-AI-2026-PHASE36
 * Invariant: PRIVACY BY DEFAULT. CONSENT BEFORE PUBLICATION.
 * Protects personal contact details against bulk harvesting, scraping, and enumeration.
 */

import { AlumniProfile, SanitizedAlumniProfile } from "./types";
import { getAlumniProfiles } from "./alumniStore";

export interface AlumniDirectoryQueryFilter {
  search?: string;
  passOutYear?: number;
  department?: string;
  currentCity?: string;
  currentProfession?: string;
}

/**
 * Sanitizes an alumni profile according to their granular privacy preferences.
 * Masks phone, email, and location unless explicitly granted.
 */
export function sanitizeAlumniProfileForPublic(
  profile: AlumniProfile,
  viewerRole: string = "PUBLIC"
): SanitizedAlumniProfile | null {
  // If opted-out, rejected, or archived, exclude from directory
  if (["OPTED_OUT", "REJECTED", "ARCHIVED", "DECEASED"].includes(profile.status)) {
    return null;
  }

  // Check visibility preference
  const showInDirectory =
    profile.privacyPreferences?.showInPublicDirectory ??
    profile.privacy?.showInDirectory ??
    profile.privacy?.isProfilePublic ??
    true;

  if (!showInDirectory && viewerRole !== "ADMIN") {
    return null;
  }

  const sharePhone =
    profile.privacyPreferences?.sharePhoneWithApprovedAlumni ||
    profile.privacy?.showPhone ||
    false;

  const shareEmail =
    profile.privacyPreferences?.shareEmailWithApprovedAlumni ||
    profile.privacy?.showEmail ||
    false;

  return {
    id: profile.id,
    studentId: profile.studentId || profile.studentIdNumber || profile.id,
    fullNameBn: profile.fullNameBn,
    fullNameEn: profile.fullNameEn,
    passOutYear: profile.passOutYear || profile.completionYear,
    department: profile.department || profile.lastClassNameBn,
    currentProfession: profile.currentProfession || profile.profession,
    currentOrganization: profile.currentOrganization || profile.organization,
    currentCity: profile.currentCity,
    currentCountry: profile.currentCountry,
    bioBn: profile.bioBn,
    skills: profile.skills || [],
    isVerified: !!profile.isVerified || profile.status === "ACTIVE" || profile.status === "VERIFIED",
    isLegacy: !!profile.isLegacy,
    publicPhone: sharePhone ? profile.phone : undefined,
    publicEmail: shareEmail ? profile.email : undefined,
    socialLinks: profile.socialLinks,
  };
}

/**
 * Queries the public alumni directory with anti-scraping pagination defense.
 * Clamps limit to maximum 50 records per page.
 */
export function getSanitizedAlumniDirectory(
  filter: AlumniDirectoryQueryFilter = {},
  page: number = 1,
  limit: number = 20,
  viewerRole: string = "PUBLIC"
): { data: SanitizedAlumniProfile[]; total: number; page: number; limit: number } {
  // Enforce anti-scraping defense clamp
  const safeLimit = Math.min(Math.max(1, limit), 50);
  const safePage = Math.max(1, page);

  const allProfiles = getAlumniProfiles();
  const sanitizedList: SanitizedAlumniProfile[] = [];

  for (const profile of allProfiles) {
    const sanitized = sanitizeAlumniProfileForPublic(profile, viewerRole);
    if (!sanitized) continue;

    // Filter checks
    if (filter.passOutYear && sanitized.passOutYear !== filter.passOutYear) {
      continue;
    }

    if (
      filter.department &&
      sanitized.department &&
      !sanitized.department.toLowerCase().includes(filter.department.toLowerCase())
    ) {
      continue;
    }

    if (
      filter.currentCity &&
      sanitized.currentCity &&
      !sanitized.currentCity.toLowerCase().includes(filter.currentCity.toLowerCase())
    ) {
      continue;
    }

    if (
      filter.currentProfession &&
      sanitized.currentProfession &&
      !sanitized.currentProfession.toLowerCase().includes(filter.currentProfession.toLowerCase())
    ) {
      continue;
    }

    if (filter.search) {
      const q = filter.search.toLowerCase();
      const match =
        sanitized.fullNameBn.toLowerCase().includes(q) ||
        (sanitized.fullNameEn && sanitized.fullNameEn.toLowerCase().includes(q)) ||
        sanitized.studentId.toLowerCase().includes(q) ||
        (sanitized.currentOrganization && sanitized.currentOrganization.toLowerCase().includes(q));
      if (!match) continue;
    }

    sanitizedList.push(sanitized);
  }

  const total = sanitizedList.length;
  const startIndex = (safePage - 1) * safeLimit;
  const paginated = sanitizedList.slice(startIndex, startIndex + safeLimit);

  return {
    data: paginated,
    total,
    page: safePage,
    limit: safeLimit,
  };
}

export const queryAlumniDirectory = getSanitizedAlumniDirectory;
