import AdmissionRepository from "../repositories/AdmissionRepository";
import AdmissionTimelineRepository from "../repositories/AdmissionTimelineRepository";

export interface CreateAdmissionInput {
  applicantName: string;
  applicantNameEn?: string;
  fatherName?: string;
  fatherNameEn?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherNameEn?: string;
  motherPhone?: string;
  phone: string;
  emergencyPhone?: string;
  dateOfBirth?: string;
  brn?: string;
  religion?: string;
  bloodGroup?: string;
  gender?: string;
  studentType?: string;
  guardianNid?: string;
  previousInstitution?: string;
  lastClassResult?: string;
  quota?: string;
  address?: string;
  village?: string;
  postOffice?: string;
  upazila?: string;
  district?: string;
  permanentAddress?: string;
  classId: string;
  sessionId?: string;
  photoUrl?: string;
  birthCertUrl?: string;
  guardianNidUrl?: string;
  testimonialUrl?: string;
  paymentMethod?: string;
  trxId?: string;
  paymentSenderPhone?: string;
}

export class AdmissionCreateService {
  static async execute(input: CreateAdmissionInput) {
    // Generate unique verification token: ADM-YYYYMMDD-XXXX
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const verificationToken = `ADM-${datePrefix}-${randomSuffix}`;

    const admission = await AdmissionRepository.create({
      ...input,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
      verificationToken,
      status: "PENDING",
    });

    // Record submission timeline
    await AdmissionTimelineRepository.createTimeline(
      admission.id,
      "SUBMITTED",
      `ভর্তি আবেদন সফলভাবে জমা হয়েছে। ভেরিফিকেশন কোড: ${verificationToken}`,
      "APPLICANT"
    );

    return admission;
  }
}

export default AdmissionCreateService;
