import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { recordSecurityEvent } from "@/lib/securityEngine";

export interface DataQualityIssue {
  id: string; // EHRJ-DQ-YYYY-XXXXXX
  domain: string;
  entityType: string;
  entityId: string;
  ruleCode: string;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  status: "OPEN" | "INVESTIGATING" | "ASSIGNED" | "CORRECTION_PROPOSED" | "RESOLVED" | "REJECTED" | "WAIVED";
  detectedAt: string;
  detectedBy: string; // SYSTEM | USER_ID
  evidence: Record<string, any>;
  assignedTo?: string | null;
  proposedCorrection?: string | null;
  resolutionNotes?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
}

export interface DataQualityRule {
  code: string;
  domain: string;
  nameBn: string;
  nameEn: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  ruleType: "FIELD_VALIDATION" | "UNIQUENESS" | "REFERENTIAL_INTEGRITY" | "CROSS_ENTITY" | "TEMPORAL" | "FINANCIAL" | "SECURITY" | "WORKFLOW" | "BUSINESS_RULE";
  descriptionBn: string;
  isActive: boolean;
}

export interface AuthoritativeDomain {
  domain: string;
  nameBn: string;
  authoritativeModel: string;
  authoritativeStore: string;
  descriptionBn: string;
  immutabilityRule: string;
}

