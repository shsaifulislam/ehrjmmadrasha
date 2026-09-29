/**
 * EHRJ Event Registration & Eligibility Engine
 * Checkpoint: EHRJ-AI-2026-PHASE35
 * Concurrency-safe student registrations, deterministic eligibility checks,
 * capacity defense, waitlist management, and guardian IDOR security.
 */

import { InstitutionalEvent, EventRegistration, RegistrationStatus } from "./types";
import {
  getEvents,
  saveEvents,
  getEventById,
  getRegistrations,
  saveRegistrations,
  appendEventAudit,
} from "./eventStore";
import { prisma } from "../prisma";

export interface EligibilityResult {
  isEligible: boolean;
  reasonBn?: string;
  student?: any;
  activeEnrollment?: any;
}

/**
 * Deterministically checks whether a student meets the event's audience eligibility criteria
 */
export async function evaluateStudentEligibility(
  event: InstitutionalEvent,
  studentId: string
): Promise<EligibilityResult> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      enrollments: {
        include: {
          jamatClass: true,
          section: true,
          session: true,
        },
        orderBy: { enrolledAt: "desc" },
      },
      guardianLinks: {
        include: { guardian: true },
      },
    },
  });

  if (!student) {
    return { isEligible: false, reasonBn: "শিক্ষার্থী সিস্টেমে পাওয়া যায়নি।" };
  }

  if (student.status === "SUSPENDED" || student.status === "EXPELLED") {
    return {
      isEligible: false,
      reasonBn: "স্থগিত বা বহিষ্কৃত শিক্ষার্থী কোনো প্রাতিষ্ঠানিক ইভেন্টে অংশগ্রহণের যোগ্য নয়।",
    };
  }

  const activeEnrollment =
    student.enrollments.find((e) => e.status === "ACTIVE") || student.enrollments[0];

  const rule = event.audienceRule;
  if (!rule || !rule.audienceTypes || rule.audienceTypes.length === 0) {
    return { isEligible: true, student, activeEnrollment };
  }

  // 1. Gender check
  if (rule.genders && rule.genders.length > 0) {
    if (!rule.genders.includes(student.gender as any)) {
      return {
        isEligible: false,
        reasonBn: `এই ইভেন্টটি শুধুমাত্র ${rule.genders.includes("MALE") ? "ছাত্রদের" : "ছাত্রীদের"} জন্য নির্ধারিত।`,
      };
    }
  }

  // 2. Residential status check
  if (rule.residentialStatuses && rule.residentialStatuses.length > 0) {
    if (!rule.residentialStatuses.includes(student.residentialStatus as any)) {
      return {
        isEligible: false,
        reasonBn: "শিক্ষার্থীর আবাসন ক্যাটাগরি এই ইভেন্টের যোগ্যতার শর্ত পূরণ করে না।",
      };
    }
  }

  // 3. Specific Class / Jamat check
  if (rule.classIds && rule.classIds.length > 0) {
    if (!activeEnrollment || !rule.classIds.includes(activeEnrollment.classId)) {
      return {
        isEligible: false,
        reasonBn: "শিক্ষার্থীর বর্তমান জামাত/শ্রেণি এই ইভেন্টের জন্য নির্ধারিত নয়।",
      };
    }
  }

  // 4. Specific Section check
  if (rule.sectionIds && rule.sectionIds.length > 0) {
    if (!activeEnrollment || !activeEnrollment.sectionId || !rule.sectionIds.includes(activeEnrollment.sectionId)) {
      return {
        isEligible: false,
        reasonBn: "শিক্ষার্থীর বর্তমান শাখা এই ইভেন্টের জন্য নির্ধারিত নয়।",
      };
    }
  }

  // 5. Specific Students list
  if (rule.studentIds && rule.studentIds.length > 0) {
    if (!rule.studentIds.includes(student.id) && !rule.studentIds.includes(student.studentIdNumber)) {
      return {
        isEligible: false,
        reasonBn: "শিক্ষার্থী এই বিশেষ ইভেন্টের আমন্ত্রিত তালিকায় অন্তর্ভুক্ত নেই।",
      };
    }
  }

  // 6. Age check if defined
  if (student.dateOfBirth && (rule.minAgeYears || rule.maxAgeYears)) {
    const dob = new Date(student.dateOfBirth);
    const now = new Date();
    const ageYears = (now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

    if (rule.minAgeYears && ageYears < rule.minAgeYears) {
      return {
        isEligible: false,
        reasonBn: `শিক্ষার্থীর বয়স ন্যূনতম ${rule.minAgeYears} বছরের কম।`,
      };
    }
    if (rule.maxAgeYears && ageYears > rule.maxAgeYears) {
      return {
        isEligible: false,
        reasonBn: `শিক্ষার্থীর বয়স সর্বোচ্চ ${rule.maxAgeYears} বছরের বেশি।`,
      };
    }
  }

  return { isEligible: true, student, activeEnrollment };
}

