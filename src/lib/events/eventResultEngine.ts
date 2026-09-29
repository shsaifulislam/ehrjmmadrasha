/**
 * EHRJ Event Competition & Awards Result Engine
 * Checkpoint: EHRJ-AI-2026-PHASE35
 * Strict domain separation: Event competition results are completely isolated from academic exam results.
 * Manages competition categories, participant scores, rankings, awards and public publishing.
 */

import { EventCompetitionResult, AwardRecognitionType } from "./types";
import {
  getCompetitionResults,
  saveCompetitionResults,
  getEventById,
  appendEventAudit,
} from "./eventStore";
import { prisma } from "../prisma";

export interface RecordResultParams {
  eventId: string;
  studentId: string;
  competitionCategory: string;
  score?: number;
  maxScore?: number;
  rank?: number;
  awardType?: AwardRecognitionType;
  judgeName?: string;
  judgeCommentsBn?: string;
  isPublished?: boolean;
  evaluatedByUserId: string;
}

/**
 * Record or update a student's competition result
 */
export async function recordCompetitionResult(
  params: RecordResultParams
): Promise<{ success: boolean; result?: EventCompetitionResult; error?: string }> {
  const {
    eventId,
    studentId,
    competitionCategory,
    score,
    maxScore = 100,
    rank,
    awardType,
    judgeName,
    judgeCommentsBn,
    isPublished = false,
    evaluatedByUserId,
  } = params;

  // 1. Verify Event
  const event = getEventById(eventId);
  if (!event) {
    return { success: false, error: "ইভেন্টটি পাওয়া যায়নি।" };
  }

  // 2. Resolve Student from Student Master
  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    return { success: false, error: "শিক্ষার্থী তথ্য পাওয়া যায়নি।" };
  }

  const results = getCompetitionResults();
  const existingIndex = results.findIndex(
    (r) =>
      r.eventId === eventId &&
      r.studentId === studentId &&
      r.competitionCategory === competitionCategory
  );

  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    const existing = results[existingIndex];
    existing.score = score !== undefined ? score : existing.score;
    existing.maxScore = maxScore || existing.maxScore;
    existing.rank = rank !== undefined ? rank : existing.rank;
    existing.awardType = awardType || existing.awardType;
    existing.judgeName = judgeName || existing.judgeName;
    existing.judgeCommentsBn = judgeCommentsBn || existing.judgeCommentsBn;
    existing.isPublished = isPublished !== undefined ? isPublished : existing.isPublished;
    if (isPublished && !existing.publishedAt) {
      existing.publishedAt = now;
    }
    existing.updatedAt = now;
    results[existingIndex] = existing;
    saveCompetitionResults(results);

    appendEventAudit({
      eventId,
      action: "RECORD_RESULT",
      actorId: evaluatedByUserId,
      actorRole: "TEACHER",
      details: `প্রতিযোগিতার ফলাফল আপডেট: ${student.fullNameBn} (${student.studentIdNumber}) - বিভাগ: ${competitionCategory}, নম্বর: ${score || "-"}`,
    });

    return { success: true, result: existing };
  }

  const currentYear = new Date().getFullYear();
  const resId = `EHRJ-EVT-RES-${currentYear}-${String(results.length + 1).padStart(6, "0")}`;

  const newResult: EventCompetitionResult = {
    id: resId,
    eventId,
    studentId: student.id,
    studentNameBn: student.fullNameBn,
    studentIdNumber: student.studentIdNumber,
    competitionCategory,
    score,
    maxScore,
    rank,
    awardType,
    judgeName,
    judgeCommentsBn,
    isPublished,
    publishedAt: isPublished ? now : undefined,
    evaluatedByUserId,
    createdAt: now,
    updatedAt: now,
  };

  results.push(newResult);
  saveCompetitionResults(results);

  appendEventAudit({
    eventId,
    action: "RECORD_RESULT",
    actorId: evaluatedByUserId,
    actorRole: "TEACHER",
    details: `প্রতিযোগিতার ফলাফল লিপিবদ্ধ: ${student.fullNameBn} (${student.studentIdNumber}) - বিভাগ: ${competitionCategory}`,
  });

  return { success: true, result: newResult };
}

/**
 * Publishes all results for an event
 */
export function publishEventResults(
  eventId: string,
  actorId: string,
  actorRole: string
): { success: boolean; count: number; error?: string } {
  if (!["ADMIN", "PRINCIPAL"].includes(actorRole)) {
    return {
      success: false,
      count: 0,
      error: "অননুমোদিত: শুধুমাত্র প্রশাসন বা মুহতামিম ফলাফল প্রকাশ করতে পারবেন।",
    };
  }

  const results = getCompetitionResults();
  const now = new Date().toISOString();
  let count = 0;

  for (const r of results) {
    if (r.eventId === eventId && !r.isPublished) {
      r.isPublished = true;
      r.publishedAt = now;
      r.updatedAt = now;
      count += 1;
    }
  }

  if (count > 0) {
    saveCompetitionResults(results);
    appendEventAudit({
      eventId,
      action: "PUBLISH_RESULTS",
      actorId,
      actorRole,
      details: `মোট ${count} টি প্রতিযোগিতার ফলাফল আনুষ্ঠানিকভাবে প্রকাশিত হলো।`,
    });
  }

  return { success: true, count };
}

/**
 * Get results for an event
 */
export function getEventResults(eventId: string, publicOnly = false): EventCompetitionResult[] {
  const results = getCompetitionResults();
  return results.filter((r) => r.eventId === eventId && (!publicOnly || r.isPublished));
}
