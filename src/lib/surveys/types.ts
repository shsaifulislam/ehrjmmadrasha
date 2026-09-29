/**
 * EHRJ Madrasha ERP — Phase 37
 * Institutional Survey, Feedback, Assessment & Voice-of-Community Engine
 * Checkpoint: EHRJ-AI-2026-PHASE37
 * 
 * CORE PRINCIPLE:
 * "FEEDBACK INFORMS DECISIONS; IT DOES NOT AUTOMATICALLY MAKE HIGH-STAKES DECISIONS."
 */

export type SurveyType =
  | "SATISFACTION"             // সন্তুষ্টি জরিপ (সাধারণ / প্রাতিষ্ঠানিক)
  | "FEEDBACK_FORM"            // সাধারণ মতামত ও পরামর্শ ফর্ম
  | "INSTITUTIONAL_ASSESSMENT" // সার্বিক প্রাতিষ্ঠানিক মূল্যায়ন
  | "EVENT_FEEDBACK"           // মাহফিল, সেমিনার বা প্রতিযোগিতা পরবর্তী প্রতিক্রিয়া (Phase 35)
  | "ADMISSION_FEEDBACK"       // ভর্তি প্রক্রিয়া অভিজ্ঞতা জরিপ (Phase 34)
  | "ACADEMIC_EXPERIENCE"      // শিক্ষা কার্যক্রম ও পাঠদান পর্যালোচনা
  | "GUARDIAN_SURVEY"          // অভিভাবক মূল্যায়ন ও মতামত
  | "TEACHER_SURVEY"           // শিক্ষকবৃন্দের মতামত ও কর্মপরিবেশ
  | "ALUMNI_SURVEY"            // প্রাক্তন শিক্ষার্থী মতামত ও সংযোগ (Phase 36)
  | "SERVICE_QUALITY"          // প্রশাসনিক ও অ্যাকাউন্টিং সেবা মান
  | "FACILITY_SURVEY"          // ভৌত অবকাঠামো, হোস্টেল ও ডাইনিং (Phase 10)
  | "LIBRARY_SURVEY"           // কিতাব ও লাইব্রেরি সেবা (Phase 9)
  | "TRANSPORT_SURVEY"         // পরিবহন ব্যবস্থা (Phase 11)
  | "SUGGESTION_FORM"          // উন্মুক্ত সংস্কার ও উন্নয়নমূলক পরামর্শ
  | "RESEARCH_ASSESSMENT"      // ইসলামিক শিক্ষা ও গবেষণা মূল্যায়ন
  | "OTHER";

export type SurveyStatus =
  | "DRAFT"        // খসড়া
  | "REVIEW"       // পর্যালোচনায়
  | "APPROVED"     // অনুমোদিত
  | "PUBLISHED"    // প্রকাশিত (সংস্করণ লকড)
  | "OPEN"         // উন্মুক্ত ও উত্তর গ্রহণ চলছে
  | "CLOSED"       // নির্ধারিত সময় সমাপ্ত
  | "ANALYZING"    // ডেটা বিশ্লেষণ ও প্রতিবেদন প্রস্তুত
  | "COMPLETED"    // বিশ্লেষণ সম্পন্ন ও প্রশাসনিক পর্যালোচনা শেষ
  | "ARCHIVED"     // সংরক্ষিত
  | "CANCELLED";   // বাতিল

export type QuestionType =
  | "SINGLE_CHOICE"    // একক পছন্দ (রেডিও)
  | "MULTIPLE_CHOICE"  // একাধিক পছন্দ (চেকবক্স)
  | "RATING_SCALE"     // ১ থেকে ৫ স্টার বা স্কেল
  | "LIKERT_SCALE"     // ১-৫ লিকার্ট স্কেল (দৃঢ় একমত হতে সম্পূর্ণ দ্বিমত)
  | "YES_NO"           // হ্যাঁ / না
  | "SHORT_TEXT"       // সংক্ষিপ্ত বিবরণ (এক লাইন)
  | "LONG_TEXT"        // বিস্তারিত মতামত ও অনুচ্ছেদ
  | "NUMBER"           // সংখ্যাবাচক তথ্য
  | "DATE"             // তারিখ
  | "DROPDOWN"         // ড্রপডাউন নির্বাচন
  | "MATRIX_GRID";     // ম্যাট্রিক্স বা গ্রিড প্রশ্ন

