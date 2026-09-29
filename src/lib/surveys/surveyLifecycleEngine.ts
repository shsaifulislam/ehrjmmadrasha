/**
 * EHRJ Madrasha ERP — Phase 37
 * Survey Lifecycle & Versioning Engine
 * Checkpoint: EHRJ-AI-2026-PHASE37
 * 
 * Enforces controlled state transitions:
 * DRAFT -> REVIEW -> APPROVED -> PUBLISHED -> OPEN -> CLOSED -> ANALYZING -> COMPLETED -> ARCHIVED -> CANCELLED
 * 
 * Enforces Question Immutability on Published surveys:
 * Historical survey responses are locked to their respective version.
 * Modifications require branching into a new version (v1 -> v2).
 */

import {
  Survey,
  SurveyStatus,
  SurveyQuestion,
  SurveyAudience,
  AudienceSnapshot,
} from "./types";
import {
  getSurveys,
  saveSurveys,
  appendSurveyAudit,
} from "./surveyStore";

// Allowed state transitions map
const VALID_TRANSITIONS: Record<SurveyStatus, SurveyStatus[]> = {
  DRAFT: ["REVIEW", "CANCELLED"],
  REVIEW: ["DRAFT", "APPROVED", "CANCELLED"],
  APPROVED: ["PUBLISHED", "DRAFT", "CANCELLED"],
  PUBLISHED: ["OPEN", "CLOSED", "ARCHIVED", "CANCELLED"],
  OPEN: ["CLOSED", "CANCELLED"],
  CLOSED: ["ANALYZING", "ARCHIVED", "OPEN"],
  ANALYZING: ["COMPLETED", "CLOSED", "ARCHIVED"],
  COMPLETED: ["ARCHIVED", "OPEN"],
  ARCHIVED: [],
  CANCELLED: ["DRAFT", "ARCHIVED"],
};

/**
 * Generate standard EHRJ Survey ID: EHRJ-SUR-YYYY-XXXXXX
 */
export function generateSurveyId(): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `EHRJ-SUR-${year}-${randomSuffix}`;
}

/**
 * Create a new survey in DRAFT status
 */
export function createSurveyDraft(params: {
  titleBn: string;
  titleEn: string;
  titleAr?: string;
  descriptionBn: string;
  descriptionEn?: string;
  surveyType: Survey["surveyType"];
  ownerId: string;
  ownerName: string;
  audience: SurveyAudience;
  startDate: string;
  endDate: string;
  responseMode: Survey["responseMode"];
  responseLimit?: Survey["responseLimit"];
  instructionsBn?: string;
  relatedModule?: Survey["relatedModule"];
  relatedEntityId?: string;
  isPublic?: boolean;
  questions?: SurveyQuestion[];
  allowHelpdeskConversion?: boolean;
}): Survey {
  const surveys = getSurveys();
  const now = new Date().toISOString();
  const id = generateSurveyId();

  const newSurvey: Survey = {
    id,
    titleBn: params.titleBn,
    titleEn: params.titleEn,
    titleAr: params.titleAr,
    descriptionBn: params.descriptionBn,
    descriptionEn: params.descriptionEn,
    surveyType: params.surveyType,
    ownerId: params.ownerId,
    ownerName: params.ownerName,
    audience: params.audience,
    startDate: params.startDate,
    endDate: params.endDate,
    status: "DRAFT",
    responseMode: params.responseMode,
    responseLimit: params.responseLimit || "ONE_PER_USER",
    version: 1,
    isVersionLocked: false,
    instructionsBn: params.instructionsBn,
    relatedModule: params.relatedModule,
    relatedEntityId: params.relatedEntityId,
    isPublic: Boolean(params.isPublic),
    questions: params.questions || [],
    responseCount: 0,
    completionCount: 0,
    allowHelpdeskConversion: params.allowHelpdeskConversion !== false,
    createdAt: now,
    updatedAt: now,
  };

  surveys.unshift(newSurvey);
  saveSurveys(surveys);

  appendSurveyAudit({
    surveyId: id,
    action: "CREATE_SURVEY",
    actorId: params.ownerId,
    actorRole: "ADMIN",
    details: `নতুন জরিপ তৈরি (খসড়া): ${params.titleBn} [${id}]`,
  });

  return newSurvey;
}

/**
 * Update an existing survey.
 * If survey is published or version locked, question changes are rejected!
 */
