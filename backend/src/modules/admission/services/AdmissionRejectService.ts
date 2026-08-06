import prisma from "../../../config/prisma";
import AdmissionTimelineRepository from "../repositories/AdmissionTimelineRepository";
import AuditService from "../../../services/shared/AuditService";
import NotificationService from "../../../services/shared/NotificationService";

export class AdmissionRejectService {
  static async execute(admissionId: string, rejectionReason: string, rejectedByUserId: string) {
    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
    });

    if (!admission) {
      throw new Error("ভর্তি আবেদন পাওয়া যায়নি।");
    }

    const updatedAdmission = await prisma.admission.update({
      where: { id: admissionId },
      data: {
        status: "REJECTED",
        rejectionReason: rejectionReason || "নথিপত্র অপ্রতুল বা শর্তাবলী অপূরণীয়",
        updatedBy: rejectedByUserId,
      },
    });

    // Record Timeline entry
    await AdmissionTimelineRepository.createTimeline(
      admissionId,
      "REJECTED",
      `ভর্তি আবেদন বাতিল করা হয়েছে। কারণ: ${rejectionReason}`,
      rejectedByUserId
    );

    // Audit Log
    await AuditService.log({
      userId: rejectedByUserId,
      action: "ADMISSION_REJECTED",
      resource: "Admission",
      details: { admissionId, rejectionReason },
    });

    // Notification
    try {
      await NotificationService.send({
        recipientPhone: admission.phone,
        recipientName: admission.applicantName,
        eventType: "ADMISSION_REJECTED",
        message: `দুঃখিত! আপনার ভর্তি আবেদনটি বাতিল করা হয়েছে। কারণ: ${rejectionReason}`,
        referenceId: admissionId,
      });
    } catch (e) {
      console.warn("[AdmissionRejectService] Notification dispatch failed non-blockingly:", e);
    }

    return updatedAdmission;
  }
}

export default AdmissionRejectService;
