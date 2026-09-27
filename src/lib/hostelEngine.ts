import { prisma } from "./prisma";
import { recordAuditLog } from "./security";
import { dispatchNotification } from "./communicationEngine";

// =================================================================
// 1. SEQUENCE & CODE GENERATORS
// =================================================================

/**
 * Concurrency-safe Residential Request Number Generator
 * Format: EHRJ-HRQ-YYYY-XXXXXX
 */
export async function generateNextResidentialRequestNumber(txClient?: any): Promise<string> {
  const db = txClient || prisma;
  const currentYear = new Date().getFullYear();

  const seqRecord = await db.residentialRequestSequence.upsert({
    where: { year: currentYear },
    create: { year: currentYear, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
  });

  const seqNumber = String(seqRecord.lastSeq).padStart(6, "0");
  return `EHRJ-HRQ-${currentYear}-${seqNumber}`;
}

// =================================================================
// 2. TYPES & INTERFACES
// =================================================================

export interface CreateResidentialEnrollmentParams {
  studentId: string;
  sessionId?: string;
  residentialStatus: "RESIDENTIAL" | "DAY_CARE" | "NON_RESIDENTIAL";
  roomOrWardLabel?: string;
  bedOrSeatLabel?: string;
  expectedEndDate?: Date;
  notes?: string;
  adminUserId: string;
  autoCheckIn?: boolean;
}

export interface CheckInResidentParams {
  studentId: string;
  sessionId?: string;
  effectiveDate?: Date;
  roomOrWardLabel?: string;
  bedOrSeatLabel?: string;
  notes?: string;
  adminUserId: string;
}

export interface CheckOutResidentParams {
  studentId: string;
  sessionId?: string;
  checkOutDate?: Date;
  reason: string;
  notes?: string;
  adminUserId: string;
}

export interface ChangeResidentialStatusParams {
  studentId: string;
  sessionId?: string;
  targetStatus: "RESIDENTIAL" | "DAY_CARE" | "NON_RESIDENTIAL";
  effectiveDate?: Date;
  reason: string;
  notes?: string;
  adminUserId: string;
}

export interface SubmitResidentialRequestParams {
  studentId: string;
  guardianUserId: string;
  requestType: "ADMISSION" | "STATUS_CHANGE" | "CHECKOUT" | "LEAVE";
  requestedStatus: "RESIDENTIAL" | "DAY_CARE" | "NON_RESIDENTIAL";
  reason: string;
  sessionId?: string;
}

export interface ReviewResidentialRequestParams {
  requestId: string;
  action: "APPROVE" | "REJECT";
  adminNotes?: string;
  adminUserId: string;
  effectiveDate?: Date;
}

// =================================================================
// 3. ENROLLMENT & CHECK-IN WORKFLOWS
// =================================================================

/**
 * Creates or updates a student's residential enrollment for a given academic session.
 */
export async function createResidentialEnrollment(params: CreateResidentialEnrollmentParams) {
  const {
    studentId,
    residentialStatus,
    roomOrWardLabel,
    bedOrSeatLabel,
    expectedEndDate,
    notes,
    adminUserId,
    autoCheckIn = false,
  } = params;

  const now = new Date();

  const { enrollment, student, previousStatus, sessionId } = await prisma.$transaction(
    async (tx) => {
      // 1. Resolve Session
      let sessId = params.sessionId;
      if (!sessId) {
        const currentSession = await tx.academicSession.findFirst({ where: { isCurrent: true } });
        if (!currentSession) throw new Error("কোনো সক্রিয় শিক্ষাবর্ষ পাওয়া যায়নি।");
        sessId = currentSession.id;
      }

      // 2. Validate Student
      const studentRec = await tx.student.findUnique({
        where: { id: studentId },
        include: {
          guardianLinks: { include: { guardian: { include: { user: true } } } },
        },
      });
      if (!studentRec) throw new Error("শিক্ষার্থীর তথ্য পাওয়া যায়নি।");

      const prevStatus = studentRec.residentialStatus;
      const initialStatus = autoCheckIn ? "CHECKED_IN" : "APPROVED";

      // 3. Upsert Residential Enrollment
      const enroll = await tx.residentialEnrollment.upsert({
        where: {
          studentId_sessionId: { studentId, sessionId: sessId },
        },
        create: {
          studentId,
          sessionId: sessId,
          residentialStatus,
          status: initialStatus,
          admissionDate: now,
          checkInDate: autoCheckIn ? now : null,
          expectedEndDate,
          roomOrWardLabel,
          bedOrSeatLabel,
          notes,
          createdById: adminUserId,
        },
        update: {
          residentialStatus,
          status: initialStatus,
          checkInDate: autoCheckIn ? now : undefined,
          roomOrWardLabel: roomOrWardLabel !== undefined ? roomOrWardLabel : undefined,
          bedOrSeatLabel: bedOrSeatLabel !== undefined ? bedOrSeatLabel : undefined,
          notes,
        },
      });

      // 4. Update Student Authoritative Status if autoCheckIn or if status changed
      if (autoCheckIn || prevStatus !== residentialStatus) {
        await tx.student.update({
          where: { id: studentId },
          data: { residentialStatus },
        });

        // 5. Append Immutable Residential History
        await tx.residentialHistory.create({
          data: {
            studentId,
            enrollmentId: enroll.id,
            sessionId: sessId,
            previousStatus: prevStatus,
            newStatus: residentialStatus,
            effectiveDate: now,
            reason: autoCheckIn ? "CHECK_IN" : "ADMISSION",
            notes: notes || "হোস্টেল ভর্তি ও আবাসিক অনুমোদন",
            recordedByUserId: adminUserId,
          },
        });
      }

      return { enrollment: enroll, student: studentRec, previousStatus: prevStatus, sessionId: sessId };
    },
    { timeout: 15000, maxWait: 10000 }
  );

  // 6. Record Audit Log (outside transaction)
  try {
    await recordAuditLog({
      userId: adminUserId,
      action: "CREATE",
      entityType: "ResidentialEnrollment",
      entityId: enrollment.id,
      details: {
        studentId,
        studentNameBn: student.fullNameBn,
        sessionId,
        residentialStatus,
        autoCheckIn,
      },
    });
  } catch (e) {
    console.error("Audit log error in createResidentialEnrollment:", e);
  }

  // 7. Dispatch Notification if autoCheckIn (outside transaction)
  if (autoCheckIn) {
    const guardian = student.guardianLinks[0]?.guardian;
    if (guardian?.user?.id) {
      try {
        await dispatchNotification({
          templateCode: "RESIDENTIAL_CHECKIN_COMPLETED",
          variables: {
            "guardian.name": guardian.fullNameBn,
            "student.nameBn": student.fullNameBn,
            effectiveDate: now.toISOString().split("T")[0],
          },
          recipients: [{
            userId: guardian.user.id,
            name: guardian.fullNameBn,
            email: guardian.email || null,
            role: "GUARDIAN",
          }],
          relatedEntityType: "ResidentialEnrollment",
          relatedEntityId: enrollment.id,
          idempotencyBaseKey: `RES_CHECKIN_${studentId}_${now.toISOString().split("T")[0]}`,
          priority: "IMPORTANT",
        });
      } catch (e) {
        // Non-blocking notification
      }
    }
  }

  return enrollment;
}

/**
 * Transactional Check-In
 * Marks student as active resident and updates authoritative student state.
 */
export async function checkInResident(params: CheckInResidentParams) {
  const { studentId, roomOrWardLabel, bedOrSeatLabel, notes, adminUserId } = params;
  const effectiveDate = params.effectiveDate || new Date();

  const { enrollment, student, previousStatus, targetResidentialStatus } = await prisma.$transaction(
    async (tx) => {
      // 1. Resolve Session
      let sessionId = params.sessionId;
      if (!sessionId) {
        const currentSession = await tx.academicSession.findFirst({ where: { isCurrent: true } });
        if (!currentSession) throw new Error("কোনো সক্রিয় শিক্ষাবর্ষ পাওয়া যায়নি।");
        sessionId = currentSession.id;
      }

      // 2. Validate Student
      const studentRec = await tx.student.findUnique({
        where: { id: studentId },
        include: {
          guardianLinks: { include: { guardian: { include: { user: true } } } },
        },
      });
      if (!studentRec) throw new Error("শিক্ষার্থীর তথ্য পাওয়া যায়নি।");

      // 3. Find or Create Enrollment
      let enroll = await tx.residentialEnrollment.findUnique({
        where: { studentId_sessionId: { studentId, sessionId } },
      });

      if (enroll && enroll.status === "CHECKED_IN") {
        throw new Error("এই শিক্ষার্থী ইতিমধ্যে হোস্টেলে চেক-ইন অবস্থায় রয়েছে।");
      }

      const prevStatus = studentRec.residentialStatus;
      const targetResStatus = "RESIDENTIAL";

      if (!enroll) {
        enroll = await tx.residentialEnrollment.create({
          data: {
            studentId,
            sessionId,
            residentialStatus: targetResStatus,
            status: "CHECKED_IN",
            admissionDate: effectiveDate,
            checkInDate: effectiveDate,
            roomOrWardLabel,
            bedOrSeatLabel,
            notes,
            createdById: adminUserId,
          },
        });
      } else {
        enroll = await tx.residentialEnrollment.update({
          where: { id: enroll.id },
          data: {
            status: "CHECKED_IN",
            residentialStatus: targetResStatus,
            checkInDate: effectiveDate,
            checkOutDate: null,
            roomOrWardLabel: roomOrWardLabel || enroll.roomOrWardLabel,
            bedOrSeatLabel: bedOrSeatLabel || enroll.bedOrSeatLabel,
            notes: notes || enroll.notes,
          },
        });
      }

      // 4. Update Student Authoritative State
      await tx.student.update({
        where: { id: studentId },
        data: { residentialStatus: targetResStatus },
      });

      // 5. Immutable Residential History
      await tx.residentialHistory.create({
        data: {
          studentId,
          enrollmentId: enroll.id,
          sessionId,
          previousStatus: prevStatus,
          newStatus: targetResStatus,
          effectiveDate,
          reason: "CHECK_IN",
          notes: notes || "হোস্টেল চেক-ইন সম্পন্ন",
          recordedByUserId: adminUserId,
        },
      });

      return {
        enrollment: enroll,
        student: studentRec,
        previousStatus: prevStatus,
        targetResidentialStatus: targetResStatus,
      };
    },
    { timeout: 15000, maxWait: 10000 }
  );

  // 6. Audit Log (outside transaction)
  try {
    await recordAuditLog({
      userId: adminUserId,
      action: "UPDATE",
      entityType: "ResidentialEnrollment",
      entityId: enrollment.id,
      details: {
        action: "CHECK_IN",
        studentId,
        previousStatus,
        newStatus: targetResidentialStatus,
        effectiveDate: effectiveDate.toISOString(),
      },
    });
  } catch (e) {
    console.error("Audit log error in checkInResident:", e);
  }

  // 7. Phase 8 Notification (outside transaction)
  const guardian = student.guardianLinks[0]?.guardian;
  if (guardian?.user?.id) {
    try {
      await dispatchNotification({
        templateCode: "RESIDENTIAL_CHECKIN_COMPLETED",
        variables: {
          "guardian.name": guardian.fullNameBn,
          "student.nameBn": student.fullNameBn,
          effectiveDate: effectiveDate.toISOString().split("T")[0],
        },
        recipients: [{
          userId: guardian.user.id,
          name: guardian.fullNameBn,
          email: guardian.email || null,
          role: "GUARDIAN",
        }],
        relatedEntityType: "ResidentialEnrollment",
        relatedEntityId: enrollment.id,
        idempotencyBaseKey: `RES_CHECKIN_${studentId}_${effectiveDate.toISOString().split("T")[0]}`,
        priority: "IMPORTANT",
      });
    } catch (e) {
      // Non-blocking notification
    }
  }

  return enrollment;
}

/**
 * Transactional Check-Out
 * Releases student from hostel, sets non-residential status, and preserves historical billing.
 */
export async function checkOutResident(params: CheckOutResidentParams) {
  const { studentId, reason, notes, adminUserId } = params;
  const checkOutDate = params.checkOutDate || new Date();

  const { updatedEnrollment, student, previousStatus, targetStatus } = await prisma.$transaction(
    async (tx) => {
      // 1. Resolve Session
      let sessionId = params.sessionId;
      if (!sessionId) {
        const currentSession = await tx.academicSession.findFirst({ where: { isCurrent: true } });
        if (!currentSession) throw new Error("কোনো সক্রিয় শিক্ষাবর্ষ পাওয়া যায়নি।");
        sessionId = currentSession.id;
      }

      // 2. Validate Student
      const studentRec = await tx.student.findUnique({
        where: { id: studentId },
        include: {
          guardianLinks: { include: { guardian: { include: { user: true } } } },
        },
      });
      if (!studentRec) throw new Error("শিক্ষার্থীর তথ্য পাওয়া যায়নি।");

      // 3. Find Enrollment
      const enrollment = await tx.residentialEnrollment.findUnique({
        where: { studentId_sessionId: { studentId, sessionId } },
      });

      if (!enrollment || enrollment.status === "CHECKED_OUT") {
        throw new Error("এই শিক্ষার্থী বর্তমানে আবাসিক হোস্টেলে সক্রিয় নয় বা ইতিমধ্যে চেক-আউট করা হয়েছে।");
      }

      const prevStatus = studentRec.residentialStatus;
      const targetResidentialStatus = "NON_RESIDENTIAL";

      // 4. Update Enrollment Status
      const updated = await tx.residentialEnrollment.update({
        where: { id: enrollment.id },
        data: {
          status: "CHECKED_OUT",
          checkOutDate,
          notes: notes ? `${enrollment.notes || ""}\n[Check-out]: ${notes}` : enrollment.notes,
        },
      });

      // 5. Update Student Authoritative Status
      await tx.student.update({
        where: { id: studentId },
        data: { residentialStatus: targetResidentialStatus },
      });

      // 6. Record Immutable History
      await tx.residentialHistory.create({
        data: {
          studentId,
          enrollmentId: enrollment.id,
          sessionId,
          previousStatus: prevStatus,
          newStatus: targetResidentialStatus,
          effectiveDate: checkOutDate,
          reason: reason || "CHECK_OUT",
          notes: notes || "হোস্টেল চেক-আউট সম্পন্ন",
          recordedByUserId: adminUserId,
        },
      });

      return {
        updatedEnrollment: updated,
        student: studentRec,
        previousStatus: prevStatus,
        targetStatus: targetResidentialStatus,
      };
    },
    { timeout: 15000, maxWait: 10000 }
  );

  // 7. Audit Log (outside transaction)
  try {
    await recordAuditLog({
      userId: adminUserId,
      action: "UPDATE",
      entityType: "ResidentialEnrollment",
      entityId: updatedEnrollment.id,
      details: {
        action: "CHECK_OUT",
        studentId,
        previousStatus,
        newStatus: targetStatus,
        reason,
        checkOutDate: checkOutDate.toISOString(),
      },
    });
  } catch (e) {
    console.error("Audit log error in checkOutResident:", e);
  }

  // 8. Phase 8 Notification (outside transaction)
  const guardian = student.guardianLinks[0]?.guardian;
  if (guardian?.user?.id) {
    try {
      await dispatchNotification({
        templateCode: "RESIDENTIAL_CHECKOUT_COMPLETED",
        variables: {
          "guardian.name": guardian.fullNameBn,
          "student.nameBn": student.fullNameBn,
          checkOutDate: checkOutDate.toISOString().split("T")[0],
          reason: reason || "হোস্টেল চেক-আউট",
        },
        recipients: [{
          userId: guardian.user.id,
          name: guardian.fullNameBn,
          email: guardian.email || null,
          role: "GUARDIAN",
        }],
        relatedEntityType: "ResidentialEnrollment",
        relatedEntityId: updatedEnrollment.id,
        idempotencyBaseKey: `RES_CHECKOUT_${studentId}_${checkOutDate.toISOString().split("T")[0]}`,
        priority: "IMPORTANT",
      });
    } catch (e) {
      // Non-blocking notification
    }
  }

  return updatedEnrollment;
}

/**
 * Controlled Residential Status Transition
 * Supports transitions: NON_RESIDENTIAL <-> RESIDENTIAL, DAY_CARE <-> RESIDENTIAL, etc.
 */
export async function changeResidentialStatus(params: ChangeResidentialStatusParams) {
  const { studentId, targetStatus, reason, notes, adminUserId } = params;
  const effectiveDate = params.effectiveDate || new Date();

  const { student, previousStatus, enrollment } = await prisma.$transaction(
    async (tx) => {
      // 1. Resolve Session
      let sessionId = params.sessionId;
      if (!sessionId) {
        const currentSession = await tx.academicSession.findFirst({ where: { isCurrent: true } });
        if (!currentSession) throw new Error("কোনো সক্রিয় শিক্ষাবর্ষ পাওয়া যায়নি।");
        sessionId = currentSession.id;
      }

      // 2. Validate Student
      const studentRec = await tx.student.findUnique({
        where: { id: studentId },
        include: {
          guardianLinks: { include: { guardian: { include: { user: true } } } },
        },
      });
      if (!studentRec) throw new Error("শিক্ষার্থীর তথ্য পাওয়া যায়নি।");

      const prevStatus = studentRec.residentialStatus;
      if (prevStatus === targetStatus) {
        throw new Error(`শিক্ষার্থী ইতিমধ্যে এই স্ট্যাটাসে (${targetStatus}) বিদ্যমান।`);
      }

      // 3. Update or Upsert Enrollment
      let enroll = await tx.residentialEnrollment.findUnique({
        where: { studentId_sessionId: { studentId, sessionId } },
      });

      const isResident = targetStatus === "RESIDENTIAL";
      const enrollmentStatus = isResident ? "CHECKED_IN" : (targetStatus === "DAY_CARE" ? "ACTIVE" : "CHECKED_OUT");

      if (!enroll) {
        enroll = await tx.residentialEnrollment.create({
          data: {
            studentId,
            sessionId,
            residentialStatus: targetStatus,
            status: enrollmentStatus,
            admissionDate: effectiveDate,
            checkInDate: isResident ? effectiveDate : null,
            checkOutDate: !isResident && prevStatus === "RESIDENTIAL" ? effectiveDate : null,
            notes,
            createdById: adminUserId,
          },
        });
      } else {
        enroll = await tx.residentialEnrollment.update({
          where: { id: enroll.id },
          data: {
            residentialStatus: targetStatus,
            status: enrollmentStatus,
            checkInDate: isResident ? (enroll.checkInDate || effectiveDate) : enroll.checkInDate,
            checkOutDate: !isResident && prevStatus === "RESIDENTIAL" ? effectiveDate : enroll.checkOutDate,
            notes: notes ? `${enroll.notes || ""}\n[Status Change]: ${notes}` : enroll.notes,
          },
        });
      }

      // 4. Update Student Authoritative Status
      await tx.student.update({
        where: { id: studentId },
        data: { residentialStatus: targetStatus },
      });

      // 5. Append Immutable Residential History
      await tx.residentialHistory.create({
        data: {
          studentId,
          enrollmentId: enroll.id,
          sessionId,
          previousStatus: prevStatus,
          newStatus: targetStatus,
          effectiveDate,
          reason: reason || "STATUS_CHANGE",
          notes: notes || `আবাসিক স্ট্যাটাস পরিবর্তন: ${prevStatus} -> ${targetStatus}`,
          recordedByUserId: adminUserId,
        },
      });

      return { student: studentRec, previousStatus: prevStatus, enrollment: enroll };
    },
    { timeout: 15000, maxWait: 10000 }
  );

  // 6. Record Audit Log (outside transaction)
  try {
    await recordAuditLog({
      userId: adminUserId,
      action: "UPDATE",
      entityType: "Student",
      entityId: studentId,
      details: {
        field: "residentialStatus",
        previousStatus,
        newStatus: targetStatus,
        reason,
        effectiveDate: effectiveDate.toISOString(),
      },
    });
  } catch (e) {
    console.error("Audit log error in changeResidentialStatus:", e);
  }

  // 7. Phase 8 Notification (outside transaction)
  const guardian = student.guardianLinks[0]?.guardian;
  if (guardian?.user?.id) {
    try {
      await dispatchNotification({
        templateCode: "RESIDENTIAL_STATUS_CHANGED",
        variables: {
          "guardian.name": guardian.fullNameBn,
          "student.nameBn": student.fullNameBn,
          previousStatus,
          newStatus: targetStatus,
          effectiveDate: effectiveDate.toISOString().split("T")[0],
        },
        recipients: [{
          userId: guardian.user.id,
          name: guardian.fullNameBn,
          email: guardian.email || null,
          role: "GUARDIAN",
        }],
        relatedEntityType: "Student",
        relatedEntityId: studentId,
        idempotencyBaseKey: `RES_STAT_CHG_${studentId}_${effectiveDate.toISOString().split("T")[0]}_${targetStatus}`,
        priority: "IMPORTANT",
      });
    } catch (e) {
      // Non-blocking notification
    }
  }

  return { studentId, previousStatus, newStatus: targetStatus, enrollment };
}

// =================================================================
// 4. GUARDIAN RESIDENTIAL REQUEST WORKFLOWS
// =================================================================

/**
 * Submits a new residential request from an authenticated Guardian.
 */
export async function submitResidentialRequest(params: SubmitResidentialRequestParams) {
  const { studentId, guardianUserId, requestType, requestedStatus, reason } = params;

  const { request, guardian, requestNumber } = await prisma.$transaction(
    async (tx) => {
      // 1. Resolve Guardian
      const guardianRec = await tx.guardian.findFirst({
        where: {
          OR: [{ userId: guardianUserId }, { phone: guardianUserId }],
        },
        include: { students: true, user: true },
      });
      if (!guardianRec) throw new Error("অভিভাবকের তথ্য পাওয়া যায়নি।");

      // 2. Strict IDOR Authorization Guard: Guardian must be linked to the student
      const isLinked = guardianRec.students.some((gs) => gs.studentId === studentId);
      if (!isLinked) {
        const err: any = new Error("অননুমোদিত অ্যাক্সেস। এই শিক্ষার্থীর জন্য আবেদন দাখিল করার অধিকার আপনার নেই।");
        err.statusCode = 403;
        throw err;
      }

      // 3. Resolve Session
      let sessionId = params.sessionId;
      if (!sessionId) {
        const currentSession = await tx.academicSession.findFirst({ where: { isCurrent: true } });
        if (!currentSession) throw new Error("কোনো সক্রিয় শিক্ষাবর্ষ পাওয়া যায়নি।");
        sessionId = currentSession.id;
      }

      // 4. Fetch Student
      const studentRec = await tx.student.findUnique({ where: { id: studentId } });
      if (!studentRec) throw new Error("শিক্ষার্থীর তথ্য পাওয়া যায়নি।");

      // 5. Prevent Duplicate Pending Request
      const existingPending = await tx.residentialRequest.findFirst({
        where: {
          studentId,
          status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
          requestType,
        },
      });
      if (existingPending) {
        const err: any = new Error("এই শিক্ষার্থীর জন্য ইতিমধ্যেই একটি আবেদন প্রক্রিয়াধীন রয়েছে।");
        err.statusCode = 409;
        throw err;
      }

      // 6. Generate Request Number
      const reqNumber = await generateNextResidentialRequestNumber(tx);

      // 7. Create Request
      const created = await tx.residentialRequest.create({
        data: {
          requestNumber: reqNumber,
          studentId,
          guardianId: guardianRec.id,
          sessionId,
          requestType,
          currentStatus: studentRec.residentialStatus,
          requestedStatus,
          reason,
          status: "SUBMITTED",
        },
        include: { student: true, guardian: true },
      });

      return { request: created, guardian: guardianRec, requestNumber: reqNumber };
    },
    { timeout: 15000, maxWait: 10000 }
  );

  // 8. Record Audit Log (outside transaction)
  try {
    await recordAuditLog({
      userId: guardianUserId,
      action: "CREATE",
      entityType: "ResidentialRequest",
      entityId: request.id,
      details: {
        requestNumber,
        studentId,
        requestType,
        requestedStatus,
      },
    });
  } catch (e) {
    console.error("Audit log error in submitResidentialRequest:", e);
  }

  // 9. Dispatch Confirmation Notification (outside transaction)
  if (guardian.userId) {
    try {
      await dispatchNotification({
        templateCode: "RESIDENTIAL_REQUEST_SUBMITTED",
        variables: {
          "guardian.name": guardian.fullNameBn,
          "request.number": requestNumber,
        },
        recipients: [{
          userId: guardian.userId,
          name: guardian.fullNameBn,
          email: guardian.email || null,
          role: "GUARDIAN",
        }],
        relatedEntityType: "ResidentialRequest",
        relatedEntityId: request.id,
        idempotencyBaseKey: `RES_REQ_SUBMIT_${request.id}`,
        priority: "NORMAL",
      });
    } catch (e) {
      // Non-blocking notification
    }
  }

  return request;
}

/**
 * Reviews and resolves a guardian's residential request (APPROVE or REJECT).
 */
export async function reviewResidentialRequest(params: ReviewResidentialRequestParams) {
  const { requestId, action, adminNotes, adminUserId, effectiveDate = new Date() } = params;

  // 1. Fetch Request
  const request = await prisma.residentialRequest.findUnique({
    where: { id: requestId },
    include: {
      student: true,
      guardian: { include: { user: true } },
    },
  });

  if (!request) throw new Error("আবাসিক আবেদনটি পাওয়া যায়নি।");
  if (request.status !== "SUBMITTED" && request.status !== "UNDER_REVIEW") {
    throw new Error(`এই আবেদনটি ইতিমধ্যে মীমাংসিত হয়েছে (বর্তমান অবস্থা: ${request.status})।`);
  }

  let updatedRequest;
  if (action === "APPROVE") {
    // 2. Perform the approved action
    if (request.requestType === "CHECKOUT") {
      await checkOutResident({
        studentId: request.studentId,
        sessionId: request.sessionId,
        checkOutDate: effectiveDate,
        reason: `অভিভাবকের আবেদনক্রমে চেক-আউট: ${request.reason}`,
        notes: adminNotes,
        adminUserId,
      });
    } else {
      // ADMISSION or STATUS_CHANGE
      const targetStatus = request.requestedStatus as "RESIDENTIAL" | "DAY_CARE" | "NON_RESIDENTIAL";
      await changeResidentialStatus({
        studentId: request.studentId,
        sessionId: request.sessionId,
        targetStatus,
        effectiveDate,
        reason: `অভিভাবকের আবেদনক্রমে স্ট্যাটাস পরিবর্তন: ${request.reason}`,
        notes: adminNotes,
        adminUserId,
      });
    }

    // 3. Finalize Request Record
    updatedRequest = await prisma.residentialRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        adminNotes,
        reviewedByUserId: adminUserId,
        reviewedAt: new Date(),
      },
    });

    // 4. Audit Log
    try {
      await recordAuditLog({
        userId: adminUserId,
        action: "APPROVE",
        entityType: "ResidentialRequest",
        entityId: requestId,
        details: { action: "APPROVE", requestNumber: request.requestNumber },
      });
    } catch (e) {}

    // 5. Notification
    if (request.guardian.user?.id) {
      try {
        await dispatchNotification({
          templateCode: "RESIDENTIAL_ADMISSION_APPROVED",
          variables: {
            "guardian.name": request.guardian.fullNameBn,
            "student.nameBn": request.student.fullNameBn,
            "student.studentId": request.student.studentIdNumber,
          },
          recipients: [{
            userId: request.guardian.user.id,
            name: request.guardian.fullNameBn,
            email: request.guardian.email || null,
            role: "GUARDIAN",
          }],
          relatedEntityType: "ResidentialRequest",
          relatedEntityId: requestId,
          idempotencyBaseKey: `RES_REQ_APPRV_${requestId}`,
          priority: "URGENT",
        });
      } catch (e) {}
    }
  } else {
    // REJECT
    updatedRequest = await prisma.residentialRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        adminNotes,
        reviewedByUserId: adminUserId,
        reviewedAt: new Date(),
      },
    });

    try {
      await recordAuditLog({
        userId: adminUserId,
        action: "REJECT",
        entityType: "ResidentialRequest",
        entityId: requestId,
        details: { action: "REJECT", requestNumber: request.requestNumber, adminNotes },
      });
    } catch (e) {}

    if (request.guardian.user?.id) {
      try {
        await dispatchNotification({
          templateCode: "RESIDENTIAL_REQUEST_REJECTED",
          variables: {
            "guardian.name": request.guardian.fullNameBn,
            "request.number": request.requestNumber,
          },
          recipients: [{
            userId: request.guardian.user.id,
            name: request.guardian.fullNameBn,
            email: request.guardian.email || null,
            role: "GUARDIAN",
          }],
          relatedEntityType: "ResidentialRequest",
          relatedEntityId: requestId,
          idempotencyBaseKey: `RES_REQ_REJ_${requestId}`,
          priority: "IMPORTANT",
        });
      } catch (e) {}
    }
  }

  return updatedRequest;
}

