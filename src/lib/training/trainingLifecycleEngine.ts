/**
 * EHRJ MADRASHA ERP — PHASE 39
 * Training Lifecycle Engine
 * 
 * Manages state machines, program lifecycle, session scheduling,
 * and transactional participant enrollment with capacity and waitlist management.
 */

import {
  TrainingProgram,
  TrainingStatus,
  TrainingSession,
  TrainingEnrollment,
  ParticipantStatus,
} from "./types";
import {
  getAllTrainingPrograms,
  getTrainingProgramById,
  saveTrainingProgram,
  getAllEnrollments,
  saveEnrollment,
  recordTrainingAudit,
} from "./trainingStore";

// Valid State Transitions
const ALLOWED_TRANSITIONS: Record<TrainingStatus, TrainingStatus[]> = {
  DRAFT: ["REVIEW", "CANCELLED"],
  REVIEW: ["APPROVED", "DRAFT", "CANCELLED"],
  APPROVED: ["PUBLISHED", "DRAFT", "CANCELLED"],
  PUBLISHED: ["REGISTRATION_OPEN", "SCHEDULED", "CANCELLED"],
  REGISTRATION_OPEN: ["SCHEDULED", "IN_PROGRESS", "CANCELLED"],
  SCHEDULED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: ["ARCHIVED"],
  CANCELLED: ["ARCHIVED", "DRAFT"],
  ARCHIVED: [],
};

export interface ActorContext {
  actorId: string;
  actorName: string;
  actorRole: string; // e.g. ADMIN, PRINCIPAL, TEACHER
}

/**
 * Validates whether a state transition is permitted
 */
export function canTransitionProgram(current: TrainingStatus, target: TrainingStatus): boolean {
  return ALLOWED_TRANSITIONS[current]?.includes(target) ?? false;
}

/**
 * Transitions a program to a new status with validation and audit logging
 */
export function transitionProgramStatus(
  programId: string,
  targetStatus: TrainingStatus,
  actor: ActorContext,
  reason?: string
): { success: boolean; program?: TrainingProgram; error?: string } {
  const program = getTrainingProgramById(programId);
  if (!program) {
    return { success: false, error: "Training program not found" };
  }

  if (program.status === targetStatus) {
    return { success: true, program };
  }

  if (!canTransitionProgram(program.status, targetStatus)) {
    return {
      success: false,
      error: `Invalid status transition from ${program.status} to ${targetStatus}`,
    };
  }

  const previousStatus = program.status;
  program.status = targetStatus;
  program.updatedBy = actor.actorName;
  program.updatedAt = new Date().toISOString();

  saveTrainingProgram(program);

  recordTrainingAudit({
    trainingProgramId: program.id,
    action: targetStatus === "CANCELLED" ? "CANCEL_PROGRAM" : "UPDATE_PROGRAM",
    actorId: actor.actorId,
    actorName: actor.actorName,
    actorRole: actor.actorRole,
    notes: `Program status changed from ${previousStatus} to ${targetStatus}. Reason: ${reason || "N/A"}`,
    details: { previousStatus, newStatus: targetStatus, reason },
  });

  return { success: true, program };
}

/**
 * Creates a new training program in DRAFT status
 */
export function createTrainingProgram(
  data: Partial<TrainingProgram> & {
    titleBn: string;
    titleEn: string;
    trainingType: any;
    deliveryMethod: any;
    instructorName: string;
    instructorRole: string;
    totalHours: number;
    mandatoryStatus: any;
    capacity: number;
  },
  actor: ActorContext
): TrainingProgram {
  const now = new Date().toISOString();
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const trainingCode = `EHRJ-TRN-${year}-${randomSuffix}`;

  const newProgram: TrainingProgram = {
    id: trainingCode,
    trainingCode,
    titleBn: data.titleBn,
    titleEn: data.titleEn,
    titleAr: data.titleAr,
    trainingType: data.trainingType,
    deliveryMethod: data.deliveryMethod,
    description: data.description || "",
    objectivesBn: data.objectivesBn || [],
    ownerDepartment: data.ownerDepartment || "ACADEMIC",
    instructorName: data.instructorName,
    instructorRole: data.instructorRole,
    totalHours: data.totalHours,
    mandatoryStatus: data.mandatoryStatus,
    targetDesignations: data.targetDesignations || [],
    targetDepartments: data.targetDepartments || [],
    prerequisites: data.prerequisites || [],
    requiredSopIds: data.requiredSopIds || [],
    capacity: data.capacity || 30,
    attendanceThresholdPercentage: data.attendanceThresholdPercentage ?? 80,
    requiresAssessment: data.requiresAssessment ?? true,
    passPercentage: data.passPercentage ?? 70,
    requiresInstructorApproval: data.requiresInstructorApproval ?? true,
    issuesCertificate: data.issuesCertificate ?? true,
    certificateValidityMonths: data.certificateValidityMonths,
    status: "DRAFT",
    currentVersion: 1,
    modules: data.modules || [],
    sessions: data.sessions || [],
    assessment: data.assessment,
    feedbackSurveyId: data.feedbackSurveyId,
    createdBy: actor.actorName,
    createdAt: now,
    updatedBy: actor.actorName,
    updatedAt: now,
  };

  saveTrainingProgram(newProgram);

  recordTrainingAudit({
    trainingProgramId: newProgram.id,
    action: "CREATE_PROGRAM",
    actorId: actor.actorId,
    actorName: actor.actorName,
    actorRole: actor.actorRole,
    notes: `Created new training program: ${newProgram.titleBn} (${newProgram.id})`,
    details: { trainingCode, mandatoryStatus: newProgram.mandatoryStatus },
  });

  return newProgram;
}