export function updateSurvey(
  id: string,
  updates: Partial<Survey>,
  actorId: string,
  actorRole: string = "ADMIN"
): Survey {
  const surveys = getSurveys();
  const index = surveys.findIndex((s) => s.id === id);
  if (index === -1) {
    throw new Error(`Survey with ID '${id}' not found`);
  }

  const existing = surveys[index];

  // Immutability Check: If version is locked, question modifications are strictly forbidden!
  if (existing.isVersionLocked && updates.questions) {
    throw new Error(
      `Survey '${id}' is locked (version ${existing.version}). Modifying questions directly is prohibited. Please create a new version (v${existing.version + 1}).`
    );
  }

  const updated: Survey = {
    ...existing,
    ...updates,
    id: existing.id, // ID remains immutable
    version: existing.version, // Version increment must go through createNewSurveyVersion
    isVersionLocked: existing.isVersionLocked,
    updatedAt: new Date().toISOString(),
  };

  surveys[index] = updated;
  saveSurveys(surveys);

  appendSurveyAudit({
    surveyId: id,
    action: "UPDATE_SURVEY",
    actorId,
    actorRole,
    details: `জরিপ তথ্য হালনাগাদ করা হয়েছে: ${updated.titleBn} (সংস্করণ: ${updated.version})`,
  });

  return updated;
}

/**
 * Transition survey status through authorized state machine
 */
export function transitionSurveyStatus(
  id: string,
  newStatus: SurveyStatus,
  actorId: string,
  actorRole: string = "ADMIN",
  reason?: string
): Survey {
  const surveys = getSurveys();
  const index = surveys.findIndex((s) => s.id === id);
  if (index === -1) {
    throw new Error(`Survey with ID '${id}' not found`);
  }

  const survey = surveys[index];
  const currentStatus = survey.status;

  if (currentStatus === newStatus) {
    return survey;
  }

  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(newStatus)) {
    throw new Error(
      `Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed transitions: ${allowed ? allowed.join(", ") : "None"}`
    );
  }

  const now = new Date().toISOString();
  survey.status = newStatus;
  survey.updatedAt = now;

  // When publishing or opening, lock the version so questions cannot be tampered with
  if (newStatus === "PUBLISHED" || newStatus === "OPEN") {
    survey.isVersionLocked = true;

    // Capture Audience Snapshot if not already captured
    if (!survey.audienceSnapshot) {
      survey.audienceSnapshot = {
        audienceDefinition: survey.audience,
        targetCount: estimateAudienceCount(survey.audience),
        snapshotTimestamp: now,
        surveyVersion: survey.version,
      };
    }
  }

  surveys[index] = survey;
  saveSurveys(surveys);

  appendSurveyAudit({
    surveyId: id,
    action: newStatus === "PUBLISHED" ? "PUBLISH_SURVEY" : newStatus === "OPEN" ? "OPEN_SURVEY" : newStatus === "CLOSED" ? "CLOSE_SURVEY" : "UPDATE_SURVEY",
    actorId,
    actorRole,
    details: `জরিপ স্ট্যাটাস পরিবর্তন: '${currentStatus}' -> '${newStatus}'. ${reason ? `কারণ: ${reason}` : ""}`,
  });

  return survey;
}

/**
 * Create a new immutable version of a published survey (e.g. v1 -> v2)
 * The historical version remains untouched with its responses, while the new version is editable as DRAFT.
 */
export function createNewSurveyVersion(
  surveyId: string,
  actorId: string,
  actorRole: string = "ADMIN"
): Survey {
  const surveys = getSurveys();
  const original = surveys.find((s) => s.id === surveyId);
  if (!original) {
    throw new Error(`Survey '${surveyId}' not found`);
  }

  const now = new Date().toISOString();
  const newVersionNumber = original.version + 1;
  const newSurveyId = generateSurveyId();

  const newVersionSurvey: Survey = {
    ...original,
    id: newSurveyId,
    version: newVersionNumber,
    isVersionLocked: false,
    status: "DRAFT",
    previousSurveyId: original.id,
    followUpSurveyId: undefined,
    responseCount: 0,
    completionCount: 0,
    audienceSnapshot: undefined,
    questions: JSON.parse(JSON.stringify(original.questions)), // deep copy
    createdAt: now,
    updatedAt: now,
  };

  // Link original to the new follow-up/successor survey
  original.followUpSurveyId = newSurveyId;
  original.updatedAt = now;

  surveys.unshift(newVersionSurvey);
  saveSurveys(surveys);

  appendSurveyAudit({
    surveyId: newSurveyId,
    action: "CREATE_VERSION",
    actorId,
    actorRole,
    details: `নতুন সংস্করণ তৈরি (সংস্করণ: ${newVersionNumber}) পূর্ববর্তী জরিপ [${original.id}] থেকে [${newSurveyId}]`,
  });

  return newVersionSurvey;
}

/**
 * Helper to estimate target audience count for audience snapshot
 */
function estimateAudienceCount(audience: SurveyAudience): number {
  switch (audience.type) {
    case "ALL_GUARDIANS":
      return 150;
    case "TEACHERS":
      return 25;
    case "ALUMNI":
      return 120;
    case "EVENT_PARTICIPANTS":
      return 85;
    case "PUBLIC":
      return 0; // Public audience is open/unbounded
    default:
      return 50;
  }
}
