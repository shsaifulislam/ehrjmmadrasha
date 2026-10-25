import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const BASE_URL = "http://localhost:3000";

let testPassCount = 0;
let testFailCount = 0;

function assert(condition, name, details = "") {
  if (condition) {
    testPassCount++;
    console.log(`  [PASS] ${name}`);
  } else {
    testFailCount++;
    console.error(`  [FAIL] ${name} => ${details}`);
  }
}

async function loginUser(identifier, password, panel) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password, panel })
  });
  const data = await res.json().catch(() => ({}));
  const setCookie = res.headers.get("set-cookie") || "";
  const match = setCookie.match(/ehrj_session_token=([^;]+)/);
  const token = match ? match[1] : (data.token || "");
  return { status: res.status, data, token, cookieHeader: `ehrj_session_token=${token}` };
}

async function runSecurityReliabilitySuite() {
  console.log("================================================================================");
  console.log("EHRJ MADRASHA ERP — PHASE 15: SECURITY & RELIABILITY VERIFICATION SUITE");
  console.log("================================================================================");

  // 1. AUTHENTICATION EXPIRATION & INVALID TOKEN REJECTION
  console.log("\n>>> TEST 1: INVALID / MALFORMED / EXPIRED TOKEN REJECTION");
  const badTokenRes = await fetch(`${BASE_URL}/api/admin/system/health`, {
    headers: {
      "Cookie": "ehrj_session_token=invalid_expired_token_signature_99999",
      "Authorization": "Bearer invalid_expired_token_signature_99999"
    }
  });
  assert(badTokenRes.status === 401 || badTokenRes.status === 403, "Invalid/expired token strictly rejected with 401/403", `Status: ${badTokenRes.status}`);

  // 2. SERVER-SIDE ROLE ENFORCEMENT & ACCESS BOUNDARIES
  console.log("\n>>> TEST 2: SERVER-SIDE ROLE-BASED ACCESS CONTROL (RBAC)");
  // Admin login
  const adminAuth = await loginUser("admin@ehrj.edu.bd", "Admin@2026!", "INSTITUTIONAL");
  assert(adminAuth.status === 200 && Boolean(adminAuth.token), "Admin login successful with valid session token");

  // Teacher login
  const teacherAuth = await loginUser("teacherehrjmadrasha@gmail.com", "Teacher@2026!", "INSTITUTIONAL");
  assert(teacherAuth.status === 200 && Boolean(teacherAuth.token), "Teacher login successful with valid session token");

  // Guardian login
  const guardianAuth = await loginUser("guardian_ui_demo@ehrj.local", "Guardian@2026!", "GUARDIAN");
  assert(guardianAuth.status === 200 && Boolean(guardianAuth.token), "Guardian login successful with valid session token");

  // Verify Admin can access admin settings
  const adminSettings = await fetch(`${BASE_URL}/api/admin/settings`, {
    headers: { "Cookie": adminAuth.cookieHeader }
  });
  assert(adminSettings.status === 200, "Admin permitted to access /api/admin/settings (200)");

  // Verify Teacher is BLOCKED from accessing admin settings
  const teacherSettings = await fetch(`${BASE_URL}/api/admin/settings`, {
    headers: { "Cookie": teacherAuth.cookieHeader }
  });
  assert(teacherSettings.status === 403, "Teacher strictly forbidden from admin settings (403)", `Got ${teacherSettings.status}`);

  // Verify Guardian is BLOCKED from accessing admin settings
  const guardianSettings = await fetch(`${BASE_URL}/api/admin/settings`, {
    headers: { "Cookie": guardianAuth.cookieHeader }
  });
  assert(guardianSettings.status === 403, "Guardian strictly forbidden from admin settings (403)", `Got ${guardianSettings.status}`);

  // Verify Public/Unauthenticated is BLOCKED
  const publicSettings = await fetch(`${BASE_URL}/api/admin/settings`);
  assert(publicSettings.status === 401 || publicSettings.status === 403, "Public strictly rejected from admin routes (401/403)", `Got ${publicSettings.status}`);

  // 3. GUARDIAN-TO-STUDENT ISOLATION (IDOR PROTECTION)
  console.log("\n>>> TEST 3: GUARDIAN CUSTODIAL ISOLATION & IDOR DEFENSE");
  const myChildrenRes = await fetch(`${BASE_URL}/api/portal/children`, {
    headers: { "Cookie": guardianAuth.cookieHeader },
  });
  const myChildrenData = await myChildrenRes.json();
  assert(myChildrenRes.status === 200 && myChildrenData.children.length > 0, "Guardian retrieves their own registered children");
  const authorizedChildId = myChildrenData.children[0].id;

  // Guardian querying own student attendance
  const ownAttRes = await fetch(`${BASE_URL}/api/portal/attendance?studentId=${authorizedChildId}&year=2026`, {
    headers: { "Cookie": guardianAuth.cookieHeader }
  });
  assert(ownAttRes.status === 200, "Guardian successfully views own child's attendance (200)");

  // Look up an unrelated student
  const unauthorizedChild = await prisma.student.findFirst({
    where: { id: { notIn: myChildrenData.children.map((c) => c.id) } },
  });
  assert(Boolean(unauthorizedChild), `Found other family student: ${unauthorizedChild?.id}`);

  // Guardian attempting IDOR query on other student's attendance
  const idorAttRes = await fetch(`${BASE_URL}/api/portal/attendance?studentId=${unauthorizedChild.id}&year=2026`, {
    headers: { "Cookie": guardianAuth.cookieHeader }
  });
  assert(idorAttRes.status === 403, "Guardian forbidden from viewing other child's attendance (403 IDOR blocked)", `Got ${idorAttRes.status}`);

  const idorFinanceRes = await fetch(`${BASE_URL}/api/portal/finance?studentId=${unauthorizedChild.id}`, {
    headers: { "Cookie": guardianAuth.cookieHeader },
  });
  assert(idorFinanceRes.status === 403, "Guardian forbidden from viewing other child's finance (403 IDOR blocked)", `Got ${idorFinanceRes.status}`);

  // 4. UNAUTHORIZED MUTATIONS ENFORCEMENT
  console.log("\n>>> TEST 4: UNAUTHORIZED MUTATION REJECTION");
  // Teacher attempting to approve admissions (Admin/Principal only)
  const teacherIllegalApprove = await fetch(`${BASE_URL}/api/app/module-data`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Cookie": teacherAuth.cookieHeader },
    body: JSON.stringify({
      action: "UPDATE_ADMISSION_STATUS",
      payload: { applicationId: "dummy-id", status: "APPROVED" },
    }),
  });
  assert(teacherIllegalApprove.status === 403, "Teacher strictly forbidden from UPDATE_ADMISSION_STATUS (403)", `Got ${teacherIllegalApprove.status}`);

  // 5. DUPLICATE TRANSACTION ID (TrxID) REJECTION
  console.log("\n>>> TEST 5: FINANCIAL DEDUPLICATION & CONCURRENCY REPLAY GUARD");
  const uniqueTrx = `TRX-P15-${Date.now().toString().slice(-6)}`;
  const sampleStudent = await prisma.student.findFirst({ where: { status: "ACTIVE" } });

  // First spot collection with uniqueTrx
  const spotRes1 = await fetch(`${BASE_URL}/api/app/quick-action`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": adminAuth.cookieHeader
    },
    body: JSON.stringify({
      action: "GENERATE_FEE_RECEIPT",
      payload: {
        studentName: sampleStudent.fullNameBn,
        rollNumber: sampleStudent.studentIdNumber,
        amount: 500,
        feeType: "MONTHLY",
        paymentMethod: "BKASH",
        trxId: uniqueTrx
      }
    })
  });
  const spotData1 = await spotRes1.json();
  assert(spotRes1.status === 200 && spotData1.success, "First spot collection accepted (HTTP 200)");

  // Second spot collection with identical TrxID (Replay / Duplicate Attack)
  const spotRes2 = await fetch(`${BASE_URL}/api/app/quick-action`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": adminAuth.cookieHeader
    },
    body: JSON.stringify({
      action: "GENERATE_FEE_RECEIPT",
      payload: {
        studentName: sampleStudent.fullNameBn,
        rollNumber: sampleStudent.studentIdNumber,
        amount: 500,
        feeType: "MONTHLY",
        paymentMethod: "BKASH",
        trxId: uniqueTrx
      }
    })
  });
  assert(spotRes2.status === 409, "Duplicate transaction ID rejected with HTTP 409 Conflict", `Got ${spotRes2.status}`);

  // Clean up the first spot collection record
  if (spotData1.receipt && spotData1.receipt.receiptNumber) {
    await prisma.paymentReceipt.deleteMany({
      where: { receiptNumber: spotData1.receipt.receiptNumber }
    });
    await prisma.feeInvoice.deleteMany({
      where: { invoiceNumber: spotData1.receipt.invoiceNumber }
    });
    console.log("  [CLEANUP] Ephemeral test spot collection removed cleanly.");
  }

  // 6. PAYMENT INTENT STATUS VERIFICATION (GUARDIAN / PUBLIC)
  console.log("\n>>> TEST 6: GUARDIAN ONLINE PAYMENT INTENT VERIFICATION");
  const guardianPayRes = await fetch(`${BASE_URL}/api/app/quick-action`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": guardianAuth.cookieHeader
    },
    body: JSON.stringify({
      action: "GENERATE_FEE_RECEIPT",
      payload: {
        studentName: sampleStudent.fullNameBn,
        rollNumber: sampleStudent.studentIdNumber,
        amount: 800,
        feeType: "MONTHLY",
        paymentMethod: "BKASH",
        trxId: `G-TRX-${Date.now().toString().slice(-6)}`
      }
    })
  });
  const guardianPayData = await guardianPayRes.json();
  assert(
    guardianPayRes.status === 200 &&
    guardianPayData.receipt &&
    guardianPayData.receipt.status === "PENDING_VERIFICATION",
    "Guardian online payment assigned status PENDING_VERIFICATION (no instant verified receipt)"
  );

  // Clean up guardian test intent
  if (guardianPayData.receipt && guardianPayData.receipt.receiptNumber) {
    await prisma.paymentIntent.deleteMany({
      where: { intentNumber: guardianPayData.receipt.receiptNumber }
    });
    console.log("  [CLEANUP] Ephemeral guardian payment intent cleaned up.");
  }

  // 7. PERSONA-SWITCH SECURITY LOCKDOWN
  console.log("\n>>> TEST 7: PASSWORDLESS PERSONA-SWITCH LOCKDOWN");
  const switchUnauth = await fetch(`${BASE_URL}/api/app/quick-persona-switch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetPersona: "ADMIN" })
  });
  assert(switchUnauth.status === 403, "Unauthenticated persona switch strictly rejected with 403 PERSONA_SWITCH_FORBIDDEN");

  const switchData = await switchUnauth.json().catch(() => ({}));
  assert(switchData.code === "PERSONA_SWITCH_FORBIDDEN", "Server returned explicit security error code PERSONA_SWITCH_FORBIDDEN");

  // 8. FINAL SUMMARY
  console.log("\n================================================================================");
  console.log(`PHASE 15 SECURITY SUITE COMPLETED: ${testPassCount} PASSED, ${testFailCount} FAILED`);
  console.log("================================================================================");

  if (testFailCount > 0) {
    throw new Error(`Security test failures detected: ${testFailCount}`);
  }
}

runSecurityReliabilitySuite()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
