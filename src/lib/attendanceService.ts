import { prisma } from "@/lib/prisma";
import { normalizeAttendanceDate, isWithinCorrectionWindow, DEFAULT_CORRECTION_WINDOW_HOURS } from "./attendanceCalculations";
import { emitDomainEvent, processSingleOutboxEvent } from "./communicationEngine";

export interface AttendanceEntryInput {
  studentId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE";
  leaveReason?: string | null;
  remarks?: string | null;
}

export interface SaveAttendanceSheetInput {
  sessionId: string;
  classId: string;
  sectionId?: string | null;
  date: string | Date;
  records: AttendanceEntryInput[];
  actorUserId: string;
  actorRole: "ADMIN" | "TEACHER" | "PRINCIPAL";
  correctionReason?: string | null;
}

/**
 * Checks if a teacher is authorized to mark or view attendance for a given class/section.
 * Admin and Principal bypass this check.
 */
export async function verifyTeacherClassAssignment(
  teacherUserId: string,
  sessionId: string,
  classId: string,
  sectionId?: string | null
): Promise<boolean> {
  const assignment = await prisma.teacherAssignment.findFirst({
    where: {
      teacherId: teacherUserId,
      sessionId,
      classId,
      ...(sectionId ? { OR: [{ sectionId }, { sectionId: null }] } : {}),
    },
  });

  return !!assignment;
}

/**
 * Checks whether attendance is locked for a specific session, class, section, and date.
 */
export async function isAttendanceLocked(
  sessionId: string,
  classId: string,
  sectionId: string | null | undefined,
  date: Date
): Promise<{ isLocked: boolean; reason?: string | null; lockedAt?: Date | null }> {
  const lock = await prisma.attendanceLock.findFirst({
    where: {
      sessionId,
      classId,
      sectionId: sectionId || null,
      date,
    },
  });

  if (lock && lock.isLocked) {
    return { isLocked: true, reason: lock.reason, lockedAt: lock.lockedAt };
  }

  return { isLocked: false };
}

/**
 * Transactional save/update of an entire attendance sheet for a class/section and date.
 * 
 * Invariants:
 * 1. RBAC & Scoping: Teachers can only mark assigned classes.
 * 2. Locking Guard: Locked sheets cannot be saved/updated by Teachers.
 * 3. Correction Window: Teachers cannot edit records older than allowed window without Admin.
 * 4. Enrollment Check: Only active students enrolled in this session + class + section are eligible.
 * 5. Atomicity: Whole sheet is committed or rolled back together.
 * 6. Audit Logging: AuditLog created inside the transaction.
 */
