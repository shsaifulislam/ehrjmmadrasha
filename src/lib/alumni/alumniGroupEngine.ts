/**
 * EHRJ Alumni Community Groups Engine
 * Checkpoint: EHRJ-AI-2026-PHASE36
 * Invariant: Controlled institutional community groups — NOT an open social network.
 */

import { AlumniGroup, AlumniGroupMembership, GroupType } from "./types";
import {
  getAlumniGroups,
  saveAlumniGroups,
  getGroupMemberships,
  saveGroupMemberships,
  getAlumniById,
  appendAlumniAudit,
} from "./alumniStore";

/**
 * Returns all active community groups.
 */
export function getActiveAlumniGroups(): AlumniGroup[] {
  const groups = getAlumniGroups();
  return groups.filter((g) => g.isActive);
}

/**
 * Returns all memberships for a specific alumni profile.
 */
export function getAlumniGroupMemberships(alumniId: string): AlumniGroupMembership[] {
  const memberships = getGroupMemberships();
  return memberships.filter((m) => m.alumniId === alumniId);
}

/**
 * Requests membership into an institutional community group.
 * Starts in PENDING state awaiting institutional review.
 */
export function requestJoinAlumniGroup(
  alumniId: string,
  groupId: string,
  note?: string,
  actorId: string = alumniId
): AlumniGroupMembership {
  const alumni = getAlumniById(alumniId);
  const groups = getAlumniGroups();
  const group = groups.find((g) => g.id === groupId);

  if (!group) {
    throw new Error(`Alumni group '${groupId}' not found`);
  }

  const memberships = getGroupMemberships();
  const existing = memberships.find((m) => m.alumniId === alumniId && m.groupId === groupId);
  if (existing) {
    return existing;
  }

  const membershipId = `MEM-GRP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newMembership: AlumniGroupMembership = {
    id: membershipId,
    groupId,
    alumniId,
    alumniNameBn: alumni?.fullNameBn || "প্রাক্তন শিক্ষার্থী",
    role: "MEMBER",
    status: "PENDING",
    joinedAt: new Date().toISOString(),
    note,
  };

  memberships.push(newMembership);
  saveGroupMemberships(memberships);

  appendAlumniAudit({
    alumniId,
    action: "GROUP_JOINED",
    actorId,
    actorRole: "ALUMNI",
    details: `গ্রুপে যোগদানের আবেদন: ${group.nameBn} (${group.id})`,
  });

  return newMembership;
}

/**
 * Reviews a group membership request (Admin approval/rejection).
 */
export function reviewAlumniGroupMembership(
  membershipId: string,
  decision: "APPROVED" | "REJECTED",
  adminId: string,
  rejectionReason?: string
): AlumniGroupMembership {
  const memberships = getGroupMemberships();
  const index = memberships.findIndex((m) => m.id === membershipId);
  if (index < 0) {
    throw new Error(`Membership '${membershipId}' not found`);
  }

  const membership = memberships[index];
  membership.status = decision;
  membership.approvedBy = adminId;
  if (rejectionReason) membership.rejectionReason = rejectionReason;

  memberships[index] = membership;
  saveGroupMemberships(memberships);

  // Update member count on group if approved
  if (decision === "APPROVED") {
    const groups = getAlumniGroups();
    const gIndex = groups.findIndex((g) => g.id === membership.groupId);
    if (gIndex >= 0) {
      groups[gIndex].memberCount = (groups[gIndex].memberCount || 0) + 1;
      saveAlumniGroups(groups);
    }
  }

  appendAlumniAudit({
    alumniId: membership.alumniId,
    action: "GROUP_JOINED",
    actorId: adminId,
    actorRole: "ADMIN",
    details: `গ্রুপ সদস্যপদ ${decision === "APPROVED" ? "অনুমোদিত" : "প্রত্যাখ্যাত"}: ${membership.groupId}`,
  });

  return membership;
}

/**
 * Admin creates an official alumni community group.
 */
export function createAlumniGroup(
  params: {
    code?: string;
    nameBn: string;
    nameEn?: string;
    type: GroupType;
    descriptionBn: string;
    descriptionEn?: string;
    sessionYear?: number;
    batchYear?: number;
    department?: string;
    locationScope?: string;
    region?: string;
    profession?: string;
  },
  adminId: string
): AlumniGroup {
  const groups = getAlumniGroups();
  const currentYear = new Date().getFullYear();
  const nextSeq = groups.length + 1;
  const groupId = `EHRJ-ALM-GRP-${currentYear}-${String(nextSeq).padStart(4, "0")}`;

  const newGroup: AlumniGroup = {
    id: groupId,
    code: params.code || `GRP-${nextSeq}`,
    nameBn: params.nameBn,
    nameEn: params.nameEn,
    type: params.type,
    descriptionBn: params.descriptionBn,
    descriptionEn: params.descriptionEn,
    sessionYear: params.sessionYear || params.batchYear,
    batchYear: params.batchYear || params.sessionYear,
    department: params.department,
    locationScope: params.locationScope,
    region: params.region,
    profession: params.profession,
    isActive: true,
    memberCount: 0,
    createdAt: new Date().toISOString(),
    createdBy: adminId,
  };

  groups.push(newGroup);
  saveAlumniGroups(groups);

  appendAlumniAudit({
    action: "CREATE_PROFILE",
    actorId: adminId,
    actorRole: "ADMIN",
    details: `নতুন প্রাতিষ্ঠানিক অ্যালামনাই গ্রুপ তৈরি: ${newGroup.nameBn} (${newGroup.id})`,
  });

  return newGroup;
}
