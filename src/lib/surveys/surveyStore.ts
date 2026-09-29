/**
 * EHRJ Madrasha ERP — Phase 37
 * Datastore for Institutional Survey, Feedback & Voice-of-Community Engine
 * Checkpoint: EHRJ-AI-2026-PHASE37
 * 
 * Provides atomic JSON storage with robust concurrency protection in data/surveys/
 */

import fs from "fs";
import path from "path";
import {
  Survey,
  SurveyResponse,
  SurveyAction,
  SurveyAuditEntry,
} from "./types";

const SURVEYS_DIR = path.join(process.cwd(), "data", "surveys");

const SURVEYS_FILE = path.join(SURVEYS_DIR, "surveys.json");
const RESPONSES_FILE = path.join(SURVEYS_DIR, "survey_responses.json");
const ACTIONS_FILE = path.join(SURVEYS_DIR, "survey_actions.json");
const AUDIT_FILE = path.join(SURVEYS_DIR, "survey_audit_log.json");

function ensureDirectory(): void {
  if (!fs.existsSync(SURVEYS_DIR)) {
    fs.mkdirSync(SURVEYS_DIR, { recursive: true });
  }
}

function safeRead<T>(filePath: string, fallback: T): T {
  try {
    ensureDirectory();
    if (!fs.existsSync(filePath)) {
      safeWrite(filePath, fallback);
      return fallback;
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[SurveyStore] Read error on ${filePath}:`, err);
    return fallback;
  }
}

function safeWrite<T>(filePath: string, data: T): void {
  try {
    ensureDirectory();
    const tempFile = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 6)}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempFile, filePath);
  } catch (err) {
    console.error(`[SurveyStore] Write error on ${filePath}:`, err);
  }
}

// -------------------------------------------------------------
// PRE-SEEDED SURVEYS
// -------------------------------------------------------------

export const DEFAULT_SURVEYS: Survey[] = [
  {
    id: "EHRJ-SUR-2026-000001",
    titleBn: "অভিভাবক বার্ষিক প্রাতিষ্ঠানিক সন্তুষ্টি জরিপ ২০২৬",
    titleEn: "Annual Guardian Institutional Satisfaction Survey 2026",
    titleAr: "استطلاع الرضا المؤسسي السنوي لأولياء الأمور ٢٠٢٦",
    descriptionBn: "শিক্ষার্থীদের দ্বীনি ও সাধারণ শিক্ষা, নিরাপত্তা, শিক্ষকবৃন্দের আন্তরিকতা এবং মাদরাসার সেবা সম্পর্কে মূল্যবান মতামত।",
    descriptionEn: "Comprehensive feedback from guardians on Islamic & general academics, student safety, and institutional hospitality.",
    surveyType: "GUARDIAN_SURVEY",
    ownerId: "USR-ADMIN-001",
    ownerName: "মুহতামিম কার্যালয় (Muhtamim Office)",
    audience: {
      type: "ALL_GUARDIANS",
      descriptionBn: "মাদরাসার সকল জামাত ও বিভাগের অভিভাবকবৃন্দ",
    },
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2026-12-31T23:59:59.000Z",
    status: "OPEN",
    responseMode: "PSEUDONYMOUS",
    responseLimit: "ONE_PER_STUDENT",
    version: 1,
    isVersionLocked: true,
    instructionsBn: "আপনার প্রতিটি মতামত সম্পূর্ণ আমানতদারিতার সাথে পর্যালোচনা করা হবে। কোনো ব্যক্তিগত পরিচয়ের ভিত্তিতে শিক্ষার্থীর উপর কোনো প্রভাব পড়বে না।",
    relatedModule: "STUDENT",
    isPublic: false,
    responseCount: 18,
    completionCount: 18,
    allowHelpdeskConversion: true,
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
    questions: [
      {
        id: "Q1",
        textBn: "মাদরাসার সার্বিক দ্বীনি পরিবেশ ও পাঠদানের মান সম্পর্কে আপনার অভিমত কেমন?",
        textEn: "How do you rate the overall Islamic environment and academic quality?",
        type: "RATING_SCALE",
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: {
          minLabelBn: "অসন্তোষজনক (১)",
          maxLabelBn: "অত্যন্ত সন্তোষজনক (৫)",
        },
        displayOrder: 1,
      },
      {
        id: "Q2",
        textBn: "শিক্ষকবৃন্দের পাঠদান পদ্ধতি এবং শিক্ষার্থীর প্রতি ব্যক্তিগত যত্ন বিষয়ে আপনার মূল্যায়ন:",
        textEn: "Assessment of teachers' pedagogical approach and personal student care:",
        type: "LIKERT_SCALE",
        required: true,
        options: [
          { id: "opt-1", textBn: "সম্পূর্ণ একমত (Strongly Agree)", textEn: "Strongly Agree", scoreValue: 5 },
          { id: "opt-2", textBn: "একমত (Agree)", textEn: "Agree", scoreValue: 4 },
          { id: "opt-3", textBn: "নিরপেক্ষ (Neutral)", textEn: "Neutral", scoreValue: 3 },
          { id: "opt-4", textBn: "দ্বিমত (Disagree)", textEn: "Disagree", scoreValue: 2 },
          { id: "opt-5", textBn: "দৃঢ় দ্বিমত (Strongly Disagree)", textEn: "Strongly Disagree", scoreValue: 1 },
        ],
        displayOrder: 2,
      },
      {
        id: "Q3",
        textBn: "মাদরাসার ডিজিটাল পোর্টাল ও এসএমএস ছাড়া ওয়েব নোটিশ ব্যবহারের সুবিধা কেমন পাচ্ছেন?",
        textEn: "How convenient is using the digital web portal and notice board?",
        type: "SINGLE_CHOICE",
        required: true,
        options: [
          { id: "opt-c1", textBn: "খুবই সহজ ও সময়োপযোগী", textEn: "Very easy and timely", scoreValue: 5 },
          { id: "opt-c2", textBn: "মোটামুটি সুবিধাজনক", textEn: "Moderately convenient", scoreValue: 4 },
          { id: "opt-c3", textBn: "ব্যবহার করতে কিছু সমস্যা হয়", textEn: "Face some difficulties", scoreValue: 2 },
        ],
        displayOrder: 3,
      },
      {
        id: "Q4",
        textBn: "শিক্ষার্থীর নিরাপত্তা বা আবাসিক খাবার নিয়ে কোনো জরুরি অভিযোগ বা পরামর্শ আছে কি?",
        textEn: "Do you have any urgent complaints or suggestions regarding student safety or boarding food?",
        type: "YES_NO",
        required: true,
        displayOrder: 4,
      },
      {
        id: "Q5",
        textBn: "অনুগ্রহ করে আপনার সুনির্দিষ্ট অভিযোগ বা সংস্কারমূলক পরামর্শ বিস্তারিত লিখুন:",
        textEn: "Please write specific complaints or reform recommendations in detail:",
        type: "LONG_TEXT",
        required: false,
        displayOrder: 5,
        conditionalRules: [
          {
            questionId: "Q4",
            operator: "EQUALS",
            value: true,
            action: "SHOW",
          },
        ],
      },
    ],
    audienceSnapshot: {
      audienceDefinition: {
        type: "ALL_GUARDIANS",
      },
      targetCount: 150,
      snapshotTimestamp: "2026-01-01T10:00:00.000Z",
      surveyVersion: 1,
    },
  },
  {
    id: "EHRJ-SUR-2026-000002",
    titleBn: "বার্ষিক ক্বিরাআত ও হুসনে সওত মাহফিল অভিজ্ঞতা মূল্যায়ন",
    titleEn: "Annual Qiraat & Husne Sawt Conference Post-Event Feedback",
    descriptionBn: "বার্ষিক আন্তর্জাতিক ক্বিরাআত মাহফিলের শৃঙ্খলা, তিলাওয়াতের মান ও অতিথি আপ্যায়ন সম্পর্কিত অভিজ্ঞতা।",
    descriptionEn: "Participant and guardian review of the Annual Grand Qiraat Competition and assembly hospitality.",
    surveyType: "EVENT_FEEDBACK",
    ownerId: "USR-ADMIN-002",
    ownerName: "নাজিম-এ-তা'লীমাত (Nazim-e-Taleemat)",
    audience: {
      type: "EVENT_PARTICIPANTS",
      targetEventId: "EHRJ-EVT-2026-000001",
      descriptionBn: "ক্বিরাআত সম্মেলনে নিবন্ধিত ও উপস্থিত অংশগ্রহণকারী",
    },
    startDate: "2026-02-15T00:00:00.000Z",
    endDate: "2026-05-31T23:59:59.000Z",
    status: "OPEN",
    responseMode: "IDENTIFIED",
    responseLimit: "ONE_PER_USER",
    version: 1,
    isVersionLocked: true,
    relatedModule: "EVENTS",
    relatedEntityId: "EHRJ-EVT-2026-000001",
    isPublic: false,
    responseCount: 12,
    completionCount: 12,
    createdAt: "2026-02-15T10:00:00.000Z",
    updatedAt: "2026-02-15T10:00:00.000Z",
    questions: [
      {
        id: "Q1",
        textBn: "মঞ্চের সাউন্ড সিস্টেম ও অডিও স্পষ্টতা কেমন ছিল?",
        textEn: "How was the stage sound system and acoustic clarity?",
        type: "RATING_SCALE",
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        displayOrder: 1,
      },
      {
        id: "Q2",
        textBn: "প্রতিযোগীদের ফলাফল ঘোষণা ও বিচারকদের মূল্যায়ন বিষয়ে আপনার সন্তুষ্টি:",
        textEn: "Satisfaction with judges' evaluation and competition result announcement:",
        type: "SINGLE_CHOICE",
        required: true,
        options: [
          { id: "o1", textBn: "সম্পূর্ণ স্বচ্ছ ও ন্যায়সঙ্গত", textEn: "Completely transparent and fair", scoreValue: 5 },
          { id: "o2", textBn: "ভালো", textEn: "Good", scoreValue: 4 },
          { id: "o3", textBn: "আরও উন্নয়নের সুযোগ আছে", textEn: "Needs improvement", scoreValue: 2 },
        ],
        displayOrder: 2,
      },
      {
        id: "Q3",
        textBn: "ভবিষ্যৎ মাহফিলের জন্য আপনার কোনো বিশেষ পরামর্শ:",
        textEn: "Any specific suggestions for upcoming events:",
        type: "LONG_TEXT",
        required: false,
        displayOrder: 3,
      },
    ],
  },
  {
    id: "EHRJ-SUR-2026-000003",
    titleBn: "অনলাইন ভর্তি আবেদন অভিজ্ঞতা ও সেবা যাচাই জরিপ",
    titleEn: "Online Admission Application Process Experience Survey",
    descriptionBn: "নতুন ভর্তিচ্ছু শিক্ষার্থীদের অভিভাবকদের ডিজিটাল ভর্তি ফরম পূরণ, প্রবেশপত্র প্রাপ্তি ও যোগাযোগ মূল্যায়ন।",
    descriptionEn: "Survey exploring parents' experience with the paperless admission workflow.",
    surveyType: "ADMISSION_FEEDBACK",
    ownerId: "USR-ADMIN-001",
    ownerName: "ভর্তি সচিবালয় (Admission Secretariat)",
    audience: {
      type: "ALL_GUARDIANS",
      descriptionBn: "ভর্তি আবেদন সম্পন্নকারী অভিভাবকবৃন্দ",
    },
    startDate: "2026-01-10T00:00:00.000Z",
    endDate: "2026-06-30T23:59:59.000Z",
    status: "OPEN",
    responseMode: "PSEUDONYMOUS",
    responseLimit: "ONE_PER_USER",
    version: 1,
    isVersionLocked: true,
    relatedModule: "ADMISSION",
    isPublic: false,
    responseCount: 9,
    completionCount: 9,
    createdAt: "2026-01-10T12:00:00.000Z",
    updatedAt: "2026-01-10T12:00:00.000Z",
    questions: [
      {
        id: "Q1",
        textBn: "অনলাইনে ভর্তি ফরম পূরণ করতে আপনার কত সময় লেগেছিল?",
        textEn: "How long did it take to fill the admission form online?",
        type: "SINGLE_CHOICE",
        required: true,
        options: [
          { id: "t1", textBn: "৫ থেকে ১০ মিনিট (দ্রুত)", textEn: "5-10 mins (Fast)", scoreValue: 5 },
          { id: "t2", textBn: "১০ থেকে ২০ মিনিট", textEn: "10-20 mins", scoreValue: 4 },
          { id: "t3", textBn: "২০ মিনিটের বেশি", textEn: "More than 20 mins", scoreValue: 2 },
        ],
        displayOrder: 1,
      },
      {
        id: "Q2",
        textBn: "ভর্তি ফি প্রদানের প্রক্রিয়াটি কি মসৃণ ছিল?",
        textEn: "Was the admission fee payment process smooth?",
        type: "YES_NO",
        required: true,
        displayOrder: 2,
      },
    ],
  },
  {
    id: "EHRJ-SUR-2026-000004",
    titleBn: "প্রাক্তন শিক্ষার্থী (অ্যালামনাই) সেবা ও পরামর্শ জরিপ",
    titleEn: "Alumni Relationship & Career Guidance Survey",
    descriptionBn: "প্রাক্তন শিক্ষার্থীদের মাদরাসার সাথে সম্পৃক্ততা, মেন্টরশিপ ও উন্নয়নমূলক অবদান মূল্যায়ন।",
    descriptionEn: "Alumni perspectives on community groups, volunteering and institutional development.",
    surveyType: "ALUMNI_SURVEY",
    ownerId: "USR-ADMIN-003",
    ownerName: "অ্যালামনাই পরিচালনা পর্ষদ (Alumni Committee)",
    audience: {
      type: "ALUMNI",
      descriptionBn: "নিবন্ধিত প্রাক্তন শিক্ষার্থী পরিষদ",
    },
    startDate: "2026-02-01T00:00:00.000Z",
    endDate: "2026-12-31T23:59:59.000Z",
    status: "OPEN",
    responseMode: "IDENTIFIED",
    responseLimit: "ONE_PER_USER",
    version: 1,
    isVersionLocked: true,
    relatedModule: "ALUMNI",
    isPublic: false,
    responseCount: 8,
    completionCount: 8,
    createdAt: "2026-02-01T12:00:00.000Z",
    updatedAt: "2026-02-01T12:00:00.000Z",
    questions: [
      {
        id: "Q1",
        textBn: "বর্তমান শিক্ষার্থীদের ক্যারিয়ার বা উচ্চশিক্ষায় আপনি কীভাবে সহায়তা করতে আগ্রহী?",
        textEn: "How are you interested in mentoring current students for higher studies or career?",
        type: "MULTIPLE_CHOICE",
        required: true,
        options: [
          { id: "m1", textBn: "উচ্চতর আরবি ও হাদিস গবেষণায় দিকনির্দেশনা", textEn: "Guidance in higher Arabic and Hadith research" },
          { id: "m2", textBn: "বিশ্ববিদ্যালয় ও কর্মক্ষেত্রে অভিজ্ঞতা বিনিময়", textEn: "University and career experience sharing" },
          { id: "m3", textBn: "আইটি ও আধুনিক ভাষাশিক্ষা সহায়তা", textEn: "IT and modern language mentoring" },
          { id: "m4", textBn: "এতিম ও দরিদ্র শিক্ষার্থীদের আর্থিক পৃষ্ঠপোষকতা", textEn: "Financial support for orphan students" },
        ],
        displayOrder: 1,
      },
      {
        id: "Q2",
        textBn: "মাদরাসার আধুনিকায়নে আপনার মূল্যবান পরামর্শ:",
        textEn: "Your suggestions for institutional modernization:",
        type: "LONG_TEXT",
        required: false,
        displayOrder: 2,
      },
    ],
  },
  {
    id: "EHRJ-SUR-2026-000005",
    titleBn: "সার্বজনীন ওয়েবসাইট ও তথ্যপ্রাপ্তি মূল্যায়ন ও পরামর্শ",
    titleEn: "Public Website Accessibility & Information Openness Feedback",
    descriptionBn: "সাধারণ দর্শনার্থী, দাতা ও শুভাকাঙ্ক্ষীদের জন্য মাদরাসার ডিজিটাল তথ্যের মান ও স্বচ্ছতা যাচাই।",
    descriptionEn: "Open public feedback form to assess transparency and ease of finding madrasah information.",
    surveyType: "SATISFACTION",
    ownerId: "USR-ADMIN-001",
    ownerName: "তথ্য ও জনসংযোগ সেল (Information & Media Cell)",
    audience: {
      type: "PUBLIC",
      descriptionBn: "সাধারণ জনতা ও শুভাকাঙ্ক্ষী",
    },
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2026-12-31T23:59:59.000Z",
    status: "OPEN",
    responseMode: "ANONYMOUS",
    responseLimit: "UNLIMITED",
    version: 1,
    isVersionLocked: true,
    relatedModule: "PUBLIC",
    isPublic: true,
    responseCount: 15,
    completionCount: 15,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    questions: [
      {
        id: "Q1",
        textBn: "মাদরাসার ওয়েবসাইটটি দেখে আপনার কেমন লেগেছে?",
        textEn: "How was your experience browsing the institutional portal?",
        type: "RATING_SCALE",
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        displayOrder: 1,
      },
      {
        id: "Q2",
        textBn: "লিল্লাহ বোর্ডিং ও এতিমখানা তহবিলে অনুদানের তথ্য সহজে খুঁজে পেয়েছেন কি?",
        textEn: "Did you easily find information regarding Lillah boarding & orphan donations?",
        type: "YES_NO",
        required: true,
        displayOrder: 2,
      },
      {
        id: "Q3",
        textBn: "ওয়েবসাইট আরও সুন্দর ও উপযোগী করার জন্য আপনার মূল্যবান পরামর্শ:",
        textEn: "Your suggestions to improve this website:",
        type: "LONG_TEXT",
        required: false,
        displayOrder: 3,
      },
    ],
  },
];

// Pre-seeded responses for the Guardian Survey
export const DEFAULT_RESPONSES: SurveyResponse[] = [
  {
    id: "EHRJ-SUR-RES-2026-000001",
    surveyId: "EHRJ-SUR-2026-000001",
    surveyVersion: 1,
    respondentId: "USR-GDN-001",
    respondentType: "GUARDIAN",
    respondentName: "আলহাজ্ব মোবারক হোসেন",
    linkedStudentId: "STU-2026-001",
    linkedStudentName: "মুহাম্মদ আব্দুল্লাহ আল মামুন",
    responseMode: "PSEUDONYMOUS",
    participationToken: "tok-sec-001",
    isComplete: true,
    answers: [
      { questionId: "Q1", answerValue: 5, numericValue: 5, score: 5 },
      { questionId: "Q2", answerValue: "opt-1", selectedOptionIds: ["opt-1"], score: 5 },
      { questionId: "Q3", answerValue: "opt-c1", selectedOptionIds: ["opt-c1"], score: 5 },
      { questionId: "Q4", answerValue: false, booleanValue: false },
    ],
    totalScore: 15,
    submittedAt: "2026-01-15T14:30:00.000Z",
    createdAt: "2026-01-15T14:30:00.000Z",
    updatedAt: "2026-01-15T14:30:00.000Z",
  },
  {
    id: "EHRJ-SUR-RES-2026-000002",
    surveyId: "EHRJ-SUR-2026-000001",
    surveyVersion: 1,
    respondentId: "USR-GDN-002",
    respondentType: "GUARDIAN",
    respondentName: "কারী মাওলানা আব্দুর রশিদ",
    linkedStudentId: "STU-2026-002",
    linkedStudentName: "মুহাম্মদ হাবিবুর রহমান",
    responseMode: "PSEUDONYMOUS",
    participationToken: "tok-sec-002",
    isComplete: true,
    answers: [
      { questionId: "Q1", answerValue: 4, numericValue: 4, score: 4 },
      { questionId: "Q2", answerValue: "opt-2", selectedOptionIds: ["opt-2"], score: 4 },
      { questionId: "Q3", answerValue: "opt-c1", selectedOptionIds: ["opt-c1"], score: 5 },
      { questionId: "Q4", answerValue: true, booleanValue: true },
      { questionId: "Q5", answerValue: "হোস্টেল ডাইনিং এ বিকালের নাস্তায় বৈচিত্র্য আনলে ভালো হয়।", textValue: "হোস্টেল ডাইনিং এ বিকালের নাস্তায় বৈচিত্র্য আনলে ভালো হয়।" },
    ],
    totalScore: 13,
    submittedAt: "2026-01-18T10:15:00.000Z",
    createdAt: "2026-01-18T10:15:00.000Z",
    updatedAt: "2026-01-18T10:15:00.000Z",
  },
  {
    id: "EHRJ-SUR-RES-2026-000003",
    surveyId: "EHRJ-SUR-2026-000005",
    surveyVersion: 1,
    responseMode: "ANONYMOUS",
    isComplete: true,
    answers: [
      { questionId: "Q1", answerValue: 5, numericValue: 5, score: 5 },
      { questionId: "Q2", answerValue: true, booleanValue: true },
      { questionId: "Q3", answerValue: "অনলাইন বিকাশ অনুদানের রশিদ পাওয়ার বিষয়টি চমৎকার লেগেছে। জাযাকাল্লাহু খাইরান।", textValue: "অনলাইন বিকাশ অনুদানের রশিদ পাওয়ার বিষয়টি চমৎকার লেগেছে। জাযাকাল্লাহু খাইরান।" },
    ],
    totalScore: 5,
    submittedAt: "2026-01-20T16:45:00.000Z",
    createdAt: "2026-01-20T16:45:00.000Z",
    updatedAt: "2026-01-20T16:45:00.000Z",
  },
];

export const DEFAULT_ACTIONS: SurveyAction[] = [
  {
    id: "EHRJ-SUR-ACT-2026-000001",
    surveyId: "EHRJ-SUR-2026-000001",
    relatedQuestionId: "Q4",
    findingBn: "কয়েকজন অভিভাবক আবাসিক হোস্টেল ডাইনিং এর বিকালের নাস্তায় পুষ্টিকর বৈচিত্র্যের প্রস্তাব দিয়েছেন।",
    findingEn: "Guardians suggested nutritious variety in residential hostel evening snacks.",
    priority: "NORMAL",
    ownerId: "USR-STAFF-HOSTEL",
    ownerName: "হোস্টেল সুপারিনটেনডেন্ট (Hostel Superintendent)",
    assignedRole: "HOSTEL_SUPER",
    dueDate: "2026-04-15",
    status: "IN_PROGRESS",
    evidenceDescription: "মেস কমিটির সভায় নতুন খাদ্যতালিকা পর্যালোচনা করা হয়েছে।",
    helpdeskTicketId: "EHRJ-REQ-2026-000015",
    createdAt: "2026-01-25T11:00:00.000Z",
    updatedAt: "2026-01-28T09:30:00.000Z",
  },
];

export const DEFAULT_AUDIT_LOG: SurveyAuditEntry[] = [
  {
    id: "AUD-SUR-001",
    surveyId: "EHRJ-SUR-2026-000001",
    action: "CREATE_SURVEY",
    actorId: "USR-ADMIN-001",
    actorRole: "ADMIN",
    details: "অভিভাবক বার্ষিক প্রাতিষ্ঠানিক সন্তুষ্টি জরিপ ২০২৬ তৈরি করা হয়েছে",
    timestamp: "2026-01-01T10:00:00.000Z",
  },
  {
    id: "AUD-SUR-002",
    surveyId: "EHRJ-SUR-2026-000001",
    action: "PUBLISH_SURVEY",
    actorId: "USR-ADMIN-001",
    actorRole: "ADMIN",
    details: "জরিপ সংস্করণ ১ প্রকাশিত ও উন্মুক্ত করা হয়েছে। অডিয়েন্স স্ন্যাপশট ধারণ করা হয়েছে।",
    timestamp: "2026-01-01T10:05:00.000Z",
  },
];

// -------------------------------------------------------------
// GETTERS AND SETTERS
// -------------------------------------------------------------

export function getSurveys(): Survey[] {
  return safeRead<Survey[]>(SURVEYS_FILE, DEFAULT_SURVEYS);
}

export function saveSurveys(surveys: Survey[]): void {
  safeWrite(SURVEYS_FILE, surveys);
}

export function getSurveyResponses(): SurveyResponse[] {
  return safeRead<SurveyResponse[]>(RESPONSES_FILE, DEFAULT_RESPONSES);
}

export function saveSurveyResponses(responses: SurveyResponse[]): void {
  safeWrite(RESPONSES_FILE, responses);
}

export function getSurveyActions(): SurveyAction[] {
  return safeRead<SurveyAction[]>(ACTIONS_FILE, DEFAULT_ACTIONS);
}

export function saveSurveyActions(actions: SurveyAction[]): void {
  safeWrite(ACTIONS_FILE, actions);
}

export function getSurveyAuditLog(): SurveyAuditEntry[] {
  return safeRead<SurveyAuditEntry[]>(AUDIT_FILE, DEFAULT_AUDIT_LOG);
}

export function saveSurveyAuditLog(entries: SurveyAuditEntry[]): void {
  safeWrite(AUDIT_FILE, entries);
}

export function appendSurveyAudit(entry: Omit<SurveyAuditEntry, "id" | "timestamp">): void {
  const log = getSurveyAuditLog();
  const newEntry: SurveyAuditEntry = {
    id: `AUD-SUR-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  log.unshift(newEntry);
  saveSurveyAuditLog(log);
}