export async function saveAttendanceSheetTransaction(input: SaveAttendanceSheetInput) {
  const {
    sessionId,
    classId,
    sectionId = null,
    date,
    records,
    actorUserId,
    actorRole,
    correctionReason,
  } = input;

  const normalizedDate = normalizeAttendanceDate(date);

  // 1. RBAC Scoping check for Teachers
  if (actorRole === "TEACHER") {
    const isAssigned = await verifyTeacherClassAssignment(
      actorUserId,
      sessionId,
      classId,
      sectionId
    );

    if (!isAssigned) {
      const err: any = new Error("অননুমোদিত জামাত/শাখা। শুধুমাত্র নির্ধারিত শিক্ষক এই জামাতের হাজিরা পরিচালনা করতে পারেন।");
      err.statusCode = 403;
      throw err;
    }
  }

  // 2. Lock status check
  const lockStatus = await isAttendanceLocked(sessionId, classId, sectionId, normalizedDate);
  if (lockStatus.isLocked && actorRole !== "ADMIN") {
    const err: any = new Error(`এই তারিখের হাজিরা বর্তমানে লক করা আছে (${lockStatus.reason || "অ্যাডমিন লক"})। শিক্ষকের পক্ষে পরিবর্তন সম্ভব নয়।`);
    err.statusCode = 423; // Locked
    throw err;
  }

  // 3. Check existing records for correction window check for Teachers
  const existingRecords = await prisma.attendance.findMany({
    where: {
      sessionId,
      classId,
      sectionId: sectionId || null,
      date: normalizedDate,
    },
  });

  if (existingRecords.length > 0 && actorRole === "TEACHER") {
    const earliestCreated = existingRecords[0].createdAt;
    if (!isWithinCorrectionWindow(earliestCreated, DEFAULT_CORRECTION_WINDOW_HOURS)) {
      const err: any = new Error("হাজিরা সংশোধনের সময়সীমা (২৪ ঘণ্টা) অতিক্রান্ত হয়েছে। অ্যাডমিন অনুমোদন ব্যতীত পরিবর্তন সম্ভব নয়।");
      err.statusCode = 403;
      throw err;
    }
  }

  // 4. Verify all student IDs belong to ACTIVE enrollments in this session, class & section
  const eligibleEnrollments = await prisma.enrollment.findMany({
    where: {
      sessionId,
      classId,
      ...(sectionId ? { sectionId } : {}),
      status: "ACTIVE",
    },
    select: {
      studentId: true,
      rollNumber: true,
      student: { select: { id: true, fullNameBn: true, status: true } },
      jamatClass: { select: { id: true, nameBn: true } },
    },
  });

  const eligibleStudentMap = new Map(
    eligibleEnrollments
      .filter((e) => e.student.status === "ACTIVE")
      .map((e) => [e.studentId, e])
  );

  // Filter out any invalid student records
  const validRecords = records.filter((r) => eligibleStudentMap.has(r.studentId));
  if (validRecords.length === 0) {
    throw new Error("হাজিরা সংরক্ষণের জন্য কোনো বৈধ তালিকাভুক্ত শিক্ষার্থী পাওয়া যায়নি।");
  }

  // 5. Execute atomic transaction
  const result = await prisma.$transaction(async (tx) => {
    let createdCount = 0;
    let updatedCount = 0;
    const statusChanges: any[] = [];
    const queuedOutboxIds: string[] = [];
    const formattedDate = normalizedDate.toISOString().split("T")[0];

    for (const item of validRecords) {
      const existing = await tx.attendance.findUnique({
        where: {
          studentId_date: {
            studentId: item.studentId,
            date: normalizedDate,
          },
        },
      });

      if (existing) {
        if (existing.status !== item.status || existing.leaveReason !== (item.leaveReason || null)) {
          statusChanges.push({
            studentId: item.studentId,
            oldStatus: existing.status,
            newStatus: item.status,
            oldLeaveReason: existing.leaveReason,
            newLeaveReason: item.leaveReason,
          });

          await tx.attendance.update({
            where: { id: existing.id },
            data: {
              status: item.status,
              leaveReason: item.status === "LEAVE" ? item.leaveReason || null : null,
              remarks: item.remarks || existing.remarks,
              updatedByUserId: actorUserId,
              correctionReason: correctionReason || existing.correctionReason,
              updatedAt: new Date(),
            },
          });
          updatedCount++;

          // Alert on transition to ABSENT
          if (item.status === "ABSENT" && existing.status !== "ABSENT") {
            const enr = eligibleStudentMap.get(item.studentId);
            const outbox = await emitDomainEvent({
              eventType: "ATTENDANCE_ABSENT_ALERT",
              entityType: "Attendance",
              entityId: existing.id,
              payload: {
                studentId: item.studentId,
                studentNameBn: enr?.student.fullNameBn || "শিক্ষার্থী",
                className: enr?.jamatClass?.nameBn || "জামাত",
                roll: enr?.rollNumber || "",
                date: formattedDate,
                attendanceId: existing.id,
              },
              idempotencyKey: `attendance-absent-${item.studentId}-${formattedDate}`,
              tx,
            });
            queuedOutboxIds.push(outbox.id);
          }
        }
      } else {
        const created = await tx.attendance.create({
          data: {
            studentId: item.studentId,
            sessionId,
            classId,
            sectionId: sectionId || null,
            date: normalizedDate,
            status: item.status,
            leaveReason: item.status === "LEAVE" ? item.leaveReason || null : null,
            remarks: item.remarks || null,
            markedByUserId: actorUserId,
            updatedByUserId: actorUserId,
          },
        });
        createdCount++;

        // Alert on new ABSENT
        if (item.status === "ABSENT") {
          const enr = eligibleStudentMap.get(item.studentId);
          const outbox = await emitDomainEvent({
            eventType: "ATTENDANCE_ABSENT_ALERT",
            entityType: "Attendance",
            entityId: created.id,
            payload: {
              studentId: item.studentId,
              studentNameBn: enr?.student.fullNameBn || "শিক্ষার্থী",
              className: enr?.jamatClass?.nameBn || "জামাত",
              roll: enr?.rollNumber || "",
              date: formattedDate,
              attendanceId: created.id,
            },
            idempotencyKey: `attendance-absent-${item.studentId}-${formattedDate}`,
            tx,
          });
          queuedOutboxIds.push(outbox.id);
        }
      }
    }

    // Record audit log
    await tx.auditLog.create({
      data: {
        userId: actorUserId,
        action: existingRecords.length > 0 ? "ATTENDANCE_UPDATE" : "ATTENDANCE_CREATE",
        entityType: "AttendanceSheet",
        entityId: `${sessionId}_${classId}_${sectionId || "ALL"}_${formattedDate}`,
        detailsJson: JSON.stringify({
          sessionId,
          classId,
          sectionId,
          date: formattedDate,
          createdCount,
          updatedCount,
          totalRecords: validRecords.length,
          statusChangesCount: statusChanges.length,
          actorRole,
          correctionReason,
        }),
      },
    });

    return {
      success: true,
      date: formattedDate,
      totalStudents: validRecords.length,
      createdCount,
      updatedCount,
      statusChanges,
      queuedOutboxIds,
    };
  });

  // Post-commit outbox processing (failsafe, non-blocking)
  if (result.queuedOutboxIds && result.queuedOutboxIds.length > 0) {
    for (const outboxId of result.queuedOutboxIds) {
      processSingleOutboxEvent(outboxId).catch((err) =>
        console.error("Attendance outbox processing caught error:", err)
      );
    }
  }

  return {
    success: result.success,
    date: result.date,
    totalStudents: result.totalStudents,
    createdCount: result.createdCount,
    updatedCount: result.updatedCount,
    statusChanges: result.statusChanges,
  };
}

