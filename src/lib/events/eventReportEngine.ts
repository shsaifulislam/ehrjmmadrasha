/**
 * EHRJ Event Reporting & Engagement Analytics Engine
 * Checkpoint: EHRJ-AI-2026-PHASE35
 * Generates verified institutional event summaries, attendance statistics,
 * achievement records and feedback analytics.
 */

import { EventSummaryReport, InstitutionalEvent } from "./types";
import {
  getEventById,
  getRegistrations,
  getAttendanceRecords,
  getCompetitionResults,
  getCertificateLinks,
  getEventFeedbacks,
} from "./eventStore";

export function generateEventSummaryReport(eventId: string): EventSummaryReport | null {
  const event = getEventById(eventId);
  if (!event) return null;

  const registrations = getRegistrations().filter((r) => r.eventId === eventId);
  const totalRegistered = registrations.length;
  const totalWaitlisted = registrations.filter((r) => r.status === "WAITLISTED").length;
  const totalApproved = registrations.filter((r) => r.status === "CONFIRMED" || r.status === "APPROVED").length;

  const attendances = getAttendanceRecords().filter((a) => a.eventId === eventId);
  const totalPresent = attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const totalAbsent = attendances.filter((a) => a.status === "ABSENT").length;
  const denominator = totalApproved > 0 ? totalApproved : attendances.length;
  const attendanceRatePercent = denominator > 0 ? Math.round((totalPresent / denominator) * 100) : 0;

  const results = getCompetitionResults().filter((r) => r.eventId === eventId);
  const topAchievements = results
    .filter((r) => r.rank !== undefined || r.awardType)
    .sort((a, b) => (a.rank || 99) - (b.rank || 99));

  const certs = getCertificateLinks().filter((c) => c.eventId === eventId && !c.isRevoked);

  const feedbacks = getEventFeedbacks().filter((f) => f.eventId === eventId);
  const totalFeedbacks = feedbacks.length;
  const averageRating =
    totalFeedbacks > 0
      ? Number((feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks).toFixed(1))
      : 0;

  return {
    event,
    totalRegistered,
    totalWaitlisted,
    totalApproved,
    totalPresent,
    totalAbsent,
    attendanceRatePercent,
    resultsCount: results.length,
    topAchievements,
    certificatesIssuedCount: certs.length,
    feedbackSummary: {
      totalFeedbacks,
      averageRating,
    },
  };
}
