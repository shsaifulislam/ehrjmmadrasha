/**
 * EHRJ Event Attendance & Check-In Engine
 * Checkpoint: EHRJ-AI-2026-PHASE35
 * Strict domain separation: Event attendance is completely isolated from daily academic attendance.
 * Supports QR code check-ins, manual teacher/admin panel check-ins, and offline sync.
 */

import { EventAttendanceRecord, EventAttendanceStatus } from "./types";
import {
  getAttendanceRecords,
  saveAttendanceRecords,
  getEventById,
  getRegistrations,
  appendEventAudit,
} from "./eventStore";
import { prisma } from "../prisma";

export interface CheckInParams {
  eventId: string;
  studentIdOrCode: string; // studentId or studentIdNumber
  status?: EventAttendanceStatus;
  recordedByTeacherId?: string;
  recordedByTeacherName?: string;
  recordedMethod: "QR_SCAN" | "MANUAL_PANEL" | "OFFLINE_SYNC";
  notes?: string;
}

export interface CheckInResult {
  success: boolean;
  attendance?: EventAttendanceRecord;
  error?: string;
}

/**
 * Record check-in / attendance for an event participant
 */
export async function recordEventAttendance(
  params: CheckInParams
): Promise<CheckInResult> {
  const {
    eventId,
    studentIdOrCode,
    status = "PRESENT",
    recordedByTeacherId,
    recordedByTeacherName,
    recordedMethod,
    notes,
  } = params;

  // 1. Verify Event exists and is active/in-progress/published
  const event = getEventById(eventId);
  if (!event) {
    return { success: false, error: "ইভেন্টটি পাওয়া যায়নি।" };
  }

  if (["DRAFT", "ARCHIVED", "CANCELLED"].includes(event.status)) {
    return {
      success: false,
      error: `ইভেন্টের বর্তমান অবস্থায় (${event.status}) উপস্থিতি গ্রহণ করা সম্ভব নয়।`,
    };
  }

  // 2. Resolve Student from Student Master
  const student = await prisma.student.findFirst({
    where: {
      OR: [
        { id: studentIdOrCode },
        { studentIdNumber: studentIdOrCode },
      ],
    },
  });

  if (!student) {
    return { success: false, error: "শিক্ষার্থী তথ্য পাওয়া যায়নি বা কিউআর কোডটি সঠিক নয়।" };
  }

  // 3. If registration is required for this event, verify registration status
  const registrations = getRegistrations();
  const reg = registrations.find(
    (r) =>
      r.eventId === eventId &&
      r.studentId === student.id &&
      (r.status === "CONFIRMED" || r.status === "APPROVED")
  );

  if (event.isRegistrationRequired && !reg) {
    return {
      success: false,
      error: "শিক্ষার্থী এই ইভেন্টে অনুমোদিত নিবন্ধিত তালিকায় অন্তর্ভুক্ত নয়।",
    };
  }

  // 4. Duplicate Check-in Prevention
  const attendanceList = getAttendanceRecords();
  const existingRecordIndex = attendanceList.findIndex(
    (a) => a.eventId === eventId && a.studentId === student.id
  );

  const now = new Date().toISOString();

  if (existingRecordIndex >= 0) {
    const existing = attendanceList[existingRecordIndex];
    if (existing.status === "PRESENT" && status === "PRESENT") {
      return {
        success: false,
        error: `শিক্ষার্থী ইতিমধ্যে চেক-ইন সম্পন্ন করেছে (${new Date(existing.checkInAt || existing.createdAt).toLocaleTimeString("bn-BD")})।`,
        attendance: existing,
      };
    }
    // Update existing record (e.g. from ABSENT to PRESENT or adding checkout)
    existing.status = status;
    existing.notes = notes || existing.notes;
    existing.updatedAt = now;
    if (status === "PRESENT" && !existing.checkInAt) {
      existing.checkInAt = now;
    }
    attendanceList[existingRecordIndex] = existing;
    saveAttendanceRecords(attendanceList);

    appendEventAudit({
      eventId,
      action: "MARK_ATTENDANCE",
      actorId: recordedByTeacherId || "STAFF",
      actorRole: "TEACHER",
      details: `উপস্থিতি হালনাগাদ: ${student.fullNameBn} (${student.studentIdNumber}) - স্ট্যাটাস: ${status}`,
    });

    return { success: true, attendance: existing };
  }

  // 5. Create new Attendance Record
  const currentYear = new Date().getFullYear();
  const attId = `EHRJ-EVT-ATT-${currentYear}-${String(attendanceList.length + 1).padStart(6, "0")}`;

  const newRecord: EventAttendanceRecord = {
    id: attId,
    eventId,
    studentId: student.id,
    studentNameBn: student.fullNameBn,
    studentIdNumber: student.studentIdNumber,
    registrationId: reg?.id,
    status,
    checkInAt: status === "PRESENT" ? now : undefined,
    recordedByTeacherId,
    recordedByTeacherName,
    recordedMethod,
    notes,
    createdAt: now,
    updatedAt: now,
  };

  attendanceList.push(newRecord);
  saveAttendanceRecords(attendanceList);

  appendEventAudit({
    eventId,
    action: "MARK_ATTENDANCE",
    actorId: recordedByTeacherId || "STAFF",
    actorRole: "TEACHER",
    details: `ইভেন্ট চেক-ইন সম্পন্ন: ${student.fullNameBn} (${student.studentIdNumber}) - পদ্ধতি: ${recordedMethod}`,
  });

  return { success: true, attendance: newRecord };
}

/**
 * Get attendance records for an event
 */
export function getEventAttendance(eventId: string): EventAttendanceRecord[] {
  const records = getAttendanceRecords();
  return records.filter((r) => r.eventId === eventId);
}
