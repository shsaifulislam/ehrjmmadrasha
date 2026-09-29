/**
 * EHRJ Alumni Mentorship & Guidance Engine
 * Checkpoint: EHRJ-AI-2026-PHASE36
 * Invariant: Controlled institutional mentorship workflow — NO UNRESTRICTED CHAT.
 * Workflow: Student/Guardian Request -> Institution Review -> Approved Connection.
 */

import {
  AlumniMentorshipProfile,
  AlumniMentorshipRequest,
  MentorshipRequestStatus,
} from "./types";
import {
  getMentorshipProfiles,
  saveMentorshipProfiles,
  getMentorshipRequests,
  saveMentorshipRequests,
  getAlumniById,
  appendAlumniAudit,
} from "./alumniStore";

/**
 * Returns active mentors, optionally filtered by topic.
 */
export function getActiveAlumniMentors(topic?: string): AlumniMentorshipProfile[] {
  const profiles = getMentorshipProfiles();
  return profiles.filter((m) => {
    const isAvail = m.status === "AVAILABLE" || m.isAcceptingMentees;
    if (!isAvail) return false;
    if (topic) {
      return m.expertiseTopics.some((t) => t.toLowerCase().includes(topic.toLowerCase()));
    }
    return true;
  });
}

/**
 * Registers an alumnus as an institutional mentor.
 */
export function registerAlumniMentor(
  alumniId: string,
  expertiseTopics: string[],
  maxMentees: number = 3,
  preferredMode: "ONLINE" | "IN_PERSON" | "HYBRID" = "HYBRID",
  linkedinUrl?: string,
  bio?: string,
  actorId: string = alumniId
): AlumniMentorshipProfile {
  const alumni = getAlumniById(alumniId);
  const profiles = getMentorshipProfiles();
  const existingIndex = profiles.findIndex((p) => p.alumniId === alumniId);

  const profile: AlumniMentorshipProfile = {
    alumniId,
    alumniNameBn: alumni?.fullNameBn || "প্রাক্তন শিক্ষার্থী",
    profession: alumni?.profession || alumni?.currentProfession || "শিক্ষাবিদ",
    organization: alumni?.organization || alumni?.currentOrganization,
    expertiseTopics,
    maxMentees,
    currentMenteesCount: existingIndex >= 0 ? profiles[existingIndex].currentMenteesCount : 0,
    isAcceptingMentees: true,
    preferredMode,
    linkedinUrl,
    bio,
    status: "AVAILABLE",
    createdAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    profiles[existingIndex] = profile;
  } else {
    profiles.push(profile);
  }
  saveMentorshipProfiles(profiles);

  appendAlumniAudit({
    alumniId,
    action: "MENTOR_REGISTERED",
    actorId,
    actorRole: "ALUMNI",
    details: `মেন্টর হিসেবে নিবন্ধন সম্পন্ন: ${profile.alumniNameBn} (বিষয়: ${expertiseTopics.join(", ")})`,
  });

  return profile;
}

export const registerAsMentor = registerAlumniMentor;

/**
 * Updates mentor availability.
 */
export function updateAlumniMentorAvailability(
  alumniId: string,
  isAvailable: boolean
): AlumniMentorshipProfile {
  const profiles = getMentorshipProfiles();
  const index = profiles.findIndex((p) => p.alumniId === alumniId);
  if (index < 0) {
    throw new Error(`Mentor profile for '${alumniId}' not found`);
  }

  profiles[index].status = isAvailable ? "AVAILABLE" : "PAUSED";
  profiles[index].isAcceptingMentees = isAvailable;
  saveMentorshipProfiles(profiles);
  return profiles[index];
}

/**
 * Submits a student mentorship connection request.
 * Starts in PENDING state awaiting institutional review.
 * No direct uncontrolled chat exists.
 */
