import { prisma } from "../src/lib/prisma";
import { createSessionToken } from "../src/lib/auth";

async function createAuthToken(user: { id: string; username: string; role: string; email: string; name: string }) {
  return createSessionToken({
    userId: user.id,
    username: user.username,
    role: user.role,
    email: user.email,
    name: user.name,
  });
}

async function runPhase13HttpEndpointTests() {
  const BASE_URL = "http://localhost:3000";
  console.log("=================================================");
  console.log("🌐 STARTING PHASE 13 HTTP API & SECURITY TESTS");
  console.log("=================================================");

  // 1. Get or create test users (ADMIN, PRINCIPAL, TEACHER, GUARDIAN)
  let admin = await prisma.user.findFirst({ where: { role: "ADMIN", status: "ACTIVE" } });
  let principal = await prisma.user.findFirst({ where: { role: "PRINCIPAL", status: "ACTIVE" } });
  let teacher = await prisma.user.findFirst({ where: { role: "TEACHER", status: "ACTIVE" } });
  let guardian = await prisma.user.findFirst({ where: { role: "GUARDIAN", status: "ACTIVE" } });

  if (!guardian) {
    guardian = await prisma.user.create({
      data: {
        name: "Test Guardian",
        username: "test_guardian_hr",
        email: "guardian_hr@ehrjmadrasha.com",
        passwordHash: "hash123",
        role: "GUARDIAN",
        status: "ACTIVE",
      },
    });
  }

  const adminToken = await createAuthToken(admin!);
  const teacherToken = await createAuthToken(teacher!);
  const guardianToken = await createAuthToken(guardian!);

  // Helper fetch with session cookie
  const authFetch = (url: string, token: string, options: any = {}) => {
    return fetch(`${BASE_URL}${url}`, {
      ...options,
      headers: {
        ...options.headers,
        Cookie: `ehrj_session_token=${token}`,
        "Content-Type": "application/json",
      },
    });
  };

  // TEST 1: Unauthenticated request should be blocked
  console.log("\n[TEST 1] Testing Unauthenticated Access Rejection...");
  const resUnauth = await fetch(`${BASE_URL}/api/admin/hr/stats`);
  console.log(`✅ Unauthenticated /api/admin/hr/stats Status: ${resUnauth.status} (Expected: 401/403)`);
  if (resUnauth.status !== 401 && resUnauth.status !== 403) {
    throw new Error(`Expected 401 or 403 for unauthenticated request, got ${resUnauth.status}`);
  }

  // TEST 2: RBAC Protection - Guardian blocked from HR admin endpoints
  console.log("\n[TEST 2] Testing RBAC Security: Guardian Forbidden...");
  const resGuardian = await authFetch("/api/admin/hr/stats", guardianToken);
  console.log(`✅ Guardian Access /api/admin/hr/stats Status: ${resGuardian.status} (Expected: 403)`);
  if (resGuardian.status !== 403) {
    throw new Error(`Expected 403 for Guardian accessing HR stats, got ${resGuardian.status}`);
  }

  // TEST 3: RBAC Protection - Teacher blocked from HR admin endpoints
  console.log("\n[TEST 3] Testing RBAC Security: Teacher Forbidden...");
  const resTeacher = await authFetch("/api/admin/hr/stats", teacherToken);
  console.log(`✅ Teacher Access /api/admin/hr/stats Status: ${resTeacher.status} (Expected: 403)`);
  if (resTeacher.status !== 403) {
    throw new Error(`Expected 403 for Teacher accessing HR stats, got ${resTeacher.status}`);
  }

  // TEST 4: Admin Access to HR Stats
  console.log("\n[TEST 4] Testing Admin Access to HR Dashboard Stats...");
  const resAdminStats = await authFetch("/api/admin/hr/stats", adminToken);
  const dataAdminStats = await resAdminStats.json();
  console.log(`✅ Admin HR Stats Status: ${resAdminStats.status}, Success=${dataAdminStats.success}, TotalEmployees=${dataAdminStats.stats?.totalEmployees}`);
  if (!dataAdminStats.success || typeof dataAdminStats.stats?.totalEmployees !== "number") {
    throw new Error("Admin HR stats response invalid");
  }

  // TEST 5: Admin Employee Query with Search & Filtering
  console.log("\n[TEST 5] Testing Employee Search & Filtering API...");
  const resEmployees = await authFetch("/api/admin/hr/employees?limit=5", adminToken);
  const dataEmployees = await resEmployees.json();
  console.log(`✅ Employees List Status: ${resEmployees.status}, Count=${dataEmployees.employees?.length}, Total=${dataEmployees.total}`);
  if (!dataEmployees.success || !Array.isArray(dataEmployees.employees)) {
    throw new Error("Employees list response invalid");
  }

  // TEST 6: Public Privacy-Safe Token Verification Endpoint
  console.log("\n[TEST 6] Testing Public Privacy-Safe Verification API (No Auth Required)...");
  const sampleEmp = dataEmployees.employees[0];
  if (sampleEmp?.qrToken) {
    const resPublic = await fetch(`${BASE_URL}/api/public/hr/verify/${sampleEmp.qrToken}`);
    const dataPublic = await resPublic.json();
    console.log(`✅ Public Verification Status: ${resPublic.status}, Valid=${dataPublic.isValid}, Name=${dataPublic.employee?.nameBn}`);
    if (!dataPublic.isValid || dataPublic.employee?.salary !== undefined) {
      throw new Error("Public verification failed or leaked private fields");
    }
  }

  // TEST 7: Teacher cannot mutate protected HR employee records
  console.log("\n[TEST 7] Testing IDOR & Mutation Security: Teacher Cannot Create/Update Employee...");
  const resTeacherMutate = await authFetch("/api/admin/hr/employees", teacherToken, {
    method: "POST",
    body: JSON.stringify({
      nameBn: "অবৈধ চেষ্টা",
      nameEn: "Unauthorized Attempt",
      mobile: "01700000000",
    }),
  });
  console.log(`✅ Teacher Mutation Blocked Status: ${resTeacherMutate.status} (Expected: 403)`);
  if (resTeacherMutate.status !== 403) {
    throw new Error(`Expected 403 for Teacher mutation, got ${resTeacherMutate.status}`);
  }

  console.log("\n=================================================");
  console.log("🎉 ALL PHASE 13 HTTP API & SECURITY TESTS PASSED!");
  console.log("=================================================\n");
}

runPhase13HttpEndpointTests()
  .catch((err) => {
    console.error("❌ Phase 13 HTTP API Test Error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
