/**
 * EHRJ Alumni Verification & Historical Student Linkage Engine
 * Checkpoint: EHRJ-AI-2026-PHASE36
 * Invariant: ALUMNI IS A RELATIONSHIP LAYER, NOT A SECOND STUDENT DATABASE.
 * Connects to authoritative Prisma Student/Enrollment, enforces verification lifecycle, and preserves historical truth.
 */

import { AlumniProfile, AlumniStatus, AlumniRelationshipType } from "./types";
import {
  getAlumniProfiles,
  saveAlumniProfiles,
  getAlumniById,
  appendAlumniAudit,
} from "./alumniStore";
import { prisma } from "../prisma";

export interface RegisterAlumniParams {
  relationshipType?: AlumniRelationshipType;
  studentIdOrNumber?: string;
  studentId?: string;
  isLegacy?: boolean;
  legacySourceNote?: string;
  fullNameBn: string;
  fullNameEn?: string;
  passOutYear?: number;
  department?: string;
  enrollmentId?: string;
  email?: string;
  phone?: string;
  currentCity?: string;
  currentCountry?: string;
  currentProfession?: string;
  currentOrganization?: string;
  profession?: string;
  organization?: string;
  designation?: string;
  highestDegree?: string;
  skills?: string[];
  bioBn?: string;
  bioEn?: string;
  socialLinks?: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
  };
  privacyPreferences?: any;
  actorId?: string;
  actorRole?: string;
}

/**
 * Registers an alumni profile.
 * Verifies against Student Master if studentId provided.
 * Starts in PENDING_VERIFICATION unless registered directly by ADMIN.
 */
