/**
 * Centralized Attendance Date Normalization & Analytics Calculation Service
 * 
 * Rules:
 * 1. Consistent institutional date handling: Normalizes any date to UTC midnight YYYY-MM-DDT00:00:00.000Z.
 * 2. Unambiguous percentage calculation for classroom and reporting.
 * 3. Configurable correction window (default 24 hours).
 */

export const DEFAULT_CORRECTION_WINDOW_HOURS = 24;

/**
 * Normalizes any string date (YYYY-MM-DD or ISO) or Date instance to UTC midnight.
 * Prevents timezone skew and off-by-one errors across browsers/timezones.
 */
export function normalizeAttendanceDate(input: string | Date): Date {
  if (!input) {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
  }

  if (typeof input === "string") {
    // If format is YYYY-MM-DD
    const match = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    }
  }

  const d = new Date(input);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
}

/**
 * Formats a Date to institutional YYYY-MM-DD string.
 */
export function formatAttendanceDate(d: Date | string): string {
  const normalized = normalizeAttendanceDate(d);
  return normalized.toISOString().split("T")[0];
}

export interface AttendanceItem {
  status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | string;
}

export interface AttendanceAnalytics {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leaveDays: number;
  percentage: number; // Institutional Present-equivalent percentage
  rawPresentPercentage: number;
  totalEligibleStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  leaveCount: number;
  attendanceRate: number;
}

/**
 * Calculates complete attendance metrics from an array of attendance records.
 * Basic model: Present-equivalent = (Present + Late * 0.5 + Leave)
 */
export function calculateAttendanceStats(records: AttendanceItem[]): AttendanceAnalytics {
  const totalDays = records.length;
  if (totalDays === 0) {
    return {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      leaveDays: 0,
      percentage: 0,
      rawPresentPercentage: 0,
      totalEligibleStudents: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      leaveCount: 0,
      attendanceRate: 0,
    };
  }

  let presentDays = 0;
  let absentDays = 0;
  let lateDays = 0;
  let leaveDays = 0;

  for (const item of records) {
    const st = item.status?.toUpperCase();
    if (st === "PRESENT") presentDays++;
    else if (st === "ABSENT") absentDays++;
    else if (st === "LATE") lateDays++;
    else if (st === "LEAVE") leaveDays++;
  }

  // Raw percentage: Present / Total
  const rawPresentPercentage = Math.round((presentDays / totalDays) * 100);

  // Present-equivalent: Present + (Late * 0.5) + Leave (approved leave is not penalized)
  const equivalentPresent = presentDays + lateDays * 0.5 + leaveDays;
  const percentage = Math.min(100, Math.round((equivalentPresent / totalDays) * 100));

  return {
    totalDays,
    presentDays,
    absentDays,
    lateDays,
    leaveDays,
    percentage,
    rawPresentPercentage,
    totalEligibleStudents: totalDays,
    presentCount: presentDays,
    absentCount: absentDays,
    lateCount: lateDays,
    leaveCount: leaveDays,
    attendanceRate: percentage,
  };
}

/**
 * Checks whether an attendance record or sheet is still within the allowed teacher correction window.
 * Based on creation/marking timestamp.
 */
export function isWithinCorrectionWindow(
  markedAt: Date | string,
  windowHours: number = DEFAULT_CORRECTION_WINDOW_HOURS
): boolean {
  const markedTime = new Date(markedAt).getTime();
  const now = Date.now();
  const diffHours = (now - markedTime) / (1000 * 60 * 60);
  return diffHours <= windowHours;
}
