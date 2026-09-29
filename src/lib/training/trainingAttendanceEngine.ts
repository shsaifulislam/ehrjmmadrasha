/**
 * EHRJ MADRASHA ERP — PHASE 39
 * Training Attendance Engine
 * 
 * Invariants:
 * 1. TRAINING ATTENDANCE IS COMPLETELY SEPARATE FROM HR/PAYROLL ATTENDANCE.
 * 2. IT NEVER WRITES TO PAYROLL OR ACADEMIC ATTENDANCE TABLES.
 * 3. SUPPORTS QR CODE-ASSISTED VERIFICATION AND RECALCULATES PROGRAM ATTENDANCE RATE.
 */

import {
  TrainingAttendanceRecord,
  AttendanceStatus,
  TrainingEnrollment,
} from "./types";
import {
  getTrainingProgramById,
  getAllTrainingPrograms,
  getAllAttendanceRecords,
  saveAttendanceRecord,
  getAllEnrollments,
  saveEnrollment,
  recordTrainingAudit,
} from "./trainingStore";
import { ActorContext } from "./trainingLifecycleEngine";

export interface AttendanceInput {
  trainingProgramId: string;
  sessionId: string;
  employeeId: string;
  employeeName: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  qrVerified?: boolean;
  notes?: string;
}

/**
 * Records attendance for a session and recalculates overall training attendance rate
 */
export function recordSessionAttendance(
  input: AttendanceInput,
  actor: ActorContext
): { success: boolean; record?: TrainingAttendanceRecord; updatedRate: number; error?: string } {
  const program = getTrainingProgramById(input.trainingProgramId);
  if (!program) {
    return { success: false, updatedRate: 0, error: "Training program not found" };
  }

  const session = program.sessions.find((s) => s.id === input.sessionId);
  if (!session) {
    return { success: false, updatedRate: 0, error: "Training session not found in program" };
  }

  const now = new Date().toISOString();
  const allRecords = getAllAttendanceRecords();

  // Find existing record for this session + employee
  const existingRecord = allRecords.find(
    (r) => r.sessionId === input.sessionId && r.employeeId === input.employeeId
  );

  const record: TrainingAttendanceRecord = {
    id: existingRecord?.id || `ATT-TRN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    trainingProgramId: input.trainingProgramId,
    sessionId: input.sessionId,
    employeeId: input.employeeId,
    employeeName: input.employeeName,
    status: input.status,
    checkInTime: input.checkInTime || (input.status === "PRESENT" ? now : undefined),
    checkOutTime: input.checkOutTime,
    qrVerified: !!input.qrVerified,
    recordedBy: actor.actorName,
    recordedAt: now,
    notes: input.notes,
  };

  saveAttendanceRecord(record);

  // Recalculate attendance rate for this employee in this program
  const updatedRate = recalculateEnrollmentAttendance(input.trainingProgramId, input.employeeId);

  recordTrainingAudit({
    trainingProgramId: input.trainingProgramId,
    employeeId: input.employeeId,
    action: "RECORD_ATTENDANCE",
    actorId: actor.actorId,
    actorName: actor.actorName,
    actorRole: actor.actorRole,
    notes: `Attendance recorded for ${input.employeeName} at Session ${session.sessionNumber}: ${input.status} (Rate: ${updatedRate}%)`,
    details: {
      sessionId: input.sessionId,
      status: input.status,
      qrVerified: !!input.qrVerified,
      attendanceRate: updatedRate,
    },
  });

  return { success: true, record, updatedRate };
}

/**
 * QR Check-in verification helper
 */
export function verifyQrCheckIn(
  qrPayload: string,
  expectedSessionId: string,
  employee: { employeeId: string; employeeName: string },
  actor: ActorContext
): { success: boolean; record?: TrainingAttendanceRecord; error?: string } {
  // Expected QR payload format: EHRJ-QR-TRN-{sessionId}
  if (!qrPayload.includes(expectedSessionId)) {
    return { success: false, error: "কিউআর কোডটি এই সেশনের জন্য প্রযোজ্য নয় (Cross-session or invalid QR)" };
  }

  // Check if duplicate check-in
  const allRecords = getAllAttendanceRecords();
  const alreadyCheckedIn = allRecords.find(
    (r) => r.sessionId === expectedSessionId && r.employeeId === employee.employeeId && r.status === "PRESENT"
  );

  if (alreadyCheckedIn) {
    return {
      success: true,
      record: alreadyCheckedIn,
      error: "কর্মী ইতিমধ্যে এই সেশনে উপস্থিত হিসেবে চেক-ইন করেছেন।",
    };
  }

  // Find program that contains this session
  const allProgs = getAllTrainingPrograms();
  const program = allProgs.find((p) => p.sessions && p.sessions.some((s) => s.id === expectedSessionId));
  if (!program) {
    return { success: false, error: "সেশনটির প্রশিক্ষণ কার্যক্রম খুঁজে পাওয়া যায়নি।" };
  }

  return recordSessionAttendance(
    {
      trainingProgramId: program.id,
      sessionId: expectedSessionId,
      employeeId: employee.employeeId,
      employeeName: employee.employeeName,
      status: "PRESENT",
      qrVerified: true,
      notes: "Verified via Institutional QR Scanner",
    },
    actor
  );
}

/**
 * Recalculates enrollment attendance percentage and updates status
 */
export function recalculateEnrollmentAttendance(programId: string, employeeId: string): number {
  const program = getTrainingProgramById(programId);
  if (!program || program.sessions.length === 0) return 100;

  const totalSessions = program.sessions.length;
  const allRecords = getAllAttendanceRecords();
  const employeeRecords = allRecords.filter(
    (r) => r.trainingProgramId === programId && r.employeeId === employeeId
  );

  // Present or Late counts as attended; Partial counts as 0.5
  let attendedCount = 0;
  for (const rec of employeeRecords) {
    if (rec.status === "PRESENT" || rec.status === "LATE") {
      attendedCount += 1;
    } else if (rec.status === "PARTIAL") {
      attendedCount += 0.5;
    }
  }

  const attendanceRate = Math.min(100, Math.round((attendedCount / totalSessions) * 100));

  // Update enrollment
  const allEnrollments = getAllEnrollments();
  const enrollment = allEnrollments.find(
    (e) => e.trainingProgramId === programId && e.employeeId === employeeId
  );

  if (enrollment) {
    enrollment.attendanceRate = attendanceRate;
    if (attendanceRate >= program.attendanceThresholdPercentage) {
      if (enrollment.status === "CONFIRMED" || enrollment.status === "ASSIGNED") {
        enrollment.status = "ATTENDED";
      }
    } else if (attendanceRate > 0) {
      if (enrollment.status === "CONFIRMED" || enrollment.status === "ASSIGNED") {
        enrollment.status = "PARTIALLY_ATTENDED";
      }
    }
    saveEnrollment(enrollment);
  }

  return attendanceRate;
}
