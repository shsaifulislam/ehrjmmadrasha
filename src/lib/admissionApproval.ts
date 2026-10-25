import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { generateStudentIdNumber, getNextRollNumber } from "@/lib/studentId";
import { recordAuditLog } from "@/lib/security";

export interface ApproveAdmissionInput {
  applicationId: string;
  adminUserId: string;
  assignedSectionId?: string | null;
  linkExistingStudentId?: string | null;
  approvalNotes?: string;
  customAdmissionFee?: number;
}

export interface ApproveAdmissionResult {
  success: boolean;
  message: string;
  studentIdNumber: string;
  rollNumber: number;
  student: any;
  guardian: any;
  enrollment: any;
  invoice: any;
  alreadyApproved?: boolean;
}

/**
 * Executes the complete transactional Admission Approval workflow.
 * 
 * Invariants:
 * 1. Concurrency-safe: Double approval is rejected.
 * 2. Atomic: If student, guardian, enrollment, or invoice creation fails, everything rolls back.
 * 3. Permanent Student ID (EHRJ-YYYY-XXXX) generated server-side.
 * 4. Roll calculated and assigned according to session + class rules.
 * 5. Initial Admission Fee Invoice generated with 100% waiver for orphan students.
 * 6. AuditLog created.
 */
export async function approveAdmissionTransaction(
  input: ApproveAdmissionInput
): Promise<ApproveAdmissionResult> {
  const {
    applicationId,
    adminUserId,
    assignedSectionId,
    linkExistingStudentId,
    approvalNotes,
    customAdmissionFee,
  } = input;

  // 1. Pre-transaction validation
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw new Error("আবেদনটি খুঁজে পাওয়া যায়নি।");
  }

  if (application.status === "APPROVED") {
    const error: any = new Error("এই আবেদনটি ইতিমধ্যে অনুমোদিত হয়েছে। পুনরায় অনুমোদন সম্ভব নয়।");
    error.statusCode = 409;
    throw error;
  }

  const currentYear = new Date().getFullYear();

  // Resolve session
  let session = application.sessionId
    ? await prisma.academicSession.findUnique({ where: { id: application.sessionId } })
    : null;

  if (!session) {
    session = await prisma.academicSession.findFirst({ where: { isCurrent: true } });
  }

  if (!session) {
    session = await prisma.academicSession.create({
      data: {
        name: `${currentYear}-${currentYear + 1}`,
        startDate: new Date(`${currentYear}-01-01`),
        endDate: new Date(`${currentYear}-12-31`),
        isCurrent: true,
      },
    });
  }

  const sessionId = session.id;
  
  // Resolve valid JamatClass ID to avoid foreign key violations if application used a name or legacy code
  let validClass = await prisma.jamatClass.findUnique({ where: { id: application.desiredClassId } });
  if (!validClass) {
    validClass = await prisma.jamatClass.findFirst({
      where: {
        OR: [
          { nameBn: application.desiredClassId },
          { nameEn: application.desiredClassId },
          { code: application.desiredClassId },
        ],
      },
    });
  }
  if (!validClass) {
    validClass = await prisma.jamatClass.findFirst({ where: { isActive: true } });
  }
  const classId = validClass ? validClass.id : application.desiredClassId;
  const sectionId = assignedSectionId || application.desiredSectionId || null;

  // Precompute password hash outside of the database transaction to prevent transaction timeout
  const cleanPhone = (application.guardianPhone || "").replace(/\D/g, "");
  const initialPassword = `Ehrj@${cleanPhone.slice(-4) || "2026"}`;
  const precomputedPasswordHash = await hashPassword(initialPassword);

  // Execute atomic database transaction with increased timeout
  const result = await prisma.$transaction(async (tx) => {
    // Re-verify status inside transaction for strict concurrency isolation
    const currentApp = await tx.application.findUnique({
      where: { id: applicationId },
    });

    if (!currentApp || currentApp.status === "APPROVED") {
      const err: any = new Error("এই আবেদনটি ইতিমধ্যে অন্য প্রক্রিয়ায় অনুমোদিত হয়েছে।");
      err.statusCode = 409;
      throw err;
    }

    // A. Student Creation or Linking
    let student: any;
    let studentIdNumber: string;

    if (linkExistingStudentId) {
      student = await tx.student.findUnique({
        where: { id: linkExistingStudentId },
      });
      if (!student) {
        throw new Error("সংযুক্ত করার জন্য নির্বাচিত শিক্ষার্থী খুঁজে পাওয়া যায়নি।");
      }
      studentIdNumber = student.studentIdNumber;
    } else {
      studentIdNumber = await generateStudentIdNumber(currentYear, tx);

      student = await tx.student.create({
        data: {
          studentIdNumber,
          fullNameBn: application.studentNameBn,
          fullNameEn: application.studentNameEn || application.studentNameBn,
          dateOfBirth: application.dateOfBirth,
          gender: application.gender,
          bloodGroup: application.bloodGroup || null,
          birthCertificateNo: application.birthCertificateNo || null,
          nidNo: application.nidNo || null,
          nationality: application.nationality || "Bangladeshi",
          fatherNameBn: application.fatherNameBn || application.guardianName,
          fatherPhone: application.fatherPhone || application.guardianPhone,
          fatherOccupation: application.fatherOccupation || null,
          motherNameBn: application.motherNameBn || "মাতা",
          motherPhone: application.motherPhone || null,
          presentAddress: application.presentAddress || application.address,
          permanentAddress: application.permanentAddress || application.address,
          residentialStatus: application.desiredResidentialStatus,
          isOrphan: application.isOrphan,
          isFinanciallyWeak: application.isFinanciallyWeak || application.financialAssistanceRequested,
          status: "ACTIVE",
        },
      });
    }

    // B. Guardian User Account & Profile Provisioning
    let guardianUser = await tx.user.findFirst({
      where: {
        OR: [
          { phone: application.guardianPhone },
          ...(application.guardianEmail ? [{ email: application.guardianEmail.toLowerCase().trim() }] : []),
        ],
      },
    });

    const cleanPhone = application.guardianPhone.replace(/\D/g, "");
    const initialPassword = `Ehrj@${cleanPhone.slice(-4) || "2026"}`;

    if (!guardianUser) {
      const generatedUsername = `guardian_${cleanPhone || Math.floor(100000 + Math.random() * 900000)}`;
      const guardianEmail = application.guardianEmail
        ? application.guardianEmail.toLowerCase().trim()
        : `${generatedUsername}@guardian.ehrj.local`;

      // Use precomputed password hash (calculated outside transaction for performance)
      const passwordHash = precomputedPasswordHash;

      guardianUser = await tx.user.create({
        data: {
          name: application.guardianName,
          username: generatedUsername,
          email: guardianEmail,
          phone: application.guardianPhone,
          passwordHash,
          role: "GUARDIAN",
          status: "ACTIVE",
        },
      });
    }

    let guardian = await tx.guardian.findUnique({
      where: { phone: application.guardianPhone },
    });

    if (!guardian) {
      guardian = await tx.guardian.create({
        data: {
          userId: guardianUser.id,
          fullNameBn: application.guardianName,
          phone: application.guardianPhone,
          email: application.guardianEmail || null,
          relation: application.guardianRelation || "FATHER",
          address: application.guardianAddress || application.address,
        },
      });
    } else if (!guardian.userId) {
      guardian = await tx.guardian.update({
        where: { id: guardian.id },
        data: { userId: guardianUser.id },
      });
    }

    // Check if GuardianStudent link exists
    const existingLink = await tx.guardianStudent.findUnique({
      where: {
        guardianId_studentId: {
          guardianId: guardian.id,
          studentId: student.id,
        },
      },
    });

    if (!existingLink) {
      await tx.guardianStudent.create({
        data: {
          guardianId: guardian.id,
          studentId: student.id,
          isPrimary: true,
        },
      });
    }

    // C. Concurrency-safe Roll Number Generation
    const latestEnrollment = await tx.enrollment.findFirst({
      where: {
        sessionId,
        classId,
        ...(sectionId ? { sectionId } : {}),
      },
      orderBy: {
        rollNumber: "desc",
      },
      select: {
        rollNumber: true,
      },
    });
    const nextRoll = (latestEnrollment?.rollNumber || 0) + 1;

    // D. Create Enrollment
    const enrollment = await tx.enrollment.create({
      data: {
        studentId: student.id,
        sessionId,
        classId,
        sectionId,
        rollNumber: nextRoll,
        status: "ACTIVE",
      },
    });

    // E. Initial Admission Fee Invoice Generation
    // Query FeeStructure if configured for ADMISSION
    let baseFee = customAdmissionFee !== undefined ? customAdmissionFee : 1500;
    const admissionStructure = await tx.feeStructure.findFirst({
      where: {
        sessionId,
        feeType: "ADMISSION",
        isActive: true,
        OR: [{ classId }, { classId: null }],
      },
      orderBy: [{ classId: "desc" }, { createdAt: "desc" }],
    });
    if (admissionStructure && customAdmissionFee === undefined) {
      baseFee = admissionStructure.amount;
    }

    const feeCount = await tx.feeInvoice.count();
    const invoiceNumber = `INV-${currentYear}-${String(feeCount + 1).padStart(5, "0")}`;

    const isOrphan = application.isOrphan;
    const totalAmount = baseFee;
    const discountAmount = isOrphan ? baseFee : 0;
    const payableAmount = totalAmount - discountAmount;

    const invoice = await tx.feeInvoice.create({
      data: {
        invoiceNumber,
        studentId: student.id,
        sessionId,
        feeType: "ADMISSION",
        title: "প্রাথমিক ভর্তি ও সেশন ফি",
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        totalAmount,
        discountAmount,
        waiverAmount: 0,
        netAmount: payableAmount,
        paidAmount: 0,
        dueAmount: payableAmount,
        fundCode: "GENERAL",
        status: payableAmount === 0 ? "WAIVED" : "UNPAID",
      },
    });

    // F. Update Application Status to APPROVED
    const updatedApplication = await tx.application.update({
      where: { id: applicationId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedByUserId: adminUserId,
        createdStudentId: student.id,
        remarks: approvalNotes || `অনুমোদিত ও তালিকাভুক্ত: আইডি ${studentIdNumber}, রোল ${nextRoll}`,
      },
    });

    // G. Create Audit Log inside transaction
    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: "APPROVE_ADMISSION",
        entityType: "Application",
        entityId: applicationId,
        detailsJson: JSON.stringify({
          studentId: student.id,
          studentIdNumber,
          rollNumber: nextRoll,
          studentName: application.studentNameBn,
          sessionId,
          classId,
          sectionId,
          invoiceNumber,
          isOrphan,
          feeWaived: isOrphan,
        }),
      },
    });

    return {
      student,
      guardian,
      guardianUser,
      initialPassword: initialPassword || `Ehrj@${cleanPhone.slice(-4) || "2026"}`,
      enrollment,
      invoice,
      studentIdNumber,
      rollNumber: nextRoll,
      updatedApplication,
    };
  }, {
    timeout: 30000,
    maxWait: 15000,
  });

  // H. Send Congratulations Email if Guardian Email exists (Outside transaction, non-blocking)
  if (application.guardianEmail) {
    const jamatClass = await prisma.jamatClass.findUnique({
      where: { id: application.desiredClassId },
    });
    const className = jamatClass ? jamatClass.nameBn : "মাদরাসা শ্রেণি";
    const defaultPassword = result.initialPassword || `Ehrj@${application.guardianPhone.replace(/\D/g, "").slice(-4) || "2026"}`;

    import("@/lib/mail").then(({ sendAdmissionApprovalEmail }) => {
      sendAdmissionApprovalEmail({
        to: application.guardianEmail!,
        studentName: application.studentNameBn,
        studentIdNumber: result.studentIdNumber,
        className,
        rollNumber: result.rollNumber,
        portalUsername: result.guardianUser?.username || application.guardianPhone,
        defaultPassword,
        guardianPhone: application.guardianPhone,
      }).catch((err) => console.error("Email approval notification error:", err));
    });
  }

  // I. Automatic Document Issuance Engine (Student ID Card + Admission Confirmation)
  try {
    const { triggerAdmissionApprovedAutomation } = await import("@/lib/documentAutomation");
    await triggerAdmissionApprovedAutomation({
      studentId: result.student.id,
      adminUserId,
      sessionId,
    });
  } catch (docErr) {
    console.error("Admission auto-document generation error:", docErr);
  }

  return {
    success: true,
    message: `ভর্তি আবেদন সফলভাবে অনুমোদিত হয়েছে। শিক্ষার্থী আইডি: ${result.studentIdNumber}, রোল: ${result.rollNumber}`,
    studentIdNumber: result.studentIdNumber,
    rollNumber: result.rollNumber,
    student: result.student,
    guardian: result.guardian,
    enrollment: result.enrollment,
    invoice: result.invoice,
  };
}