export function requestMentorshipConnection(
  studentId: string,
  mentorAlumniId: string,
  topic: string,
  goalsNote: string,
  preferredSchedule?: string,
  actorId: string = studentId
): AlumniMentorshipRequest {
  const mentorAlumni = getAlumniById(mentorAlumniId);
  const requests = getMentorshipRequests();

  const reqId = `REQ-MENTOR-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newRequest: AlumniMentorshipRequest = {
    id: reqId,
    alumniId: mentorAlumniId,
    mentorAlumniId,
    alumniNameBn: mentorAlumni?.fullNameBn || "মেন্টর",
    studentId,
    studentNameBn: studentId,
    studentIdNumber: studentId,
    topic,
    questionBn: goalsNote,
    goalsNote,
    preferredSchedule,
    status: "PENDING" as any, // Controlled review state
    createdAt: new Date().toISOString(),
  };

  requests.push(newRequest);
  saveMentorshipRequests(requests);

  appendAlumniAudit({
    alumniId: mentorAlumniId,
    action: "MENTORSHIP_REQUEST",
    actorId,
    actorRole: "STUDENT",
    details: `শিক্ষার্থী মেন্টরশিপ অনুরোধ জমা দিয়েছে: ছাত্র ${studentId} -> মেন্টর ${mentorAlumniId} (বিষয়: ${topic})`,
  });

  return newRequest;
}

/**
 * Administrative review and facilitation of mentorship connection.
 * Facilitator sets institutional meeting notes and schedule.
 */
export function reviewMentorshipRequest(
  requestId: string,
  decision: "ACCEPTED" | "REJECTED" | "APPROVED",
  adminId: string,
  rejectionReason?: string,
  facilitationNotes?: string
): AlumniMentorshipRequest {
  const requests = getMentorshipRequests();
  const index = requests.findIndex((r) => r.id === requestId);
  if (index < 0) {
    throw new Error(`Mentorship request '${requestId}' not found`);
  }

  const req = requests[index];
  req.status = decision === "REJECTED" ? "REJECTED" : ("ACCEPTED" as any);
  req.reviewedByUserId = adminId;
  req.facilitatorAdminId = adminId;
  if (facilitationNotes) req.facilitationNotes = facilitationNotes;
  if (rejectionReason) req.institutionalNotes = rejectionReason;
  req.connectedAt = decision !== "REJECTED" ? new Date().toISOString() : undefined;

  requests[index] = req;
  saveMentorshipRequests(requests);

  appendAlumniAudit({
    alumniId: req.alumniId,
    action: "MENTORSHIP_REVIEWED",
    actorId: adminId,
    actorRole: "ADMIN",
    details: `মেন্টরশিপ অনুরোধ ${decision}: ${req.id} (বিষয়: ${req.topic})`,
  });

  return req;
}

/**
 * Completes a mentorship session with documented educational outcome.
 */
export function completeMentorshipSession(
  requestId: string,
  actorId: string,
  outcomeNotes?: string
): AlumniMentorshipRequest {
  const requests = getMentorshipRequests();
  const index = requests.findIndex((r) => r.id === requestId);
  if (index < 0) {
    throw new Error(`Mentorship request '${requestId}' not found`);
  }

  const req = requests[index];
  req.status = "COMPLETED";
  req.completedAt = new Date().toISOString();
  if (outcomeNotes) req.outcomeNotes = outcomeNotes;

  requests[index] = req;
  saveMentorshipRequests(requests);

  appendAlumniAudit({
    alumniId: req.alumniId,
    action: "MENTORSHIP_COMPLETED",
    actorId,
    actorRole: "MENTOR",
    details: `মেন্টরশিপ সেশন সম্পন্ন: ${req.id} - ${outcomeNotes || "সফলভাবে সমাপ্ত"}`,
  });

  return req;
}

/**
 * Returns mentorship requests assigned to a mentor.
 */
export function getMentorshipRequestsForAlumni(alumniId: string): AlumniMentorshipRequest[] {
  const requests = getMentorshipRequests();
  return requests.filter((r) => r.alumniId === alumniId || r.mentorAlumniId === alumniId);
}

/**
 * Returns mentorship requests initiated by a student.
 */
export function getMentorshipRequestsForStudent(studentId: string): AlumniMentorshipRequest[] {
  const requests = getMentorshipRequests();
  return requests.filter((r) => r.studentId === studentId);
}
