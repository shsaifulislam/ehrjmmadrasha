import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { recordSecurityEvent } from "@/lib/securityEngine";

export interface StudentImportRow {
  rowNumber: number;
  fullNameBn: string;
  fullNameEn?: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: string; // MALE | FEMALE
  fatherNameBn: string;
  fatherPhone: string;
  motherNameBn?: string;
  presentAddress: string;
  permanentAddress?: string;
  birthCertificateNo?: string;
  classCode: string;
  rollNumber?: number;
}

export interface ImportError {
  rowNumber: number;
  field: string;
  errorBn: string;
  suggestedCorrectionBn: string;
}

export interface ImportValidationResult {
  isValid: boolean;
  totalRows: number;
  validRowsCount: number;
  errorRowsCount: number;
  errors: ImportError[];
  previewRows: any[];
}

export interface GuardianCorrectionRequest {
  id: string; // REQ-CORR-YYYY-XXXX
  guardianId: string;
  studentId: string;
  studentIdNumber: string;
  guardianNameBn: string;
  requestedFields: Record<string, { oldValue: any; requestedValue: any }>;
  reasonBn: string;
  status: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

const CORRECTION_REQUESTS_FILE = path.join(process.cwd(), "data", "governance", "guardian_correction_requests.json");

function ensureCorrectionFile() {
  const dir = path.join(process.cwd(), "data", "governance");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(CORRECTION_REQUESTS_FILE)) {
    fs.writeFileSync(CORRECTION_REQUESTS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

// -------------------------------------------------------------
// 1. IMPORT VALIDATION PIPELINE
// -------------------------------------------------------------
export async function validateStudentImportBatch(rows: any[]): Promise<ImportValidationResult> {
  const errors: ImportError[] = [];
  const validRows: any[] = [];

  // Pre-load reference classes and current session
  const classes = await prisma.jamatClass.findMany({ select: { code: true, id: true, nameBn: true } });
  const classCodeMap = new Map(classes.map(c => [c.code, c]));
  const currentSession = await prisma.academicSession.findFirst({ where: { isCurrent: true } }) ||
                         await prisma.academicSession.findFirst({ where: { status: "ACTIVE" } });

  const seenPhonesInBatch = new Set<string>();
  const seenBirthCertsInBatch = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 1;
    let rowHasError = false;

    // A. Required Name
    if (!r.fullNameBn || typeof r.fullNameBn !== "string" || r.fullNameBn.trim().length < 3) {
      errors.push({
        rowNumber: rowNum,
        field: "fullNameBn",
        errorBn: "শিক্ষার্থীর পূর্ণ বাংলা নাম কমপক্ষে ৩ অক্ষরের হতে হবে।",
        suggestedCorrectionBn: "সঠিক বাংলা নাম প্রদান করুন (যেমন: মুহাম্মদ সালমান)"
      });
      rowHasError = true;
    }

    // B. Date of Birth
    const dob = new Date(r.dateOfBirth);
    if (!r.dateOfBirth || isNaN(dob.getTime())) {
      errors.push({
        rowNumber: rowNum,
        field: "dateOfBirth",
        errorBn: "জন্ম তারিখ সঠিক ফরম্যাটে (YYYY-MM-DD) নয়।",
        suggestedCorrectionBn: "সঠিক তারিখ দিন, যেমন: 2015-01-15"
      });
      rowHasError = true;
    }

    // C. Gender
    if (!r.gender || !["MALE", "FEMALE"].includes(r.gender.toUpperCase())) {
      errors.push({
        rowNumber: rowNum,
        field: "gender",
        errorBn: "লিঙ্গ অবশ্যই MALE অথবা FEMALE হতে হবে।",
        suggestedCorrectionBn: "MALE অথবা FEMALE নির্বাচন করুন"
      });
      rowHasError = true;
    }

    // D. Father Phone (BD Format)
    const phone = r.fatherPhone ? r.fatherPhone.trim().replace(/-/g, "") : "";
    if (!phone || !/^01[3-9]\d{8}$/.test(phone)) {
      errors.push({
        rowNumber: rowNum,
        field: "fatherPhone",
        errorBn: "অভিভাবকের মোবাইল নম্বর ১১ ডিজিটের সঠিক বাংলাদেশী নম্বর হতে হবে।",
        suggestedCorrectionBn: "017XXXXXXXX বা 018XXXXXXXX ফরম্যাটে লিখুন"
      });
      rowHasError = true;
    }

    // E. Class Code Reference
    if (!r.classCode || !classCodeMap.has(r.classCode)) {
      errors.push({
        rowNumber: rowNum,
        field: "classCode",
        errorBn: `শ্রেণি কোড '${r.classCode}' ডাটাবেজে পাওয়া যায়নি।`,
        suggestedCorrectionBn: `সঠিক কোড দিন: ${Array.from(classCodeMap.keys()).join(", ")}`
      });
      rowHasError = true;
    }

    // F. Birth Certificate Check
    if (r.birthCertificateNo) {
      const bCert = r.birthCertificateNo.trim();
      if (seenBirthCertsInBatch.has(bCert)) {
        errors.push({
          rowNumber: rowNum,
          field: "birthCertificateNo",
          errorBn: "একই জন্ম নিবন্ধন নম্বর ইমপোর্ট ফাইলের অন্য সারিতেও বিদ্যমান।",
          suggestedCorrectionBn: "ডুপ্লিকেট এন্ট্রি অপসারণ করুন"
        });
        rowHasError = true;
      } else {
        seenBirthCertsInBatch.add(bCert);
        const existingStudent = await prisma.student.findUnique({ where: { birthCertificateNo: bCert } });
        if (existingStudent) {
          errors.push({
            rowNumber: rowNum,
            field: "birthCertificateNo",
            errorBn: `জন্ম নিবন্ধন নম্বর ইতিমধ্যে শিক্ষার্থী ${existingStudent.studentIdNumber} এর সাথে নিবন্ধিত।`,
            suggestedCorrectionBn: "বিদ্যমান শিক্ষার্থীর রেকর্ড চেক করুন অথবা নম্বর সংশোধন করুন"
          });
          rowHasError = true;
        }
      }
    }

    if (!rowHasError) {
      validRows.push({
        ...r,
        rowNumber: rowNum,
        matchedClass: classCodeMap.get(r.classCode),
        sessionId: currentSession?.id
      });
    }
  }

  return {
    isValid: errors.length === 0,
    totalRows: rows.length,
    validRowsCount: validRows.length,
    errorRowsCount: errors.length,
    errors,
    previewRows: validRows.slice(0, 10)
  };
}

export async function commitStudentImportBatch(
  validatedRows: any[],
  actorId: string
): Promise<{ success: boolean; insertedCount: number; messageBn: string }> {
  // Run final validation check
  const val = await validateStudentImportBatch(validatedRows);
  if (!val.isValid) {
    throw new Error(`ইমপোর্ট ব্যাচে ${val.errors.length} টি ত্রুটি রয়েছে। ত্রুটিযুক্ত ডেটা কমিট করা যাবে না।`);
  }

  const currentSession = await prisma.academicSession.findFirst({ where: { isCurrent: true } }) ||
                         await prisma.academicSession.findFirst({ where: { status: "ACTIVE" } });
  if (!currentSession) {
    throw new Error("কোনো সক্রিয় শিক্ষাবর্ষ পাওয়া যায়নি।");
  }

  const year = new Date().getFullYear();
  let createdCount = 0;

  await prisma.$transaction(async (tx) => {
    const classes = await tx.jamatClass.findMany({ select: { code: true, id: true } });
    const classMap = new Map(classes.map(c => [c.code, c.id]));

    for (const r of validatedRows) {
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const studentIdNumber = `EHRJ-${year}-${randomId}`;

      // Create Student
      const student = await tx.student.create({
        data: {
          studentIdNumber,
          fullNameBn: r.fullNameBn.trim(),
          fullNameEn: r.fullNameEn?.trim() || r.fullNameBn.trim(),
          dateOfBirth: new Date(r.dateOfBirth),
          gender: r.gender.toUpperCase(),
          fatherNameBn: r.fatherNameBn?.trim() || "তথ্য নেই",
          fatherPhone: r.fatherPhone?.trim(),
          motherNameBn: r.motherNameBn?.trim() || "তথ্য নেই",
          presentAddress: r.presentAddress?.trim() || "ইলিয়টগঞ্জ, দাউদকান্দি",
          permanentAddress: r.permanentAddress?.trim() || "ইলিয়টগঞ্জ, দাউদকান্দি",
          birthCertificateNo: r.birthCertificateNo?.trim() || null,
          status: "ACTIVE"
        }
      });

      const targetClassId = r.matchedClass?.id || classMap.get(r.classCode) || classes[0].id;

      // Create Enrollment
      await tx.enrollment.create({
        data: {
          studentId: student.id,
          sessionId: currentSession.id,
          classId: targetClassId,
          rollNumber: r.rollNumber || (createdCount + 1),
          status: "ACTIVE"
        }
      });

      // Create or Link Guardian
      let guardian = await tx.guardian.findUnique({ where: { phone: r.fatherPhone.trim() } });
      if (!guardian) {
        guardian = await tx.guardian.create({
          data: {
            fullNameBn: r.fatherNameBn?.trim() || `${r.fullNameBn} এর পিতা`,
            phone: r.fatherPhone.trim(),
            relation: "FATHER",
            address: r.presentAddress?.trim() || "ইলিয়টগঞ্জ, দাউদকান্দি"
          }
        });
      }

      await tx.guardianStudent.create({
        data: {
          guardianId: guardian.id,
          studentId: student.id,
          isPrimary: true
        }
      });

      createdCount++;
    }

    // Audit Log
    const userRecord = await tx.user.findFirst({ where: { OR: [{ id: actorId }, { username: actorId }] } });
    const validUserId = userRecord ? userRecord.id : null;

    await tx.auditLog.create({
      data: {
        action: "BATCH_STUDENT_IMPORT",
        entityType: "Student",
        detailsJson: JSON.stringify({
          action: "BATCH_STUDENT_IMPORT",
          count: createdCount,
          actorId
        }),
        userId: validUserId
      }
    });
  });

  return {
    success: true,
    insertedCount: createdCount,
    messageBn: `${createdCount} জন শিক্ষার্থীর তথ্য সফলভাবে মাস্টার ডেটাবেজে অন্তর্ভুক্ত হয়েছে।`
  };
}

// -------------------------------------------------------------
// 2. GUARDIAN CORRECTION REQUEST PIPELINE
// -------------------------------------------------------------
export function getAllCorrectionRequests(): GuardianCorrectionRequest[] {
  ensureCorrectionFile();
  try {
    return JSON.parse(fs.readFileSync(CORRECTION_REQUESTS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

export function saveAllCorrectionRequests(requests: GuardianCorrectionRequest[]) {
  ensureCorrectionFile();
  fs.writeFileSync(CORRECTION_REQUESTS_FILE, JSON.stringify(requests, null, 2), "utf-8");
}

export async function submitGuardianCorrectionRequest(
  guardianId: string,
  studentId: string,
  requestedFields: Record<string, { oldValue: any; requestedValue: any }>,
  reasonBn: string
): Promise<GuardianCorrectionRequest> {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  const guardian = await prisma.guardian.findUnique({ where: { id: guardianId } });

  if (!student || !guardian) {
    throw new Error("Student or Guardian record not found.");
  }

  // Verify guardian is linked to student
  const link = await prisma.guardianStudent.findUnique({
    where: {
      guardianId_studentId: {
        guardianId,
        studentId
      }
    }
  });
  if (!link) {
    throw new Error("আপনি এই শিক্ষার্থীর নিবন্ধিত অভিভাবক নন। তথ্য সংশোধনের আবেদন বাতিল করা হলো।");
  }

  const allReqs = getAllCorrectionRequests();
  const year = new Date().getFullYear();
  const newReq: GuardianCorrectionRequest = {
    id: `REQ-CORR-${year}-${Math.floor(10000 + Math.random() * 90000)}`,
    guardianId,
    studentId,
    studentIdNumber: student.studentIdNumber,
    guardianNameBn: guardian.fullNameBn,
    requestedFields,
    reasonBn,
    status: "SUBMITTED",
    submittedAt: new Date().toISOString()
  };

  allReqs.unshift(newReq);
  saveAllCorrectionRequests(allReqs);

  return newReq;
}

export async function reviewGuardianCorrectionRequest(
  requestId: string,
  decision: "APPROVED" | "REJECTED",
  actorId: string,
  notes: string
): Promise<GuardianCorrectionRequest> {
  const allReqs = getAllCorrectionRequests();
  const req = allReqs.find(r => r.id === requestId);
  if (!req) {
    throw new Error(`Correction request '${requestId}' not found.`);
  }

  req.status = decision;
  req.reviewedBy = actorId;
  req.reviewedAt = new Date().toISOString();
  req.reviewNotes = notes;

  if (decision === "APPROVED") {
    // Apply updates safely to Student Master
    const updateData: Record<string, any> = {};
    for (const [key, change] of Object.entries(req.requestedFields)) {
      // Whitelist safe editable fields
      if (["fullNameBn", "fullNameEn", "fatherNameBn", "motherNameBn", "presentAddress", "permanentAddress", "bloodGroup"].includes(key)) {
        updateData[key] = change.requestedValue;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.student.update({
        where: { id: req.studentId },
        data: updateData
      });

      const userRecord = await prisma.user.findFirst({ where: { OR: [{ id: actorId }, { username: actorId }] } });
      const validUserId = userRecord ? userRecord.id : null;

      await prisma.auditLog.create({
        data: {
          action: "GUARDIAN_REQUESTED_STUDENT_UPDATE",
          entityType: "Student",
          entityId: req.studentId,
          detailsJson: JSON.stringify({
            requestId,
            studentIdNumber: req.studentIdNumber,
            changes: updateData,
            reviewer: actorId
          }),
          userId: validUserId
        }
      });
    }
  }

  saveAllCorrectionRequests(allReqs);
  return req;
}
