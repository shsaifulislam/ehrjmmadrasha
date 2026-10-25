/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 43
 * Institutional Compliance Store & Persistence Layer
 * Checkpoint: EHRJ-AI-2026-PHASE43
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  ComplianceRequirement,
  ComplianceObligation,
  ComplianceEvidence,
  ComplianceReview,
  ComplianceException,
  ComplianceRemediation,
  ComplianceAuditLog,
  ActorContext,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "compliance");
const REQ_FILE = path.join(DATA_DIR, "requirements.json");
const OBL_FILE = path.join(DATA_DIR, "obligations.json");
const EVD_FILE = path.join(DATA_DIR, "evidence.json");
const REV_FILE = path.join(DATA_DIR, "reviews.json");
const EXC_FILE = path.join(DATA_DIR, "exceptions.json");
const REM_FILE = path.join(DATA_DIR, "remediations.json");
const AUDIT_FILE = path.join(DATA_DIR, "audit_log.json");

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function safeReadJson<T>(filePath: string, fallback: T): T {
  ensureDirectory();
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[ComplianceStore] Error reading ${filePath}:`, err);
    return fallback;
  }
}

function safeWriteJson<T>(filePath: string, data: T): void {
  ensureDirectory();
  const tempPath = `${filePath}.${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tempPath, filePath);
}

// Initial Seed Data
const SEED_REQUIREMENTS: ComplianceRequirement[] = [
  {
    id: "EHRJ-REQ-CMP-2026-0001",
    version: 1,
    title: "বাংলাদেশ মাদরাসা শিক্ষা বোর্ড বার্ষিক রেজিস্ট্রেশন ও প্রত্যয়নপত্র দাখিল",
    description: "বোর্ড প্রজ্ঞাপন অনুযায়ী ২০২৬ শিক্ষাবর্ষের দাখিল পরীক্ষার্থীদের অনলাইন রেজিস্ট্রেশন ও শুল্ক জমার প্রমাণ সংরক্ষণ।",
    source: "AUTHORITY",
    sourceReference: "BMEB/Admin/Reg-2026/104",
    isLegallyMandatedVerified: true,
    authoritativeSourceRef: "বাংলাদেশ মাদরাসা শিক্ষা বোর্ড প্রজ্ঞাপন ১০৪",
    jurisdiction: "বাংলাদেশ মাদরাসা শিক্ষা বোর্ড (ঢাকা)",
    category: "ACADEMIC_CURRICULUM",
    applicabilityScope: "INSTITUTION_WIDE",
    isApplicable: true,
    effectiveDate: "2026-01-01",
    reviewDate: "2026-11-30",
    status: "ACTIVE",
    relatedControlId: "EHRJ-CTRL-2026-0002",
    createdBy: "admin-system",
    updatedBy: "admin-system",
    createdAt: "2026-01-10T09:00:00.000Z",
    updatedAt: "2026-01-10T09:00:00.000Z",
  },
  {
    id: "EHRJ-REQ-CMP-2026-0002",
    version: 1,
    title: "যাকাত ও লিল্লাহ ফান্ড পৃথকীকরণ ও শরিয়াহ্ নিরীক্ষা প্রতিবেদন",
    description: "মাদরাসার গঠনতন্ত্র ও শরিয়াহ্ বোর্ডের সিদ্ধান্ত অনুযায়ী যাকাত তহবিল সাধারণ তহবিলের সাথে মিশ্রণ সম্পূর্ণরূপে নিষিদ্ধ।",
    source: "INTERNAL_POLICY",
    sourceReference: "EHRJ Shariah Board Resolution 2025/08",
    isLegallyMandatedVerified: false,
    authoritativeSourceRef: "ইলিয়টগঞ্জ মাদরাসা শরিয়াহ্ বোর্ড নীতিমালা অনুচ্ছেদ ৪",
    jurisdiction: "প্রতিষ্ঠান পরিচালনা পর্ষদ ও শরিয়াহ্ কাউন্সিল",
    category: "FINANCIAL_SHARIAH",
    applicabilityScope: "FINANCE",
    isApplicable: true,
    effectiveDate: "2026-01-01",
    reviewDate: "2026-06-30",
    status: "ACTIVE",
    relatedControlId: "EHRJ-CTRL-2026-0001",
    relatedRiskId: "EHRJ-RISK-2026-0001",
    createdBy: "admin-system",
    updatedBy: "admin-system",
    createdAt: "2026-01-10T09:00:00.000Z",
    updatedAt: "2026-01-10T09:00:00.000Z",
  },
  {
    id: "EHRJ-REQ-CMP-2026-0003",
    version: 1,
    title: "শিক্ষক ও কর্মকর্তা নিয়োগ ও চারিত্রিক সনদ হালনাগাদকরণ",
    description: "প্রতিষ্ঠান বিধিমালা অনুযায়ী সকল নিয়োজিত শিক্ষকের শিক্ষাগত সনদ সত্যায়ন ও চারিত্রিক সনদ সংরক্ষিত রাখা।",
    source: "INSTITUTIONAL_SOP",
    sourceReference: "EHRJ-SOP-HR-003",
    isLegallyMandatedVerified: false,
    authoritativeSourceRef: "মানবসম্পদ প্রবিধানমালা ২০২৪",
    jurisdiction: "প্রতিষ্ঠান প্রশাসন",
    category: "EMPLOYEE_HR",
    applicabilityScope: "HR",
    isApplicable: true,
    effectiveDate: "2026-01-01",
    reviewDate: "2026-12-31",
    status: "ACTIVE",
    createdBy: "admin-system",
    updatedBy: "admin-system",
    createdAt: "2026-01-10T09:00:00.000Z",
    updatedAt: "2026-01-10T09:00:00.000Z",
  },
  {
    id: "EHRJ-REQ-CMP-2026-0004",
    version: 1,
    title: "আইটি অবকাঠামো ও শিক্ষার্থী ডাটা ব্যাকআপ অখণ্ডতা পরীক্ষা",
    description: "আইসিটি ও ডাটা সুরক্ষা বিধি অনুযায়ী নিয়মিত ডাটাবেজ ব্যাকআপ এবং ডাটা রিস্টোর যাচাই বাধ্যতামূলক।",
    source: "OPERATIONAL",
    sourceReference: "EHRJ-SEC-SOP-01",
    isLegallyMandatedVerified: false,
    authoritativeSourceRef: "প্রতিষ্ঠান সাইবার ও ডাটা সিকিউরিটি নির্দেশিকা",
    jurisdiction: "আইটি ও সিস্টেম অপারেশনস",
    category: "DATA_PRIVACY",
    applicabilityScope: "TECHNOLOGY",
    isApplicable: true,
    effectiveDate: "2026-01-01",
    reviewDate: "2026-12-31",
    status: "ACTIVE",
    relatedControlId: "EHRJ-CTRL-2026-0003",
    relatedRiskId: "EHRJ-RISK-2026-0002",
    createdBy: "admin-system",
    updatedBy: "admin-system",
    createdAt: "2026-01-10T09:00:00.000Z",
    updatedAt: "2026-01-10T09:00:00.000Z",
  }
];

