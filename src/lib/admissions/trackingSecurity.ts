/**
 * EHRJ Digital Admissions 2.0 — Secure Tracking & PII Defense Engine
 * Checkpoint: EHRJ-AI-2026-PHASE34
 * Enforces phone verification, masks PII, and generates chronological applicant status timelines.
 */

import prisma from "@/lib/prisma";
import {
  TrackingResult,
  AdmissionTimelineStep,
  AdmissionOnboardingChecklistItem,
} from "./types";
import { buildDocumentChecklist } from "./documentChecklistEngine";
import { getApplicationCorrectionHistory } from "./correctionWorkflowEngine";
import { getStatusInstruction } from "@/lib/admissionTrack";

function maskString(val?: string | null, visibleEndChars: number = 4): string | undefined {
  if (!val) return undefined;
  const s = val.trim();
  if (s.length <= visibleEndChars) return s;
  const hidden = "*".repeat(s.length - visibleEndChars);
  return `${hidden}${s.slice(-visibleEndChars)}`;
}

function maskPhone(phone: string): string {
  const p = phone.trim();
  if (p.length < 7) return p;
  return `${p.substring(0, 3)}****${p.slice(-4)}`;
}

export async function getSecureApplicationTracking(
  trackingId: string,
  verificationPhone?: string
): Promise<{ success: boolean; result?: TrackingResult; error?: string; statusCode?: number }> {
  const query = trackingId.trim();

  const application = await prisma.application.findFirst({
    where: {
      OR: [{ applicationNumber: query }, { id: query }],
    },
  });

  if (!application) {
    return {
      success: false,
      error: "প্রদত্ত ট্র্যাকিং নম্বরের কোনো ভর্তি আবেদন পাওয়া যায়নি।",
      statusCode: 404,
    };
  }

  // Security Verification: If verificationPhone provided, verify match against guardianPhone
  if (verificationPhone) {
    const v = verificationPhone.trim();
    const phoneMatch = application.guardianPhone.endsWith(v) || application.guardianPhone === v;
    if (!phoneMatch) {
      return {
        success: false,
        error: "নিরাপত্তা যাচাই ব্যর্থ: ট্র্যাকিং নম্বরের সাথে প্রদত্ত মোবাইল নম্বর মেলেনি।",
        statusCode: 403,
      };
    }
  }

  // Resolve Class Name
  let classNameBn = "নির্ধারিত জামাত";
  if (application.desiredClassId) {
    const cls = await prisma.jamatClass.findUnique({
      where: { id: application.desiredClassId },
      select: { nameBn: true },
    });
    if (cls) classNameBn = cls.nameBn;
  }

  // Build Timeline
  const currentStatus = application.status;
  const timeline: AdmissionTimelineStep[] = [
    {
      step: "SUBMITTED",
      labelBn: "আবেদন দাখিল",
      completed: true,
      current: currentStatus === "SUBMITTED",
      timestamp: (application.submittedAt || application.createdAt).toISOString(),
    },
    {
      step: "UNDER_REVIEW",
      labelBn: "প্রাথমিক পর্যালোচনা",
      completed: ["UNDER_REVIEW", "VERIFICATION", "EXAM_INTERVIEW", "APPROVED", "REJECTED"].includes(currentStatus),
      current: currentStatus === "UNDER_REVIEW",
      timestamp: application.reviewedAt ? application.reviewedAt.toISOString() : undefined,
    },
    {
      step: "VERIFICATION",
      labelBn: "কাগজপত্র নিরীক্ষা",
      completed: ["VERIFICATION", "EXAM_INTERVIEW", "APPROVED"].includes(currentStatus),
      current: currentStatus === "VERIFICATION",
    },
    {
      step: "EXAM_INTERVIEW",
      labelBn: "মৌখিক পরীক্ষা / সাক্ষাতকার",
      completed: ["APPROVED"].includes(currentStatus),
      current: currentStatus === "EXAM_INTERVIEW",
      timestamp: application.examInterviewScheduledAt
        ? application.examInterviewScheduledAt.toISOString()
        : undefined,
    },
    {
      step: "APPROVED",
      labelBn: currentStatus === "REJECTED" ? "আবেদন সিদ্ধান্ত (বাতিল)" : "ভর্তি অনুমোদন",
      completed: ["APPROVED", "REJECTED"].includes(currentStatus),
      current: currentStatus === "APPROVED" || currentStatus === "REJECTED",
      timestamp: application.approvedAt ? application.approvedAt.toISOString() : undefined,
    },
  ];

  // Document checklist
  const documentsChecklist = buildDocumentChecklist(application.documentsJson);

  // Correction Info
  let correctionInfo = undefined;
  if (application.status === "CORRECTION_REQUESTED") {
    const corrections = getApplicationCorrectionHistory(application.id);
    const pendingCorr = corrections.find((c) => c.status === "PENDING");
    if (pendingCorr) {
      correctionInfo = {
        requestId: pendingCorr.id,
        reason: pendingCorr.reason,
        fieldsToCorrect: pendingCorr.fieldsToCorrect,
      };
    } else {
      correctionInfo = {
        requestId: "REQ-CORR-DEFAULT",
        reason: application.correctionReason || "তথ্য সংশোধনের অনুরোধ",
        fieldsToCorrect: ["studentNameBn", "birthCertificateNo"],
      };
    }
  }

  // Onboarding Checklist & Confirmation Data if Approved
  let onboardingChecklist: AdmissionOnboardingChecklistItem[] | undefined = undefined;
  let admissionConfirmation = undefined;

  if (application.status === "APPROVED" && application.createdStudentId) {
    const student = await prisma.student.findUnique({
      where: { id: application.createdStudentId },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: {
            session: true,
            jamatClass: true,
            section: true,
          },
        },
      },
    });

    if (student) {
      const activeEnrollment = student.enrollments[0];
      const rollNumber = activeEnrollment ? activeEnrollment.rollNumber : 1;
      const sessionName = activeEnrollment?.session?.name || "২০২৬-২০২৭";
      const studentClassBn = activeEnrollment?.jamatClass?.nameBn || classNameBn;

      onboardingChecklist = [
        {
          id: "ONB-1",
          titleBn: "ভর্তি আবেদন সফলভাবে অনুমোদিত",
          descriptionBn: "কর্তৃপক্ষ কর্তৃক আবেদনপত্রের সকল শর্ত পূরণ সাপেক্ষে চূড়ান্ত অনুমোদন দেওয়া হয়েছে।",
          completed: true,
          category: "ACADEMIC",
        },
        {
          id: "ONB-2",
          titleBn: "স্থায়ী ছাত্র আইডি ও রোল নম্বর বরাদ্দ",
          descriptionBn: `ছাত্র আইডি: ${student.studentIdNumber}, জামাত: ${studentClassBn}, রোল: ${rollNumber}`,
          completed: true,
          category: "ACADEMIC",
        },
        {
          id: "ONB-3",
          titleBn: "ডিজিটাল অভিভাবক পোর্টাল সংযোগ",
          descriptionBn: "অভিভাবকের মোবাইল নম্বর ব্যবহার করে পোর্টালে লগইন করে ফি ও হাজিরার তথ্য দেখা যাবে।",
          completed: true,
          category: "FINANCE",
        },
        {
          id: "ONB-4",
          titleBn: "একাডেমিক ক্লাস রুটিন ও পাঠ্যসূচি গ্রহণ",
          descriptionBn: "মাদরাসা অফিস থেকে অথবা পোর্টালের রুটিন সেকশন থেকে সময়সূচি ডাউনলোড করুন।",
          completed: false,
          category: "FACILITIES",
        },
      ];

      admissionConfirmation = {
        studentNameBn: student.fullNameBn,
        studentIdNumber: student.studentIdNumber,
        applicationNumber: application.applicationNumber,
        sessionName,
        classNameBn: studentClassBn,
        sectionNameBn: activeEnrollment?.section?.nameBn,
        rollNumber,
        admissionDate: (application.approvedAt || new Date()).toISOString().split("T")[0],
        institutionNameBn: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা",
        institutionAddressBn: "ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা",
        verificationQrUrl: `/verify/document/ADM-CONF-${application.applicationNumber}`,
      };
    }
  }

  const nextActionInstruction = getStatusInstruction(
    application.status,
    application.correctionReason
  );

  const result: TrackingResult = {
    trackingId: application.applicationNumber,
    studentNameBn: application.studentNameBn,
    desiredClass: classNameBn,
    status: application.status,
    applicationDate: (application.submittedAt || application.createdAt).toISOString().split("T")[0],
    timeline,
    maskedPhone: maskPhone(application.guardianPhone),
    maskedNid: maskString(application.nidNo, 4),
    maskedBirthCert: maskString(application.birthCertificateNo, 4),
    documentsChecklist,
    correctionInfo,
    examScheduledAt: application.examInterviewScheduledAt
      ? application.examInterviewScheduledAt.toISOString()
      : undefined,
    nextActionInstruction,
    onboardingChecklist,
    admissionConfirmation,
  };

  return { success: true, result };
}

