/**
 * EHRJ MADRASHA ERP — PHASE 39
 * Teacher/Staff Training & Professional Development Atomic Persistence Store
 */

import fs from "fs";
import path from "path";
import {
  TrainingProgram,
  TrainingSession,
  TrainingEnrollment,
  TrainingAttendanceRecord,
  TrainingAssessment,
  TrainingAssessmentSubmission,
  TrainingCertificate,
  ProfessionalDevelopmentPlan,
  TrainingAuditEntry,
  TrainingDashboardStats,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "training");
const PROGRAMS_FILE = path.join(DATA_DIR, "programs.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");
const ENROLLMENTS_FILE = path.join(DATA_DIR, "enrollments.json");
const ATTENDANCE_FILE = path.join(DATA_DIR, "attendance.json");
const ASSESSMENTS_FILE = path.join(DATA_DIR, "assessments.json");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");
const CERTIFICATES_FILE = path.join(DATA_DIR, "certificates.json");
const PLANS_FILE = path.join(DATA_DIR, "development_plans.json");
const AUDIT_FILE = path.join(DATA_DIR, "audit_log.json");

function ensureDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function safeAtomicWrite(filePath: string, data: any) {
  ensureDirectoryExists();
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tempPath, filePath);
}

// -------------------------------------------------------------
// SEED DATA GENERATOR
// -------------------------------------------------------------