const SEED_OBLIGATIONS: ComplianceObligation[] = [
  {
    id: "EHRJ-COMP-2026-0001",
    requirementId: "EHRJ-REQ-CMP-2026-0001",
    title: "দাখিল ২০২৬ পরীক্ষার্থী ডাটা এন্ট্রি ও চালান স্লিপ জমা",
    description: "দাখিল পরীক্ষার্থীদের পূর্ণাঙ্গ তালিকা বোর্ডে জমা দিয়ে ব্যাংকিং চালানের প্রমাণ আপলোড নিশ্চিত করা।",
    ownerId: "EMP-0012",
    ownerName: "মাওলানা মোহাম্মদ রফিক",
    ownerRole: "সহকারী প্রধান শিক্ষক ও পরীক্ষা সমন্বয়ক",
    reviewerId: "EMP-0001",
    reviewerName: "মুহতামিম / অধ্যক্ষ সাহেব",
    responsibilityType: "RESPONSIBLE",
    frequency: "ANNUAL",
    startDate: "2026-02-01",
    dueDate: "2026-10-31",
    deadlineSource: "শিক্ষা বোর্ড নির্ধারিত সময়সীমা",
    reminderDate: "2026-10-15",
    status: "IN_PROGRESS",
    evidenceIds: ["EHRJ-EVD-CMP-2026-0001"],
    relatedControlId: "EHRJ-CTRL-2026-0002",
    notes: "খসড়া তালিকা প্রস্তুত হয়েছে, প্রধান শিক্ষক মহোদয়ের স্বাক্ষর বাকি।",
    createdAt: "2026-01-15T10:00:00.000Z",
    updatedAt: "2026-01-15T10:00:00.000Z",
  },
  {
    id: "EHRJ-COMP-2026-0002",
    requirementId: "EHRJ-REQ-CMP-2026-0002",
    title: "ষাণ্মাসিক যাকাত ও লিল্লাহ তহবিল ব্যাংক বিবরণী রিকনসিলিয়েশন",
    description: "ব্যাংক হিসাবের যাকাত তহবিলের পৃথক খতিয়ান প্রস্তুত এবং শরিয়াহ্ কমিটির জন্য বিবরণী তৈরি।",
    ownerId: "EMP-0005",
    ownerName: "মুহাম্মদ আব্দুল্লাহ",
    ownerRole: "প্রধান হিসাবরক্ষক",
    reviewerId: "EMP-0001",
    reviewerName: "মুহতামিম / অধ্যক্ষ সাহেব",
    responsibilityType: "ACCOUNTABLE",
    frequency: "HALF_YEARLY",
    startDate: "2026-01-01",
    dueDate: "2026-06-30",
    completionDate: "2026-06-25",
    deadlineSource: "অর্থ পরিচালনা নীতিমালা",
    status: "COMPLIANT",
    evidenceIds: ["EHRJ-EVD-CMP-2026-0002"],
    latestReviewId: "EHRJ-REV-CMP-2026-0001",
    relatedRiskId: "EHRJ-RISK-2026-0001",
    relatedControlId: "EHRJ-CTRL-2026-0001",
    notes: "ষাণ্মাসিক নিরীক্ষা সম্পন্ন ও ফান্ড সম্পূর্ণ পৃথক পাওয়া গেছে।",
    createdAt: "2026-01-15T10:00:00.000Z",
    updatedAt: "2026-06-25T11:00:00.000Z",
  },
  {
    id: "EHRJ-COMP-2026-0003",
    requirementId: "EHRJ-REQ-CMP-2026-0004",
    title: "ত্রৈমাসিক অফসাইট ডাটাবেজ ব্যাকআপ ড্রিল পরিচালনা",
    description: "সার্ভার ব্যাকআপ থেকে অফলাইন কোল্ড স্টোরেজ কপি তৈরি এবং রিস্টোর ড্রিল টেস্ট লগ রাখা।",
    ownerId: "EMP-0018",
    ownerName: "ইঞ্জিনিয়ার সাইদুর রহমান",
    ownerRole: "সিস্টেম ও আইটি প্রশাসক",
    reviewerId: "EMP-0001",
    reviewerName: "মুহতামিম / অধ্যক্ষ সাহেব",
    responsibilityType: "RESPONSIBLE",
    frequency: "QUARTERLY",
    startDate: "2026-01-01",
    dueDate: "2026-03-31",
    completionDate: "2026-03-28",
    deadlineSource: "আইটি অপারেশনস শিডিউল",
    status: "COMPLIANT",
    evidenceIds: ["EHRJ-EVD-CMP-2026-0003"],
    relatedRiskId: "EHRJ-RISK-2026-0002",
    relatedControlId: "EHRJ-CTRL-2026-0003",
    notes: "Q1 ব্যাকআপ ড্রিল সফলভাবে সম্পন্ন হয়েছে।",
    createdAt: "2026-01-15T10:00:00.000Z",
    updatedAt: "2026-03-28T16:00:00.000Z",
  }
];

