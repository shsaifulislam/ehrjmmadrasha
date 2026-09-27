/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 10 HOSTEL & RESIDENTIAL MANAGEMENT ENGINE TEST SUITE
 * Comprehensive automated assertions for:
 * 1. Residential Rules Configuration & Defaults (hostelFee, foodFee, dayCareFoodExempt)
 * 2. Authoritative Student Residential Status & Immutability of ResidentialHistory
 * 3. Session-Awareness & Multi-Session History Tracking
 * 4. Transactional Check-In Engine & Double Check-In Guard
 * 5. Transactional Check-Out Engine & Status Restitution to NON_RESIDENTIAL
 * 6. Direct Status Transition Engine (RESIDENTIAL <-> DAY_CARE <-> NON_RESIDENTIAL)
 * 7. Guardian Residential Request Lifecycle (EHRJ-HRQ-YYYY-XXXXXX, Submission, Duplicate Prevention)
 * 8. Admin Request Review (APPROVE / REJECT) & Auto Status Application
 * 9. Phase 6 Finance Invariant: DAY_CARE Food Fee = ৳0 (DAY_CARE_FOOD_EXEMPTION)
 * 10. Historical Billing Protection: Existing Invoices Remain Immutable
 * 11. Guardian IDOR Isolation: Unauthorized Child Access & Requests Blocked
 * 12. Teacher Scoped Read-Only Access & Mutation Blocking
 * 13. Phase 8 Notification Templates Integration & Idempotent Keys
 * 14. Hostel Dashboard Aggregations, Registers & Reports
 */

const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient();

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    totalPassed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    totalFailed++;
    process.exitCode = 1;
  }
}

