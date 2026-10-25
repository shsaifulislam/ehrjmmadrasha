/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 42
 * Institutional Risk Management, Internal Control & Governance Assurance Atomic Store
 * Checkpoint: EHRJ-AI-2026-PHASE42
 */

import fs from "fs";
import path from "path";
import {
  InstitutionalRisk,
  InstitutionalControl,
  ControlTestRecord,
  ControlException,
  GovernanceFinding,
  CorrectiveAction,
  GovernanceReviewSession,
  GovernanceAuditEntry,
  GovernanceDashboardStats,
  ActorContext,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "risk_assurance");
const RISKS_FILE = path.join(DATA_DIR, "risks.json");
const CONTROLS_FILE = path.join(DATA_DIR, "controls.json");
const CONTROL_TESTS_FILE = path.join(DATA_DIR, "control_tests.json");
const EXCEPTIONS_FILE = path.join(DATA_DIR, "exceptions.json");
const FINDINGS_FILE = path.join(DATA_DIR, "findings.json");
const ACTIONS_FILE = path.join(DATA_DIR, "actions.json");
const REVIEWS_FILE = path.join(DATA_DIR, "reviews.json");
const AUDIT_FILE = path.join(DATA_DIR, "audit_log.json");

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    ensureDirectory();
    if (!fs.existsSync(filePath)) {
      writeJsonFile(filePath, fallback);
      return fallback;
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[RiskAssuranceStore] Read error on ${filePath}:`, err);
    return fallback;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    ensureDirectory();
    const tempFile = `${filePath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempFile, filePath);
  } catch (err) {
    console.error(`[RiskAssuranceStore] Write error on ${filePath}:`, err);
  }
}

// -------------------------------------------------------------
// PRE-SEEDED INSTITUTIONAL DATA
// -------------------------------------------------------------