function generateSeedPrograms(): TrainingProgram[] {
  const now = "2026-09-29T12:00:00.000Z";

  // 1. Tahfeez Pedagogy & Tajweed Workshop 2026
  const prog1: TrainingProgram = {
    id: "EHRJ-TRN-2026-THF001",
    trainingCode: "EHRJ-TRN-2026-THF001",
    titleBn: "তাহফীজুল কুরআন শিক্ষক শিক্ষণ ও তাজবীদ মস্ক কর্মশালা ২০২৬",
    titleEn: "Tahfeez-ul-Quran Pedagogy & Tajweed Advanced Workshop 2026",
    trainingType: "QURAN_TAHFEEZ_PEDAGOGY",
    deliveryMethod: "WORKSHOP",
    description: "হিফজ বিভাগের সম্মানিত উস্তাদগণের জন্য তাজবীদের সূক্ষ্ম নিয়মাবলি, ছবক ও মন্জিল তদারকির আধুনিক শিক্ষাদান পদ্ধতি।",
    objectivesBn: [
      "মাখরাজ ও সিফাত সহকারে সহীহ তিলাওয়াত পাঠদান দক্ষতা বৃদ্ধি।",
      "দুর্বল স্মৃতিশক্তির ছাত্রদের ছবক মুখস্থকরণে মনস্তাত্ত্বিক পরিচর্যা।",
      "দৈনিক মন্জিল রুটিন ও ডিজিটালাইজড অগ্রগতি ট্র্যাকিং।"
    ],
    ownerDepartment: "ACADEMIC",
    instructorName: "মাওলানা ক্বারী হাবিবুল্লাহ সাহেব",
    instructorRole: "প্রধান ক্বারী ও তাহফীজ বিশেষজ্ঞ",
    totalHours: 12,
    mandatoryStatus: "MANDATORY",
    targetDesignations: ["হিফজ শিক্ষক", "সহকারী ক্বারী", "নূরানী শিক্ষক"],
    targetDepartments: ["হিফজ বিভাগ", "নূরানী বিভাগ"],
    requiredSopIds: ["EHRJ-SOP-2026-THF001"],
    capacity: 25,
    attendanceThresholdPercentage: 80,
    requiresAssessment: true,
    passPercentage: 70,
    requiresInstructorApproval: true,
    issuesCertificate: true,
    certificateValidityMonths: 24,
    status: "SCHEDULED",
    currentVersion: 1,
    modules: [
      {
        id: "MOD-THF-01",
        moduleNumber: 1,
        titleBn: "সিফাতে লাযিমাহ ও আরিজাহ প্রয়োগবিধি",
        titleEn: "Tajweed Sifaat Application",
        description: "ছাত্রদের উচ্চারণের জড়তা দূরীকরণের কৌশল।",
        topics: ["হামস ও জাহর", "শিদ্দাত ও রিহওয়াত", "ইস্তিলা ও ইস্তিফাল"],
        estimatedHours: 6,
        requiresCompletion: true,
      },
      {
        id: "MOD-THF-02",
        moduleNumber: 2,
        titleBn: "দৈনিক মন্জিল তদারকি ও হিফজ মনস্তত্ত্ব",
        titleEn: "Manzil Supervision & Psychology",
        description: "হিফজ শিক্ষার্থীদের মনোযোগ ধরে রাখার উপায়।",
        topics: ["ভুল সংশোধনের আদব", "দৈনিক পৃষ্ঠা অগ্রগতি রেকর্ড", "অভিভাবক যোগাযোগ"],
        estimatedHours: 6,
        requiresCompletion: true,
      },
    ],
    sessions: [
      {
        id: "EHRJ-TRN-SES-2026-001",
        trainingProgramId: "EHRJ-TRN-2026-THF001",
        sessionNumber: 1,
        titleBn: "তাজবীদ মস্ক ও সরাসরি শ্রবণ",
        titleEn: "Live Tajweed Maskh Session",
        sessionDate: "2026-10-05",
        startTime: "09:00",
        endTime: "13:00",
        venue: "মাদ্রাসা কেন্দ্রীয় সেমিনার হল",
        facilitatorName: "মাওলানা ক্বারী হাবিবুল্লাহ সাহেব",
        facilitatorRole: "প্রধান প্রশিক্ষক",
        capacity: 25,
        status: "SCHEDULED",
      },
      {
        id: "EHRJ-TRN-SES-2026-002",
        trainingProgramId: "EHRJ-TRN-2026-THF001",
        sessionNumber: 2,
        titleBn: "হিফজ মূল্যায়ন ও ব্যবহারিক পরীক্ষা",
        titleEn: "Practical Pedagogy Assessment",
        sessionDate: "2026-10-06",
        startTime: "09:00",
        endTime: "13:00",
        venue: "মাদ্রাসা কেন্দ্রীয় সেমিনার হল",
        facilitatorName: "মাওলানা ক্বারী হাবিবুল্লাহ সাহেব",
        facilitatorRole: "প্রধান প্রশিক্ষক",
        capacity: 25,
        status: "SCHEDULED",
      },
    ],
    assessment: {
      id: "ASM-THF-01",
      trainingProgramId: "EHRJ-TRN-2026-THF001",
      titleBn: "তাহফীজ শিক্ষাদান পদ্ধতি ও তাজবীদ মূল্যায়ন কুইজ",
      passPercentage: 70,
      totalPoints: 10,
      questions: [
        {
          id: "Q-THF-1",
          questionBn: "সিফাতে মুস্তালিয়াহ হরফ কয়টি ও কী কী?",
          questionEn: "How many letters are in Sifaat-e-Musta'liyah?",
          type: "MCQ",
          options: ["৫টি", "৭টি (খ, স, দ, গ, ত, ক, জ)", "১০টি", "৪টি"],
          correctAnswer: "৭টি (খ, স, দ, গ, ত, ক, জ)",
          points: 5,
        },
        {
          id: "Q-THF-2",
          questionBn: "হিফজ ছবকে একটানা ৩টির অধিক ভুল হলে নতুন ছবক স্থগিত রাখা আবশ্যক কি না?",
          type: "TRUE_FALSE",
          options: ["হ্যাঁ, আবশ্যক", "না, জরুরি নয়"],
          correctAnswer: "হ্যাঁ, আবশ্যক",
          points: 5,
        },
      ],
    },
    createdBy: "academic-head",
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedBy: "academic-head",
    updatedAt: now,
  };

  // 2. Child Safeguarding & Student Welfare Training 2026 (COMPLETED)
  const prog2: TrainingProgram = {
    id: "EHRJ-TRN-2026-CSG001",
    trainingCode: "EHRJ-TRN-2026-CSG001",
    titleBn: "মাদ্রাসা শিক্ষার্থী সুরক্ষা ও শিশু অধিকার সচেতনতা প্রশিক্ষণ ২০২৬",
    titleEn: "Child Safeguarding, Student Care & Protection Training 2026",
    trainingType: "CHILD_SAFEGUARDING",
    deliveryMethod: "WORKSHOP",
    description: "আবাসিক ও অনাবাসিক শিক্ষার্থীদের মানসিক স্বাস্থ্য, শারীরিক সুরক্ষা, স্নেহশীল আচরণ ও মাদরাসা শৃঙ্খলা নির্দেশিকা।",
    objectivesBn: [
      "শারীরিক শাস্তি বর্জন এবং ইতিবাচক অনুপ্রেরণার মাধ্যমে শিক্ষাদান।",
      "হোস্টেল ও ক্লাসরুমে শিক্ষার্থীদের নিরাপত্তা ও স্বাস্থ্যবিধি নিশ্চিতকরণ।",
      "অভিভাবক ও শিক্ষকদের মধ্যে সুরক্ষামূলক বোঝাপড়া সৃষ্টি।"
    ],
    ownerDepartment: "ADMINISTRATION",
    instructorName: "অধ্যক্ষ মাওলানা আব্দুল করিম",
    instructorRole: "প্রিন্সিপাল ও শিশু সুরক্ষা কো-অর্ডিনেটর",
    totalHours: 8,
    mandatoryStatus: "MANDATORY",
    targetDesignations: ["সকল শিক্ষক", "হোস্টেল সুপার", "স্টাফ"],
    targetDepartments: ["সকল বিভাগ"],
    capacity: 40,
    attendanceThresholdPercentage: 100,
    requiresAssessment: true,
    passPercentage: 80,
    requiresInstructorApproval: true,
    issuesCertificate: true,
    certificateValidityMonths: 12,
    status: "COMPLETED",
    currentVersion: 1,
    modules: [
      {
        id: "MOD-CSG-01",
        moduleNumber: 1,
        titleBn: "শিশু মনোবিজ্ঞান ও ইসলামে সন্তানের অধিকার",
        titleEn: "Child Psychology & Rights in Islam",
        description: "নবীজী (সা.) এর শিক্ষাদান পদ্ধতি ও শিশুদের প্রতি ভালোবাসা।",
        topics: ["স্নেহশীল পাঠদান", "কঠোরতা বর্জন", "মানসিক বিকাশ"],
        estimatedHours: 4,
        requiresCompletion: true,
      },
    ],
    sessions: [
      {
        id: "EHRJ-TRN-SES-2026-003",
        trainingProgramId: "EHRJ-TRN-2026-CSG001",
        sessionNumber: 1,
        titleBn: "শিশু সুরক্ষা কর্মশালা ও সনদ প্রদান",
        titleEn: "Safeguarding Workshop & Certification",
        sessionDate: "2026-08-15",
        startTime: "10:00",
        endTime: "16:00",
        venue: "মাদ্রাসা কেন্দ্রীয় মিলনায়তন",
        facilitatorName: "অধ্যক্ষ মাওলানা আব্দুল করিম",
        facilitatorRole: "প্রধান প্রশিক্ষক",
        capacity: 40,
        status: "COMPLETED",
      },
    ],
    assessment: {
      id: "ASM-CSG-01",
      trainingProgramId: "EHRJ-TRN-2026-CSG001",
      titleBn: "শিশু সুরক্ষা নীতি ও অনুশাসন কুইজ",
      passPercentage: 80,
      totalPoints: 10,
      questions: [
        {
          id: "Q-CSG-1",
          questionBn: "ইসলামে শিক্ষাদানের মূল নীতি কী?",
          type: "MCQ",
          options: ["কঠোর শাস্তি", "স্নেহ ও প্রজ্ঞা (হিকমত)", "উপেক্ষা", "ভীতি প্রদর্শন"],
          correctAnswer: "স্নেহ ও প্রজ্ঞা (হিকমত)",
          points: 5,
        },
        {
          id: "Q-CSG-2",
          questionBn: "কোনো ছাত্র অসুস্থতা বা মানসিক কষ্টে থাকলে হোস্টেল সুপারের করণীয় কী?",
          type: "MCQ",
          options: ["অবিলম্বে চিকিৎসা ও অভিভাবককে জানানো", "অপেক্ষা করা", "ক্লাস চালিয়ে যাওয়া"],
          correctAnswer: "অবিলম্বে চিকিৎসা ও অভিভাবককে জানানো",
          points: 5,
        },
      ],
    },
    createdBy: "admin-01",
    createdAt: "2026-08-01T08:00:00.000Z",
    updatedBy: "admin-01",
    updatedAt: now,
  };

  // 3. Digital Campus & ERP Practical Training (IN_PROGRESS)
  const prog3: TrainingProgram = {
    id: "EHRJ-TRN-2026-ERP001",
    trainingCode: "EHRJ-TRN-2026-ERP001",
    titleBn: "ডিজিটাল ক্যাম্পাস ও ইআরপি সফটওয়্যার ব্যবহারিক প্রশিক্ষণ",
    titleEn: "Digital Campus & ERP Operational Practical Training",
    trainingType: "ERP_TRAINING",
    deliveryMethod: "IN_PERSON",
    description: "অনলাইন হাজিরা গ্রহণ, পরীক্ষার নম্বর ইনপুট, ছুটির দরখাস্ত অনুমোদন ও ডিজিটাল নোটিশ ব্যবহারের পদ্ধতি।",
    objectivesBn: [
      "শিক্ষক পোর্টালে দৈনিক উপস্থিতি এন্ট্রি নিশ্চিতকরণ।",
      "পরীক্ষার ফলাফল ও নম্বরপত্র নির্ভুলভাবে এন্ট্রি করার দক্ষতা অর্জন।"
    ],
    ownerDepartment: "IT",
    instructorName: "ইঞ্জিনিয়ার সাজ্জাদ হোসেন",
    instructorRole: "আইটি পরামর্শক",
    totalHours: 6,
    mandatoryStatus: "RECOMMENDED",
    targetDesignations: ["সকল শিক্ষক", "অফিস সহকারী"],
    targetDepartments: ["শিক্ষা বিভাগ", "প্রশাসনিক শাখা"],
    capacity: 30,
    attendanceThresholdPercentage: 80,
    requiresAssessment: false,
    requiresInstructorApproval: false,
    issuesCertificate: true,
    status: "IN_PROGRESS",
    currentVersion: 1,
    modules: [],
    sessions: [
      {
        id: "EHRJ-TRN-SES-2026-004",
        trainingProgramId: "EHRJ-TRN-2026-ERP001",
        sessionNumber: 1,
        titleBn: "ইআরপি পোর্টাল লগইন ও হাজিরা মডিউল",
        titleEn: "ERP Login & Attendance Module",
        sessionDate: "2026-09-28",
        startTime: "14:00",
        endTime: "16:00",
        venue: "কম্পিউটার ল্যাব",
        facilitatorName: "ইঞ্জিনিয়ার সাজ্জাদ হোসেন",
        facilitatorRole: "আইটি ইন্সট্রাক্টর",
        capacity: 30,
        status: "COMPLETED",
      },
      {
        id: "EHRJ-TRN-SES-2026-005",
        trainingProgramId: "EHRJ-TRN-2026-ERP001",
        sessionNumber: 2,
        titleBn: "রেজাল্ট এন্ট্রি ও অভিভাবক নোটিশিং",
        titleEn: "Result Entry & Guardian Messaging",
        sessionDate: "2026-10-02",
        startTime: "14:00",
        endTime: "16:00",
        venue: "কম্পিউটার ল্যাব",
        facilitatorName: "ইঞ্জিনিয়ার সাজ্জাদ হোসেন",
        facilitatorRole: "আইটি ইন্সট্রাক্টর",
        capacity: 30,
        status: "SCHEDULED",
      },
    ],
    createdBy: "it-head",
    createdAt: "2026-09-15T11:00:00.000Z",
    updatedBy: "it-head",
    updatedAt: now,
  };

  // 4. Lilah Boarding Food Hygiene & Nutrition Training
  const prog4: TrainingProgram = {
    id: "EHRJ-TRN-2026-LHB001",
    trainingCode: "EHRJ-TRN-2026-LHB001",
    titleBn: "লিল্লাহ বোর্ডিং খাদ্য নিরাপত্তা, পুষ্টি ও স্বাস্থ্যবিধি প্রশিক্ষণ",
    titleEn: "Lilah Boarding Food Hygiene & Nutrition Training",
    trainingType: "HOSTEL_PROCESS_TRAINING",
    deliveryMethod: "WORKSHOP",
    description: "লিল্লাহ বোর্ডিং ও আবাসিক এতিম ছাত্রদের খাবার প্রস্তুতকরণে স্বাস্থ্যবিধি ও হালাল খাদ্য নিরাপত্তা মান বজায় রাখা।",
    objectivesBn: ["রান্নাঘরের পরিচ্ছন্নতা", "পুষ্টিকর খাদ্য তালিকা", "অপচয় রোধ"],
    ownerDepartment: "RESIDENTIAL",
    instructorName: "মাওলানা আব্দুল করিম (প্রিন্সিপাল)",
    instructorRole: "তত্ত্বাবধায়ক",
    totalHours: 4,
    mandatoryStatus: "MANDATORY",
    targetDesignations: ["হোস্টেল সুপার", "প্রধান বাবুর্চি", "সহকারী বাবুর্চি"],
    targetDepartments: ["লিল্লাহ বোর্ডিং", "হোস্টেল"],
    requiredSopIds: ["EHRJ-SOP-2026-LLB001"],
    capacity: 15,
    attendanceThresholdPercentage: 100,
    requiresAssessment: false,
    requiresInstructorApproval: true,
    issuesCertificate: true,
    certificateValidityMonths: 12,
    status: "REGISTRATION_OPEN",
    currentVersion: 1,
    modules: [],
    sessions: [],
    createdBy: "admin-01",
    createdAt: "2026-09-20T10:00:00.000Z",
    updatedBy: "admin-01",
    updatedAt: now,
  };

  // 5. New Teacher Orientation 2026
  const prog5: TrainingProgram = {
    id: "EHRJ-TRN-2026-NEW001",
    trainingCode: "EHRJ-TRN-2026-NEW001",
    titleBn: "নতুন শিক্ষক পরিচিতি ও প্রাতিষ্ঠানিক আচরণবিধি ওরিয়েন্টেশন ২০২৬",
    titleEn: "New Teacher Orientation & Code of Conduct 2026",
    trainingType: "NEW_TEACHER_ORIENTATION",
    deliveryMethod: "ORIENTATION",
    description: "নবাগত শিক্ষক ও উস্তাদগণের জন্য মাদরাসার ঐতিহ্য, নিয়মকানুন, ছুটি ও দায়িত্বাবলির পরিচিতি।",
    objectivesBn: ["প্রতিষ্ঠানের লক্ষ্য ও ইতিহাস", "ছুটি ও আচরণবিধি এসওপি", "শিক্ষক সম্মান ও মর্যাদা"],
    ownerDepartment: "ADMINISTRATION",
    instructorName: "মাওলানা আব্দুল করিম",
    instructorRole: "প্রিন্সিপাল",
    totalHours: 4,
    mandatoryStatus: "MANDATORY",
    targetDesignations: ["নতুন শিক্ষক"],
    targetDepartments: ["সকল বিভাগ"],
    requiredSopIds: ["EHRJ-POL-2026-TCH001"],
    capacity: 20,
    attendanceThresholdPercentage: 100,
    requiresAssessment: false,
    requiresInstructorApproval: true,
    issuesCertificate: true,
    status: "APPROVED",
    currentVersion: 1,
    modules: [],
    sessions: [],
    createdBy: "admin-01",
    createdAt: "2026-09-25T09:00:00.000Z",
    updatedBy: "admin-01",
    updatedAt: now,
  };

  return [prog1, prog2, prog3, prog4, prog5];
}

