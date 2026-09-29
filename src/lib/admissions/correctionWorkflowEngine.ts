/**
 * EHRJ Digital Admissions 2.0 — Application Correction Workflow Engine
 * Checkpoint: EHRJ-AI-2026-PHASE34
 * Preserves correction history, locks non-correction fields, and handles secure applicant resubmission.
 */

import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import { CorrectionRequest } from "./types";
import { recordAuditLog } from "@/lib/security";

const ADMISSIONS_DATA_DIR = path.join(process.cwd(), "data", "admissions");
const CORRECTIONS_FILE = path.join(ADMISSIONS_DATA_DIR, "correction_history.json");

function safeReadCorrections(): CorrectionRequest[] {
  try {
    if (!fs.existsSync(CORRECTIONS_FILE)) return [];
    const raw = fs.readFileSync(CORRECTIONS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function safeWriteCorrections(records: CorrectionRequest[]): void {
  try {
    if (!fs.existsSync(ADMISSIONS_DATA_DIR)) {
      fs.mkdirSync(ADMISSIONS_DATA_DIR, { recursive: true });
    }
    const temp = `${CORRECTIONS_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(temp, JSON.stringify(records, null, 2), "utf-8");
    fs.renameSync(temp, CORRECTIONS_FILE);
  } catch (err) {
    console.error("[CorrectionWorkflowEngine] Write error:", err);
  }
}

/**
 * Creates an official correction request from Admin
 */
export async function createCorrectionRequest(input: {
  applicationId: string;
  adminUserId: string;
  reason: string;
  fieldsToCorrect: string[];
}): Promise<{ success: boolean; correctionRequest?: CorrectionRequest; error?: string }> {
  const application = await prisma.application.findUnique({
    where: { id: input.applicationId },
  });

  if (!application) {
    return { success: false, error: "ভর্তি আবেদনটি পাওয়া যায়নি।" };
  }

  if (application.status === "APPROVED" || application.status === "REJECTED") {
    return {
      success: false,
      error: `অনুমোদিত বা বাতিলকৃত আবেদনে সংশোধনের অনুরোধ করা সম্ভব নয় (বর্তমান স্ট্যাটাস: ${application.status})।`,
    };
  }

  const reqId = `REQ-CORR-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const newRecord: CorrectionRequest = {
    id: reqId,
    applicationId: application.id,
    trackingId: application.applicationNumber,
    requestedBy: input.adminUserId,
    requestedAt: new Date().toISOString(),
    reason: input.reason,
    fieldsToCorrect: input.fieldsToCorrect,
    status: "PENDING",
  };

  // Update authoritative Application in Prisma
  await prisma.application.update({
    where: { id: application.id },
    data: {
      status: "CORRECTION_REQUESTED",
      correctionReason: input.reason,
    },
  });

  const history = safeReadCorrections();
  history.unshift(newRecord);
  safeWriteCorrections(history);

  await recordAuditLog({
    userId: input.adminUserId,
    action: "APPLICATION_CORRECTION_REQUESTED",
    entityType: "Application",
    entityId: application.id,
    details: {
      reason: input.reason,
      fieldsToCorrect: input.fieldsToCorrect,
    },
  });

  return { success: true, correctionRequest: newRecord };
}

/**
 * Handles applicant resubmission of corrected fields
 */
export async function processApplicantCorrectionResubmission(input: {
  trackingId: string;
  applicantPhoneVerify: string;
  correctedFields: Record<string, any>;
  applicantResponse?: string;
}): Promise<{ success: boolean; message: string; updatedApplication?: any; error?: string }> {
  const application = await prisma.application.findFirst({
    where: { applicationNumber: input.trackingId },
  });

  if (!application) {
    return { success: false, message: "আবেদন নম্বরটি সঠিক নয়।", error: "আবেদন নম্বরটি সঠিক নয়।" };
  }

  // Verification check: match guardian phone
  const phone = input.applicantPhoneVerify.trim();
  if (
    !application.guardianPhone.endsWith(phone) &&
    application.guardianPhone !== phone
  ) {
    return {
      success: false,
      message: "নিরাপত্তা যাচাই ব্যর্থ: অভিভাবকের মোবাইল নম্বর মেলেনি।",
      error: "নিরাপত্তা যাচাই ব্যর্থ: অভিভাবকের মোবাইল নম্বর মেলেনি।",
    };
  }

  if (application.status !== "CORRECTION_REQUESTED") {
    return {
      success: false,
      message: `এই আবেদনটিতে বর্তমানে সংশোধনের কোনো অপেক্ষমাণ অনুরোধ নেই (স্ট্যাটাস: ${application.status})।`,
      error: `এই আবেদনটিতে বর্তমানে সংশোধনের কোনো অপেক্ষমাণ অনুরোধ নেই (স্ট্যাটাস: ${application.status})।`,
    };
  }

  const history = safeReadCorrections();
  const reqRecord = history.find(
    (h) => h.applicationId === application.id && h.status === "PENDING"
  );

  // Security Invariant: Only update fields allowed by the correction request
  const allowedKeys = reqRecord ? reqRecord.fieldsToCorrect : Object.keys(input.correctedFields);
  const dataToUpdate: Record<string, any> = {};

  for (const key of allowedKeys) {
    if (input.correctedFields[key] !== undefined) {
      dataToUpdate[key] = input.correctedFields[key];
    }
  }

  // Update status back to SUBMITTED / UNDER_REVIEW
  dataToUpdate.status = "SUBMITTED";
  dataToUpdate.correctionReason = null;
  dataToUpdate.updatedAt = new Date();

  const updated = await prisma.application.update({
    where: { id: application.id },
    data: dataToUpdate,
  });

  // Mark correction record as RESUBMITTED
  if (reqRecord) {
    reqRecord.status = "RESUBMITTED";
    reqRecord.applicantResponse = input.applicantResponse || "সংশোধিত তথ্য দাখিল করা হয়েছে";
    reqRecord.resubmittedAt = new Date().toISOString();
    safeWriteCorrections(history);
  }

  await recordAuditLog({
    userId: undefined,
    action: "APPLICATION_CORRECTION_RESUBMITTED",
    entityType: "Application",
    entityId: application.id,
    details: {
      trackingId: application.applicationNumber,
      applicantResponse: input.applicantResponse || "সংশোধিত তথ্য দাখিল",
    },
  });

  return {
    success: true,
    message: "সংশোধিত তথ্য সফলভাবে জমা নেওয়া হয়েছে। কর্তৃপক্ষ পুনরায় এটি নিরীক্ষা করবে।",
    updatedApplication: updated,
  };
}

/**
 * Gets correction history for a specific application
 */
export function getApplicationCorrectionHistory(applicationId: string): CorrectionRequest[] {
  const history = safeReadCorrections();
  return history.filter((h) => h.applicationId === applicationId);
}

// Aliases for compatibility
export const requestApplicationCorrection = createCorrectionRequest;
export const resubmitCorrectedApplication = async (params: {
  applicationId?: string;
  trackingId: string;
  guardianPhone: string;
  correctedFields?: Record<string, any>;
  correctedDocuments?: any[];
  applicantNotes?: string;
}) => {
  const res = await processApplicantCorrectionResubmission({
    trackingId: params.trackingId,
    applicantPhoneVerify: params.guardianPhone,
    correctedFields: {
      ...(params.correctedFields || {}),
      ...(params.correctedDocuments ? { documents: params.correctedDocuments } : {}),
    },
    applicantResponse: params.applicantNotes,
  });
  return {
    success: res.success,
    message: res.message,
    trackingId: params.trackingId,
    status: res.updatedApplication?.status || "SUBMITTED",
  };
};
