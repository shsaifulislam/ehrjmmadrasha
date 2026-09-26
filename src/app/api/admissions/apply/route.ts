import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      studentNameBn,
      studentNameEn,
      dateOfBirth,
      gender,
      desiredClassId,
      desiredResidentialStatus,
      guardianName,
      guardianPhone,
      guardianEmail,
      address,
      isOrphan,
      financialAssistanceRequested,
    } = body;

    if (!studentNameBn || !dateOfBirth || !gender || !desiredClassId || !guardianName || !guardianPhone) {
      return NextResponse.json(
        { error: "সবগুলো আবশ্যক ফিল্ড পূরণ করুন।" },
        { status: 400 }
      );
    }

    const currentYear = new Date().getFullYear();
    const count = await prisma.application.count();
    const applicationNumber = `EHRJ-ADM-${currentYear}-${String(count + 1).padStart(4, "0")}`;

    // Duplicate warning detection (Phase 7 rule)
    const existing = await prisma.application.findFirst({
      where: {
        studentNameBn,
        guardianPhone,
      },
    });

    const application = await prisma.application.create({
      data: {
        applicationNumber,
        studentNameBn,
        studentNameEn: studentNameEn || "",
        dateOfBirth: new Date(dateOfBirth),
        gender,
        desiredClassId,
        desiredResidentialStatus: desiredResidentialStatus || "NON_RESIDENTIAL",
        guardianName,
        guardianPhone,
        guardianEmail: guardianEmail || null,
        address: address || "",
        isOrphan: Boolean(isOrphan),
        financialAssistanceRequested: Boolean(financialAssistanceRequested),
        status: "PENDING",
      },
    });

    // Send confirmation email asynchronously if email was supplied
    if (guardianEmail) {
      const jamatClass = await prisma.jamatClass.findUnique({
        where: { id: desiredClassId },
      });
      const className = jamatClass ? jamatClass.nameBn : "সাধারণ শ্রেণি";
      
      // Do not block response on email delivery
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

    await recordAuditLog({
      action: "ADMISSION_APPLY",
      entityType: "Application",
      entityId: application.id,
      details: {
        applicationNumber,
        hasDuplicateWarning: Boolean(existing),
      },
    });

    return NextResponse.json({
      success: true,
      applicationNumber,
      message: "ভর্তি আবেদন সফলভাবে গৃহীত হয়েছে। আপনার আবেদন নম্বরটি সংরক্ষণ করুন।",
      application,
      duplicateWarning: existing ? "একই নাম ও ফোন নম্বরে পূর্বে একটি আবেদন পাওয়া গেছে।" : null,
    });
  } catch (error) {
    console.error("Admission Apply Error:", error);
    return NextResponse.json(
      { error: "ভর্তি আবেদন প্রক্রিয়াকরণে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