function generateSeedEnrollments(): TrainingEnrollment[] {
  return [
    {
      id: "ENR-2026-001",
      trainingProgramId: "EHRJ-TRN-2026-THF001",
      employeeId: "EHRJ-EMP-2026-0012",
      employeeName: "হাফেজ মাওলানা জুবায়ের আহমেদ",
      designation: "সিনিয়র হিফজ শিক্ষক",
      department: "হিফজ বিভাগ",
      userRole: "TEACHER",
      status: "CONFIRMED",
      assignedAt: "2026-09-02T10:00:00.000Z",
      assignedBy: "অধ্যক্ষ দপ্তর",
      isMandatory: true,
      dueDate: "2026-10-10",
      attendanceRate: 0,
      assessmentStatus: "NOT_STARTED",
      isCompleted: false,
    },
    {
      id: "ENR-2026-002",
      trainingProgramId: "EHRJ-TRN-2026-CSG001",
      employeeId: "EHRJ-EMP-2026-0012",
      employeeName: "হাফেজ মাওলানা জুবায়ের আহমেদ",
      designation: "সিনিয়র হিফজ শিক্ষক",
      department: "হিফজ বিভাগ",
      userRole: "TEACHER",
      status: "COMPLETED",
      assignedAt: "2026-08-02T10:00:00.000Z",
      assignedBy: "অধ্যক্ষ দপ্তর",
      isMandatory: true,
      dueDate: "2026-08-16",
      attendanceRate: 100,
      assessmentScore: 10,
      assessmentStatus: "PASSED",
      isCompleted: true,
      completionDate: "2026-08-15",
      certificateId: "EHRJ-TRN-CERT-2026-0001",
    },
    {
      id: "ENR-2026-003",
      trainingProgramId: "EHRJ-TRN-2026-CSG001",
      employeeId: "EHRJ-EMP-2026-0015",
      employeeName: "মাওলানা মোহাম্মদ আব্দুল্লাহ",
      designation: "হোস্টেল সুপার",
      department: "আবাসিক শাখা",
      userRole: "STAFF",
      status: "COMPLETED",
      assignedAt: "2026-08-02T10:00:00.000Z",
      assignedBy: "অধ্যক্ষ দপ্তর",
      isMandatory: true,
      dueDate: "2026-08-16",
      attendanceRate: 100,
      assessmentScore: 10,
      assessmentStatus: "PASSED",
      isCompleted: true,
      completionDate: "2026-08-15",
      certificateId: "EHRJ-TRN-CERT-2026-0002",
    },
  ];
}

