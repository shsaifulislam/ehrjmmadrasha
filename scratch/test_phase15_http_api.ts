import { prisma } from "../src/lib/prisma";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "ehrj-madrasa-digital-campus-secure-production-jwt-secret-key-2026"
);

async function createAuthToken(user: { id: string; username: string; role: string; email: string; name: string }) {
  return new SignJWT({
    userId: user.id,
    username: user.username,
    role: user.role,
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

async function runPhase15HttpEndpointTests() {
  const BASE_URL = "http://localhost:3000";
  console.log("=================================================");
  console.log("🌐 STARTING PHASE 15 HTTP API & SECURITY TESTS");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      failed++;
    }
  }

  // 1. Fetch or create test users
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN", status: "ACTIVE" } });
  if (!admin) throw new Error("No active ADMIN user found");

  const teacher = await prisma.user.findFirst({ where: { role: "TEACHER", status: "ACTIVE" } });
  if (!teacher) throw new Error("No active TEACHER user found");

  // Guardian 1
  const guardianUser1 = await prisma.user.upsert({
    where: { username: "guardian1_http_p15" },
    update: {},
    create: {
      name: "অভিভাবক এক (HTTP Test P15)",
      username: "guardian1_http_p15",
      email: "guardian1_http_p15@ehrjmadrasha.com",
      passwordHash: "hash123",
      role: "GUARDIAN",
      status: "ACTIVE",
    },
  });

  const guardian1 = await prisma.guardian.upsert({
    where: { phone: "01711000015" },
    update: { userId: guardianUser1.id },
    create: {
      fullNameBn: "অভিভাবক এক",
      phone: "01711000015",
      relation: "FATHER",
      userId: guardianUser1.id,
    },
  });

  // Guardian 2 (for IDOR attack testing)
  const guardianUser2 = await prisma.user.upsert({
    where: { username: "guardian2_http_p15" },
    update: {},
    create: {
      name: "অভিভাবক দুই (HTTP Test P15)",
      username: "guardian2_http_p15",
      email: "guardian2_http_p15@ehrjmadrasha.com",
      passwordHash: "hash123",
      role: "GUARDIAN",
      status: "ACTIVE",
    },
  });

  const guardian2 = await prisma.guardian.upsert({
    where: { phone: "01711000025" },
    update: { userId: guardianUser2.id },
    create: {
      fullNameBn: "অভিভাবক দুই",
      phone: "01711000025",
      relation: "FATHER",
      userId: guardianUser2.id,
    },
  });

  // Student linked to Guardian 1
  const student1 = await prisma.student.upsert({
    where: { studentIdNumber: "EHRJ-HTTP15-ST1" },
    update: {},
    create: {
      studentIdNumber: "EHRJ-HTTP15-ST1",
      fullNameBn: "মুহাম্মদ জামিল করিম (P15)",
      fullNameEn: "Muhammad Jamil Karim P15",
      dateOfBirth: new Date("2013-08-10"),
      gender: "MALE",
      fatherNameBn: "অভিভাবক এক",
      motherNameBn: "মোসাম্মৎ শামীমা",
      presentAddress: "দাউদকান্দি",
      permanentAddress: "দাউদকান্দি",
      status: "ACTIVE",
    },
  });

  // Student linked to Guardian 2
  const student2 = await prisma.student.upsert({
    where: { studentIdNumber: "EHRJ-HTTP15-ST2" },
    update: {},
    create: {
      studentIdNumber: "EHRJ-HTTP15-ST2",
      fullNameBn: "মুহাম্মদ হাসান মাহমুদ (P15)",
      fullNameEn: "Muhammad Hasan Mahmud P15",
      dateOfBirth: new Date("2014-02-12"),
      gender: "MALE",
      fatherNameBn: "অভিভাবক দুই",
      motherNameBn: "মোসাম্মৎ রুকসানা",
      presentAddress: "দাউদকান্দি",
      permanentAddress: "দাউদকান্দি",
      status: "ACTIVE",
    },
  });

  await prisma.guardianStudent.upsert({
    where: {
      guardianId_studentId: {
        guardianId: guardian1.id,
        studentId: student1.id,
      },
    },
    update: {},
    create: {
      guardianId: guardian1.id,
      studentId: student1.id,
      isPrimary: true,
    },
  });

  await prisma.guardianStudent.upsert({
    where: {
      guardianId_studentId: {
        guardianId: guardian2.id,
        studentId: student2.id,
      },
    },
    update: {},
    create: {
      guardianId: guardian2.id,
      studentId: student2.id,
      isPrimary: true,
    },
  });

  // Sessions for comparison
  const sessions = await prisma.academicSession.findMany({ take: 2 });

  const adminToken = await createAuthToken(admin);
  const teacherToken = await createAuthToken(teacher);
  const guardian1Token = await createAuthToken(guardianUser1);
  const guardian2Token = await createAuthToken(guardianUser2);

  const authFetch = (url: string, token?: string, options: any = {}) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };
    if (token) {
      headers["Cookie"] = `ehrj_session_token=${token}`;
    }
    return fetch(`${BASE_URL}${url}`, {
      ...options,
      headers,
    });
  };

  // -------------------------------------------------------------
  // Test 1: Unauthenticated Access Rejection
  // -------------------------------------------------------------
  console.log("--- 1. Unauthenticated Request Rejection ---");
  const resUnauth = await authFetch("/api/admin/analytics/overview");
  assert(resUnauth.status === 401 || resUnauth.status === 403, `Unauthenticated request returned ${resUnauth.status}`);

  // -------------------------------------------------------------
  // Test 2: RBAC Rejection for Unauthorized Roles
  // -------------------------------------------------------------
  console.log("\n--- 2. RBAC Access Controls ---");
  const resGuardianAdmin = await authFetch("/api/admin/analytics/overview", guardian1Token);
  assert(resGuardianAdmin.status === 403, `Guardian blocked from admin analytics (Status: ${resGuardianAdmin.status})`);

  const resTeacherFinance = await authFetch("/api/admin/analytics/finance", teacherToken);
  assert(resTeacherFinance.status === 403, `Teacher blocked from admin finance analytics (Status: ${resTeacherFinance.status})`);

  // -------------------------------------------------------------
  // Test 3: Admin Overview Analytics API
  // -------------------------------------------------------------
  console.log("\n--- 3. Admin Overview Analytics API ---");
  const resOverview = await authFetch("/api/admin/analytics/overview", adminToken);
  assert(resOverview.status === 200, `Admin overview returned status 200`);
  const jsonOverview = await resOverview.json();
  const dataOverview = jsonOverview.data;
  assert(dataOverview?.students && typeof dataOverview.students.total === "number", `Overview has total students (${dataOverview?.students?.total})`);
  assert(Array.isArray(dataOverview?.finance?.funds) && dataOverview.finance.funds.length === 5, `Overview tracks all 5 cash funds`);
  assert(Array.isArray(dataOverview?.alerts), `Overview returns actionable alerts array`);
  assert(typeof dataOverview?.executiveSummary?.bn === "string", `Overview provides Bengali executive narrative`);

  // -------------------------------------------------------------
  // Test 4: Admin Student & Admission Analytics APIs
  // -------------------------------------------------------------
  console.log("\n--- 4. Admin Student & Admission Analytics APIs ---");
  const resStudents = await authFetch("/api/admin/analytics/students", adminToken);
  assert(resStudents.status === 200, `Admin students analytics returned status 200`);
  const dataStudents = (await resStudents.json()).data;
  assert(typeof dataStudents?.totalStudents === "number", `Student analytics total count verified (${dataStudents?.totalStudents})`);
  assert(Array.isArray(dataStudents?.classDistribution), `Student class distribution returned`);

  const resAdmissions = await authFetch("/api/admin/analytics/admissions", adminToken);
  assert(resAdmissions.status === 200, `Admin admission analytics returned status 200`);
  const dataAdmissions = (await resAdmissions.json()).data;
  assert(typeof dataAdmissions?.conversionRate === "number", `Admission conversion rate returned (${dataAdmissions?.conversionRate}%)`);

  // -------------------------------------------------------------
  // Test 5: Admin Attendance & Academic Analytics APIs
  // -------------------------------------------------------------
  console.log("\n--- 5. Admin Attendance & Academic Analytics APIs ---");
  const resAttendance = await authFetch("/api/admin/analytics/attendance", adminToken);
  assert(resAttendance.status === 200, `Admin attendance analytics returned status 200`);
  const dataAttendance = (await resAttendance.json()).data;
  assert(typeof dataAttendance?.overallRate === "number", `Attendance rate computed (${dataAttendance?.overallRate}%)`);

  const resAcademic = await authFetch("/api/admin/analytics/academic", adminToken);
  assert(resAcademic.status === 200, `Admin academic analytics returned status 200`);
  const dataAcademic = (await resAcademic.json()).data;
  assert(Array.isArray(dataAcademic?.gradeDistribution), `Academic Qawmi grade distribution returned`);

  // -------------------------------------------------------------
  // Test 6: Admin Finance & Operations Analytics APIs
  // -------------------------------------------------------------
  console.log("\n--- 6. Admin Finance & Operations Analytics APIs ---");
  const resFinance = await authFetch("/api/admin/analytics/finance", adminToken);
  assert(resFinance.status === 200, `Admin finance analytics returned status 200`);
  const dataFinance = (await resFinance.json()).data;
  assert(typeof dataFinance?.summary?.netSurplus === "number", `Finance net balance computed (৳${dataFinance?.summary?.netSurplus})`);
  assert(Array.isArray(dataFinance?.fundMovements), `Finance 5 cash funds list returned`);

  const resOps = await authFetch("/api/admin/analytics/operations", adminToken);
  assert(resOps.status === 200, `Admin operations analytics returned status 200`);
  const dataOps = (await resOps.json()).data;
  assert(dataOps?.library && dataOps?.hostel && dataOps?.transport && dataOps?.inventory && dataOps?.hr && dataOps?.helpdesk, `Operations multi-module metrics verified`);

  // -------------------------------------------------------------
  // Test 7: Session Comparison API
  // -------------------------------------------------------------
  console.log("\n--- 7. Session Comparison API ---");
  if (sessions.length >= 2) {
    const resComp = await authFetch(`/api/admin/analytics/comparison?sessionAId=${sessions[0].id}&sessionBId=${sessions[1].id}`, adminToken);
    assert(resComp.status === 200, `Session comparison returned status 200`);
    const dataComp = (await resComp.json()).data;
    assert(dataComp?.metrics && dataComp?.sessionA && dataComp?.sessionB, `Session comparison metrics computed`);
  } else {
    console.log("  ⚠️ SKIP: Less than 2 sessions in database for comparison test");
  }

  // -------------------------------------------------------------
  // Test 8: Report Builder API
  // -------------------------------------------------------------
  console.log("\n--- 8. Report Builder API ---");
  const resBuilder = await authFetch("/api/admin/analytics/reports/builder", adminToken, {
    method: "POST",
    body: JSON.stringify({
      module: "STUDENTS",
      limit: 5,
    }),
  });
  assert(resBuilder.status === 200, `Report builder returned status 200`);
  const resultBuilder = (await resBuilder.json()).result;
  assert(Array.isArray(resultBuilder?.data), `Report builder returned data records array (Found: ${resultBuilder?.data?.length})`);

  // -------------------------------------------------------------
  // Test 9: Saved Reports CRUD API
  // -------------------------------------------------------------
  console.log("\n--- 9. Saved Reports CRUD API ---");
  const resCreateSaved = await authFetch("/api/admin/analytics/reports/saved", adminToken, {
    method: "POST",
    body: JSON.stringify({
      title: "HTTP টেস্ট সংরক্ষিত রিপোর্ট (P15)",
      description: "স্বয়ংক্রিয় টেস্ট রিপোর্ট",
      module: "FINANCE",
      reportType: "FINANCIAL_SUMMARY",
      filtersJson: { dateRange: "THIS_MONTH" },
    }),
  });
  assert(resCreateSaved.status === 201 || resCreateSaved.status === 200, `Saved report creation returned status ${resCreateSaved.status}`);
  const dataSaved = await resCreateSaved.json();
  const savedReportId = dataSaved.saved?.id || dataSaved.id;
  assert(!!savedReportId, `Saved report ID obtained: ${savedReportId}`);

  const resListSaved = await authFetch("/api/admin/analytics/reports/saved", adminToken);
  assert(resListSaved.status === 200, `Saved reports list returned status 200`);
  const listSaved = await resListSaved.json();
  assert(Array.isArray(listSaved.reports), `Saved reports list returned array`);

  if (savedReportId) {
    const resDeleteSaved = await authFetch(`/api/admin/analytics/reports/saved/${savedReportId}`, adminToken, {
      method: "DELETE",
    });
    assert(resDeleteSaved.status === 200, `Saved report deletion returned status 200`);
  }

  // -------------------------------------------------------------
  // Test 10: Teacher Analytics API (Scoped)
  // -------------------------------------------------------------
  console.log("\n--- 10. Teacher Analytics API ---");
  const resTeacher = await authFetch("/api/teacher/analytics", teacherToken);
  assert(resTeacher.status === 200, `Teacher analytics returned status 200`);
  const dataTeacher = (await resTeacher.json()).data;
  assert(dataTeacher && typeof dataTeacher.totalAssignments === "number", `Teacher assignments returned (${dataTeacher?.totalAssignments})`);

  // -------------------------------------------------------------
  // Test 11: Guardian Child Analytics API & IDOR Security Check
  // -------------------------------------------------------------
  console.log("\n--- 11. Guardian Child Analytics & IDOR Security ---");
  // Legitimate request: Guardian 1 requesting child 1
  const resGuardianChild1 = await authFetch(`/api/portal/analytics/${student1.id}`, guardian1Token);
  assert(resGuardianChild1.status === 200, `Guardian 1 querying own child 1 returned status 200`);
  const dataChild1 = (await resGuardianChild1.json()).data;
  assert(dataChild1 && dataChild1.student.id === student1.id, `Child 1 details correctly returned to Guardian 1`);

  // IDOR ATTACK: Guardian 1 attempting to query Student 2 (linked to Guardian 2)
  const resIdorAttack = await authFetch(`/api/portal/analytics/${student2.id}`, guardian1Token);
  assert(resIdorAttack.status === 403, `IDOR BLOCKED: Guardian 1 requesting unlinked student 2 returned 403 (Actual: ${resIdorAttack.status})`);

  console.log("\n=================================================");
  console.log(`  PHASE 15 HTTP API TESTS FINISHED: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase15HttpEndpointTests()
  .catch((err) => {
    console.error("Test execution aborted due to error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