export type ResponseMode =
  | "IDENTIFIED"    // পরিচিত (অভিভাবক/শিক্ষক আইডি ও নাম সংরক্ষিত)
  | "PSEUDONYMOUS"  // ছদ্মনামযুক্ত (টোকেনভিত্তিক, সাধারণ রিভিউয়ারদের কাছে পরিচয় গোপন)
  | "ANONYMOUS";    // সম্পূর্ণ বেনামী (কারিগরিভাবে উত্তর থেকে পরিচয় বিচ্ছিন্ন)

export type AudienceType =
  | "ALL_GUARDIANS"      // সকল সক্রিয় অভিভাবক
  | "GUARDIANS_SESSION"  // নির্দিষ্ট শিক্ষাবর্ষের অভিভাবক
  | "GUARDIANS_JAMAT"    // নির্দিষ্ট জামাত/বিভাগের অভিভাবক
  | "GUARDIANS_SELECTED" // নির্বাচিত শিক্ষার্থীদের অভিভাবক
  | "TEACHERS"           // সকল সম্মানিত শিক্ষক ও স্টাফ
  | "PRINCIPAL"          // মুহতামিম ও প্রশাসন
  | "ALUMNI"             // প্রাক্তন শিক্ষার্থী পরিষদ
  | "EVENT_PARTICIPANTS" // ইভেন্টে অংশগ্রহণকারী
  | "SPECIFIC_USERS"     // নির্ধারিত ব্যবহারকারী তালিকা
  | "PUBLIC";            // সাধারণ জনতা / শুভাকাঙ্ক্ষী

export type SurveyActionStatus =
  | "IDENTIFIED"   // চিহ্নিত
  | "ASSIGNED"     // দায়িত্ব অর্পিত
  | "IN_PROGRESS"  // বাস্তবায়ন চলছে
  | "COMPLETED"    // সম্পন্ন
  | "VERIFIED"     // যাচাইকৃত
  | "CLOSED";      // নিষ্পত্তি

export type PriorityLevel = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface SurveyQuestionOption {
  id: string;
  textBn: string;
  textEn: string;
  textAr?: string;
  scoreValue?: number;
}

export interface ConditionalRule {
  questionId: string;
  operator: "EQUALS" | "NOT_EQUALS" | "CONTAINS" | "LESS_THAN_OR_EQUAL" | "GREATER_THAN_OR_EQUAL";
  value: any;
  action: "SHOW" | "HIDE";
}

export interface SurveyQuestion {
  id: string;
  textBn: string;
  textEn: string;
  textAr?: string;
  type: QuestionType;
  required: boolean;
  options?: SurveyQuestionOption[];
  matrixRows?: string[];
  matrixColumns?: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: {
    minLabelBn: string;
    maxLabelBn: string;
  };
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  displayOrder: number;
  helpTextBn?: string;
  conditionalRules?: ConditionalRule[];
  scoringConfig?: {
    maxScore?: number;
    weight?: number;
  };
  privacyClassification?: "PUBLIC" | "CONFIDENTIAL" | "SENSITIVE";
}

export interface SurveyAudience {
  type: AudienceType;
  targetSession?: string;
  targetJamat?: string;
  targetStudentIds?: string[];
  targetUserIds?: string[];
  targetEventId?: string;
  targetBatchYear?: number;
  descriptionBn?: string;
}

export interface AudienceSnapshot {
  audienceDefinition: SurveyAudience;
  targetCount: number;
  snapshotTimestamp: string;
  surveyVersion: number;
}

