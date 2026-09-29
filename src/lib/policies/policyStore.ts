/**
 * EHRJ MADRASHA ERP — PHASE 38
 * Institutional Knowledge, Policy & SOP Atomic Persistence Store
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  KnowledgeDocument,
  PolicyApprovalRecord,
  PolicyAcknowledgement,
  PolicyException,
  PolicyConflict,
  PolicyAuditEntry,
  GovernanceDashboardStats,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "institutional_knowledge");
const DOCS_FILE = path.join(DATA_DIR, "documents.json");
const APPROVALS_FILE = path.join(DATA_DIR, "approvals.json");
const ACKS_FILE = path.join(DATA_DIR, "acknowledgements.json");
const EXCEPTIONS_FILE = path.join(DATA_DIR, "exceptions.json");
const CONFLICTS_FILE = path.join(DATA_DIR, "conflicts.json");
const AUDIT_FILE = path.join(DATA_DIR, "audit_log.json");

function ensureDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function calculateChecksum(content: string): string {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

function safeAtomicWrite(filePath: string, data: any) {
  ensureDirectoryExists();
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tempPath, filePath);
}

// -------------------------------------------------------------
// SEED DATA: AUTHORITATIVE EHRJ POLICIES, SOPS & HANDBOOKS
// -------------------------------------------------------------

function generateSeedDocuments(): KnowledgeDocument[] {
  const now = "2026-09-29T12:00:00.000Z";
  
  // 1. Admission Policy v2.1 (Current Effective)
  const admPolicyContent = `# ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
## প্রাতিষ্ঠানিক শিক্ষার্থী ভর্তি নীতিমালা ২০২৬ (v2.1)

### ১. সাধারণ নীতিমালা ও উদ্দেশ্য
ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসায় নূরানী, নাজেরা, হিফজুল কুরআন ও কওমি কিতাব বিভাগে শিক্ষার্থী ভর্তির ক্ষেত্রে মেধা, চারিত্রিক ব্যাকগ্রাউন্ড এবং ধর্মীয় নিষ্ঠাকে প্রাধান্য দেওয়া হয়।

### ২. বয়স ও যোগ্যতার মাপকাঠি
* নূরানী শিশু বিভাগ: বয়স নূন্যতম ৫ বছর।
* হিফজুল কুরআন বিভাগ: বাংলা ও আরবি সাধারণ পাঠজ্ঞান সম্পন্ন শিক্ষার্থী।
* কিতাব বিভাগ: পূর্ববর্তী মারহালার বৈধ শিক্ষাগত সনদ ও চারিত্রিক প্রশংসাপত্র।

### ৩. লিল্লাহ বোডিং ও এতিম কোটা
অত্র মাদরাসায় মোট আসনের শতকরা ২৫ ভাগ এতিম, দুস্থ ও অসচ্ছল শিক্ষার্থীদের জন্য লিল্লাহ বোডিংয়ের মাধ্যমে সম্পূর্ণ বিনামূল্যে পড়ালেখা, থাকা ও খাওয়ার সুযোগ নিশ্চিত করা হয়।

### ৪. ভর্তি ফি ও আর্থিক ছাড়
ভর্তি ফরম ফি নির্ধারণ করা হয়েছে ২০০ টাকা। কোনো অসচ্ছল পরিবারের একাধিক সন্তান ভর্তি হলে দ্বিতীয় সন্তানের ক্ষেত্রে ভর্তি ফি ৫০% ছাড়ের আবেদন গ্রহণযোগ্য হবে।`;

  const admDoc: KnowledgeDocument = {
    id: "EHRJ-POL-2026-ADM001",
    documentCode: "EHRJ-POL-2026-ADM001",
    titleBn: "প্রাতিষ্ঠানিক শিক্ষার্থী ভর্তি নীতিমালা ২০২৬",
    titleEn: "Institutional Student Admission Policy 2026",
    titleAr: "سياسة قبول الطلاب لعام ٢٠٢٦",
    documentType: "POLICY",
    category: "ADMISSION_POLICY",
    ownerDepartment: "ACADEMIC",
    description: "নূরানী, হিফজ ও কিতাব বিভাগে নতুন শিক্ষাবর্ষে শিক্ষার্থী ভর্তির শর্তাবলী, কোটা ও নিয়মাবলী।",
    tags: ["ভর্তি", "নীতিমালা", "কোটা", "লিল্লাহ বোডিং", "ফি"],
    status: "EFFECTIVE",
    currentVersion: "v2.1",
    approvalDate: "2026-01-05",
    publicationDate: "2026-01-06",
    effectiveFrom: "2026-01-10",
    effectiveUntil: "2026-12-31",
    reviewDate: "2026-11-15",
    confidentiality: "PUBLIC",
    targetAudiences: ["PUBLIC", "GUARDIAN", "ADMIN", "TEACHER"],
    requiresApproval: true,
    requiresAcknowledgement: false,
    contentText: admPolicyContent,
    contentMarkdown: admPolicyContent,
    checksum: calculateChecksum(admPolicyContent),
    isLegalHoldActive: false,
    createdBy: "admin-system",
    createdAt: "2026-01-05T08:00:00.000Z",
    updatedBy: "principal-office",
    updatedAt: now,
    relationships: [
      {
        targetDocId: "EHRJ-POL-2025-ADM000",
        targetDocCode: "EHRJ-POL-2025-ADM000",
        relationshipType: "SUPERSEDES",
        notes: "২০২৫ সালের পূর্ববর্তী ভর্তি নীতিমালার স্থলাভিষিক্ত করা হয়েছে।",
      },
    ],
    relatedSystemModules: ["Phase 34 Admission Engine", "Phase 6 Finance"],
    versions: [
      {
        version: "v2.0",
        versionNotes: "২০২৬ শিক্ষাবর্ষের প্রাথমিক খসড়া ও অনুমোদন।",
        isMajor: true,
        status: "SUPERSEDED",
        contentText: admPolicyContent,
        contentMarkdown: admPolicyContent,
        checksum: calculateChecksum(admPolicyContent),
        createdBy: "admin-system",
        createdAt: "2026-01-02T10:00:00.000Z",
        approvedBy: "principal-01",
        approvedAt: "2026-01-04T12:00:00.000Z",
        approvalNotes: "প্রিন্সিপাল কর্তৃক অনুমোদিত।",
        effectiveFrom: "2026-01-05",
        effectiveUntil: "2026-01-09",
      },
      {
        version: "v2.1",
        versionNotes: "একাধিক সন্তানের ক্ষেত্রে ২৫% থেকে ৫০% ফি ছাড় সংশোধনী।",
        isMajor: false,
        status: "EFFECTIVE",
        contentText: admPolicyContent,
        contentMarkdown: admPolicyContent,
        checksum: calculateChecksum(admPolicyContent),
        createdBy: "admin-system",
        createdAt: "2026-01-05T08:00:00.000Z",
        approvedBy: "principal-01",
        approvedAt: "2026-01-05T16:00:00.000Z",
        approvalNotes: "মাদ্রাসা গভর্নিং বডির সিদ্ধান্ত অনুযায়ী সংশোধিত ও অনুমোদিত।",
        effectiveFrom: "2026-01-10",
        effectiveUntil: "2026-12-31",
      },
    ],
  };

  // 2. Tahfeez Quran Sabaq & Manzil Daily Routine SOP v1.2
  const thfSopContent = `# তাহফীজুল কুরআন দৈনিক ছবক, আমপারা ও মন্জিল রুটিন এসওপি (SOP)
ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার হিফজ বিভাগের দৈনন্দিন পাঠদান, ছবক প্রদান ও মন্জিল তদারকির স্ট্যান্ডার্ড অপারেটিং প্রসিডিউর।`;

  const thfSteps = [
    {
      stepNumber: 1,
      titleBn: "ফজর পরবর্তী নতুন ছবক (Sabaq) প্রদান",
      titleEn: "Post-Fajr New Lesson Submission",
      description: "ফজরের নামাজের পর সকাল ৬:০০ থেকে ৮:০০ ঘটিকার মধ্যে ছাত্র সরাসরি উস্তাদের সামনে বসে নতুন ১ পৃষ্ঠা বা নির্ধারিত পরিমাণ ছবক শুনাবে।",
      responsibleRole: "TEACHER",
      decisionPoint: "যদি ৩টির অধিক ভুল বা আটকে যাওয়ার ঘটনা ঘটে, তবে নতুন ছবক বন্ধ রেখে পুনরায় মস্ক করতে হবে।",
      completionCriteria: "উস্তাদ কর্তৃক নির্ভুল শ্রবণ ও দৈনিক রেজিস্টারে ছবক পৃষ্ঠা নম্বর লিপিবদ্ধকরণ।",
    },
    {
      stepNumber: 2,
      titleBn: "সকাল ১০:০০ ঘটিকা: সাত ছবক (Sabaq Para) পুনরাবৃত্তি",
      titleEn: "Mid-Morning Sabaq Para Review",
      description: "সর্বশেষ পঠিত বিগত ৫-১০ পৃষ্ঠার পুঙ্খানুপুঙ্খ পুনরাবৃত্তি।",
      responsibleRole: "TEACHER",
      decisionPoint: "যদি কোনো পৃষ্ঠায় ত্রুটি থাকে, জোড়া ছাত্রদের (Peer Learning) সাথে পুনরায় পড়ার নির্দেশ দেওয়া।",
      completionCriteria: "সহকারী শিক্ষক বা প্রধান হাফেজ সাহেবের সামনে সম্পূর্ণ শুনা সম্পন্ন হওয়া।",
    },
    {
      stepNumber: 3,
      titleBn: "আসর পরবর্তী মন্জিল (Dور) ও খতমে কুরআন যাচাই",
      titleEn: "Post-Asr Manzil Recitation",
      description: "হিফজ সম্পন্ন করা অংশের মধ্যে দৈনিক নূন্যতম আধা পারা থেকে ১ পারা মন্জিল একটানা তিলাওয়াত।",
      responsibleRole: "TEACHER",
      escalationRole: "HEAD_OF_TAHFEEZ",
      completionCriteria: "দৈনিক হাজিরা ও মন্জিল ট্র্যাকারে এন্ট্রি সম্পন্ন।",
    },
  ];

  const thfDoc: KnowledgeDocument = {
    id: "EHRJ-SOP-2026-THF001",
    documentCode: "EHRJ-SOP-2026-THF001",
    titleBn: "তাহফীজুল কুরআন দৈনিক ছবক ও মন্জিল এসওপি",
    titleEn: "Daily Tahfeez Sabaq & Manzil Operational SOP",
    documentType: "SOP",
    category: "SOP",
    ownerDepartment: "ACADEMIC",
    description: "হিফজ বিভাগে পাঠদান, ছবক গ্রহণ, মস্ক এবং সান্ধ্যকালীন মন্জিল তদারকির সুনির্দিষ্ট কার্যপদ্ধতি।",
    tags: ["হিফজ", "ছবক", "মন্জিল", "এসওপি", "তাহফিজ"],
    status: "EFFECTIVE",
    currentVersion: "v1.2",
    approvalDate: "2026-01-12",
    publicationDate: "2026-01-13",
    effectiveFrom: "2026-01-15",
    effectiveUntil: "2026-12-31",
    reviewDate: "2026-08-01",
    confidentiality: "INTERNAL",
    targetAudiences: ["TEACHER", "PRINCIPAL", "ADMIN"],
    requiresApproval: true,
    requiresAcknowledgement: true,
    mandatoryAckRoles: ["TEACHER"],
    contentText: thfSopContent,
    contentMarkdown: thfSopContent,
    sopSteps: thfSteps,
    checksum: calculateChecksum(thfSopContent),
    isLegalHoldActive: false,
    createdBy: "admin-system",
    createdAt: "2026-01-10T08:00:00.000Z",
    updatedBy: "admin-system",
    updatedAt: now,
    relationships: [],
    relatedSystemModules: ["Phase 5 Academic Engine", "Phase 27 Workflow"],
    linkedWorkflowId: "WF-ACAD-TAHFEEZ-DAILY",
    versions: [
      {
        version: "v1.2",
        versionNotes: "হিফজ শিক্ষকদের মন্জিল এন্ট্রির ডিজিটাল ট্র্যাকিং সংযোজন।",
        isMajor: false,
        status: "EFFECTIVE",
        contentText: thfSopContent,
        contentMarkdown: thfSopContent,
        sopSteps: thfSteps,
        checksum: calculateChecksum(thfSopContent),
        createdBy: "admin-system",
        createdAt: "2026-01-12T10:00:00.000Z",
        approvedBy: "principal-01",
        approvedAt: "2026-01-12T15:00:00.000Z",
        approvalNotes: "প্রিন্সিপাল ও প্রধান ক্বারী সাহেব কর্তৃক পরীক্ষিত ও অনুমোদিত।",
        effectiveFrom: "2026-01-15",
        effectiveUntil: "2026-12-31",
      },
    ],
  };

  // 3. Lilah Boarding Grocery & Meal SOP v1.0
  const llbSopContent = `# লিল্লাহ বোডিং খাদ্যদ্রব্য ক্রয় ও পুষ্টি ব্যবস্থাপনা এসওপি
এতিম ও আবাসিক ছাত্রদের খাদ্য নিরাপত্তা, স্বাস্থ্যবিধি এবং বাজার খরচের স্বচ্ছতা নিশ্চিতকরণ পদ্ধতি।`;

  const llbSteps = [
    {
      stepNumber: 1,
      titleBn: "সাপ্তাহিক বাজার চাহিদা ও তালিকা প্রণয়ন",
      titleEn: "Weekly Grocery Requisition",
      description: "প্রধান বাবুর্চি ও হোস্টেল সুপার যৌথভাবে চাল, ডাল, তেল, সবজি ও আমিষের সাপ্তাহিক তালিকা প্রস্তুত করবেন।",
      responsibleRole: "HOSTEL_SUPER",
      completionCriteria: "দস্তখতকৃত ইনভেন্টরি রিকুইজিশন স্লিপ তৈরি।",
    },
    {
      stepNumber: 2,
      titleBn: "হিসাব বিভাগ ও প্রিন্সিপাল মহোদয়ের বাজেট অনুমোদন",
      titleEn: "Budget Verification & Approval",
      description: "বাজার কমিটির বরাদ্দকৃত ফান্ড ও বর্তমান বাজার দরের সাথে রিকুইজিশন যাচাইকরণ।",
      responsibleRole: "ACCOUNTS_OFFICER",
      decisionPoint: "যদি বরাদ্দ অতিক্রম করে, তবে বিকল্প আমিষ ও সবজি সমন্বয় করতে হবে।",
      completionCriteria: "ক্যাশ ভাউচার অনুমোদন।",
    },
    {
      stepNumber: 3,
      titleBn: "ক্রয়কৃত পণ্যের ওজন ও গুণগত মান নিশ্চিতকরণ",
      titleEn: "Goods Receiving & Quality Inspection",
      description: "মাদ্রাসা স্টোরে মালপত্র পৌঁছানোর পর ওজনে পরীক্ষা এবং খাবারের হালাল ও স্বাস্থ্যসম্মত মান যাচাই।",
      responsibleRole: "INVENTORY_OFFICER",
      completionCriteria: "ইনভেন্টরি স্টকে এন্ট্রি সম্পন্ন ও চালান সংরক্ষণ।",
    },
  ];

  const llbDoc: KnowledgeDocument = {
    id: "EHRJ-SOP-2026-LLB001",
    documentCode: "EHRJ-SOP-2026-LLB001",
    titleBn: "লিল্লাহ বোডিং খাদ্যদ্রব্য ক্রয় ও রন্ধন এসওপি",
    titleEn: "Lilah Boarding Grocery & Nutrition Operational SOP",
    documentType: "SOP",
    category: "SOP",
    ownerDepartment: "RESIDENTIAL",
    description: "আবাসিক এতিম ছাত্রদের খাদ্য তালিকা, বাজার ক্রয়, পুষ্টিমান ও হিসাব সংরক্ষণের স্ট্যান্ডার্ড কার্যপদ্ধতি।",
    tags: ["লিল্লাহ বোডিং", "হোস্টেল", "খাবার", "বাজার", "এসওপি"],
    status: "EFFECTIVE",
    currentVersion: "v1.0",
    approvalDate: "2026-01-20",
    publicationDate: "2026-01-21",
    effectiveFrom: "2026-01-25",
    effectiveUntil: "2026-12-31",
    reviewDate: "2026-09-15",
    confidentiality: "INTERNAL",
    targetAudiences: ["ADMIN", "PRINCIPAL", "STAFF"],
    requiresApproval: true,
    requiresAcknowledgement: false,
    contentText: llbSopContent,
    contentMarkdown: llbSopContent,
    sopSteps: llbSteps,
    checksum: calculateChecksum(llbSopContent),
    isLegalHoldActive: false,
    createdBy: "admin-system",
    createdAt: "2026-01-18T10:00:00.000Z",
    updatedBy: "admin-system",
    updatedAt: now,
    relationships: [],
    relatedSystemModules: ["Phase 6 Finance", "Phase 10 Hostel", "Phase 11 Inventory"],
    linkedWorkflowId: "WF-HOSTEL-GROCERY-PURCHASE",
    versions: [
      {
        version: "v1.0",
        versionNotes: "লিল্লাহ বোডিং ক্রয় প্রক্রিয়ার প্রথম প্রাতিষ্ঠানিক স্ট্যান্ডার্ড ভার্সন।",
        isMajor: true,
        status: "EFFECTIVE",
        contentText: llbSopContent,
        contentMarkdown: llbSopContent,
        sopSteps: llbSteps,
        checksum: calculateChecksum(llbSopContent),
        createdBy: "admin-system",
        createdAt: "2026-01-18T10:00:00.000Z",
        approvedBy: "principal-01",
        approvedAt: "2026-01-20T14:00:00.000Z",
        approvalNotes: "প্রিন্সিপাল মহোদয় কর্তৃক অনুমোদিত।",
        effectiveFrom: "2026-01-25",
        effectiveUntil: "2026-12-31",
      },
    ],
  };

  // 4. Student Data Protection & Privacy Policy v2.0
  const secPolicyContent = `# ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
## শিক্ষার্থী তথ্য সুরক্ষা, গোপনীয়তা ও আইটি নিরাপত্তা নীতিমালা (v2.0)

### ১. গোপনীয়তার পরিধি
অত্র প্রতিষ্ঠানের সকল শিক্ষার্থী, অভিভাবক এবং উস্তাদগণের ব্যক্তিগত তথ্য (জাতীয় পরিচয়পত্র, জন্ম নিবন্ধন, মোবাইল নম্বর, পরীক্ষার নম্বরপত্র, পারিবারিক তথ্য) কঠোর নিরাপত্তার সাথে ডাটাবেজে এনক্রিপ্ট করে সংরক্ষণ করা হয়।

### ২. সিসিটিভি ক্যামেরা ও নিরাপত্তা নজরদারি
মাদরাসা প্রাঙ্গণ, প্রবেশপথ, হলওয়ে ও অফিস কক্ষে সার্বক্ষণিক সিসিটিভি মনিটরিং ব্যবস্থা কার্যকর রয়েছে। কোনো বহিরাগত বা অভিভাবককে ভিডিও ফুটেজ সরাসরি প্রদান করা সম্পূর্ণ নিষিদ্ধ; বিশেষ প্রয়োজনে প্রিন্সিপাল মহোদয়ের লিখিত অনুমোদন প্রয়োজন।

### ৩. পাসওয়ার্ড ও একাউন্ট সততা
শিক্ষক ও কর্মকর্তা যাদের অ্যাডমিন বা টিচার পোর্টালে প্রবেশাধিকার রয়েছে, তারা কোনো অবস্থাতেই পাসওয়ার্ড শেয়ার করবেন না। দায়িত্ব অবহেলার কারণে তথ্য ফাঁস হলে প্রাতিষ্ঠানিক শাস্তিমূলক ব্যবস্থা গ্রহণ করা হবে।`;

  const secDoc: KnowledgeDocument = {
    id: "EHRJ-POL-2026-SEC001",
    documentCode: "EHRJ-POL-2026-SEC001",
    titleBn: "শিক্ষার্থী তথ্য সুরক্ষা ও প্রাতিষ্ঠানিক আইটি নিরাপত্তা নীতিমালা",
    titleEn: "Student Data Protection & Institutional IT Security Policy",
    documentType: "POLICY",
    category: "SECURITY_POLICY",
    ownerDepartment: "IT",
    description: "ডিজিটাল ক্যাম্পাস ও ডেটাবেজে রক্ষিত সকল ব্যক্তিগত তথ্যের গোপনীয়তা এবং আইটি নিরাপত্তা গাইডলাইন।",
    tags: ["নিরাপত্তা", "গোপনীয়তা", "আইটি", "তথ্য সুরক্ষা", "সিসিটিভি"],
    status: "EFFECTIVE",
    currentVersion: "v2.0",
    approvalDate: "2026-02-01",
    publicationDate: "2026-02-02",
    effectiveFrom: "2026-02-05",
    effectiveUntil: "2027-02-04",
    reviewDate: "2026-12-01",
    confidentiality: "INTERNAL",
    targetAudiences: ["TEACHER", "STAFF", "ADMIN", "PRINCIPAL"],
    requiresApproval: true,
    requiresAcknowledgement: true,
    mandatoryAckRoles: ["TEACHER", "STAFF", "ADMIN"],
    contentText: secPolicyContent,
    contentMarkdown: secPolicyContent,
    checksum: calculateChecksum(secPolicyContent),
    isLegalHoldActive: false,
    createdBy: "it-head",
    createdAt: "2026-01-25T11:00:00.000Z",
    updatedBy: "admin-system",
    updatedAt: now,
    relationships: [],
    relatedSystemModules: ["Phase 17/24 Security & Privacy", "Phase 1 Auth"],
    versions: [
      {
        version: "v2.0",
        versionNotes: "ক্লাউড ব্যাকআপ ও ডিজিটাল পোর্টালে রোল-বেসড অ্যাক্সেস কন্ট্রোল ধারা সংযোজন।",
        isMajor: true,
        status: "EFFECTIVE",
        contentText: secPolicyContent,
        contentMarkdown: secPolicyContent,
        checksum: calculateChecksum(secPolicyContent),
        createdBy: "it-head",
        createdAt: "2026-01-25T11:00:00.000Z",
        approvedBy: "principal-01",
        approvedAt: "2026-02-01T10:00:00.000Z",
        approvalNotes: "গভর্নিং বডির সভায় সর্বসম্মতিক্রমে অনুমোদিত।",
        effectiveFrom: "2026-02-05",
        effectiveUntil: "2027-02-04",
      },
    ],
  };

  // 5. Comprehensive Guardian & Student Handbook 2026 v1.0
  const hbkContent = `# ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
## অভিভাবক ও শিক্ষার্থী নির্দেশিকা ও হ্যান্ডবুক ২০২৬ (v1.0)`;

  const hbkSections = [
    {
      sectionNumber: "১.০",
      titleBn: "পরিচিতি ও মাদরাসার মূল দর্শন",
      titleEn: "Introduction & Institutional Philosophy",
      contentMarkdown: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা ইলমে ওহী এবং নৈতিক শিক্ষার এক অনন্য মিলনমেলা। কুরআন ও সুন্নাহর আলোকে যোগ্য আলেম ও হাফেজে কুরআন গড়ে তোলাই আমাদের লক্ষ্য।",
      order: 1,
    },
    {
      sectionNumber: "২.০",
      titleBn: "শৃঙ্খলা, পোশাক-পরিচ্ছদ ও আচরণবিধি",
      titleEn: "Discipline, Dress Code & Conduct",
      contentMarkdown: "সকল শিক্ষার্থীকে মার্জিত ইসলামী লেবাস (সাদা জুব্বা/পায়জামা ও টুপি) পরিধান করতে হবে। ক্যাম্পাসে কোনো প্রকার অ্যান্ড্রয়েড স্মার্টফোন বা ইলেকট্রনিক গেজেট রাখা সম্পূর্ণ নিষিদ্ধ।",
      order: 2,
    },
    {
      sectionNumber: "৩.০",
      titleBn: "ছুটি ও অভিভাবক সাক্ষাতের সময়সূচি",
      titleEn: "Leave Protocol & Guardian Visiting Hours",
      contentMarkdown: "আবাসিক শিক্ষার্থীদের ক্ষেত্রে প্রতি শুক্রবার জুমার পর থেকে মাগরিব পর্যন্ত অভিভাবক সাক্ষাতের নির্ধারিত সময়। বিশেষ প্রয়োজন ব্যতিরেকে সাধারণ সময়ে প্রবেশ নিষিদ্ধ।",
      order: 3,
    },
    {
      sectionNumber: "৪.০",
      titleBn: "পরীক্ষা ও ফলাফল মূল্যায়ন পদ্ধতি",
      titleEn: "Examination & Evaluation Framework",
      contentMarkdown: "শিক্ষাবর্ষে মোট ৩টি সাময়িক পরীক্ষা (প্রথম, দ্বিতীয় ও বার্ষিক) অনুষ্ঠিত হবে। প্রতিটি পরীক্ষায় নূন্যতম পাস নম্বর ৪০% এবং হিফজ বিভাগে শতভাগ ইয়াদ থাকতে হবে।",
      order: 4,
    },
    {
      sectionNumber: "৫.০",
      titleBn: "লিল্লাহ বোডিং সুবিধা ও শর্তাবলী",
      titleEn: "Lilah Boarding Rules & Privileges",
      contentMarkdown: "লিল্লাহ বোডিংয়ে অবস্থানরত শিক্ষার্থীদের সার্বক্ষণিক অধ্যয়নশীল ও দায়িত্বশীল আচরণ করতে হবে। কর্তৃপক্ষের অনুমতি ব্যতীত ক্যাম্পাসের বাইরে যাওয়া নিষেধ।",
      order: 5,
    },
    {
      sectionNumber: "৬.০",
      titleBn: "অভিযোগ ও পরামর্শ প্রতিকার সেল",
      titleEn: "Grievance Redressal & Support",
      contentMarkdown: "অভিভাবকগণ যে কোনো অভিযোগ বা পরামর্শ মাদরাসার অনলাইন হেল্পডেস্ক অথবা সরাসরি প্রিন্সিপাল মহোদয়ের দপ্তরে লিখিত আকারে পেশ করতে পারেন।",
      order: 6,
    },
  ];

  const hbkDoc: KnowledgeDocument = {
    id: "EHRJ-HBK-2026-GUA001",
    documentCode: "EHRJ-HBK-2026-GUA001",
    titleBn: "অভিভাবক ও শিক্ষার্থী নির্দেশিকা ও হ্যান্ডবুক ২০২৬",
    titleEn: "Guardian & Student Comprehensive Handbook 2026",
    documentType: "HANDBOOK",
    category: "HANDBOOK",
    ownerDepartment: "ADMINISTRATION",
    description: "শিক্ষার্থী আচরণবিধি, শৃঙ্খলা, পোশাক, ভিজিটিং আওয়ার ও অধিকার সম্বলিত পূর্ণাঙ্গ প্রাতিষ্ঠানিক হ্যান্ডবুক।",
    tags: ["হ্যান্ডবুক", "অভিভাবক", "শিক্ষার্থী", "নিয়মকানুন", "শৃঙ্খলা"],
    status: "EFFECTIVE",
    currentVersion: "v1.0",
    approvalDate: "2026-01-08",
    publicationDate: "2026-01-09",
    effectiveFrom: "2026-01-10",
    effectiveUntil: "2026-12-31",
    reviewDate: "2026-11-20",
    confidentiality: "PUBLIC",
    targetAudiences: ["PUBLIC", "GUARDIAN", "TEACHER", "ADMIN"],
    requiresApproval: true,
    requiresAcknowledgement: false,
    contentText: hbkContent,
    contentMarkdown: hbkContent,
    handbookSections: hbkSections,
    checksum: calculateChecksum(hbkContent),
    isLegalHoldActive: false,
    createdBy: "admin-system",
    createdAt: "2026-01-07T08:00:00.000Z",
    updatedBy: "admin-system",
    updatedAt: now,
    relationships: [],
    relatedSystemModules: ["Phase 31 CMS", "Phase 34 Admission"],
    versions: [
      {
        version: "v1.0",
        versionNotes: "২০২৬ শিক্ষাবর্ষের পূর্ণাঙ্গ অভিভাবক হ্যান্ডবুক প্রকাশ।",
        isMajor: true,
        status: "EFFECTIVE",
        contentText: hbkContent,
        contentMarkdown: hbkContent,
        handbookSections: hbkSections,
        checksum: calculateChecksum(hbkContent),
        createdBy: "admin-system",
        createdAt: "2026-01-07T08:00:00.000Z",
        approvedBy: "principal-01",
        approvedAt: "2026-01-08T11:00:00.000Z",
        approvalNotes: "প্রিন্সিপাল কর্তৃক অনুমোদিত ও মুদ্রিত।",
        effectiveFrom: "2026-01-10",
        effectiveUntil: "2026-12-31",
      },
    ],
  };

  // 6. Teacher Professional Conduct, Ethics & Leave Policy v1.1
  const tchContent = `# ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
## শিক্ষক ও কর্মচারী আচরণবিধি এবং ছুটি ব্যবস্থাপনা নীতিমালা (v1.1)

### ১. পেশাগত নৈতিকতা ও শিক্ষক মর্যাদা
মাদরাসার সকল উস্তাদ শিক্ষার্থী ও সমাজের আদর্শ। ক্লাস চলাকালীন কিংবা ক্যাম্পাসে অবস্থানকালে সর্বোত্তম আচরণ, শালীন ভাষা ও স্নেহের মাধ্যমে শিক্ষাদান নিশ্চিত করতে হবে।

### ২. হাজিরা ও ক্লাস দায়িত্ব
সকাল ৮:০০ ঘটিকার পূর্বে বায়োমেট্রিক বা ডিজিটাল হাজিরা সম্পন্ন করতে হবে। কোনো কারণে দেরিতে উপস্থিত হলে তা রেজিস্টারে উপযুক্ত কারণসহ লিপিবদ্ধ করতে হবে।

### ৩. ছুটি নেওয়ার নিয়মাবলী
* নৈমিত্তিক ছুটি (Casual Leave): বছরে সর্বোচ্চ ১২ দিন। পূর্বাহ্নে লিখিত আবেদন ছাড়া কোনো ছুটি কার্যকর হবে না।
* অসুস্থতাজনিত ছুটি: ৩ দিনের অধিক হলে চিকিৎসকের ব্যবস্থাপত্র ও সুস্থতার প্রত্যয়ন জমা দেওয়া বাধ্যতামূলক।`;

  const tchDoc: KnowledgeDocument = {
    id: "EHRJ-POL-2026-TCH001",
    documentCode: "EHRJ-POL-2026-TCH001",
    titleBn: "শিক্ষক ও কর্মকর্তা আচরণবিধি এবং ছুটি ব্যবস্থাপনা নীতিমালা",
    titleEn: "Teacher & Staff Code of Conduct and Leave Policy",
    documentType: "POLICY",
    category: "TEACHER_GUIDELINE",
    ownerDepartment: "HR",
    description: "শিক্ষক ও কর্মচারীদের প্রাতিষ্ঠানিক আচরণবিধি, দায়িত্ব ও ছুটি অনুমোদনের বিধান।",
    tags: ["শিক্ষক", "নীতিমালা", "ছুটি", "আচরণবিধি", "এইচআর"],
    status: "EFFECTIVE",
    currentVersion: "v1.1",
    approvalDate: "2026-01-15",
    publicationDate: "2026-01-16",
    effectiveFrom: "2026-01-20",
    effectiveUntil: "2026-12-31",
    reviewDate: "2026-10-10",
    confidentiality: "INTERNAL",
    targetAudiences: ["TEACHER", "ADMIN", "PRINCIPAL"],
    requiresApproval: true,
    requiresAcknowledgement: true,
    mandatoryAckRoles: ["TEACHER"],
    contentText: tchContent,
    contentMarkdown: tchContent,
    checksum: calculateChecksum(tchContent),
    isLegalHoldActive: false,
    createdBy: "hr-head",
    createdAt: "2026-01-12T09:00:00.000Z",
    updatedBy: "admin-system",
    updatedAt: now,
    relationships: [],
    relatedSystemModules: ["Phase 4 HR & Payroll", "Phase 27 Workflow"],
    versions: [
      {
        version: "v1.1",
        versionNotes: "অনলাইন পোর্টালের মাধ্যমে ছুটির দরখাস্ত জমাদান ধারা সংযোজন।",
        isMajor: false,
        status: "EFFECTIVE",
        contentText: tchContent,
        contentMarkdown: tchContent,
        checksum: calculateChecksum(tchContent),
        createdBy: "hr-head",
        createdAt: "2026-01-12T09:00:00.000Z",
        approvedBy: "principal-01",
        approvedAt: "2026-01-15T14:00:00.000Z",
        approvalNotes: "প্রিন্সিপাল কর্তৃক অনুমোদিত।",
        effectiveFrom: "2026-01-20",
        effectiveUntil: "2026-12-31",
      },
    ],
  };

  // 7. Tuition Fee Waiver & Zakat Fund Concession Policy v1.0 (UNDER_REVIEW)
  const finContent = `# ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
## যাকাত তহবিল ও বেতন মওকুফ নীতিমালা (খসড়া প্রস্তাবনা ২০২৬)

### ১. যাকাত তহবিলের উপযুক্ততা
শুধুমাত্র যাকাতের শারীয়াতসম্মত উপযুক্ত হকদার (দরিদ্র, মিসকিন ও অসচ্ছল শিক্ষার্থী) পরিবারের জন্য এই তহবিল ব্যবহার করা যাবে।

### ২. মওকুফের আবেদন যাচাই কমিটি
উপ-পরিচালক, হিসাব কর্মকর্তা ও স্থানীয় ওয়ার্ড সদস্যের সুপারিশ সাপেক্ষে আবেদনসমূহ প্রতিমাসের ১ম সপ্তাহে যাচাই করা হবে।`;

  const finDoc: KnowledgeDocument = {
    id: "EHRJ-POL-2026-FIN002",
    documentCode: "EHRJ-POL-2026-FIN002",
    titleBn: "যাকাত তহবিল বণ্টন ও বেতন মওকুফ নীতিমালা",
    titleEn: "Zakat Fund Allocation & Tuition Concession Policy",
    documentType: "POLICY",
    category: "FINANCE_POLICY",
    ownerDepartment: "FINANCE",
    description: "অসচ্ছল ও এতিম শিক্ষার্থীদের জন্য মাসিক বেতন মওকুফ ও যাকাত অনুদান প্রাপ্তির নির্দেশিকা।",
    tags: ["যাকাত", "ফি মওকুফ", "অর্থ", "অনুদান"],
    status: "UNDER_REVIEW",
    currentVersion: "v1.0",
    effectiveFrom: "2026-10-01",
    reviewDate: "2026-10-15",
    confidentiality: "INTERNAL",
    targetAudiences: ["ADMIN", "PRINCIPAL", "GUARDIAN"],
    requiresApproval: true,
    requiresAcknowledgement: false,
    contentText: finContent,
    contentMarkdown: finContent,
    checksum: calculateChecksum(finContent),
    isLegalHoldActive: false,
    createdBy: "accounts-head",
    createdAt: "2026-09-10T11:00:00.000Z",
    updatedBy: "accounts-head",
    updatedAt: now,
    relationships: [],
    relatedSystemModules: ["Phase 6 Finance", "Phase 20 Governance"],
    versions: [
      {
        version: "v1.0",
        versionNotes: "হিসাব বিভাগ কর্তৃক জমাকৃত প্রাথমিক প্রস্তাবনা।",
        isMajor: true,
        status: "UNDER_REVIEW",
        contentText: finContent,
        contentMarkdown: finContent,
        checksum: calculateChecksum(finContent),
        createdBy: "accounts-head",
        createdAt: "2026-09-10T11:00:00.000Z",
        effectiveFrom: "2026-10-01",
      },
    ],
  };

  // 8. Historical Admission Policy 2025 v1.0 (SUPERSEDED)
  const histAdmContent = `# ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
## প্রাতিষ্ঠানিক শিক্ষার্থী ভর্তি নীতিমালা ২০২৫ (v1.0 - ঐতিহাসিক আর্কাইভ)

### ১. সাধারণ নীতিমালা
২০২৫ শিক্ষাবর্ষের বিগত ভর্তি নীতিমালা। ২০২৬ শিক্ষাবর্ষে এটি v2.1 দ্বারা স্থলাভিষিক্ত হয়েছে।`;

  const histDoc: KnowledgeDocument = {
    id: "EHRJ-POL-2025-ADM000",
    documentCode: "EHRJ-POL-2025-ADM000",
    titleBn: "প্রাতিষ্ঠানিক শিক্ষার্থী ভর্তি নীতিমালা ২০২৫",
    titleEn: "Institutional Student Admission Policy 2025 (Archived)",
    documentType: "POLICY",
    category: "ADMISSION_POLICY",
    ownerDepartment: "ACADEMIC",
    description: "২০২৫ শিক্ষাবর্ষে কার্যকর ভর্তি নীতিমালা (বর্তমানে স্থলাভিষিক্ত)।",
    tags: ["ভর্তি", "২০২৫", "ঐতিহাসিক", "স্থলাভিষিক্ত"],
    status: "SUPERSEDED",
    currentVersion: "v1.0",
    approvalDate: "2025-01-02",
    publicationDate: "2025-01-03",
    effectiveFrom: "2025-01-05",
    effectiveUntil: "2025-12-31",
    reviewDate: "2025-11-01",
    confidentiality: "PUBLIC",
    targetAudiences: ["PUBLIC", "ADMIN"],
    requiresApproval: true,
    requiresAcknowledgement: false,
    contentText: histAdmContent,
    contentMarkdown: histAdmContent,
    checksum: calculateChecksum(histAdmContent),
    isLegalHoldActive: false,
    createdBy: "admin-system",
    createdAt: "2025-01-02T10:00:00.000Z",
    updatedBy: "admin-system",
    updatedAt: "2026-01-05T08:00:00.000Z",
    relationships: [
      {
        targetDocId: "EHRJ-POL-2026-ADM001",
        targetDocCode: "EHRJ-POL-2026-ADM001",
        relationshipType: "SUPERSEDED_BY",
        notes: "২০২৬ সালের নীতিমালা দ্বারা প্রতিস্থাপিত।",
      },
    ],
    relatedSystemModules: ["Phase 34 Admission Engine"],
    versions: [
      {
        version: "v1.0",
        versionNotes: "২০২৫ শিক্ষাবর্ষের অনুমোদিত মূল নীতিমালা।",
        isMajor: true,
        status: "SUPERSEDED",
        contentText: histAdmContent,
        contentMarkdown: histAdmContent,
        checksum: calculateChecksum(histAdmContent),
        createdBy: "admin-system",
        createdAt: "2025-01-02T10:00:00.000Z",
        approvedBy: "principal-01",
        approvedAt: "2025-01-02T14:00:00.000Z",
        effectiveFrom: "2025-01-05",
        effectiveUntil: "2025-12-31",
      },
    ],
  };

  return [admDoc, thfDoc, llbDoc, secDoc, hbkDoc, tchDoc, finDoc, histDoc];
}

// -------------------------------------------------------------
// READ / WRITE STORE OPERATIONS
// -------------------------------------------------------------

export function getAllDocuments(): KnowledgeDocument[] {
  ensureDirectoryExists();
  if (!fs.existsSync(DOCS_FILE)) {
    const seed = generateSeedDocuments();
    safeAtomicWrite(DOCS_FILE, seed);
    return seed;
  }
  try {
    const raw = fs.readFileSync(DOCS_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading documents store:", err);
    return [];
  }
}

export function saveAllDocuments(docs: KnowledgeDocument[]): void {
  safeAtomicWrite(DOCS_FILE, docs);
}

export function getDocumentById(idOrCode: string): KnowledgeDocument | undefined {
  const docs = getAllDocuments();
  return docs.find(
    (d) => d.id === idOrCode || d.documentCode.toLowerCase() === idOrCode.toLowerCase()
  );
}

export function saveDocument(doc: KnowledgeDocument): void {
  const docs = getAllDocuments();
  const idx = docs.findIndex((d) => d.id === doc.id);
  if (idx >= 0) {
    docs[idx] = { ...doc, updatedAt: new Date().toISOString() };
  } else {
    docs.unshift({ ...doc, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  saveAllDocuments(docs);
}

// -------------------------------------------------------------
// APPROVAL RECORDS
// -------------------------------------------------------------

export function getAllApprovals(): PolicyApprovalRecord[] {
  ensureDirectoryExists();
  if (!fs.existsSync(APPROVALS_FILE)) {
    const initialApprovals: PolicyApprovalRecord[] = [
      {
        id: "APR-2026-001",
        documentId: "EHRJ-POL-2026-ADM001",
        documentCode: "EHRJ-POL-2026-ADM001",
        version: "v2.1",
        reviewerId: "usr-principal-01",
        reviewerName: "মাওলানা আব্দুল করিম (প্রিন্সিপাল)",
        reviewerRole: "PRINCIPAL",
        decision: "APPROVED",
        notes: "ভর্তি কমিটির সভার সুপারিশ ও কোটা কাঠামো অনুমোদন করা হলো।",
        timestamp: "2026-01-05T16:00:00.000Z",
        auditRef: "AUD-APR-2026-001",
      },
      {
        id: "APR-2026-002",
        documentId: "EHRJ-SOP-2026-THF001",
        documentCode: "EHRJ-SOP-2026-THF001",
        version: "v1.2",
        reviewerId: "usr-principal-01",
        reviewerName: "মাওলানা আব্দুল করিম (প্রিন্সিপাল)",
        reviewerRole: "PRINCIPAL",
        decision: "APPROVED",
        notes: "হিফজ শিক্ষকদের ছবক ও মন্জিল রুটিন চমৎকারভাবে সংজ্ঞায়িত। অনুমোদিত।",
        timestamp: "2026-01-12T15:00:00.000Z",
        auditRef: "AUD-APR-2026-002",
      },
    ];
    safeAtomicWrite(APPROVALS_FILE, initialApprovals);
    return initialApprovals;
  }
  try {
    return JSON.parse(fs.readFileSync(APPROVALS_FILE, "utf8"));
  } catch (err) {
    return [];
  }
}

export function recordApproval(approval: PolicyApprovalRecord): void {
  const approvals = getAllApprovals();
  approvals.unshift(approval);
  safeAtomicWrite(APPROVALS_FILE, approvals);
}

// -------------------------------------------------------------
// ACKNOWLEDGEMENTS
// -------------------------------------------------------------

export function getAllAcknowledgements(): PolicyAcknowledgement[] {
  ensureDirectoryExists();
  if (!fs.existsSync(ACKS_FILE)) {
    const initialAcks: PolicyAcknowledgement[] = [
      {
        id: "EHRJ-ACK-2026-0001",
        documentId: "EHRJ-POL-2026-TCH001",
        documentCode: "EHRJ-POL-2026-TCH001",
        version: "v1.1",
        userId: "teacher-hafiz-01",
        userName: "হাফেজ মাওলানা জুবায়ের আহমেদ",
        userRole: "TEACHER",
        acknowledgedAt: "2026-01-22T09:30:00.000Z",
        deviceMetadata: { userAgent: "Mozilla/5.0 PortalApp", ipAddress: "192.168.1.45" },
      },
      {
        id: "EHRJ-ACK-2026-0002",
        documentId: "EHRJ-POL-2026-SEC001",
        documentCode: "EHRJ-POL-2026-SEC001",
        version: "v2.0",
        userId: "teacher-hafiz-01",
        userName: "হাফেজ মাওলানা জুবায়ের আহমেদ",
        userRole: "TEACHER",
        acknowledgedAt: "2026-02-06T14:15:00.000Z",
        deviceMetadata: { userAgent: "Mozilla/5.0 PortalApp", ipAddress: "192.168.1.45" },
      },
    ];
    safeAtomicWrite(ACKS_FILE, initialAcks);
    return initialAcks;
  }
  try {
    return JSON.parse(fs.readFileSync(ACKS_FILE, "utf8"));
  } catch (err) {
    return [];
  }
}

export function recordAcknowledgement(ack: PolicyAcknowledgement): void {
  const acks = getAllAcknowledgements();
  // Ensure idempotent per (documentId, version, userId)
  const existingIdx = acks.findIndex(
    (a) => a.documentId === ack.documentId && a.version === ack.version && a.userId === ack.userId
  );
  if (existingIdx >= 0) {
    acks[existingIdx] = ack;
  } else {
    acks.unshift(ack);
  }
  safeAtomicWrite(ACKS_FILE, acks);
}

// -------------------------------------------------------------
// POLICY EXCEPTIONS
// -------------------------------------------------------------

export function getAllExceptions(): PolicyException[] {
  ensureDirectoryExists();
  if (!fs.existsSync(EXCEPTIONS_FILE)) {
    const initialExceptions: PolicyException[] = [
      {
        id: "EHRJ-EXC-2026-0001",
        documentId: "EHRJ-POL-2026-ADM001",
        documentCode: "EHRJ-POL-2026-ADM001",
        version: "v2.1",
        subject: "বয়স শিথিলকরণ অনুমোদন (ছাত্র আইডি: STD-2026-089)",
        reason: "বিশেষ মেধা ও কুরআন হিফজের প্রাথমিক দক্ষতার কারণে ৪ বছর ১০ মাস বয়সে ভর্তির অনুমতি।",
        approvedBy: "মাওলানা আব্দুল করিম (প্রিন্সিপাল)",
        startDate: "2026-01-15",
        endDate: "2026-12-31",
        scope: "ছাত্র আইডি STD-2026-089 এর প্রাথমিক মূল্যায়ন",
        conditions: "ত্রৈমাসিক পরীক্ষায় প্রথম ১০ জনের মধ্যে অবস্থান নিশ্চিত করতে হবে।",
        status: "ACTIVE",
        auditRef: "AUD-EXC-2026-001",
        createdAt: "2026-01-15T10:00:00.000Z",
        updatedAt: "2026-01-15T10:00:00.000Z",
      },
    ];
    safeAtomicWrite(EXCEPTIONS_FILE, initialExceptions);
    return initialExceptions;
  }
  try {
    return JSON.parse(fs.readFileSync(EXCEPTIONS_FILE, "utf8"));
  } catch (err) {
    return [];
  }
}

export function recordException(exc: PolicyException): void {
  const exceptions = getAllExceptions();
  const idx = exceptions.findIndex((e) => e.id === exc.id);
  if (idx >= 0) {
    exceptions[idx] = exc;
  } else {
    exceptions.unshift(exc);
  }
  safeAtomicWrite(EXCEPTIONS_FILE, exceptions);
}

// -------------------------------------------------------------
// POLICY CONFLICTS
// -------------------------------------------------------------

export function getAllConflicts(): PolicyConflict[] {
  ensureDirectoryExists();
  if (!fs.existsSync(CONFLICTS_FILE)) {
    safeAtomicWrite(CONFLICTS_FILE, []);
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(CONFLICTS_FILE, "utf8"));
  } catch (err) {
    return [];
  }
}

export function saveConflicts(conflicts: PolicyConflict[]): void {
  safeAtomicWrite(CONFLICTS_FILE, conflicts);
}

// -------------------------------------------------------------
// AUDIT LOG
// -------------------------------------------------------------

export function getAllAuditLogs(): PolicyAuditEntry[] {
  ensureDirectoryExists();
  if (!fs.existsSync(AUDIT_FILE)) {
    const initialLogs: PolicyAuditEntry[] = [
      {
        id: "AUD-INIT-001",
        timestamp: "2026-01-10T12:00:00.000Z",
        documentId: "EHRJ-POL-2026-ADM001",
        documentCode: "EHRJ-POL-2026-ADM001",
        version: "v2.1",
        action: "MARK_EFFECTIVE",
        actorId: "admin-01",
        actorName: "এডমিন অফিস",
        actorRole: "ADMIN",
        notes: "২০২৬ ভর্তি নীতিমালা কার্যকর ঘোষণা করা হয়েছে।",
      },
    ];
    safeAtomicWrite(AUDIT_FILE, initialLogs);
    return initialLogs;
  }
  try {
    return JSON.parse(fs.readFileSync(AUDIT_FILE, "utf8"));
  } catch (err) {
    return [];
  }
}

export function recordAuditLog(entry: Omit<PolicyAuditEntry, "id" | "timestamp">): PolicyAuditEntry {
  const logs = getAllAuditLogs();
  const newEntry: PolicyAuditEntry = {
    ...entry,
    id: `AUD-GOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
  };
  logs.unshift(newEntry);
  safeAtomicWrite(AUDIT_FILE, logs);
  return newEntry;
}

// -------------------------------------------------------------
// DASHBOARD STATS HELPER
// -------------------------------------------------------------

export function getGovernanceStats(): GovernanceDashboardStats {
  const docs = getAllDocuments();
  const acks = getAllAcknowledgements();
  const conflicts = getAllConflicts();
  const exceptions = getAllExceptions();

  const today = new Date().toISOString().split("T")[0];
  const soonDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  let reviewOverdueCount = 0;
  let reviewDueSoonCount = 0;
  let effectiveDocuments = 0;
  let draftDocuments = 0;
  let underReviewDocuments = 0;
  let approvedDocuments = 0;
  let legalHoldsCount = 0;
  const categoryDistribution: Record<string, number> = {};

  for (const doc of docs) {
    if (doc.status === "EFFECTIVE") effectiveDocuments++;
    else if (doc.status === "DRAFT") draftDocuments++;
    else if (doc.status === "UNDER_REVIEW") underReviewDocuments++;
    else if (doc.status === "APPROVED") approvedDocuments++;

    if (doc.isLegalHoldActive) legalHoldsCount++;

    if (doc.status === "EFFECTIVE" && doc.reviewDate) {
      if (doc.reviewDate < today) {
        reviewOverdueCount++;
      } else if (doc.reviewDate <= soonDate) {
        reviewDueSoonCount++;
      }
    }

    categoryDistribution[doc.category] = (categoryDistribution[doc.category] || 0) + 1;
  }

  // Mandatory ack documents count
  const mandatoryAckDocs = docs.filter((d) => d.status === "EFFECTIVE" && d.requiresAcknowledgement);
  // Simple heuristic for demo: e.g. 5 teachers targeted per policy
  const targetedAcksTotal = mandatoryAckDocs.length * 5;
  const acknowledgementsPendingCount = Math.max(0, targetedAcksTotal - acks.length);

  return {
    totalDocuments: docs.length,
    effectiveDocuments,
    draftDocuments,
    underReviewDocuments,
    approvedDocuments,
    reviewOverdueCount,
    reviewDueSoonCount,
    acknowledgementsPendingCount,
    totalAcknowledgementsRecorded: acks.length,
    activeConflictsCount: conflicts.filter((c) => c.status === "OPEN").length,
    activeExceptionsCount: exceptions.filter((e) => e.status === "ACTIVE").length,
    legalHoldsCount,
    categoryDistribution,
  };
}
