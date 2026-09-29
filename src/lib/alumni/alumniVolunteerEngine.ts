/**
 * EHRJ Alumni Volunteering & Community Engagement Engine
 * Checkpoint: EHRJ-AI-2026-PHASE36
 * Invariant: Non-financial community engagement & volunteering tracking.
 */

import {
  AlumniVolunteerOpportunity,
  AlumniVolunteerApplication,
  VolunteerStatus,
} from "./types";
import {
  getVolunteerOpportunities,
  saveVolunteerOpportunities,
  getVolunteerApplications,
  saveVolunteerApplications,
  getAlumniById,
  getAlumniProfiles,
  saveAlumniProfiles,
  appendAlumniAudit,
} from "./alumniStore";

/**
 * Returns active/open volunteer opportunities.
 */
export function getActiveVolunteerOpportunities(): AlumniVolunteerOpportunity[] {
  const opps = getVolunteerOpportunities();
  return opps.filter((o) => o.status === "OPEN");
}

/**
 * Returns volunteer applications for a given alumnus.
 */
export function getAlumniVolunteerApplications(alumniId: string): AlumniVolunteerApplication[] {
  const apps = getVolunteerApplications();
  return apps.filter((a) => a.alumniId === alumniId);
}

/**
 * Applies for a volunteer opportunity.
 * Starts in PENDING state.
 */
export function applyForVolunteerOpportunity(
  alumniId: string,
  opportunityId: string,
  statementOfIntent: string = "",
  availabilityNote: string = "",
  actorId: string = alumniId
): AlumniVolunteerApplication {
  const alumni = getAlumniById(alumniId);
  const opps = getVolunteerOpportunities();
  const opp = opps.find((o) => o.id === opportunityId);

  if (!opp) {
    throw new Error(`Volunteer opportunity '${opportunityId}' not found`);
  }

  const apps = getVolunteerApplications();
  const existing = apps.find((a) => a.alumniId === alumniId && a.opportunityId === opportunityId);
  if (existing) {
    return existing;
  }

  const appId = `APP-VOL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newApp: AlumniVolunteerApplication = {
    id: appId,
    opportunityId,
    opportunityTitleBn: opp.titleBn,
    alumniId,
    alumniNameBn: alumni?.fullNameBn || "প্রাক্তন শিক্ষার্থী",
    alumniPhone: alumni?.phone,
    motivationBn: statementOfIntent || "স্বেচ্ছাসেবক আবেদন",
    statementOfIntent,
    availabilityNote,
    status: "PENDING" as any,
    hoursContributed: 0,
    hoursServed: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  apps.push(newApp);
  saveVolunteerApplications(apps);

  // Increment applied count
  opp.appliedCount = (opp.appliedCount || 0) + 1;
  saveVolunteerOpportunities(opps);

  appendAlumniAudit({
    alumniId,
    action: "VOLUNTEER_APPLIED",
    actorId,
    actorRole: "ALUMNI",
    details: `স্বেচ্ছাসেবক আবেদন জমা দেওয়া হয়েছে: ${opp.titleBn} (${opp.id})`,
  });

  return newApp;
}

/**
 * Administrative review of volunteer application.
 */
export function reviewVolunteerApplication(
  applicationId: string,
  decision: "APPROVED" | "DECLINED" | "REJECTED",
  adminId: string,
  reviewNotes?: string
): AlumniVolunteerApplication {
  const apps = getVolunteerApplications();
  const index = apps.findIndex((a) => a.id === applicationId);
  if (index < 0) {
    throw new Error(`Application '${applicationId}' not found`);
  }

  const app = apps[index];
  app.status = decision === "APPROVED" ? "APPROVED" : "DECLINED";
  app.reviewedBy = adminId;
  if (reviewNotes) app.reviewNotes = reviewNotes;
  app.updatedAt = new Date().toISOString();

  apps[index] = app;
  saveVolunteerApplications(apps);

  appendAlumniAudit({
    alumniId: app.alumniId,
    action: "VOLUNTEER_REVIEWED",
    actorId: adminId,
    actorRole: "ADMIN",
    details: `স্বেচ্ছাসেবক আবেদন ${decision}: ${app.id} (${app.opportunityTitleBn})`,
  });

  return app;
}

/**
 * Records and authenticates volunteer service hours.
 * Updates profile accumulated hours.
 */
export function recordVolunteerServiceHours(
  applicationId: string,
  hoursServed: number,
  adminId: string,
  feedbackNotes?: string
): AlumniVolunteerApplication {
  const apps = getVolunteerApplications();
  const index = apps.findIndex((a) => a.id === applicationId);
  if (index < 0) {
    throw new Error(`Application '${applicationId}' not found`);
  }

  const app = apps[index];
  app.hoursServed = hoursServed;
  app.hoursContributed = hoursServed;
  app.status = "COMPLETED";
  if (feedbackNotes) app.feedbackNotes = feedbackNotes;
  app.updatedAt = new Date().toISOString();

  apps[index] = app;
  saveVolunteerApplications(apps);

  // Update profile's accumulated volunteer hours
  const profiles = getAlumniProfiles();
  const pIndex = profiles.findIndex((p) => p.id === app.alumniId);
  if (pIndex >= 0) {
    profiles[pIndex].volunteerHoursTotal = (profiles[pIndex].volunteerHoursTotal || 0) + hoursServed;
    saveAlumniProfiles(profiles);
  }

  appendAlumniAudit({
    alumniId: app.alumniId,
    action: "VOLUNTEER_HOURS_LOGGED",
    actorId: adminId,
    actorRole: "ADMIN",
    details: `${hoursServed} ঘণ্টা সমাজসেবা খেদমত লিপিবদ্ধ ও যাচাই করা হয়েছে: ${app.opportunityTitleBn}`,
  });

  return app;
}

/**
 * Creates a new volunteer opportunity.
 */
export function createVolunteerOpportunity(
  params: {
    titleBn: string;
    titleEn?: string;
    descriptionBn: string;
    descriptionEn?: string;
    category: string;
    eventId?: string;
    location?: string;
    requiredVolunteers?: number;
    maxVolunteers?: number;
    startDate?: string;
    endDate?: string;
    status?: "OPEN" | "CLOSED" | "COMPLETED";
  },
  adminId: string
): AlumniVolunteerOpportunity {
  const opps = getVolunteerOpportunities();
  const oppId = `VOL-OPP-${Date.now().toString().slice(-4)}`;

  const newOpp: AlumniVolunteerOpportunity = {
    id: oppId,
    titleBn: params.titleBn,
    titleEn: params.titleEn,
    descriptionBn: params.descriptionBn,
    descriptionEn: params.descriptionEn,
    category: params.category,
    eventId: params.eventId,
    location: params.location || "মাদরাসা ক্যাম্পাস",
    requiredVolunteers: params.requiredVolunteers || params.maxVolunteers || 10,
    maxVolunteers: params.maxVolunteers || params.requiredVolunteers || 10,
    appliedCount: 0,
    status: params.status || "OPEN",
    createdAt: new Date().toISOString(),
  };

  opps.push(newOpp);
  saveVolunteerOpportunities(opps);

  appendAlumniAudit({
    action: "VOLUNTEER_OPP_CREATED",
    actorId: adminId,
    actorRole: "ADMIN",
    details: `নতুন স্বেচ্ছাসেবা সুযোগ সৃষ্টি: ${newOpp.titleBn} (${newOpp.id})`,
  });

  return newOpp;
}
