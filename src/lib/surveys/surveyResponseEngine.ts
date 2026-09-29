/**
 * EHRJ Madrasha ERP — Phase 37
 * Survey Response Engine & High-Stakes Invariant Guard
 * Checkpoint: EHRJ-AI-2026-PHASE37
 * 
 * CORE PRINCIPLE:
 * "FEEDBACK INFORMS DECISIONS; IT DOES NOT AUTOMATICALLY MAKE HIGH-STAKES DECISIONS."
 * 
 * Enforces:
 * 1. Duplicate protection per survey & version
 * 2. Question validation & conditional rules
 * 3. Save & resume for in-progress draft responses
 * 4. Technical separation of identity for anonymous responses
 * 5. Strict architectural guard: Zero direct mutation of marks, promotion, payroll, or admission.
 */

import {
  Survey,
  SurveyResponse,
  SurveyAnswer,
  SurveyQuestion,
  ConditionalRule,
} from "./types";
import {
  getSurveys,
  saveSurveys,
  getSurveyResponses,
  saveSurveyResponses,
  appendSurveyAudit,
} from "./surveyStore";

/**
 * Generate standard EHRJ Survey Response ID: EHRJ-SUR-RES-YYYY-XXXXXX
 */
export function generateResponseId(): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `EHRJ-SUR-RES-${year}-${randomSuffix}`;
}

/**
 * Mandatory High-Stakes Decision Invariant Guard
 * Asserts that feedback processing does NOT trigger autonomous high-stakes decisions.
 */
export function assertNoHighStakesDecisionMutation(actionName: string): void {
  const prohibitedMutations = [
    "ALTER_EXAM_MARK",
    "ALTER_STUDENT_PROMOTION",
    "APPROVE_ADMISSION_AUTOMATICALLY",
    "GRANT_FEE_WAIVER",
    "ALTER_STAFF_PAYROLL",
    "TERMINATE_EMPLOYMENT",
    "SUSPEND_ACCOUNT",
    "ISSUE_CERTIFICATE",
  ];

  if (prohibitedMutations.includes(actionName)) {
    throw new Error(
      `[CRITICAL INVARIANT VIOLATION] Action '${actionName}' is strictly prohibited. Feedback results must never autonomously execute high-stakes institutional decisions.`
    );
  }
}

/**
 * Evaluates conditional visibility for a question given prior answers
 */
export function isQuestionVisible(
  question: SurveyQuestion,
  answersMap: Map<string, any>
): boolean {
  if (!question.conditionalRules || question.conditionalRules.length === 0) {
    return true;
  }

  for (const rule of question.conditionalRules) {
    const parentAnswer = answersMap.get(rule.questionId);
    let conditionMet = false;

    switch (rule.operator) {
      case "EQUALS":
        conditionMet = parentAnswer === rule.value;
        break;
      case "NOT_EQUALS":
        conditionMet = parentAnswer !== rule.value;
        break;
      case "CONTAINS":
        conditionMet = Array.isArray(parentAnswer) && parentAnswer.includes(rule.value);
        break;
      case "LESS_THAN_OR_EQUAL":
        conditionMet = typeof parentAnswer === "number" && parentAnswer <= rule.value;
        break;
      case "GREATER_THAN_OR_EQUAL":
        conditionMet = typeof parentAnswer === "number" && parentAnswer >= rule.value;
        break;
      default:
        conditionMet = false;
    }

    if (rule.action === "SHOW" && !conditionMet) {
      return false;
    }
    if (rule.action === "HIDE" && conditionMet) {
      return false;
    }
  }

  return true;
}

/**
 * Validates survey answers against questions and conditional rules
 */