const SEED_EVIDENCE: ComplianceEvidence[] = [
  {
    id: "EHRJ-EVD-CMP-2026-0001",
    obligationId: "EHRJ-COMP-2026-0001",
    title: "দাখিল ২০২৬ সোনালী ব্যাংক চালান জমার কাউন্টারফয়েল",
    source: "সোনালী ব্যাংক পিএলসি, ইলিয়টগঞ্জ শাখা",
    evidenceType: "SUBMISSION_RECEIPT",
    fileToken: "DOC-EVD-2026-BANK-0091",
    hash: "a4f89d34e2c908129031efbca928372619472648194762104928374619482736",
    dateCollected: "2026-02-15",
    collectorId: "EMP-0012",
    collectorName: "মাওলানা মোহাম্মদ রফিক",
    verificationStatus: "PENDING",
    createdAt: "2026-02-15T11:00:00.000Z",
  },
  {
    id: "EHRJ-EVD-CMP-2026-0002",
    obligationId: "EHRJ-COMP-2026-0002",
    title: "২০২৬ প্রথমার্ধের যাকাত অডিট প্রত্যয়ন ও ব্যাংক বিবরণী",
    source: "অর্থ ও অডিট কমিটি",
    evidenceType: "AUDIT_RECORD",
    fileToken: "DOC-EVD-2026-FIN-0042",
    hash: "c7e819472648194762104928374619482736a4f89d34e2c908129031efbca928",
    dateCollected: "2026-06-24",
    collectorId: "EMP-0005",
    collectorName: "মুহাম্মদ আব্দুল্লাহ",
    verificationStatus: "VERIFIED",
    verifiedBy: "মুহতামিম / অধ্যক্ষ সাহেব",
    verifiedAt: "2026-06-25T11:30:00.000Z",
    verificationNotes: "যাকাত ও সাধারণ খতিয়ানের ব্যালেন্স শরিয়াহ্ বিধান অনুযায়ী যথাযথভাবে সংরক্ষিত।",
    createdAt: "2026-06-24T14:00:00.000Z",
  },
  {
    id: "EHRJ-EVD-CMP-2026-0003",
    obligationId: "EHRJ-COMP-2026-0003",
    title: "Q1-2026 ডাটাবেজ ব্যাকআপ রিস্টোর সফল মহড়া লগ",
    source: "আইটি অবকাঠামো লগ",
    evidenceType: "REPORT",
    fileToken: "DOC-EVD-2026-IT-0019",
    hash: "8194762104928374619482736a4f89d34e2c908129031efbca928c7e81947264",
    dateCollected: "2026-03-28",
    collectorId: "EMP-0018",
    collectorName: "ইঞ্জিনিয়ার সাইদুর রহমান",
    verificationStatus: "VERIFIED",
    verifiedBy: "মুহতামিম / অধ্যক্ষ সাহেব",
    verifiedAt: "2026-03-29T10:00:00.000Z",
    verificationNotes: "টেস্ট সার্ভারে ব্যাকআপ রিস্টোর টেস্ট সফলভাবে প্রতিপন্ন হয়েছে।",
    createdAt: "2026-03-28T16:10:00.000Z",
  }
];