// -------------------------------------------------------------
// 1. AUTHORITATIVE DOMAIN INVENTORY
// -------------------------------------------------------------
export const AUTHORITATIVE_DOMAINS: AuthoritativeDomain[] = [
  {
    domain: "STUDENT_IDENTITY",
    nameBn: "শিক্ষার্থী মূল পরিচয়",
    authoritativeModel: "Student",
    authoritativeStore: "Prisma (dev.db)",
    descriptionBn: "শিক্ষার্থীর জন্ম নিবন্ধন, নাম, পিতা-মাতার পরিচয় ও প্রাতিষ্ঠানিক আইডি",
    immutabilityRule: "আইডি নম্বর অপরিবর্তনীয়; নাম বা তথ্যের পরিবর্তন কেবল অ্যাডমিন অডিটের মাধ্যমে প্রযোজ্য।"
  },
  {
    domain: "GUARDIAN_IDENTITY",
    nameBn: "অভিভাবক মূল তথ্য",
    authoritativeModel: "Guardian",
    authoritativeStore: "Prisma (dev.db)",
    descriptionBn: "অভিভাবকের নাম, মোবাইল নম্বর ও জাতীয় পরিচয়পত্র",
    immutabilityRule: "মোবাইল নম্বর অনন্য; একাধিক শিক্ষার্থীর সাথে যুক্ত থাকতে পারে।"
  },
  {
    domain: "ACADEMIC_CALENDAR",
    nameBn: "শিক্ষাবর্ষ ও ক্যালেন্ডার",
    authoritativeModel: "AcademicSession",
    authoritativeStore: "Prisma (dev.db)",
    descriptionBn: "মাদরাসার শিক্ষাবর্ষের সময়সীমা ও সক্রিয় অবস্থা",
    immutabilityRule: "পূর্ববর্তী শিক্ষাবর্ষের নাম বা তারিখ পরিবর্তন কঠোরভাবে নিষিদ্ধ।"
  },
  {
    domain: "ACADEMIC_STRUCTURE",
    nameBn: "জামাত ও শাখা কাঠামো",
    authoritativeModel: "JamatClass, Section",
    authoritativeStore: "Prisma (dev.db)",
    descriptionBn: "মাদরাসার শ্রেণি (নাহবেমীর, হেদায়াতুন্নাহব ইত্যাদি) ও সেকশন তালিকা",
    immutabilityRule: "ঐতিহাসিক ফলাফল বা নথির জামাত রেফারেন্স অপরিবর্তিত থাকে।"
  },
  {
    domain: "ENROLLMENT",
    nameBn: "ভর্তি ও ক্লাসে অন্তর্ভুক্তি",
    authoritativeModel: "Enrollment",
    authoritativeStore: "Prisma (dev.db)",
    descriptionBn: "নির্দিষ্ট শিক্ষাবর্ষে নির্দিষ্ট জামাতে শিক্ষার্থীর রোল ও স্ট্যাটাস",
    immutabilityRule: "প্রতি শিক্ষাবর্ষে শিক্ষার্থীর কেবলমাত্র একটি সক্রিয় এনরোলমেন্ট থাকতে পারে।"
  },
  {
    domain: "ATTENDANCE_LEDGER",
    nameBn: "হাজিরা খতিয়ান",
    authoritativeModel: "Attendance",
    authoritativeStore: "Prisma (dev.db)",
    descriptionBn: "দৈনিক উপস্থিতি, অনুপস্থিতি ও ছুটি রেকর্ড",
    immutabilityRule: "লককৃত তারিখের হাজিরা অ্যাডমিন আনলক ছাড়া সংশোধনযোগ্য নয়।"
  },
  {
    domain: "EXAM_AND_RESULTS",
    nameBn: "পরীক্ষা ও ফলাফল খতিয়ান",
    authoritativeModel: "Exam, ExamMark, Result",
    authoritativeStore: "Prisma (dev.db)",
    descriptionBn: "পরীক্ষায় প্রাপ্ত নম্বর ও চূড়ান্ত ফলাফল স্ন্যাপশট",
    immutabilityRule: "প্রকাশিত ফলাফল ক্রিপ্টোগ্রাফিক কোড ও স্ন্যাপশটে সংরক্ষিত এবং অপরিবর্তনীয়।"
  },
  {
    domain: "FEE_STRUCTURE",
    nameBn: "ফি কাঠামো নীতিমালা",
    authoritativeModel: "FeeStructure, FeeCategory",
    authoritativeStore: "Prisma (dev.db)",
    descriptionBn: "মাসিক বেতন, বোর্ডিং ও পরীক্ষা ফি এর হার",
    immutabilityRule: "ফি পরিবর্তন কেবল ভবিষ্যৎ ইনভয়েসের জন্য কার্যকর হবে; পুরোনো ইনভয়েসে প্রভাব ফেলবে না।"
  },
  {
    domain: "FINANCE_INVOICE",
    nameBn: "ফি ইনভয়েস ও বকেয়া",
    authoritativeModel: "FeeInvoice, InvoiceItem",
    authoritativeStore: "Prisma (dev.db)",
    descriptionBn: "শিক্ষার্থীর পাওনা ইনভয়েস",
    immutabilityRule: "সরাসরি পরিমাণ পরিবর্তন নিষিদ্ধ; রিবেট, মওকুফ বা সংশোধনী সমন্বয়ের মাধ্যমে হতে হবে।"
  },
  {
    domain: "FINANCE_PAYMENT",
    nameBn: "পেমেন্ট ও রশিদ খতিয়ান",
    authoritativeModel: "PaymentReceipt, Refund",
    authoritativeStore: "Prisma (dev.db)",
    descriptionBn: "আদায়কৃত অর্থ ও অর্থ ফেরত রসিদ",
    immutabilityRule: "সফল পেমেন্ট রসিদ অপরিবর্তনীয়; সংশোধনের ক্ষেত্রে রিফান্ড ভাউচার ব্যবহৃত হবে।"
  },
  {
    domain: "CASH_FUNDS",
    nameBn: "সাধারণ ও শরীয়াহ ফান্ড লেজার",
    authoritativeModel: "CashFund, CashTransaction",
    authoritativeStore: "Prisma (dev.db)",
    descriptionBn: "সাধারণ, লিল্লাহ, যাকাত, নির্মাণ ও এতিম ফান্ড খতিয়ান",
    immutabilityRule: "ফান্ড ব্যালেন্স সর্বদা ক্যাশ ট্রানজেকশনের যোগফলের সাথে শতভাগ মিলতে হবে।"
  },
  {
    domain: "INSTITUTIONAL_DOCUMENTS",
    nameBn: "সার্টিফিকেট ও প্রাতিষ্ঠানিক সনদ",
    authoritativeModel: "Certificate, DocumentRequest",
    authoritativeStore: "Prisma (dev.db)",
    descriptionBn: "ইস্যুকৃত প্রত্যয়নপত্র, ছাড়পত্র ও আইডি কার্ড",
    immutabilityRule: "ইস্যুকৃত সনদ কখনো ডিলিট হবে না; বাতিল হলে REVOKED হিসেবে চিহ্নিত হবে।"
  },
  {
    domain: "LIBRARY_CIRCULATION",
    nameBn: "গ্রন্থাগার ও কিতাব সার্কুলেশন",
    authoritativeModel: "LibraryBook, LibraryBookCopy, LibraryIssue",
    authoritativeStore: "Prisma (dev.db)",
    descriptionBn: "কিতাব কপি একসেশন ও ইস্যু খতিয়ান",
    immutabilityRule: "একই কপি একসাথে একাধিক সদস্যের নিকট ইস্যু থাকা কঠোরভাবে নিষিদ্ধ।"
  },
  {
    domain: "INVENTORY_LEDGER",
    nameBn: "সম্পদ ও ইনভেন্টরি স্টক",
    authoritativeModel: "InventoryItem, InventoryStockBalance, InventoryTransaction",
    authoritativeStore: "Prisma (dev.db)",
    descriptionBn: "মাদরাসার মালামাল ও স্টক ব্যালেন্স",
    immutabilityRule: "স্টক ব্যালেন্স কখনো ঋণাত্মক (Negative) হতে পারে না।"
  },
  {
    domain: "HR_PAYROLL",
    nameBn: "কর্মী ও শিক্ষক বেতন খতিয়ান",
    authoritativeModel: "Employee, PayrollRecord",
    authoritativeStore: "Prisma (dev.db)",
    descriptionBn: "বেতন স্কেল, ভাতা ও মাসিক বেতন বিল",
    immutabilityRule: "অনুমোদিত ও পরিশোধিত পেরোল ভাউচার সরাসরি এডিট নিষিদ্ধ।"
  }
];

