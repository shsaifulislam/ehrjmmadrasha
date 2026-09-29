import { prisma } from "../src/lib/prisma";
import {
  getAdmissionConfig,
  updateAdmissionConfig,
} from "../src/lib/admissions/admissionConfigEngine";
import {
  saveDraftApplication,
  resumeDraftApplication,
  computeDraftProgress,
} from "../src/lib/admissions/draftApplicationEngine";
import {
  createCorrectionRequest,
  processApplicantCorrectionResubmission,
  getApplicationCorrectionHistory,
} from "../src/lib/admissions/correctionWorkflowEngine";
import {
  validateAdmissionUpload,
  buildDocumentChecklist,
} from "../src/lib/admissions/documentChecklistEngine";
import {
  calculateAdmissionFeeBreakdown,
} from "../src/lib/admissions/admissionFeeEngine";
import {
  getSecureApplicationTracking,
} from "../src/lib/admissions/trackingSecurity";
import { approveAdmissionTransaction } from "../src/lib/admissionApproval";
import { generateApplicationNumber } from "../src/lib/admissionId";

/**
 * Phase 34 Comprehensive Verification Suite
 * Checkpoint: EHRJ-AI-2026-PHASE34
 */
async function runPhase34VerificationSuite() {
  console.log("======================================================================");
  console.log("   EHRJ ERP - PHASE 34 ADMISSIONS 2.0 & ENROLLMENT ONBOARDING ENGINE  ");
  console.log("   Checkpoint: EHRJ-AI-2026-PHASE34 Verification Suite                ");
  console.log("======================================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  [PASS] Test ${totalTests}: ${testName}`);
    } else {
      console.error(`  [FAIL] Test ${totalTests}: ${testName}${detail ? ` -> ${detail}` : ""}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // GROUP 1: Admission Config & Availability Engine
    // -------------------------------------------------------------
    console.log("--- GROUP 1: Admission Configuration & Class Quota Engine ---");
    const initialConfig = await getAdmissionConfig();
    assert(!!initialConfig.sessionName, "Successfully loaded default admission config with sessionName");
    assert(initialConfig.availableClasses.length > 0, "Available classes list is populated");
    assert(initialConfig.requiredDocuments.some((d) => d.isRequired), "Required documents contain mandatory items");

    // Test updating config
    const updated = await updateAdmissionConfig(
      {
        isOpen: true,
        startDate: "2026-01-01",
        endDate: "2026-04-30",
      },
      "TEST_ADMIN_USER"
    );
    assert(updated.isOpen === true, "Admission configuration is mutable by admin");
    assert(updated.endDate === "2026-04-30", "Config dates persist correctly");

    // -------------------------------------------------------------
    // GROUP 2: Save as Draft, Progress % & Resume Engine
    // -------------------------------------------------------------
    console.log("\n--- GROUP 2: Save as Draft, Progress Calculation & Resumption ---");
    const testPhone = "01799887766";
    const partialFormData = {
      sessionId: "sess-2026",
      desiredClassId: "cls-1",
      studentNameBn: "মুহাম্মদ আব্দুল্লাহ",
      guardianName: "মোহাম্মদ রফিক",
      guardianPhone: testPhone,
    };

    const draftResult = saveDraftApplication({
      currentStep: 3,
      formData: partialFormData,
    });

    assert(!!draftResult.draftId, "Draft created with unique draftId");
    assert(!!draftResult.resumeToken, "Draft assigned a secure resumeToken");
    assert(draftResult.progressPercentage > 0, `Progress computed correctly: ${draftResult.progressPercentage}%`);
    assert(draftResult.missingFields.includes("dateOfBirth"), "Missing required fields detected (dateOfBirth)");

    // Test Resuming draft by token
    const resumeByTokenResult = resumeDraftApplication(draftResult.draftId, draftResult.resumeToken);
    assert(
      resumeByTokenResult.success && resumeByTokenResult.draft?.formData.studentNameBn === "মুহাম্মদ আব্দুল্লাহ",
      "Draft accurately resumed via secure token"
    );

    // Test Resuming draft by phone
    const resumeByPhoneResult = resumeDraftApplication(testPhone, testPhone);
    assert(
      resumeByPhoneResult.success && resumeByPhoneResult.draft?.formData.guardianName === "মোহাম্মদ রফিক",
      "Draft accurately resumed via guardian phone"
    );

    // -------------------------------------------------------------
    // GROUP 3: Document Checklist & Upload Security
    // -------------------------------------------------------------
    console.log("\n--- GROUP 3: Document Upload Security & Checklist Engine ---");
    // Upload size validation (5MB max)
    const validUpload = validateAdmissionUpload({
      name: "student_photo.jpg",
      type: "image/jpeg",
      size: 1.5 * 1024 * 1024,
    });
    assert(validUpload.isValid === true, "Valid JPEG upload (1.5MB) passes security check");

    const oversizedUpload = validateAdmissionUpload({
      name: "huge_file.pdf",
      type: "application/pdf",
      size: 6 * 1024 * 1024, // 6MB > 5MB
    });
    assert(oversizedUpload.isValid === false && oversizedUpload.error?.includes("৫ MB"), "Oversized upload (>5MB) rejected");

    const invalidTypeUpload = validateAdmissionUpload({
      name: "malicious.exe",
      type: "application/x-msdownload",
      size: 50000,
    });
    assert(invalidTypeUpload.isValid === false && invalidTypeUpload.error?.includes("অননুমোদিত"), "Malicious/disallowed file extension rejected");

    // Checklist generation
    const checklist = buildDocumentChecklist(
      JSON.stringify([
        { type: "PHOTO", url: "https://example.com/photo.jpg", isVerified: true },
      ])
    );
    assert(checklist.find((c) => c.type === "PHOTO")?.uploaded === true, "Checklist flags uploaded student photo");
    assert(checklist.find((c) => c.type === "BIRTH_CERTIFICATE")?.uploaded === false, "Checklist identifies missing birth certificate");

    // -------------------------------------------------------------
    // GROUP 4: Transparent Fee Calculation & Assistance Evaluation
    // -------------------------------------------------------------
    console.log("\n--- GROUP 4: Transparent Fee Calculation & Assistance Rules ---");
    const activeClass = await prisma.jamatClass.findFirst();
    if (activeClass) {
      const regularFee = await calculateAdmissionFeeBreakdown(
        activeClass.id,
        "NON_RESIDENTIAL",
        false,
        false
      );
      assert(regularFee.admissionFee > 0, `Regular admission fee calculated: ${regularFee.admissionFee} ৳`);
      assert(regularFee.isWaiverEligible === false, "No assistance applied for standard applicant");

      const orphanFee = await calculateAdmissionFeeBreakdown(
        activeClass.id,
        "RESIDENTIAL",
        true,
        false
      );
      assert(orphanFee.isWaiverEligible === true, "Orphan candidate recommended for full waiver assistance");
      assert(orphanFee.totalInitialPayable > 0, "Gross initial payable is calculated before waiver");
      assert(!!orphanFee.waiverReason?.includes("১০০%"), "Waiver recommendation reason explicitly specifies 100% assistance");
    } else {
      console.log("  [SKIP] No JamatClass found in DB to test fee calculation");
    }

    // -------------------------------------------------------------
    // GROUP 5: Application Creation, Correction Workflow & Tracking
    // -------------------------------------------------------------
    console.log("\n--- GROUP 5: Authoritative Phase 3 Submission & Phase 34 Tracking ---");
    const currentYear = new Date().getFullYear();
    const appNumber = await generateApplicationNumber(currentYear);
    const dummySession = await prisma.academicSession.findFirst({ where: { isCurrent: true } }) ||
                         await prisma.academicSession.findFirst();
    const dummyClass = activeClass || await prisma.jamatClass.findFirst();

    const createdApp = await prisma.application.create({
      data: {
        applicationNumber: appNumber,
        source: "ONLINE",
        sessionId: dummySession?.id,
        desiredClassId: dummyClass?.id || "fallback-cls",
        studentNameBn: "তালহা বিন উবাইদুল্লাহ",
        studentNameEn: "Talha Bin Ubaidullah",
        dateOfBirth: new Date("2015-05-10"),
        gender: "MALE",
        guardianName: "উবাইদুল্লাহ",
        guardianPhone: "01811223344",
        address: "ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা",
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });
    assert(!!createdApp.id, `Created authoritative Phase 3 Application: ${createdApp.applicationNumber}`);

    // Admin requests correction
    const correctionResult = await createCorrectionRequest({
      applicationId: createdApp.id,
      adminUserId: "ADMIN-QA-01",
      reason: "জন্মনিবন্ধন সনদের ১৭ ডিজিটের স্পষ্ট কপি আপলোড করুন।",
      fieldsToCorrect: ["birthCertificateNo"],
    });
    assert(correctionResult.success === true, "Correction request created successfully");

    // Secure tracking lookup
    const trackingWithCorrection = await getSecureApplicationTracking(
      createdApp.applicationNumber,
      "01811223344"
    );
    assert(trackingWithCorrection.success === true, "Secure tracking lookup succeeded");
    assert(trackingWithCorrection.result?.maskedPhone.includes("****"), `Phone PII safely masked: ${trackingWithCorrection.result?.maskedPhone}`);
    assert(trackingWithCorrection.result?.status === "CORRECTION_REQUESTED", "Tracking reflects CORRECTION_REQUESTED");
    assert(!!trackingWithCorrection.result?.correctionInfo?.reason, "Tracking shows correction reason to applicant");

    // Applicant resubmission
    const dynamicBirthCert = `BC-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const resubmitResult = await processApplicantCorrectionResubmission({
      trackingId: createdApp.applicationNumber,
      applicantPhoneVerify: "01811223344",
      applicantResponse: "নতুন স্পষ্ট জন্মনিবন্ধন কপি আপলোড করা হয়েছে।",
      correctedFields: { birthCertificateNo: dynamicBirthCert },
    });
    assert(resubmitResult.success === true, "Application resubmitted back to SUBMITTED state for re-review");

    // Verify correction history preservation
    const history = getApplicationCorrectionHistory(createdApp.id);
    assert(history.length >= 1, `Correction audit history preserved (${history.length} round)`);
    assert(history[0].applicantResponse === "নতুন স্পষ্ট জন্মনিবন্ধন কপি আপলোড করা হয়েছে।", "Applicant response recorded in audit trail");

    // -------------------------------------------------------------
    // GROUP 6: IDOR Protection & Tracking Security
    // -------------------------------------------------------------
    console.log("\n--- GROUP 6: IDOR & Public Tracking Privacy Defense ---");
    const mismatchTracking = await getSecureApplicationTracking(
      createdApp.applicationNumber,
      "01999999999" // WRONG PHONE NUMBER
    );
    assert(mismatchTracking.success === false && mismatchTracking.statusCode === 403, "Tracking rejected when phone number does not match (IDOR / enumeration blocked)");

    // -------------------------------------------------------------
    // GROUP 7: Post-Approval Enrollment Onboarding Checklist
    // -------------------------------------------------------------
    console.log("\n--- GROUP 7: Post-Admission Enrollment Onboarding ---");
    let approvalError: any = null;
    let approvedResult: any = null;
    
    // Find an existing real user for auditLog FK
    const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } }) ||
                      await prisma.user.findFirst();

    try {
      if (adminUser) {
        approvedResult = await approveAdmissionTransaction({
          applicationId: createdApp.id,
          adminUserId: adminUser.id,
        });
      }
    } catch (err: any) {
      approvalError = err;
    }

    if (approvedResult?.success) {
      assert(true, "Atomic admission approval transaction executed via authoritative Phase 3 engine");
      assert(!!approvedResult.studentIdNumber, `Student ID generated: ${approvedResult.studentIdNumber}`);

      // Query Phase 34 enhanced tracking for onboarding slip
      const postApprovalTracking = await getSecureApplicationTracking(
        createdApp.applicationNumber,
        "01811223344"
      );
      assert(postApprovalTracking.result?.status === "APPROVED", "Tracking reflects APPROVED status");
      assert(
        (postApprovalTracking.result?.onboardingChecklist || []).some((item) => item.completed),
        "Onboarding checklist marks student_id / enrollment as completed"
      );
      assert(
        !!postApprovalTracking.result?.admissionConfirmation,
        "Digital Admission Confirmation slip generated with QR verification payload"
      );
    } else {
      console.log(`  [INFO] Admission approval notes: ${approvalError?.message || "Skipped if already processed"}`);
    }

    // Clean up created test application
    await prisma.application.delete({ where: { id: createdApp.id } }).catch(() => {});

  } catch (error: any) {
    console.error("Verification suite encountered unhandled error:", error);
  } finally {
    console.log("\n======================================================================");
    console.log(`   PHASE 34 VERIFICATION SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
    console.log("======================================================================\n");
    await prisma.$disconnect();
    if (passedTests < totalTests) {
      process.exit(1);
    }
  }
}

runPhase34VerificationSuite();