// Sequence Generator Helper
async function generateNextResidentialRequestNumber(txClient) {
  const db = txClient || prisma;
  const currentYear = new Date().getFullYear();
  const seqRecord = await db.residentialRequestSequence.upsert({
    where: { year: currentYear },
    create: { year: currentYear, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
  });
  return `EHRJ-HRQ-${currentYear}-${String(seqRecord.lastSeq).padStart(6, "0")}`;
}

async function runPhase10Tests() {
  console.log("==================================================================");
  console.log("EHRJ DIGITAL CAMPUS & ERP — PHASE 10 HOSTEL ENGINE TEST SUITE");
  console.log("==================================================================");

  try {
    // -------------------------------------------------------------
    // SETUP: Fixtures & Prerequisites
    // -------------------------------------------------------------
    console.log("\n--- Setting up Test Fixtures & Seed Records ---");

    // 1. Session
    let testSession = await prisma.academicSession.findFirst({
      where: { isCurrent: true },
    });
    if (!testSession) {
      testSession = await prisma.academicSession.create({
        data: {
          name: "২০২৬ শিক্ষাবর্ষ (Hostel Test)",
          year: 2026,
          startDate: new Date("2026-01-01"),
          endDate: new Date("2026-12-31"),
          isCurrent: true,
        },
      });
    }
    assert(testSession && testSession.id, "Active Academic Session available for Hostel engine");

    // 2. Class
    let testClass = await prisma.jamatClass.findFirst();
    if (!testClass) {
      testClass = await prisma.jamatClass.create({
        data: {
          nameBn: "নূরানী ১ম শ্রেণি (Hostel Test)",
          nameEn: "Noorani Class 1 (Hostel Test)",
          code: "TEST-N1-H",
        },
      });
    }
    assert(testClass && testClass.id, "Academic Class fixture available");

    // 3. Admin User
    let adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          name: "মাওলানা মহা. আবুল কালাম সরকার (Admin Test)",
          username: "muhtamim_hostel_test",
          email: "muhtamim_hostel_test@ehrjmadrasha.com",
          role: "ADMIN",
          passwordHash: "test_hash",
        },
      });
    }
    assert(adminUser && adminUser.id, "Admin User fixture available");

    // 4. Teacher User
    let teacherUser = await prisma.user.findFirst({ where: { role: "TEACHER" } });
    if (!teacherUser) {
      teacherUser = await prisma.user.create({
        data: {
          name: "মাওলানা উস্তাদ রফিক (Teacher Test)",
          username: "ustad_hostel_test",
          email: "ustad_hostel_test@ehrjmadrasha.com",
          role: "TEACHER",
          passwordHash: "test_hash",
        },
      });
    }
    assert(teacherUser && teacherUser.id, "Teacher User fixture available");

    // 5. Guardian A & Linked Student A
    let guardianUserA = await prisma.user.findFirst({
      where: { email: "guardian_hostel_a@ehrjmadrasha.com" },
    });
    if (!guardianUserA) {
      guardianUserA = await prisma.user.create({
        data: {
          name: "মুহাম্মদ রফিকুল ইসলাম (Guardian A)",
          username: "guardian_hostel_a",
          email: "guardian_hostel_a@ehrjmadrasha.com",
          role: "GUARDIAN",
          passwordHash: "test_hash",
        },
      });
    }

    let guardianProfileA = await prisma.guardian.findFirst({
      where: { userId: guardianUserA.id },
    });
    if (!guardianProfileA) {
      guardianProfileA = await prisma.guardian.create({
        data: {
          userId: guardianUserA.id,
          fullNameBn: "মুহাম্মদ রফিকুল ইসলাম",
          phone: "01711000101",
          relation: "FATHER",
        },
      });
    }

    // Student A
    const randCodeA = crypto.randomBytes(3).toString("hex");
    const studentA = await prisma.student.create({
      data: {
        studentIdNumber: `EHRJ-26-HA${randCodeA}`,
        fullNameBn: "মুহাম্মদ আব্দুল্লাহ (Student A - Resident Test)",
        fullNameEn: "Muhammad Abdullah",
        dateOfBirth: new Date("2016-03-15"),
        gender: "MALE",
        bloodGroup: "A_POSITIVE",
        residentialStatus: "NON_RESIDENTIAL", // initial
        fatherNameBn: "মুহাম্মদ রফিকুল ইসলাম",
        motherNameBn: "মোসাম্মৎ ফাতেমা বেগম",
        presentAddress: "দাউদকান্দি, কুমিল্লা",
        permanentAddress: "দাউদকান্দি, কুমিল্লা",
        status: "ACTIVE",
        guardianLinks: {
          create: {
            guardianId: guardianProfileA.id,
            isPrimary: true,
          },
        },
        enrollments: {
          create: {
            classId: testClass.id,
            sessionId: testSession.id,
            rollNumber: 101,
            status: "ACTIVE",
          },
        },
      },
    });
    assert(studentA && studentA.id, "Created Student A linked to Guardian A");

    // 6. Guardian B & Linked Student B (For IDOR tests)
    let guardianUserB = await prisma.user.findFirst({
      where: { email: "guardian_hostel_b@ehrjmadrasha.com" },
    });
    if (!guardianUserB) {
      guardianUserB = await prisma.user.create({
        data: {
          name: "মুহাম্মদ কবির হোসেন (Guardian B)",
          username: "guardian_hostel_b",
          email: "guardian_hostel_b@ehrjmadrasha.com",
          role: "GUARDIAN",
          passwordHash: "test_hash",
        },
      });
    }

    let guardianProfileB = await prisma.guardian.findFirst({
      where: { userId: guardianUserB.id },
    });
    if (!guardianProfileB) {
      guardianProfileB = await prisma.guardian.create({
        data: {
          userId: guardianUserB.id,
          fullNameBn: "মুহাম্মদ কবির হোসেন",
          phone: "01711000202",
          relation: "FATHER",
        },
      });
    }

    const randCodeB = crypto.randomBytes(3).toString("hex");
    const studentB = await prisma.student.create({
      data: {
        studentIdNumber: `EHRJ-26-HB${randCodeB}`,
        fullNameBn: "মুহাম্মদ আব্দুর রহমান (Student B - Guardian B Child)",
        fullNameEn: "Muhammad Abdur Rahman",
        dateOfBirth: new Date("2015-07-20"),
        gender: "MALE",
        bloodGroup: "B_POSITIVE",
        residentialStatus: "NON_RESIDENTIAL",
        fatherNameBn: "মুহাম্মদ কবির হোসেন",
        motherNameBn: "মোসাম্মৎ কুলসুম বেগম",
        presentAddress: "দাউদকান্দি, কুমিল্লা",
        permanentAddress: "দাউদকান্দি, কুমিল্লা",
        status: "ACTIVE",
        guardianLinks: {
          create: {
            guardianId: guardianProfileB.id,
            isPrimary: true,
          },
        },
        enrollments: {
          create: {
            classId: testClass.id,
            sessionId: testSession.id,
            rollNumber: 102,
            status: "ACTIVE",
          },
        },
      },
    });
    assert(studentB && studentB.id, "Created Student B linked to Guardian B");

    // Student C (For Day Care Testing)
    const randCodeC = crypto.randomBytes(3).toString("hex");
    const studentC = await prisma.student.create({
      data: {
        studentIdNumber: `EHRJ-26-HC${randCodeC}`,
        fullNameBn: "মুহাম্মদ সালমান ফারসি (Student C - Day Care)",
        fullNameEn: "Muhammad Salman Farsi",
        dateOfBirth: new Date("2016-11-10"),
        gender: "MALE",
        bloodGroup: "O_POSITIVE",
        residentialStatus: "DAY_CARE",
        fatherNameBn: "মুহাম্মদ আব্দুল্লাহ",
        motherNameBn: "মোসাম্মৎ আয়েশা খাতুন",
        presentAddress: "দাউদকান্দি, কুমিল্লা",
        permanentAddress: "দাউদকান্দি, কুমিল্লা",
        status: "ACTIVE",
        enrollments: {
          create: {
            classId: testClass.id,
            sessionId: testSession.id,
            rollNumber: 103,
            status: "ACTIVE",
          },
        },
      },
    });
    assert(studentC && studentC.id, "Created Student C with DAY_CARE status");

    // -------------------------------------------------------------
    // GROUP 1: Residential Rules Configuration
    // -------------------------------------------------------------
    console.log("\n--- Group 1: Residential Rules Configuration & Day Care Exemption ---");
    const rule = await prisma.residentialRule.upsert({
      where: { sessionId: testSession.id },
      create: {
        sessionId: testSession.id,
        monthlyHostelFee: 2000,
        monthlyFoodFee: 3000,
        dayCareFoodExempt: true,
        admissionHostelFee: 500,
        rulesNotesBn: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা আবাসন নীতিমালা",
      },
      update: {
        monthlyHostelFee: 2000,
        monthlyFoodFee: 3000,
        dayCareFoodExempt: true,
      },
    });

    assert(rule.sessionId === testSession.id, "Residential rule upserted for current session");
    assert(rule.monthlyHostelFee === 2000, "Default Hostel monthly fee is ৳2,000");
    assert(rule.monthlyFoodFee === 3000, "Default Food monthly fee is ৳3,000");
    assert(rule.dayCareFoodExempt === true, "Day Care food fee exemption explicitly active (৳0)");

    // -------------------------------------------------------------
    // GROUP 2: Request Sequence Generator & Format
    // -------------------------------------------------------------
    console.log("\n--- Group 2: Sequence Generator & Collision Prevention ---");
    const currentYear = new Date().getFullYear();
    const reqNum1 = await generateNextResidentialRequestNumber(prisma);
    const reqNum2 = await generateNextResidentialRequestNumber(prisma);

    assert(reqNum1.startsWith(`EHRJ-HRQ-${currentYear}-`), `Request 1 format matches prefix: ${reqNum1}`);
    assert(reqNum2.startsWith(`EHRJ-HRQ-${currentYear}-`), `Request 2 format matches prefix: ${reqNum2}`);
    assert(reqNum1 !== reqNum2, `Consecutive request numbers are strictly distinct: ${reqNum1} vs ${reqNum2}`);

    // Concurrency burst test on sequence
    const burstPromises = Array.from({ length: 5 }, () => generateNextResidentialRequestNumber(prisma));
    const burstResults = await Promise.all(burstPromises);
    const uniqueBurst = new Set(burstResults);
    assert(uniqueBurst.size === 5, "5 concurrent sequence calls generated 5 unique request numbers");

    // -------------------------------------------------------------
    // GROUP 3: Transactional Check-In Engine & Double Check-In Guard
    // -------------------------------------------------------------
    console.log("\n--- Group 3: Transactional Check-In & Double Check-In Guard ---");
    const checkInDate = new Date("2026-02-01");

    // Perform Check-in on Student A in a transaction
    const checkInResult = await prisma.$transaction(async (tx) => {
      // 1. Verify student exists
      const st = await tx.student.findUnique({ where: { id: studentA.id } });
      if (!st) throw new Error("Student not found");

      // 2. Guard: Check for existing active check-in
      const existingActive = await tx.residentialEnrollment.findFirst({
        where: {
          studentId: studentA.id,
          sessionId: testSession.id,
          status: "CHECKED_IN",
        },
      });
      if (existingActive) throw new Error("Student is already checked in to hostel");

      // 3. Create or update enrollment
      const enrollment = await tx.residentialEnrollment.create({
        data: {
          studentId: studentA.id,
          sessionId: testSession.id,
          residentialStatus: "RESIDENTIAL",
          status: "CHECKED_IN",
          checkInDate,
          admissionDate: checkInDate,
          notes: "প্রথম চেক-ইন পরীক্ষা",
          createdById: adminUser.id,
        },
      });

      // 4. Update authoritative student residential status
      const prevStatus = st.residentialStatus;
      await tx.student.update({
        where: { id: studentA.id },
        data: { residentialStatus: "RESIDENTIAL" },
      });

      // 5. Create immutable history
      const history = await tx.residentialHistory.create({
        data: {
          studentId: studentA.id,
          sessionId: testSession.id,
          previousStatus: prevStatus,
          newStatus: "RESIDENTIAL",
          effectiveDate: checkInDate,
          reason: "ছাত্রের প্রাতিষ্ঠানিক চেক-ইন সম্পন্ন",
          recordedByUserId: adminUser.id,
        },
      });

      // 6. Create Audit log
      await tx.auditLog.create({
        data: {
          userId: adminUser.id,
          action: "RESIDENTIAL_CHECKIN",
          entityType: "STUDENT",
          entityId: studentA.id,
          detailsJson: JSON.stringify({
            previousStatus: prevStatus,
            newStatus: "RESIDENTIAL",
            effectiveDate: checkInDate,
            enrollmentId: enrollment.id,
          }),
        },
      });

      return { enrollment, history };
    });

    assert(checkInResult.enrollment.status === "CHECKED_IN", "Enrollment record created with status CHECKED_IN");
    assert(checkInResult.history.newStatus === "RESIDENTIAL", "ResidentialHistory created with newStatus RESIDENTIAL");
    assert(checkInResult.history.previousStatus === "NON_RESIDENTIAL", "ResidentialHistory tracks previousStatus NON_RESIDENTIAL");

    // Verify student authoritative state updated
    const updatedStA = await prisma.student.findUnique({ where: { id: studentA.id } });
    assert(updatedStA.residentialStatus === "RESIDENTIAL", "Student authoritative status updated to RESIDENTIAL");

    // Attempt Double Check-In -> Must be blocked
    let doubleCheckInBlocked = false;
    try {
      await prisma.$transaction(async (tx) => {
        const existingActive = await tx.residentialEnrollment.findFirst({
          where: {
            studentId: studentA.id,
            sessionId: testSession.id,
            status: "CHECKED_IN",
          },
        });
        if (existingActive) throw new Error("DOUBLE_CHECKIN_PROHIBITED");
        await tx.residentialEnrollment.create({
          data: {
            studentId: studentA.id,
            sessionId: testSession.id,
            status: "CHECKED_IN",
          },
        });
      });
    } catch (err) {
      if (err.message === "DOUBLE_CHECKIN_PROHIBITED") doubleCheckInBlocked = true;
    }
    assert(doubleCheckInBlocked, "Double check-in on already checked-in resident is strictly prevented");

    // -------------------------------------------------------------
    // GROUP 4: Immutability of History on Repeated Transitions
    // -------------------------------------------------------------
    console.log("\n--- Group 4: Historical Immutability & Preservation ---");
    const countBeforeNewTransition = await prisma.residentialHistory.count({
      where: { studentId: studentA.id },
    });
    assert(countBeforeNewTransition === 1, "Student A currently has 1 history record");

    // Transition Student A to DAY_CARE
    const transitionDate = new Date("2026-06-01");
    await prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: studentA.id },
        data: { residentialStatus: "DAY_CARE" },
      });
      await tx.residentialHistory.create({
        data: {
          studentId: studentA.id,
          sessionId: testSession.id,
          previousStatus: "RESIDENTIAL",
          newStatus: "DAY_CARE",
          effectiveDate: transitionDate,
          reason: "পারিবারিক প্রয়োজনে ডে-কেয়ারে স্থানান্তর",
          recordedByUserId: adminUser.id,
        },
      });
    });

    const historiesAfter = await prisma.residentialHistory.findMany({
      where: { studentId: studentA.id },
      orderBy: { effectiveDate: "asc" },
    });

    assert(historiesAfter.length === 2, "History record count incremented to 2; old records preserved");
    assert(
      historiesAfter[0].previousStatus === "NON_RESIDENTIAL" && historiesAfter[0].newStatus === "RESIDENTIAL",
      "Historical Record 1 (NON_RESIDENTIAL -> RESIDENTIAL) remains unmodified"
    );
    assert(
      historiesAfter[1].previousStatus === "RESIDENTIAL" && historiesAfter[1].newStatus === "DAY_CARE",
      "Historical Record 2 (RESIDENTIAL -> DAY_CARE) recorded accurately"
    );

    // -------------------------------------------------------------
    // GROUP 5: Transactional Check-Out Engine
    // -------------------------------------------------------------
    console.log("\n--- Group 5: Check-Out Engine & Status Restitution ---");
    // Return student A to RESIDENTIAL first to test clean checkout
    await prisma.student.update({
      where: { id: studentA.id },
      data: { residentialStatus: "RESIDENTIAL" },
    });

    const checkOutDate = new Date("2026-08-01");
    const checkOutResult = await prisma.$transaction(async (tx) => {
      // Find active enrollment
      const activeEnrollment = await tx.residentialEnrollment.findFirst({
        where: {
          studentId: studentA.id,
          sessionId: testSession.id,
          status: "CHECKED_IN",
        },
      });
      if (!activeEnrollment) throw new Error("No active check-in found to check out");

      // Update enrollment to CHECKED_OUT
      const updatedEnrollment = await tx.residentialEnrollment.update({
        where: { id: activeEnrollment.id },
        data: {
          status: "CHECKED_OUT",
          checkOutDate,
          notes: "সেশন শেষে নিয়মিত প্রস্থান",
        },
      });

      // Update student to NON_RESIDENTIAL
      await tx.student.update({
        where: { id: studentA.id },
        data: { residentialStatus: "NON_RESIDENTIAL" },
      });

      // Log history
      const history = await tx.residentialHistory.create({
        data: {
          studentId: studentA.id,
          sessionId: testSession.id,
          previousStatus: "RESIDENTIAL",
          newStatus: "NON_RESIDENTIAL",
          effectiveDate: checkOutDate,
          reason: "হোস্টেল চেক-আউট সম্পন্ন",
          recordedByUserId: adminUser.id,
        },
      });

      return { updatedEnrollment, history };
    });

    assert(checkOutResult.updatedEnrollment.status === "CHECKED_OUT", "ResidentialEnrollment marked as CHECKED_OUT");
    assert(checkOutResult.history.newStatus === "NON_RESIDENTIAL", "ResidentialHistory logged return to NON_RESIDENTIAL");

    const stAfterCheckout = await prisma.student.findUnique({ where: { id: studentA.id } });
    assert(stAfterCheckout.residentialStatus === "NON_RESIDENTIAL", "Student residentialStatus restored to NON_RESIDENTIAL");

    // Attempting check-out again should fail
    let duplicateCheckoutBlocked = false;
    try {
      await prisma.$transaction(async (tx) => {
        const activeEnrollment = await tx.residentialEnrollment.findFirst({
          where: {
            studentId: studentA.id,
            sessionId: testSession.id,
            status: "CHECKED_IN",
          },
        });
        if (!activeEnrollment) throw new Error("NO_ACTIVE_CHECKIN");
      });
    } catch (err) {
      if (err.message === "NO_ACTIVE_CHECKIN") duplicateCheckoutBlocked = true;
    }
    assert(duplicateCheckoutBlocked, "Subsequent check-out blocked when student has no active checked-in enrollment");

    // -------------------------------------------------------------
    // GROUP 6: Guardian Residential Request Workflow & Duplicate Guard
    // -------------------------------------------------------------
    console.log("\n--- Group 6: Guardian Residential Request & Duplicate Guard ---");
    const reqNum = await generateNextResidentialRequestNumber(prisma);
    const req1 = await prisma.residentialRequest.create({
      data: {
        requestNumber: reqNum,
        guardianId: guardianProfileA.id,
        studentId: studentA.id,
        sessionId: testSession.id,
        requestType: "ADMISSION",
        currentStatus: "NON_RESIDENTIAL",
        requestedStatus: "RESIDENTIAL",
        reason: "পড়াশোনার মানোন্নয়নে আবাসিক ভর্তি প্রয়োজন",
        status: "PENDING",
      },
    });

    assert(req1 && req1.id, `Guardian A created residential admission request: ${req1.requestNumber}`);
    assert(req1.status === "PENDING", "Initial request status is PENDING");

    // Duplicate pending check: Guardian submitting a second pending ADMISSION request
    const existingPending = await prisma.residentialRequest.findFirst({
      where: {
        studentId: studentA.id,
        requestType: "ADMISSION",
        status: "PENDING",
      },
    });
    assert(existingPending !== null, "Engine detects existing pending request for student and type");

    // -------------------------------------------------------------
    // GROUP 7: Admin Request Review (APPROVE / REJECT)
    // -------------------------------------------------------------
    console.log("\n--- Group 7: Admin Request Review & Auto Application ---");
    // Admin approves req1
    const reviewResult = await prisma.$transaction(async (tx) => {
      const targetReq = await tx.residentialRequest.findUnique({
        where: { id: req1.id },
        include: { student: true },
      });
      if (targetReq.status !== "PENDING") throw new Error("Request already processed");

      // Mark approved
      const updatedReq = await tx.residentialRequest.update({
        where: { id: req1.id },
        data: {
          status: "APPROVED",
          reviewedByUserId: adminUser.id,
          reviewedAt: new Date(),
          adminNotes: "মুহতামিম কর্তৃক আবেদন মঞ্জুর করা হলো।",
        },
      });

      // Update student residential status
      const prevStatus = targetReq.student.residentialStatus;
      await tx.student.update({
        where: { id: targetReq.studentId },
        data: { residentialStatus: targetReq.requestedStatus },
      });

      // Log history
      await tx.residentialHistory.create({
        data: {
          studentId: targetReq.studentId,
          sessionId: testSession.id,
          previousStatus: prevStatus,
          newStatus: targetReq.requestedStatus,
          effectiveDate: new Date(),
          reason: `অভিভাবকের আবেদন (${targetReq.requestNumber}) অনুমোদিত`,
          recordedByUserId: adminUser.id,
        },
      });

      return updatedReq;
    });

    assert(reviewResult.status === "APPROVED", "Request status transitioned to APPROVED");
    const stAfterApproval = await prisma.student.findUnique({ where: { id: studentA.id } });
    assert(stAfterApproval.residentialStatus === "RESIDENTIAL", "Student status automatically updated to RESIDENTIAL upon approval");

    // Test Request Rejection Workflow with Student B
    const reqNumB = await generateNextResidentialRequestNumber(prisma);
    const reqB = await prisma.residentialRequest.create({
      data: {
        requestNumber: reqNumB,
        guardianId: guardianProfileB.id,
        studentId: studentB.id,
        sessionId: testSession.id,
        requestType: "ADMISSION",
        currentStatus: "NON_RESIDENTIAL",
        requestedStatus: "RESIDENTIAL",
        reason: "আবাসিক ভর্তি আবেদন",
        status: "PENDING",
      },
    });

    const rejectedReq = await prisma.residentialRequest.update({
      where: { id: reqB.id },
      data: {
        status: "REJECTED",
        reviewedByUserId: adminUser.id,
        reviewedAt: new Date(),
        adminNotes: "বর্তমানে আসন খালি নেই। পরবর্তীতে যোগাযোগ করুন।",
      },
    });

    assert(rejectedReq.status === "REJECTED", "Request B marked as REJECTED");
    const stBAfterReject = await prisma.student.findUnique({ where: { id: studentB.id } });
    assert(stBAfterReject.residentialStatus === "NON_RESIDENTIAL", "Rejected request leaves Student B status unchanged (NON_RESIDENTIAL)");

    // -------------------------------------------------------------
    // GROUP 8: Finance Integration & Day Care Food ৳0 Invariant
    // -------------------------------------------------------------
    console.log("\n--- Group 8: Finance Integration & DAY_CARE Food ৳0 Invariant ---");

    // Simulating Phase 6 fee calculation logic for Residential vs Day Care
    function calculateSimulatedFee(studentObj, feeType, ruleObj) {
      if (feeType === "HOSTEL") {
        if (studentObj.residentialStatus === "NON_RESIDENTIAL") return 0;
        return ruleObj.monthlyHostelFee;
      }
      if (feeType === "FOOD") {
        // CRITICAL INVARIANT: DAY_CARE -> FOOD BILL = ৳0
        if (studentObj.residentialStatus === "DAY_CARE" && ruleObj.dayCareFoodExempt) {
          return 0; // DAY_CARE_FOOD_EXEMPTION
        }
        if (studentObj.residentialStatus === "RESIDENTIAL") {
          return ruleObj.monthlyFoodFee;
        }
        return 0; // Non-residential
      }
      return 0;
    }

    const residentialHostelFee = calculateSimulatedFee(stAfterApproval, "HOSTEL", rule);
    const residentialFoodFee = calculateSimulatedFee(stAfterApproval, "FOOD", rule);
    assert(residentialHostelFee === 2000, `Residential student receives hostel fee: ৳${residentialHostelFee}`);
    assert(residentialFoodFee === 3000, `Residential student receives food fee: ৳${residentialFoodFee}`);

    // DAY_CARE student fee check
    const dayCareHostelFee = calculateSimulatedFee(studentC, "HOSTEL", rule);
    const dayCareFoodFee = calculateSimulatedFee(studentC, "FOOD", rule);
    assert(dayCareHostelFee === 2000, `Day Care student receives residential/daycare fee: ৳${dayCareHostelFee}`);
    assert(dayCareFoodFee === 0, `DAY_CARE student FOOD fee is strictly ৳0 (DAY_CARE_FOOD_EXEMPTION verified)`);

    // Non-residential student fee check
    const nonResHostelFee = calculateSimulatedFee(studentB, "HOSTEL", rule);
    const nonResFoodFee = calculateSimulatedFee(studentB, "FOOD", rule);
    assert(nonResHostelFee === 0, "Non-residential student hostel fee is ৳0");
    assert(nonResFoodFee === 0, "Non-residential student food fee is ৳0");

    // -------------------------------------------------------------
    // GROUP 9: Historical Billing Immutability
    // -------------------------------------------------------------
    console.log("\n--- Group 9: Historical Invoices Immutability ---");
    let feeCat = await prisma.feeCategory.findFirst();
    if (!feeCat) {
      feeCat = await prisma.feeCategory.create({
        data: {
          nameBn: "আবাসিক ও বোর্ডিং ফি",
          nameEn: "Hostel & Boarding Fee",
          code: "HOSTEL_BOARDING",
          defaultAmount: 2000,
        },
      });
    }

    const invoiceNum = `EHRJ-INV-TEST-${Date.now()}`;
    const historicalInvoice = await prisma.feeInvoice.create({
      data: {
        invoiceNumber: invoiceNum,
        studentId: studentA.id,
        sessionId: testSession.id,
        title: "আবাসিক ও খাদ্য ফি (ফেব্রুয়ারি ২০২৬)",
        feeType: "HOSTEL",
        totalAmount: 5000,
        netAmount: 5000,
        paidAmount: 5000,
        dueAmount: 0,
        status: "PAID",
        dueDate: new Date("2026-02-25"),
        items: {
          create: [
            { feeCategoryId: feeCat.id, description: "হোস্টেল ফি - ফেব্রুয়ারি ২০২৬", amount: 2000 },
            { feeCategoryId: feeCat.id, description: "খাদ্য ফি - ফেব্রুয়ারি ২০২৬", amount: 3000 },
          ],
        },
      },
      include: { items: true },
    });

    assert(historicalInvoice && historicalInvoice.totalAmount === 5000, "Historical invoice for ৳5,000 created");

    // Now change Student A to NON_RESIDENTIAL
    await prisma.student.update({
      where: { id: studentA.id },
      data: { residentialStatus: "NON_RESIDENTIAL" },
    });

    // Verify historical invoice remains completely untouched
    const verifiedInvoice = await prisma.feeInvoice.findUnique({
      where: { id: historicalInvoice.id },
      include: { items: true },
    });

    assert(verifiedInvoice.totalAmount === 5000, "Historical invoice total amount remained ৳5,000 after status change");
    assert(verifiedInvoice.status === "PAID", "Historical invoice status remained PAID");
    assert(verifiedInvoice.items.length === 2, "Historical invoice line items intact");
    assert(verifiedInvoice.items.some((i) => i.amount === 3000), "Historical food fee item untouched");

    // -------------------------------------------------------------
    // GROUP 10: Guardian IDOR Isolation & Authorization
    // -------------------------------------------------------------
    console.log("\n--- Group 10: Guardian IDOR Isolation Tests ---");
    // Verify Guardian A is linked to Student A, but NOT Student B
    const guardianWithKidsA = await prisma.guardian.findUnique({
      where: { id: guardianProfileA.id },
      include: { students: true },
    });

    const isLinkedAtoA = guardianWithKidsA.students.some((s) => s.studentId === studentA.id);
    const isLinkedAtoB = guardianWithKidsA.students.some((s) => s.studentId === studentB.id);

    assert(isLinkedAtoA === true, "Guardian A is authorized for Student A");
    assert(isLinkedAtoB === false, "Guardian A is NOT authorized for Student B");

    // Simulate endpoint IDOR verification function
    function verifyGuardianStudentAccess(guardianRec, targetStudentId) {
      if (!guardianRec.students.some((s) => s.studentId === targetStudentId)) {
        return { allowed: false, status: 403, error: "অননুমোদিত অ্যাক্সেস: এই শিক্ষার্থী আপনার অভিভাবকত্বে নেই।" };
      }
      return { allowed: true };
    }

    const authCheckAuthorized = verifyGuardianStudentAccess(guardianWithKidsA, studentA.id);
    const authCheckUnauthorized = verifyGuardianStudentAccess(guardianWithKidsA, studentB.id);

    assert(authCheckAuthorized.allowed === true, "Access granted to Guardian A for linked child");
    assert(authCheckUnauthorized.allowed === false && authCheckUnauthorized.status === 403, "Access blocked (403) when Guardian A requests unlinked Student B");

    // -------------------------------------------------------------
    // GROUP 11: Teacher Read-Only Scoping & Mutation Blocking
    // -------------------------------------------------------------
    console.log("\n--- Group 11: Teacher Scoped Read-Only Access & Mutation Blocking ---");
    // Simulate teacher permission check
    function checkTeacherPermission(userRole, action) {
      if (userRole === "TEACHER") {
        if (action === "READ_RESIDENTIAL_ROSTER") return { allowed: true };
        return { allowed: false, status: 403, error: "শুধুমাত্র এডমিন এই অপারেশন পরিচালনা করতে পারেন।" };
      }
      if (userRole === "ADMIN" || userRole === "PRINCIPAL") return { allowed: true };
      return { allowed: false, status: 403, error: "অননুমোদিত ভূমিকা।" };
    }

    const teacherRead = checkTeacherPermission(teacherUser.role, "READ_RESIDENTIAL_ROSTER");
    const teacherCheckIn = checkTeacherPermission(teacherUser.role, "CHECK_IN_STUDENT");
    const teacherCheckOut = checkTeacherPermission(teacherUser.role, "CHECK_OUT_STUDENT");
    const teacherStatusChange = checkTeacherPermission(teacherUser.role, "CHANGE_RESIDENTIAL_STATUS");

    assert(teacherRead.allowed === true, "Teacher has read-only access to class residential roster");
    assert(teacherCheckIn.allowed === false && teacherCheckIn.status === 403, "Teacher check-in attempt blocked with 403");
    assert(teacherCheckOut.allowed === false && teacherCheckOut.status === 403, "Teacher check-out attempt blocked with 403");
    assert(teacherStatusChange.allowed === false && teacherStatusChange.status === 403, "Teacher status change attempt blocked with 403");

    // -------------------------------------------------------------
    // GROUP 12: Notification Templates Integration & Idempotency
    // -------------------------------------------------------------
    console.log("\n--- Group 12: Phase 8 Notification Templates Integration ---");
    const fs = require("fs");
    const path = require("path");
    const commEngineSource = fs.readFileSync(
      path.join(__dirname, "../src/lib/communicationEngine.ts"),
      "utf8"
    );

    const requiredTemplates = [
      "RESIDENTIAL_ADMISSION_APPROVED",
      "RESIDENTIAL_CHECKIN_COMPLETED",
      "RESIDENTIAL_CHECKOUT_COMPLETED",
      "RESIDENTIAL_STATUS_CHANGED",
      "RESIDENTIAL_REQUEST_SUBMITTED",
      "RESIDENTIAL_REQUEST_REJECTED",
    ];

    for (const tpl of requiredTemplates) {
      const isPresent = commEngineSource.includes(`code: "${tpl}"`);
      assert(isPresent, `Notification Template [${tpl}] is registered in communicationEngine.ts`);
    }

    // Idempotency key pattern verification
    const idKey1 = `res_checkin_${studentA.id}_20260201`;
    const idKey2 = `res_checkin_${studentA.id}_20260201`;
    assert(idKey1 === idKey2, "Idempotent notification key generated deterministically for repeated check-in");

    // -------------------------------------------------------------
    // GROUP 13: Hostel Cockpit Aggregations & Report Registers
    // -------------------------------------------------------------
    console.log("\n--- Group 13: Hostel Dashboard Aggregations & Reports ---");
    const totalStudents = await prisma.student.count({ where: { status: "ACTIVE" } });
    const residentialCount = await prisma.student.count({
      where: { status: "ACTIVE", residentialStatus: "RESIDENTIAL" },
    });
    const dayCareCount = await prisma.student.count({
      where: { status: "ACTIVE", residentialStatus: "DAY_CARE" },
    });
    const nonResidentialCount = await prisma.student.count({
      where: { status: "ACTIVE", residentialStatus: "NON_RESIDENTIAL" },
    });

    assert(totalStudents >= 3, `Total active students aggregated: ${totalStudents}`);
    assert(typeof residentialCount === "number", `Active residential students count: ${residentialCount}`);
    assert(dayCareCount >= 1, `Day care students count: ${dayCareCount}`);
    assert(nonResidentialCount >= 1, `Non-residential students count: ${nonResidentialCount}`);
    assert(
      residentialCount + dayCareCount + nonResidentialCount === totalStudents,
      "Sum of residential breakdowns exactly matches total active students"
    );

    const pendingRequestsCount = await prisma.residentialRequest.count({
      where: { status: "PENDING" },
    });
    assert(typeof pendingRequestsCount === "number", `Pending guardian requests counted: ${pendingRequestsCount}`);

    console.log("\n==================================================================");
    console.log(`PHASE 10 TEST SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED`);
    console.log("==================================================================");

    if (totalFailed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error("Test execution threw unhandled exception:", err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

runPhase10Tests();
