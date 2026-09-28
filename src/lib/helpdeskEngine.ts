import { prisma } from "./prisma";
import { recordAuditLog } from "./security";
import { dispatchNotification } from "./communicationEngine";

// =================================================================
// 1. CONSTANTS, ENUMS & DEFAULT CATEGORIES
// =================================================================

export const HELPDESK_CATEGORIES = [
  {
    code: "ADMISSION",
    nameBn: "ভর্তি সংক্রান্ত",
    nameEn: "Admission & Enrollment",
    description: "নতুন ভর্তি, আবেদন যাচাই, মৌখিক পরীক্ষা ও আসন সংক্রান্ত সহায়তা বা অভিযোগ।",
    slaHours: 48,
    icon: "user-plus",
    sortOrder: 1,
  },
  {
    code: "FEE_PAYMENT",
    nameBn: "ফি ও পেমেন্ট সমস্যা",
    nameEn: "Fee & Payment Issues",
    description: "মাসিক ফি, অনলাইন পেমেন্ট ব্যর্থতা, রশিদ প্রাপ্তি বা রিফান্ড সংক্রান্ত বিষয়।",
    slaHours: 24,
    icon: "credit-card",
    sortOrder: 2,
  },
  {
    code: "ATTENDANCE",
    nameBn: "উপস্থিতি ও হাজিরা",
    nameEn: "Attendance Discrepancy",
    description: "হাজিরা রেকর্ড সংশোধন, ভুল অনুপস্থিতির নোটিশ বা ছুটি সমন্বয়।",
    slaHours: 48,
    icon: "calendar-check",
    sortOrder: 3,
  },
  {
    code: "RESULT",
    nameBn: "ফলাফল ও মার্কশিট",
    nameEn: "Exam Results & Marksheets",
    description: "সাময়িক/বার্ষিক পরীক্ষার ফলাফল, মার্কশিট বা গ্রেড সংক্রান্ত আপত্তি ও পুনর্মূল্যায়ন।",
    slaHours: 48,
    icon: "award",
    sortOrder: 4,
  },
  {
    code: "CERTIFICATE_DOCUMENT",
    nameBn: "সনদপত্র ও প্রত্যয়নপত্র",
    nameEn: "Certificates & Documents",
    description: "প্রশংসাপত্র, প্রত্যয়নপত্র বা ছাড়পত্র ইস্যু সংক্রান্ত বিলম্ব বা তথ্যের ভুল।",
    slaHours: 72,
    icon: "file-text",
    sortOrder: 5,
  },
  {
    code: "STUDENT_INFORMATION",
    nameBn: "শিক্ষার্থী তথ্য সংশোধন",
    nameEn: "Student Information Correction",
    description: "নামের বানান, জন্ম তারিখ, ঠিকানা বা অভিভাবকের মোবাইল নম্বর সংশোধনের প্রাতিষ্ঠানিক অনুরোধ।",
    slaHours: 48,
    icon: "edit-3",
    sortOrder: 6,
  },
  {
    code: "LIBRARY",
    nameBn: "লাইব্রেরি ও বই সংক্রান্ত",
    nameEn: "Library Issues",
    description: "বই ইস্যু, রিটার্ন ট্র্যাকিং, জরিমানা বা হারিয়ে যাওয়া বই সংক্রান্ত।",
    slaHours: 48,
    icon: "book",
    sortOrder: 7,
  },
  {
    code: "HOSTEL_RESIDENTIAL",
    nameBn: "আবাসিক হোস্টেল সেবা",
    nameEn: "Hostel & Residential",
    description: "হোস্টেল সিট, খাবার মান, রুম সার্ভিস বা আবাসিক শৃঙ্খলা সংক্রান্ত বিষয়।",
    slaHours: 24,
    icon: "home",
    sortOrder: 8,
  },
  {
    code: "TRANSPORT",
    nameBn: "পরিবহন সেবা",
    nameEn: "Transport Services",
    description: "বাস রুট, স্টপেজ সময়সূচি, চালক/হেল্পার বিষয়ক সেবা বা সমস্যা।",
    slaHours: 24,
    icon: "truck",
    sortOrder: 9,
  },
  {
    code: "TECHNICAL",
    nameBn: "কারিগরী ও পোর্টাল সহায়তা",
    nameEn: "Technical & Portal Support",
    description: "লগইন সমস্যা, পাসওয়ার্ড রিসেট বা পোর্টালে কারিগরি জটিলতা।",
    slaHours: 24,
    icon: "cpu",
    sortOrder: 10,
  },
  {
    code: "INVENTORY",
    nameBn: "সরঞ্জাম ও মালামাল সংক্রান্ত",
    nameEn: "Inventory & Assets",
    description: "ক্লাসরুম বা ক্যাম্পাসের প্রাতিষ্ঠানিক মালামাল বা যন্ত্রাংশ সংক্রান্ত অভ্যন্তরীণ রিপোর্ট।",
    slaHours: 72,
    icon: "box",
    sortOrder: 11,
  },
  {
    code: "GENERAL",
    nameBn: "সাধারণ জিজ্ঞাসা ও মতামত",
    nameEn: "General Inquiries & Feedback",
    description: "মাদরাসার উন্নয়নমূলক পরামর্শ, সাধারণ জিজ্ঞাসা বা প্রাতিষ্ঠানিক মতামত।",
    slaHours: 72,
    icon: "help-circle",
    sortOrder: 12,
  },
];