// -------------------------------------------------------------
// 2. DATA QUALITY RULES INVENTORY
// -------------------------------------------------------------
export const DATA_QUALITY_RULES: DataQualityRule[] = [
  {
    code: "DQ-STU-001",
    domain: "STUDENT_IDENTITY",
    nameBn: "সক্রিয় শিক্ষার্থীর সক্রিয় শিক্ষাবর্ষে এনরোলমেন্ট বাধ্যতামূলক",
    nameEn: "Active student must have active enrollment",
    severity: "HIGH",
    ruleType: "CROSS_ENTITY",
    descriptionBn: "যেসব শিক্ষার্থীর স্ট্যাটাস ACTIVE তাদের বর্তমান শিক্ষাবর্ষে বৈধ এনরোলমেন্ট থাকতে হবে।",
    isActive: true
  },
  {
    code: "DQ-STU-002",
    domain: "STUDENT_IDENTITY",
    nameBn: "এক শিক্ষাবর্ষে শিক্ষার্থীর একাধিক সক্রিয় এনরোলমেন্ট নিষিদ্ধ",
    nameEn: "No multiple active enrollments in single session",
    severity: "CRITICAL",
    ruleType: "UNIQUENESS",
    descriptionBn: "একই শিক্ষাবর্ষে একজন শিক্ষার্থীর কেবল একটি সক্রিয় ক্লাস/শাখা এনরোলমেন্ট থাকতে পারে।",
    isActive: true
  },
  {
    code: "DQ-STU-003",
    domain: "STUDENT_IDENTITY",
    nameBn: "শিক্ষার্থীর জন্ম নিবন্ধন নম্বর অনন্য হতে হবে",
    nameEn: "Unique birth certificate number across students",
    severity: "CRITICAL",
    ruleType: "UNIQUENESS",
    descriptionBn: "জন্ম নিবন্ধন নম্বর থাকলে তা সম্পূর্ণ মাদরাসায় অনন্য হতে হবে।",
    isActive: true
  },
  {
    code: "DQ-GUA-001",
    domain: "GUARDIAN_IDENTITY",
    nameBn: "প্রতিটি শিক্ষার্থীর একজন প্রধান অভিভাবক (Primary Guardian) থাকতে হবে",
    nameEn: "Every student must have a primary guardian link",
    severity: "MEDIUM",
    ruleType: "REFERENTIAL_INTEGRITY",
    descriptionBn: "পোর্টালে যোগাযোগ ও নোটিফিকেশনের জন্য শিক্ষার্থীর অভিভাবক লিংকে অন্তত একজনের isPrimary=true থাকা আবশ্যক।",
    isActive: true
  },
  {
    code: "DQ-ACAD-001",
    domain: "ACADEMIC_STRUCTURE",
    nameBn: "একই শিক্ষাবর্ষ, জামাত ও শাখায় রোল নম্বর অনন্য হতে হবে",
    nameEn: "Unique roll number in session-class-section scope",
    severity: "HIGH",
    ruleType: "UNIQUENESS",
    descriptionBn: "একটি ক্লাসের একটি সেকশনে একাধিক শিক্ষার্থীর রোল নম্বর একই হতে পারে না।",
    isActive: true
  },
  {
    code: "DQ-FIN-001",
    domain: "FINANCE_INVOICE",
    nameBn: "ইনভয়েসের মোট পরিমাণ ও আইটেমসমূহের গাণিতিক সমতা",
    nameEn: "Invoice net amount arithmetic integrity",
    severity: "CRITICAL",
    ruleType: "FINANCIAL",
    descriptionBn: "ইনভয়েসের নিট মূল্য অবশ্যই মোট মূল্য - ছাড় - মওকুফ + বিলম্ব ফি এর সমান হতে হবে।",
    isActive: true
  },
  {
    code: "DQ-FIN-002",
    domain: "FINANCE_PAYMENT",
    nameBn: "ইনভয়েসে পরিশোধিত অর্থ রসিদের সমষ্টির সাথে মিলতে হবে",
    nameEn: "Invoice paid amount must match payment receipts",
    severity: "CRITICAL",
    ruleType: "FINANCIAL",
    descriptionBn: "ইনভয়েসের paidAmount ফিল্ড সফল PaymentReceipt এর সমষ্টি বিয়োগ Refund এর সমান হতে হবে।",
    isActive: true
  },
  {
    code: "DQ-FIN-003",
    domain: "CASH_FUNDS",
    nameBn: "ফান্ড ব্যালেন্স ক্যাশ লেনদেনের খতিয়ানের সাথে শতভাগ মিলতে হবে",
    nameEn: "Cash fund balance ledger reconciliation",
    severity: "CRITICAL",
    ruleType: "FINANCIAL",
    descriptionBn: "ফান্ডের সংরক্ষিত ব্যালেন্স সকল আয় ট্রানজেকশন বিয়োগ ব্যয় ট্রানজেকশনের সমান হতে হবে।",
    isActive: true
  },
  {
    code: "DQ-ATT-001",
    domain: "ATTENDANCE_LEDGER",
    nameBn: "নিষ্ক্রিয় শিক্ষার্থীর হাজিরা গ্রহণ নিষিদ্ধ",
    nameEn: "No attendance record for inactive/withdrawn student",
    severity: "HIGH",
    ruleType: "BUSINESS_RULE",
    descriptionBn: "ছাত্র মাদরাসা ত্যাগ বা সাসপেন্ড হলে তার জন্য হাজিরা গ্রহণ করা যাবে না।",
    isActive: true
  },
  {
    code: "DQ-RES-001",
    domain: "EXAM_AND_RESULTS",
    nameBn: "চূড়ান্ত ফলাফল প্রাপ্ত নম্বর বিষয়ের প্রাপ্ত নম্বরের যোগফলের সমান হতে হবে",
    nameEn: "Result total obtained must match sum of exam marks",
    severity: "HIGH",
    ruleType: "CROSS_ENTITY",
    descriptionBn: "রেজাল্ট টেবিলে সংরক্ষিত মোট নম্বর শিক্ষার্থীটির উক্ত পরীক্ষার সকল বিষয়ের মোট নম্বরের সমান হতে হবে।",
    isActive: true
  },
  {
    code: "DQ-DOC-001",
    domain: "INSTITUTIONAL_DOCUMENTS",
    nameBn: "বাতিলকৃত সনদের স্ট্যাটাস REVOKED হতে হবে",
    nameEn: "Revoked certificate status consistency",
    severity: "HIGH",
    ruleType: "FIELD_VALIDATION",
    descriptionBn: "যদি সনদের isRevoked=true হয়, তবে status অবশ্যই REVOKED হতে হবে।",
    isActive: true
  },
  {
    code: "DQ-LIB-001",
    domain: "LIBRARY_CIRCULATION",
    nameBn: "একই কিতাব কপি একাধিক সদস্যকে ইস্যু করা নিষিদ্ধ",
    nameEn: "Book copy cannot be issued to multiple members simultaneously",
    severity: "CRITICAL",
    ruleType: "UNIQUENESS",
    descriptionBn: "লাইব্রেরির কোনো বইয়ের কপি ফেরত না দেওয়া পর্যন্ত অন্য কাউকে ইস্যু করা যাবে না।",
    isActive: true
  },
  {
    code: "DQ-INV-001",
    domain: "INVENTORY_LEDGER",
    nameBn: "ইনভেন্টরি স্টকের পরিমাণ ঋণাত্মক হতে পারবে না",
    nameEn: "Inventory stock balance cannot be negative",
    severity: "HIGH",
    ruleType: "BUSINESS_RULE",
    descriptionBn: "যেকোনো আইটেমের স্টক ব্যালেন্স সর্বদা শূন্য বা তার বেশি হতে হবে।",
    isActive: true
  },
  {
    code: "DQ-HR-001",
    domain: "HR_PAYROLL",
    nameBn: "পেরোল নিট বেতনের গাণিতিক সমতা",
    nameEn: "Payroll net salary calculation consistency",
    severity: "HIGH",
    ruleType: "FINANCIAL",
    descriptionBn: "নিট বেতন = মূল বেতন + ভাতাসমূহ - কর্তনসমূহ - অগ্রিম কর্তন।",
    isActive: true
  }
];

