import bcrypt from "bcryptjs";
import prisma from "../../../config/prisma";
import AdmissionTimelineRepository from "../repositories/AdmissionTimelineRepository";
import AuditService from "../../../services/shared/AuditService";
import NotificationService from "../../../services/shared/NotificationService";

export class AdmissionApproveService {
  static async execute(admissionId: string, approvedByUserId: string) {
    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      include: { class: true, session: true },
    });

    if (!admission) {
      throw new Error("ভর্তি আবেদন পাওয়া যায়নি।");
    }

    if (admission.status === "APPROVED") {
      throw new Error("এই ভর্তি আবেদনটি আগেই অনুমোদিত হয়েছে।");
    }

    // Atomic transaction for system-wide sync (Student, Guardian, User, Invoice, Accounting Event)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or Find Guardian
      let guardian = await tx.guardian.findFirst({
        where: { phone: admission.phone, isDeleted: false },
      });

      if (!guardian) {
        guardian = await tx.guardian.create({
          data: {
            name: admission.fatherName || admission.motherName || admission.applicantName,
            phone: admission.phone,
            relation: "FATHER",
            address: admission.address || admission.permanentAddress || "",
          },
        });
      }

      // 2. Generate Student ID & User Account
      const yearStr = new Date().getFullYear().toString().slice(-2);
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const studentIdStr = `STU-${yearStr}-${randomId}`;

      const defaultPassword = await bcrypt.hash("12345678", 10);

      // Find or create default Student role
      let studentRole = await tx.role.findUnique({ where: { name: "STUDENT" } });
      if (!studentRole) {
        studentRole = await tx.role.create({
          data: { name: "STUDENT", description: "Student User Role" },
        });
      }

      const user = await tx.user.create({
        data: {
          username: studentIdStr,
          passwordHash: defaultPassword,
          roleId: studentRole.id,
          isActive: true,
        },
      });

      // 3. Create Student Entity
      const rollCount = await tx.student.count({
        where: { classId: admission.classId },
      });
      const nextRoll = rollCount + 1;

      // Active active session
      let activeSession = admission.sessionId
        ? await tx.session.findUnique({ where: { id: admission.sessionId } })
        : await tx.session.findFirst({ where: { isActive: true } });

      if (!activeSession) {
        activeSession = await tx.session.create({
          data: { year: new Date().getFullYear().toString(), isActive: true },
        });
      }

      const student = await tx.student.create({
        data: {
          userId: user.id,
          studentId: studentIdStr,
          roll: nextRoll,
          nameBn: admission.applicantName,
          nameEn: admission.applicantNameEn || null,
          dob: admission.dateOfBirth || null,
          brn: admission.brn || null,
          religion: admission.religion || "ISLAM",
          bloodGroup: admission.bloodGroup || null,
          address: admission.address || null,
          previousInstitution: admission.previousInstitution || null,
          quota: admission.quota || null,
          photoUrl: admission.photoUrl || null,
          classId: admission.classId,
          sessionId: activeSession.id,
          guardianId: guardian.id,
        },
      });

      // 4. Generate Admission Fee Invoice
      const invoice = await tx.invoice.create({
        data: {
          studentId: student.id,
          type: "ADMISSION",
          year: new Date().getFullYear(),
          totalAmount: 5000.00,
          status: "UNPAID",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // 5. Update Admission Status & Relations
      const updatedAdmission = await tx.admission.update({
        where: { id: admissionId },
        data: {
          status: "APPROVED",
          studentId: student.id,
          guardianId: guardian.id,
          invoiceId: invoice.id,
          updatedBy: approvedByUserId,
        },
      });

      return { student, guardian, invoice, updatedAdmission };
    });

    // 6. Record Timeline & Audit Log
    await AdmissionTimelineRepository.createTimeline(
      admissionId,
      "APPROVED",
      `ভর্তি আবেদন অনুমোদিত হয়েছে। আইডি: ${result.student.studentId}`,
      approvedByUserId
    );

    await AuditService.log({
      userId: approvedByUserId,
      action: "ADMISSION_APPROVED",
      resource: "Admission",
      details: { admissionId, studentId: result.student.studentId, invoiceId: result.invoice.id },
    });

    // 7. Dispatch SMS & Notification
    try {
      await NotificationService.send({
        recipientPhone: admission.phone,
        recipientName: admission.applicantName,
        eventType: "ADMISSION_APPROVED",
        message: `অভিনন্দন! আপনার ভর্তি আবেদন অনুমোদিত হয়েছে। স্টুডেন্ট আইডি: ${result.student.studentId}`,
        referenceId: admissionId,
      });
    } catch (e) {
      console.warn("[AdmissionApproveService] Notification dispatch failed non-blockingly:", e);
    }

    return result;
  }
}

export default AdmissionApproveService;