export const VALID_REQUEST_TYPES = [
  "COMPLAINT",
  "SERVICE_REQUEST",
  "CORRECTION_REQUEST",
  "SUPPORT_REQUEST",
  "FEEDBACK",
] as const;

export const VALID_PRIORITIES = ["NORMAL", "IMPORTANT", "URGENT"] as const;

export const VALID_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "IN_PROGRESS",
  "WAITING_FOR_INFORMATION",
  "RESOLVED",
  "CLOSED",
  "REJECTED",
  "REOPEN_REQUESTED",
] as const;

export type HelpdeskRequestType = typeof VALID_REQUEST_TYPES[number];
export type HelpdeskPriority = typeof VALID_PRIORITIES[number];
export type HelpdeskStatus = typeof VALID_STATUSES[number];

// Allowed state transitions map
const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ["UNDER_REVIEW", "IN_PROGRESS", "REJECTED"],
  UNDER_REVIEW: ["IN_PROGRESS", "WAITING_FOR_INFORMATION", "RESOLVED", "REJECTED"],
  IN_PROGRESS: ["WAITING_FOR_INFORMATION", "RESOLVED", "REJECTED"],
  WAITING_FOR_INFORMATION: ["IN_PROGRESS", "UNDER_REVIEW", "RESOLVED", "REJECTED"],
  RESOLVED: ["CLOSED", "REOPEN_REQUESTED", "UNDER_REVIEW"],
  CLOSED: ["REOPEN_REQUESTED", "UNDER_REVIEW"],
  REJECTED: ["UNDER_REVIEW"],
  REOPEN_REQUESTED: ["UNDER_REVIEW", "IN_PROGRESS", "CLOSED"],
};

export const STATUS_LABELS_BN: Record<string, string> = {
  SUBMITTED: "দাখিলকৃত",
  UNDER_REVIEW: "পর্যালোচনাধীন",
  IN_PROGRESS: "প্রক্রিয়াধীন",
  WAITING_FOR_INFORMATION: "অতিরিক্ত তথ্যের অপেক্ষায়",
  RESOLVED: "মীমাংসিত",
  CLOSED: "বন্ধ",
  REJECTED: "প্রত্যাখ্যাত",
  REOPEN_REQUESTED: "পুনর্বিবেচনার অনুরোধ",
};

export const PRIORITY_LABELS_BN: Record<string, string> = {
  NORMAL: "সাধারণ",
  IMPORTANT: "গুরুত্বপূর্ণ",
  URGENT: "জরুরি",
};

export const TYPE_LABELS_BN: Record<string, string> = {
  COMPLAINT: "অভিযোগ",
  SERVICE_REQUEST: "সার্ভিস রিকুয়েস্ট",
  CORRECTION_REQUEST: "তথ্য সংশোধন",
  SUPPORT_REQUEST: "সহায়তা",
  FEEDBACK: "মতামত ও পরামর্শ",
};

// =================================================================
// 2. CATEGORY INITIALIZATION & CRUD
// =================================================================

/**
 * Seed initial categories if table is empty
 */
