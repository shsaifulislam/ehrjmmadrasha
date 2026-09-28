import { prisma } from "../src/lib/prisma";
import {
  parseDateFilter,
  getOverviewAnalytics,
  getStudentsAnalytics,
  getAdmissionAnalytics,
  getAttendanceAnalytics,
  getAcademicAnalytics,
  getFinanceAnalytics,
  getOperationsAnalytics,
  getSessionComparison,
  getTeacherScopedAnalytics,
  getGuardianChildAnalytics,
  executeReportBuilder,
  createSavedReport,
  getSavedReports,
  deleteSavedReport,
} from "../src/lib/analyticsEngine";

async function runPhase15ApiTests() {
  console.log("=================================================================");
  console.log("  PHASE 15 — ADVANCED DASHBOARD & ANALYTICS ENGINE UNIT TESTS");
  console.log("=================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Setup Test Fixtures
    // -------------------------------------------------------------
    console.log("--- Setting Up Phase 15 Fixtures ---");
    const testAdmin = await prisma.user.upsert({
      where: { username: "admin_p15" },
      update: {},
      create: {
        username: "admin_p15",
        name: "Admin Phase 15",
        email: "admin_p15@ehrj.local",
        passwordHash: "$2a$12$eXAMPLehashForPhase15TestsAdminSecureKey99",
        role: "ADMIN",
        status: "ACTIVE",
      },
    });

    const testTeacher = await prisma.user.upsert({
      where: { username: "teacher_p15" },
      update: {},
      create: {
        username: "teacher_p15",
        name: "Teacher Phase 15",
        email: "teacher_p15@ehrj.local",
        passwordHash: "$2a$12$eXAMPLehashForPhase15TestsTeacherKey99",
        role: "TEACHER",
        status: "ACTIVE",
      },
    });

    const testGuardianUser = await prisma.user.upsert({
      where: { username: "guardian_p15" },
      update: {},
      create: {
        username: "guardian_p15",
        name: "Guardian Phase 15",
        email: "guardian_p15@ehrj.local",
        passwordHash: "$2a$12$eXAMPLehashForPhase15TestsGuardianKey99",
        role: "GUARDIAN",
        status: "ACTIVE",
      },
    });

    const testGuardian = await prisma.guardian.upsert({
      where: { phone: "01826999915" },
      update: { userId: testGuardianUser.id },
      create: {
        fullNameBn: "কফিল উদ্দিন (অভিভাবক P15)",
        phone: "01826999915",
        relation: "FATHER",
        userId: testGuardianUser.id,
        occupation: "Business",
        nidNo: "NID-P15-G1",
      },
    });

    // Academic Sessions
    const session2025 = await prisma.academicSession.upsert({
      where: { name: "2025 Academic Session" },
      update: {},
      create: {
        name: "2025 Academic Session",
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
        isCurrent: false,
        status: "CLOSED",
      },
    });

    const session2026 = await prisma.academicSession.upsert({
      where: { name: "2026 Academic Session" },
      update: {},
      create: {
        name: "2026 Academic Session",
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        isCurrent: true,
        status: "ACTIVE",
      },
    });

    // Jamat Class
    const jamat = await prisma.jamatClass.upsert({
      where: { code: "JMT-P15" },
      update: {},
      create: {
        code: "JMT-P15",
        nameBn: "মিযান জামাত (P15)",
        nameEn: "Mizan Jamat P15",
        sortOrder: 1,
        isActive: true,
      },
    });

    const section = await prisma.section.findFirst({ where: { classId: jamat.id } }) ||
      (await prisma.section.create({
        data: {
          classId: jamat.id,
          nameBn: "শাখা ক",
          nameEn: "Section A",
          maxCapacity: 40,
        },
      }));

    // Student 1 (Linked to Guardian)
    const student1 = await prisma.student.upsert({
      where: { studentIdNumber: "EHRJ-P15-ST1" },
      update: {},
      create: {
        studentIdNumber: "EHRJ-P15-ST1",
        fullNameBn: "মুহাম্মদ আব্দুল্লাহ (P15)",
        fullNameEn: "Muhammad Abdullah P15",
        dateOfBirth: new Date("2012-05-15"),
        gender: "MALE",
        presentAddress: "দাউদকান্দি, কুমিল্লা",
        permanentAddress: "দাউদকান্দি, কুমিল্লা",
        residentialStatus: "RESIDENTIAL",
        fatherNameBn: "কফিল উদ্দিন",
        motherNameBn: "আমেনা বেগম",
        isOrphan: false,
        isFinanciallyWeak: false,
        status: "ACTIVE",
      },
    });

    // Student 2 (Unlinked)
    const student2 = await prisma.student.upsert({
      where: { studentIdNumber: "EHRJ-P15-ST2" },
      update: {},
      create: {
        studentIdNumber: "EHRJ-P15-ST2",
        fullNameBn: "মুহাম্মদ আব্দুর রহমান (P15)",
        fullNameEn: "Muhammad Abdur Rahman P15",
        dateOfBirth: new Date("2013-03-20"),
        gender: "MALE",
        presentAddress: "দাউদকান্দি, কুমিল্লা",
        permanentAddress: "দাউদকান্দি, কুমিল্লা",
        residentialStatus: "NON_RESIDENTIAL",
        fatherNameBn: "জালাল উদ্দিন",
        motherNameBn: "ফাতিমা খাতুন",
        isOrphan: true,
        isFinanciallyWeak: true,
        status: "ACTIVE",
      },
    });

    // Link Guardian to Student 1
    await prisma.guardianStudent.upsert({
      where: {
        guardianId_studentId: {
          guardianId: testGuardian.id,
          studentId: student1.id,
        },
      },
      update: {},
      create: {
        guardianId: testGuardian.id,
        studentId: student1.id,
        isPrimary: true,
      },
    });

    // Enrollments
    await prisma.enrollment.upsert({
      where: {
        sessionId_classId_sectionId_rollNumber: {
          sessionId: session2026.id,
          classId: jamat.id,
          sectionId: section.id,
          rollNumber: 15,
        },
      },
      update: {},
      create: {
        sessionId: session2026.id,
        classId: jamat.id,
        sectionId: section.id,
        rollNumber: 15,
        studentId: student1.id,
        status: "ACTIVE",
      },
    });

    // Teacher assignment
    await prisma.teacherAssignment.create({
      data: {
        teacherId: testTeacher.id,
        classId: jamat.id,
        sectionId: section.id,
        sessionId: session2026.id,
      },
    });

    // Attendance fixture
    await prisma.attendance.upsert({
      where: {
        studentId_date: {
          studentId: student1.id,
          date: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      update: {},
      create: {
        studentId: student1.id,
        sessionId: session2026.id,
        classId: jamat.id,
        sectionId: section.id,
        date: new Date(new Date().setHours(0, 0, 0, 0)),
        status: "PRESENT",
      },
    });

    // Ensure 5 Cash Funds
    const fundCodes = [
      { code: "GENERAL", nameBn: "সাধারণ তহবিল", nameEn: "General Fund", balance: 50000 },
      { code: "LILLAH", nameBn: "লিল্লাহ ফান্ড", nameEn: "Lillah Boarding Fund", balance: 25000 },
      { code: "ZAKAT", nameBn: "যাকাত তহবিল", nameEn: "Zakat Fund", balance: 40000 },
      { code: "CONSTRUCTION", nameBn: "নির্মাণ ফান্ড", nameEn: "Construction Fund", balance: 80000 },
      { code: "ORPHAN_SUPPORT", nameBn: "এতিম সহায়তা তহবিল", nameEn: "Orphan Support Fund", balance: 15000 },
    ];
    for (const f of fundCodes) {
      await prisma.cashFund.upsert({
        where: { code: f.code },
        update: {},
        create: {
          code: f.code,
          nameBn: f.nameBn,
          nameEn: f.nameEn,
          currentBalance: f.balance,
        },
      });
    }

    console.log("Fixtures ready.\n");

    // -------------------------------------------------------------
    // Test 1: Date Filter Parser
    // -------------------------------------------------------------
    console.log("--- Test 1: Date Filter Parser ---");
    const todayFilter = parseDateFilter("TODAY");
    assert(todayFilter.startDate !== undefined && todayFilter.endDate !== undefined, "TODAY returns valid date bounds");

    const monthFilter = parseDateFilter("THIS_MONTH");
    assert(monthFilter.startDate !== undefined && monthFilter.label === "চলতি মাস", "THIS_MONTH returns month start");

    const allTimeFilter = parseDateFilter("ALL_TIME");
    assert(allTimeFilter.startDate === undefined && allTimeFilter.endDate === undefined, "ALL_TIME returns undefined bounds");

    // -------------------------------------------------------------
    // Test 2: Executive Overview Analytics
    // -------------------------------------------------------------
    console.log("\n--- Test 2: Executive Overview Analytics ---");
    const overview = await getOverviewAnalytics("ALL_TIME");
    assert(overview.students.total >= 2, `Total students tracked: ${overview.students.total}`);
    assert(overview.students.active >= 2, `Active students tracked: ${overview.students.active}`);
    assert(overview.finance.funds.length >= 5, `All 5 cash funds tracked (Found: ${overview.finance.funds.length})`);
    assert(overview.executiveSummary.bn.length > 50, "Factual Bengali executive summary generated");
    assert(overview.executiveSummary.en.length > 50, "Factual English executive summary generated");

    // -------------------------------------------------------------
    // Test 3: Student Analytics & Demographics
    // -------------------------------------------------------------
    console.log("\n--- Test 3: Student Analytics ---");
    const stAnalytics = await getStudentsAnalytics();
    assert(stAnalytics.totalStudents >= 2, `Total students count: ${stAnalytics.totalStudents}`);
    assert(stAnalytics.genderDistribution.male >= 2, "Gender breakdown computed");
    assert(stAnalytics.specialCategories.orphans >= 1, "Special categories (orphans) computed");
    assert(Array.isArray(stAnalytics.classDistribution), "Class distribution returned as array");

    // -------------------------------------------------------------
    // Test 4: Admission Funnel Analytics
    // -------------------------------------------------------------
    console.log("\n--- Test 4: Admission Funnel Analytics ---");
    const admAnalytics = await getAdmissionAnalytics();
    assert(typeof admAnalytics.conversionRate === "number", `Conversion rate computed: ${admAnalytics.conversionRate}%`);
    assert(admAnalytics.statusBreakdown !== undefined, "Status breakdown computed");
    assert(admAnalytics.sourceDistribution !== undefined, "Source distribution computed");

    // -------------------------------------------------------------
    // Test 5: Attendance Analytics & Jamat Rates
    // -------------------------------------------------------------
    console.log("\n--- Test 5: Attendance Analytics ---");
    const attAnalytics = await getAttendanceAnalytics();
    assert(typeof attAnalytics.overallRate === "number", `Overall attendance rate: ${attAnalytics.overallRate}%`);
    assert(attAnalytics.summary.present >= 1, "Attendance present count computed");
    assert(Array.isArray(attAnalytics.classComparison), "Class comparison list returned");

    // -------------------------------------------------------------
    // Test 6: Academic & Qawmi Result Analytics
    // -------------------------------------------------------------
    console.log("\n--- Test 6: Academic & Qawmi Result Analytics ---");
    const acadAnalytics = await getAcademicAnalytics();
    assert(typeof acadAnalytics.passRate === "number", `Pass rate computed: ${acadAnalytics.passRate}%`);
    assert(acadAnalytics.gradeDistribution.length === 5, "5 Qawmi grade tiers defined (Mumtaz, Jayyid Jiddan, Jayyid, Maqbul, Rasib)");

    // -------------------------------------------------------------
    // Test 7: Finance & 5-Fund Balances Analytics
    // -------------------------------------------------------------
    console.log("\n--- Test 7: Finance & 5-Fund Analytics ---");
    const finAnalytics = await getFinanceAnalytics();
    assert(finAnalytics.summary.billedAmount >= 0, "Billed amount calculated from FeeInvoice");
    assert(finAnalytics.fundMovements.length >= 5, "5 Cash Funds movements and balances reported");
    assert(Array.isArray(finAnalytics.methodBreakdown), "Payment method breakdown returned");
    assert(Array.isArray(finAnalytics.incomeByType), "Income by fee type returned");

    // -------------------------------------------------------------
    // Test 8: Operations Analytics (Library, Hostel, Transport, etc.)
    // -------------------------------------------------------------
    console.log("\n--- Test 8: Operations Analytics ---");
    const opsAnalytics = await getOperationsAnalytics();
    assert(opsAnalytics.library.totalTitles >= 0, "Library metrics tracked");
    assert(opsAnalytics.hostel.residential >= 1, "Hostel residential count tracked");
    assert(opsAnalytics.transport.activeRoutes >= 0, "Transport active routes tracked");
    assert(opsAnalytics.inventory.totalItems >= 0, "Inventory items tracked");
    assert(opsAnalytics.hr.totalEmployees >= 0, "HR employees tracked");
    assert(opsAnalytics.helpdesk.totalRequests >= 0, "Helpdesk tickets tracked");

    // -------------------------------------------------------------
    // Test 9: Session Comparison Engine
    // -------------------------------------------------------------
    console.log("\n--- Test 9: Session Comparison Engine ---");
    const comparison = await getSessionComparison(session2025.id, session2026.id);
    assert(comparison.sessionA.name === "2025 Academic Session", "Base session A verified");
    assert(comparison.sessionB.name === "2026 Academic Session", "Comparison session B verified");
    assert(comparison.metrics.students !== undefined, "Student metric difference computed");
    assert(comparison.metrics.billedFees !== undefined, "Fee metric difference computed");

    // -------------------------------------------------------------
    // Test 10: Teacher Scoped Analytics
    // -------------------------------------------------------------
    console.log("\n--- Test 10: Teacher Scoped Analytics ---");
    const teacherData = await getTeacherScopedAnalytics(testTeacher.id);
    assert(teacherData.teacherId === testTeacher.id, "Teacher identity preserved");
    assert(teacherData.totalAssignments >= 1, "Teacher assignments tracked");
    assert(typeof teacherData.todayAttendance.rate === "number", "Teacher section attendance rate computed");

    // -------------------------------------------------------------
    // Test 11: Guardian Linked Child Analytics & IDOR Block
    // -------------------------------------------------------------
    console.log("\n--- Test 11: Guardian Child Scoped Analytics & IDOR Check ---");
    const child1Data = await getGuardianChildAnalytics(testGuardianUser.id, student1.id);
    assert(child1Data.student.id === student1.id, "Guardian authorized child analytics retrieved");
    assert(child1Data.attendance.present >= 1, "Child attendance record returned");

    let idorBlocked = false;
    try {
      await getGuardianChildAnalytics(testGuardianUser.id, student2.id);
    } catch (err: any) {
      if (err.message.includes("অননুমোদিত")) {
        idorBlocked = true;
      }
    }
    assert(idorBlocked, "IDOR SECURITY PASS: Guardian querying unlinked child was rejected with forbidden error");

    // -------------------------------------------------------------
    // Test 12: Report Builder & Saved Reports CRUD
    // -------------------------------------------------------------
    console.log("\n--- Test 12: Report Builder & Saved Reports ---");
    const reportRes = await executeReportBuilder({ module: "STUDENTS", limit: 10 });
    assert(reportRes.module === "STUDENTS", "Report builder executed for STUDENTS module");
    assert(reportRes.count >= 1, `Report builder returned ${reportRes.count} records`);

    const saved = await createSavedReport({
      title: "টেস্ট সংরক্ষিত রিপোর্ট (P15)",
      description: "স্বয়ংক্রিয় টেস্ট রিপোর্ট",
      module: "FINANCE",
      reportType: "SUMMARY",
      filtersJson: JSON.stringify({ module: "FINANCE", dateFilter: "THIS_MONTH" }),
      isPublic: true,
      createdById: testAdmin.id,
    });
    assert(saved.id !== undefined, "Saved report created successfully");

    const userReports = await getSavedReports(testAdmin.id);
    assert(userReports.some((r) => r.id === saved.id), "Saved report retrievable in list");

    await deleteSavedReport(saved.id, testAdmin.id);
    const afterDelete = await getSavedReports(testAdmin.id);
    assert(!afterDelete.some((r) => r.id === saved.id), "Saved report deleted cleanly");

  } catch (error: any) {
    console.error("Test execution aborted due to error:", error);
    failed++;
  }

  console.log("\n=================================================================");
  console.log(`  PHASE 15 UNIT TESTS FINISHED: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase15ApiTests();