const SEED_REVIEWS: ComplianceReview[] = [
  {
    id: "EHRJ-REV-CMP-2026-0001",
    obligationId: "EHRJ-COMP-2026-0002",
    requirementId: "EHRJ-REQ-CMP-2026-0002",
    reviewerId: "EMP-0001",
    reviewerName: "মুহতামিম / অধ্যক্ষ সাহেব",
    reviewerRole: "PRINCIPAL",
    reviewDate: "2026-06-25",
    evidenceReviewed: ["EHRJ-EVD-CMP-2026-0002"],
    checklistAnswers: {
      "requirementExists": true,
      "evidenceAvailable": true,
      "responsibleAssigned": true,
      "deadlineMet": true,
      "requiredDocumentValid": true,
      "requiredApprovalObtained": true,
    },
    decision: "COMPLIANT",
    findingsNotes: "যাকাত তহবিল শতভাগ শরিয়াহ্ সম্মতভাবে সংরক্ষিত। কোনো ব্যত্যয় পাওয়া যায়নি।",
    remediationRequired: false,
    nextReviewDate: "2026-12-31",
    createdAt: "2026-06-25T11:45:00.000Z",
  }
];

export class ComplianceStore {
  static getRequirements(): ComplianceRequirement[] {
    return safeReadJson<ComplianceRequirement[]>(REQ_FILE, SEED_REQUIREMENTS);
  }

  static saveRequirements(requirements: ComplianceRequirement[]): void {
    safeWriteJson(REQ_FILE, requirements);
  }

  static getObligations(): ComplianceObligation[] {
    return safeReadJson<ComplianceObligation[]>(OBL_FILE, SEED_OBLIGATIONS);
  }

  static saveObligations(obligations: ComplianceObligation[]): void {
    safeWriteJson(OBL_FILE, obligations);
  }

  static getEvidence(): ComplianceEvidence[] {
    return safeReadJson<ComplianceEvidence[]>(EVD_FILE, SEED_EVIDENCE);
  }

  static saveEvidence(evidence: ComplianceEvidence[]): void {
    safeWriteJson(EVD_FILE, evidence);
  }

  static getReviews(): ComplianceReview[] {
    return safeReadJson<ComplianceReview[]>(REV_FILE, SEED_REVIEWS);
  }

  static saveReviews(reviews: ComplianceReview[]): void {
    safeWriteJson(REV_FILE, reviews);
  }

  static getExceptions(): ComplianceException[] {
    return safeReadJson<ComplianceException[]>(EXC_FILE, []);
  }

  static saveExceptions(exceptions: ComplianceException[]): void {
    safeWriteJson(EXC_FILE, exceptions);
  }

  static getRemediations(): ComplianceRemediation[] {
    return safeReadJson<ComplianceRemediation[]>(REM_FILE, []);
  }

  static saveRemediations(remediations: ComplianceRemediation[]): void {
    safeWriteJson(REM_FILE, remediations);
  }

  static getAuditLogs(): ComplianceAuditLog[] {
    return safeReadJson<ComplianceAuditLog[]>(AUDIT_FILE, []);
  }

  static logAudit(
    entityType: ComplianceAuditLog["entityType"],
    entityId: string,
    action: string,
    actor: ActorContext,
    changes: Record<string, any>
  ): void {
    const logs = this.getAuditLogs();
    const newLog: ComplianceAuditLog = {
      id: `AUDIT-CMP-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
      entityType,
      entityId,
      action,
      actorId: actor.userId,
      actorName: actor.userName,
      actorRole: actor.userRole,
      timestamp: new Date().toISOString(),
      changes,
      ipAddress: actor.ipAddress,
    };
    logs.unshift(newLog);
    // Keep max 1000 logs
    safeWriteJson(AUDIT_FILE, logs.slice(0, 1000));
  }
}
