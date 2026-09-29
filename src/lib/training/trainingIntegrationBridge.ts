/**
 * EHRJ MADRASHA ERP — PHASE 39
 * Training Integration Bridge
 * 
 * Invariants:
 * 1. PHASE 13 REMAINS THE AUTHORITATIVE EMPLOYEE MASTER.
 * 2. INTEGRATES WITH PHASE 33 CALENDAR, PHASE 37 FEEDBACK, AND PHASE 38 SOP/KNOWLEDGE.
 * 3. STRICTLY NO SMS — IN-APP PORTAL ALERTS ONLY.
 * 4. PROVIDES A NON-DUPLICATIVE PROFESSIONAL DEVELOPMENT PROFILE FOR PHASE 13 EMPLOYEES.
 */

import {
  getAllTrainingPrograms,
  getAllEnrollments,
  getAllCertificates,
  getAllDevelopmentPlans,
} from "./trainingStore";
import {
  TrainingProgram,
  TrainingEnrollment,
  TrainingCertificate,
  ProfessionalDevelopmentPlan,
} from "./types";

export interface EmployeeTrainingProfile {
  employeeId: string;
  totalTrainingsAttended: number;
  completedTrainingsCount: number;
  totalTrainingHours: number;
  activeEnrollments: TrainingEnrollment[];
  completedTrainings: {
    enrollment: TrainingEnrollment;
    programTitleBn: string;
    certificate?: TrainingCertificate;
  }[];
  mandatoryPending: TrainingEnrollment[];
  certificates: TrainingCertificate[];
  expiringCertificates: TrainingCertificate[];
  developmentPlans: ProfessionalDevelopmentPlan[];
}

/**
 * Returns complete institutional training summary for an employee
 * (Safe for embedding in Phase 13 Employee View without duplicating employee data)
 */
export function getEmployeeTrainingProfile(employeeId: string): EmployeeTrainingProfile {
  const allPrograms = getAllTrainingPrograms();
  const allEnrollments = getAllEnrollments();
  const allCertificates = getAllCertificates();
  const allPlans = getAllDevelopmentPlans();

  const empEnrollments = allEnrollments.filter((e) => e.employeeId === employeeId);
  const empCertificates = allCertificates.filter((c) => c.employeeId === employeeId);
  const empPlans = allPlans.filter((p) => p.employeeId === employeeId);

  const today = new Date().toISOString().split("T")[0];
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const activeEnrollments = empEnrollments.filter(
    (e) => !e.isCompleted && e.status !== "WITHDRAWN" && e.status !== "FAILED"
  );

  const completedTrainings = empEnrollments
    .filter((e) => e.isCompleted || e.status === "COMPLETED")
    .map((enrollment) => {
      const prog = allPrograms.find((p) => p.id === enrollment.trainingProgramId);
      const cert = empCertificates.find((c) => c.trainingProgramId === enrollment.trainingProgramId);
      return {
        enrollment,
        programTitleBn: prog?.titleBn || "প্রশিক্ষণ কার্যক্রম",
        certificate: cert,
      };
    });

  const mandatoryPending = empEnrollments.filter(
    (e) => e.isMandatory && !e.isCompleted && e.status !== "EXEMPT"
  );

  const expiringCertificates = empCertificates.filter(
    (c) => c.status === "VALID" && c.validUntil && c.validUntil <= in30Days && c.validUntil >= today
  );

  // Calculate training hours accumulated
  let totalHours = 0;
  for (const c of completedTrainings) {
    const prog = allPrograms.find((p) => p.id === c.enrollment.trainingProgramId);
    if (prog) {
      totalHours += prog.totalHours;
    }
  }

  return {
    employeeId,
    totalTrainingsAttended: empEnrollments.length,
    completedTrainingsCount: completedTrainings.length,
    totalTrainingHours: totalHours,
    activeEnrollments,
    completedTrainings,
    mandatoryPending,
    certificates: empCertificates,
    expiringCertificates,
    developmentPlans: empPlans,
  };
}

/**
 * Calendar Event Payload generator for Phase 33 synchronization
 */
export function buildCalendarEventForSession(
  program: TrainingProgram,
  session: { id: string; sessionNumber: number; sessionDate: string; startTime: string; endTime: string; venue: string }
) {
  return {
    title: `[প্রশিক্ষণ] ${program.titleBn} - সেশন ${session.sessionNumber}`,
    startDate: `${session.sessionDate}T${session.startTime}:00`,
    endDate: `${session.sessionDate}T${session.endTime}:00`,
    category: "TRAINING",
    venue: session.venue,
    organizer: program.ownerDepartment,
    instructor: program.instructorName,
    sourcePhase: "PHASE_39_TRAINING",
    referenceId: session.id,
  };
}
