import { prisma } from "./prisma";
import { recordAuditLog } from "./security";
import { generateNextInvoiceNumber } from "./feeCalculationService";
import { dispatchNotification } from "./communicationEngine";
import crypto from "crypto";

// =================================================================
// 1. SEQUENCE & CODE GENERATORS
// =================================================================

/**
 * Concurrency-safe Accession Number Generator
 * Format: EHRJ-LIB-YYYY-XXXXXX
 */
export async function generateNextAccessionNumber(txClient?: any): Promise<string> {
  const db = txClient || prisma;
  const currentYear = new Date().getFullYear();

  // Atomically upsert year sequence
  const seqRecord = await db.libraryAccessionSequence.upsert({
    where: { year: currentYear },
    create: { year: currentYear, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
  });

  const seqNumber = String(seqRecord.lastSeq).padStart(6, "0");
  return `EHRJ-LIB-${currentYear}-${seqNumber}`;
}

/**
 * Concurrency-safe Member Number Generator
 * Format: EHRJ-LIB-M-YYYY-XXXX
 */
export async function generateNextMemberNumber(txClient?: any): Promise<string> {
  const db = txClient || prisma;
  const currentYear = new Date().getFullYear();

  const seqRecord = await db.libraryMemberSequence.upsert({
    where: { year: currentYear },
    create: { year: currentYear, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
  });

  const seqNumber = String(seqRecord.lastSeq).padStart(4, "0");
  return `EHRJ-LIB-M-${currentYear}-${seqNumber}`;
}

/**
 * Concurrency-safe Issue Number Generator
 * Format: EHRJ-ISS-YYYY-XXXXXX
 */
export async function generateNextIssueNumber(txClient?: any): Promise<string> {
  const db = txClient || prisma;
  const currentYear = new Date().getFullYear();

  const latest = await db.libraryIssue.findFirst({
    where: { issueNumber: { startsWith: `EHRJ-ISS-${currentYear}-` } },
    orderBy: { issueNumber: "desc" },
    select: { issueNumber: true },
  });

  let maxSeq = 0;
  if (latest?.issueNumber) {
    const parts = latest.issueNumber.split("-");
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num)) maxSeq = num;
  }
  const count = await db.libraryIssue.count();
  const nextSeq = Math.max(maxSeq + 1, count + 1);
  return `EHRJ-ISS-${currentYear}-${String(nextSeq).padStart(6, "0")}`;
}

/**
 * Generates a collision-resistant unique QR token for physical book copy verification
 */
export function generateCopyQrToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

// =================================================================
// 2. CONFIGURATION & RULES ENGINE
// =================================================================

export const DEFAULT_LIBRARY_RULES = [
  {
    memberType: "STUDENT",
    maxBooks: 2,
    loanDays: 14,
    renewalLimit: 1,
    finePerDay: 5.0,
    graceDays: 1,
    lostChargeMultiplier: 1.5,
    damagedChargeDefault: 50.0,
    isActive: true,
  },
  {
    memberType: "TEACHER",
    maxBooks: 5,
    loanDays: 30,
    renewalLimit: 2,
    finePerDay: 0.0,
    graceDays: 3,
    lostChargeMultiplier: 1.2,
    damagedChargeDefault: 50.0,
    isActive: true,
  },
];

/**
 * Ensure baseline rules exist for both STUDENT and TEACHER
 */
export async function ensureDefaultLibraryRules() {
  for (const rule of DEFAULT_LIBRARY_RULES) {
    await prisma.libraryRule.upsert({
      where: { memberType: rule.memberType },
      update: {},
      create: rule,
    });
  }
}

/**
 * Ensure Phase 6 FeeCategory exists for Library Fines
 */
export async function ensureLibraryFeeCategory() {
  const existing = await prisma.feeCategory.findUnique({
    where: { code: "LIBRARY_FINE" },
  });
  if (!existing) {
    return await prisma.feeCategory.create({
      data: {
        code: "LIBRARY_FINE",
        nameBn: "লাইব্রেরি জরিমানা ও প্রতিস্থাপন ফি",
        nameEn: "Library Fine & Replacement Charges",
        defaultAmount: 0,
        isRecurring: false,
      },
    });
  }
  return existing;
}

/**
 * Calculate overdue days and fine amount based on configured rule
 */