const SEED_CONTROLS: InstitutionalControl[] = [
  {
    id: "EHRJ-CTRL-2026-0001",
    controlCode: "CTRL-2026-0001",
    nameBn: "শরীয়াহ্ ফান্ড পৃথকীকরণ ও যাকাত বণ্টন নিয়ন্ত্রণ নীতি",
    nameEn: "Shariah Fund Segregation & Zakat Disbursement Rule Enforcement",
    descriptionBn: "যাকাত ও লিল্লাহ ফান্ড সাধারণ ফান্ড থেকে সম্পূর্ণ পৃথক রাখা এবং শুধুমাত্র উপযুক্ত শিক্ষার্থীদের কল্যাণে ব্যয় নিশ্চিত করা।",
    controlObjectiveBn: "যাকাত ও সাধারণ ফান্ডের সংমিশ্রণ রোধ ও শরীয়াহ্ বিধিমালা অক্ষুণ্ণ রাখা।",
    category: "SHARIAH_COMPLIANCE",
    controlType: "PREVENTIVE",
    executionType: "AUTOMATED",
    frequency: "REAL_TIME",
    ownerName: "মুফতি মাওলানা সাইফুল্লাহ",
    ownerRole: "HEAD_OF_SHARIAH",
    relatedRiskIds: ["EHRJ-RISK-2026-0001"],
    sourceModule: "FINANCE",
    evidenceRequirementBn: "ব্যাংক হিসাব বিবরণী, ক্যাশ লেজার ও ভাউচার শরীয়াহ অনুমোদন স্বাক্ষর",
    testingMethodBn: "লেনদেন নমুনা যাচাই ও ফান্ডভিত্তিক ডেবিট-ক্রেডিট রিকনসিলিয়েশন",
    status: "ACTIVE",
    lastTestedDate: "2026-09-15",
    lastTestResult: "EFFECTIVE",
    nextTestDueDate: "2026-10-15",
    exceptionCount: 0,
    createdBy: "admin-system",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedBy: "admin-system",
    updatedAt: "2026-09-15T00:00:00.000Z",
  },
  {
    id: "EHRJ-CTRL-2026-0002",
    controlCode: "CTRL-2026-0002",
    nameBn: "পরীক্ষার নম্বর অনুমোদন ও অপরিবর্তনীয় ফল প্রকাশ প্রটোকল",
    nameEn: "Immutable Result Publication & Scoped Marks Revision Protocol",
    descriptionBn: "পরীক্ষা কমিটির অনুমোদন ব্যতীত ফলাফল পরিবর্তন নিষিদ্ধ এবং অনুমোদনের পর ফল চূড়ান্তভাবে লক করা।",
    controlObjectiveBn: "অননুমোদিত নম্বর পরিবর্তন রোধ ও একাডেমিক সততা বজায় রাখা।",
    category: "ACADEMIC",
    controlType: "PREVENTIVE",
    executionType: "HYBRID",
    frequency: "SESSION_WISE",
    ownerName: "মাওলানা মোহাম্মদ আব্দুল্লাহ",
    ownerRole: "CONTROLLER_OF_EXAMINATIONS",
    relatedRiskIds: ["EHRJ-RISK-2026-0002"],
    sourceModule: "ACADEMIC",
    evidenceRequirementBn: "মূল্যায়ন শিট, পরীক্ষা কমিটির রেজোলিউশন ও অডিট লগ",
    testingMethodBn: "লক পরবর্তী ডেটাবেস পরিমার্জন চেষ্টা টেস্ট ও কমিটির স্বাক্ষর মিলিয়ে দেখা",
    status: "ACTIVE",
    lastTestedDate: "2026-09-10",
    lastTestResult: "EFFECTIVE",
    nextTestDueDate: "2026-12-15",
    exceptionCount: 0,
    createdBy: "admin-system",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedBy: "admin-system",
    updatedAt: "2026-09-10T00:00:00.000Z",
  },
  {
    id: "EHRJ-CTRL-2026-0003",
    controlCode: "CTRL-2026-0003",
    nameBn: "বহু-ভেন্ডর কোটেশন তুলনা ও অধ্যক্ষীয় কার্যাদেশ অনুমোদন",
    nameEn: "Multi-Vendor Quotation Comparison & Principal Award Protocol",
    descriptionBn: "৫০,০০০ টাকার ঊর্ধ্বের ক্রয়ে বাধ্যতামূলকভাবে অন্তত ৩টি দরপত্র সংগ্রহ ও কমিটিভিত্তিক মূল্যায়ন।",
    controlObjectiveBn: "স্বচ্ছ প্রকিউরমেন্ট নিশ্চিত করা ও পক্ষপাতমূলক একক সরবরাহকারী নির্ভরতা হ্রাস করা।",
    category: "VENDOR_PROCUREMENT",
    controlType: "PREVENTIVE",
    executionType: "HYBRID",
    frequency: "EVENT_BASED",
    ownerName: "মাওলানা আব্দুর রহমান",
    ownerRole: "PROCUREMENT_OFFICER",
    relatedRiskIds: ["EHRJ-RISK-2026-0003"],
    sourceModule: "PROCUREMENT",
    evidenceRequirementBn: "RFQ কোড, সরবরাহকারীর সীলমোহরযুক্ত কোটেশন ও মূল্যায়ন শিট",
    testingMethodBn: "কার্যাদেশকৃত ফাইলের সাথে ন্যূনতম দরপত্র সংখ্যার মিল যাচাই",
    status: "ACTIVE",
    lastTestedDate: "2026-09-20",
    lastTestResult: "EFFECTIVE",
    nextTestDueDate: "2026-10-20",
    exceptionCount: 0,
    createdBy: "admin-system",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedBy: "admin-system",
    updatedAt: "2026-09-20T00:00:00.000Z",
  },
  {
    id: "EHRJ-CTRL-2026-0004",
    controlCode: "CTRL-2026-0004",
    nameBn: "ভূমিকা-ভিত্তিক প্রবেশাধিকার (RBAC) ও সেশন সুরক্ষা",
    nameEn: "Role-Based Access Control & Session Token Hardening",
    descriptionBn: "কঠোর ভূমিকাভিত্তিক অনুমতি (শিক্ষক/অভিভাবক কেবল নিজের ডেটা দেখবেন; প্রশাসনিক অডিট সংরক্ষিত)।",
    controlObjectiveBn: "অননুমোদিত ডেটা দর্শন (IDOR) ও গোপন প্রাতিষ্ঠানিক তথ্যের অপব্যবহার রোধ।",
    category: "SECURITY",
    controlType: "PREVENTIVE",
    executionType: "AUTOMATED",
    frequency: "REAL_TIME",
    ownerName: "আইটি সিস্টেম প্রশাসক",
    ownerRole: "IT_ADMIN",
    relatedRiskIds: ["EHRJ-RISK-2026-0004"],
    sourceModule: "SECURITY",
    evidenceRequirementBn: "জেডব্লিউটি নিরাপত্তা লগ, ভূমিকা ম্যাপিং ও পেন-টেস্ট রিপোর্ট",
    testingMethodBn: "স্বয়ংক্রিয় আরব্যাক সিকিউরিটি টেস্ট স্যুট ও ক্রস-ইউজার টোকেন অ্যাক্সেস ভেরিফিকেশন",
    status: "ACTIVE",
    lastTestedDate: "2026-09-28",
    lastTestResult: "EFFECTIVE",
    nextTestDueDate: "2026-10-28",
    exceptionCount: 0,
    createdBy: "admin-system",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedBy: "admin-system",
    updatedAt: "2026-09-28T00:00:00.000Z",
  },
  {
    id: "EHRJ-CTRL-2026-0005",
    controlCode: "CTRL-2026-0005",
    nameBn: "দ্বৈত জেনারেটর ব্যাকআপ ও সাপ্তাহিক রুটিন ড্রিল",
    nameEn: "Dual Generator Power Backup & Routine Weekly Testing",
    descriptionBn: "পরীক্ষা ও ক্লাস চলাকালীন বিদ্যুৎ বিপর্যয় রোধে স্বয়ংক্রিয় ব্যাকআপ জেনারেটর চালু রাখা ও প্রতি সপ্তাহে তেল/ব্যাটারি পরিদর্শন।",
    controlObjectiveBn: "প্রাতিষ্ঠানিক জরুরি কার্যক্রমের বিদ্যুৎ নিরবচ্ছিন্ন রাখা।",
    category: "OPERATIONAL",
    controlType: "CORRECTIVE",
    executionType: "MANUAL",
    frequency: "WEEKLY",
    ownerName: "মাদরাসা কেয়ারটেকার",
    ownerRole: "OPERATIONS_SUPERVISOR",
    relatedRiskIds: ["EHRJ-RISK-2026-0005"],
    sourceModule: "OPERATIONS",
    evidenceRequirementBn: "জেনারেটর লগবুক ও ফুয়েল ইনভয়েস",
    testingMethodBn: "সাপ্তাহিক লোড টেস্ট ও স্বয়ংক্রিয় চেঞ্জওভার সুইচ যাচাইকরণ",
    status: "ACTIVE",
    lastTestedDate: "2026-09-25",
    lastTestResult: "EFFECTIVE",
    nextTestDueDate: "2026-10-02",
    exceptionCount: 0,
    createdBy: "admin-system",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedBy: "admin-system",
    updatedAt: "2026-09-25T00:00:00.000Z",
  },
];

