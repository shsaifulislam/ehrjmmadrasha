// backend/src/modules/admission/admission.service.ts

import prisma from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { SubmitAdmissionInput, RejectAdmissionInput } from './admission.schema';
import { AdmissionStatus } from '@prisma/client';
import { logger } from '../../utils/logger';

export class AdmissionService {
  /**
   * Public Online Admission Application Submission
   */
  async submitApplication(input: SubmitAdmissionInput) {
    const targetClass = await prisma.class.findUnique({ where: { id: input.classId } });
    if (!targetClass) throw new AppError('নির্বাচিত শ্রেণী পাওয়া যায়নি', 404);

    const admission = await prisma.admission.create({
      data: {
        applicantName: input.applicantName,
        applicantNameEn: input.applicantNameEn || null,
        fatherName: input.fatherName || null,
        fatherNameEn: input.fatherNameEn || null,
        fatherOccupation: input.fatherOccupation || null,
        motherName: input.motherName || null,
        motherNameEn: input.motherNameEn || null,
        motherPhone: input.motherPhone || null,
        phone: input.phone,
        emergencyPhone: input.emergencyPhone || null,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        gender: input.gender || 'MALE',
        studentType: input.studentType || 'RESIDENTIAL',
        address: input.address || null,
        permanentAddress: input.permanentAddress || null,
        brn: input.brn || null,
        religion: input.religion || null,
        bloodGroup: input.bloodGroup || null,
        guardianNid: input.guardianNid || null,
        previousInstitution: input.previousInstitution || null,
        lastClassResult: input.lastClassResult || null,
        quota: input.quota || null,
        village: input.village || null,
        postOffice: input.postOffice || null,
        upazila: input.upazila || null,
        district: input.district || null,
        verificationToken: (await import('crypto')).randomBytes(16).toString('hex'),
        classId: input.classId,
        photoUrl: input.photoUrl || null,
        birthCertUrl: input.birthCertUrl || null,
        guardianNidUrl: input.guardianNidUrl || null,
        testimonialUrl: input.testimonialUrl || null,
        paymentMethod: input.paymentMethod || null,
        trxId: input.trxId || null,
        paymentSenderPhone: input.paymentSenderPhone || null,
        status: AdmissionStatus.PENDING,
      },
    });

    return admission;
  }

  /**
   * Fetch Admission by Verification Token (Public Verification)
   * Strictly excludes sensitive fields (religion, guardianNid, payment details)
   */
  async getAdmissionByToken(token: string) {
    if (!token || typeof token !== 'string' || token.trim().length < 10) {
      throw new AppError('আবেদনটি পাওয়া যায়নি বা টোকেন সঠিক নয়', 404);
    }

    const admission = await prisma.admission.findFirst({
      where: { verificationToken: token.trim() },
      select: {
        id: true,
        applicantName: true,
        applicantNameEn: true,
        fatherName: true,
        motherName: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        studentType: true,
        brn: true,
        bloodGroup: true,
        previousInstitution: true,
        lastClassResult: true,
        quota: true,
        village: true,
        postOffice: true,
        upazila: true,
        district: true,
        address: true,
        verificationToken: true,
        classId: true,
        status: true,
        applicationDate: true,
        photoUrl: true,
        createdAt: true,
        class: { select: { id: true, name: true } },
      },
    });

    if (!admission) {
      throw new AppError('আবেদনটি পাওয়া যায়নি বা টোকেন সঠিক নয়', 404);
    }
    return admission;
  }