export function calculateOverdueFine(dueDate: Date, returnDate: Date = new Date(), rule: { finePerDay: number; graceDays: number }) {
  const due = new Date(dueDate).getTime();
  const ret = new Date(returnDate).getTime();
  const diffDays = Math.floor((ret - due) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return { overdueDays: 0, fineAmount: 0 };
  }

  const overdueDays = diffDays;
  const billableDays = Math.max(0, overdueDays - (rule.graceDays || 0));
  const fineAmount = billableDays * (rule.finePerDay || 0);

  return { overdueDays, fineAmount };
}

// =================================================================
// 3. CORE CIRCULATION OPERATIONS
// =================================================================

export interface IssueBookParams {
  copyId: string;
  memberId: string;
  issuedByUserId: string;
  customLoanDays?: number;
  notes?: string;
}

/**
 * Atomically issue a book copy to a member with strict concurrency protection
 */
export async function issueBookCopy(params: IssueBookParams) {
  const { copyId, memberId, issuedByUserId, customLoanDays, notes } = params;

  return await prisma.$transaction(async (tx) => {
    // 1. Validate Member
    const member = await tx.libraryMember.findUnique({
      where: { id: memberId },
      include: {
        student: true,
        user: true,
        issues: {
          where: { status: { in: ["ISSUED", "OVERDUE"] } },
        },
      },
    });

    if (!member) {
      throw new Error("লাইব্রেরি সদস্য পাওয়া যায়নি।");
    }
    if (member.status !== "ACTIVE") {
      throw new Error("এই সদস্যের লাইব্রেরি কার্ড সক্রিয় নয় (" + member.status + ")।");
    }

    // 2. Fetch Member Rule
    const rule = await tx.libraryRule.findUnique({
      where: { memberType: member.memberType },
    });
    const maxAllowedBooks = member.maxBooks || rule?.maxBooks || 2;
    const loanDays = customLoanDays || rule?.loanDays || 14;

    if (member.issues.length >= maxAllowedBooks) {
      throw new Error(
        `সদস্যের সর্বোচ্চ বই ধার নেওয়ার সীমা (${maxAllowedBooks}টি) পূর্ণ হয়েছে। বর্তমানে ধার রয়েছে: ${member.issues.length}টি।`
      );
    }

    // 3. Concurrency-Safe Atomic Copy Status Transition (AVAILABLE -> ISSUED)
    const updateResult = await tx.libraryBookCopy.updateMany({
      where: {
        id: copyId,
        status: "AVAILABLE",
      },
      data: {
        status: "ISSUED",
      },
    });

    if (updateResult.count === 0) {
      throw new Error("এই বইটি বর্তমানে উপলব্ধ নেই অথবা ইতিমধ্যে অন্য কাউকে ইস্যু করা হয়েছে।");
    }

    // 4. Fetch Book Details
    const copy = await tx.libraryBookCopy.findUnique({
      where: { id: copyId },
      include: { book: true },
    });
    if (!copy) {
      throw new Error("বইয়ের কপির বিবরণ পাওয়া যায়নি।");
    }

    // 5. Generate Issue Number & Due Date
    const issueNumber = await generateNextIssueNumber(tx);
    const now = new Date();
    const dueDate = new Date(now.getTime() + loanDays * 24 * 60 * 60 * 1000);

    const issue = await tx.libraryIssue.create({
      data: {
        issueNumber,
        bookId: copy.bookId,
        copyId: copy.id,
        memberId: member.id,
        issuedByUserId,
        issueDate: now,
        dueDate,
        status: "ISSUED",
        notes,
      },
      include: {
        book: true,
        copy: true,
        member: {
          include: { student: true, user: true },
        },
      },
    });

    // 6. Record Audit Log
    await recordAuditLog({
      userId: issuedByUserId,
      action: "CREATE",
      entityType: "LibraryIssue",
      entityId: issue.id,
      details: {
        issueNumber,
        copyAccessionNo: copy.accessionNo,
        bookTitleBn: copy.book.titleBn,
        memberNumber: member.memberNumber,
        dueDate: dueDate.toISOString(),
      },
    });

    return issue;
  });
}

export interface ReturnBookParams {
  issueId: string;
  returnedByUserId: string;
  condition?: string;
  damageCharge?: number;
  notes?: string;
}

