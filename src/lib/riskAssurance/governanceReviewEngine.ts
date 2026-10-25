/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 42
 * Institutional Governance Review & Management Assurance Engine
 * Checkpoint: EHRJ-AI-2026-PHASE42
 */

import { RiskAssuranceStore } from "./riskAssuranceStore";
import {
  GovernanceReviewSession,
  GovernanceReviewStatus,
  ActorContext,
} from "./types";

export class GovernanceReviewEngine {
  /**
   * Generates next institutional Governance Review ID: EHRJ-REV-YYYY-XXXX
   */
  static generateNextReviewId(year = new Date().getFullYear()): string {
    const reviews = RiskAssuranceStore.getReviews();
    const prefix = `EHRJ-REV-${year}-`;
    const yearReviews = reviews.filter((r) => r.id.startsWith(prefix));
    let maxSeq = 0;

    for (const r of yearReviews) {
      const parts = r.id.split("-");
      const seq = parseInt(parts[3], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }

    const nextSeq = String(maxSeq + 1).padStart(4, "0");
    return `${prefix}${nextSeq}`;
  }

  /**
   * Schedules a new periodic Governance Review Session
   */
  static scheduleReview(
    data: {
      periodTitleBn: string;
      reviewDate: string;
      leadReviewerName?: string;
      leadReviewerRole?: string;
      participatingRoles?: string[];
      summaryDecisionsBn?: string;
    },
    actor: ActorContext
  ): GovernanceReviewSession {
    const id = this.generateNextReviewId();
    const now = new Date().toISOString();

    const risks = RiskAssuranceStore.getRisks();
    const controls = RiskAssuranceStore.getControls();
    const findings = RiskAssuranceStore.getFindings();
    const exceptions = RiskAssuranceStore.getExceptions();

    const session: GovernanceReviewSession = {
      id,
      periodTitleBn: data.periodTitleBn.trim(),
      reviewDate: data.reviewDate,
      leadReviewerName: data.leadReviewerName || actor.actorName,
      leadReviewerRole: data.leadReviewerRole || actor.actorRole,
      participatingRoles: data.participatingRoles || ["HEAD_OF_SHARIAH", "CONTROLLER_OF_EXAMINATIONS", "HEAD_OF_ADMIN", "IT_ADMIN"],
      risksReviewedCount: risks.length,
      controlsReviewedCount: controls.length,
      findingsReviewedCount: findings.length,
      exceptionsReviewedCount: exceptions.length,
      summaryDecisionsBn: data.summaryDecisionsBn || "শাসনকার্য ও অভ্যন্তরীণ নিয়ন্ত্রণ সংক্রান্ত ত্রৈমাসিক পর্যালোচনা অধিবেশন নির্ধারিত হয়েছে।",
      actionItemsCount: 0,
      status: "SCHEDULED",
      createdAt: now,
      updatedAt: now,
    };

    RiskAssuranceStore.saveReview(session, actor);
    GovernanceReviewEngine.syncReviewToCalendar(session.id);
    return session;
  }

  /**
   * Completes a Governance Review Session with formal summary and resolutions
   */
  static completeReview(
    reviewId: string,
    data: {
      summaryDecisionsBn: string;
      actionItemsCount: number;
      evidenceRef?: string;
    },
    actor: ActorContext
  ): GovernanceReviewSession {
    const review = RiskAssuranceStore.getReviews().find((r) => r.id === reviewId);
    if (!review) throw new Error(`Review session not found: ${reviewId}`);

    if (actor.actorRole !== "PRINCIPAL" && actor.actorRole !== "ADMIN") {
      throw new Error("শুধুমাত্র অধ্যক্ষ অথবা দায়িত্বপ্রাপ্ত প্রশাসনিক প্রধান শাসনকার্য পর্যালোচনা সম্পন্ন ও অনুমোদন করতে পারবেন।");
    }

    const now = new Date().toISOString();
    review.status = "COMPLETED";
    review.summaryDecisionsBn = data.summaryDecisionsBn.trim();
    review.actionItemsCount = data.actionItemsCount;
    review.evidenceRef = data.evidenceRef;
    review.updatedAt = now;

    RiskAssuranceStore.saveReview(review, actor);

    RiskAssuranceStore.recordAudit({
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now,
      entityType: "REVIEW",
      entityId: review.id,
      action: "COMPLETE_GOVERNANCE_REVIEW",
      actorId: actor.actorId,
      actorName: actor.actorName,
      actorRole: actor.actorRole,
      notes: `শাসনকার্য পর্যালোচনা সম্পন্ন: ${review.periodTitleBn}`,
      details: { reviewId: review.id, decisions: review.summaryDecisionsBn },
    });

    return review;
  }

  /**
   * Phase 33 Calendar Integration:
   * Synchronizes Governance Review Sessions to Institutional Calendar
   */
  static async syncReviewToCalendar(reviewId: string): Promise<{
    success: boolean;
    calendarEventId?: string;
    message: string;
  }> {
    try {
      const review = RiskAssuranceStore.getReviews().find((r) => r.id === reviewId);
      if (!review) {
        return { success: false, message: "শাসনকার্য অধিবেশন পাওয়া যায়নি।" };
      }

      const { getCalendarEvents, saveCalendarEvents } = await import("../calendar/calendarStore");
      const events = getCalendarEvents();
      const eventId = `CAL-REV-${review.id}`;
      const existingIdx = events.findIndex(
        (e) => e.sourceEntityId === review.id || e.id === eventId
      );

      const now = new Date().toISOString();
      const calEvent = {
        id: eventId,
        title: `[শাসনকার্য পর্যালোচনা] ${review.periodTitleBn}`,
        titleBn: `[শাসনকার্য পর্যালোচনা] ${review.periodTitleBn}`,
        eventType: "INSTITUTIONAL" as const,
        startAt: `${review.reviewDate}T10:00:00.000Z`,
        endAt: `${review.reviewDate}T13:00:00.000Z`,
        timezone: "Asia/Dhaka",
        allDay: false,
        status: (review.status === "SCHEDULED" ? "SCHEDULED" : "COMPLETED") as any,
        visibility: "ADMIN_ONLY" as const,
        sourceModule: "GOVERNANCE" as const,
        sourceEntityId: review.id,
        location: "মাদরাসা সম্মেলন কক্ষ (অধ্যক্ষের কার্যালয়)",
        descriptionBn: `অংশগ্রহণকারী: ${review.participatingRoles.join(", ")}. পর্যালোচিত ঝুঁকি: ${review.risksReviewedCount}, নিয়ন্ত্রণ: ${review.controlsReviewedCount}`,
        createdBy: "risk-governance-engine",
        updatedBy: "risk-governance-engine",
        createdAt: now,
        updatedAt: now,
      };

      if (existingIdx >= 0) {
        events[existingIdx] = { ...events[existingIdx], ...calEvent, updatedAt: now };
      } else {
        events.push(calEvent);
      }

      saveCalendarEvents(events);
      return {
        success: true,
        calendarEventId: eventId,
        message: "শাসনকার্য পর্যালোচনা অধিবেশন প্রাতিষ্ঠানিক ক্যালেন্ডারে সিনক্রোনাইজ করা হয়েছে।",
      };
    } catch (err: any) {
      console.warn("Calendar sync failed for review session:", err);
      return { success: false, message: err.message || "Calendar sync failed" };
    }
  }

  static syncReviewToPhase33Calendar = GovernanceReviewEngine.syncReviewToCalendar;
}