const SEED_RISKS: InstitutionalRisk[] = [
  {
    id: "EHRJ-RISK-2026-0001",
    riskCode: "RISK-2026-0001",
    titleBn: "যাকাত ফান্ডের অর্থ অননুমোদিত সাধারণ খাতে ব্যয় বা সংমিশ্রণের ঝুঁকি",
    titleEn: "Risk of Commingling or Unauthorized Allocation of Zakat Funds",
    descriptionBn: "যাকাত ফান্ডের অর্থ লিল্লাহ বা সাধারণ উন্নয়ন খাতে চলে যাওয়ার বা অযোগ্য সুবিধাভোগীর কাছে যাওয়ার ঝুঁকি।",
    riskCategory: "SHARIAH_COMPLIANCE",
    sourceModule: "FINANCE",
    ownerName: "মুফতি মাওলানা সাইফুল্লাহ",
    ownerRole: "HEAD_OF_SHARIAH",
    reviewerName: "মুহতামিম সাহেব (অধ্যক্ষ)",
    reviewerRole: "PRINCIPAL",
    inherentLikelihood: 3,
    inherentImpact: 5,
    inherentScore: 15,
    inherentLevel: "CRITICAL",
    existingControlIds: ["EHRJ-CTRL-2026-0001"],
    residualLikelihood: 1,
    residualImpact: 4,
    residualScore: 4,
    residualLevel: "MEDIUM",
    treatmentType: "MITIGATE",
    treatmentPlanBn: "স্বতন্ত্র যাকাত ব্যাংক অ্যাকাউন্ট রাখা, সফটওয়্যারে স্বয়ংক্রিয় ফান্ড ব্লকিং লজিক ও মুফতির বাধ্যতামূলক এনডোর্সমেন্ট।",
    treatmentOwner: "হিসাব রক্ষক",
    treatmentTargetDate: "2026-12-31",
    status: "MONITORING",
    nextReviewDate: "2026-11-15",
    evidenceDocRefs: ["DOC-FIN-SHARIAH-2026-01"],
    createdBy: "admin-system",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedBy: "admin-system",
    updatedAt: "2026-09-15T00:00:00.000Z",
  },
  {
    id: "EHRJ-RISK-2026-0002",
    riskCode: "RISK-2026-0002",
    titleBn: "প্রকাশিত পরীক্ষার ফলাফল অননুমোদিতভাবে পরিবর্তনের ঝুঁকি",
    titleEn: "Unauthorized Manipulation or Inadvertent Corruption of Published Results",
    descriptionBn: "নম্বর এন্ট্রি বা ফল প্রকাশের পর কোনো ব্যবহারকারী কর্তৃক নম্বর পরিবর্তনের সম্ভাবনা।",
    riskCategory: "ACADEMIC",
    sourceModule: "ACADEMIC",
    ownerName: "মাওলানা মোহাম্মদ আব্দুল্লাহ",
    ownerRole: "CONTROLLER_OF_EXAMINATIONS",
    reviewerName: "মুহতামিম সাহেব (অধ্যক্ষ)",
    reviewerRole: "PRINCIPAL",
    inherentLikelihood: 3,
    inherentImpact: 4,
    inherentScore: 12,
    inherentLevel: "HIGH",
    existingControlIds: ["EHRJ-CTRL-2026-0002"],
    residualLikelihood: 1,
    residualImpact: 3,
    residualScore: 3,
    residualLevel: "LOW",
    treatmentType: "MITIGATE",
    treatmentPlanBn: "ফল প্রকাশের সাথে সাথে ডেটাবেস রেকর্ড স্ট্যাটাস PUBLISHED এবং অপরিবর্তনীয় (Immutable) করা।",
    treatmentOwner: "পরীক্ষা নিয়ন্ত্রক",
    treatmentTargetDate: "2026-10-31",
    status: "MITIGATED",
    nextReviewDate: "2026-12-20",
    evidenceDocRefs: ["DOC-ACAD-EXAM-LOG-2026"],
    createdBy: "admin-system",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedBy: "admin-system",
    updatedAt: "2026-09-10T00:00:00.000Z",
  },
  {
    id: "EHRJ-RISK-2026-0003",
    riskCode: "RISK-2026-0003",
    titleBn: "কিতাব ও পাঠ্যপুস্তক সরবরাহে একক সরবরাহকারীর ওপর অতিরিক্ত নির্ভরতা",
    titleEn: "Single-Source Dependency on Textbook & Stationery Vendor",
    descriptionBn: "কওমি নেসাবের কিতাব ও পরীক্ষার খাতা কেবল একটি প্রকাশনা থেকে সরবরাহের ফলে মূল্যবৃদ্ধি বা সরবরাহে বিলম্বের ঝুঁকি।",
    riskCategory: "VENDOR_PROCUREMENT",
    sourceModule: "PROCUREMENT",
    ownerName: "মাওলানা আব্দুর রহমান",
    ownerRole: "PROCUREMENT_OFFICER",
    reviewerName: "মুহতামিম সাহেব (অধ্যক্ষ)",
    reviewerRole: "PRINCIPAL",
    inherentLikelihood: 4,
    inherentImpact: 4,
    inherentScore: 16,
    inherentLevel: "CRITICAL",
    existingControlIds: ["EHRJ-CTRL-2026-0003"],
    residualLikelihood: 2,
    residualImpact: 3,
    residualScore: 6,
    residualLevel: "MEDIUM",
    treatmentType: "MITIGATE",
    treatmentPlanBn: "ন্যূনতম ৩টি নিবন্ধিত কিতাব প্রকাশনী তালিকাভুক্ত করা ও ৩ মাস পূর্বে চাহিদা চূড়ান্ত করা।",
    treatmentOwner: "প্রকিউরমেন্ট অফিসার",
    treatmentTargetDate: "2026-11-30",
    status: "TREATMENT_PLANNED",
    nextReviewDate: "2026-10-25",
    evidenceDocRefs: ["DOC-VEN-EVAL-2026"],
    createdBy: "admin-system",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedBy: "admin-system",
    updatedAt: "2026-09-20T00:00:00.000Z",
  },
  {
    id: "EHRJ-RISK-2026-0004",
    riskCode: "RISK-2026-0004",
    titleBn: "অনিরাপদ ডিভাইস বা দুর্বল পাসওয়ার্ডের কারণে অ্যাডমিন অ্যাকাউন্ট হাইজ্যাকের ঝুঁকি",
    titleEn: "Risk of Unauthorized Administrative Credential Compromise",
    descriptionBn: "ব্যবহারকারী সেশন চুরি বা অনিরাপদ ব্রাউজারে লগইন থাকায় প্রশাসনিক তথ্য ফাঁসের ঝুঁকি।",
    riskCategory: "SECURITY",
    sourceModule: "SECURITY",
    ownerName: "আইটি সিস্টেম প্রশাসক",
    ownerRole: "IT_ADMIN",
    reviewerName: "মুহতামিম সাহেব (অধ্যক্ষ)",
    reviewerRole: "PRINCIPAL",
    inherentLikelihood: 3,
    inherentImpact: 4,
    inherentScore: 12,
    inherentLevel: "HIGH",
    existingControlIds: ["EHRJ-CTRL-2026-0004"],
    residualLikelihood: 1,
    residualImpact: 2,
    residualScore: 2,
    residualLevel: "LOW",
    treatmentType: "MITIGATE",
    treatmentPlanBn: "টু-ফ্যাক্টর অথেনটিকেশন বাধ্যতামূলক করা ও সংবেদনশীল রুটে আইডেন্টিটি রিলগইন সুরক্ষা।",
    treatmentOwner: "আইটি প্রশাসক",
    treatmentTargetDate: "2026-10-15",
    status: "MITIGATING",
    nextReviewDate: "2026-11-01",
    evidenceDocRefs: ["DOC-SEC-AUDIT-2026-02"],
    createdBy: "admin-system",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedBy: "admin-system",
    updatedAt: "2026-09-28T00:00:00.000Z",
  },
  {
    id: "EHRJ-RISK-2026-0005",
    riskCode: "RISK-2026-0005",
    titleBn: "পরীক্ষা ও ক্লাস চলাকালে লোডশেডিংয়ে বিদ্যুৎ সরবরাহে অচলাবস্থা",
    titleEn: "Campus Power Outage & Emergency Generator Failure Risk",
    descriptionBn: "গ্রিড বিদ্যুৎ চলে যাওয়ার পর ব্যাকআপ জেনারেটরে কারিগরি ত্রুটির কারণে পরীক্ষা কার্যক্রমে ব্যাঘাত।",
    riskCategory: "OPERATIONAL",
    sourceModule: "OPERATIONS",
    ownerName: "মাদরাসা কেয়ারটেকার",
    ownerRole: "OPERATIONS_SUPERVISOR",
    reviewerName: "মুহতামিম সাহেব (অধ্যক্ষ)",
    reviewerRole: "PRINCIPAL",
    inherentLikelihood: 3,
    inherentImpact: 3,
    inherentScore: 9,
    inherentLevel: "MEDIUM",
    existingControlIds: ["EHRJ-CTRL-2026-0005"],
    residualLikelihood: 1,
    residualImpact: 2,
    residualScore: 2,
    residualLevel: "LOW",
    treatmentType: "MITIGATE",
    treatmentPlanBn: "সাপ্তাহিক রুটিন চেক ও সার্বক্ষণিক ডিজেল রিজার্ভ সংরক্ষণ।",
    treatmentOwner: "কেয়ারটেকার",
    treatmentTargetDate: "2026-10-30",
    status: "MONITORING",
    nextReviewDate: "2026-10-15",
    evidenceDocRefs: ["DOC-OPS-GEN-LOG-2026"],
    createdBy: "admin-system",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedBy: "admin-system",
    updatedAt: "2026-09-25T00:00:00.000Z",
  },
];