/**
 * Atomically return a book copy, calculate overdue fine, and integrate with Phase 6 Finance
 */
export async function returnBookCopy(params: ReturnBookParams) {
  const { issueId, returnedByUserId, condition, damageCharge = 0, notes } = params;

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch Issue
    const issue = await tx.libraryIssue.findUnique({
      where: { id: issueId },
      include: {
        copy: true,
        book: true,
        member: {
          include: { student: true, user: true },
        },
      },
    });

    if (!issue) {
      throw new Error("ইস্যু সংক্রান্ত তথ্য পাওয়া যায়নি।");
    }
    if (issue.status === "RETURNED") {
      throw new Error("বইটি ইতিমধ্যে সফলভাবে ফেরত গৃহীত হয়েছে।");
    }

    // 2. Fetch Rule for Fine Calculation
    const rule = (await tx.libraryRule.findUnique({
      where: { memberType: issue.member.memberType },
    })) || { finePerDay: 5, graceDays: 1, lostChargeMultiplier: 1.5, damagedChargeDefault: 50 };

    const returnDate = new Date();
    const { overdueDays, fineAmount: overdueFine } = calculateOverdueFine(issue.dueDate, returnDate, rule);
    const totalPayable = overdueFine + (damageCharge > 0 ? damageCharge : 0);

    // 3. If condition specified and changed, record history
    if (condition && condition !== issue.copy.condition) {
      await tx.libraryConditionHistory.create({
        data: {
          copyId: issue.copyId,
          recordedByUserId: returnedByUserId,
          oldCondition: issue.copy.condition,
          newCondition: condition,
          reason: notes || "বই ফেরত গ্রহণের সময় অবস্থা যাচাই",
          chargeAmount: damageCharge > 0 ? damageCharge : null,
        },
      });
    }

    // 4. Update Copy Status
    const newCopyStatus = condition === "DAMAGED" || condition === "REPAIR_REQUIRED" ? "DAMAGED" : "AVAILABLE";
    await tx.libraryBookCopy.update({
      where: { id: issue.copyId },
      data: {
        status: newCopyStatus,
        condition: condition || issue.copy.condition,
      },
    });

    // 5. Integrate with Phase 6 Finance if fine > 0 and member is a Student
    let feeInvoiceId: string | null = null;
    if (totalPayable > 0 && issue.member.studentId) {
      const activeSession = await tx.academicSession.findFirst({
        where: { isCurrent: true },
      });
      const invoiceNumber = await generateNextInvoiceNumber();
      const feeCategory = await ensureLibraryFeeCategory();

      const invoice = await tx.feeInvoice.create({
        data: {
          invoiceNumber,
          studentId: issue.member.studentId,
          sessionId: activeSession ? activeSession.id : "",
          feeType: "LIBRARY_FINE",
          title: `লাইব্রেরি জরিমানা ও চার্জ (${issue.book.titleBn}) - ${issue.issueNumber}`,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          totalAmount: totalPayable,
          discountAmount: 0,
          waiverAmount: 0,
          lateFeeAmount: 0,
          netAmount: totalPayable,
          paidAmount: 0,
          dueAmount: totalPayable,
          fundCode: "GENERAL",
          status: "UNPAID",
          items: {
            create: [
              {
                feeCategoryId: feeCategory.id,
                description: `বিলম্ব জরিমানা: ${overdueFine} টাকা${damageCharge > 0 ? `, ক্ষতিপূরণ: ${damageCharge} টাকা` : ""}`,
                amount: totalPayable,
              },
            ],
          },
        },
      });

      feeInvoiceId = invoice.id;
    }

    // 6. Update Issue Record
    const updatedIssue = await tx.libraryIssue.update({
      where: { id: issue.id },
      data: {
        status: "RETURNED",
        returnDate,
        overdueDays,
        fineAmount: totalPayable,
        invoiceId: feeInvoiceId,
        notes: notes ? (issue.notes ? `${issue.notes} | ${notes}` : notes) : issue.notes,
      },
      include: {
        book: true,
        copy: true,
        member: {
          include: { student: true, user: true },
        },
        invoice: true,
      },
    });

    // 7. Audit Log
    await recordAuditLog({
      userId: returnedByUserId,
      action: "UPDATE",
      entityType: "LibraryIssue",
      entityId: issue.id,
      details: {
        actionType: "RETURN",
        issueNumber: issue.issueNumber,
        copyAccessionNo: issue.copy.accessionNo,
        overdueDays,
        fineAmount: totalPayable,
        feeInvoiceId,
      },
    });

    return updatedIssue;
  });
}

