import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateApplicationNumber } from "@/lib/admissionId";
import { detectDuplicates } from "@/lib/duplicateDetection";
import { recordAuditLog, checkAdmissionRateLimit, getClientIp } from "@/lib/security";

import { getSessionUser } from "@/lib/auth";

import crypto from "crypto";

export const dynamic = "force-dynamic";

function safeTrim(val: any): string {
  return typeof val === "string" ? val.trim() : "";
}

export async function POST(req: NextRequest) {
  try {
    // SEC-03: Pre-execution rate limit check BEFORE expensive processing
    const clientIp = getClientIp(req);
    const rateLimit = checkAdmissionRateLimit(clientIp);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many admission requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }

    // ADMISSION-STATUS-CHECK: Verify if institutional admission is currently open
    const { getAdmissionSettings } = await import("@/lib/systemSettings");
    const admissionSettings = getAdmissionSettings();
    if (!admissionSettings.isOpen) {
      return NextResponse.json(
        {
          error: admissionSettings.closedMessage || "বর্তমানে নতুন শিক্ষাবর্ষের ভর্তি কার্যক্রম সাময়িকভাবে বন্ধ রয়েছে।",
          admissionClosed: true,
          helplinePhone: admissionSettings.helplinePhone,
        },
        { status: 403 }
      );
    }

    // Optional session resolution: supports authenticated users or public prospective parents
    const sessionUser = await getSessionUser(req).catch(() => null);

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "অবৈধ JSON রিকোয়েস্ট বডি প্রদান করা হয়েছে।" },
        { status: 400 }
      );
    }

    const {
      source = "ONLINE",
      sessionId,
      desiredClassId,
      desiredSectionId,
      studentNameBn,
      studentNameEn,
      studentNameAr,
      dateOfBirth,
      gender = "MALE",
      bloodGroup,
      birthCertificateNo,
      nidNo,
      nationality = "Bangladeshi",
      desiredResidentialStatus = "NON_RESIDENTIAL",
      fatherNameBn,
      fatherPhone,
      fatherOccupation,
      motherNameBn,
      motherPhone,
      guardianName,
      guardianPhone,
      guardianEmail,
      guardianRelation = "FATHER",
      guardianAddress,
      address,
      presentAddress,
      permanentAddress,
      previousInstitute,
      previousClass,
      isOrphan = false,
      isFinanciallyWeak = false,
      financialAssistanceRequested = false,
      specialAssistanceDetails,
      documents,
      submissionToken,
    } = body || {};

    const cleanStudentNameBn = safeTrim(studentNameBn);
    const cleanGuardianName = safeTrim(guardianName || body?.guardianNameBn || body?.fatherNameBn);
    const cleanGuardianPhone = safeTrim(guardianPhone || body?.fatherPhone);
    const cleanDesiredClassId = safeTrim(desiredClassId || body?.desiredClass);
    const parsedDob = dateOfBirth ? new Date(dateOfBirth) : null;

    // 1. Mandatory Input Validation with strict type checking
    if (
      !cleanStudentNameBn ||
      !parsedDob ||
      isNaN(parsedDob.getTime()) ||
      !cleanDesiredClassId ||
      !cleanGuardianName ||
      !cleanGuardianPhone
    ) {
      return NextResponse.json(
        {
          error:
            "আবশ্যকীয় তথ্যসমূহ (ছাত্রের বাংলা নাম, সঠিক জন্মতারিখ, জামাত পছন্দ, অভিভাবকের নাম ও মোবাইল নম্বর) সঠিকভাবে প্রদান করুন।",
        },
        { status: 400 }
      );
    }

    // 2. Automatic Server-side Idempotency & Deduplication
    const activeSubmissionToken =
      (typeof submissionToken === "string" && submissionToken.trim()) ||
      crypto
        .createHash("sha256")
        .update(
          `${cleanStudentNameBn}-${cleanGuardianPhone}-${parsedDob.toISOString().slice(0, 10)}-${Math.floor(Date.now() / 45000)}`
        )
        .digest("hex");

    const existingApp = await prisma.application.findUnique({
      where: { submissionToken: activeSubmissionToken },
    });
    if (existingApp) {
      return NextResponse.json({
        success: true,
        applicationNumber: existingApp.applicationNumber,
        application: existingApp,
        isDuplicateSubmission: true,
        message: "আবেদনটি ইতিমধ্যে সফলভাবে গৃহীত হয়েছে (ডুপ্লিকেট সাবমিশন রোধ)।",
      });
    }

    // 3. Resolve Academic Session if not provided
    let resolvedSessionId = safeTrim(sessionId) || null;
    if (!resolvedSessionId) {
      const activeSess = await prisma.academicSession.findFirst({ where: { isCurrent: true } });
      resolvedSessionId = activeSess?.id || null;
    }

    // 4. Duplicate Record Detection (non-blocking warning)
    const duplicateMatches = await detectDuplicates({
      studentNameBn: cleanStudentNameBn,
      dateOfBirth: parsedDob,
      fatherNameBn: safeTrim(fatherNameBn) || cleanGuardianName,
      guardianPhone: cleanGuardianPhone,
      birthCertificateNo: safeTrim(birthCertificateNo) || undefined,
      nidNo: safeTrim(nidNo) || undefined,
    });

    // 5. Concurrency-Safe Application Creation with Optimistic Sequence Retry
    const currentYear = new Date().getFullYear();
    let application: any = null;
    let applicationNumber = "";

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        applicationNumber = await generateApplicationNumber(currentYear);
        application = await prisma.application.create({
          data: {
            applicationNumber,
            source: source === "OFFICE" ? "OFFICE" : "ONLINE",
            sessionId: resolvedSessionId,
            desiredClassId: cleanDesiredClassId,
            desiredSectionId: safeTrim(desiredSectionId) || null,
            studentNameBn: cleanStudentNameBn,
            studentNameEn: safeTrim(studentNameEn) || cleanStudentNameBn,
            studentNameAr: safeTrim(studentNameAr) || null,
            dateOfBirth: parsedDob,
            gender: safeTrim(gender) || "MALE",
            bloodGroup: safeTrim(bloodGroup) || null,
            birthCertificateNo: safeTrim(birthCertificateNo) || null,
            nidNo: safeTrim(nidNo) || null,
            nationality: safeTrim(nationality) || "Bangladeshi",
            desiredResidentialStatus: safeTrim(desiredResidentialStatus) || "NON_RESIDENTIAL",
            fatherNameBn: safeTrim(fatherNameBn) || cleanGuardianName,
            fatherPhone: safeTrim(fatherPhone) || cleanGuardianPhone,
            fatherOccupation: safeTrim(fatherOccupation) || null,
            motherNameBn: safeTrim(motherNameBn) || null,
            motherPhone: safeTrim(motherPhone) || null,
            guardianName: cleanGuardianName,
            guardianPhone: cleanGuardianPhone,
            guardianEmail: safeTrim(guardianEmail) || null,
            guardianRelation: safeTrim(guardianRelation) || "FATHER",
            guardianAddress: safeTrim(guardianAddress) || safeTrim(address) || safeTrim(presentAddress) || null,
            address: safeTrim(address) || safeTrim(presentAddress) || "",
            presentAddress: safeTrim(presentAddress) || safeTrim(address) || "",
            permanentAddress: safeTrim(permanentAddress) || safeTrim(presentAddress) || safeTrim(address) || "",
            previousInstitute: safeTrim(previousInstitute) || null,
            previousClass: safeTrim(previousClass) || null,
            isOrphan: Boolean(isOrphan),
            isFinanciallyWeak: Boolean(isFinanciallyWeak),
            financialAssistanceRequested: Boolean(financialAssistanceRequested),
            specialAssistanceDetails: safeTrim(specialAssistanceDetails) || null,
            documentsJson: documents ? JSON.stringify(documents) : null,
            submissionToken: activeSubmissionToken,
            status: "SUBMITTED",
            submittedAt: new Date(),
          },
        });
        break; // Successfully inserted
      } catch (err: any) {
        if (err.code === "P2002" && attempt < 3) {
          // Sequence number collision, wait with jitter and retry
          await new Promise((resolve) => setTimeout(resolve, Math.random() * 50 + 20));
          continue;
        }
        throw err;
      }
    }

    if (!application) {
      throw new Error("আবেদন নম্বর বরাদ্দে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
    }

    // 7. Sync Guardian profile with authenticated sessionUser (if logged in)
    try {
      if (sessionUser && sessionUser.userId) {
        const existingGuardian = await prisma.guardian.findFirst({
          where: {
            OR: [
              { userId: sessionUser.userId },
              { phone: cleanGuardianPhone },
            ],
          },
        });

        if (!existingGuardian) {
          await prisma.guardian.create({
            data: {
              userId: sessionUser.userId,
              fullNameBn: cleanGuardianName,
              phone: cleanGuardianPhone,
              email: safeTrim(guardianEmail) || sessionUser.email || null,
              relation: safeTrim(guardianRelation) || "FATHER",
              address: safeTrim(guardianAddress) || safeTrim(address) || safeTrim(presentAddress) || null,
            },
          });
        } else if (!existingGuardian.userId) {
          await prisma.guardian.update({
            where: { id: existingGuardian.id },
            data: { userId: sessionUser.userId },
          });
        }
      }
    } catch (gErr) {
      console.warn("Guardian sync note:", gErr);
    }

    // 8. Send Confirmation Email if guardian email is provided
    if (guardianEmail) {
      const jamatClass = await prisma.jamatClass.findUnique({
        where: { id: desiredClassId },
      });
      const className = jamatClass ? jamatClass.nameBn : "সাধারণ শ্রেণি";

      import("@/lib/mail").then(({ sendAdmissionConfirmationEmail }) => {
        sendAdmissionConfirmationEmail({
          to: guardianEmail,
          studentName: studentNameBn,
          applicationNumber,
          className,
          guardianPhone,
        }).catch((err) => console.error("Email send error:", err));
      });
    }

    // 9. Audit Log
    await recordAuditLog({
      userId: sessionUser?.userId || undefined,
      ipAddress: clientIp,
      action: "ADMISSION_APPLY",
      entityType: "Application",
      entityId: application.id,
      details: {
        applicationNumber,
        source: application.source,
        guardianPhone: cleanGuardianPhone,
        hasDuplicateMatches: duplicateMatches.length > 0,
        duplicateCount: duplicateMatches.length,
      },
    });

    return NextResponse.json({
      success: true,
      applicationNumber,
      trackingId: applicationNumber,
      application: {
        ...application,
        trackingId: applicationNumber,
      },
      message: `ভর্তি আবেদন সফলভাবে জমা হয়েছে। ট্র্যাকিং আইডি: ${applicationNumber}`,
      duplicateMatches,
      hasDuplicateWarning: duplicateMatches.length > 0,
    });
  } catch (error: any) {
    console.error("POST Admission Apply Error:", error);
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: "ভর্তি আবেদন জমা করতে সমস্যা হয়েছে। অনুগ্রহ করে কিছু সময় পর আবার চেষ্টা করুন।",
        ...(isDev && error?.message ? { debugMessage: error.message } : {}),
      },
      { status: 500 }
    );
  }
}
