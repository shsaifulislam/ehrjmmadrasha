const http = require("http");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

const BASE_URL = "http://localhost:3000";

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || "GET",
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      headers: {
        "x-test-suite": "ehrj-phase-4",
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          json,
        });
      });
    });

    req.on("error", reject);

    if (options.body) {
      req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runPhase4AttendanceTests() {
  console.log("=================================================================");
  console.log("  EHRJ DIGITAL CAMPUS - PHASE 4 ATTENDANCE ENGINE TEST SUITE");
  console.log("=================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 0. AUTHENTICATION & FIXTURE SETUP
    console.log("--- 0. Authentication & Academic Fixtures Setup ---");

    // Login Admin
    const adminLoginRes = await makeRequest("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        identifier: "adminehrjmadrasha@gmail.com",
        password: "AdminEhrj@2026!",
      },
    });

    const adminCookies = adminLoginRes.headers["set-cookie"]
      ? adminLoginRes.headers["set-cookie"].map((c) => c.split(";")[0]).join("; ")
      : "";

    assert(
      adminLoginRes.statusCode === 200 && adminCookies.includes("ehrj_session_token"),
      "Admin login succeeded with session cookie"
    );

    // Login Teacher
    const teacherLoginRes = await makeRequest("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        identifier: "teacherehrjmadrasha@gmail.com",
        password: "Teacher@2026!",
      },
    });

    const teacherCookies = teacherLoginRes.headers["set-cookie"]
      ? teacherLoginRes.headers["set-cookie"].map((c) => c.split(";")[0]).join("; ")
      : "";

    assert(
      teacherLoginRes.statusCode === 200 && teacherCookies.includes("ehrj_session_token"),
      "Teacher login succeeded with session cookie"
    );

    // Get teacher user record
    const teacherUser = await prisma.user.findUnique({
      where: { email: "teacherehrjmadrasha@gmail.com" },
    });
    assert(!!teacherUser, "Teacher user found in database");

    // Get Active Session
    let currentSession = await prisma.academicSession.findFirst({
      where: { isCurrent: true },
    });
    if (!currentSession) {
      currentSession = await prisma.academicSession.findFirst();
    }
    assert(!!currentSession, `Active AcademicSession found (${currentSession?.name})`);
    const sessionId = currentSession.id;

    // Get two JamatClasses: one assigned to teacher, one NOT assigned
    const allClasses = await prisma.jamatClass.findMany({
      where: { isActive: true },
      take: 2,
    });
    assert(allClasses.length >= 1, `Found ${allClasses.length} active JamatClasses`);
    const assignedClass = allClasses[0];
    const unassignedClassId = allClasses[1]?.id || "unassigned-dummy-class-id";

    // Ensure teacher assignment exists for assignedClass
    let assignment = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId: teacherUser.id,
        sessionId,
        classId: assignedClass.id,
      },
    });
    if (!assignment) {
      assignment = await prisma.teacherAssignment.create({
        data: {
          teacherId: teacherUser.id,
          sessionId,
          classId: assignedClass.id,
        },
      });
    }
    assert(!!assignment, `Teacher assignment verified for class ${assignedClass.nameBn}`);

    // Ensure students exist in this class & session with rolls
    let enrollments = await prisma.enrollment.findMany({
      where: {
        sessionId,
        classId: assignedClass.id,
        status: "ACTIVE",
      },
      include: { student: true },
      orderBy: { rollNumber: "asc" },
    });

    if (enrollments.length < 3) {
      // Seed 3 test students for clean deterministic testing
      for (let i = 1; i <= 3; i++) {
        const studentIdNum = `EHRJ-TEST-${Date.now().toString().slice(-4)}-${i}`;
        const newStudent = await prisma.student.create({
          data: {
            studentIdNumber: studentIdNum,
            fullNameBn: `পরীক্ষামূলক শিক্ষার্থী ০${i}`,
            fullNameEn: `Test Student 0${i}`,
            dateOfBirth: new Date("2014-01-01"),
            gender: "MALE",
            residentialStatus: i === 1 ? "RESIDENTIAL" : "NON_RESIDENTIAL",
            isOrphan: i === 3,
            fatherNameBn: `পিতা ০${i}`,
            fatherPhone: `0170000000${i}`,
            motherNameBn: `মাতা ০${i}`,
            presentAddress: "পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা",
            permanentAddress: "পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা",
            status: "ACTIVE",
          },
        });

        await prisma.enrollment.create({
          data: {
            studentId: newStudent.id,
            sessionId,
            classId: assignedClass.id,
            rollNumber: 10 + i,
            status: "ACTIVE",
          },
        });
      }

      enrollments = await prisma.enrollment.findMany({
        where: {
          sessionId,
          classId: assignedClass.id,
          status: "ACTIVE",
        },
        include: { student: true },
        orderBy: { rollNumber: "asc" },
      });
    }

    assert(enrollments.length >= 3, `Enrolled students available for class (${enrollments.length} students)`);

    // Clean any pre-existing test attendance for today's test date
    const testDate = "2026-09-27";
    const dateObj = new Date("2026-09-27T00:00:00.000Z");
    await prisma.attendance.deleteMany({
      where: {
        sessionId,
        date: dateObj,
      },
    });
    await prisma.attendanceLock.deleteMany({
      where: {
        sessionId,
        date: dateObj,
      },
    });

    // 1. TEACHER SCOPING & RBAC TESTS
    console.log("\n--- 1. Teacher Scoping & RBAC Verification ---");

    // Teacher assignments endpoint
    const assignRes = await makeRequest("/api/teacher/attendance/assignments", {
      headers: { Cookie: teacherCookies },
    });
    assert(assignRes.statusCode === 200, "Teacher assignments endpoint returned 200 OK");
    assert(
      assignRes.json?.assignments?.some((a) => a.classId === assignedClass.id),
      "Teacher assignments list contains assigned class"
    );

    // Teacher requests assigned class sheet
    const teacherSheetRes = await makeRequest(
      `/api/teacher/attendance?sessionId=${sessionId}&classId=${assignedClass.id}&date=${testDate}`,
      { headers: { Cookie: teacherCookies } }
    );
    assert(teacherSheetRes.statusCode === 200, "Teacher can view attendance for assigned class");
    assert(
      Array.isArray(teacherSheetRes.json?.students) && teacherSheetRes.json.students.length > 0,
      `Students loaded in sheet: ${teacherSheetRes.json?.students?.length}`
    );

    // Roll order assertion
    const loadedRolls = teacherSheetRes.json.students.map((s) => s.rollNumber);
    const isSortedRoll = loadedRolls.every((val, i, arr) => !i || arr[i - 1] <= val);
    assert(isSortedRoll, `Students are strictly sorted in roll order: [${loadedRolls.slice(0, 5).join(", ")}]`);

    // Teacher IDOR attempt: access unassigned class
    if (allClasses.length > 1) {
      const idorRes = await makeRequest(
        `/api/teacher/attendance?sessionId=${sessionId}&classId=${unassignedClassId}&date=${testDate}`,
        { headers: { Cookie: teacherCookies } }
      );
      assert(
        idorRes.statusCode === 403,
        `Teacher blocked from unassigned class (Expected 403, got ${idorRes.statusCode})`
      );
    }

    // Anonymous attempt: blocked
    const anonRes = await makeRequest(
      `/api/teacher/attendance?sessionId=${sessionId}&classId=${assignedClass.id}&date=${testDate}`
    );
    assert(anonRes.statusCode === 403, "Anonymous request to teacher attendance blocked (403)");

    // 2. MARKING ATTENDANCE & TRANSACTIONAL SAVE
    console.log("\n--- 2. Bulk Attendance Marking & Transactional Save ---");

    const studentA = teacherSheetRes.json.students[0];
    const studentB = teacherSheetRes.json.students[1];
    const studentC = teacherSheetRes.json.students[2];

    const attendanceRecordsPayload = [
      { studentId: studentA.studentId, status: "PRESENT" },
      { studentId: studentB.studentId, status: "ABSENT" },
      {
        studentId: studentC.studentId,
        status: "LEAVE",
        leaveReason: "জ্বর ও অসুস্থতাজনিত ছুটি",
      },
    ];

    if (teacherSheetRes.json.students.length > 3) {
      for (let i = 3; i < teacherSheetRes.json.students.length; i++) {
        attendanceRecordsPayload.push({
          studentId: teacherSheetRes.json.students[i].studentId,
          status: "PRESENT",
        });
      }
    }

    const saveRes = await makeRequest("/api/teacher/attendance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: teacherCookies,
      },
      body: {
        sessionId,
        classId: assignedClass.id,
        date: testDate,
        records: attendanceRecordsPayload,
      },
    });

    assert(saveRes.statusCode === 200, "Teacher successfully saved attendance sheet (200 OK)");
    assert(saveRes.json?.success === true, "Response indicated transaction success");
    assert(saveRes.json?.createdCount >= 3, `Records created in database: ${saveRes.json?.createdCount}`);

    // Verify persistence by reloading
    const reloadedSheet = await makeRequest(
      `/api/teacher/attendance?sessionId=${sessionId}&classId=${assignedClass.id}&date=${testDate}`,
      { headers: { Cookie: teacherCookies } }
    );

    const reloadedA = reloadedSheet.json.students.find((s) => s.studentId === studentA.studentId);
    const reloadedB = reloadedSheet.json.students.find((s) => s.studentId === studentB.studentId);
    const reloadedC = reloadedSheet.json.students.find((s) => s.studentId === studentC.studentId);

    assert(reloadedA?.status === "PRESENT", `Student A status persisted as PRESENT`);
    assert(reloadedB?.status === "ABSENT", `Student B status persisted as ABSENT`);
    assert(reloadedC?.status === "LEAVE", `Student C status persisted as LEAVE`);
    assert(
      reloadedC?.leaveReason === "জ্বর ও অসুস্থতাজনিত ছুটি",
      `Student C leaveReason persisted correctly: "${reloadedC?.leaveReason}"`
    );

    // 3. DUPLICATE DETECTION & IDEMPOTENCY
    console.log("\n--- 3. Duplicate Prevention & Idempotency ---");

    const duplicateRes = await makeRequest("/api/teacher/attendance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: teacherCookies,
      },
      body: {
        sessionId,
        classId: assignedClass.id,
        date: testDate,
        records: attendanceRecordsPayload,
      },
    });

    assert(duplicateRes.statusCode === 200, "Duplicate submission handled gracefully (200 OK)");
    assert(
      duplicateRes.json?.createdCount === 0,
      `No duplicate records created (createdCount: ${duplicateRes.json?.createdCount})`
    );

    // Direct database count check for student A on testDate
    const dbAttendanceCount = await prisma.attendance.count({
      where: {
        studentId: studentA.studentId,
        date: dateObj,
      },
    });
    assert(
      dbAttendanceCount === 1,
      `Database enforces unique student + date: exactly ${dbAttendanceCount} record found`
    );

    // 4. ATTENDANCE LOCKING & CORRECTION WINDOW
    console.log("\n--- 4. Attendance Locking & Correction Window ---");

    // Admin locks attendance
    const lockRes = await makeRequest("/api/admin/attendance/lock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: {
        sessionId,
        classId: assignedClass.id,
        date: testDate,
        reason: "মাসিক নিরীক্ষার জন্য অ্যাডমিন লক",
      },
    });
    assert(lockRes.statusCode === 200, "Admin locked attendance sheet (200 OK)");

    // Teacher tries to modify locked attendance sheet -> must be rejected with 423
    const lockedSaveRes = await makeRequest("/api/teacher/attendance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: teacherCookies,
      },
      body: {
        sessionId,
        classId: assignedClass.id,
        date: testDate,
        records: [{ studentId: studentA.studentId, status: "ABSENT" }],
      },
    });
    assert(
      lockedSaveRes.statusCode === 423,
      `Teacher blocked from saving locked attendance (Expected 423 Locked, got ${lockedSaveRes.statusCode})`
    );

    // Admin unlocks attendance
    const unlockRes = await makeRequest("/api/admin/attendance/unlock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: {
        sessionId,
        classId: assignedClass.id,
        date: testDate,
        reason: "সংশোধনের জন্য উন্মুক্ত করা হলো",
      },
    });
    assert(unlockRes.statusCode === 200, "Admin unlocked attendance sheet (200 OK)");

    // 5. ADMIN CORRECTION & AUDIT TRAIL
    console.log("\n--- 5. Admin Attendance Correction & Audit Trail ---");

    // Correct Student B from ABSENT to PRESENT
    const recordB = await prisma.attendance.findUnique({
      where: {
        studentId_date: {
          studentId: studentB.studentId,
          date: dateObj,
        },
      },
    });
    assert(!!recordB, "Target attendance record found for Admin correction");

    // Correction without reason must fail
    const invalidCorrectionRes = await makeRequest("/api/admin/attendance/correct", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: {
        attendanceId: recordB.id,
        newStatus: "PRESENT",
        correctionReason: "",
      },
    });
    assert(
      invalidCorrectionRes.statusCode === 400,
      "Correction without mandatory reason rejected with 400 Bad Request"
    );

    // Valid Correction with reason
    const validCorrectionRes = await makeRequest("/api/admin/attendance/correct", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookies,
      },
      body: {
        attendanceId: recordB.id,
        newStatus: "PRESENT",
        correctionReason: "শিক্ষক ভুলবশত অনুপস্থিত দিয়েছিলেন, শিক্ষার্থী দেরিতে উপস্থিত হয়েছিল",
      },
    });
    assert(validCorrectionRes.statusCode === 200, "Admin correction succeeded with 200 OK");

    const correctedB = await prisma.attendance.findUnique({
      where: { id: recordB.id },
    });
    assert(correctedB?.status === "PRESENT", "Status updated from ABSENT to PRESENT");
    assert(
      correctedB?.correctionReason?.includes("ভুলবশত"),
      "Correction reason saved on attendance record"
    );

    // Check AuditLog
    const auditRecord = await prisma.auditLog.findFirst({
      where: {
        action: "ATTENDANCE_ADMIN_CORRECT",
        entityId: recordB.id,
      },
    });
    assert(!!auditRecord, "Immutable AuditLog record created for admin correction");
    assert(
      auditRecord?.detailsJson?.includes("ভুলবশত"),
      "AuditLog contains full correction details and reason"
    );

    // 6. GUARDIAN PORTAL & IDOR PROTECTION
    console.log("\n--- 6. Guardian Portal & IDOR Protection ---");

    // Set up Guardian user & profile
    const guardianEmail = "guardiantest_ph4@ehrj.local";
    let guardianUser = await prisma.user.findUnique({ where: { email: guardianEmail } });
    if (!guardianUser) {
      const hashedPassword = await bcrypt.hash("Guardian@2026!", 10);
      guardianUser = await prisma.user.create({
        data: {
          username: "guardiantest_ph4",
          name: "মোহাম্মদ রফিকুল ইসলাম (অভিভাবক)",
          email: guardianEmail,
          passwordHash: hashedPassword,
          role: "GUARDIAN",
          status: "ACTIVE",
        },
      });
    }

    let guardianProfile = await prisma.guardian.findFirst({
      where: { email: guardianEmail },
    });
    if (!guardianProfile) {
      guardianProfile = await prisma.guardian.create({
        data: {
          userId: guardianUser.id,
          fullNameBn: "মোহাম্মদ রফিকুল ইসলাম",
          phone: "01899999999",
          email: guardianEmail,
          relation: "FATHER",
        },
      });
    }

    // Link Student A to this Guardian
    await prisma.guardianStudent.upsert({
      where: {
        guardianId_studentId: {
          guardianId: guardianProfile.id,
          studentId: studentA.studentId,
        },
      },
      create: {
        guardianId: guardianProfile.id,
        studentId: studentA.studentId,
        isPrimary: true,
      },
      update: {},
    });

    // Ensure Student B is NOT linked to this Guardian
    await prisma.guardianStudent.deleteMany({
      where: {
        guardianId: guardianProfile.id,
        studentId: studentB.studentId,
      },
    });

    // Login as Guardian
    const guardianLoginRes = await makeRequest("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        identifier: guardianEmail,
        password: "Guardian@2026!",
      },
    });

    const guardianCookies = guardianLoginRes.headers["set-cookie"]
      ? guardianLoginRes.headers["set-cookie"].map((c) => c.split(";")[0]).join("; ")
      : "";

    assert(
      guardianLoginRes.statusCode === 200 && guardianCookies.includes("ehrj_session_token"),
      "Guardian login succeeded"
    );

    // Guardian views linked child A attendance
    const childARes = await makeRequest(
      `/api/portal/attendance?studentId=${studentA.studentId}&sessionId=${sessionId}`,
      { headers: { Cookie: guardianCookies } }
    );
    assert(childARes.statusCode === 200, "Guardian can view linked Child A attendance");
    assert(
      childARes.json?.student?.id === studentA.studentId,
      "Returned attendance matches Child A"
    );
    assert(
      childARes.json?.records?.length > 0,
      `Child A has ${childARes.json?.records?.length} attendance record(s)`
    );

    // IDOR Attack: Guardian attempts to view unlinked student B attendance
    const idorChildRes = await makeRequest(
      `/api/portal/attendance?studentId=${studentB.studentId}&sessionId=${sessionId}`,
      { headers: { Cookie: guardianCookies } }
    );
    assert(
      idorChildRes.statusCode === 403,
      `Guardian blocked from viewing unlinked child B (Expected 403 Forbidden, got ${idorChildRes.statusCode})`
    );

    // 7. ATTENDANCE REPORTS ENGINE
    console.log("\n--- 7. Attendance Reports Engine Verification ---");

    // Daily Report
    const dailyReportRes = await makeRequest(
      `/api/admin/attendance/reports?type=DAILY&sessionId=${sessionId}&classId=${assignedClass.id}&date=${testDate}`,
      { headers: { Cookie: adminCookies } }
    );
    assert(dailyReportRes.statusCode === 200, "Daily attendance report generated (200 OK)");
    assert(dailyReportRes.json?.reportType === "DAILY", "Report type confirmed as DAILY");
    assert(
      typeof dailyReportRes.json?.summary?.attendanceRate === "number",
      `Daily Attendance Rate calculated: ${dailyReportRes.json?.summary?.attendanceRate}%`
    );
    assert(
      dailyReportRes.json?.summary?.leaveCount >= 1,
      `Daily leave count matches records: ${dailyReportRes.json?.summary?.leaveCount}`
    );

    // Monthly Report
    const monthlyReportRes = await makeRequest(
      `/api/admin/attendance/reports?type=MONTHLY&sessionId=${sessionId}&classId=${assignedClass.id}&year=2026&month=9`,
      { headers: { Cookie: adminCookies } }
    );
    assert(monthlyReportRes.statusCode === 200, "Monthly attendance report generated (200 OK)");
    assert(
      Array.isArray(monthlyReportRes.json?.studentSummaries),
      `Monthly report includes student summaries (${monthlyReportRes.json?.studentSummaries?.length})`
    );

    // Student Individual Report
    const studentReportRes = await makeRequest(
      `/api/admin/attendance/reports?type=STUDENT&sessionId=${sessionId}&studentId=${studentA.studentId}`,
      { headers: { Cookie: adminCookies } }
    );
    assert(studentReportRes.statusCode === 200, "Student individual report generated (200 OK)");
    assert(
      studentReportRes.json?.student?.id === studentA.studentId,
      "Student individual report matches student profile"
    );
    assert(
      studentReportRes.json?.records?.length > 0,
      `Student attendance timeline loaded: ${studentReportRes.json?.records?.length} entries`
    );

    // Session-wide Report
    const sessionReportRes = await makeRequest(
      `/api/admin/attendance/reports?type=SESSION&sessionId=${sessionId}`,
      { headers: { Cookie: adminCookies } }
    );
    assert(sessionReportRes.statusCode === 200, "Session-wide report generated (200 OK)");
    assert(
      typeof sessionReportRes.json?.summary?.totalEligibleStudents === "number",
      `Session-wide total student count: ${sessionReportRes.json?.summary?.totalEligibleStudents}`
    );

    // 8. FINAL SUMMARY
    console.log("\n=================================================================");
    console.log(`  PHASE 4 ATTENDANCE ENGINE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution failed with unhandled exception:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase4AttendanceTests();