/**
 * Admin correction for a single attendance record with mandatory reason.
 */
export async function adminCorrectAttendanceRecord(input: {
  attendanceId: string;
  newStatus: "PRESENT" | "ABSENT" | "LATE" | "LEAVE";
  leaveReason?: string | null;
  correctionReason: string;
  adminUserId: string;
}) {
  const { attendanceId, newStatus, leaveReason, correctionReason, adminUserId } = input;

  if (!correctionReason || !correctionReason.trim()) {
    throw new Error("হাজিরা সংশোধনের সুনির্দিষ্ট কারণ উল্লেখ করা বাধ্যতামূলক।");
  }

  const existing = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    include: { student: true, jamatClass: true },
  });

  if (!existing) {
    throw new Error("হাজিরা রেকর্ডটি খুঁজে পাওয়া যায়নি।");
  }

  const oldStatus = existing.status;
  const formattedDate = existing.date.toISOString().split("T")[0];

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.attendance.update({
      where: { id: attendanceId },
      data: {
        status: newStatus,
        leaveReason: newStatus === "LEAVE" ? leaveReason || null : null,
        correctionReason: correctionReason.trim(),
        updatedByUserId: adminUserId,
        updatedAt: new Date(),
      },
    });

    let outboxId: string | null = null;
    if (newStatus === "ABSENT" && oldStatus !== "ABSENT") {
      const outbox = await emitDomainEvent({
        eventType: "ATTENDANCE_ABSENT_ALERT",
        entityType: "Attendance",
        entityId: attendanceId,
        payload: {
          studentId: existing.studentId,
          studentNameBn: existing.student.fullNameBn,
          className: existing.jamatClass?.nameBn || "জামাত",
          roll: "",
          date: formattedDate,
          attendanceId,
        },
        idempotencyKey: `attendance-absent-${existing.studentId}-${formattedDate}`,
        tx,
      });
      outboxId = outbox.id;
    }

    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: "ATTENDANCE_ADMIN_CORRECT",
        entityType: "Attendance",
        entityId: attendanceId,
        detailsJson: JSON.stringify({
          studentId: existing.studentId,
          studentName: existing.student.fullNameBn,
          date: formattedDate,
          oldStatus,
          newStatus,
          correctionReason: correctionReason.trim(),
        }),
      },
    });

    return { updated, outboxId };
  });

  if (result.outboxId) {
    processSingleOutboxEvent(result.outboxId).catch((err) =>
      console.error("Admin attendance correction outbox processing error:", err)
    );
  }

  return result.updated;
}

/**
 * Locks or unlocks an attendance sheet for a session, class, section, and date.
 */
export async function setAttendanceLockState(input: {
  sessionId: string;
  classId: string;
  sectionId?: string | null;
  date: string | Date;
  isLocked: boolean;
  reason?: string;
  adminUserId: string;
}) {
  const { sessionId, classId, sectionId = null, date, isLocked, reason, adminUserId } = input;
  const normalizedDate = normalizeAttendanceDate(date);

  return await prisma.$transaction(async (tx) => {
    const existingLock = await tx.attendanceLock.findFirst({
      where: {
        sessionId,
        classId,
        sectionId: sectionId || null,
        date: normalizedDate,
      },
    });

    let lockRecord;
    if (existingLock) {
      lockRecord = await tx.attendanceLock.update({
        where: { id: existingLock.id },
        data: {
          isLocked,
          reason: reason || existingLock.reason,
          ...(isLocked
            ? { lockedAt: new Date(), lockedByUserId: adminUserId }
            : { unlockedAt: new Date(), unlockedByUserId: adminUserId }),
        },
      });
    } else {
      lockRecord = await tx.attendanceLock.create({
        data: {
          sessionId,
          classId,
          sectionId: sectionId || null,
          date: normalizedDate,
          isLocked,
          reason: reason || null,
          lockedAt: isLocked ? new Date() : null,
          lockedByUserId: isLocked ? adminUserId : null,
          unlockedAt: !isLocked ? new Date() : null,
          unlockedByUserId: !isLocked ? adminUserId : null,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: isLocked ? "ATTENDANCE_LOCK" : "ATTENDANCE_UNLOCK",
        entityType: "AttendanceLock",
        entityId: lockRecord.id,
        detailsJson: JSON.stringify({
          sessionId,
          classId,
          sectionId,
          date: normalizedDate.toISOString().split("T")[0],
          isLocked,
          reason,
        }),
      },
    });

    return lockRecord;
  });
}