  /**
   * Admin Approval — ATOMIC TRANSACTION
   * 1. Find or create Guardian by phone
   * 2. Get current active session
   * 3. Calculate next roll for target class & session
   * 4. Generate unique studentId (STD-YYYY-XXXX)
   * 5. Create Student record
   * 6. Update Admission status to APPROVED
   * 7. Trigger non-blocking ADMISSION_APPROVED SMS
   */
  async approveAdmission(admissionId: string, adminUserId: string) {
    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      include: { class: true },
    });

    if (!admission) throw new AppError('ভর্তি আবেদন পাওয়া যায়নি', 404);
    if (admission.status === AdmissionStatus.APPROVED) {
      throw new AppError('এই আবেদনটি ইতিমধ্যে অনুমোদিত', 400);
    }

    // Get active academic session
    const activeSession = await prisma.session.findFirst({
      where: { isActive: true, isDeleted: false },
    });
    if (!activeSession) {
      throw new AppError('কোনো সক্রিয় শিক্ষাবর্ষ পাওয়া যায়নি', 400);
    }

    // Execute Atomic Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find or Create Guardian
      let guardian = await tx.guardian.findFirst({
        where: { phone: admission.phone, isDeleted: false },
      });

      if (!guardian) {
        guardian = await tx.guardian.create({
          data: {
            name: admission.fatherName || `অভিভাবক (${admission.applicantName})`,
            phone: admission.phone,
            relation: 'FATHER',
            address: admission.address || null,
          },
        });
      }

      // 2. Calculate next Roll number for target class and session
      const lastStudent = await tx.student.findFirst({
        where: {
          classId: admission.classId,
          sessionId: activeSession.id,
          isDeleted: false,
        },
        orderBy: { roll: 'desc' },
      });

      const nextRoll = lastStudent ? lastStudent.roll + 1 : 1;
      const studentIdCode = `STD-${activeSession.year}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 3. Find STUDENT role & Create User record for Student login
      const studentRole = await tx.role.findFirst({
        where: { name: { in: ['STUDENT', 'Student', 'student'] } },
      });
      if (!studentRole) throw new AppError('ছাত্র রোল নির্ধারণ সম্ভব হয়নি', 500);

      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('12345678', 10);
      const user = await tx.user.create({
        data: {
          username: studentIdCode.toLowerCase(),
          passwordHash: hashedPassword,
          roleId: studentRole.id,
        },
      });

      // 4. Create Student record
      const student = await tx.student.create({
        data: {
          userId: user.id,
          studentId: studentIdCode,
          roll: nextRoll,
          nameBn: admission.applicantName,
          nameEn: admission.applicantNameEn || null,
          classId: admission.classId,
          sessionId: activeSession.id,
          guardianId: guardian.id,
          dob: admission.dateOfBirth || null,
          address: [admission.village, admission.postOffice, admission.upazila, admission.district, admission.address].filter(Boolean).join(', ') || admission.address || null,
          brn: admission.brn || null,
          religion: admission.religion || null,
          bloodGroup: admission.bloodGroup || null,
          previousInstitution: admission.previousInstitution || null,
          quota: admission.quota || null,
          photoUrl: admission.photoUrl || null,
        },
      });

      // 4. Update Admission record
      const updatedAdmission = await tx.admission.update({
        where: { id: admissionId },
        data: { status: AdmissionStatus.APPROVED },
      });

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'APPROVE_ADMISSION',
          resource: 'Admission',
          details: `ভর্তি অনুমোদন: ছাত্র=${student.nameBn}, আইডি=${student.studentId}, রোল=${student.roll}`,
        },
      });

      return { student, guardian, updatedAdmission };
    });

    // Trigger Non-Blocking ADMISSION_APPROVED SMS Dispatch
    setImmediate(async () => {
      try {
        const phone = admission.phone;
        const msg = `অভিনন্দন! আপনার সন্তান ${result.student.nameBn}-এর ইলিয়টগঞ্জ মাদ্রাসায় ভর্তি অনুমোদিত হয়েছে। আইডি: ${result.student.studentId}, শ্রেণী: ${admission.class.name}, রোল: ${result.student.roll}।`;
        const { notificationService } = await import('../notification/notification.service');
        const { NotificationEventType } = await import('@prisma/client');
        await notificationService.dispatchSingleNotification({
          eventType: NotificationEventType.ADMISSION_APPROVED,
          recipientPhone: phone,
          recipientName: admission.applicantName,
          message: msg,
          referenceId: `ADM-APP-${admissionId}`,
        });
      } catch (e) {
        logger.error(`[Admission Approval SMS Error] ${e}`);
      }
    });

    return {
      message: 'ভর্তি সফলভাবে অনুমোদিত হয়েছে এবং নতুন ছাত্রের প্রোফাইল তৈরি হয়েছে',
      student: result.student,
    };
  }

  /**
   * Admin Reject Admission Application
   */
  async rejectAdmission(admissionId: string, reason: string, adminUserId: string) {
    const admission = await prisma.admission.findUnique({ where: { id: admissionId } });
    if (!admission) throw new AppError('ভর্তি আবেদন পাওয়া যায়নি', 404);

    const rejected = await prisma.admission.update({
      where: { id: admissionId },
      data: {
        status: AdmissionStatus.REJECTED,
        rejectionReason: reason,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'REJECT_ADMISSION',
        resource: 'Admission',
        details: `ভর্তি আবেদন বাতিল: ID=${admissionId}, কারণ=${reason}`,
      },
    });

    return rejected;
  }

  /**
   * Get Admissions Queue for Admin UI
   * Hides sensitive data (religion, guardianNid) unless hasSensitiveAccess is true
   */
  async getAdmissionsQueue(status?: AdmissionStatus, limit = 50, page = 1, hasSensitiveAccess = false) {
    const skip = (page - 1) * limit;
    const whereCondition = status ? { status } : {};

    const selectFields = {
      id: true,
      applicantName: true,
      fatherName: true,
      motherName: true,
      phone: true,
      dateOfBirth: true,
      gender: true,
      address: true,
      brn: true,
      bloodGroup: true,
      previousInstitution: true,
      quota: true,
      village: true,
      postOffice: true,
      upazila: true,
      district: true,
      classId: true,
      status: true,
      applicationDate: true,
      photoUrl: true,
      rejectionReason: true,
      createdAt: true,
      updatedAt: true,
      class: { select: { id: true, name: true } },
      // Include sensitive fields only if allowed
      ...(hasSensitiveAccess ? { religion: true, guardianNid: true } : {}),
    };

    const [admissions, total] = await Promise.all([
      prisma.admission.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: selectFields as any, // Cast required due to dynamic select
      }),
      prisma.admission.count({ where: whereCondition }),
    ]);

    return {
      admissions,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}

export const admissionService = new AdmissionService();