export async function registerAlumniProfile(
  params: RegisterAlumniParams,
  actorId: string = "SELF_REG"
): Promise<AlumniProfile> {
  const {
    studentId,
    studentIdOrNumber = studentId,
    fullNameBn,
    fullNameEn,
    passOutYear,
    department = "Hifz / Dakhil",
    phone,
    email,
    currentProfession,
    currentOrganization,
    profession = currentProfession,
    organization = currentOrganization,
    currentCity,
    currentCountry = "বাংলাদেশ",
    bioBn,
    bioEn,
    skills = [],
    socialLinks,
    privacyPreferences,
    isLegacy = false,
    legacySourceNote,
  } = params;

  if (!fullNameBn || !fullNameBn.trim()) {
    throw new Error("প্রাক্তন শিক্ষার্থীর বাংলা নাম আবশ্যক।");
  }

  // 1. Resolve student record from Prisma if available
  let resolvedStudent: any = null;
  const targetId = studentId || studentIdOrNumber;
  if (targetId) {
    try {
      resolvedStudent = await prisma.student.findFirst({
        where: {
          OR: [
            { id: targetId },
            { studentIdNumber: targetId },
          ],
        },
        include: {
          enrollments: {
            include: { session: true, jamatClass: true },
            orderBy: { enrolledAt: "desc" },
          },
        },
      });
    } catch (err) {
      // Prisma query non-fatal fallback
    }
  }

  const existingProfiles = getAlumniProfiles();
  const currentYear = new Date().getFullYear();
  const nextSeq = existingProfiles.length + 1;
  const alumniId = `EHRJ-ALM-${currentYear}-${String(nextSeq).padStart(6, "0")}`;

  const completionYear = passOutYear ||
    (resolvedStudent?.enrollments?.[0]?.session?.endDate
      ? new Date(resolvedStudent.enrollments[0].session.endDate).getFullYear()
      : currentYear);

  const defaultPrivacy = {
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
    allowDirectContact: false,
    sharePhoneWithApprovedAlumni: false,
    shareEmailWithApprovedAlumni: false,
    allowMentorshipRequests: true,
    ...privacyPreferences,
  };

  const newProfile: AlumniProfile = {
    id: alumniId,
    relationshipType: isLegacy
      ? "LEGACY_ALUMNI"
      : resolvedStudent
      ? "COMPLETED_GRADUATE"
      : "FORMER_STUDENT",
    status: "PENDING_VERIFICATION",
    isVerified: false,
    studentId: targetId || (resolvedStudent ? resolvedStudent.studentId || resolvedStudent.id : undefined),
    studentIdNumber: resolvedStudent?.studentIdNumber || targetId,
    isLegacy,
    legacySourceNote: legacySourceNote || (isLegacy ? "ঐতিহাসিক প্রাক্তন ছাত্র নথি" : undefined),
    admissionYear: resolvedStudent?.createdAt ? new Date(resolvedStudent.createdAt).getFullYear() : undefined,
    completionYear,
    passOutYear: completionYear,
    department: resolvedStudent?.enrollments?.[0]?.jamatClass?.nameBn || department,
    fullNameBn: resolvedStudent?.fullNameBn || fullNameBn.trim(),
    fullNameEn: fullNameEn?.trim() || resolvedStudent?.fullNameEn,
    email: email?.trim() || resolvedStudent?.email,
    phone: phone?.trim() || resolvedStudent?.fatherPhone,
    currentCity: currentCity?.trim(),
    currentCountry: currentCountry?.trim(),
    profession: profession?.trim(),
    currentProfession: profession?.trim(),
    organization: organization?.trim(),
    currentOrganization: organization?.trim(),
    bioBn: bioBn?.trim(),
    bioEn: bioEn?.trim(),
    skills,
    socialLinks,
    privacy: defaultPrivacy,
    privacyPreferences: defaultPrivacy,
    volunteerHoursTotal: 0,
    mentorshipSessionsCount: 0,
    eventsAttendedCount: 0,
    contributionsTotalBdt: 0,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  existingProfiles.push(newProfile);
  saveAlumniProfiles(existingProfiles);

  appendAlumniAudit({
    alumniId: newProfile.id,
    action: "CREATE_PROFILE",
    actorId,
    actorRole: "ALUMNI",
    details: `নতুন অ্যালামনাই প্রোফাইল নিবন্ধন: ${newProfile.fullNameBn} (${newProfile.id})`,
  });

  return newProfile;
}

export const registerAlumniRelationship = registerAlumniProfile;

/**
 * Verify an alumni profile by admin actor.
 */
export async function verifyAlumniProfile(
  id: string,
  adminId: string,
  notes: string = "Verified by administration",
  isLegacy?: boolean,
  legacySourceNote?: string
): Promise<AlumniProfile> {
  const profiles = getAlumniProfiles();
  const index = profiles.findIndex((p) => p.id === id || p.studentId === id);
  if (index < 0) {
    throw new Error(`Alumni profile '${id}' not found`);
  }

  const profile = profiles[index];
  const now = new Date().toISOString();

  profile.status = "VERIFIED";
  profile.isVerified = true;
  profile.verifiedAt = now;
  profile.verifiedByUserId = adminId;
  profile.verificationNotes = notes;
  profile.rejectionReason = undefined;

  if (isLegacy !== undefined) {
    profile.isLegacy = isLegacy;
  }
  if (legacySourceNote) {
    profile.legacySourceNote = legacySourceNote;
  }

  profile.updatedAt = now;
  profile.version += 1;
  profiles[index] = profile;
  saveAlumniProfiles(profiles);

  appendAlumniAudit({
    alumniId: profile.id,
    action: "VERIFY_ALUMNI",
    actorId: adminId,
    actorRole: "ADMIN",
    details: `অ্যালামনাই প্রোফাইল যাচাইকৃত ও অনুমোদিত: ${profile.fullNameBn} (${profile.id}) - ${notes}`,
  });

  return profile;
}

/**
 * Reject an unverified alumni profile.
 */
export function rejectAlumniProfile(
  id: string,
  adminId: string,
  reason: string = "Rejected during institutional verification"
): AlumniProfile {
  const profiles = getAlumniProfiles();
  const index = profiles.findIndex((p) => p.id === id || p.studentId === id);
  if (index < 0) {
    throw new Error(`Alumni profile '${id}' not found`);
  }

  const profile = profiles[index];
  const now = new Date().toISOString();

  profile.status = "REJECTED";
  profile.isVerified = false;
  profile.rejectionReason = reason;
  profile.updatedAt = now;
  profile.version += 1;

  profiles[index] = profile;
  saveAlumniProfiles(profiles);

  appendAlumniAudit({
    alumniId: profile.id,
    action: "REJECT_VERIFICATION",
    actorId: adminId,
    actorRole: "ADMIN",
    details: `অ্যালামনাই আবেদন প্রত্যাখ্যাত: ${profile.fullNameBn} (${profile.id}) - ${reason}`,
  });

  return profile;
}

/**
 * Opt-out an alumni profile (removes from public directory).
 */
export function setAlumniOptOut(
  id: string,
  actorId: string,
  reason: string = "User requested opt-out"
): AlumniProfile {
  const profiles = getAlumniProfiles();
  const index = profiles.findIndex((p) => p.id === id || p.studentId === id);
  if (index < 0) {
    throw new Error(`Alumni profile '${id}' not found`);
  }

  const profile = profiles[index];
  const now = new Date().toISOString();

  profile.status = "OPTED_OUT";
  if (profile.privacy) {
    profile.privacy.showInDirectory = false;
    profile.privacy.showInPublicDirectory = false;
  }
  if (profile.privacyPreferences) {
    profile.privacyPreferences.showInPublicDirectory = false;
  }

  profile.updatedAt = now;
  profile.version += 1;
  profiles[index] = profile;
  saveAlumniProfiles(profiles);

  appendAlumniAudit({
    alumniId: profile.id,
    action: "OPT_OUT",
    actorId,
    actorRole: "USER",
    details: `অ্যালামনাই প্রোফাইল অপ্ট-আউট সম্পন্ন: ${profile.fullNameBn} (${profile.id}) - ${reason}`,
  });

  return profile;
}

/**
 * Archive an alumni profile.
 */
export function archiveAlumniProfile(
  id: string,
  adminId: string,
  reason: string = "Archived by administration"
): AlumniProfile {
  const profiles = getAlumniProfiles();
  const index = profiles.findIndex((p) => p.id === id || p.studentId === id);
  if (index < 0) {
    throw new Error(`Alumni profile '${id}' not found`);
  }

  const profile = profiles[index];
  const now = new Date().toISOString();

  profile.status = "ARCHIVED";
  profile.updatedAt = now;
  profile.version += 1;
  profiles[index] = profile;
  saveAlumniProfiles(profiles);

  appendAlumniAudit({
    alumniId: profile.id,
    action: "ARCHIVE_PROFILE",
    actorId: adminId,
    actorRole: "ADMIN",
    details: `অ্যালামনাই প্রোফাইল আর্কাইভ করা হয়েছে: ${profile.fullNameBn} (${profile.id}) - ${reason}`,
  });

  return profile;
}

/**
 * Update self-reported profile fields while maintaining historical immutability.
 * Academic authoritative fields (studentId, passOutYear, isVerified, admissionYear) cannot be changed.
 */
export function updateSelfReportedProfile(
  id: string,
  updates: Partial<AlumniProfile>,
  actorId: string
): AlumniProfile {
  const profiles = getAlumniProfiles();
  const index = profiles.findIndex((p) => p.id === id || p.studentId === id);
  if (index < 0) {
    throw new Error(`Alumni profile '${id}' not found`);
  }

  const profile = profiles[index];

  // Self-reported editable fields ONLY:
  if (updates.currentProfession !== undefined) {
    profile.currentProfession = updates.currentProfession;
    profile.profession = updates.currentProfession;
  } else if (updates.profession !== undefined) {
    profile.currentProfession = updates.profession;
    profile.profession = updates.profession;
  }

  if (updates.currentOrganization !== undefined) {
    profile.currentOrganization = updates.currentOrganization;
    profile.organization = updates.currentOrganization;
  } else if (updates.organization !== undefined) {
    profile.currentOrganization = updates.organization;
    profile.organization = updates.organization;
  }

  if (updates.currentCity !== undefined) profile.currentCity = updates.currentCity;
  if (updates.currentCountry !== undefined) profile.currentCountry = updates.currentCountry;
  if (updates.bioBn !== undefined) profile.bioBn = updates.bioBn;
  if (updates.bioEn !== undefined) profile.bioEn = updates.bioEn;
  if (updates.skills !== undefined) profile.skills = updates.skills;
  if (updates.phone !== undefined) profile.phone = updates.phone;
  if (updates.email !== undefined) profile.email = updates.email;
  if (updates.socialLinks !== undefined) profile.socialLinks = updates.socialLinks;

  if (updates.privacyPreferences !== undefined) {
    profile.privacyPreferences = {
      ...profile.privacyPreferences,
      ...updates.privacyPreferences,
    };
    profile.privacy = {
      ...profile.privacy,
      ...updates.privacyPreferences,
    };
  }

  profile.updatedAt = new Date().toISOString();
  profile.version += 1;
  profiles[index] = profile;
  saveAlumniProfiles(profiles);

  appendAlumniAudit({
    alumniId: profile.id,
    action: "PROFILE_UPDATED",
    actorId,
    actorRole: "ALUMNI",
    details: `স্ব-ঘোষিত তথ্য হালনাগাদ: ${profile.fullNameBn} (${profile.id})`,
  });

  return profile;
}

export const updateAlumniSelfServiceProfile = updateSelfReportedProfile;
