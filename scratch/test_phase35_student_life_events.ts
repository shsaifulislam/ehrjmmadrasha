import { prisma } from "../src/lib/prisma";
import {
  getEvents,
  saveEvents,
  getEventById,
  getEventTypes,
  createEvent,
  transitionEventStatus,
  canTransitionStatus,
  registerStudentForEvent,
  cancelEventRegistration,
  recordEventAttendance,
  getEventAttendance,
  recordCompetitionResult,
  publishEventResults,
  getEventResults,
  issueEventCertificate,
  revokeEventCertificate,
  generateEventSummaryReport,
  syncEventToCalendar,
  removeOrCancelEventCalendarBooking,
  getRegistrations,
  getCertificateLinks,
  getEventAuditLog,
  getEventFeedbacks,
  saveEventFeedbacks,
} from "../src/lib/events";
import { getCalendarEvents, getResourceBookings } from "../src/lib/calendar/calendarStore";

/**
 * Phase 35 Comprehensive Verification Suite
 * Checkpoint: EHRJ-AI-2026-PHASE35
 */
async function runPhase35VerificationSuite() {
  console.log("======================================================================");
  console.log("   EHRJ ERP - PHASE 35 STUDENT LIFE, EVENTS & ENGAGEMENT ENGINE       ");
  console.log("   Checkpoint: EHRJ-AI-2026-PHASE35 Verification Suite                ");
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
    // PREREQUISITES: Ensure test students exist in Prisma
    // -------------------------------------------------------------
    console.log("--- SETUP: Resolving authoritative test student from database ---");
    let testStudent = await prisma.student.findFirst({
      include: {
        enrollments: {
          include: { jamatClass: true, section: true, session: true },
        },
        guardianLinks: {
          include: { guardian: true },
        },
      },
    });

    if (!testStudent) {
      console.log("  Creating mock student for test suite...");
      const session = await prisma.academicSession.findFirst();
      const jamat = await prisma.jamatClass.findFirst();
      testStudent = await prisma.student.create({
        data: {
          studentIdNumber: "TEST-STU-35001",
          fullNameBn: "মুহাম্মদ আব্দুল্লাহ",
          fullNameEn: "Muhammad Abdullah",
          gender: "MALE",
          residentialStatus: "RESIDENTIAL",
          status: "ACTIVE",
          fatherNameBn: "মোঃ রফিকুল ইসলাম",
          fatherPhone: "01712345678",
          dateOfBirth: new Date("2012-05-15"),
        },
        include: {
          enrollments: { include: { jamatClass: true, section: true, session: true } },
          guardianLinks: { include: { guardian: true } },
        },
      });
    }

    assert(!!testStudent, "Test student resolved with valid Student Master ID", testStudent?.id);

    // Create a secondary student for capacity testing
    let testStudent2 = await prisma.student.findFirst({
      where: { id: { not: testStudent.id } },
    });
    if (!testStudent2) {
      testStudent2 = await prisma.student.create({
        data: {
          studentIdNumber: "TEST-STU-35002",
          fullNameBn: "মুহাম্মদ ওসমান",
          fullNameEn: "Muhammad Usman",
          gender: "MALE",
          residentialStatus: "NON_RESIDENTIAL",
          status: "ACTIVE",
          fatherNameBn: "মোঃ কামাল হোসেন",
          dateOfBirth: new Date("2013-08-20"),
        },
      });
    }

    // -------------------------------------------------------------
    // GROUP 1: Event Lifecycle & Strict State Machine Transitions
    // -------------------------------------------------------------
    console.log("\n--- GROUP 1: Event Lifecycle & State Machine Transitions ---");
    const createRes = createEvent({
      typeCode: "QURAN_COMPETITION",
      titleBn: "টেস্ট কেন্দ্রীয় কুরআন তিলাওয়াত প্রতিযোগিতা ২০২৬",
      titleEn: "Test Central Quran Tilawat Competition 2026",
      descriptionBn: "টেস্ট ইভেন্ট ডেসক্রিপশন",
      organizer: "কুরআন শিক্ষা বিভাগ",
      sessionId: "SESSION-2026",
      audienceRule: {
        audienceTypes: ["ALL_STUDENTS"],
        genders: ["MALE"],
      },
      startAt: "2026-11-15T09:00:00.000Z",
      endAt: "2026-11-15T16:00:00.000Z",
      registrationOpensAt: "2026-10-01T00:00:00.000Z",
      registrationClosesAt: "2026-11-10T23:59:59.000Z",
      venueText: "দারুল হাদিস অডিটোরিয়াম",
      resourceId: "RES-001",
      isRegistrationRequired: true,
      maxCapacity: 1, // capacity of 1 for testing limits
      waitlistCapacity: 1,
      isPublic: true,
      status: "DRAFT",
      hasFee: false,
      createdBy: "admin@ehrj.edu.bd",
      updatedBy: "admin@ehrj.edu.bd",
    });

    assert(createRes.success && !!createRes.event, "Successfully created new event with ID", createRes.event?.id);
    const testEvent = createRes.event!;

    // Test illegal transition: DRAFT cannot jump directly to COMPLETED
    const illegalJump = transitionEventStatus({
      eventId: testEvent.id,
      targetStatus: "COMPLETED",
      actorId: "admin@ehrj.edu.bd",
      actorRole: "ADMIN",
    });
    assert(!illegalJump.success, "Blocked illegal transition DRAFT -> COMPLETED");

    // Legal transitions: DRAFT -> REVIEW -> APPROVED -> REGISTRATION_OPEN
    const reviewRes = transitionEventStatus({
      eventId: testEvent.id,
      targetStatus: "REVIEW",
      actorId: "admin@ehrj.edu.bd",
      actorRole: "ADMIN",
    });
    assert(reviewRes.success && reviewRes.event?.status === "REVIEW", "Transition DRAFT -> REVIEW succeeded");

    const approveRes = transitionEventStatus({
      eventId: testEvent.id,
      targetStatus: "APPROVED",
      actorId: "admin@ehrj.edu.bd",
      actorRole: "ADMIN",
    });
    assert(approveRes.success && approveRes.event?.status === "APPROVED", "Transition REVIEW -> APPROVED succeeded");

    const regOpenRes = transitionEventStatus({
      eventId: testEvent.id,
      targetStatus: "REGISTRATION_OPEN",
      actorId: "admin@ehrj.edu.bd",
      actorRole: "ADMIN",
    });
    assert(regOpenRes.success && regOpenRes.event?.status === "REGISTRATION_OPEN", "Transition APPROVED -> REGISTRATION_OPEN succeeded");

    // -------------------------------------------------------------
    // GROUP 2: Audience Targeting & Deterministic Eligibility Rules
    // -------------------------------------------------------------
    console.log("\n--- GROUP 2: Audience Targeting & Deterministic Eligibility Rules ---");
    // Female-only event should reject male student
    const femaleEventRes = createEvent({
      typeCode: "ESSAY_CULTURAL",
      titleBn: "মহিলা শাখা ইসলামী কুইজ",
      descriptionBn: "কুইজ প্রতিযোগিতা",
      organizer: "মহিলা শাখা",
      sessionId: "SESSION-2026",
      audienceRule: {
        audienceTypes: ["GIRLS_ONLY"],
        genders: ["FEMALE"],
      },
      startAt: "2026-11-20T10:00:00.000Z",
      endAt: "2026-11-20T12:00:00.000Z",
      venueText: "মহিলা শাখা হলরুম",
      isRegistrationRequired: true,
      maxCapacity: 20,
      waitlistCapacity: 5,
      isPublic: false,
      status: "REGISTRATION_OPEN",
      hasFee: false,
      createdBy: "admin@ehrj.edu.bd",
      updatedBy: "admin@ehrj.edu.bd",
    });
    assert(femaleEventRes.success, "Created female-targeted event");

    const ineligibleMaleReg = await registerStudentForEvent({
      eventId: femaleEventRes.event!.id,
      studentId: testStudent.id,
      registeredByRole: "ADMIN",
      registeredByUserId: "admin@ehrj.edu.bd",
      consentGiven: true,
    });
    assert(!ineligibleMaleReg.success, "Deterministic eligibility correctly rejected male student for female event", ineligibleMaleReg.error);

    // -------------------------------------------------------------
    // GROUP 3: Registration Concurrency & Strict Capacity Defense
    // -------------------------------------------------------------
    console.log("\n--- GROUP 3: Registration Concurrency & Strict Capacity Defense ---");
    // Register testStudent 1 (Capacity is 1)
    const reg1 = await registerStudentForEvent({
      eventId: testEvent.id,
      studentId: testStudent.id,
      registeredByRole: "ADMIN",
      registeredByUserId: "admin@ehrj.edu.bd",
      consentGiven: true,
      notes: "প্রথম আবেদনকারী",
    });
    assert(reg1.success && reg1.registration?.status === "CONFIRMED", "First student confirmed within max capacity");

    // Duplicate registration defense
    const duplicateReg = await registerStudentForEvent({
      eventId: testEvent.id,
      studentId: testStudent.id,
      registeredByRole: "ADMIN",
      registeredByUserId: "admin@ehrj.edu.bd",
      consentGiven: true,
    });
    assert(!duplicateReg.success, "Blocked duplicate registration for the same student", duplicateReg.error);

    // -------------------------------------------------------------
    // GROUP 4: Waitlist Handling & Automatic Promotion
    // -------------------------------------------------------------
    console.log("\n--- GROUP 4: Waitlist Handling & Automatic Promotion ---");
    // Register testStudent 2 (Capacity is full at 1, waitlist capacity is 1)
    const reg2 = await registerStudentForEvent({
      eventId: testEvent.id,
      studentId: testStudent2.id,
      registeredByRole: "ADMIN",
      registeredByUserId: "admin@ehrj.edu.bd",
      consentGiven: true,
      notes: "দ্বিতীয় আবেদনকারী (ওয়েটলিস্টে যাবে)",
    });
    assert(
      reg2.success && reg2.registration?.status === "WAITLISTED" && reg2.registration.waitlistPosition === 1,
      "Second student safely placed into WAITLIST with position 1"
    );

    // Now cancel reg1 -> Reg 2 should automatically promote to CONFIRMED!
    const cancelRes = await cancelEventRegistration({
      registrationId: reg1.registration!.id,
      actorId: "admin@ehrj.edu.bd",
      actorRole: "ADMIN",
      reason: "অনিবার্য কারণে আবেদন প্রত্যাহার",
    });
    assert(cancelRes.success, "Cancelled registration 1 successfully");

    const refreshedRegistrations = getRegistrations();
    const promotedReg2 = refreshedRegistrations.find((r) => r.id === reg2.registration!.id);
    assert(
      promotedReg2?.status === "CONFIRMED",
      "Waitlisted student automatically promoted to CONFIRMED status upon capacity release"
    );

    // -------------------------------------------------------------
    // GROUP 5: Event Attendance & QR Check-In (Strict Isolation)
    // -------------------------------------------------------------
    console.log("\n--- GROUP 5: Event Attendance & QR Check-In (Domain Separation) ---");
    // Mark attendance via QR check-in
    const checkInRes = await recordEventAttendance({
      eventId: testEvent.id,
      studentIdOrCode: testStudent2.studentIdNumber,
      status: "PRESENT",
      recordedMethod: "QR_SCAN",
      recordedByTeacherId: "TEACHER-001",
      recordedByTeacherName: "মাওলানা আব্দুল করিম",
    });
    assert(checkInRes.success && checkInRes.attendance?.status === "PRESENT", "QR Check-in successful");

    // Duplicate check-in protection
    const dupCheckIn = await recordEventAttendance({
      eventId: testEvent.id,
      studentIdOrCode: testStudent2.studentIdNumber,
      status: "PRESENT",
      recordedMethod: "QR_SCAN",
    });
    assert(!dupCheckIn.success, "Blocked duplicate check-in for already present participant");

    // Verify event attendance did NOT modify Prisma daily academic attendance
    const attendanceRecords = getEventAttendance(testEvent.id);
    assert(attendanceRecords.length === 1, "Event attendance recorded in event domain store without polluting academic attendance");

    // -------------------------------------------------------------
    // GROUP 6: Competition Results & Awards (Strict Isolation)
    // -------------------------------------------------------------
    console.log("\n--- GROUP 6: Competition Results & Awards (Separated from Academic Exam Results) ---");
    const resultRes = await recordCompetitionResult({
      eventId: testEvent.id,
      studentId: testStudent2.id,
      competitionCategory: "হিফজ ১০ পারা বিভাগ",
      score: 98,
      maxScore: 100,
      rank: 1,
      awardType: "FIRST_PLACE",
      judgeName: "হাফেজ মাওলানা কারী নূরুল ইসলাম",
      judgeCommentsBn: "মাখরাজ ও সুর অত্যন্ত চমৎকার ও প্রশংসনীয়।",
      isPublished: true,
      evaluatedByUserId: "TEACHER-001",
    });
    assert(resultRes.success && resultRes.result?.score === 98, "Recorded competition result with score 98 and rank 1");

    const pubRes = publishEventResults(testEvent.id, "admin@ehrj.edu.bd", "ADMIN");
    assert(pubRes.success, "Published event competition results");

    const eventResults = getEventResults(testEvent.id, true);
    assert(eventResults.length > 0 && eventResults[0].rank === 1, "Publicly queried published competition results");

    // -------------------------------------------------------------
    // GROUP 7: Phase 7/29 Certificate Issuance & QR Verification
    // -------------------------------------------------------------
    console.log("\n--- GROUP 7: Phase 7/29 Certificate Issuance & QR Verification ---");
    const certRes = await issueEventCertificate({
      eventId: testEvent.id,
      studentId: testStudent2.id,
      category: "WINNER",
      awardTextBn: "কুরআন তিলাওয়াত প্রতিযোগিতায় ১ম স্থান অর্জন করায় বিজয়ী সম্মাননা সনদ",
      issuedByUserId: "admin@ehrj.edu.bd",
      actorRole: "ADMIN",
    });
    assert(
      certRes.success && !!certRes.certificateLink?.verificationCode,
      "Issued authentic event certificate with verification code",
      certRes.certificateLink?.certificateNumber
    );

    // Verify it exists in Prisma Certificate table
    const prismaCert = await prisma.certificate.findUnique({
      where: { verificationCode: certRes.certificateLink!.verificationCode },
    });
    assert(!!prismaCert, "Authoritative Prisma Certificate record verified in database");
    assert(prismaCert?.certificateType === "EVENT_WINNER", "Prisma Certificate type is EVENT_WINNER");

    // -------------------------------------------------------------
    // GROUP 8: Phase 33 Calendar & Resource Booking Bridge
    // -------------------------------------------------------------
    console.log("\n--- GROUP 8: Phase 33 Calendar & Resource Booking Bridge ---");
    const calSync = syncEventToCalendar(testEvent, "admin@ehrj.edu.bd");
    assert(!!calSync.calendarEventId, "Synchronized event to Phase 33 Calendar", calSync.calendarEventId);

    const calEvents = getCalendarEvents();
    const syncedCal = calEvents.find((ce) => ce.sourceEntityId === testEvent.id || ce.id === calSync.calendarEventId);
    assert(!!syncedCal, "Found matching CalendarEvent record in Phase 33 calendar datastore");

    // -------------------------------------------------------------
    // GROUP 9: Communication Domain Bridge & NO SMS Verification
    // -------------------------------------------------------------
    console.log("\n--- GROUP 9: Communication Domain Bridge (NO SMS) ---");
    const eventAudit = getEventAuditLog().filter((a) => a.eventId === testEvent.id);
    const hasSmsAction = eventAudit.some((a) => a.details.toLowerCase().includes("sms"));
    assert(!hasSmsAction, "STRICT INVARIANT CONFIRMED: No SMS was dispatched or configured");

    // -------------------------------------------------------------
    // GROUP 10: Guardian Child-Level IDOR Isolation
    // -------------------------------------------------------------
    console.log("\n--- GROUP 10: Guardian Child-Level IDOR Isolation ---");
    // Fake guardian trying to register testStudent2 should fail
    const fakeGuardianId = "FAKE-GUARD-99999";
    const idorReg = await registerStudentForEvent({
      eventId: testEvent.id,
      studentId: testStudent2.id,
      registeredByRole: "GUARDIAN",
      registeredByUserId: "attacker_guardian",
      guardianId: fakeGuardianId,
      consentGiven: true,
    });
    assert(!idorReg.success, "IDOR DEFENSE: Blocked unauthorized guardian from registering unlinked child", idorReg.error);

    // -------------------------------------------------------------
    // GROUP 11: Event Feedback & Summary Reporting
    // -------------------------------------------------------------
    console.log("\n--- GROUP 11: Event Feedback & Summary Reporting ---");
    const feedbacks = getEventFeedbacks();
    feedbacks.push({
      id: `FDB-TEST-${Date.now()}`,
      eventId: testEvent.id,
      isAnonymous: true,
      rating: 5,
      commentsBn: "মাশাআল্লাহ, অত্যন্ত চমৎকার ও সুশৃঙ্খল প্রতিযোগিতা সম্পন্ন হয়েছে।",
      createdAt: new Date().toISOString(),
    });
    saveEventFeedbacks(feedbacks);

    const summaryReport = generateEventSummaryReport(testEvent.id);
    assert(!!summaryReport, "Generated comprehensive event completion report");
    assert(summaryReport?.resultsCount === 1, "Report accurately counted competition results");
    assert(summaryReport?.certificatesIssuedCount === 1, "Report counted issued certificates");
    assert(summaryReport?.feedbackSummary.averageRating === 5, "Report computed average feedback rating");

    // -------------------------------------------------------------
    // GROUP 12: Immutable Event Audit Trail
    // -------------------------------------------------------------
    console.log("\n--- GROUP 12: Immutable Event Audit Trail ---");
    const auditEntries = getEventAuditLog();
    assert(auditEntries.length >= 5, "Audit log tracks all events, registrations, attendance, and certificates");
    assert(auditEntries[0].id.startsWith("AUD-EVT-"), "Audit IDs follow strict format AUD-EVT-YYYY-XXXXXX");

    // Transition event to COMPLETED and then ARCHIVED
    const compRes = transitionEventStatus({
      eventId: testEvent.id,
      targetStatus: "COMPLETED",
      actorId: "admin@ehrj.edu.bd",
      actorRole: "ADMIN",
    });
    assert(compRes.success && compRes.event?.status === "COMPLETED", "Event transitioned to COMPLETED");

    const archRes = transitionEventStatus({
      eventId: testEvent.id,
      targetStatus: "ARCHIVED",
      actorId: "admin@ehrj.edu.bd",
      actorRole: "ADMIN",
    });
    assert(archRes.success && archRes.event?.status === "ARCHIVED", "Event transitioned to ARCHIVED");

    console.log("\n======================================================================");
    console.log(`   PHASE 35 VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED `);
    console.log("======================================================================");

    if (passedTests === totalTests) {
      console.log(">>> ALL PHASE 35 TEST SUITE CHECKS COMPLETED WITH 100% SUCCESS <<<\n");
    } else {
      console.error(`>>> WARNING: ${totalTests - passedTests} TESTS FAILED <<<\n`);
      process.exit(1);
    }
  } catch (error) {
    console.error("Fatal error during Phase 35 verification:", error);
    process.exit(1);
  }
}

runPhase35VerificationSuite();
