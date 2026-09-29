/**
 * EHRJ Madrasha ERP — Phase 37
 * Survey Privacy Engine & Small-Group Protection
 * Checkpoint: EHRJ-AI-2026-PHASE37
 * 
 * CORE PRINCIPLE:
 * "ANONYMOUS MEANS PRIVACY MUST BE TECHNICALLY PROTECTED, NOT MERELY PROMISED."
 * 
 * Enforces:
 * 1. Technical sanitization of respondent metadata based on ResponseMode
 * 2. Small-Group Protection: Suppresses granular demographic slicing when response count < 5
 * 3. Role-based response viewing permissions
 */

import {
  Survey,
  SurveyResponse,
  SanitizedSurveyResponse,
  ResponseMode,
} from "./types";

export const MIN_RESPONSE_THRESHOLD = 5; // Minimum responses required before granular breakdown is permitted

/**
 * Check if a user role is permitted to see raw identifiable respondent info
 */
export function canViewRawIdentifiedResponses(role?: string): boolean {
  if (!role) return false;
  const upper = role.toUpperCase();
  return upper === "ADMIN" || upper === "SUPER_ADMIN" || upper === "PRINCIPAL";
}

/**
 * Sanitizes a single survey response according to privacy rules and viewer authorization
 */
export function sanitizeResponseForViewer(
  response: SurveyResponse,
  survey: Survey,
  viewerRole?: string
): SanitizedSurveyResponse {
  const isPrivileged = canViewRawIdentifiedResponses(viewerRole);

  // If the survey is ANONYMOUS, identity is never exposed to anyone
  if (survey.responseMode === "ANONYMOUS" || response.responseMode === "ANONYMOUS") {
    return {
      id: response.id,
      surveyId: response.surveyId,
      surveyVersion: response.surveyVersion,
      responseMode: "ANONYMOUS",
      isComplete: response.isComplete,
      answers: response.answers,
      totalScore: response.totalScore,
      submittedAt: response.submittedAt,
      respondentType: "ANONYMOUS",
    };
  }

  // If the survey is PSEUDONYMOUS, hide real name unless privileged
  if (survey.responseMode === "PSEUDONYMOUS" || response.responseMode === "PSEUDONYMOUS") {
    return {
      id: response.id,
      surveyId: response.surveyId,
      surveyVersion: response.surveyVersion,
      responseMode: "PSEUDONYMOUS",
      isComplete: response.isComplete,
      answers: response.answers,
      totalScore: response.totalScore,
      submittedAt: response.submittedAt,
      respondentType: response.respondentType,
      respondentName: isPrivileged ? response.respondentName : "অভিভাবক (ছদ্মনামযুক্ত)",
      linkedStudentName: isPrivileged ? response.linkedStudentName : undefined,
    };
  }

  // If survey is IDENTIFIED
  return {
    id: response.id,
    surveyId: response.surveyId,
    surveyVersion: response.surveyVersion,
    responseMode: "IDENTIFIED",
    isComplete: response.isComplete,
    answers: response.answers,
    totalScore: response.totalScore,
    submittedAt: response.submittedAt,
    respondentType: response.respondentType,
    respondentName: isPrivileged ? response.respondentName : "পরিচিত অংশগ্রহণকারী",
    linkedStudentName: isPrivileged ? response.linkedStudentName : undefined,
  };
}

/**
 * Sanitizes a list of responses with small-group privacy evaluation
 */
export function sanitizeResponseList(
  responses: SurveyResponse[],
  survey: Survey,
  viewerRole?: string
): {
  responses: SanitizedSurveyResponse[];
  isSmallGroupSuppressed: boolean;
  totalCount: number;
} {
  const totalCount = responses.length;
  const isSmallGroupSuppressed = totalCount > 0 && totalCount < MIN_RESPONSE_THRESHOLD;

  const sanitized = responses.map((r) =>
    sanitizeResponseForViewer(r, survey, viewerRole)
  );

  return {
    responses: sanitized,
    isSmallGroupSuppressed,
    totalCount,
  };
}