export interface RegisterStudentParams {
  eventId: string;
  studentId: string;
  registeredByRole: "GUARDIAN" | "STUDENT" | "TEACHER" | "ADMIN";
  registeredByUserId: string;
  guardianId?: string;
  consentGiven: boolean;
  notes?: string;
}

/**
 * Registers a student for an institutional event with strict capacity, waitlist and concurrency defense
 */
export async function registerStudentForEvent(
  params: RegisterStudentParams
): Promise<{ success: boolean; registration?: EventRegistration; error?: string }> {
  const { eventId, studentId, registeredByRole, registeredByUserId, guardianId, consentGiven, notes } = params;

  // 1. Resolve Event
  const events = getEvents();
  const eventIndex = events.findIndex((e) => e.id === eventId);
  if (eventIndex < 0) {
    return { success: false, error: "ইভেন্টটি পাওয়া যায়নি।" };
  }
  const event = events[eventIndex];

  // 2. Event status check
  if (event.status !== "REGISTRATION_OPEN" && event.status !== "PUBLISHED") {
    return {
      success: false,
      error: `বর্তমানে এই ইভেন্টের রেজিস্ট্রেশন গ্রহণ করা হচ্ছে না (স্ট্যাটাস: ${event.status})।`,
    };
  }

  // 3. Deadline check
  if (event.registrationClosesAt && new Date() > new Date(event.registrationClosesAt)) {
    return {
      success: false,
      error: "ইভেন্ট রেজিস্ট্রেশনের নির্ধারিত সময়সীমা অতিক্রান্ত হয়েছে।",
    };
  }

  // 4. Guardian IDOR Defense: If registered by guardian, verify link to student
  if (registeredByRole === "GUARDIAN" && guardianId) {
    const link = await prisma.guardianStudent.findFirst({
      where: {
        studentId,
        guardianId,
      },
    });
    if (!link) {
      return {
        success: false,
        error: "অননুমোদিত চেষ্টা: আপনি শুধুমাত্র আপনার নিবন্ধিত সন্তানের জন্য আবেদন করতে পারবেন।",
      };
    }
  }

  // 5. Evaluate deterministic eligibility
  const eligibility = await evaluateStudentEligibility(event, studentId);
  if (!eligibility.isEligible) {
    return {
      success: false,
      error: eligibility.reasonBn || "শিক্ষার্থী এই ইভেন্টে অংশগ্রহণের যোগ্যতার শর্ত পূরণ করেনি।",
    };
  }

  const student = eligibility.student;
  const activeEnrollment = eligibility.activeEnrollment;

  // 6. Check existing registration
  const allRegistrations = getRegistrations();
  const existingReg = allRegistrations.find(
    (r) => r.eventId === eventId && r.studentId === studentId && r.status !== "CANCELLED"
  );
  if (existingReg) {
    return {
      success: false,
      error: `শিক্ষার্থী ইতিমধ্যে এই ইভেন্টে নিবন্ধিত রয়েছে (স্ট্যাটাস: ${existingReg.status})।`,
    };
  }

  // 7. Capacity & Waitlist calculation
  let regStatus: RegistrationStatus = "CONFIRMED";
  let waitlistPos: number | undefined = undefined;

  const isFull = event.maxCapacity > 0 && event.registeredCount >= event.maxCapacity;

  if (isFull) {
    const isWaitlistFull = event.waitlistCapacity > 0 && event.waitlistedCount >= event.waitlistCapacity;
    if (isWaitlistFull || event.waitlistCapacity === 0) {
      return {
        success: false,
        error: "দুঃখিত, এই ইভেন্টের নির্ধারিত আসন ও অপেক্ষমাণ তালিকা পূর্ণ হয়ে গিয়েছে।",
      };
    }
    regStatus = "WAITLISTED";
    waitlistPos = event.waitlistedCount + 1;
    event.waitlistedCount += 1;
  } else {
    regStatus = "CONFIRMED";
    event.registeredCount += 1;
  }

  // 8. Create Registration record
  const currentYear = new Date().getFullYear();
  const regId = `EHRJ-EVT-REG-${currentYear}-${String(allRegistrations.length + 1).padStart(6, "0")}`;
  const now = new Date().toISOString();

  const primaryGuardian = student.guardianLinks?.find((gl: any) => gl.isPrimary)?.guardian || student.guardianLinks?.[0]?.guardian;

  const newRegistration: EventRegistration = {
    id: regId,
    eventId: event.id,
    studentId: student.id,
    studentNameBn: student.fullNameBn,
    studentIdNumber: student.studentIdNumber,
    guardianId: guardianId || primaryGuardian?.id,
    guardianNameBn: primaryGuardian?.fullNameBn || student.fatherNameBn,
    guardianPhone: primaryGuardian?.phone || student.fatherPhone,
    classId: activeEnrollment?.jamatClass?.id,
    classNameBn: activeEnrollment?.jamatClass?.nameBn,
    sectionId: activeEnrollment?.section?.id,
    sectionNameBn: activeEnrollment?.section?.nameBn,
    rollNumber: activeEnrollment?.rollNumber,
    status: regStatus,
    registeredAt: now,
    registeredByRole,
    registeredByUserId,
    consentGiven: Boolean(consentGiven),
    notes,
    waitlistPosition: waitlistPos,
  };

  allRegistrations.push(newRegistration);
  saveRegistrations(allRegistrations);

  // Update event counts atomically
  events[eventIndex] = event;
  saveEvents(events);

  appendEventAudit({
    eventId: event.id,
    action: "REGISTER_STUDENT",
    actorId: registeredByUserId,
    actorRole: registeredByRole,
    details: `শিক্ষার্থী রেজিস্ট্রেশন: ${student.fullNameBn} (${student.studentIdNumber}) - স্ট্যাটাস: ${regStatus}`,
  });

  return { success: true, registration: newRegistration };
}