export interface RenewBookParams {
  issueId: string;
  renewedByUserId: string;
  notes?: string;
}

/**
 * Renew an issued book copy respecting loan limits and retaining historical audit
 */
export async function renewBookCopy(params: RenewBookParams) {
  const { issueId, renewedByUserId, notes } = params;

  return await prisma.$transaction(async (tx) => {
    const issue = await tx.libraryIssue.findUnique({
      where: { id: issueId },
      include: {
        member: true,
        copy: true,
        book: true,
      },
    });

    if (!issue) {
      throw new Error("ইস্যু সংক্রান্ত তথ্য পাওয়া যায়নি।");
    }
    if (issue.status !== "ISSUED" && issue.status !== "OVERDUE") {
      throw new Error(`এই বইটি নবায়নযোগ্য নয় (বর্তমান অবস্থা: ${issue.status})।`);
    }

    const rule = (await tx.libraryRule.findUnique({
      where: { memberType: issue.member.memberType },
    })) || { loanDays: 14, renewalLimit: 1 };

    if (issue.renewCount >= rule.renewalLimit) {
      throw new Error(`সর্বোচ্চ নবায়নের সীমা (${rule.renewalLimit} বার) অতিক্রান্ত হয়েছে। বইটি ফেরত দিতে হবে।`);
    }

    const prevDueDate = issue.dueDate;
    const newDueDate = new Date(prevDueDate.getTime() + rule.loanDays * 24 * 60 * 60 * 1000);

    // Record Renewal History
    await tx.libraryRenewal.create({
      data: {
        issueId: issue.id,
        renewedByUserId,
        prevDueDate,
        newDueDate,
        notes,
      },
    });

    // Update Issue
    const updated = await tx.libraryIssue.update({
      where: { id: issue.id },
      data: {
        dueDate: newDueDate,
        renewCount: { increment: 1 },
        status: "ISSUED", // reset from OVERDUE if it was overdue
        overdueDays: 0,
      },
      include: {
        renewals: true,
        book: true,
        copy: true,
        member: {
          include: { student: true, user: true },
        },
      },
    });

    // Audit Log
    await recordAuditLog({
      userId: renewedByUserId,
      action: "UPDATE",
      entityType: "LibraryIssue",
      entityId: issue.id,
      details: {
        actionType: "RENEWAL",
        issueNumber: issue.issueNumber,
        renewCount: updated.renewCount,
        prevDueDate: prevDueDate.toISOString(),
        newDueDate: newDueDate.toISOString(),
      },
    });

    return updated;
  });
}

export interface MarkCopyLostParams {
  copyId: string;
  reportedByUserId: string;
  notes?: string;
  customCharge?: number;
}

/**
 * Mark a copy as LOST, bill replacement fee through Phase 6 Finance, retain historical links
 */
