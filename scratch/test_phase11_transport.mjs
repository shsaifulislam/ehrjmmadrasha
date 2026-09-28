import { PrismaClient } from "@prisma/client";
import {
  createTransportDriver,
  getTransportDrivers,
  createTransportVehicle,
  getTransportVehicles,
  createTransportRoute,
  getTransportRoutes,
  createTransportStop,
  enrollStudentInTransport,
  changeStudentTransportRoute,
  cancelStudentTransport,
  submitTransportRequest,
  reviewTransportRequest,
  generateMonthlyTransportInvoiceForStudent,
  getTransportDashboardStats,
  getStudentTransportProfile,
} from "../src/lib/transportEngine.js";

const prisma = new PrismaClient();

async function runPhase11Tests() {
  console.log("=================================================");
  console.log("EHRJ MADRASHA ERP — PHASE 11 TRANSPORT TEST SUITE");
  console.log("=================================================\n");

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failedTests++;
    }
  }

  try {
    // 0. Resolve System Admin, Session & Students
    const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!adminUser) throw new Error("No admin user found in database");
    const adminUserId = adminUser.id;

    let activeSession = await prisma.academicSession.findFirst({ where: { isCurrent: true } });
    if (!activeSession) {
      activeSession = await prisma.academicSession.findFirst();
    }
    if (!activeSession) throw new Error("No academic session found in database");

    const students = await prisma.student.findMany({ take: 3 });
    if (students.length < 2) throw new Error("Need at least 2 students in database for testing");
    const [student1, student2] = students;

    const guardians = await prisma.guardian.findMany({
      include: { students: true },
      take: 2,
    });
    if (guardians.length === 0) throw new Error("No guardians found in database");
    const guardianWithChild = guardians.find((g) => g.students.length > 0) || guardians[0];

    console.log(`[Setup] Admin: ${adminUser.username}, Session: ${activeSession.name}, Student1: ${student1.studentIdNumber}`);

    // TEST 1: Driver Creation & Duplicate Protection
    console.log("\n--- TEST 1: Driver Operations ---");
    const testDriverPhone = `01799${Math.floor(100000 + Math.random() * 900000)}`;
    const testLicense = `LIC-${Math.floor(10000 + Math.random() * 90000)}`;

    const driver = await createTransportDriver({
      name: "মোহাম্মদ সেলিম ড্রাইভার",
      phone: testDriverPhone,
      address: "ইলিয়টগঞ্জ বাজার সংলগ্ন",
      licenseNumber: testLicense,
      licenseExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days in future
      emergencyContact: "01811223344",
      notes: "দক্ষ অভিজ্ঞ চালক",
      adminUserId,
    });

    assert(driver && driver.id, "Transport driver created successfully");
    assert(driver.name === "মোহাম্মদ সেলিম ড্রাইভার", "Driver name matches");

    // Test duplicate phone prevention
    let duplicatePhoneBlocked = false;
    try {
      await createTransportDriver({
        name: "ডুপ্লিকেট চালক",
        phone: testDriverPhone,
        licenseNumber: `LIC-DUP-${Date.now()}`,
        licenseExpiry: new Date(),
        adminUserId,
      });
    } catch (e) {
      duplicatePhoneBlocked = true;
    }
    assert(duplicatePhoneBlocked, "Duplicate driver phone correctly blocked");

    // TEST 2: Vehicle Creation & Unique Registration
    console.log("\n--- TEST 2: Vehicle Operations & Capacity Configuration ---");
    const testRegNumber = `ঢাকা মেট্রো-চ ${Math.floor(10 + Math.random() * 89)}-${Math.floor(1000 + Math.random() * 8999)}`;
    const testCapacity = 2; // small capacity to test capacity protection

    const vehicle = await createTransportVehicle({
      vehicleNumber: testRegNumber,
      vehicleType: "MICROBUS",
      model: "Toyota HiAce 2020",
      capacity: testCapacity,
      driverId: driver.id,
      notes: "টেস্ট মাইক্রোবাস",
      adminUserId,
    });

    assert(vehicle && vehicle.capacity === 2, "Transport vehicle created with capacity 2");

    let duplicateVehicleBlocked = false;
    try {
      await createTransportVehicle({
        vehicleNumber: testRegNumber,
        capacity: 20,
        adminUserId,
      });
    } catch (e) {
      duplicateVehicleBlocked = true;
    }
    assert(duplicateVehicleBlocked, "Duplicate vehicle registration number correctly blocked");

    // TEST 3: Route Creation & Uniqueness
    console.log("\n--- TEST 3: Route Operations ---");
    const testRouteCode = `TEST-RT-${Date.now().toString().slice(-4)}`;
    const route = await createTransportRoute({
      routeName: "ইলিয়টগঞ্জ বাজার — মাদ্রাসা ক্যাম্পাস",
      routeCode: testRouteCode,
      description: "টেস্ট প্রধান রুট",
      direction: "BOTH",
      startPoint: "ইলিয়টগঞ্জ বাজার মোড়",
      endPoint: "মাদ্রাসা ক্যাম্পাস গেট",
      vehicleId: vehicle.id,
      monthlyFee: 1200,
      adminUserId,
    });

    assert(route && route.routeCode === testRouteCode, "Transport route created successfully");

    let duplicateRouteBlocked = false;
    try {
      await createTransportRoute({
        routeName: "অন্য রুট",
        routeCode: testRouteCode,
        startPoint: "A",
        endPoint: "B",
        adminUserId,
      });
    } catch (e) {
      duplicateRouteBlocked = true;
    }
    assert(duplicateRouteBlocked, "Duplicate route code correctly blocked");

    // TEST 4: Stop Creation & Sequence
    console.log("\n--- TEST 4: Stop Operations & Sequence Ordering ---");
    const stop1 = await createTransportStop({
      routeId: route.id,
      stopName: "স্টপ ১: বাজার মোড়",
      address: "বাজারের পশ্চিম গেট",
      sequenceOrder: 1,
      pickupTime: "07:15 AM",
      dropTime: "04:30 PM",
      adminUserId,
    });

    const stop2 = await createTransportStop({
      routeId: route.id,
      stopName: "স্টপ ২: হাইওয়ে সংযোগ",
      address: "মেইন রোড ক্রসিং",
      sequenceOrder: 2,
      pickupTime: "07:30 AM",
      dropTime: "04:15 PM",
      adminUserId,
    });

    assert(stop1 && stop2, "Route stops created successfully");
    assert(stop1.sequenceOrder === 1 && stop2.sequenceOrder === 2, "Stops sequence order verified");

    // Duplicate sequence order within same route blocked
    let duplicateSeqBlocked = false;
    try {
      await createTransportStop({
        routeId: route.id,
        stopName: "ভুল স্টপ",
        sequenceOrder: 1,
        adminUserId,
      });
    } catch (e) {
      duplicateSeqBlocked = true;
    }
    assert(duplicateSeqBlocked, "Duplicate stop sequence order in same route correctly blocked");

    // TEST 5: Student Enrollment & Capacity Guard
    console.log("\n--- TEST 5: Student Enrollment & Capacity Guard ---");
    // Clean any preexisting enrollment for student1 in this session
    await prisma.transportEnrollment.updateMany({
      where: { studentId: student1.id, sessionId: activeSession.id, status: "ACTIVE" },
      data: { status: "CANCELLED" },
    });
    await prisma.transportEnrollment.updateMany({
      where: { studentId: student2.id, sessionId: activeSession.id, status: "ACTIVE" },
      data: { status: "CANCELLED" },
    });

    const enroll1 = await enrollStudentInTransport({
      studentId: student1.id,
      sessionId: activeSession.id,
      routeId: route.id,
      pickupStopId: stop1.id,
      dropStopId: stop2.id,
      monthlyFee: 1200,
      adminUserId,
    });

    assert(enroll1 && enroll1.status === "ACTIVE", "Student 1 enrolled in transport successfully");

    // Duplicate active enrollment for same student in same session blocked
    let duplicateEnrollBlocked = false;
    try {
      await enrollStudentInTransport({
        studentId: student1.id,
        sessionId: activeSession.id,
        routeId: route.id,
        pickupStopId: stop1.id,
        adminUserId,
      });
    } catch (e) {
      duplicateEnrollBlocked = true;
    }
    assert(duplicateEnrollBlocked, "Duplicate active transport enrollment for same student blocked");

    // Enroll student 2 (Vehicle capacity is 2, this takes the 2nd seat)
    const enroll2 = await enrollStudentInTransport({
      studentId: student2.id,
      sessionId: activeSession.id,
      routeId: route.id,
      pickupStopId: stop1.id,
      adminUserId,
    });
    assert(enroll2 && enroll2.status === "ACTIVE", "Student 2 enrolled (vehicle capacity now full at 2/2)");

    // Test 3rd student enrollment -> MUST BE BLOCKED BY CAPACITY GUARD!
    const student3 = students[2];
    if (student3) {
      let overCapacityBlocked = false;
      try {
        await enrollStudentInTransport({
          studentId: student3.id,
          sessionId: activeSession.id,
          routeId: route.id,
          pickupStopId: stop1.id,
          adminUserId,
        });
      } catch (e) {
        overCapacityBlocked = true;
      }
      assert(overCapacityBlocked, "Vehicle capacity guard successfully prevented over-allocation");
    }

    // TEST 6: Route Transfer & Historical Immutability
    console.log("\n--- TEST 6: Route Transfer & History Tracking ---");
    // Create a second route for transfer
    const route2 = await createTransportRoute({
      routeName: "রুট ২ — বিকল্প লিংক রোড",
      routeCode: `TEST-RT2-${Date.now().toString().slice(-4)}`,
      startPoint: "স্টেশন রোড",
      endPoint: "মাদ্রাসা",
      monthlyFee: 1400,
      adminUserId,
    });
    const stop2_1 = await createTransportStop({
      routeId: route2.id,
      stopName: "স্টেশন রোড স্টপ",
      sequenceOrder: 1,
      pickupTime: "07:20 AM",
      adminUserId,
    });

    const transfer = await changeStudentTransportRoute({
      enrollmentId: enroll1.id,
      newRouteId: route2.id,
      newPickupStopId: stop2_1.id,
      newMonthlyFee: 1400,
      reason: "বাসা পরিবর্তন",
      adminUserId,
    });

    assert(transfer && transfer.routeId === route2.id, "Student transferred to new route");

    // Verify history audit trail was written
    const history = await prisma.transportAssignmentHistory.findFirst({
      where: { enrollmentId: enroll1.id, action: "ROUTE_CHANGED" },
    });
    assert(history && history.oldRouteId === route.id && history.newRouteId === route2.id, "Historical assignment transition immutably logged");

    // TEST 7: Cancellation
    console.log("\n--- TEST 7: Transport Cancellation ---");
    const cancelled = await cancelStudentTransport({
      enrollmentId: enroll2.id,
      reason: "অভিভাবকের অনুরোধে প্রত্যাহার",
      adminUserId,
    });
    assert(cancelled && cancelled.status === "CANCELLED", "Transport enrollment cancelled successfully");

    // TEST 8: Guardian Transport Request & IDOR Protection
    console.log("\n--- TEST 8: Guardian Transport Request & IDOR Protection ---");
    const guardianChildId = guardianWithChild.students[0].studentId;
    const guardianUserRecord = await prisma.user.findFirst({
      where: {
        OR: [
          { id: guardianWithChild.userId || "" },
          { username: guardianWithChild.phone },
        ],
      },
    });

    if (guardianUserRecord) {
      // 8a. Legitimate request for own child
      const req = await submitTransportRequest({
        studentId: guardianChildId,
        guardianUserId: guardianUserRecord.id,
        routeId: route2.id,
        pickupStopId: stop2_1.id,
        preferredStartDate: new Date(),
        reason: "সন্তানের যাতায়াতের সুবিধার জন্য আবেদন",
      });

      assert(req && req.status === "SUBMITTED", "Guardian successfully submitted transport application for linked child");
      assert(req.requestNumber.startsWith("EHRJ-TRQ-"), "Unique tracking request number generated");

      // 8b. IDOR Protection: Attempt to request for unlinked student
      const unlinkedStudent = students.find((s) => s.id !== guardianChildId);
      if (unlinkedStudent) {
        let idorBlocked = false;
        try {
          await submitTransportRequest({
            studentId: unlinkedStudent.id,
            guardianUserId: guardianUserRecord.id,
            routeId: route2.id,
            pickupStopId: stop2_1.id,
            preferredStartDate: new Date(),
          });
        } catch (e) {
          idorBlocked = true;
        }
        assert(idorBlocked, "Strict IDOR protection blocked request for unlinked child");
      }

      // 8c. Admin Approval Workflow
      console.log("\n--- TEST 9: Admin Review & Transactional Approval ---");
      const approval = await reviewTransportRequest({
        requestId: req.id,
        action: "APPROVE",
        effectiveStartDate: new Date(),
        monthlyFee: 1400,
        adminUserId,
      });

      assert(approval.status === "APPROVED", "Admin approved transport request successfully");

      // Double approval blocked
      let doubleApprovalBlocked = false;
      try {
        await reviewTransportRequest({
          requestId: req.id,
          action: "APPROVE",
          adminUserId,
        });
      } catch (e) {
        doubleApprovalBlocked = true;
      }
      assert(doubleApprovalBlocked, "Double approval attempt correctly rejected");
    }

    // TEST 10: Phase 6 Finance Integration (Monthly Invoicing)
    console.log("\n--- TEST 10: Phase 6 Finance Integration ---");
    const billingMonth = "2026-10";
    const invoiceRes = await generateMonthlyTransportInvoiceForStudent({
      studentId: student1.id,
      billingMonth,
      adminUserId,
    });

    assert(invoiceRes && invoiceRes.success, "Monthly transport invoice created through Phase 6 Finance Engine");
    assert(invoiceRes.invoice && invoiceRes.invoice.feeType === "TRANSPORT", "Invoice fee type is TRANSPORT");

    // Idempotent billing verification
    const repeatInvoice = await generateMonthlyTransportInvoiceForStudent({
      studentId: student1.id,
      billingMonth,
      adminUserId,
    });
    assert(repeatInvoice && repeatInvoice.alreadyBilled, "Idempotent monthly billing prevented duplicate invoice");

    // TEST 11: Transport Dashboard Stats Aggregation
    console.log("\n--- TEST 11: Real-time Dashboard Stats ---");
    const stats = await getTransportDashboardStats();
    assert(stats && stats.totalRoutes > 0, "Dashboard aggregated total routes correctly");
    assert(stats.activeVehicles >= 0, "Dashboard aggregated vehicles correctly");
    assert(stats.finance !== undefined, "Dashboard integrated Phase 6 transport finance data");

    console.log("\n=================================================");
    console.log(`TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log("=================================================");

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("FATAL TEST ERROR:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase11Tests();