const SEED_FINDINGS: GovernanceFinding[] = [
  {
    id: "EHRJ-FND-2026-0001",
    titleBn: "লিল্লাহ বোর্ডিং খাদ্য সরবরাহের চালান ও রসিদে ভেন্ডর সীলমোহর অনুপস্থিত",
    titleEn: "Missing Vendor Official Seal on Lillah Boarding Delivery Invoices",
    descriptionBn: "সেপ্টেম্বর ২০২৬-এর ৩টি চালানে সরবরাহকারীর প্রতিনিধি স্বাক্ষর করলেও প্রতিষ্ঠানের সীলমোহর ছিল না।",
    sourceType: "CONTROL_TEST",
    sourceReferenceId: "EHRJ-CTRL-2026-0003",
    relatedRiskId: "EHRJ-RISK-2026-0003",
    relatedControlId: "EHRJ-CTRL-2026-0003",
    severity: "MEDIUM",
    ownerName: "মাওলানা আব্দুর রহমান",
    status: "IN_PROGRESS",
    rootCauseCategory: "PROCESS",
    rootCauseAnalysisBn: "মাঠ পর্যায়ে পণ্য হস্তান্তরের সময় সরবরাহকারী চালানের মূল কপি আনেনি, ডেলিভারি স্লিপে স্বাক্ষর নেওয়া হয়েছিল।",
    recommendationBn: "ভেন্ডরকে অফিশিয়াল সীলমোহরযুক্ত চালান জমা দেওয়ার নোটিশ প্রদান ও স্টোরকিপারকে প্রশিক্ষণ দেওয়া।",
    evidenceDocRefs: ["GRN-2026-09-012"],
    dueDate: "2026-10-10",
    createdAt: "2026-09-21T00:00:00.000Z",
    updatedAt: "2026-09-22T00:00:00.000Z",
  },
];