export async function markBookCopyLost(params: MarkCopyLostParams) {
  const { copyId, reportedByUserId, notes, customCharge } = params;

  return await prisma.$transaction(async (tx) => {
    const copy = await tx.libraryBookCopy.findUnique({
      where: { id: copyId },
      include: {
        book: true,
        issues: {
          where: { status: { in: ["ISSUED", "OVERDUE"] } },
          include: { member: { include: { student: true, user: true } } },
        },
      },
    });

    if (!copy) {
      throw new Error("বইয়ের কপি পাওয়া যায়নি।");
    }

    const activeIssue = copy.issues[0];
    const memberType = activeIssue?.member.memberType || "STUDENT";
    const rule = (await tx.libraryRule.findUnique({
      where: { memberType },
    })) || { lostChargeMultiplier: 1.5 };

    const replacementCharge =
      customCharge !== undefined
        ? customCharge
        : (copy.purchasePrice || 100) * (rule.lostChargeMultiplier || 1.5);

    // 1. Update copy status to LOST
    await tx.libraryBookCopy.update({
      where: { id: copy.id },
      data: {
        status: "LOST",
        notes: notes ? (copy.notes ? `${copy.notes} | [হারানো]: ${notes}` : `[হারানো]: ${notes}`) : copy.notes,
      },
    });

    let invoiceId: string | null = null;

    // 2. If there's an active issue, mark it LOST
    if (activeIssue) {
      if (replacementCharge > 0 && activeIssue.member.studentId) {
        const activeSession = await tx.academicSession.findFirst({
          where: { isCurrent: true },
        });
        const invoiceNumber = await generateNextInvoiceNumber();
        const feeCategory = await ensureLibraryFeeCategory();

        const invoice = await tx.feeInvoice.create({
          data: {
            invoiceNumber,
            studentId: activeIssue.member.studentId,
            sessionId: activeSession ? activeSession.id : "",
            feeType: "LIBRARY_FINE",
            title: `হারানো বইয়ের প্রতিস্থাপন মূল্য (${copy.book.titleBn}) - ${copy.accessionNo}`,
            dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            totalAmount: replacementCharge,
            discountAmount: 0,
            waiverAmount: 0,
            lateFeeAmount: 0,
            netAmount: replacementCharge,
            paidAmount: 0,
            dueAmount: replacementCharge,
            fundCode: "GENERAL",
            status: "UNPAID",
            items: {
              create: [
                {
                  feeCategoryId: feeCategory.id,
                  description: `বই হারানো ক্ষতিপূরণ (কপি নং: ${copy.accessionNo})`,
                  amount: replacementCharge,
                },
              ],
            },
          },
        });
        invoiceId = invoice.id;
      }

      await tx.libraryIssue.update({
        where: { id: activeIssue.id },
        data: {
          status: "LOST",
          fineAmount: replacementCharge,
          invoiceId,
          notes: notes ? `${activeIssue.notes || ""} | [হারানো রিপোর্ট]: ${notes}` : activeIssue.notes,
        },
      });
    }

    // 3. Record Audit
    await recordAuditLog({
      userId: reportedByUserId,
      action: "UPDATE",
      entityType: "LibraryBookCopy",
      entityId: copy.id,
      details: {
        actionType: "MARK_LOST",
        accessionNo: copy.accessionNo,
        replacementCharge,
        invoiceId,
      },
    });

    return { copyId: copy.id, replacementCharge, invoiceId };
  });
}

export interface MarkCopyDamagedParams {
  copyId: string;
  reportedByUserId: string;
  description: string;
  chargeAmount?: number;
  setRepair?: boolean;
}

/**
 * Record damage for a physical copy, create condition history, and optional finance invoice
 */
export async function markBookCopyDamaged(params: MarkCopyDamagedParams) {
  const { copyId, reportedByUserId, description, chargeAmount = 0, setRepair = false } = params;

  return await prisma.$transaction(async (tx) => {
    const copy = await tx.libraryBookCopy.findUnique({
      where: { id: copyId },
      include: {
        book: true,
        issues: {
          where: { status: { in: ["ISSUED", "OVERDUE"] } },
          include: { member: { include: { student: true, user: true } } },
        },
      },
    });

    if (!copy) {
      throw new Error("বইয়ের কপি পাওয়া যায়নি।");
    }

    const newStatus = setRepair ? "REPAIR" : "DAMAGED";
    const newCondition = "DAMAGED";

    // 1. Record Condition History
    await tx.libraryConditionHistory.create({
      data: {
        copyId: copy.id,
        recordedByUserId: reportedByUserId,
        oldCondition: copy.condition,
        newCondition,
        reason: description,
        chargeAmount: chargeAmount > 0 ? chargeAmount : null,
      },
    });

    // 2. Update Copy
    await tx.libraryBookCopy.update({
      where: { id: copy.id },
      data: {
        status: newStatus,
        condition: newCondition,
      },
    });

    // 3. If there is an active issue and charge > 0 for a student
    let invoiceId: string | null = null;
    const activeIssue = copy.issues[0];
    if (activeIssue && chargeAmount > 0 && activeIssue.member.studentId) {
      const activeSession = await tx.academicSession.findFirst({
        where: { isCurrent: true },
      });
      const invoiceNumber = await generateNextInvoiceNumber();
      const feeCategory = await ensureLibraryFeeCategory();

      const invoice = await tx.feeInvoice.create({
        data: {
          invoiceNumber,
          studentId: activeIssue.member.studentId,
          sessionId: activeSession ? activeSession.id : "",
          feeType: "LIBRARY_FINE",
          title: `বই ক্ষতিগ্রস্ত জরিমানা (${copy.book.titleBn}) - ${copy.accessionNo}`,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          totalAmount: chargeAmount,
          discountAmount: 0,
          waiverAmount: 0,
          lateFeeAmount: 0,
          netAmount: chargeAmount,
          paidAmount: 0,
          dueAmount: chargeAmount,
          fundCode: "GENERAL",
          status: "UNPAID",
          items: {
            create: [
              {
                feeCategoryId: feeCategory.id,
                description: `বই ক্ষতিগ্রস্ত জরিমানা (কপি নং: ${copy.accessionNo}): ${description}`,
                amount: chargeAmount,
              },
            ],
          },
        },
      });
      invoiceId = invoice.id;

      await tx.libraryIssue.update({
        where: { id: activeIssue.id },
        data: {
          status: "DAMAGED",
          fineAmount: chargeAmount,
          invoiceId,
        },
      });
    }

    // 4. Record Audit
    await recordAuditLog({
      userId: reportedByUserId,
      action: "UPDATE",
      entityType: "LibraryBookCopy",
      entityId: copy.id,
      details: {
        actionType: "MARK_DAMAGED",
        accessionNo: copy.accessionNo,
        description,
        chargeAmount,
        newStatus,
      },
    });

    return { copyId: copy.id, status: newStatus, chargeAmount, invoiceId };
  });
}