// File paths for append-only data governance ledger
const DATA_DIR = path.join(process.cwd(), "data", "governance");
const ISSUES_FILE = path.join(DATA_DIR, "data_quality_issues.json");
const MERGE_AUDIT_FILE = path.join(DATA_DIR, "merge_audit_log.json");

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(ISSUES_FILE)) {
    fs.writeFileSync(ISSUES_FILE, JSON.stringify([], null, 2), "utf-8");
  }
  if (!fs.existsSync(MERGE_AUDIT_FILE)) {
    fs.writeFileSync(MERGE_AUDIT_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

export function getAllDataQualityIssues(): DataQualityIssue[] {
  ensureDirectory();
  try {
    const raw = fs.readFileSync(ISSUES_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveAllDataQualityIssues(issues: DataQualityIssue[]): void {
  ensureDirectory();
  fs.writeFileSync(ISSUES_FILE, JSON.stringify(issues, null, 2), "utf-8");
}

export function generateIssueId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `EHRJ-DQ-${year}-${rand}`;
}

// -------------------------------------------------------------
// 3. RUN DATA QUALITY SCAN
// -------------------------------------------------------------
export async function runDataQualityScan(targetDomains?: string[]): Promise<{
  scanTimestamp: string;
  totalIssuesFound: number;
  newIssuesCreated: number;
  existingIssuesUpdated: number;
  criticalIssues: number;
  highIssues: number;
  status: "HEALTHY" | "WARNING" | "ERROR" | "REVIEW_REQUIRED";
}> {
  ensureDirectory();
  const existingIssues = getAllDataQualityIssues();
  const issuesMap = new Map<string, DataQualityIssue>();
  for (const iss of existingIssues) {
    // Unique key: ruleCode + entityType + entityId
    issuesMap.set(`${iss.ruleCode}:${iss.entityType}:${iss.entityId}`, iss);
  }

  let newCount = 0;
  let updatedCount = 0;

  // Helper to upsert issue
  const reportIssue = (
    ruleCode: string,
    domain: string,
    entityType: string,
    entityId: string,
    titleBn: string,
    titleEn: string,
    descriptionBn: string,
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO",
    evidence: Record<string, any>
  ) => {
    const key = `${ruleCode}:${entityType}:${entityId}`;
    const nowStr = new Date().toISOString();
    if (issuesMap.has(key)) {
      const existing = issuesMap.get(key)!;
      // If already resolved or rejected, don't reopen unless evidence changed substantially
      if (existing.status !== "RESOLVED" && existing.status !== "REJECTED") {
        existing.evidence = evidence;
        existing.severity = severity;
        updatedCount++;
      }
    } else {
      const newIssue: DataQualityIssue = {
        id: generateIssueId(),
        domain,
        entityType,
        entityId,
        ruleCode,
        titleBn,
        titleEn,
        descriptionBn,
        severity,
        status: "OPEN",
        detectedAt: nowStr,
        detectedBy: "SYSTEM_SCANNER",
        evidence
      };
      issuesMap.set(key, newIssue);
      newCount++;
    }
  };

  // Rule 1: DQ-STU-001 (Active Student must have Active Enrollment)
  const currentSession = await prisma.academicSession.findFirst({ where: { isCurrent: true } }) || 
                         await prisma.academicSession.findFirst({ where: { status: "ACTIVE" } });
  
  if (currentSession) {
    const activeStudents = await prisma.student.findMany({
      where: { status: "ACTIVE" },
      include: {
        enrollments: {
          where: { sessionId: currentSession.id, status: "ACTIVE" }
        }
      }
    });

    for (const st of activeStudents) {
      if (st.enrollments.length === 0) {
        reportIssue(
          "DQ-STU-001",
          "STUDENT_IDENTITY",
          "Student",
          st.id,
          `শিক্ষার্থীর সক্রিয় শিক্ষাবর্ষে এনরোলমেন্ট নেই (${st.fullNameBn})`,
          `Active student lacks active enrollment (${st.studentIdNumber})`,
          `শিক্ষার্থী ${st.fullNameBn} (${st.studentIdNumber}) সক্রিয় থাকা সত্ত্বেও বর্তমান শিক্ষাবর্ষে (${currentSession.name}) তার কোনো এনরোলমেন্ট নেই।`,
          "HIGH",
          { studentId: st.id, studentIdNumber: st.studentIdNumber, sessionId: currentSession.id }
        );
      } else if (st.enrollments.length > 1) {
        // Rule 2: DQ-STU-002
        reportIssue(
          "DQ-STU-002",
          "STUDENT_IDENTITY",
          "Student",
          st.id,
          `শিক্ষার্থীর একাধিক সক্রিয় এনরোলমেন্ট বিদ্যমান (${st.fullNameBn})`,
          `Multiple active enrollments found for student (${st.studentIdNumber})`,
          `শিক্ষার্থী ${st.fullNameBn} এর জন্য একই শিক্ষাবর্ষে ${st.enrollments.length} টি সক্রিয় এনরোলমেন্ট পাওয়া গেছে।`,
          "CRITICAL",
          { studentId: st.id, studentIdNumber: st.studentIdNumber, count: st.enrollments.length }
        );
      }
    }
  }

  // Rule 3: DQ-GUA-001 (Student must have primary guardian)
  const studentsWithoutPrimary = await prisma.student.findMany({
    where: {
      status: "ACTIVE",
      guardianLinks: { none: { isPrimary: true } }
    },
    select: { id: true, studentIdNumber: true, fullNameBn: true }
  });

  for (const st of studentsWithoutPrimary) {
    reportIssue(
      "DQ-GUA-001",
      "GUARDIAN_IDENTITY",
      "Student",
      st.id,
      `শিক্ষার্থীর প্রধান অভিভাবক নির্ধারিত নেই (${st.fullNameBn})`,
      `Student has no primary guardian assigned (${st.studentIdNumber})`,
      `শিক্ষার্থী ${st.fullNameBn} (${st.studentIdNumber}) এর কোনো অভিভাবককে প্রাথমিক (Primary) হিসেবে চিহ্নিত করা হয়নি।`,
      "MEDIUM",
      { studentId: st.id, studentIdNumber: st.studentIdNumber }
    );
  }

  // Rule 4: DQ-ACAD-001 (Duplicate Roll within session, class, section)
  const enrollments = await prisma.enrollment.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, sessionId: true, classId: true, sectionId: true, rollNumber: true, studentId: true }
  });
  const rollMap: Record<string, string[]> = {};
  for (const enr of enrollments) {
    const key = `${enr.sessionId}_${enr.classId}_${enr.sectionId || "NO_SEC"}_${enr.rollNumber}`;
    if (!rollMap[key]) rollMap[key] = [];
    rollMap[key].push(enr.studentId);
  }
  for (const [key, studentIds] of Object.entries(rollMap)) {
    if (studentIds.length > 1) {
      reportIssue(
        "DQ-ACAD-001",
        "ACADEMIC_STRUCTURE",
        "EnrollmentScope",
        key,
        `একই জামাত/শাখায় একাধিক শিক্ষার্থীর একই রোল (${key.split("_").pop()})`,
        `Duplicate roll number in academic scope`,
        `উক্ত শিক্ষাবর্ষ ও জামাত স্কোপে ${studentIds.length} জন শিক্ষার্থীর একই রোল নম্বর রয়েছে।`,
        "HIGH",
        { scopeKey: key, studentIds, rollNumber: key.split("_").pop() }
      );
    }
  }

  // Rule 5: DQ-FIN-001 (Invoice net amount integrity)
  const invoices = await prisma.feeInvoice.findMany({
    include: { receipts: true, refunds: true }
  });

  for (const inv of invoices) {
    const calculatedNet = inv.totalAmount - inv.discountAmount - inv.waiverAmount + inv.lateFeeAmount;
    if (Math.abs(inv.netAmount - calculatedNet) > 0.01) {
      reportIssue(
        "DQ-FIN-001",
        "FINANCE_INVOICE",
        "FeeInvoice",
        inv.id,
        `ইনভয়েস নিট মূল্যের হিসাব অসঙ্গতি (${inv.invoiceNumber})`,
        `Invoice net amount arithmetic mismatch (${inv.invoiceNumber})`,
        `ইনভয়েসে সংরক্ষিত নিট মূল্য ${inv.netAmount} ৳, কিন্তু গণনাকৃত মূল্য ${calculatedNet} ৳।`,
        "CRITICAL",
        { invoiceNumber: inv.invoiceNumber, recordedNet: inv.netAmount, expectedNet: calculatedNet }
      );
    }

    // Rule 6: DQ-FIN-002 (Invoice paid amount vs receipts)
    const totalReceipts = inv.receipts
      .filter(r => r.paymentStatus === "SUCCESSFUL")
      .reduce((sum, r) => sum + r.amount, 0);
    const totalRefunds = inv.refunds.reduce((sum, ref) => sum + ref.amount, 0);
    const netPaid = totalReceipts - totalRefunds;

    if (Math.abs(inv.paidAmount - netPaid) > 0.01) {
      reportIssue(
        "DQ-FIN-002",
        "FINANCE_PAYMENT",
        "FeeInvoice",
        inv.id,
        `ইনভয়েসে পরিশোধিত অর্থের সাথে রশিদের অমিল (${inv.invoiceNumber})`,
        `Invoice paid amount does not match receipts (${inv.invoiceNumber})`,
        `ইনভয়েস অনুযায়ী পরিশোধিত ৳${inv.paidAmount}, কিন্তু সফল রশিদের যোগফল ৳${totalReceipts} (রিফান্ড ৳${totalRefunds})।`,
        "CRITICAL",
        { invoiceNumber: inv.invoiceNumber, recordedPaid: inv.paidAmount, receiptsTotal: totalReceipts, refundsTotal: totalRefunds }
      );
    }
  }

  // Rule 7: DQ-FIN-003 (CashFund Balance vs Transactions)
  const cashFunds = await prisma.cashFund.findMany({
    include: { transactions: true }
  });
  for (const cf of cashFunds) {
    let calculated = 0;
    for (const tx of cf.transactions) {
      if (tx.type === "INCOME") calculated += tx.amount;
      else if (tx.type === "EXPENSE") calculated -= tx.amount;
    }
    if (Math.abs(cf.currentBalance - calculated) > 0.01) {
      reportIssue(
        "DQ-FIN-003",
        "CASH_FUNDS",
        "CashFund",
        cf.id,
        `ফান্ড ব্যালেন্স ও লেনদেন ভাউচারের ব্যবধান (${cf.nameBn})`,
        `Cash fund balance discrepancy against transactions (${cf.code})`,
        `ফান্ডে সংরক্ষিত ব্যালেন্স ৳${cf.currentBalance}, কিন্তু ক্যাশ ট্রানজেকশন বইয়ের যোগফল ৳${calculated} (পার্থক্য ৳${cf.currentBalance - calculated})।`,
        "CRITICAL",
        { fundCode: cf.code, currentBalance: cf.currentBalance, calculatedLedger: calculated, difference: cf.currentBalance - calculated }
      );
    }
  }

  // Rule 8: DQ-DOC-001 (Revoked Certificate Status)
  const revokedCerts = await prisma.certificate.findMany({
    where: { isRevoked: true, status: { not: "REVOKED" } }
  });
  for (const rc of revokedCerts) {
    reportIssue(
      "DQ-DOC-001",
      "INSTITUTIONAL_DOCUMENTS",
      "Certificate",
      rc.id,
      `বাতিল সনদের স্ট্যাটাস অসামঞ্জস্যপূর্ণ (${rc.certificateNumber})`,
      `Revoked certificate status is not REVOKED (${rc.certificateNumber})`,
      `সনদটি বাতিল (isRevoked=true) হওয়া সত্ত্বেও স্ট্যাটাস হিসেবে '${rc.status}' রয়েছে।`,
      "HIGH",
      { certificateNumber: rc.certificateNumber, currentStatus: rc.status }
    );
  }

  // Rule 9: DQ-INV-001 (Negative stock)
  const negativeStock = await prisma.inventoryStockBalance.findMany({
    where: { currentBalance: { lt: 0 } },
    include: { item: true }
  });
  for (const ns of negativeStock) {
    reportIssue(
      "DQ-INV-001",
      "INVENTORY_LEDGER",
      "InventoryStockBalance",
      ns.id,
      `ঋণাত্মক স্টক ব্যালেন্স পাওয়া গেছে (${ns.item.nameBn})`,
      `Negative inventory stock balance found`,
      `আইটেম '${ns.item.nameBn}' এর বর্তমান স্টক ব্যালেন্স ${ns.currentBalance}, যা অবৈধ।`,
      "HIGH",
      { itemId: ns.itemId, itemName: ns.item.nameBn, balance: ns.currentBalance }
    );
  }

  // Save all issues
  const allIssues = Array.from(issuesMap.values());
  saveAllDataQualityIssues(allIssues);

  const openIssues = allIssues.filter(i => i.status === "OPEN" || i.status === "INVESTIGATING" || i.status === "ASSIGNED");
  const criticalCount = openIssues.filter(i => i.severity === "CRITICAL").length;
  const highCount = openIssues.filter(i => i.severity === "HIGH").length;

  let overallStatus: "HEALTHY" | "WARNING" | "ERROR" | "REVIEW_REQUIRED" = "HEALTHY";
  if (criticalCount > 0) overallStatus = "ERROR";
  else if (highCount > 0) overallStatus = "REVIEW_REQUIRED";
  else if (openIssues.length > 0) overallStatus = "WARNING";

  return {
    scanTimestamp: new Date().toISOString(),
    totalIssuesFound: allIssues.length,
    newIssuesCreated: newCount,
    existingIssuesUpdated: updatedCount,
    criticalIssues: criticalCount,
    highIssues: highCount,
    status: overallStatus
  };
}

// -------------------------------------------------------------
// 4. ISSUE LIFECYCLE MANAGEMENT
// -------------------------------------------------------------
export function updateIssueStatus(
  issueId: string,
  newStatus: DataQualityIssue["status"],
  actorName: string,
  notes?: string,
  assignedTo?: string,
  proposedCorrection?: string
): DataQualityIssue {
  const issues = getAllDataQualityIssues();
  const issue = issues.find(i => i.id === issueId);
  if (!issue) {
    throw new Error(`Data quality issue with ID '${issueId}' not found.`);
  }

  issue.status = newStatus;
  if (notes) issue.resolutionNotes = notes;
  if (assignedTo !== undefined) issue.assignedTo = assignedTo;
  if (proposedCorrection !== undefined) issue.proposedCorrection = proposedCorrection;

  if (newStatus === "RESOLVED" || newStatus === "REJECTED" || newStatus === "WAIVED") {
    issue.resolvedAt = new Date().toISOString();
    issue.resolvedBy = actorName;
  }

  saveAllDataQualityIssues(issues);
  return issue;
}
