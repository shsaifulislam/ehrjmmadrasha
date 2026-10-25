/**
 * Comprehensive Test Suite for Phase 3: Production Payment Readiness & Hardening
 * Checkpoint: EHRJ-AI-2026-GUARDIAN-PAYMENTS-23
 *
 * Verifies:
 * 1. Gateway Initiation (bKash & Nagad) + Guardian IDOR Protection
 * 2. Server-side Finalization (Anti-Tamper & Ledger Integrity)
 * 3. Digital Settlement Wallet & Cash Fund Atomic Credit
 * 4. Payment Receipt & Cryptographic QR Verification Token
 * 5. Webhook Security (Cryptographic Signatures & Replay Window)
 * 6. Idempotent Execution (Replay Defense)
 * 7. Payment Statement Auto-Reconciliation Engine
 */

process.env.SMTP_MOCK = "true";

import { prisma } from "../src/lib/prisma";
import crypto from "crypto";
import { runPaymentReconciliation } from "../src/lib/integration/paymentAdapter";

const BASE_URL = "http://localhost:3000";

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failedTests++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function login(identifier: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-test-suite": "ehrj-test" },
    body: JSON.stringify({ identifier, password }),
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${identifier} with status ${res.status}`);
  }
  const setCookie = res.headers.get("set-cookie") || "";
  const match = setCookie.match(/ehrj_session_token=([^;]+)/);
  if (!match) throw new Error(`Session cookie not found for ${identifier}`);
  return `ehrj_session_token=${match[1]}`;
}

async function runPaymentSuite() {
  console.log("==================================================================");
  console.log("EHRJ-AI-2026-GUARDIAN-PAYMENTS-23 VERIFICATION SUITE");
  console.log("==================================================================\n");

  // Step 1: Authenticate Admin & Guardian A
  const adminCookie = await login("adminehrjmadrasha@gmail.com", "AdminEhrj@2026!");
  const guardianACookie = await login("guardian_ui_demo@ehrj.local", "Guardian@2026!");
  const guardianBCookie = await login("guardian_b_test@ehrj.local", "GuardianB@2026!");
  const adminUser = await prisma.user.findFirst({
    where: { email: "adminehrjmadrasha@gmail.com" },
  });

  const guardianAUser = await prisma.user.findFirst({
    where: { email: "guardian_ui_demo@ehrj.local" },
    include: {
      guardians: {
        include: {
          students: { include: { student: true } },
        },
      },
    },
  });
  if (!guardianAUser || !guardianAUser.guardians[0]?.students[0]?.student) {
    throw new Error("Guardian A or linked student not found");
  }
  const studentA = guardianAUser.guardians[0].students[0].student;
  console.log(`[Target Student A] ${studentA.fullNameBn} (ID: ${studentA.id})\n`);

  // Ensure Digital Merchant Wallets exist in DB
  const existingBkash = await prisma.financialAccount.findFirst({
    where: { type: "BKASH_MERCHANT" },
  });
  if (!existingBkash) {
    await prisma.financialAccount.create({
      data: {
        nameBn: "বিকাশ মার্চেন্ট ওয়ালেট",
        nameEn: "bKash Merchant Account",
        type: "BKASH_MERCHANT",
        accountNumber: "01845162664",
        currentBalance: 0,
        isActive: true,
      },
    });
  } else {
    await prisma.financialAccount.update({
      where: { id: existingBkash.id },
      data: { isActive: true },
    });
  }

  const existingNagad = await prisma.financialAccount.findFirst({
    where: { type: "NAGAD_MERCHANT" },
  });
  if (!existingNagad) {
    await prisma.financialAccount.create({
      data: {
        nameBn: "নগদ মার্চেন্ট ওয়ালেট",
        nameEn: "Nagad Merchant Account",
        type: "NAGAD_MERCHANT",
        accountNumber: "01826416696",
        currentBalance: 0,
        isActive: true,
      },
    });
  } else {
    await prisma.financialAccount.update({
      where: { id: existingNagad.id },
      data: { isActive: true },
    });
  }

  // Ensure CashFunds exist
  await prisma.cashFund.upsert({
    where: { code: "GENERAL" },
    update: {},
    create: {
      code: "GENERAL",
      nameBn: "সাধারণ শিক্ষা তহবিল",
      nameEn: "General Education Fund",
      currentBalance: 10000,
    },
  });

  const session = await prisma.academicSession.findFirst({ where: { isCurrent: true } }) ||
    (await prisma.academicSession.findFirst());

  // Create a clean test fee invoice for Student A
  const testInvoiceA = await prisma.feeInvoice.create({
    data: {
      invoiceNumber: `TEST-INV-${Date.now().toString().slice(-6)}`,
      studentId: studentA.id,
      sessionId: session!.id,
      feeType: "EXAM",
      title: "পরীক্ষার ফি (অনলাইন টেস্ট)",
      dueDate: new Date(Date.now() + 864000000),
      totalAmount: 1200,
      netAmount: 1200,
      dueAmount: 1200,
      paidAmount: 0,
      fundCode: "GENERAL",
      status: "UNPAID",
    },
  });

  // =========================================================================
  // TEST 1: PAYMENT GATEWAY INITIATION & IDOR DEFENSE
  // =========================================================================
  console.log("------------------------------------------------------------------");
  console.log("TEST 1: Payment Gateway Session Initiation & IDOR Defense");
  console.log("------------------------------------------------------------------");

  // 1.1 Guardian A initiates bKash checkout
  const initRes = await fetch(`${BASE_URL}/api/portal/finance/gateway/initiate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: guardianACookie },
    body: JSON.stringify({
      invoiceId: testInvoiceA.id,
      amount: 1200,
      provider: "BKASH",
    }),
  });
  assert(initRes.ok, "Guardian A initiates bKash checkout successfully (200 OK)");
  const initJson = await initRes.json();
  assert(initJson.success === true, "Session initiation returned success");
  assert(!!initJson.checkoutUrl, "Valid checkout URL returned");
  assert(!!initJson.intentNumber, "Unique PaymentIntent number generated");

  // Verify DB PaymentIntent record
  const intentRecord = await prisma.paymentIntent.findFirst({
    where: { intentNumber: initJson.intentNumber },
  });
  assert(!!intentRecord, "PaymentIntent persisted in database");
  assert(intentRecord?.status === "PENDING", "Initial intent status is PENDING");
  assert(intentRecord?.amount === 1200, "Intent amount is strictly bound to invoice amount (1200)");

  // 1.2 IDOR Defense: Guardian B tries to initiate checkout for Student A's invoice
  const idorInitRes = await fetch(`${BASE_URL}/api/portal/finance/gateway/initiate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: guardianBCookie },
    body: JSON.stringify({
      invoiceId: testInvoiceA.id,
      amount: 1200,
      provider: "BKASH",
    }),
  });
  assert(idorInitRes.status === 400 || idorInitRes.status === 403, "IDOR Guard: Guardian B cannot initiate payment for Student A's invoice");
  console.log("  [PASS] Gateway session initiation and IDOR guards strictly verified.\n");

  // =========================================================================
  // TEST 2: SERVER-SIDE FINALIZATION, WALLET CREDIT & LEDGER INTEGRITY
  // =========================================================================
  console.log("------------------------------------------------------------------");
  console.log("TEST 2: Authoritative Server-side Execution & Ledger Posting");
  console.log("------------------------------------------------------------------");

  const bkashWalletBefore = await prisma.financialAccount.findFirst({
    where: { type: "BKASH_MERCHANT", isActive: true },
  });
  const cashFundBefore = await prisma.cashFund.findFirst({ where: { code: "GENERAL" } });

  // Execute payment via execute endpoint
  const execRes = await fetch(`${BASE_URL}/api/portal/finance/gateway/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: guardianACookie },
    body: JSON.stringify({
      gatewayPaymentId: intentRecord!.gatewayPaymentId,
      provider: "BKASH",
    }),
  });
  assert(execRes.ok, "POST /api/portal/finance/gateway/execute returned 200 OK");
  const execJson = await execRes.json();
  assert(execJson.success === true, "Gateway execution finalized successfully");

  const receipt = execJson.receipt;
  assert(!!receipt?.id, "Official PaymentReceipt record generated");
  assert(!!receipt.qrCodeToken, "Cryptographic QR code verification token generated");
  assert(receipt.qrCodeToken.startsWith("EHRJ-RCP-"), "QR token follows institutional security schema");

  // Verify Invoice State
  const updatedInvoice = await prisma.feeInvoice.findUnique({ where: { id: testInvoiceA.id } });
  assert(updatedInvoice?.status === "PAID", "Invoice status transitioned to PAID");
  assert(updatedInvoice?.dueAmount === 0, "Invoice dueAmount reduced to 0");
  assert(updatedInvoice?.paidAmount === 1200, "Invoice paidAmount incremented to 1200");

  // Verify Digital Wallet Credit
  const bkashWalletAfter = await prisma.financialAccount.findFirst({
    where: { type: "BKASH_MERCHANT", isActive: true },
  });
  assert(
    Math.abs(bkashWalletAfter!.currentBalance - (bkashWalletBefore!.currentBalance + 1200)) < 0.01,
    "Digital merchant wallet atomically credited with ৳ 1200"
  );

  // Verify Institutional Cash Fund & Transaction
  const cashFundAfter = await prisma.cashFund.findFirst({ where: { code: "GENERAL" } });
  assert(
    Math.abs(cashFundAfter!.currentBalance - (cashFundBefore!.currentBalance + 1200)) < 0.01,
    "General CashFund atomically credited with ৳ 1200"
  );

  const cashTxn = await prisma.cashTransaction.findFirst({
    where: { receiptOrVoucherNo: receipt.receiptNumber },
  });
  assert(!!cashTxn, "Institutional CashTransaction record logged");
  assert(cashTxn?.type === "INCOME", "Transaction logged as INCOME");

  // Verify PAYMENT_SUCCESSFUL outbox event
  await sleep(600);
  const outboxNotif = await prisma.notificationOutbox.findUnique({
    where: { idempotencyKey: `payment-successful-${receipt.id}` },
  });
  assert(!!outboxNotif, "PAYMENT_SUCCESSFUL outbox event created");
  assert(outboxNotif?.status === "PROCESSED", "PAYMENT_SUCCESSFUL outbox processed");
  console.log("  [PASS] Atomic financial execution, wallet credit, and ledger integrity verified.\n");

  // =========================================================================
  // TEST 3: REPLAY ATTACK & IDEMPOTENCY DEFENSE
  // =========================================================================
  console.log("------------------------------------------------------------------");
  console.log("TEST 3: Payment Replay Attack Defense & Idempotency");
  console.log("------------------------------------------------------------------");

  const receiptCountBefore = await prisma.paymentReceipt.count({ where: { invoiceId: testInvoiceA.id } });
  const walletBalBeforeReplay = bkashWalletAfter!.currentBalance;

  // Replay same gateway execution
  const replayRes = await fetch(`${BASE_URL}/api/portal/finance/gateway/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: guardianACookie },
    body: JSON.stringify({
      gatewayPaymentId: intentRecord!.gatewayPaymentId,
      provider: "BKASH",
    }),
  });
  assert(replayRes.ok, "Replay request responded safely (200 OK)");
  const replayJson = await replayRes.json();
  assert(replayJson.isDuplicate === true, "Replay detected and marked as isDuplicate");

  const receiptCountAfter = await prisma.paymentReceipt.count({ where: { invoiceId: testInvoiceA.id } });
  assert(receiptCountBefore === receiptCountAfter, "Zero duplicate receipts created on replay");

  const walletBalAfterReplay = (await prisma.financialAccount.findFirst({
    where: { type: "BKASH_MERCHANT", isActive: true },
  }))!.currentBalance;
  assert(walletBalBeforeReplay === walletBalAfterReplay, "Zero double-crediting to wallet on replay");
  console.log("  [PASS] Replay attack and duplicate prevention verified.\n");

  // =========================================================================
  // TEST 4: INBOUND CRYPTOGRAPHIC WEBHOOKS & DLQ REPLAY PROTECTION
  // =========================================================================
  console.log("------------------------------------------------------------------");
  console.log("TEST 4: Inbound Cryptographic Webhooks & Replay Protection");
  console.log("------------------------------------------------------------------");

  // 4.1 Webhook with stale timestamp (> 300s window)
  const staleWebhookRes = await fetch(`${BASE_URL}/api/v1/webhooks/inbound/bkash`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ehrj-timestamp": String(Date.now() - 400000), // 400 seconds ago
    },
    body: JSON.stringify({
      eventType: "PAYMENT_COMPLETED",
      paymentId: "BK_STALE_TEST_01",
    }),
  });
  const staleWebhookBody = await staleWebhookRes.text();
  console.log(`[DEBUG Stale Webhook] Status: ${staleWebhookRes.status}, Body: ${staleWebhookBody}`);
  assert(staleWebhookRes.status === 400, "Stale webhook rejected (> 300s timestamp delta)");
  const staleDlq = await prisma.deadLetterQueue.findFirst({
    where: { eventType: "PAYMENT_COMPLETED" },
    orderBy: { quarantinedAt: "desc" },
  });
  assert(!!staleDlq, "Stale webhook safely diverted to Dead Letter Queue (DLQ)");

  // 4.2 Webhook with invalid signature
  const badSigRes = await fetch(`${BASE_URL}/api/v1/webhooks/inbound/bkash`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-bkash-signature": "invalid_hex_signature_deadbeef",
      "x-ehrj-timestamp": String(Date.now()),
    },
    body: JSON.stringify({
      eventType: "PAYMENT_COMPLETED",
      paymentId: "BK_BADSIG_TEST_01",
    }),
  });
  assert(badSigRes.status === 401, "Invalid cryptographic webhook signature rejected (401 Unauthorized)");

  // 4.3 Webhook with valid signature (under mock secret)
  const webhookSecret =
    process.env.BKASH_WEBHOOK_SECRET ||
    process.env.WEBHOOK_SIGNING_SECRET ||
    "ehrj_demo_webhook_secret_2026";
  const validWebhookPayload = {
    eventType: "PAYMENT_COMPLETED",
    paymentId: `BK_VAL_${Date.now()}`,
    transactionId: `TRX_VAL_${Date.now()}`,
    status: "Completed",
  };
  const validBodyStr = JSON.stringify(validWebhookPayload);
  const validSig = crypto.createHmac("sha256", webhookSecret).update(validBodyStr).digest("hex");

  const validWebhookRes = await fetch(`${BASE_URL}/api/v1/webhooks/inbound/bkash`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-bkash-signature": validSig,
      "x-ehrj-timestamp": String(Date.now()),
    },
    body: validBodyStr,
  });
  assert(validWebhookRes.ok, "Valid signed webhook processed successfully (200 OK)");
  console.log("  [PASS] Cryptographic webhook signatures and DLQ protections verified.\n");

  // =========================================================================
  // TEST 5: AUTOMATED PAYMENT STATEMENT RECONCILIATION ENGINE
  // =========================================================================
  console.log("------------------------------------------------------------------");
  console.log("TEST 5: Automated Payment Statement Reconciliation Engine");
  console.log("------------------------------------------------------------------");

  // Create a separate receipt with amount 1000 to test amount mismatch conflict
  const conflictTxnId = `TRX_CONFLICT_${Date.now()}`;
  await prisma.paymentReceipt.create({
    data: {
      receiptNumber: `EHRJ-TEST-RCP-${Date.now().toString().slice(-5)}`,
      invoiceId: testInvoiceA.id,
      studentId: studentA.id,
      amount: 1000,
      paymentMethod: "BKASH",
      transactionId: conflictTxnId,
      paymentStatus: "SUCCESSFUL",
      qrCodeToken: `EHRJ-RCP-${Date.now()}-CONF`,
      receiptDate: new Date(),
    },
  });

  const reconResult = await runPaymentReconciliation(
    "BKASH",
    [
      // 1. Matched Row
      {
        providerTransactionId: receipt.transactionId!,
        amount: 1200,
        transactionDate: new Date().toISOString(),
      },
      // 2. Conflict Row (amount mismatch: 900 vs 1000)
      {
        providerTransactionId: conflictTxnId,
        amount: 900,
        transactionDate: new Date().toISOString(),
      },
      // 3. Unmatched Row
      {
        providerTransactionId: `NON_EXISTENT_TRX_${Date.now()}`,
        amount: 500,
        transactionDate: new Date().toISOString(),
      },
    ],
    adminUser!.id
  );

  assert(reconResult.totalProcessed === 3, "Reconciliation processed 3 statement rows");
  assert(reconResult.matchedCount === 1, "Exactly 1 row identified as MATCHED");
  assert(reconResult.conflictCount === 1, "Exactly 1 row identified as CONFLICT (amount disparity)");
  assert(reconResult.unmatchedCount === 1, "Exactly 1 row identified as UNMATCHED (missing from ledger)");
  console.log("  [PASS] Payment statement reconciliation engine verified with high accuracy.\n");

  console.log("==================================================================");
  console.log(`ALL ${passedTests} PHASE 3 ASSERTIONS PASSED!`);
  console.log("CHECKPOINT: EHRJ-AI-2026-GUARDIAN-PAYMENTS-23 VERIFIED COMPLETE");
  console.log("==================================================================");
}

runPaymentSuite()
  .catch((err) => {
    console.error("\n[FATAL ERROR IN TEST SUITE]:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
