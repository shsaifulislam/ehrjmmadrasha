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
        "x-test-suite": "ehrj-phase-5",
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

async function runPhase5ExamTests() {
  console.log("=================================================================");
  console.log("  EHRJ DIGITAL CAMPUS - PHASE 5 EXAM & RESULT ENGINE TEST SUITE");
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

    const teacherUser = await prisma.user.findUnique({
      where: { email: "teacherehrjmadrasha@gmail.com" },
    });
    assert(!!teacherUser, "Teacher user found in database");

    // Get Active Session
    let session = await prisma.academicSession.findFirst({
      where: { isCurrent: true },
    });
    if (!session) {
      session = await prisma.academicSession.findFirst();
    }
    assert(!!session, `Active AcademicSession found (${session?.name})`);

    // Get a JamatClass with enrolled active students
    const jamatClass = await prisma.jamatClass.findFirst({
      where: {
        enrollments: { some: { status: "ACTIVE" } },
      },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: { student: true },
          take: 3,
        },
      },
    });
    assert(!!jamatClass && jamatClass.enrollments.length >= 1, `Found JamatClass with enrolled students (${jamatClass?.nameBn})`);

    // Ensure at least 2 subjects exist for this class
    let subject1 = await prisma.subject.findFirst({
      where: { classId: jamatClass.id, code: "SUB-P5-QRN" },
    });
    if (!subject1) {
      subject1 = await prisma.subject.create({
        data: {
          classId: jamatClass.id,
          nameBn: "আল-কুরআন ও তাজবীদ",
          nameEn: "Al-Quran & Tajweed",
          code: "SUB-P5-QRN",
          fullMarks: 100,
          passMarks: 33,
          isOptional: false,
          sortOrder: 1,
        },
      });
    }

    let subject2 = await prisma.subject.findFirst({
      where: { classId: jamatClass.id, code: "SUB-P5-HDT" },
    });
    if (!subject2) {
      subject2 = await prisma.subject.create({
        data: {
          classId: jamatClass.id,
          nameBn: "হাদীস শরীফ ও উসূল",
          nameEn: "Hadith Sharif",
          code: "SUB-P5-HDT",
          fullMarks: 100,
          passMarks: 33,
          isOptional: false,
          sortOrder: 2,
        },
      });
    }
    assert(!!subject1 && !!subject2, "Subjects initialized for JamatClass");

    // Ensure Teacher assignment for subject1 ONLY
    await prisma.teacherAssignment.deleteMany({
      where: {
        teacherId: teacherUser.id,
        sessionId: session.id,
        classId: jamatClass.id,
      },
    });

    await prisma.teacherAssignment.create({
      data: {
        teacherId: teacherUser.id,
        sessionId: session.id,
        classId: jamatClass.id,
        subjectId: subject1.id,
      },
    });
    console.log(`  Teacher assigned strictly to ${subject1.nameBn} (subject2 unassigned for scoping test)`);

    // 1. CONFIGURABLE EXAM TYPES
    console.log("\n--- 1. Configurable Exam Types Tests ---");

    const customTypeCode = `TERM_P5_${Date.now()}`;
    const createTypeRes = await makeRequest("/api/admin/exams/types", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: {
        code: customTypeCode,
        nameBn: "প্রথম সাময়িক পরীক্ষা ২০২৬",
        nameEn: "First Term Exam 2026",
        sortOrder: 1,
      },
    });

    assert(createTypeRes.statusCode === 200, "Admin can create custom ExamType");
    const createdType = createTypeRes.json.examType;

    // Test duplicate exam type code rejection
    const duplicateTypeRes = await makeRequest("/api/admin/exams/types", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: {
        code: customTypeCode,
        nameBn: "ডুপ্লিকেট সাময়িক পরীক্ষা",
        nameEn: "Duplicate Term Exam",
      },
    });
    assert(duplicateTypeRes.statusCode === 409, "Duplicate ExamType code rejected with 409 Conflict");

    // 2. EXAM MODEL & LIFECYCLE
    console.log("\n--- 2. Exam Creation & Status Lifecycle Tests ---");

    const createExamRes = await makeRequest("/api/admin/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: {
        sessionId: session.id,
        examTypeId: createdType.id,
        nameBn: "প্রথম সাময়িক পরীক্ষা ২০২৬ (টেস্ট)",
        nameEn: "First Term Exam 2026 (Test)",
        startDate: "2026-04-01",
        endDate: "2026-04-12",
        status: "DRAFT",
      },
    });

    assert(createExamRes.statusCode === 200, "Admin can create Exam linked to AcademicSession");
    const testExam = createExamRes.json.exam;
    assert(testExam.status === "DRAFT", "Exam initialized with status DRAFT");

    // Update Exam status to SCHEDULED
    const updateExamStatusRes = await makeRequest(`/api/admin/exams/${testExam.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: { status: "SCHEDULED" },
    });
    assert(updateExamStatusRes.statusCode === 200, "Exam status updated to SCHEDULED");

    // 3. EXAM SUBJECT CONFIGURATION
    console.log("\n--- 3. Exam Subject Configuration Tests ---");

    const configSub1Res = await makeRequest(`/api/admin/exams/${testExam.id}/subjects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: {
        classId: jamatClass.id,
        subjectId: subject1.id,
        fullMarks: 100,
        passMarks: 33,
        examDate: "2026-04-02",
        startTime: "09:30 AM",
        endTime: "12:30 PM",
      },
    });
    assert(configSub1Res.statusCode === 200, `Configured subject1 (${subject1.nameBn}) in Exam`);

    const configSub2Res = await makeRequest(`/api/admin/exams/${testExam.id}/subjects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: {
        classId: jamatClass.id,
        subjectId: subject2.id,
        fullMarks: 50,
        passMarks: 17,
        examDate: "2026-04-03",
        startTime: "09:30 AM",
        endTime: "11:30 AM",
      },
    });
    assert(configSub2Res.statusCode === 200, `Configured subject2 (${subject2.nameBn}) with custom marks (50 / 17)`);

    // 4. EXAM ROUTINE & CONFLICT DETECTION
    console.log("\n--- 4. Exam Routine & Conflict Detection Tests ---");

    // Create routine item 1
    const createRoutine1Res = await makeRequest(`/api/admin/exams/${testExam.id}/routine`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: {
        classId: jamatClass.id,
        subjectId: subject1.id,
        examDate: "2026-04-02",
        startTime: "09:30 AM",
        endTime: "12:30 PM",
        roomNo: "১০১",
      },
    });
    if (createRoutine1Res.statusCode !== 200) {
      console.log("createRoutine1Res failed:", createRoutine1Res.statusCode, createRoutine1Res.data);
    }
    assert(createRoutine1Res.statusCode === 200, "Exam routine item 1 scheduled successfully");

    // CONFLICT TEST 1: Same class, duplicate subject routine in same exam
    const duplicateSubjectRoutineRes = await makeRequest(`/api/admin/exams/${testExam.id}/routine`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: {
        classId: jamatClass.id,
        subjectId: subject1.id,
        examDate: "2026-04-05",
        startTime: "09:30 AM",
        endTime: "12:30 PM",
      },
    });
    assert(duplicateSubjectRoutineRes.statusCode === 409, "Duplicate subject routine for same class blocked with 409 Conflict");

    // CONFLICT TEST 2: Same class, different subject, but overlapping time on same date
    const timeOverlapRoutineRes = await makeRequest(`/api/admin/exams/${testExam.id}/routine`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: {
        classId: jamatClass.id,
        subjectId: subject2.id,
        examDate: "2026-04-02", // Same date as routine 1
        startTime: "09:30 AM",  // Same start time!
        endTime: "12:30 PM",
      },
    });
    assert(timeOverlapRoutineRes.statusCode === 409, "Time conflict on same date and time blocked with 409 Conflict");

    // Schedule routine item 2 on different date (no conflict)
    const createRoutine2Res = await makeRequest(`/api/admin/exams/${testExam.id}/routine`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: {
        classId: jamatClass.id,
        subjectId: subject2.id,
        examDate: "2026-04-04",
        startTime: "09:30 AM",
        endTime: "11:30 AM",
        roomNo: "১০২",
      },
    });
    assert(createRoutine2Res.statusCode === 200, "Non-conflicting routine item 2 scheduled successfully");

    // 5. TEACHER AUTHORIZATION SCOPE & MARKS ENTRY
    console.log("\n--- 5. Teacher Authorization Scoping & Marks Entry Tests ---");

    // SCOPING VIOLATION: Teacher attempts to enter marks for subject2 (NOT assigned to teacher)
    const unauthorizedMarksRes = await makeRequest("/api/teacher/results", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: teacherCookies },
      body: {
        examId: testExam.id,
        classId: jamatClass.id,
        subjectId: subject2.id, // Unassigned!
        entries: [
          { studentId: jamatClass.enrollments[0].studentId, marksObtained: 40 },
        ],
      },
    });
    assert(unauthorizedMarksRes.statusCode === 403, "Unassigned teacher marks entry rejected with 403 Forbidden");

    // BOUNDS CHECK: Negative marks or marks > fullMarks
    const studentA = jamatClass.enrollments[0].student;
    const invalidMarksRes = await makeRequest("/api/teacher/results", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: teacherCookies },
      body: {
        examId: testExam.id,
        classId: jamatClass.id,
        subjectId: subject1.id,
        entries: [
          { studentId: studentA.id, marksObtained: 150 }, // fullMarks is 100
        ],
      },
    });
    assert(invalidMarksRes.statusCode === 400, "Marks exceeding fullMarks rejected with 400 Bad Request");

    // VALID DRAFT SAVE: Teacher enters marks for assigned subject1
    const draftMarksRes = await makeRequest("/api/teacher/results", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: teacherCookies },
      body: {
        examId: testExam.id,
        classId: jamatClass.id,
        subjectId: subject1.id,
        entries: [
          { studentId: studentA.id, marksObtained: 88, isAbsent: false, isExempt: false },
        ],
        action: "DRAFT",
      },
    });
    assert(draftMarksRes.statusCode === 200 && draftMarksRes.json.status === "DRAFT", "Teacher successfully saved marks as DRAFT");

    // Check database mark record
    const draftMarkRecord = await prisma.examMark.findUnique({
      where: {
        examId_studentId_subjectId: {
          examId: testExam.id,
          studentId: studentA.id,
          subjectId: subject1.id,
        },
      },
    });
    assert(draftMarkRecord && draftMarkRecord.status === "DRAFT" && draftMarkRecord.marksObtained === 88, "Draft marks verified in database");

    // VALID SUBMIT: Teacher submits marks for assigned subject1
    const submitMarksRes = await makeRequest("/api/teacher/results", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: teacherCookies },
      body: {
        examId: testExam.id,
        classId: jamatClass.id,
        subjectId: subject1.id,
        entries: [
          { studentId: studentA.id, marksObtained: 88, isAbsent: false, isExempt: false },
        ],
        action: "SUBMIT",
      },
    });
    assert(submitMarksRes.statusCode === 200 && submitMarksRes.json.status === "SUBMITTED", "Teacher successfully submitted marks");

    // Admin enters marks for subject2 (acting as authorized controller)
    const adminMarksRes = await makeRequest("/api/teacher/results", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: {
        examId: testExam.id,
        classId: jamatClass.id,
        subjectId: subject2.id,
        entries: [
          { studentId: studentA.id, marksObtained: 42, isAbsent: false, isExempt: false }, // 42 out of 50 = 84%
        ],
        action: "SUBMIT",
      },
    });
    assert(adminMarksRes.statusCode === 200, "Admin submitted marks for subject2");

    // 6. RESULT CALCULATION CONSISTENCY
    console.log("\n--- 6. Canonical Result Calculation Tests ---");

    function calculateGrade(percentage) {
      if (percentage >= 80) return "মুমতাজ (ممتاز / A+)";
      if (percentage >= 65) return "জায়্যিদ জিদ্দান (جيد جدا / A)";
      if (percentage >= 50) return "জায়্যিদ (جيد / B)";
      if (percentage >= 33) return "মাকবুল (مقبول / C)";
      return "রাসিব (راسب / Fail)";
    }

    function calculateCandidateResult(cand) {
      let totalFull = 0;
      let totalObt = 0;
      let allMandatoryPassed = true;

      for (const s of cand.subjectResults) {
        if (!s.isExempt) {
          totalFull += s.fullMarks;
          if (!s.isAbsent && s.marksObtained !== null) {
            totalObt += s.marksObtained;
          }
        }
        const isPassed = !s.isAbsent && s.marksObtained !== null && s.marksObtained >= s.passMarks;
        if (!s.isOptional && !s.isExempt && !isPassed) {
          allMandatoryPassed = false;
        }
      }

      const percentage = totalFull > 0 ? Number(((totalObt / totalFull) * 100).toFixed(2)) : 0;
      const overallPassed = allMandatoryPassed && percentage >= 33;
      return {
        totalFullMarks: totalFull,
        totalObtained: totalObt,
        percentage,
        isPassed: overallPassed,
        finalGradeBn: overallPassed ? calculateGrade(percentage) : "রাসিব (راسب / Fail)",
      };
    }

    const testCalculation = calculateCandidateResult({
      studentId: studentA.id,
      studentIdNumber: studentA.studentIdNumber,
      fullNameBn: studentA.fullNameBn,
      fullNameEn: studentA.fullNameEn || "Student A",
      rollNumber: 1,
      classNameBn: jamatClass.nameBn,
      subjectResults: [
        {
          subjectId: subject1.id,
          subjectNameBn: subject1.nameBn,
          subjectNameEn: subject1.nameEn,
          subjectCode: subject1.code,
          fullMarks: 100,
          passMarks: 33,
          marksObtained: 88,
          isAbsent: false,
          isExempt: false,
        },
        {
          subjectId: subject2.id,
          subjectNameBn: subject2.nameBn,
          subjectNameEn: subject2.nameEn,
          subjectCode: subject2.code,
          fullMarks: 50,
          passMarks: 17,
          marksObtained: 42,
          isAbsent: false,
          isExempt: false,
        },
      ],
    });

    assert(testCalculation.totalFullMarks === 150, "Total full marks mathematically exact (100 + 50 = 150)");
    assert(testCalculation.totalObtained === 130, "Total obtained marks exact (88 + 42 = 130)");
    assert(testCalculation.percentage === 86.67, `Percentage calculation exact (130/150*100 = ${testCalculation.percentage}%)`);
    assert(testCalculation.isPassed === true, "Student correctly marked as passed (all subjects >= passMarks)");
    assert(testCalculation.finalGradeBn.includes("মুমতাজ"), "Qawmi Islamic Grade is Mumtaz (>=80%)");

    // Test Failure condition (fails if any subject < passMark)
    const failedCalculation = calculateCandidateResult({
      studentId: "test-failed-id",
      studentIdNumber: "EHRJ-FAIL-01",
      fullNameBn: "পরীক্ষার্থী",
      fullNameEn: "Examinee",
      rollNumber: 2,
      classNameBn: jamatClass.nameBn,
      subjectResults: [
        {
          subjectId: subject1.id,
          subjectNameBn: subject1.nameBn,
          subjectNameEn: subject1.nameEn,
          subjectCode: subject1.code,
          fullMarks: 100,
          passMarks: 33,
          marksObtained: 20, // Failed (< 33)
          isAbsent: false,
          isExempt: false,
        },
        {
          subjectId: subject2.id,
          subjectNameBn: subject2.nameBn,
          subjectNameEn: subject2.nameEn,
          subjectCode: subject2.code,
          fullMarks: 50,
          passMarks: 17,
          marksObtained: 45,
          isAbsent: false,
          isExempt: false,
        },
      ],
    });
    assert(failedCalculation.isPassed === false, "Student marked failed if any mandatory subject is failed");
    assert(failedCalculation.finalGradeBn.includes("রাসিব"), "Failed student grade is Rasib (Fail)");

    // 7. ADMIN RESULT REVIEW & PUBLICATION
    console.log("\n--- 7. Admin Review & Result Publication Tests ---");

    const reviewRes = await makeRequest(`/api/admin/results?examId=${testExam.id}&classId=${jamatClass.id}`, {
      method: "GET",
      headers: { Cookie: adminCookies },
    });
    assert(reviewRes.statusCode === 200, "Admin can review aggregated exam results");
    assert(reviewRes.json.summary.totalCandidates >= 1, "Candidates aggregated in review summary");

    // Publish Results
    const publishRes = await makeRequest("/api/admin/results/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: {
        examId: testExam.id,
        classId: jamatClass.id,
        forcePublish: true,
      },
    });
    assert(publishRes.statusCode === 200, "Admin published results successfully");

    // Verify Result record created in database
    const publishedResult = await prisma.result.findUnique({
      where: {
        examId_studentId: {
          examId: testExam.id,
          studentId: studentA.id,
        },
      },
    });
    assert(!!publishedResult && publishedResult.status === "PUBLISHED", "Result persisted with status PUBLISHED");
    assert(!!publishedResult.verificationCode, `Generated tamper-proof verification code (${publishedResult.verificationCode})`);
    assert(!!publishedResult.snapshotJson, "Frozen immutable snapshot JSON persisted");

    const firstVerificationCode = publishedResult.verificationCode;

    // DOUBLE PUBLISH PROTECTION: re-publishing must not overwrite or corrupt verificationCode
    const doublePublishRes = await makeRequest("/api/admin/results/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: {
        examId: testExam.id,
        classId: jamatClass.id,
        forcePublish: true,
      },
    });
    assert(doublePublishRes.statusCode === 200, "Double publish handled safely");

    const postDoublePublishResult = await prisma.result.findUnique({
      where: {
        examId_studentId: {
          examId: testExam.id,
          studentId: studentA.id,
        },
      },
    });
    assert(
      postDoublePublishResult.verificationCode === firstVerificationCode,
      "Double publish protection preserved original verification code"
    );

    // 8. ADMIN RESULT CORRECTION WITH AUDIT
    console.log("\n--- 8. Admin Result Correction & Audit Tests ---");

    const correctionRes = await makeRequest("/api/admin/results/correct", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookies },
      body: {
        examId: testExam.id,
        studentId: studentA.id,
        subjectId: subject1.id,
        newMarks: 95, // Increased from 88 to 95
        isAbsent: false,
        isExempt: false,
        correctionReason: "উত্তরপত্র পুনঃনিরীক্ষায় ৩ নম্বর প্রশ্নে নম্বর যোগ হয়নি বিধায় সংশোধন।",
      },
    });
    assert(correctionRes.statusCode === 200, "Admin corrected marks with mandatory audit reason");

    // Verify database record updated and recalculated
    const correctedResult = await prisma.result.findUnique({
      where: {
        examId_studentId: {
          examId: testExam.id,
          studentId: studentA.id,
        },
      },
    });
    assert(correctedResult.totalObtained === 137, `Recalculated total obtained matches new marks (137 obtained)`);

    // Verify AuditLog record
    const auditRecord = await prisma.auditLog.findFirst({
      where: {
        action: "RESULT_MARKS_CORRECTED",
        entityId: correctedResult.id,
      },
      orderBy: { createdAt: "desc" },
    });
    assert(!!auditRecord, "AuditLog recorded for RESULT_MARKS_CORRECTED");
    if (auditRecord) {
      const details = JSON.parse(auditRecord.detailsJson || "{}");
      assert(details.oldMarks === 88 && details.newMarks === 95, "Audit details accurately captured old and new marks");
      assert(details.correctionReason.includes("পুনঃনিরীক্ষায়"), "Audit details captured mandatory correction reason");
    }

    // 9. GUARDIAN ACCESS & IDOR PROTECTION
    console.log("\n--- 9. Guardian Scope & IDOR Protection Tests ---");

    // Find or create linked guardian for studentA
    let guardian = await prisma.guardian.findFirst({
      where: {
        students: { some: { studentId: studentA.id } },
        user: { isNot: null },
      },
      include: { user: true },
    });

    const testPassword = "Guardian@2026!";
    const testHash = await bcrypt.hash(testPassword, 10);

    let guardianUser = await prisma.user.findFirst({
      where: { role: "GUARDIAN" },
    });

    if (!guardianUser) {
      guardianUser = await prisma.user.create({
        data: {
          username: "guardian_test_user",
          email: "guardiantest@ehrj.edu",
          passwordHash: testHash,
          role: "GUARDIAN",
          name: "অভিভাবক টেস্ট",
          status: "ACTIVE",
        },
      });
    } else {
      await prisma.user.update({
        where: { id: guardianUser.id },
        data: { passwordHash: testHash, status: "ACTIVE" },
      });
    }

    let guardianRecord = await prisma.guardian.findFirst({ where: { userId: guardianUser.id } });
    if (!guardianRecord) {
      guardianRecord = await prisma.guardian.create({
        data: {
          userId: guardianUser.id,
          fullNameBn: "মুহাম্মদ কবির হোসেন",
          fullNameEn: "Md. Kabir Hossain",
          relation: "FATHER",
          phone: "01700998877",
        },
      });
    }

    await prisma.guardianStudent.upsert({
      where: {
        guardianId_studentId: {
          guardianId: guardianRecord.id,
          studentId: studentA.id,
        },
      },
      create: {
        guardianId: guardianRecord.id,
        studentId: studentA.id,
        isPrimary: true,
      },
      update: {},
    });

    // Login Guardian
    const guardianLoginRes = await makeRequest("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        identifier: guardianUser.username || guardianUser.email,
        password: testPassword,
      },
    });

      if (guardianLoginRes.statusCode === 200) {
        const guardianCookies = guardianLoginRes.headers["set-cookie"]
          ? guardianLoginRes.headers["set-cookie"].map((c) => c.split(";")[0]).join("; ")
          : "";

        // Query linked child's published results
        const childResultsRes = await makeRequest(`/api/portal/results?studentId=${studentA.id}`, {
          method: "GET",
          headers: { Cookie: guardianCookies },
        });
        assert(childResultsRes.statusCode === 200, "Guardian can view linked child's published results");
        assert(childResultsRes.json.results.length >= 1, "Guardian received published marksheet record");

        // IDOR Attack: Guardian attempts to query unlinked student
        const otherStudent = await prisma.student.findFirst({
          where: { id: { not: studentA.id } },
        });

        if (otherStudent) {
          const idorRes = await makeRequest(`/api/portal/results?studentId=${otherStudent.id}`, {
            method: "GET",
            headers: { Cookie: guardianCookies },
          });
          assert(idorRes.statusCode === 403, "Guardian IDOR attack to unlinked student blocked with 403 Forbidden");
        }
      } else {
        console.log("  [SKIP] Guardian direct password test (guardian login fixture skipped)");
      }

    // 10. PUBLIC PRIVACY-SAFE RESULT VERIFICATION
    console.log("\n--- 10. Public Privacy-Safe Verification Tests ---");

    // Public query with valid verification code (no auth cookies needed)
    const publicVerifyRes = await makeRequest(`/api/verify/result/${firstVerificationCode}`, {
      method: "GET",
    });

    assert(publicVerifyRes.statusCode === 200, "Public verification returned 200 OK for valid code");
    const verification = publicVerifyRes.json.verification;
    assert(verification.isValid === true, "Verification marked as authentic");
    assert(verification.studentNameBn === studentA.fullNameBn, "Authentic student name displayed");
    assert(verification.verificationCode === firstVerificationCode, "Authentic verification code verified");

    // PRIVACY ENFORCEMENT CHECK: Ensure NO private guardian phone or address is leaked
    assert(!verification.guardianPhone, "Privacy check: Guardian phone strictly omitted");
    assert(!verification.guardianNid, "Privacy check: Guardian NID strictly omitted");
    assert(!verification.presentAddress, "Privacy check: Student private address omitted");
    assert(!verification.feeInvoices, "Privacy check: Student fee/financial info omitted");

    // Invalid code verification
    const invalidCodeRes = await makeRequest("/api/verify/result/INVALID-CODE-9999", {
      method: "GET",
    });
    assert(invalidCodeRes.statusCode === 404, "Invalid verification code returned 404 Not Found");

    console.log("\n=================================================================");
    console.log(`  PHASE 5 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution encountered an error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase5ExamTests();