function generateSeedCertificates(): TrainingCertificate[] {
  return [
    {
      id: "EHRJ-TRN-CERT-2026-0001",
      trainingProgramId: "EHRJ-TRN-2026-CSG001",
      trainingProgramTitleBn: "মাদ্রাসা শিক্ষার্থী সুরক্ষা ও শিশু অধিকার সচেতনতা প্রশিক্ষণ ২০২৬",
      employeeId: "EHRJ-EMP-2026-0012",
      employeeName: "হাফেজ মাওলানা জুবায়ের আহমেদ",
      designation: "সিনিয়র হিফজ শিক্ষক",
      department: "হিফজ বিভাগ",
      verificationToken: "VER-TRN-2026-9872",
      qrCodeToken: "https://ehrj.edu.bd/verify/document/VER-TRN-2026-9872",
      certificateType: "MANDATORY_COMPLIANCE",
      issueDate: "2026-08-15",
      validFrom: "2026-08-15",
      validUntil: "2027-08-14",
      renewalRequired: true,
      renewalPeriodMonths: 12,
      status: "VALID",
      issuedBy: "মাওলানা আব্দুল করিম (প্রিন্সিপাল)",
      metadata: {
        attendancePercentage: 100,
        assessmentScore: 10,
        totalTrainingHours: 8,
      },
      createdAt: "2026-08-15T16:00:00.000Z",
      updatedAt: "2026-08-15T16:00:00.000Z",
    },
    {
      id: "EHRJ-TRN-CERT-2026-0002",
      trainingProgramId: "EHRJ-TRN-2026-CSG001",
      trainingProgramTitleBn: "মাদ্রাসা শিক্ষার্থী সুরক্ষা ও শিশু অধিকার সচেতনতা প্রশিক্ষণ ২০২৬",
      employeeId: "EHRJ-EMP-2026-0015",
      employeeName: "মাওলানা মোহাম্মদ আব্দুল্লাহ",
      designation: "হোস্টেল সুপার",
      department: "আবাসিক শাখা",
      verificationToken: "VER-TRN-2026-9873",
      qrCodeToken: "https://ehrj.edu.bd/verify/document/VER-TRN-2026-9873",
      certificateType: "MANDATORY_COMPLIANCE",
      issueDate: "2026-08-15",
      validFrom: "2026-08-15",
      validUntil: "2027-08-14",
      renewalRequired: true,
      renewalPeriodMonths: 12,
      status: "VALID",
      issuedBy: "মাওলানা আব্দুল করিম (প্রিন্সিপাল)",
      metadata: {
        attendancePercentage: 100,
        assessmentScore: 10,
        totalTrainingHours: 8,
      },
      createdAt: "2026-08-15T16:00:00.000Z",
      updatedAt: "2026-08-15T16:00:00.000Z",
    },
  ];
}