const SEED_ACTIONS: CorrectiveAction[] = [
  {
    id: "EHRJ-ACT-2026-0001",
    findingId: "EHRJ-FND-2026-0001",
    actionType: "CORRECTIVE",
    actionDescriptionBn: "সংশ্লিষ্ট সরবরাহকারীর কাছ থেকে সীলমোহরযুক্ত প্রতিস্থাপক চালান সংগ্রহ করে ফাইলে সংরক্ষণ করা।",
    assignedTo: "মাওলানা আব্দুর রহমান (প্রকিউরমেন্ট অফিসার)",
    dueDate: "2026-10-05",
    priority: "MEDIUM",
    status: "IN_PROGRESS",
    createdAt: "2026-09-22T00:00:00.000Z",
    updatedAt: "2026-09-22T00:00:00.000Z",
  },
  {
    id: "EHRJ-ACT-2026-0002",
    findingId: "EHRJ-FND-2026-0001",
    actionType: "PREVENTIVE",
    actionDescriptionBn: "পণ্য গ্রহণের চেকলিস্টে 'ভেন্ডর অফিশিয়াল সীলমোহর' যাচাই বাধ্যতামূলক ফিল্ড হিসেবে অন্তর্ভুক্ত করা।",
    assignedTo: "স্টোর কিপার ও ইনভেন্টরি সুপারভাইজার",
    dueDate: "2026-10-15",
    priority: "LOW",
    status: "PLANNED",
    createdAt: "2026-09-22T00:00:00.000Z",
    updatedAt: "2026-09-22T00:00:00.000Z",
  },
];