// =================================================================
// 4. OVERDUE SCANNER & NOTIFICATION DISPATCHER
// =================================================================

/**
 * Scans active issues, marks overdue, calculates fines, and dispatches notifications
 */
export async function scanAndProcessOverdueIssues() {
  const now = new Date();
  const rules = await prisma.libraryRule.findMany();
  const studentRule = rules.find((r) => r.memberType === "STUDENT") || { finePerDay: 5, graceDays: 1 };
  const teacherRule = rules.find((r) => r.memberType === "TEACHER") || { finePerDay: 0, graceDays: 3 };

  const issues = await prisma.libraryIssue.findMany({
    where: {
      status: { in: ["ISSUED", "OVERDUE"] },
      dueDate: { lt: now },
    },
    include: {
      book: true,
      copy: true,
      member: {
        include: {
          student: {
            include: {
              guardianLinks: {
                include: { guardian: { include: { user: true } } },
              },
            },
          },
          user: true,
        },
      },
    },
  });

  let processedCount = 0;

  for (const issue of issues) {
    const rule = issue.member.memberType === "STUDENT" ? studentRule : teacherRule;
    const { overdueDays, fineAmount } = calculateOverdueFine(issue.dueDate, now, rule);

    await prisma.libraryIssue.update({
      where: { id: issue.id },
      data: {
        status: "OVERDUE",
        overdueDays,
        fineAmount,
      },
    });

    // Notify Member / Guardian via Phase 8 Communication Engine
    const targetUserId = issue.member.memberType === "TEACHER"
      ? issue.member.user?.id
      : issue.member.student?.guardianLinks[0]?.guardian?.userId;

    if (targetUserId) {
      const todayStr = now.toISOString().split("T")[0];
      const idempotencyBaseKey = `LIBRARY_OVERDUE_${issue.id}_${todayStr}`;

      try {
        await dispatchNotification({
          templateCode: "LIBRARY_BOOK_OVERDUE",
          variables: {
            "recipient.name": issue.member.memberType === "TEACHER" ? (issue.member.user?.name || "সম্মানিত শিক্ষক") : (issue.member.student?.fullNameBn || "শিক্ষার্থী"),
            "book.title": issue.book.titleBn,
            "copy.accessionNo": issue.copy.accessionNo,
            "issue.dueDate": issue.dueDate.toISOString().split("T")[0],
          },
          recipients: [{
            userId: targetUserId,
            email: null,
            name: issue.member.user?.name || "Recipient",
            role: issue.member.memberType === "TEACHER" ? "TEACHER" : "GUARDIAN",
          }],
          relatedEntityType: "LibraryIssue",
          relatedEntityId: issue.id,
          idempotencyBaseKey,
          priority: "URGENT",
        });
      } catch (e) {
        // Log & proceed
      }
    }

    processedCount++;
  }

  return { scanned: issues.length, updated: processedCount };
}