// -------------------------------------------------------------
// READ / WRITE OPERATIONS
// -------------------------------------------------------------

export function getAllTrainingPrograms(): TrainingProgram[] {
  ensureDirectoryExists();
  if (!fs.existsSync(PROGRAMS_FILE)) {
    const seed = generateSeedPrograms();
    safeAtomicWrite(PROGRAMS_FILE, seed);
    return seed;
  }
  try {
    return JSON.parse(fs.readFileSync(PROGRAMS_FILE, "utf8"));
  } catch (err) {
    console.error("Error reading training programs:", err);
    return [];
  }
}

export function saveAllTrainingPrograms(programs: TrainingProgram[]): void {
  safeAtomicWrite(PROGRAMS_FILE, programs);
}

export function getTrainingProgramById(idOrCode: string): TrainingProgram | undefined {
  const progs = getAllTrainingPrograms();
  return progs.find((p) => p.id === idOrCode || p.trainingCode.toLowerCase() === idOrCode.toLowerCase());
}

export function saveTrainingProgram(prog: TrainingProgram): void {
  const progs = getAllTrainingPrograms();
  const idx = progs.findIndex((p) => p.id === prog.id);
  if (idx >= 0) {
    progs[idx] = { ...prog, updatedAt: new Date().toISOString() };
  } else {
    progs.unshift({ ...prog, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  saveAllTrainingPrograms(progs);
}

// -------------------------------------------------------------
// ENROLLMENTS STORE
// -------------------------------------------------------------

export function getAllEnrollments(): TrainingEnrollment[] {
  ensureDirectoryExists();
  if (!fs.existsSync(ENROLLMENTS_FILE)) {
    const seed = generateSeedEnrollments();
    safeAtomicWrite(ENROLLMENTS_FILE, seed);
    return seed;
  }
  try {
    return JSON.parse(fs.readFileSync(ENROLLMENTS_FILE, "utf8"));
  } catch (err) {
    return [];
  }
}

export function saveAllEnrollments(enrollments: TrainingEnrollment[]): void {
  safeAtomicWrite(ENROLLMENTS_FILE, enrollments);
}

export function saveEnrollment(enrollment: TrainingEnrollment): void {
  const enrs = getAllEnrollments();
  const idx = enrs.findIndex((e) => e.id === enrollment.id);
  if (idx >= 0) {
    enrs[idx] = enrollment;
  } else {
    enrs.unshift(enrollment);
  }
  saveAllEnrollments(enrs);
}

// -------------------------------------------------------------
// ATTENDANCE STORE
// -------------------------------------------------------------

export function getAllAttendanceRecords(): TrainingAttendanceRecord[] {
  ensureDirectoryExists();
  if (!fs.existsSync(ATTENDANCE_FILE)) {
    safeAtomicWrite(ATTENDANCE_FILE, []);
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(ATTENDANCE_FILE, "utf8"));
  } catch (err) {
    return [];
  }
}

export function saveAttendanceRecord(att: TrainingAttendanceRecord): void {
  const records = getAllAttendanceRecords();
  const idx = records.findIndex((r) => r.sessionId === att.sessionId && r.employeeId === att.employeeId);
  if (idx >= 0) {
    records[idx] = att;
  } else {
    records.unshift(att);
  }
  safeAtomicWrite(ATTENDANCE_FILE, records);
}

// -------------------------------------------------------------
// SUBMISSIONS STORE
// -------------------------------------------------------------

export function getAllAssessmentSubmissions(): TrainingAssessmentSubmission[] {
  ensureDirectoryExists();
  if (!fs.existsSync(SUBMISSIONS_FILE)) {
    safeAtomicWrite(SUBMISSIONS_FILE, []);
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, "utf8"));
  } catch (err) {
    return [];
  }
}