const SEED_REVIEWS: GovernanceReviewSession[] = [
  {
    id: "EHRJ-REV-2026-0001",
    periodTitleBn: "২০২৬ শিক্ষাবর্ষের ৩য় প্রান্তিক প্রাতিষ্ঠানিক ঝুঁকি ও অভ্যন্তরীণ নিয়ন্ত্রণ পর্যালোচনা",
    reviewDate: "2026-09-20",
    leadReviewerName: "মুহতামিম সাহেব (অধ্যক্ষ)",
    leadReviewerRole: "PRINCIPAL",
    participatingRoles: ["HEAD_OF_SHARIAH", "CONTROLLER_OF_EXAMINATIONS", "HEAD_OF_ADMIN", "IT_ADMIN"],
    risksReviewedCount: 5,
    controlsReviewedCount: 5,
    findingsReviewedCount: 1,
    exceptionsReviewedCount: 0,
    summaryDecisionsBn: "শরীয়াহ ফান্ড নিয়ন্ত্রণ যথাযথ পাওয়া গেছে। কিতাব সরবরাহকারী নির্ভরতা কমাতে আগামী মাসে নতুন আরএফকিউ খোলার সিদ্ধান্ত অনুমোদিত হয়েছে।",
    actionItemsCount: 2,
    status: "COMPLETED",
    createdAt: "2026-09-20T00:00:00.000Z",
    updatedAt: "2026-09-20T00:00:00.000Z",
  },
];

export class RiskAssuranceStore {
  // --- Risks ---
  static getRisks(): InstitutionalRisk[] {
    return readJsonFile<InstitutionalRisk[]>(RISKS_FILE, SEED_RISKS);
  }

  static getRiskById(id: string): InstitutionalRisk | undefined {
    return this.getRisks().find((r) => r.id === id);
  }

  static saveRisk(risk: InstitutionalRisk, actor?: ActorContext): InstitutionalRisk {
    const list = this.getRisks();
    const idx = list.findIndex((r) => r.id === risk.id);
    if (idx >= 0) {
      list[idx] = risk;
    } else {
      list.push(risk);
    }
    writeJsonFile(RISKS_FILE, list);

    if (actor) {
      this.recordAudit({
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        entityType: "RISK",
        entityId: risk.id,
        action: idx >= 0 ? "UPDATE_RISK" : "CREATE_RISK",
        actorId: actor.actorId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        notes: `ঝুঁকি রেজিস্টার রেকর্ড ${idx >= 0 ? "হালনাগাদ" : "তৈরি"}: ${risk.titleBn} (${risk.residualLevel})`,
        details: { riskId: risk.id, residualLevel: risk.residualLevel, status: risk.status },
      });
    }

    return risk;
  }

  // --- Controls ---
  static getControls(): InstitutionalControl[] {
    return readJsonFile<InstitutionalControl[]>(CONTROLS_FILE, SEED_CONTROLS);
  }

  static getControlById(id: string): InstitutionalControl | undefined {
    return this.getControls().find((c) => c.id === id);
  }

  static saveControl(control: InstitutionalControl, actor?: ActorContext): InstitutionalControl {
    const list = this.getControls();
    const idx = list.findIndex((c) => c.id === control.id);
    if (idx >= 0) {
      list[idx] = control;
    } else {
      list.push(control);
    }
    writeJsonFile(CONTROLS_FILE, list);

    if (actor) {
      this.recordAudit({
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        entityType: "CONTROL",
        entityId: control.id,
        action: idx >= 0 ? "UPDATE_CONTROL" : "CREATE_CONTROL",
        actorId: actor.actorId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        notes: `অভ্যন্তরীণ নিয়ন্ত্রণ রেকর্ড ${idx >= 0 ? "হালনাগাদ" : "তৈরি"}: ${control.nameBn}`,
        details: { controlId: control.id, status: control.status },
      });
    }

    return control;
  }