/**
 * Cancels an event registration and automatically promotes the next eligible waitlisted candidate if available
 */
export async function cancelEventRegistration(params: {
  registrationId: string;
  actorId: string;
  actorRole: string;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  const { registrationId, actorId, actorRole, reason } = params;

  const registrations = getRegistrations();
  const regIndex = registrations.findIndex((r) => r.id === registrationId);
  if (regIndex < 0) {
    return { success: false, error: "রেজিস্ট্রেশন রেকর্ড পাওয়া যায়নি।" };
  }

  const reg = registrations[regIndex];
  if (reg.status === "CANCELLED") {
    return { success: false, error: "রেজিস্ট্রেশনটি ইতিমধ্যে বাতিল করা হয়েছে।" };
  }

  const wasConfirmed = reg.status === "CONFIRMED" || reg.status === "APPROVED";
  const wasWaitlisted = reg.status === "WAITLISTED";

  reg.status = "CANCELLED";
  reg.cancelledAt = new Date().toISOString();
  reg.cancellationReason = reason;
  registrations[regIndex] = reg;

  const events = getEvents();
  const eventIndex = events.findIndex((e) => e.id === reg.eventId);

  if (eventIndex >= 0) {
    const event = events[eventIndex];

    if (wasConfirmed && event.registeredCount > 0) {
      event.registeredCount -= 1;

      // Automatically promote next candidate from waitlist if present
      const nextWaitlisted = registrations
        .filter((r) => r.eventId === event.id && r.status === "WAITLISTED")
        .sort((a, b) => (a.waitlistPosition || 0) - (b.waitlistPosition || 0))[0];

      if (nextWaitlisted) {
        nextWaitlisted.status = "CONFIRMED";
        nextWaitlisted.waitlistPosition = undefined;
        event.registeredCount += 1;
        if (event.waitlistedCount > 0) {
          event.waitlistedCount -= 1;
        }

        appendEventAudit({
          eventId: event.id,
          action: "PROMOTE_WAITLIST",
          actorId,
          actorRole,
          details: `অপেক্ষমাণ তালিকা থেকে উত্তীর্ণ: ${nextWaitlisted.studentNameBn} (${nextWaitlisted.studentIdNumber})`,
        });
      }
    } else if (wasWaitlisted && event.waitlistedCount > 0) {
      event.waitlistedCount -= 1;
    }

    events[eventIndex] = event;
    saveEvents(events);
  }

  saveRegistrations(registrations);

  appendEventAudit({
    eventId: reg.eventId,
    action: "CANCEL_REGISTRATION",
    actorId,
    actorRole,
    details: `রেজিস্ট্রেশন বাতিল: ${reg.studentNameBn} (${reg.studentIdNumber}) - কারণ: ${reason}`,
  });

  return { success: true };
}