export function saveAssessmentSubmission(sub: TrainingAssessmentSubmission): void {
  const subs = getAllAssessmentSubmissions();
  const idx = subs.findIndex((s) => s.id === sub.id);
  if (idx >= 0) {
    subs[idx] = sub;
  } else {
    subs.unshift(sub);
  }
  safeAtomicWrite(SUBMISSIONS_FILE, subs);
}

export const getAllSubmissions = getAllAssessmentSubmissions;
export const saveSubmission = saveAssessmentSubmission;

// -------------------------------------------------------------
// CERTIFICATES STORE
// -------------------------------------------------------------

export function getAllCertificates(): TrainingCertificate[] {
  ensureDirectoryExists();
  if (!fs.existsSync(CERTIFICATES_FILE)) {
    const seed = generateSeedCertificates();
    safeAtomicWrite(CERTIFICATES_FILE, seed);
    return seed;
  }
  try {
    return JSON.parse(fs.readFileSync(CERTIFICATES_FILE, "utf8"));
  } catch (err) {
    return [];
  }
}

export function saveCertificate(cert: TrainingCertificate): void {
  const certs = getAllCertificates();
  const idx = certs.findIndex((c) => c.id === cert.id);
  if (idx >= 0) {
    certs[idx] = cert;
  } else {
    certs.unshift(cert);
  }
  safeAtomicWrite(CERTIFICATES_FILE, certs);
}