export interface Survey {
  id: string; // EHRJ-SUR-YYYY-XXXXXX
  titleBn: string;
  titleEn: string;
  titleAr?: string;
  descriptionBn: string;
  descriptionEn?: string;
  surveyType: SurveyType;
  ownerId: string;
  ownerName: string;
  audience: SurveyAudience;
  startDate: string;
  endDate: string;
  status: SurveyStatus;
  responseMode: ResponseMode;
  responseLimit: "ONE_PER_USER" | "ONE_PER_STUDENT" | "UNLIMITED";
  version: number;
  isVersionLocked: boolean;
  instructionsBn?: string;
  relatedModule?:
    | "STUDENT"
    | "ACADEMIC"
    | "ADMISSION"
    | "EVENTS"
    | "ALUMNI"
    | "LIBRARY"
    | "HOSTEL"
    | "TRANSPORT"
    | "FINANCE"
    | "PUBLIC";
  relatedEntityId?: string;
  isPublic: boolean;
  questions: SurveyQuestion[];
  audienceSnapshot?: AudienceSnapshot;
  followUpSurveyId?: string;
  previousSurveyId?: string;
  responseCount: number;
  completionCount: number;
  allowHelpdeskConversion?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyAnswer {
  questionId: string;
  answerValue: any;
  textValue?: string;
  selectedOptionIds?: string[];
  numericValue?: number;
  dateValue?: string;
  booleanValue?: boolean;
  matrixValues?: Record<string, string>;
  score?: number;
}

export interface SurveyResponse {
  id: string; // EHRJ-SUR-RES-YYYY-XXXXXX
  surveyId: string;
  surveyVersion: number;
  respondentId?: string;
  respondentType?: "GUARDIAN" | "TEACHER" | "ALUMNI" | "STUDENT" | "PUBLIC" | "ANONYMOUS";
  respondentName?: string;
  linkedStudentId?: string;
  linkedStudentName?: string;
  responseMode: ResponseMode;
  participationToken?: string;
  isComplete: boolean;
  isDraft?: boolean;
  answers: SurveyAnswer[];
  totalScore?: number;
  submittedAt?: string;
  ipHash?: string;
  userAgentHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SanitizedSurveyResponse {
  id: string;
  surveyId: string;
  surveyVersion: number;
  responseMode: ResponseMode;
  isComplete: boolean;
  answers: SurveyAnswer[];
  totalScore?: number;
  submittedAt?: string;
  respondentType?: string;
  respondentName?: string; // only present if IDENTIFIED and authorized
  linkedStudentName?: string; // only present if IDENTIFIED and authorized
}

export interface SurveyAction {
  id: string; // EHRJ-SUR-ACT-YYYY-XXXXXX
  surveyId: string;
  relatedQuestionId?: string;
  findingBn: string;
  findingEn?: string;
  priority: PriorityLevel;
  ownerId: string;
  ownerName: string;
  assignedRole: string;
  dueDate: string;
  status: SurveyActionStatus;
  evidenceDescription?: string;
  completionNotes?: string;
  helpdeskTicketId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionDistributionItem {
  optionId?: string;
  labelBn: string;
  count: number;
  percentage: number;
}

export interface QuestionAnalytics {
  questionId: string;
  questionTextBn: string;
  type: QuestionType;
  responseCount: number;
  averageRating?: number;
  distribution?: QuestionDistributionItem[];
  matrixSummary?: Record<string, Record<string, number>>;
  positivePercentage?: number;
  neutralPercentage?: number;
  negativePercentage?: number;
}

export interface QualitativeThemeSummary {
  themeBn: string;
  category: "SUGGESTION" | "COMMENDATION" | "CONCERN" | "GENERAL";
  frequency: number;
  sampleQuotes: string[];
  humanReviewRequired: boolean;
  generatedByAi: boolean;
}

export interface SurveyAnalytics {
  surveyId: string;
  surveyTitleBn: string;
  totalResponses: number;
  completionRate: number;
  averageSatisfactionIndex: number; // 0 to 100 scale
  questions: QuestionAnalytics[];
  qualitativeThemes: QualitativeThemeSummary[];
  actionCount: number;
  completedActionCount: number;
  isSmallGroupSuppressed: boolean; // if responses < threshold (e.g. 5)
  lastCalculatedAt: string;
}

export interface SurveyAuditEntry {
  id: string;
  surveyId: string;
  action:
    | "CREATE_SURVEY"
    | "UPDATE_SURVEY"
    | "SUBMIT_REVIEW"
    | "APPROVE_SURVEY"
    | "PUBLISH_SURVEY"
    | "OPEN_SURVEY"
    | "CLOSE_SURVEY"
    | "CREATE_VERSION"
    | "SUBMIT_RESPONSE"
    | "UPDATE_RESPONSE"
    | "EXPORT_RESPONSES"
    | "GENERATE_ANALYTICS"
    | "CREATE_ACTION"
    | "UPDATE_ACTION"
    | "CONVERT_TO_HELPDESK"
    | "ARCHIVE_SURVEY";
  actorId: string;
  actorRole: string;
  details: string;
  timestamp: string;
}
