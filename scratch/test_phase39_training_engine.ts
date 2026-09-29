/**
 * EHRJ MADRASHA ERP — PHASE 39
 * Complete Automated Verification & Testing Suite
 * Checkpoint: EHRJ-AI-2026-PHASE39
 */

import {
  getAllTrainingPrograms,
  getTrainingProgramById,
  saveTrainingProgram,
  getAllEnrollments,
  saveEnrollment,
  getAllAttendanceRecords,
  saveAttendanceRecord,
  getAllCertificates,
  saveCertificate,
  getTrainingDashboardStats,
  createTrainingProgram,
  transitionProgramStatus,
  canTransitionProgram,
  addOrUpdateSession,
  enrollParticipant,
  recordSessionAttendance,
  verifyQrCheckIn,
  recalculateEnrollmentAttendance,
  getSanitizedAssessment,
  submitAssessmentAttempt,
  instructorEvaluateSubmission,
  checkCertificateEligibility,
  issueTrainingCertificate,
  renewCertificate,
  getEmployeeTrainingProfile,
  buildCalendarEventForSession,
} from "../src/lib/training";

async function runPhase39Tests() {
  console.log("================================================================================");
  console.log("       EHRJ MADRASHA ERP — PHASE 39 TEST SUITE");
  console.log("       Teacher/Staff Training, Professional Development & Certification Engine");
  console.log("       Checkpoint: EHRJ-AI-2026-PHASE39");
  console.log("================================================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  [PASS] Test ${totalTests}: ${testName}`);
    } else {
      console.error(`  [FAIL] Test ${totalTests}: ${testName}`);
      if (detail) console.error(`         Detail: ${detail}`);
    }
  }

  const actorAdmin = {
    actorId: "EMP-ADM-001",
    actorName: "এডমিন সাহেব",
    actorRole: "ADMIN",
  };

  // -------------------------------------------------------------------------
  // TEST GROUP 1: LIFECYCLE & STATE MACHINE TRANSITIONS
  // -------------------------------------------------------------------------
  console.log("--> Testing Training Lifecycle & State Transitions...");

  const newProg = createTrainingProgram(
    {
      titleBn: "পরীক্ষামূলক তাজবীদ কর্মশালা",
      titleEn: "Experimental Tajweed Workshop",
      trainingType: "QURAN_TAHFEEZ_PEDAGOGY",
      deliveryMethod: "WORKSHOP",
      description: "টেস্টিং উদ্দেশ্যে তৈরি প্রোগ্রাম",
      instructorName: "মাওলানা ক্বারী হাবিবুল্লাহ সাহেব",
      instructorRole: "প্রধান ক্বারী",
      totalHours: 10,
      mandatoryStatus: "MANDATORY",
      capacity: 2, // Small capacity to test waitlist
      attendanceThresholdPercentage: 80,
      requiresAssessment: true,
      passPercentage: 70,
    },
    actorAdmin
  );

  assert(!!newProg.id && newProg.id.startsWith("EHRJ-TRN-"), "Program creation assigns valid EHRJ-TRN ID", newProg.id);
  assert(newProg.status === "DRAFT", "New program starts in DRAFT status", newProg.status);

  // Transition DRAFT -> REVIEW
  const trans1 = transitionProgramStatus(newProg.id, "REVIEW", actorAdmin);
  assert(trans1.success && trans1.program?.status === "REVIEW", "Transition DRAFT -> REVIEW succeeds");

  // Invalid transition: REVIEW -> COMPLETED should fail
  const invalidTrans = transitionProgramStatus(newProg.id, "COMPLETED", actorAdmin);
  assert(!invalidTrans.success, "Invalid transition REVIEW -> COMPLETED is blocked gracefully");

  // Transition REVIEW -> APPROVED -> PUBLISHED -> REGISTRATION_OPEN
  transitionProgramStatus(newProg.id, "APPROVED", actorAdmin);
  transitionProgramStatus(newProg.id, "PUBLISHED", actorAdmin);
  const transOpen = transitionProgramStatus(newProg.id, "REGISTRATION_OPEN", actorAdmin);
  assert(transOpen.success && transOpen.program?.status === "REGISTRATION_OPEN", "Transition to REGISTRATION_OPEN succeeds");

  // -------------------------------------------------------------------------
  // TEST GROUP 2: SESSIONS & PHASE 33 CALENDAR INTEGRATION
  // -------------------------------------------------------------------------
  console.log("\n--> Testing Session Scheduling & Phase 33 Calendar Payload...");

  const sessionRes = addOrUpdateSession(
    newProg.id,
    {
      sessionNumber: 1,
      titleBn: "তাজবীদ প্রথম সেশন",
      titleEn: "Tajweed Session 1",
      sessionDate: "2026-10-05",
      startTime: "09:00",
      endTime: "11:00",
      venue: "সেমিনার হল ৩",
      facilitatorName: "মাওলানা ক্বারী হাবিবুল্লাহ",
      facilitatorRole: "উস্তাদ",
      capacity: 25,
      status: "SCHEDULED",
    },
    actorAdmin
  );

  assert(sessionRes.success && !!sessionRes.session?.id, "Session added successfully to program");

  if (sessionRes.session) {
    const calPayload = buildCalendarEventForSession(newProg, sessionRes.session);
    assert(calPayload.category === "TRAINING", "Calendar payload category is TRAINING");
    assert(calPayload.sourcePhase === "PHASE_39_TRAINING", "Calendar payload links to PHASE_39_TRAINING");
    assert(calPayload.startDate === "2026-10-05T09:00:00", "Calendar start time is correctly formatted");
  }

  // -------------------------------------------------------------------------
  // TEST GROUP 3: PARTICIPANT ENROLLMENT, CAPACITY & WAITLISTING
  // -------------------------------------------------------------------------
  console.log("\n--> Testing Participant Enrollment, Capacity & Waitlist...");

  // Participant 1 (Should be CONFIRMED)
  const p1 = enrollParticipant(
    newProg.id,
    {
      employeeId: "EHRJ-EMP-TEST-001",
      employeeName: "উস্তাদ আহমদ শাকিল",
      designation: "হিফজ শিক্ষক",
      department: "হিফজ বিভাগ",
      userRole: "TEACHER",
    },
    {},
    actorAdmin
  );
  assert(p1.success && p1.status === "CONFIRMED", "Participant 1 enrolled with CONFIRMED status");

  // Participant 2 (Should be CONFIRMED, reaching capacity 2)
  const p2 = enrollParticipant(
    newProg.id,
    {
      employeeId: "EHRJ-EMP-TEST-002",
      employeeName: "উস্তাদ বোরহান উদ্দিন",
      designation: "হিফজ শিক্ষক",
      department: "হিফজ বিভাগ",
      userRole: "TEACHER",
    },
    {},
    actorAdmin
  );
  assert(p2.success && p2.status === "CONFIRMED", "Participant 2 enrolled with CONFIRMED status (capacity reached)");

  // Participant 3 (Capacity exceeded -> Should be WAITLISTED)
  const p3 = enrollParticipant(
    newProg.id,
    {
      employeeId: "EHRJ-EMP-TEST-003",
      employeeName: "উস্তাদ জহিরুল ইসলাম",
      designation: "নূরানী শিক্ষক",
      department: "নূরানী বিভাগ",
      userRole: "TEACHER",
    },
    {},
    actorAdmin
  );
  assert(p3.success && p3.status === "WAITLISTED", "Participant 3 enrolled with WAITLISTED status due to capacity limit");

  // Duplicate enrollment check
  const dupCheck = enrollParticipant(
    newProg.id,
    {
      employeeId: "EHRJ-EMP-TEST-001",
      employeeName: "উস্তাদ আহমদ শাকিল",
      designation: "হিফজ শিক্ষক",
      department: "হিফজ বিভাগ",
      userRole: "TEACHER",
    },
    {},
    actorAdmin
  );
  assert(dupCheck.status === "CONFIRMED", "Duplicate enrollment prevented and returns existing status");

  // -------------------------------------------------------------------------
  // TEST GROUP 4: ATTENDANCE ENGINE & QR CODE CHECK-IN
  // -------------------------------------------------------------------------
  console.log("\n--> Testing Attendance Engine & QR Verification...");

  const sessionId = sessionRes.session!.id;

  // Manual Attendance
  const attRes = recordSessionAttendance(
    {
      trainingProgramId: newProg.id,
      sessionId,
      employeeId: "EHRJ-EMP-TEST-001",
      employeeName: "উস্তাদ আহমদ শাকিল",
      status: "PRESENT",
      checkInTime: "2026-10-05T09:05:00.000Z",
    },
    actorAdmin
  );
  assert(attRes.success && attRes.record?.status === "PRESENT", "Attendance recorded as PRESENT");
  assert(attRes.updatedRate === 100, "Enrollment attendance rate recalculated to 100%", `${attRes.updatedRate}`);

  // QR Check-in verification
  const validQr = `EHRJ-QR-TRN-${sessionId}`;
  const qrCheck = verifyQrCheckIn(
    validQr,
    sessionId,
    { employeeId: "EHRJ-EMP-TEST-002", employeeName: "উস্তাদ বোরহান উদ্দিন" },
    actorAdmin
  );
  assert(qrCheck.success && qrCheck.record?.qrVerified === true, "Valid QR code check-in succeeds with qrVerified flag");

  // Invalid Cross-Session QR
  const invalidQrCheck = verifyQrCheckIn(
    "EHRJ-QR-TRN-DIFFERENT-SESSION",
    sessionId,
    { employeeId: "EHRJ-EMP-TEST-003", employeeName: "উস্তাদ জহিরুল ইসলাম" },
    actorAdmin
  );
  assert(!invalidQrCheck.success, "Invalid/Cross-session QR is blocked");

  // -------------------------------------------------------------------------
  // TEST GROUP 5: ASSESSMENT ENGINE & ANSWER SANITIZATION
  // -------------------------------------------------------------------------
  console.log("\n--> Testing Assessment Engine & Answer Sanitization...");

  // Attach assessment to program
  newProg.assessment = {
    id: "ASS-TEST-001",
    trainingProgramId: newProg.id,
    titleBn: "তাজবীদ ও মাখরাজ পরীক্ষা",
    passPercentage: 70,
    totalPoints: 20,
    questions: [
      {
        id: "q1",
        questionBn: "কুরআনে হরফে ইখফা কয়টি?",
        type: "MCQ",
        options: ["১০টি", "১৫টি", "১২টি", "১৪টি"],
        correctAnswer: "১৫টি",
        points: 10,
      },
      {
        id: "q2",
        questionBn: "গুন্নাহ ছাড়া ঈদগাম হরফ কয়টি?",
        type: "MCQ",
        options: ["২টি (র, লাম)", "৪টি", "৬টি", "৩টি"],
        correctAnswer: "২টি (র, লাম)",
        points: 10,
      },
    ],
  };
  saveTrainingProgram(newProg);

  // Check Sanitization (Non-admin must not receive correctAnswer)
  const sanitized = getSanitizedAssessment(newProg.id);
  assert(sanitized !== null, "Sanitized assessment returned");
  assert(
    sanitized?.questions[0].correctAnswer === "",
    "Correct answer is strictly redacted in sanitized assessment"
  );

  // Participant 1 submits all correct answers (Score: 20/20, 100% -> PASSED)
  const subPass = submitAssessmentAttempt(
    newProg.id,
    { employeeId: "EHRJ-EMP-TEST-001", employeeName: "উস্তাদ আহমদ শাকিল" },
    { q1: "১৫টি", q2: "২টি (র, লাম)" },
    actorAdmin
  );
  assert(subPass.success && subPass.submission?.status === "PASSED", "Correct quiz answers result in PASSED status");
  assert(subPass.submission?.percentage === 100, "Earned 100% score for correct answers");

  // Participant 2 submits incorrect answers (Score: 0/20 -> FAILED)
  const subFail = submitAssessmentAttempt(
    newProg.id,
    { employeeId: "EHRJ-EMP-TEST-002", employeeName: "উস্তাদ বোরহান উদ্দিন" },
    { q1: "১০টি", q2: "৪টি" },
    actorAdmin
  );
  assert(subFail.success && subFail.submission?.status === "FAILED", "Incorrect quiz answers result in FAILED status");

  // -------------------------------------------------------------------------
  // TEST GROUP 6: CERTIFICATE ISSUANCE, ELIGIBILITY & RENEWALS
  // -------------------------------------------------------------------------
  console.log("\n--> Testing Certificate Issuance & Renewal Engine...");

  // Participant 2 (Failed assessment) should NOT be eligible
  const elig2 = checkCertificateEligibility(newProg.id, "EHRJ-EMP-TEST-002");
  assert(!elig2.eligible, "Failed candidate is NOT eligible for certificate");

  // Participant 1 (100% attendance + 100% score) SHOULD be eligible
  const elig1 = checkCertificateEligibility(newProg.id, "EHRJ-EMP-TEST-001");
  assert(elig1.eligible, "Qualified candidate (attendance + passed assessment) IS eligible for certificate");

  // Issue Certificate
  const certRes = issueTrainingCertificate(newProg.id, "EHRJ-EMP-TEST-001", actorAdmin);
  assert(certRes.success && !!certRes.certificate, "Certificate issued successfully");
  assert(
    certRes.certificate?.verificationToken.startsWith("VER-TRN-"),
    "Certificate generates Phase 7/29 verification token",
    certRes.certificate?.verificationToken
  );

  // Idempotency: Issuing again returns the same certificate
  const certDup = issueTrainingCertificate(newProg.id, "EHRJ-EMP-TEST-001", actorAdmin);
  assert(certDup.certificate?.id === certRes.certificate?.id, "Certificate issuance is idempotent (no duplicate IDs)");

  // Renewal test
  const renewRes = renewCertificate(certRes.certificate!.id, actorAdmin);
  assert(renewRes.success && renewRes.certificate?.status === "RENEWED", "Certificate renewal updates status to RENEWED");

  // -------------------------------------------------------------------------
  // TEST GROUP 7: PHASE 13 EMPLOYEE PROFILE INTEGRATION BRIDGE
  // -------------------------------------------------------------------------
  console.log("\n--> Testing Phase 13 Employee Training Profile Bridge...");

  const profile = getEmployeeTrainingProfile("EHRJ-EMP-TEST-001");
  assert(profile.employeeId === "EHRJ-EMP-TEST-001", "Profile matches requested employee ID");
  assert(profile.completedTrainingsCount >= 1, "Completed trainings count reflected in employee profile");
  assert(profile.certificates.length >= 1, "Earned certificates referenced in employee profile");

  // -------------------------------------------------------------------------
  // TEST GROUP 8: INSTRUCTOR EVALUATION & DEVELOPMENT PLANS
  // -------------------------------------------------------------------------
  console.log("\n--> Testing Instructor Evaluation & Development Plans...");

  // Evaluate participant 2's failed submission manually with bonus feedback
  const evalRes = instructorEvaluateSubmission(
    subFail.submission!.id,
    16, // Adjusted score 16/20 = 80% (>= 70% passing threshold)
    "পুনরায় মৌখিক পরীক্ষা গ্রহণ করে উত্তীর্ণ করা হলো।",
    actorAdmin
  );
  assert(evalRes.success && evalRes.submission?.status === "PASSED", "Instructor evaluation elevates status to PASSED");
  assert(evalRes.submission?.score === 16 && evalRes.submission?.percentage === 80, "Adjusted score reflected accurately");

  // Professional Development Plan creation
  const plan = {
    id: `PDP-${Date.now()}`,
    employeeId: "EHRJ-EMP-TEST-001",
    employeeName: "উস্তাদ আহমদ শাকিল",
    department: "হিফজ বিভাগ",
    designation: "হিফজ শিক্ষক",
    objectiveBn: "আন্তর্জাতিক হিফজ ও কিরাত প্রতিযোগিতার বিচারক প্রশিক্ষণ",
    competencyCategory: "TEACHING",
    targetCompetencyLevel: "ADVANCED" as const,
    requiredTrainingIds: [newProg.id],
    targetCompletionDate: "2026-12-31",
    progressPercentage: 50,
    status: "ACTIVE" as const,
    createdBy: actorAdmin.actorName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const { saveDevelopmentPlan } = await import("../src/lib/training");
  saveDevelopmentPlan(plan);

  const updatedProfile = getEmployeeTrainingProfile("EHRJ-EMP-TEST-001");
  assert(
    updatedProfile.developmentPlans.some((p) => p.id === plan.id),
    "Development plan successfully linked to employee training profile"
  );

  // -------------------------------------------------------------------------
  // TEST GROUP 9: DASHBOARD STATS & SECURITY INVARIANTS
  // -------------------------------------------------------------------------
  console.log("\n--> Testing Dashboard Stats Calculation & Security Invariants...");

  const stats = getTrainingDashboardStats();
  assert(stats.totalPrograms >= 1, "Dashboard stats reflect total programs");
  assert(stats.certificatesIssuedCount >= 1, "Dashboard stats reflect issued certificates");
  assert(typeof stats.mandatoryCompletionRate === "number", "Mandatory completion rate is numeric");

  // Invariant 1: Strictly NO SMS allowed in notification workflows
  const fs = await import("fs");
  const trainingFiles = fs.readdirSync("./src/lib/training");
  let hasSmsInvocation = false;
  for (const f of trainingFiles) {
    const content = fs.readFileSync(`./src/lib/training/${f}`, "utf8");
    if (content.includes("sendSms") || content.includes("smsGateway") || content.includes("twilio")) {
      hasSmsInvocation = true;
    }
  }
  assert(!hasSmsInvocation, "INVARIANT CONFIRMED: Strictly NO SMS invocations exist in Phase 39 Engine");

  // Invariant 2: Answer Keys redacted from all participant views
  const rawProgram = getTrainingProgramById(newProg.id);
  assert(!!rawProgram?.assessment?.questions[0].correctAnswer, "Admin data preserves question answer key");
  const sanitizedAgain = getSanitizedAssessment(newProg.id);
  assert(
    sanitizedAgain?.questions.every((q) => q.correctAnswer === ""),
    "INVARIANT CONFIRMED: Answer keys strictly redacted for participant endpoints"
  );

  console.log("\n================================================================================");
  console.log(`Phase 39 Test Execution Complete: ${passedTests}/${totalTests} Passed!`);
  console.log("================================================================================");

  if (passedTests === totalTests) {
    console.log("ALL PHASE 39 VERIFICATION TESTS PASSED SUCCESSFULLY! ✓\n");
    process.exit(0);
  } else {
    console.error("SOME TESTS FAILED! ✗\n");
    process.exit(1);
  }
}

runPhase39Tests().catch((err) => {
  console.error("Unhandled test suite error:", err);
  process.exit(1);
});
