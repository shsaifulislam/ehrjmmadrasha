import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateApplicationNumber } from "@/lib/admissionId";
import { detectDuplicates } from "@/lib/duplicateDetection";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      source = "ONLINE", // ONLINE, OFFICE
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
    } = body;

    // 1. Mandatory Input Validation
    if (!studentNameBn || !dateOfBirth || !desiredClassId || !guardianName || !guardianPhone) {
      return NextResponse.json(
        { error: "আবশ্যকীয় তথ্যসমূহ (ছাত্রের বাংলা নাম, জন্মতারিখ, জামাত পছন্দ, অভিভাবকের নাম ও মোবাইল নম্বর) প্রদান করুন।" },
        { status: 400 }
      );
    }

    // 2. Idempotency & Duplicate Submission Protection
    if (submissionToken) {
      const existingApp = await prisma.application.findUnique({
        where: { submissionToken },
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
    }

    // 3. Resolve Academic Session if not provided
    let resolvedSessionId = sessionId;
    if (!resolvedSessionId) {
      const activeSess = await prisma.academicSession.findFirst({ where: { isCurrent: true } });
      resolvedSessionId = activeSess?.id;
    }

    // 4. Duplicate Record Detection (non-blocking warning)
    const duplicateMatches = await detectDuplicates({
      studentNameBn,
      dateOfBirth,
      fatherNameBn: fatherNameBn || guardianName,
      guardianPhone,
      birthCertificateNo,
      nidNo,
    });

    // 5. Generate Concurrency-safe Tracking ID (EHRJ-ADM-YYYY-XXXX)
    const currentYear = new Date().getFullYear();
    const applicationNumber = await generateApplicationNumber(currentYear);

    // 6. Create Application Record
    const application = await prisma.application.create({
      data: {
        applicationNumber,
        source: source === "OFFICE" ? "OFFICE" : "ONLINE",
        sessionId: resolvedSessionId,
        desiredClassId,
        desiredSectionId: desiredSectionId || null,
        studentNameBn: studentNameBn.trim(),
        studentNameEn: studentNameEn?.trim() || studentNameBn.trim(),
        studentNameAr: studentNameAr?.trim() || null,
        dateOfBirth: new Date(dateOfBirth),
        gender: gender || "MALE",
        bloodGroup: bloodGroup || null,
        birthCertificateNo: birthCertificateNo ? birthCertificateNo.trim() : null,
        nidNo: nidNo ? nidNo.trim() : null,
        nationality: nationality || "Bangladeshi",
        desiredResidentialStatus: desiredResidentialStatus || "NON_RESIDENTIAL",
        fatherNameBn: fatherNameBn ? fatherNameBn.trim() : guardianName.trim(),
        fatherPhone: fatherPhone ? fatherPhone.trim() : guardianPhone.trim(),
        fatherOccupation: fatherOccupation || null,
        motherNameBn: motherNameBn ? motherNameBn.trim() : null,
        motherPhone: motherPhone ? motherPhone.trim() : null,
        guardianName: guardianName.trim(),
        guardianPhone: guardianPhone.trim(),
        guardianEmail: guardianEmail ? guardianEmail.trim() : null,
        guardianRelation: guardianRelation || "FATHER",
        guardianAddress: guardianAddress || address || presentAddress || null,
        address: address || presentAddress || "",
        presentAddress: presentAddress || address || "",
        permanentAddress: permanentAddress || presentAddress || address || "",
        previousInstitute: previousInstitute || null,
        previousClass: previousClass || null,
        isOrphan: Boolean(isOrphan),
        isFinanciallyWeak: Boolean(isFinanciallyWeak),
        financialAssistanceRequested: Boolean(financialAssistanceRequested),
        specialAssistanceDetails: specialAssistanceDetails || null,
        documentsJson: documents ? JSON.stringify(documents) : null,
        submissionToken: submissionToken || null,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });

    // 7. Send Confirmation Email if guardian email is provided
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

    // 8. Audit Log
    await recordAuditLog({
      action: "ADMISSION_APPLY",
      entityType: "Application",
      entityId: application.id,
      details: {
        applicationNumber,
        source: application.source,
        hasDuplicateMatches: duplicateMatches.length > 0,
        duplicateCount: duplicateMatches.length,
      },
    });

    return NextResponse.json({
      success: true,
      applicationNumber,
      application,
      message: `ভর্তি আবেদন সফলভাবে জমা হয়েছে। ট্র্যাকিং আইডি: ${applicationNumber}`,
      duplicateMatches,
      hasDuplicateWarning: duplicateMatches.length > 0,
    });
  } catch (error: any) {
    console.error("POST Admission Apply Error:", error);
    return NextResponse.json(
      { error: error.message || "ভর্তি আবেদন জমা করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
