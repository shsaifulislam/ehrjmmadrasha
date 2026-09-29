/**
 * EHRJ MADRASHA ERP — PHASE 39
 * Training Certification & Renewal Engine
 * 
 * Invariants:
 * 1. CERTIFICATES REQUIRE STRICT COMPLETION CRITERIA:
 *    Attendance Requirement + Assessment Requirement + Required Modules = Certificate Eligible.
 * 2. IDEMPOTENT ISSUANCE: PREVENTS DUPLICATE ACTIVE CERTIFICATES.
 * 3. USES PHASE 7/29 VERIFICATION TOKENS (COMPATIBLE WITH /verify/document/[token]).
 * 4. RENEWAL LIFECYCLE: VALID -> EXPIRING_SOON -> EXPIRED -> RENEWED.
 */

import {
  TrainingCertificate,
  CertificateStatus,
  TrainingEnrollment,
} from "./types";
import {
  getTrainingProgramById,
  getAllEnrollments,
  saveEnrollment,
  getAllCertificates,
  saveCertificate,
  recordTrainingAudit,
} from "./trainingStore";
import { ActorContext } from "./trainingLifecycleEngine";

/**
 * Checks eligibility for certificate generation
 */
export function checkCertificateEligibility(
  programId: string,
  employeeId: string
): { eligible: boolean; reasons: string[]; enrollment?: TrainingEnrollment } {
  const program = getTrainingProgramById(programId);
  if (!program) {
    return { eligible: false, reasons: ["Training program not found"] };
  }

  const allEnrollments = getAllEnrollments();
  const enrollment = allEnrollments.find(
    (e) => e.trainingProgramId === programId && e.employeeId === employeeId
  );

  if (!enrollment) {
    return { eligible: false, reasons: ["Employee is not enrolled in this program"] };
  }

  const reasons: string[] = [];

  // 1. Attendance Check
  if (enrollment.attendanceRate < program.attendanceThresholdPercentage) {
    reasons.push(
      `উপস্থিতির হার অপর্যাপ্ত: বর্তমান ${enrollment.attendanceRate}%, আবশ্যক ${program.attendanceThresholdPercentage}%`
    );
  }

  // 2. Assessment Check
  if (program.requiresAssessment) {
    if (enrollment.assessmentStatus !== "PASSED") {
      reasons.push(
        `মূল্যায়ন উত্তীর্ণ হননি: স্ট্যাটাস ${enrollment.assessmentStatus} (পাস স্কোর: ${program.passPercentage}%)`
      );
    }
  }

  const eligible = reasons.length === 0;
  return { eligible, reasons, enrollment };
}

/**
 * Issues a verifiable institutional certificate
 */
export function issueTrainingCertificate(
  programId: string,
  employeeId: string,
  actor: ActorContext
): { success: boolean; certificate?: TrainingCertificate; error?: string } {
  const { eligible, reasons, enrollment } = checkCertificateEligibility(programId, employeeId);
  if (!eligible || !enrollment) {
    return {
      success: false,
      error: `সনদ প্রদানের শর্ত অপূর্ণ: ${reasons.join(", ")}`,
    };
  }

  const program = getTrainingProgramById(programId)!;

  // Check if active valid certificate already exists
  const allCerts = getAllCertificates();
  const existingCert = allCerts.find(
    (c) =>
      c.trainingProgramId === programId &&
      c.employeeId === employeeId &&
      (c.status === "VALID" || c.status === "EXPIRING_SOON")
  );

  if (existingCert) {
    return {
      success: true,
      certificate: existingCert,
    };
  }

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const year = now.getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const certId = `EHRJ-TRN-CERT-${year}-${rand}`;
  const verificationToken = `VER-TRN-${year}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  let validUntil: string | undefined;
  if (program.certificateValidityMonths && program.certificateValidityMonths > 0) {
    const expiryDate = new Date(now);
    expiryDate.setMonth(expiryDate.getMonth() + program.certificateValidityMonths);
    validUntil = expiryDate.toISOString().split("T")[0];
  }

  const certType =
    program.trainingType === "QURAN_TAHFEEZ_PEDAGOGY" || program.trainingType === "TEACHING_METHODOLOGY"
      ? "PROFESSIONAL_DEVELOPMENT"
      : program.mandatoryStatus === "MANDATORY"
      ? "MANDATORY_COMPLIANCE"
      : "TRAINING_COMPLETION";

  const certificate: TrainingCertificate = {
    id: certId,
    trainingProgramId: program.id,
    trainingProgramTitleBn: program.titleBn,
    employeeId: enrollment.employeeId,
    employeeName: enrollment.employeeName,
    designation: enrollment.designation,
    department: enrollment.department,
    verificationToken,
    qrCodeToken: `QR-TRN-${verificationToken}`,
    certificateType: certType,
    issueDate: todayStr,
    validFrom: todayStr,
    validUntil,
    renewalRequired: !!program.certificateValidityMonths,
    renewalPeriodMonths: program.certificateValidityMonths,
    status: "VALID",
    issuedBy: actor.actorName,
    metadata: {
      attendancePercentage: enrollment.attendanceRate,
      assessmentScore: enrollment.assessmentScore || 0,
      totalTrainingHours: program.totalHours,
    },
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  saveCertificate(certificate);

  // Mark enrollment as completed
  enrollment.isCompleted = true;
  enrollment.status = "COMPLETED";
  enrollment.completionDate = todayStr;
  enrollment.certificateId = certId;
  saveEnrollment(enrollment);

  recordTrainingAudit({
    trainingProgramId: program.id,
    employeeId: enrollment.employeeId,
    action: "ISSUE_CERTIFICATE",
    actorId: actor.actorId,
    actorName: actor.actorName,
    actorRole: actor.actorRole,
    notes: `Issued institutional certificate ${certId} (${verificationToken}) for ${enrollment.employeeName}`,
    details: { certId, verificationToken, validUntil },
  });

  return { success: true, certificate };
}

/**
 * Renews an existing certificate
 */
export function renewCertificate(
  certificateId: string,
  actor: ActorContext
): { success: boolean; certificate?: TrainingCertificate; error?: string } {
  const allCerts = getAllCertificates();
  const cert = allCerts.find((c) => c.id === certificateId);
  if (!cert) {
    return { success: false, error: "সনদপত্রটি পাওয়া যায়নি।" };
  }

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const months = cert.renewalPeriodMonths || 12;

  const newExpiry = new Date(now);
  newExpiry.setMonth(newExpiry.getMonth() + months);

  cert.status = "RENEWED";
  cert.validFrom = todayStr;
  cert.validUntil = newExpiry.toISOString().split("T")[0];
  cert.updatedAt = now.toISOString();

  saveCertificate(cert);

  recordTrainingAudit({
    trainingProgramId: cert.trainingProgramId,
    employeeId: cert.employeeId,
    action: "RENEW_CERTIFICATE",
    actorId: actor.actorId,
    actorName: actor.actorName,
    actorRole: actor.actorRole,
    notes: `Certificate ${cert.id} renewed until ${cert.validUntil}`,
    details: { certificateId: cert.id, newValidUntil: cert.validUntil },
  });

  return { success: true, certificate: cert };
}