  // --- Control Tests ---
  static getControlTests(): ControlTestRecord[] {
    return readJsonFile<ControlTestRecord[]>(CONTROL_TESTS_FILE, []);
  }

  static saveControlTest(test: ControlTestRecord, actor?: ActorContext): ControlTestRecord {
    const list = this.getControlTests();
    list.push(test);
    writeJsonFile(CONTROL_TESTS_FILE, list);

    // Update control's last test info
    const control = this.getControlById(test.controlId);
    if (control) {
      control.lastTestedDate = test.testDate;
      control.lastTestResult = test.result;
      control.updatedAt = new Date().toISOString();
      this.saveControl(control);
    }

    if (actor) {
      this.recordAudit({
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        entityType: "CONTROL_TEST",
        entityId: test.id,
        action: "RECORD_CONTROL_TEST",
        actorId: actor.actorId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        notes: `নিয়ন্ত্রণ পরীক্ষা সম্পন্ন: ${control?.nameBn || test.controlId} -> ফলাফল: ${test.result}`,
        details: { controlId: test.controlId, result: test.result, exceptions: test.exceptionCount },
      });
    }

    return test;
  }

  // --- Exceptions ---
  static getExceptions(): ControlException[] {
    return readJsonFile<ControlException[]>(EXCEPTIONS_FILE, []);
  }

  static saveException(exc: ControlException, actor?: ActorContext): ControlException {
    const list = this.getExceptions();
    const idx = list.findIndex((e) => e.id === exc.id);
    if (idx >= 0) {
      list[idx] = exc;
    } else {
      list.push(exc);
    }
    writeJsonFile(EXCEPTIONS_FILE, list);

    if (actor) {
      this.recordAudit({
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        entityType: "EXCEPTION",
        entityId: exc.id,
        action: idx >= 0 ? "UPDATE_EXCEPTION" : "RECORD_EXCEPTION",
        actorId: actor.actorId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        notes: `নিয়ন্ত্রণ ব্যতিক্রম অনুমোদন: ${exc.controlId} (মেয়াদ: ${exc.endDate})`,
        details: { exceptionId: exc.id, controlId: exc.controlId, status: exc.status },
      });
    }

    return exc;
  }

  // --- Findings ---
  static getFindings(): GovernanceFinding[] {
    return readJsonFile<GovernanceFinding[]>(FINDINGS_FILE, SEED_FINDINGS);
  }

  static getFindingById(id: string): GovernanceFinding | undefined {
    return this.getFindings().find((f) => f.id === id);
  }

  static saveFinding(finding: GovernanceFinding, actor?: ActorContext): GovernanceFinding {
    const list = this.getFindings();
    const idx = list.findIndex((f) => f.id === finding.id);
    if (idx >= 0) {
      list[idx] = finding;
    } else {
      list.push(finding);
    }
    writeJsonFile(FINDINGS_FILE, list);

    if (actor) {
      this.recordAudit({
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        entityType: "FINDING",
        entityId: finding.id,
        action: idx >= 0 ? "UPDATE_FINDING" : "RECORD_FINDING",
        actorId: actor.actorId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        notes: `অডিট/নিয়ন্ত্রণ পর্যবেক্ষণ রেকর্ড: ${finding.titleBn} (${finding.status})`,
        details: { findingId: finding.id, severity: finding.severity, status: finding.status },
      });
    }

    return finding;
  }

  // --- Corrective Actions (CAPA) ---
  static getActions(): CorrectiveAction[] {
    return readJsonFile<CorrectiveAction[]>(ACTIONS_FILE, SEED_ACTIONS);
  }

  static getActionById(id: string): CorrectiveAction | undefined {
    return this.getActions().find((a) => a.id === id);
  }

  static saveAction(actionItem: CorrectiveAction, actor?: ActorContext): CorrectiveAction {
    const list = this.getActions();
    const idx = list.findIndex((a) => a.id === actionItem.id);
    if (idx >= 0) {
      list[idx] = actionItem;
    } else {
      list.push(actionItem);
    }
    writeJsonFile(ACTIONS_FILE, list);

    if (actor) {
      this.recordAudit({
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        entityType: "ACTION",
        entityId: actionItem.id,
        action: idx >= 0 ? "UPDATE_ACTION" : "CREATE_ACTION",
        actorId: actor.actorId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        notes: `সংশোধনমূলক ব্যবস্থা (CAPA) রেকর্ড: ${actionItem.actionDescriptionBn.slice(0, 50)}... (${actionItem.status})`,
        details: { actionId: actionItem.id, status: actionItem.status },
      });
    }

    return actionItem;
  }