// =================================================================
// 5. DASHBOARD & REPORTING AGGREGATIONS
// =================================================================

/**
 * Computes live, database-derived statistics for the Hostel Dashboard.
 */
export async function getHostelDashboardStats(sessionId?: string) {
  // 1. Resolve Session
  let activeSessionId = sessionId;
  if (!activeSessionId) {
    const currentSession = await prisma.academicSession.findFirst({ where: { isCurrent: true } });
    activeSessionId = currentSession ? currentSession.id : undefined;
  }

  const sessionFilter = activeSessionId ? { sessionId: activeSessionId } : {};

  // 2. Count authoritative student residential statuses
  const totalStudents = await prisma.student.count({ where: { status: "ACTIVE" } });
  const residentialStudents = await prisma.student.count({
    where: { status: "ACTIVE", residentialStatus: "RESIDENTIAL" },
  });
  const dayCareStudents = await prisma.student.count({
    where: { status: "ACTIVE", residentialStatus: "DAY_CARE" },
  });
  const nonResidentialStudents = await prisma.student.count({
    where: { status: "ACTIVE", residentialStatus: "NON_RESIDENTIAL" },
  });

  // 3. Count enrollment operational states
  const activeResidents = await prisma.residentialEnrollment.count({
    where: {
      ...sessionFilter,
      status: { in: ["CHECKED_IN", "ACTIVE"] },
    },
  });

  const pendingCheckIns = await prisma.residentialEnrollment.count({
    where: {
      ...sessionFilter,
      status: "APPROVED",
      checkInDate: null,
    },
  });

  // 4. Today's check-ins and check-outs
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todayCheckIns = await prisma.residentialEnrollment.count({
    where: {
      ...sessionFilter,
      checkInDate: { gte: startOfToday },
    },
  });

  const todayCheckOuts = await prisma.residentialEnrollment.count({
    where: {
      ...sessionFilter,
      checkOutDate: { gte: startOfToday },
    },
  });

  // 5. Pending Guardian Requests
  const pendingRequests = await prisma.residentialRequest.count({
    where: {
      ...sessionFilter,
      status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
    },
  });

  // 6. Financial Summary: Hostel & Food fees billed and due (from Phase 6 FeeInvoice)
  const hostelInvoices = await prisma.feeInvoice.aggregate({
    where: {
      ...sessionFilter,
      feeType: { in: ["HOSTEL", "FOOD"] },
    },
    _sum: {
      netAmount: true,
      paidAmount: true,
      dueAmount: true,
    },
  });

  // 7. Recent Residential History Events
  const recentHistories = await prisma.residentialHistory.findMany({
    where: sessionFilter,
    include: {
      student: { select: { id: true, studentIdNumber: true, fullNameBn: true } },
      recordedByUser: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return {
    totalStudents,
    residentialStudents,
    dayCareStudents,
    nonResidentialStudents,
    activeResidents,
    pendingCheckIns,
    todayCheckIns,
    todayCheckOuts,
    pendingRequests,
    finance: {
      totalBilled: hostelInvoices._sum.netAmount || 0,
      totalPaid: hostelInvoices._sum.paidAmount || 0,
      totalDue: hostelInvoices._sum.dueAmount || 0,
    },
    recentHistories,
  };
}