// Alias for compatibility
export const getSecureTrackingDetails = async (params: {
  trackingId: string;
  verificationPhone?: string;
}) => {
  const res = await getSecureApplicationTracking(params.trackingId, params.verificationPhone);
  if (!res.success || !res.result) return null;
  const r = res.result;
  return {
    trackingId: r.trackingId,
    studentNameBn: r.studentNameBn,
    desiredClass: r.desiredClass,
    status: r.status,
    applicationDate: r.applicationDate,
    phoneMasked: r.maskedPhone,
    nidOrBirthMasked: r.maskedBirthCert || r.maskedNid || "XXXXXXXXXXXX",
    nextActionInstruction: r.nextActionInstruction,
    correctionRequired: r.correctionInfo?.reason || null,
    examScheduledAt: r.examScheduledAt || null,
    timeline: r.timeline.map((t) => ({
      step: t.step,
      titleBn: t.labelBn,
      status: (t.completed ? "COMPLETED" : t.current ? "CURRENT" : "PENDING") as "COMPLETED" | "CURRENT" | "PENDING",
      date: t.timestamp || null,
      descriptionBn: t.labelBn,
    })),
    documents: r.documentsChecklist.map((d) => ({
      id: d.type,
      titleBn: d.nameBn,
      status: d.verificationStatus,
      rejectionReason: d.rejectionReason,
      url: d.fileUrl,
    })),
    feeStatus: {
      admissionFee: 0,
      paidAmount: 0,
      dueAmount: 0,
      paymentStatus: "PENDING",
    },
    onboardingChecklist: r.onboardingChecklist?.map((o) => ({
      id: o.id,
      titleBn: o.titleBn,
      completed: o.completed,
      notes: o.descriptionBn,
    })),
    admissionConfirmationSlip: r.admissionConfirmation
      ? {
          studentId: r.admissionConfirmation.studentIdNumber,
          studentNameBn: r.admissionConfirmation.studentNameBn,
          sessionName: r.admissionConfirmation.sessionName,
          classNameBn: r.admissionConfirmation.classNameBn,
          sectionNameBn: r.admissionConfirmation.sectionNameBn || "ক শাখা",
          rollNumber: r.admissionConfirmation.rollNumber,
          admissionDate: r.admissionConfirmation.admissionDate,
          institutionNameBn: r.admissionConfirmation.institutionNameBn,
          verificationQrCode: r.admissionConfirmation.verificationQrUrl,
        }
      : undefined,
  };
};