  // --- Reviews ---
  static getReviews(): GovernanceReviewSession[] {
    return readJsonFile<GovernanceReviewSession[]>(REVIEWS_FILE, SEED_REVIEWS);
  }

  static saveReview(review: GovernanceReviewSession, actor?: ActorContext): GovernanceReviewSession {
    const list = this.getReviews();
    const idx = list.findIndex((r) => r.id === review.id);
    if (idx >= 0) {
      list[idx] = review;
    } else {
      list.push(review);
    }
    writeJsonFile(REVIEWS_FILE, list);

    if (actor) {
      this.recordAudit({
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        entityType: "REVIEW",
        entityId: review.id,
        action: idx >= 0 ? "UPDATE_REVIEW" : "CREATE_REVIEW",
        actorId: actor.actorId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        notes: `শাসনকার্য পর্যালোচনা অধিবেশন: ${review.periodTitleBn} (${review.status})`,
        details: { reviewId: review.id, status: review.status },
      });
    }

    return review;
  }

  // --- Audit Trail ---
  static getAuditLogs(): GovernanceAuditEntry[] {
    return readJsonFile<GovernanceAuditEntry[]>(AUDIT_FILE, []);
  }

  static recordAudit(entry: GovernanceAuditEntry): void {
    const list = this.getAuditLogs();
    list.unshift(entry);
    if (list.length > 1000) {
      list.pop();
    }
    writeJsonFile(AUDIT_FILE, list);
  }

  // --- Dashboard Aggregations ---
  static getDashboardStats(): GovernanceDashboardStats {
    const risks = this.getRisks();
    const controls = this.getControls();
    const findings = this.getFindings();
    const actions = this.getActions();
    const exceptions = this.getExceptions();
    const reviews = this.getReviews();

    const today = new Date().toISOString().split("T")[0];

    const openRisks = risks.filter((r) => r.status !== "CLOSED" && r.status !== "ARCHIVED").length;
    const criticalRisks = risks.filter((r) => r.residualLevel === "CRITICAL" && r.status !== "CLOSED").length;
    const highRisks = risks.filter((r) => r.residualLevel === "HIGH" && r.status !== "CLOSED").length;
    const mediumRisks = risks.filter((r) => r.residualLevel === "MEDIUM" && r.status !== "CLOSED").length;
    const lowRisks = risks.filter((r) => r.residualLevel === "LOW" && r.status !== "CLOSED").length;
    const mitigatedRisks = risks.filter((r) => r.status === "MITIGATED" || r.status === "CLOSED").length;
    const acceptedRisks = risks.filter((r) => r.status === "ACCEPTED").length;

    const activeControls = controls.filter((c) => c.status === "ACTIVE").length;
    const effectiveControls = controls.filter((c) => c.lastTestResult === "EFFECTIVE").length;
    const partiallyEffectiveControls = controls.filter((c) => c.lastTestResult === "PARTIALLY_EFFECTIVE").length;
    const ineffectiveControls = controls.filter((c) => c.lastTestResult === "INEFFECTIVE").length;
    const untestedControls = controls.filter((c) => !c.lastTestResult || c.lastTestResult === "NOT_TESTED").length;

    const healthPct = activeControls > 0 ? Math.round((effectiveControls / activeControls) * 100) : 100;

    const openFindings = findings.filter((f) => f.status !== "CLOSED" && f.status !== "RESOLVED").length;
    const overdueFindings = findings.filter((f) => f.dueDate < today && f.status !== "CLOSED" && f.status !== "RESOLVED").length;
    const pendingVerificationFindings = findings.filter((f) => f.status === "PENDING_VERIFICATION").length;

    const completedActions = actions.filter((a) => a.status === "COMPLETED" || a.status === "VERIFIED").length;
    const overdueActions = actions.filter((a) => a.dueDate < today && a.status !== "COMPLETED" && a.status !== "VERIFIED").length;

    const activeExceptions = exceptions.filter((e) => e.status === "ACTIVE" && e.endDate >= today).length;
    const upcomingReviews = reviews.filter((r) => r.status === "SCHEDULED" && r.reviewDate >= today).length;

    return {
      totalRisks: risks.length,
      openRisks,
      criticalRisks,
      highRisks,
      mediumRisks,
      lowRisks,
      mitigatedRisks,
      acceptedRisks,

      totalControls: controls.length,
      activeControls,
      effectiveControls,
      partiallyEffectiveControls,
      ineffectiveControls,
      untestedControls,
      controlHealthPercentage: healthPct,

      totalFindings: findings.length,
      openFindings,
      overdueFindings,
      pendingVerificationFindings,

      totalActions: actions.length,
      completedActions,
      overdueActions,

      activeExceptionsCount: activeExceptions,
      upcomingReviewsCount: upcomingReviews,
    };
  }
}
