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

async function runPhase14HttpEndpointTests() {
  const BASE_URL = "http://localhost:3000";
  console.log("=================================================");
  console.log("🌐 STARTING PHASE 14 HTTP API & SECURITY TESTS");
  console.log("=================================================");

  // 1. Get or create test users
  let admin = await prisma.user.findFirst({ where: { role: "ADMIN", status: "ACTIVE" } });
  let teacher = await prisma.user.findFirst({ where: { role: "TEACHER", status: "ACTIVE" } });

  // Guardian 1
  let guardianUser1 = await prisma.user.upsert({
    where: { username: "guardian1_http_p14" },
    update: {},
    create: {
      name: "অভিভাবক এক (HTTP Test)",
      username: "guardian1_http_p14",
      email: "guardian1_http_p14@ehrjmadrasha.com",
      passwordHash: "hash123",
      role: "GUARDIAN",
      status: "ACTIVE",
    },
  });

  const guardian1 = await prisma.guardian.upsert({
    where: { phone: "01711000014" },
    update: { userId: guardianUser1.id },
    create: {
      fullNameBn: "অভিভাবক এক",
      phone: "01711000014",
      relation: "FATHER",
      userId: guardianUser1.id,
    },
  });

  // Guardian 2 (for IDOR attack testing)
  let guardianUser2 = await prisma.user.upsert({
    where: { username: "guardian2_http_p14" },
    update: {},
    create: {
      name: "অভিভাবক দুই (HTTP Test)",
      username: "guardian2_http_p14",
      email: "guardian2_http_p14@ehrjmadrasha.com",
      passwordHash: "hash123",
      role: "GUARDIAN",
      status: "ACTIVE",
    },
  });

  const guardian2 = await prisma.guardian.upsert({
    where: { phone: "01711000024" },
    update: { userId: guardianUser2.id },
    create: {
      fullNameBn: "অভিভাবক দুই",
      phone: "01711000024",
      relation: "FATHER",
      userId: guardianUser2.id,
    },
  });

  // Student linked to Guardian 1
  const student1 = await prisma.student.upsert({
    where: { studentIdNumber: "EHRJ-HTTP-ST1" },
    update: {},
    create: {
      studentIdNumber: "EHRJ-HTTP-ST1",
      fullNameBn: "মুহাম্মদ সাকিব করিম",
      fullNameEn: "Muhammad Shakib Karim",
      dateOfBirth: new Date("2014-06-15"),
      gender: "MALE",
      fatherNameBn: "অভিভাবক এক",
      motherNameBn: "মোসাম্মৎ সাজেদা",
      presentAddress: "দাউদকান্দি",
      permanentAddress: "দাউদকান্দি",
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

  const adminToken = await createAuthToken(admin!);
  const teacherToken = await createAuthToken(teacher!);
  const guardian1Token = await createAuthToken(guardianUser1);
  const guardian2Token = await createAuthToken(guardianUser2);

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
  const resUnauth = await fetch(`${BASE_URL}/api/admin/helpdesk/stats`);
  console.log(`✅ Unauthenticated /api/admin/helpdesk/stats Status: ${resUnauth.status} (Expected: 403)`);
  if (resUnauth.status !== 403) {
    throw new Error(`Expected 403 for unauthenticated request, got ${resUnauth.status}`);
  }

  // TEST 2: RBAC Protection - Guardian blocked from Admin Helpdesk
  console.log("\n[TEST 2] Testing RBAC Security: Guardian Forbidden from Admin API...");
  const resGuardianAdmin = await authFetch("/api/admin/helpdesk/stats", guardian1Token);
  console.log(`✅ Guardian Access /api/admin/helpdesk/stats Status: ${resGuardianAdmin.status} (Expected: 403)`);
  if (resGuardianAdmin.status !== 403) {
    throw new Error(`Expected 403 for Guardian accessing admin helpdesk, got ${resGuardianAdmin.status}`);
  }

  // TEST 3: RBAC Protection - Teacher blocked from Admin Helpdesk
  console.log("\n[TEST 3] Testing RBAC Security: Teacher Forbidden from Admin API...");
  const resTeacher = await authFetch("/api/admin/helpdesk/stats", teacherToken);
  console.log(`✅ Teacher Access /api/admin/helpdesk/stats Status: ${resTeacher.status} (Expected: 403)`);
  if (resTeacher.status !== 403) {
    throw new Error(`Expected 403 for Teacher accessing admin helpdesk, got ${resTeacher.status}`);
  }

  // TEST 4: Admin Access to Helpdesk Dashboard Stats
  console.log("\n[TEST 4] Testing Admin Access to Helpdesk Stats...");
  const resAdminStats = await authFetch("/api/admin/helpdesk/stats", adminToken);
  const dataAdminStats = await resAdminStats.json();
  console.log(`✅ Admin Helpdesk Stats: Status ${resAdminStats.status}, Success=${dataAdminStats.success}, TotalRequests=${dataAdminStats.stats?.totalRequests}`);
  if (!dataAdminStats.success || typeof dataAdminStats.stats?.totalRequests !== "number") {
    throw new Error("Admin Helpdesk stats response invalid");
  }

  // TEST 5: Admin Categories List
  console.log("\n[TEST 5] Testing Admin Categories API...");
  const resCategories = await authFetch("/api/admin/helpdesk/categories", adminToken);
  const dataCategories = await resCategories.json();
  console.log(`✅ Categories Status: ${resCategories.status}, Count=${dataCategories.categories?.length}`);
  if (!dataCategories.success || dataCategories.categories.length < 12) {
    throw new Error("Categories endpoint returned invalid count");
  }

  // TEST 6: Guardian 1 Creates Support Request via Portal API
  console.log("\n[TEST 6] Testing Guardian 1 Ticket Creation via POST /api/portal/helpdesk...");
  const timestamp = Date.now();
  const resCreate = await authFetch("/api/portal/helpdesk", guardian1Token, {
    method: "POST",
    body: JSON.stringify({
      studentId: student1.id,
      categoryCode: "ATTENDANCE",
      requestType: "CORRECTION_REQUEST",
      priority: "IMPORTANT",
      subject: `হাজিরা সংশোধনের প্রাতিষ্ঠানিক আবেদন_${timestamp}`,
      description: "গত সপ্তাহের মঙ্গলবারে উপস্থিত থাকা সত্ত্বেও হাজিরায় অনুপস্থিত দেখানো হয়েছে। দয়া করে রেজিস্টার দেখে সংশোধন করুন।",
    }),
  });
  const dataCreate = await resCreate.json();
  console.log(`✅ Create Ticket Status: ${resCreate.status}, TicketNumber=${dataCreate.ticket?.ticketNumber}`);
  if (!dataCreate.success || !dataCreate.ticket?.id) {
    throw new Error(`Ticket creation failed: ${dataCreate.error}`);
  }
  const ticketId = dataCreate.ticket.id;

  // TEST 7: Guardian 1 Fetches Ticket List
  console.log("\n[TEST 7] Testing Guardian 1 Portal Tickets List...");
  const resGuardianList = await authFetch("/api/portal/helpdesk", guardian1Token);
  const dataGuardianList = await resGuardianList.json();
  console.log(`✅ Guardian 1 List Status: ${resGuardianList.status}, Items=${dataGuardianList.items?.length}`);
  const hasCreatedTicket = dataGuardianList.items?.some((t: any) => t.id === ticketId);
  if (!hasCreatedTicket) {
    throw new Error("Created ticket not found in Guardian 1 list");
  }

  // TEST 8: IDOR Security Test: Guardian 2 attempts to view Guardian 1's Ticket
  console.log("\n[TEST 8] Testing IDOR Security: Guardian 2 cannot access Guardian 1's Ticket...");
  const resIdor = await authFetch(`/api/portal/helpdesk/${ticketId}`, guardian2Token);
  console.log(`✅ Guardian 2 Accessing Guardian 1 Ticket Status: ${resIdor.status} (Expected: 403)`);
  if (resIdor.status !== 403) {
    throw new Error(`SECURITY VULNERABILITY: Expected 403 on IDOR attempt, got ${resIdor.status}`);
  }

  // TEST 9: Admin Adds Internal Note
  console.log("\n[TEST 9] Testing Admin Adding Internal Note (isInternal=true)...");
  const resInternalNote = await authFetch(`/api/admin/helpdesk/requests/${ticketId}/messages`, adminToken, {
    method: "POST",
    body: JSON.stringify({
      content: "গোপন অভ্যন্তরীণ নোট: ক্লাস টিচার হাজিরা শিট খাতা পুনরায় পরীক্ষা করবেন।",
      isInternal: true,
    }),
  });
  const dataInternalNote = await resInternalNote.json();
  console.log(`✅ Internal Note Status: ${resInternalNote.status}, MessageType=${dataInternalNote.message?.messageType}, isInternal=${dataInternalNote.message?.isInternal}`);
  if (!dataInternalNote.success || !dataInternalNote.message?.isInternal) {
    throw new Error("Internal note creation failed");
  }

  // TEST 10: Guardian 1 Fetches Ticket Detail and Verifies Redaction of Internal Notes
  console.log("\n[TEST 10] Testing Redaction: Guardian 1 Cannot See Internal Note...");
  const resGuardianDetail = await authFetch(`/api/portal/helpdesk/${ticketId}`, guardian1Token);
  const dataGuardianDetail = await resGuardianDetail.json();
  console.log(`✅ Guardian Detail Status: ${resGuardianDetail.status}, MessagesCount=${dataGuardianDetail.ticket?.messages?.length}`);
  const leakFound = dataGuardianDetail.ticket?.messages?.some((m: any) => m.isInternal || m.messageType === "INTERNAL_NOTE");
  if (leakFound) {
    throw new Error("SECURITY LEAK: Internal note visible to Guardian in ticket detail API!");
  }
  console.log("🔒 Verified: Zero internal notes exposed to Guardian.");

  // TEST 11: Admin Updates Status to IN_PROGRESS then RESOLVED with Resolution Summary
  console.log("\n[TEST 11] Testing Admin Updating Status to IN_PROGRESS then RESOLVED...");
  // Step A: Move to IN_PROGRESS
  const resProgress = await authFetch(`/api/admin/helpdesk/requests/${ticketId}/status`, adminToken, {
    method: "PATCH",
    body: JSON.stringify({
      toStatus: "IN_PROGRESS",
      notes: "তদন্ত কার্যক্রম শুরু হয়েছে।",
    }),
  });
  const dataProgress = await resProgress.json();
  console.log(`✅ Status IN_PROGRESS: Status ${resProgress.status}, TicketStatus=${dataProgress.ticket?.status}`);
  if (!dataProgress.success || dataProgress.ticket?.status !== "IN_PROGRESS") {
    throw new Error("Progress status update failed");
  }

  // Step B: Move to RESOLVED
  const resResolve = await authFetch(`/api/admin/helpdesk/requests/${ticketId}/status`, adminToken, {
    method: "PATCH",
    body: JSON.stringify({
      toStatus: "RESOLVED",
      resolutionSummary: "হাজিরা শিট যাচাই করে শিক্ষার্থীর উপস্থিতি রেকর্ড সংশোধন করা হয়েছে।",
    }),
  });
  const dataResolve = await resResolve.json();
  console.log(`✅ Status RESOLVED: Status ${resResolve.status}, TicketStatus=${dataResolve.ticket?.status}`);
  if (!dataResolve.success || dataResolve.ticket?.status !== "RESOLVED") {
    throw new Error("Resolution status update failed");
  }

  // TEST 12: Guardian 1 Reopen Request
  console.log("\n[TEST 12] Testing Guardian 1 Requesting Reopen on Resolved Ticket...");
  const resReopen = await authFetch(`/api/portal/helpdesk/${ticketId}/reopen`, guardian1Token, {
    method: "POST",
    body: JSON.stringify({
      reason: "পোর্টালে এখনো অনুপস্থিত দেখাচ্ছে, দয়া করে পুনরায় চেক করুন।",
    }),
  });
  const dataReopen = await resReopen.json();
  console.log(`✅ Reopen Request: Status ${resReopen.status}, Status=${dataReopen.ticket?.status}`);
  if (!dataReopen.success || dataReopen.ticket?.status !== "REOPEN_REQUESTED") {
    throw new Error("Reopen request failed");
  }

  // TEST 13: Admin Helpdesk Reports
  console.log("\n[TEST 13] Testing Admin Helpdesk Reports API...");
  const resReports = await authFetch("/api/admin/helpdesk/reports", adminToken);
  const dataReports = await resReports.json();
  console.log(`✅ Reports API: Status ${resReports.status}, TotalCount=${dataReports.report?.totalCount}, Resolved=${dataReports.report?.resolvedCount}`);
  if (!dataReports.success || typeof dataReports.report?.totalCount !== "number") {
    throw new Error("Helpdesk reports response invalid");
  }

  console.log("\n=================================================");
  console.log("🎉 ALL 13 PHASE 14 HTTP API & SECURITY TESTS PASSED!");
  console.log("=================================================\n");
}

runPhase14HttpEndpointTests()
  .catch((err) => {
    console.error("HTTP Test Error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