// -------------------------------------------------------------
// DEVELOPMENT PLANS STORE
// -------------------------------------------------------------

export function getAllDevelopmentPlans(): ProfessionalDevelopmentPlan[] {
  ensureDirectoryExists();
  if (!fs.existsSync(PLANS_FILE)) {
    safeAtomicWrite(PLANS_FILE, []);
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(PLANS_FILE, "utf8"));
  } catch (err) {
    return [];
  }
}

export function saveDevelopmentPlan(plan: ProfessionalDevelopmentPlan): void {
  const plans = getAllDevelopmentPlans();
  const idx = plans.findIndex((p) => p.id === plan.id);
  if (idx >= 0) {
    plans[idx] = plan;
  } else {
    plans.unshift(plan);
  }
  safeAtomicWrite(PLANS_FILE, plans);
}

// -------------------------------------------------------------
// AUDIT LOG
// -------------------------------------------------------------

export function getAllAuditLogs(): TrainingAuditEntry[] {
  ensureDirectoryExists();
  if (!fs.existsSync(AUDIT_FILE)) {
    safeAtomicWrite(AUDIT_FILE, []);
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(AUDIT_FILE, "utf8"));
  } catch (err) {
    return [];
  }
}

export function recordTrainingAudit(entry: Omit<TrainingAuditEntry, "id" | "timestamp">): TrainingAuditEntry {
  const logs = getAllAuditLogs();
  const newEntry: TrainingAuditEntry = {
    ...entry,
    id: `AUD-TRN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
  };
  logs.unshift(newEntry);
  safeAtomicWrite(AUDIT_FILE, logs);
  return newEntry;
}

// -------------------------------------------------------------
// DASHBOARD STATS CALCULATION
// -------------------------------------------------------------

export function getTrainingDashboardStats(): TrainingDashboardStats {
  const progs = getAllTrainingPrograms();
  const enrollments = getAllEnrollments();
  const certs = getAllCertificates();
  const today = new Date().toISOString().split("T")[0];
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  let scheduledSessionsCount = 0;
  for (const p of progs) {
    if (p.sessions) {
      scheduledSessionsCount += p.sessions.filter((s) => s.status === "SCHEDULED").length;
    }
  }

  const mandatoryEnrollments = enrollments.filter((e) => e.isMandatory);
  const mandatoryCompleted = mandatoryEnrollments.filter((e) => e.isCompleted);
  const mandatoryCompletionRate =
    mandatoryEnrollments.length > 0 ? Math.round((mandatoryCompleted.length / mandatoryEnrollments.length) * 100) : 100;

  const expiringCertificatesCount = certs.filter(
    (c) => c.status === "VALID" && c.validUntil && c.validUntil <= in30Days && c.validUntil >= today
  ).length;

  const pendingAssessmentsCount = enrollments.filter(
    (e) => e.assessmentStatus === "SUBMITTED" || e.assessmentStatus === "UNDER_REVIEW"
  ).length;

  return {
    totalPrograms: progs.length,
    activePrograms: progs.filter((p) => p.status === "SCHEDULED" || p.status === "IN_PROGRESS" || p.status === "REGISTRATION_OPEN").length,
    scheduledSessionsCount,
    totalEnrollments: enrollments.length,
    mandatoryCompletionRate,
    certificatesIssuedCount: certs.length,
    expiringCertificatesCount,
    pendingAssessmentsCount,
  };
}