export function validateSurveyAnswers(
  questions: SurveyQuestion[],
  answers: SurveyAnswer[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const answersMap = new Map<string, any>();

  // Index answers
  for (const ans of answers) {
    answersMap.set(ans.questionId, ans.answerValue);
  }

  for (const q of questions) {
    const visible = isQuestionVisible(q, answersMap);
    if (!visible) {
      // Hidden questions are not required to be answered
      continue;
    }

    const answer = answers.find((a) => a.questionId === q.id);
    const val = answer?.answerValue;

    if (q.required) {
      if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
        errors.push(`প্রশ্ন '${q.textBn}' এর উত্তর প্রদান করা আবশ্যক।`);
        continue;
      }
    }

    if (val !== undefined && val !== null && val !== "") {
      // Type specific validations
      if (q.type === "RATING_SCALE" || q.type === "LIKERT_SCALE") {
        const num = Number(val);
        const min = q.scaleMin || 1;
        const max = q.scaleMax || 5;
        if (isNaN(num) || num < min || num > max) {
          errors.push(`প্রশ্ন '${q.textBn}' এর রেটিং অবশ্যই ${min} থেকে ${max} এর মধ্যে হতে হবে।`);
        }
      }

      if (q.type === "SINGLE_CHOICE" || q.type === "DROPDOWN") {
        if (q.options && q.options.length > 0) {
          const validOpt = q.options.some((o) => o.id === val || o.textBn === val);
          if (!validOpt) {
            errors.push(`প্রশ্ন '${q.textBn}' এর নির্বাচিত অপশনটি সঠিক নয়।`);
          }
        }
      }

      if (q.type === "MULTIPLE_CHOICE") {
        if (!Array.isArray(val)) {
          errors.push(`প্রশ্ন '${q.textBn}' এর উত্তর অবশ্যই একাধিক নির্বাচনের তালিকা হতে হবে।`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Checks whether a respondent has already submitted a response to prevent duplicates
 */
export function checkDuplicateResponse(params: {
  survey: Survey;
  respondentId?: string;
  linkedStudentId?: string;
  participationToken?: string;
}): { isDuplicate: boolean; existingResponseId?: string } {
  const { survey, respondentId, linkedStudentId, participationToken } = params;
  const responses = getSurveyResponses();

  // If response limit is UNLIMITED (e.g. public open suggestions), allow multiple
  if (survey.responseLimit === "UNLIMITED") {
    return { isDuplicate: false };
  }

  for (const resp of responses) {
    if (resp.surveyId !== survey.id || resp.surveyVersion !== survey.version) {
      continue;
    }
    // Only completed responses count as duplicate submissions
    if (!resp.isComplete) {
      continue;
    }

    if (survey.responseMode === "IDENTIFIED" || survey.responseMode === "PSEUDONYMOUS") {
      if (survey.responseLimit === "ONE_PER_STUDENT" && linkedStudentId) {
        if (resp.linkedStudentId === linkedStudentId) {
          return { isDuplicate: true, existingResponseId: resp.id };
        }
      }
      if (respondentId && resp.respondentId === respondentId) {
        return { isDuplicate: true, existingResponseId: resp.id };
      }
    }

    if (participationToken && resp.participationToken === participationToken) {
      return { isDuplicate: true, existingResponseId: resp.id };
    }
  }

  return { isDuplicate: false };
}

/**
 * Submit or save draft survey response
 */
export function submitSurveyResponse(params: {
  surveyId: string;
  respondentId?: string;
  respondentType?: SurveyResponse["respondentType"];
  respondentName?: string;
  linkedStudentId?: string;
  linkedStudentName?: string;
  participationToken?: string;
  answers: SurveyAnswer[];
  isDraft?: boolean;
  ipHash?: string;
  userAgentHash?: string;
}): SurveyResponse {
  // Guard against high-stakes automated decisions
  assertNoHighStakesDecisionMutation("SUBMIT_SURVEY_RESPONSE");

  const surveys = getSurveys();
  const surveyIndex = surveys.findIndex((s) => s.id === params.surveyId);
  if (surveyIndex === -1) {
    throw new Error(`Survey with ID '${params.surveyId}' not found`);
  }

  const survey = surveys[surveyIndex];

  // Survey status validation
  if (survey.status !== "OPEN" && survey.status !== "PUBLISHED") {
    throw new Error(`Survey '${survey.titleBn}' is not open for responses (Current status: ${survey.status})`);
  }

  const isFinalSubmission = !params.isDraft;

  // Duplicate response check for final submissions
  if (isFinalSubmission) {
    const dupCheck = checkDuplicateResponse({
      survey,
      respondentId: params.respondentId,
      linkedStudentId: params.linkedStudentId,
      participationToken: params.participationToken,
    });

    if (dupCheck.isDuplicate) {
      throw new Error(
        `আপনি ইতিমধ্যে এই জরিপটিতে সফলভাবে অংশগ্রহণ করেছেন। (রেফারেন্স: ${dupCheck.existingResponseId})`
      );
    }
  }

  // Question validation for final submission
  if (isFinalSubmission) {
    const valResult = validateSurveyAnswers(survey.questions, params.answers);
    if (!valResult.valid) {
      throw new Error(`Validation failed: ${valResult.errors.join("; ")}`);
    }
  }

  const responses = getSurveyResponses();
  const now = new Date().toISOString();

  // Calculate total score if questions have scores
  let totalScore = 0;
  const processedAnswers: SurveyAnswer[] = params.answers.map((ans) => {
    const q = survey.questions.find((question) => question.id === ans.questionId);
    let score = 0;
    if (q) {
      if (typeof ans.answerValue === "number") {
        score = ans.answerValue;
      } else if (typeof ans.answerValue === "string" && q.options) {
        const opt = q.options.find((o) => o.id === ans.answerValue || o.textBn === ans.answerValue);
        if (opt?.scoreValue) score = opt.scoreValue;
      }
    }
    totalScore += score;
    return {
      ...ans,
      score,
    };
  });

  // Handle Save & Resume: Look for existing draft
  let responseRecord: SurveyResponse;
  const existingDraftIndex = responses.findIndex(
    (r) =>
      r.surveyId === survey.id &&
      r.surveyVersion === survey.version &&
      !r.isComplete &&
      ((params.respondentId && r.respondentId === params.respondentId) ||
        (params.participationToken && r.participationToken === params.participationToken))
  );

  if (existingDraftIndex >= 0) {
    // Resume draft
    responseRecord = {
      ...responses[existingDraftIndex],
      answers: processedAnswers,
      isComplete: isFinalSubmission,
      isDraft: !isFinalSubmission,
      totalScore,
      submittedAt: isFinalSubmission ? now : undefined,
      updatedAt: now,
    };
    responses[existingDraftIndex] = responseRecord;
  } else {
    // Create new response record
    const id = generateResponseId();
    responseRecord = {
      id,
      surveyId: survey.id,
      surveyVersion: survey.version,
      respondentId: survey.responseMode === "ANONYMOUS" ? undefined : params.respondentId,
      respondentType: params.respondentType || (survey.responseMode === "ANONYMOUS" ? "ANONYMOUS" : "PUBLIC"),
      respondentName: survey.responseMode === "IDENTIFIED" ? params.respondentName : undefined,
      linkedStudentId: survey.responseMode === "ANONYMOUS" ? undefined : params.linkedStudentId,
      linkedStudentName: survey.responseMode === "IDENTIFIED" ? params.linkedStudentName : undefined,
      responseMode: survey.responseMode,
      participationToken: params.participationToken,
      isComplete: isFinalSubmission,
      isDraft: !isFinalSubmission,
      answers: processedAnswers,
      totalScore,
      submittedAt: isFinalSubmission ? now : undefined,
      ipHash: survey.responseMode === "ANONYMOUS" ? undefined : params.ipHash,
      userAgentHash: survey.responseMode === "ANONYMOUS" ? undefined : params.userAgentHash,
      createdAt: now,
      updatedAt: now,
    };
    responses.unshift(responseRecord);
  }

  saveSurveyResponses(responses);

  // Update counts on Survey master
  if (isFinalSubmission) {
    survey.responseCount += 1;
    survey.completionCount += 1;
    survey.updatedAt = now;
    surveys[surveyIndex] = survey;
    saveSurveys(surveys);

    appendSurveyAudit({
      surveyId: survey.id,
      action: "SUBMIT_RESPONSE",
      actorId: survey.responseMode === "ANONYMOUS" ? "ANONYMOUS" : params.respondentId || "UNKNOWN",
      actorRole: params.respondentType || "RESPONDENT",
      details: `জরিপে নতুন প্রতিক্রিয়া দাখিল সম্পন্ন [আইডি: ${responseRecord.id}, মোড: ${survey.responseMode}]`,
    });
  }

  return responseRecord;
}