/**
 * Adds or updates a training session
 */
export function addOrUpdateSession(
  programId: string,
  sessionData: Omit<TrainingSession, "id" | "trainingProgramId"> & { id?: string },
  actor: ActorContext
): { success: boolean; session?: TrainingSession; error?: string } {
  const program = getTrainingProgramById(programId);
  if (!program) {
    return { success: false, error: "Training program not found" };
  }

  const sessionId =
    sessionData.id || `EHRJ-TRN-SES-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

  const session: TrainingSession = {
    ...sessionData,
    id: sessionId,
    trainingProgramId: programId,
  };

  const existingIdx = program.sessions.findIndex((s) => s.id === sessionId);
  if (existingIdx >= 0) {
    program.sessions[existingIdx] = session;
  } else {
    program.sessions.push(session);
  }

  program.updatedAt = new Date().toISOString();
  program.updatedBy = actor.actorName;
  saveTrainingProgram(program);

  recordTrainingAudit({
    trainingProgramId: program.id,
    action: "SCHEDULE_SESSION",
    actorId: actor.actorId,
    actorName: actor.actorName,
    actorRole: actor.actorRole,
    notes: `Scheduled session ${session.sessionNumber} (${session.sessionDate} ${session.startTime}-${session.endTime})`,
    details: { sessionId: session.id, date: session.sessionDate, venue: session.venue },
  });

  return { success: true, session };
}

/**
 * Enrolls or Assigns an employee with transactional capacity and waitlist management
 */
export function enrollParticipant(
  programId: string,
  participant: {
    employeeId: string;
    employeeName: string;
    designation: string;
    department: string;
    userRole: string;
  },
  options: {
    isAssignment?: boolean;
    dueDate?: string;
    notes?: string;
  },
  actor: ActorContext
): { success: boolean; enrollment?: TrainingEnrollment; status: ParticipantStatus; message: string } {
  const program = getTrainingProgramById(programId);
  if (!program) {
    return { success: false, status: "WITHDRAWN", message: "Training program not found" };
  }

  const allEnrollments = getAllEnrollments();
  const existing = allEnrollments.find(
    (e) => e.trainingProgramId === programId && e.employeeId === participant.employeeId
  );

  if (existing) {
    return {
      success: true,
      enrollment: existing,
      status: existing.status,
      message: `Employee is already enrolled with status: ${existing.status}`,
    };
  }

  // Count active confirmed/registered participants
  const activeCount = allEnrollments.filter(
    (e) =>
      e.trainingProgramId === programId &&
      (e.status === "REGISTERED" || e.status === "CONFIRMED" || e.status === "ASSIGNED")
  ).length;

  const now = new Date().toISOString();
  let assignedStatus: ParticipantStatus = "REGISTERED";

  if (options.isAssignment) {
    assignedStatus = "ASSIGNED";
  } else if (activeCount >= program.capacity) {
    assignedStatus = "WAITLISTED";
  } else {
    assignedStatus = "CONFIRMED";
  }

  const enrollmentId = `ENR-TRN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

  const enrollment: TrainingEnrollment = {
    id: enrollmentId,
    trainingProgramId: programId,
    employeeId: participant.employeeId,
    employeeName: participant.employeeName,
    designation: participant.designation,
    department: participant.department,
    userRole: participant.userRole,
    status: assignedStatus,
    assignedAt: options.isAssignment ? now : undefined,
    assignedBy: options.isAssignment ? actor.actorName : undefined,
    isMandatory: program.mandatoryStatus === "MANDATORY",
    dueDate: options.dueDate,
    registrationDate: now,
    attendanceRate: 0,
    assessmentStatus: "NOT_STARTED",
    isCompleted: false,
    notes: options.notes,
  };

  saveEnrollment(enrollment);

  recordTrainingAudit({
    trainingProgramId: programId,
    employeeId: participant.employeeId,
    action: assignedStatus === "WAITLISTED" ? "WAITLIST_PARTICIPANT" : options.isAssignment ? "ASSIGN_EMPLOYEE" : "ENROLL_PARTICIPANT",
    actorId: actor.actorId,
    actorName: actor.actorName,
    actorRole: actor.actorRole,
    notes: `Participant ${participant.employeeName} (${participant.employeeId}) enrolled with status ${assignedStatus}`,
    details: { enrollmentId, status: assignedStatus, capacity: program.capacity, currentCount: activeCount },
  });

  return {
    success: true,
    enrollment,
    status: assignedStatus,
    message:
      assignedStatus === "WAITLISTED"
        ? "কার্যক্রমের আসন পূর্ণ হওয়ায় কর্মীকে ওয়েটিং লিস্টে রাখা হয়েছে।"
        : "সফলভাবে তালিকাভুক্ত করা হয়েছে।",
  };
}