export async function ensureDefaultHelpdeskCategories() {
  for (const cat of HELPDESK_CATEGORIES) {
    await prisma.supportRequestCategory.upsert({
      where: { code: cat.code },
      update: {
        nameBn: cat.nameBn,
        nameEn: cat.nameEn,
        description: cat.description,
        slaHours: cat.slaHours,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
      },
      create: {
        code: cat.code,
        nameBn: cat.nameBn,
        nameEn: cat.nameEn,
        description: cat.description,
        slaHours: cat.slaHours,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
    });
  }
}

/**
 * Retrieve all categories
 */
export async function getHelpdeskCategories(includeInactive = false) {
  await ensureDefaultHelpdeskCategories();
  return prisma.supportRequestCategory.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

/**
 * Create custom category
 */
export async function createHelpdeskCategory(params: {
  code: string;
  nameBn: string;
  nameEn?: string;
  description?: string;
  slaHours?: number;
  icon?: string;
  sortOrder?: number;
  adminId: string;
}) {
  const existing = await prisma.supportRequestCategory.findUnique({
    where: { code: params.code.toUpperCase().trim() },
  });
  if (existing) {
    throw new Error(`Category code '${params.code}' already exists`);
  }

  const category = await prisma.supportRequestCategory.create({
    data: {
      code: params.code.toUpperCase().trim(),
      nameBn: params.nameBn.trim(),
      nameEn: params.nameEn?.trim() || params.code,
      description: params.description?.trim() || null,
      slaHours: params.slaHours || 48,
      icon: params.icon || "help-circle",
      sortOrder: params.sortOrder || 99,
      isActive: true,
    },
  });

  await recordAuditLog({
    userId: params.adminId,
    action: "CREATE_HELPDESK_CATEGORY",
    entityType: "SupportRequestCategory",
    entityId: category.id,
    details: { code: category.code, nameBn: category.nameBn },
  });

  return category;
}

/**
 * Update existing category
 */
export async function updateHelpdeskCategory(
  id: string,
  params: {
    nameBn?: string;
    nameEn?: string;
    description?: string;
    slaHours?: number;
    icon?: string;
    sortOrder?: number;
    isActive?: boolean;
    adminId: string;
  }
) {
  const existing = await prisma.supportRequestCategory.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Category not found");
  }

  const updated = await prisma.supportRequestCategory.update({
    where: { id },
    data: {
      nameBn: params.nameBn?.trim() ?? existing.nameBn,
      nameEn: params.nameEn !== undefined ? params.nameEn?.trim() || "" : existing.nameEn,
      description: params.description !== undefined ? params.description?.trim() || null : existing.description,
      slaHours: params.slaHours ?? existing.slaHours,
      icon: params.icon ?? existing.icon,
      sortOrder: params.sortOrder ?? existing.sortOrder,
      isActive: params.isActive !== undefined ? params.isActive : existing.isActive,
    },
  });

  await recordAuditLog({
    userId: params.adminId,
    action: "UPDATE_HELPDESK_CATEGORY",
    entityType: "SupportRequestCategory",
    entityId: id,
    details: { old: existing, updated },
  });

  return updated;
}

// =================================================================
// 3. ATOMIC TICKET NUMBER GENERATION
// =================================================================

/**
 * Concurrency-safe atomic ticket generator: EHRJ-REQ-YYYY-XXXXXX
 */
export async function generateNextTicketNumber(prefix = "REQ"): Promise<string> {
  const year = new Date().getFullYear();

  return await prisma.$transaction(async (tx) => {
    const seq = await tx.supportRequestSequence.upsert({
      where: {
        prefix_year: {
          prefix,
          year,
        },
      },
      update: {
        lastSeq: { increment: 1 },
      },
      create: {
        prefix,
        year,
        lastSeq: 1,
      },
    });

    const sequencePadded = String(seq.lastSeq).padStart(6, "0");
    return `EHRJ-${prefix}-${year}-${sequencePadded}`;
  });
}

// =================================================================
// 4. ENTITY LINKAGE & GUARDIAN-STUDENT AUTHORIZATION
// =================================================================

/**
 * Validate that a guardian is authorized to file a ticket for a given student
 */
export async function verifyGuardianStudentAccess(guardianId: string, studentId: string): Promise<boolean> {
  const link = await prisma.guardianStudent.findUnique({
    where: {
      guardianId_studentId: {
        guardianId,
        studentId,
      },
    },
  });
  return !!link;
}

/**
 * Validate that a related entity belongs to the specified student/guardian
 */
export async function verifyRelatedEntityOwnership(params: {
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  studentId?: string | null;
  guardianId?: string | null;
}): Promise<{ valid: boolean; reason?: string }> {
  if (!params.relatedEntityType || !params.relatedEntityId) {
    return { valid: true };
  }

  const { relatedEntityType, relatedEntityId, studentId } = params;

  switch (relatedEntityType) {
    case "INVOICE": {
      const invoice = await prisma.feeInvoice.findUnique({
        where: { id: relatedEntityId },
      });
      if (!invoice) return { valid: false, reason: "Invoice not found" };
      if (studentId && invoice.studentId !== studentId) {
        return { valid: false, reason: "Invoice does not belong to the selected student" };
      }
      return { valid: true };
    }

    case "PAYMENT": {
      const payment = await prisma.paymentReceipt.findUnique({
        where: { id: relatedEntityId },
        include: { invoice: true },
      });
      if (!payment) return { valid: false, reason: "Payment record not found" };
      if (studentId && payment.invoice.studentId !== studentId) {
        return { valid: false, reason: "Payment does not belong to the selected student" };
      }
      return { valid: true };
    }

    case "RESULT": {
      const result = await prisma.result.findUnique({
        where: { id: relatedEntityId },
      });
      if (!result) return { valid: false, reason: "Result record not found" };
      if (studentId && result.studentId !== studentId) {
        return { valid: false, reason: "Result does not belong to the selected student" };
      }
      return { valid: true };
    }

    case "CERTIFICATE_REQUEST":
    case "DOCUMENT_REQUEST": {
      const docReq = await prisma.documentRequest.findUnique({
        where: { id: relatedEntityId },
      });
      if (!docReq) return { valid: false, reason: "Document request not found" };
      if (studentId && docReq.studentId !== studentId) {
        return { valid: false, reason: "Document request does not belong to the selected student" };
      }
      return { valid: true };
    }

    case "ADMISSION_APP": {
      const app = await prisma.application.findUnique({
        where: { id: relatedEntityId },
      });
      if (!app) return { valid: false, reason: "Admission application not found" };
      return { valid: true };
    }

    case "LIBRARY_ISSUE": {
      const issue = await prisma.libraryIssue.findUnique({
        where: { id: relatedEntityId },
        include: { member: true },
      });
      if (!issue) return { valid: false, reason: "Library issue not found" };
      if (studentId && issue.member?.studentId !== studentId) {
        return { valid: false, reason: "Library record does not belong to the selected student" };
      }
      return { valid: true };
    }

    case "HOSTEL_ENROLLMENT":
    case "RESIDENTIAL_ENROLLMENT": {
      const enrollment = await prisma.residentialEnrollment.findUnique({
        where: { id: relatedEntityId },
      });
      if (!enrollment) return { valid: false, reason: "Residential enrollment not found" };
      if (studentId && enrollment.studentId !== studentId) {
        return { valid: false, reason: "Hostel record does not belong to the selected student" };
      }
      return { valid: true };
    }

    case "TRANSPORT_ENROLLMENT": {
      const transport = await prisma.transportEnrollment.findUnique({
        where: { id: relatedEntityId },
      });
      if (!transport) return { valid: false, reason: "Transport enrollment not found" };
      if (studentId && transport.studentId !== studentId) {
        return { valid: false, reason: "Transport record does not belong to the selected student" };
      }
      return { valid: true };
    }

    default:
      // Other generalized references
      return { valid: true };
  }
}

// =================================================================
// 5. TICKET CREATION
// =================================================================

export interface CreateSupportRequestInput {
  userId: string; // The authenticated user (Guardian, Admin, Teacher)
  role: string;
  guardianId?: string;
  studentId?: string;
  categoryCode: string;
  requestType: HelpdeskRequestType;
  priority?: HelpdeskPriority;
  subject: string;
  description: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
}

export async function createSupportRequest(input: CreateSupportRequestInput) {
  // 1. Validate Category
  const category = await prisma.supportRequestCategory.findUnique({
    where: { code: input.categoryCode },
  });
  if (!category || !category.isActive) {
    throw new Error(`Invalid or inactive category: ${input.categoryCode}`);
  }

  // 2. Validate Type & Priority
  if (!VALID_REQUEST_TYPES.includes(input.requestType)) {
    throw new Error(`Invalid request type: ${input.requestType}`);
  }
  const priority = input.priority || "NORMAL";
  if (!VALID_PRIORITIES.includes(priority)) {
    throw new Error(`Invalid priority: ${priority}`);
  }

  // 3. Guardian & Student Authorization Check
  if (input.role === "GUARDIAN") {
    if (!input.guardianId) {
      throw new Error("Guardian profile required to submit support requests");
    }
    if (input.studentId) {
      const hasAccess = await verifyGuardianStudentAccess(input.guardianId, input.studentId);
      if (!hasAccess) {
        throw new Error("Unauthorized: Student is not linked to this guardian profile");
      }
    }
  }

  // 4. Verify Related Entity Ownership (Prevent IDOR linking)
  if (input.relatedEntityType && input.relatedEntityId) {
    const ownership = await verifyRelatedEntityOwnership({
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      studentId: input.studentId,
      guardianId: input.guardianId,
    });
    if (!ownership.valid) {
      throw new Error(`Entity validation failed: ${ownership.reason}`);
    }
  }

  // 5. Duplicate Request Protection (same user, category, student within 15 minutes)
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const potentialDuplicate = await prisma.supportRequest.findFirst({
    where: {
      submittedByUserId: input.userId,
      studentId: input.studentId || null,
      categoryId: category.id,
      subject: input.subject.trim(),
      status: { in: ["SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS"] },
      createdAt: { gte: fifteenMinutesAgo },
    },
  });
  if (potentialDuplicate) {
    throw new Error(
      `একই বিষয় ও ক্যাটাগরিতে একটি অনুরোধ ইতিমধ্যে জমা রয়েছে (টিকিট নম্বর: ${potentialDuplicate.ticketNumber})। অনুগ্রহ করে অপেক্ষা করুন।`
    );
  }

  // 6. Generate Unique Ticket Number & Calculate Target SLA
  const ticketNumber = await generateNextTicketNumber("REQ");
  const slaHours = category.slaHours || (priority === "URGENT" ? 24 : priority === "IMPORTANT" ? 48 : 72);
  const slaTargetAt = new Date(Date.now() + slaHours * 60 * 60 * 1000);

  // 7. Atomic Ticket Creation with Initial Status History & Messages
  const ticket = await prisma.$transaction(async (tx) => {
    const req = await tx.supportRequest.create({
      data: {
        ticketNumber,
        submittedByUserId: input.userId,
        guardianId: input.guardianId || null,
        studentId: input.studentId || null,
        categoryId: category.id,
        requestType: input.requestType,
        priority,
        status: "SUBMITTED",
        subject: input.subject.trim(),
        description: input.description.trim(),
        relatedEntityType: input.relatedEntityType || null,
        relatedEntityId: input.relatedEntityId || null,
        slaTargetAt,
        messages: {
          create: {
            authorUserId: input.userId,
            messageType: input.role === "GUARDIAN" ? "USER_RESPONSE" : "ADMIN_RESPONSE",
            isInternal: false,
            content: input.description.trim(),
          },
        },
        statusHistories: {
          create: {
            recordedByUserId: input.userId,
            newStatus: "SUBMITTED",
            remarks: "টিকিট সফলভাবে নিবন্ধিত হয়েছে।",
          },
        },
        attachments: input.attachments && input.attachments.length > 0
          ? {
              create: input.attachments.map((att) => ({
                uploadedByUserId: input.userId,
                fileName: att.fileName,
                fileUrl: att.fileUrl,
                fileSize: att.fileSize,
                mimeType: att.mimeType,
                isInternal: false,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        submittedByUser: { select: { id: true, name: true, phone: true, role: true } },
        student: { select: { id: true, studentIdNumber: true, fullNameBn: true, fullNameEn: true } },
        guardian: { select: { id: true, fullNameBn: true, phone: true } },
        attachments: true,
        messages: true,
      },
    });

    return req;
  });

  // 8. Record Audit Log
  await recordAuditLog({
    userId: input.userId,
    action: "CREATE_SUPPORT_REQUEST",
    entityType: "SupportRequest",
    entityId: ticket.id,
    details: {
      ticketNumber: ticket.ticketNumber,
      category: category.code,
      type: ticket.requestType,
      priority: ticket.priority,
      subject: ticket.subject,
    },
  });

  // 9. Dispatch Phase 8 Notification (Async Outbox/Idempotent)
  try {
    await dispatchNotification({
      templateCode: "HELPDESK_TICKET_CREATED",
      target: { audience: "CUSTOM", customUserIds: [input.userId] },
      variables: {
        "ticket.ticketNumber": ticket.ticketNumber,
        "ticket.subject": ticket.subject,
        "recipient.name": ticket.submittedByUser.name || ticket.guardian?.fullNameBn || "অভিভাবক",
      },
      relatedEntityType: "SupportRequest",
      relatedEntityId: ticket.id,
      idempotencyBaseKey: `helpdesk-create-${ticket.id}`,
    });
  } catch (err) {
    console.error("[HelpdeskEngine] Notification error:", err);
  }

  return ticket;
}

// =================================================================
// 6. TICKET QUERIES & FILTERING
// =================================================================

export interface SupportRequestFilterOptions {
  ticketNumber?: string;
  status?: string;
  categoryId?: string;
  categoryCode?: string;
  requestType?: string;
  priority?: string;
  studentId?: string;
  guardianId?: string;
  userId?: string;
  search?: string;
  isUrgent?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Filter support requests for Admin / Principal with pagination
 */
export async function getSupportRequests(options: SupportRequestFilterOptions) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(100, options.limit || 20));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (options.ticketNumber) {
    where.ticketNumber = { contains: options.ticketNumber.trim() };
  }
  if (options.status) {
    where.status = options.status;
  }
  if (options.categoryId) {
    where.categoryId = options.categoryId;
  }
  if (options.categoryCode) {
    where.category = { code: options.categoryCode };
  }
  if (options.requestType) {
    where.requestType = options.requestType;
  }
  if (options.priority) {
    where.priority = options.priority;
  }
  if (options.isUrgent) {
    where.priority = "URGENT";
  }
  if (options.studentId) {
    where.studentId = options.studentId;
  }
  if (options.guardianId) {
    where.guardianId = options.guardianId;
  }
  if (options.userId) {
    where.submittedByUserId = options.userId;
  }

  if (options.search) {
    const s = options.search.trim();
    where.OR = [
      { ticketNumber: { contains: s } },
      { subject: { contains: s } },
      { description: { contains: s } },
      { submittedByUser: { name: { contains: s } } },
      { submittedByUser: { phone: { contains: s } } },
      { student: { fullNameBn: { contains: s } } },
      { student: { studentIdNumber: { contains: s } } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.supportRequest.count({ where }),
    prisma.supportRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: {
        category: true,
        submittedByUser: { select: { id: true, name: true, phone: true, role: true } },
        student: { select: { id: true, studentIdNumber: true, fullNameBn: true, fullNameEn: true } },
        guardian: { select: { id: true, fullNameBn: true, phone: true } },
        assignedToUser: { select: { id: true, name: true } },
        _count: { select: { messages: true, attachments: true } },
      },
    }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Filter support requests for a specific Guardian (Strict Isolation)
 */
export async function getGuardianSupportRequests(params: {
  guardianId: string;
  studentId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(50, params.limit || 15));
  const skip = (page - 1) * limit;

  // Retrieve linked students for this guardian to verify access
  const linkedStudents = await prisma.guardianStudent.findMany({
    where: { guardianId: params.guardianId },
    select: { studentId: true },
  });
  const allowedStudentIds = linkedStudents.map((s) => s.studentId);

  const where: any = {
    guardianId: params.guardianId,
  };

  if (params.studentId) {
    if (!allowedStudentIds.includes(params.studentId)) {
      throw new Error("Unauthorized student filter");
    }
    where.studentId = params.studentId;
  }

  if (params.status) {
    where.status = params.status;
  }

  const [total, items] = await Promise.all([
    prisma.supportRequest.count({ where }),
    prisma.supportRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        student: { select: { id: true, studentIdNumber: true, fullNameBn: true, fullNameEn: true } },
        _count: { select: { messages: true, attachments: true } },
      },
    }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get ticket details with timeline, redacted appropriately based on viewer role
 */
export async function getSupportRequestById(id: string, viewer: { userId: string; role: string; guardianId?: string }) {
  const ticket = await prisma.supportRequest.findUnique({
    where: { id },
    include: {
      category: true,
      submittedByUser: { select: { id: true, name: true, phone: true, role: true } },
      student: {
        select: {
          id: true,
          studentIdNumber: true,
          fullNameBn: true,
          fullNameEn: true,
        },
      },
      guardian: { select: { id: true, fullNameBn: true, phone: true, relation: true } },
      assignedToUser: { select: { id: true, name: true, email: true } },
      resolvedByUser: { select: { id: true, name: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          authorUser: { select: { id: true, name: true, role: true } },
        },
      },
      attachments: {
        orderBy: { createdAt: "asc" },
      },
      statusHistories: {
        orderBy: { createdAt: "asc" },
        include: {
          recordedByUser: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!ticket) return null;

  // Authorization check (IDOR Protection)
  const isPrivileged = viewer.role === "ADMIN" || viewer.role === "PRINCIPAL";
  if (!isPrivileged) {
    if (viewer.role === "GUARDIAN") {
      const isOwner = ticket.guardianId === viewer.guardianId || ticket.submittedByUserId === viewer.userId;
      if (!isOwner) {
        throw new Error("Unauthorized access to ticket");
      }
    } else if (ticket.submittedByUserId !== viewer.userId) {
      throw new Error("Unauthorized access to ticket");
    }
  }

  // Redact internal notes & attachments for non-privileged users
  if (!isPrivileged) {
    (ticket as any).messages = ticket.messages.filter((m) => !m.isInternal && m.messageType !== "INTERNAL_NOTE");
    (ticket as any).attachments = ticket.attachments.filter((a) => !a.isInternal);
  }

  return ticket;
}

// =================================================================
// 7. STATUS TRANSITIONS & RESOLUTION
// =================================================================

export interface UpdateStatusInput {
  requestId: string;
  toStatus: HelpdeskStatus;
  actorId: string;
  actorRole: string;
  notes?: string;
  resolutionSummary?: string;
  rejectionReason?: string;
}

export async function updateSupportRequestStatus(input: UpdateStatusInput) {
  const ticket = await prisma.supportRequest.findUnique({
    where: { id: input.requestId },
    include: { submittedByUser: true, guardian: true, category: true },
  });

  if (!ticket) {
    throw new Error("Support request not found");
  }

  const fromStatus = ticket.status;
  const toStatus = input.toStatus;

  // Validate state transition
  const allowedNext = ALLOWED_STATUS_TRANSITIONS[fromStatus] || [];
  if (!allowedNext.includes(toStatus) && fromStatus !== toStatus) {
    throw new Error(
      `Invalid status transition from ${fromStatus} (${STATUS_LABELS_BN[fromStatus]}) to ${toStatus} (${STATUS_LABELS_BN[toStatus]})`
    );
  }

  // Role validation
  if (toStatus === "REOPEN_REQUESTED") {
    // Requester/Guardian or Admin can request reopen
  } else if (input.actorRole !== "ADMIN" && input.actorRole !== "PRINCIPAL") {
    throw new Error("Only administrators or authorized staff can update ticket status");
  }

  // Prepare updates
  const updateData: any = {
    status: toStatus,
  };

  if (toStatus === "RESOLVED") {
    updateData.resolutionDate = new Date();
    updateData.resolvedByUserId = input.actorId;
    updateData.resolutionSummary = input.resolutionSummary?.trim() || "অনুরোধটি সফলভাবে সমাধান করা হয়েছে।";
  } else if (toStatus === "CLOSED") {
    updateData.closedAt = new Date();
  } else if (toStatus === "IN_PROGRESS" && !ticket.firstResponseAt) {
    updateData.firstResponseAt = new Date();
  } else if (toStatus === "REOPEN_REQUESTED") {
    updateData.reopenReason = input.notes?.trim() || "পুনর্বিবেচনার আবেদন।";
  }

  const updatedTicket = await prisma.$transaction(async (tx) => {
    const updated = await tx.supportRequest.update({
      where: { id: input.requestId },
      data: updateData,
    });

    await tx.supportRequestStatusHistory.create({
      data: {
        requestId: input.requestId,
        previousStatus: fromStatus,
        newStatus: toStatus,
        recordedByUserId: input.actorId,
        remarks: input.notes || input.resolutionSummary || input.rejectionReason || null,
      },
    });

    return updated;
  });

  // Record Audit
  await recordAuditLog({
    userId: input.actorId,
    action: "UPDATE_HELPDESK_STATUS",
    entityType: "SupportRequest",
    entityId: ticket.id,
    details: { oldStatus: fromStatus, newStatus: toStatus, notes: input.notes },
  });

  // Dispatch Notification
  try {
    const templateCode =
      toStatus === "RESOLVED"
        ? "HELPDESK_TICKET_RESOLVED"
        : toStatus === "WAITING_FOR_INFORMATION"
        ? "HELPDESK_INFO_REQUIRED"
        : toStatus === "REOPEN_REQUESTED"
        ? "HELPDESK_TICKET_REOPENED"
        : "HELPDESK_STATUS_CHANGED";

    await dispatchNotification({
      templateCode,
      target: { audience: "CUSTOM", customUserIds: [ticket.submittedByUserId] },
      variables: {
        "ticket.ticketNumber": ticket.ticketNumber,
        "ticket.subject": ticket.subject,
        "ticket.status": toStatus,
        "ticket.statusBn": STATUS_LABELS_BN[toStatus] || toStatus,
        "ticket.resolutionSummary": input.resolutionSummary || "প্রশাসনিক পর্যালোচনা সম্পন্ন।",
        "ticket.reopenReason": input.notes || "পুনরায় বিবেচনার আবেদন।",
        "recipient.name": ticket.submittedByUser.name || ticket.guardian?.fullNameBn || "অভিভাবক",
      },
      relatedEntityType: "SupportRequest",
      relatedEntityId: ticket.id,
      idempotencyBaseKey: `helpdesk-status-${ticket.id}-${toStatus}`,
    });
  } catch (err) {
    console.error("[HelpdeskEngine] Notification dispatch error:", err);
  }

  return updatedTicket;
}

// =================================================================
// 8. MESSAGES & RESPONSES (INTERNAL NOTE VS USER-VISIBLE)
// =================================================================

export interface AddMessageInput {
  requestId: string;
  authorId: string;
  authorRole: string;
  content: string;
  isInternal?: boolean;
}

export async function addSupportRequestMessage(input: AddMessageInput) {
  const ticket = await prisma.supportRequest.findUnique({
    where: { id: input.requestId },
    include: { submittedByUser: true, guardian: true },
  });

  if (!ticket) {
    throw new Error("Support request not found");
  }

  const isPrivileged = input.authorRole === "ADMIN" || input.authorRole === "PRINCIPAL";

  // IDOR / authorization check
  if (!isPrivileged) {
    if (ticket.submittedByUserId !== input.authorId && (!ticket.guardianId || input.authorRole !== "GUARDIAN")) {
      throw new Error("Unauthorized: Cannot post messages to another user's ticket");
    }
  }

  // Internal notes strictly restricted to Admin/Principal
  const isInternal = Boolean(input.isInternal && isPrivileged);
  const messageType = isInternal
    ? "INTERNAL_NOTE"
    : isPrivileged
    ? "ADMIN_RESPONSE"
    : "USER_RESPONSE";

  const message = await prisma.$transaction(async (tx) => {
    const msg = await tx.supportRequestMessage.create({
      data: {
        requestId: input.requestId,
        authorUserId: input.authorId,
        messageType,
        isInternal,
        content: input.content.trim(),
      },
      include: {
        authorUser: { select: { id: true, name: true, role: true } },
      },
    });

    // If first response from staff, track firstResponseAt
    if (isPrivileged && !isInternal && !ticket.firstResponseAt) {
      await tx.supportRequest.update({
        where: { id: input.requestId },
        data: { firstResponseAt: new Date() },
      });
    }

    return msg;
  });

  // Audit
  await recordAuditLog({
    userId: input.authorId,
    action: isInternal ? "ADD_HELPDESK_INTERNAL_NOTE" : "ADD_HELPDESK_MESSAGE",
    entityType: "SupportRequestMessage",
    entityId: message.id,
    details: {
      requestId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      messageType,
      isInternal,
    },
  });

  // Notify recipient if official public response
  if (!isInternal && isPrivileged) {
    try {
      await dispatchNotification({
        templateCode: "HELPDESK_RESPONSE_ADDED",
        target: { audience: "CUSTOM", customUserIds: [ticket.submittedByUserId] },
        variables: {
          "ticket.ticketNumber": ticket.ticketNumber,
          "ticket.subject": ticket.subject,
          "message.contentPreview": input.content.slice(0, 80) + (input.content.length > 80 ? "..." : ""),
          "recipient.name": ticket.submittedByUser.name || ticket.guardian?.fullNameBn || "অভিভাবক",
        },
        relatedEntityType: "SupportRequest",
        relatedEntityId: ticket.id,
        idempotencyBaseKey: `helpdesk-msg-${message.id}`,
      });
    } catch (err) {
      console.error("[HelpdeskEngine] Response notification error:", err);
    }
  }

  return message;
}

// =================================================================
// 9. ATTACHMENTS
// =================================================================

export async function addSupportRequestAttachment(params: {
  requestId: string;
  uploadedById: string;
  uploadedByRole: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  isInternal?: boolean;
}) {
  const ticket = await prisma.supportRequest.findUnique({
    where: { id: params.requestId },
  });
  if (!ticket) {
    throw new Error("Support request not found");
  }

  const isPrivileged = params.uploadedByRole === "ADMIN" || params.uploadedByRole === "PRINCIPAL";
  if (!isPrivileged && ticket.submittedByUserId !== params.uploadedById) {
    throw new Error("Unauthorized to add attachment to this request");
  }

  const isInternal = Boolean(params.isInternal && isPrivileged);

  const attachment = await prisma.supportRequestAttachment.create({
    data: {
      requestId: params.requestId,
      uploadedByUserId: params.uploadedById,
      fileName: params.fileName,
      fileUrl: params.fileUrl,
      fileSize: params.fileSize,
      mimeType: params.mimeType,
      isInternal,
    },
  });

  await recordAuditLog({
    userId: params.uploadedById,
    action: "ADD_HELPDESK_ATTACHMENT",
    entityType: "SupportRequestAttachment",
    entityId: attachment.id,
    details: {
      requestId: params.requestId,
      fileName: params.fileName,
      isInternal,
    },
  });

  return attachment;
}

// =================================================================
// 10. ADMIN DASHBOARD METRICS & SLA AGGREGATION
// =================================================================

export async function getHelpdeskDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalRequests,
    openRequests,
    newToday,
    underReview,
    inProgress,
    waitingForInfo,
    urgentRequests,
    resolvedToday,
    categoryCounts,
    statusCounts,
    recentRequests,
  ] = await Promise.all([
    prisma.supportRequest.count(),
    prisma.supportRequest.count({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS", "WAITING_FOR_INFORMATION"] } },
    }),
    prisma.supportRequest.count({ where: { createdAt: { gte: today } } }),
    prisma.supportRequest.count({ where: { status: "UNDER_REVIEW" } }),
    prisma.supportRequest.count({ where: { status: "IN_PROGRESS" } }),
    prisma.supportRequest.count({ where: { status: "WAITING_FOR_INFORMATION" } }),
    prisma.supportRequest.count({
      where: {
        priority: "URGENT",
        status: { in: ["SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS", "WAITING_FOR_INFORMATION"] },
      },
    }),
    prisma.supportRequest.count({
      where: {
        status: "RESOLVED",
        resolutionDate: { gte: today },
      },
    }),
    prisma.supportRequest.groupBy({
      by: ["categoryId"],
      _count: { id: true },
    }),
    prisma.supportRequest.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.supportRequest.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        submittedByUser: { select: { name: true, phone: true } },
        student: { select: { studentIdNumber: true, fullNameBn: true } },
      },
    }),
  ]);

  // Calculate Average Resolution Time & SLA breaches
  const resolvedList = await prisma.supportRequest.findMany({
    where: { status: { in: ["RESOLVED", "CLOSED"] }, resolutionDate: { not: null } },
    select: { createdAt: true, resolutionDate: true, slaTargetAt: true },
    take: 100,
  });

  let totalDurationHours = 0;
  let slaBreachedCount = 0;
  for (const item of resolvedList) {
    if (item.resolutionDate) {
      const diffMs = item.resolutionDate.getTime() - item.createdAt.getTime();
      totalDurationHours += diffMs / (1000 * 60 * 60);
      if (item.slaTargetAt && item.resolutionDate > item.slaTargetAt) {
        slaBreachedCount++;
      }
    }
  }
  const avgResolutionHours = resolvedList.length > 0 ? Number((totalDurationHours / resolvedList.length).toFixed(1)) : 0;

  // Map category counts with labels
  const categories = await prisma.supportRequestCategory.findMany();
  const categoryDistribution = categories.map((cat) => {
    const found = categoryCounts.find((c) => c.categoryId === cat.id);
    return {
      id: cat.id,
      code: cat.code,
      nameBn: cat.nameBn,
      count: found ? found._count.id : 0,
    };
  });

  return {
    totalRequests,
    openRequests,
    newToday,
    underReview,
    inProgress,
    waitingForInfo,
    urgentRequests,
    resolvedToday,
    slaBreachedCount,
    avgResolutionHours,
    categoryDistribution,
    statusDistribution: statusCounts.map((s) => ({
      status: s.status,
      statusBn: STATUS_LABELS_BN[s.status] || s.status,
      count: s._count.id,
    })),
    recentRequests,
  };
}
