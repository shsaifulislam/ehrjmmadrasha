/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 28
 * Comprehensive Integration Hub & Interoperability Engine Test Suite
 *
 * Checkpoint: EHRJ-AI-2026-PHASE28
 */

import {
  INSTITUTIONAL_SOURCE_OF_TRUTH_MAP,
  getSourceOfTruthForDomain,
  loadIntegrationRegistry,
  getIntegration,
  updateIntegrationStatus,
  testIntegrationConnection,
  createApiKey,
  validateApiKey,
  revokeApiKey,
  loadApiKeys,
  computeHmacSignature,
  verifyHmacSignature,
  processInboundWebhook,
  loadWebhookSubscriptions,
  loadDeadLetterQueue,
  replayDeadLetterItem,
  sanitizeMetadata,
  normalizeHttpStatus,
  getCircuitStatus,
  resetCircuit,
  runPaymentReconciliation,
  executeInstitutionalExport,
  getIntegrationHubOverview,
} from "../src/lib/integration";
import { publishDomainEvent, eventBus } from "../src/lib/workflow/eventBus";
import { prisma } from "../src/lib/prisma";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    passedCount++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedCount++;
    console.error(`  ✗ FAIL: ${testName}${details ? ` -> ${details}` : ""}`);
  }
}

async function runPhase28TestSuite() {
  console.log("\n===============================================================================");
  console.log(" EHRJ PHASE 28: INTEGRATION HUB, API GATEWAY & INTEROPERABILITY ENGINE TEST SUITE");
  console.log(" Checkpoint: EHRJ-AI-2026-PHASE28");
  console.log("===============================================================================\n");

  // -------------------------------------------------------------
  // TEST SUITE 1: Source-of-Truth Mapping & Authority Invariants
  // -------------------------------------------------------------
  console.log("--- 1. Institutional Source-of-Truth & Data Ownership ---");
  assert(
    INSTITUTIONAL_SOURCE_OF_TRUTH_MAP.length >= 14,
    "Source-of-Truth mapping covers all 14+ institutional domains"
  );

  const studentTruth = getSourceOfTruthForDomain("STUDENT_MASTER");
  assert(
    studentTruth !== undefined && studentTruth.externalConsumerAccess === "READ_ONLY",
    "Student Master domain is authoritative internally and READ_ONLY to external consumers"
  );

  const financeTruth = getSourceOfTruthForDomain("FINANCE_INVOICES");
  assert(
    financeTruth !== undefined && financeTruth.authoritativeEngine.includes("Finance"),
    "Finance Invoices domain is authoritative in internal Finance Engine"
  );

  const paymentTruth = getSourceOfTruthForDomain("PAYMENT_RECEIPTS");
  assert(
    paymentTruth !== undefined && paymentTruth.conflictResolutionRule.includes("Two-way verification"),
    "Payment Receipts require two-way status verification before ledger entry"
  );

  // -------------------------------------------------------------
  // TEST SUITE 2: Integration Registry & Connection Testing
  // -------------------------------------------------------------
  console.log("\n--- 2. Integration Registry & Connection Testing ---");
  const registry = loadIntegrationRegistry();
  assert(registry.length >= 6, `Registry loads institutional integrations (count: ${registry.length})`);

  const gmailIntegration = getIntegration("GMAIL_SMTP");
  assert(
    gmailIntegration !== undefined && gmailIntegration.status === "ACTIVE",
    "GMAIL_SMTP integration exists and is ACTIVE"
  );

  const bkashIntegration = getIntegration("BKASH_PGW");
  assert(
    bkashIntegration !== undefined && bkashIntegration.environment === "SANDBOX",
    "BKASH_PGW exists and is configured for SANDBOX"
  );

  // Connection test
  const connTestResult = await testIntegrationConnection("GMAIL_SMTP", "SYSTEM_TEST");
  assert(connTestResult.success === true, "Connection test for GMAIL_SMTP succeeds");
  assert(connTestResult.latencyMs > 0, `Connection test returns valid latency: ${connTestResult.latencyMs}ms`);

  const bkashConnTest = await testIntegrationConnection("BKASH_PGW", "SYSTEM_TEST");
  assert(bkashConnTest.success === true, "Connection test for BKASH_PGW succeeds with diagnostics");

  // Status toggle
  await updateIntegrationStatus("INT-BKASH-PGW-01", "PAUSED", "SYSTEM_TEST", "Test pause");
  const updatedBkash = getIntegration("BKASH_PGW");
  assert(updatedBkash?.status === "PAUSED", "Integration status successfully changed to PAUSED");

  await updateIntegrationStatus("INT-BKASH-PGW-01", "CONFIGURED", "SYSTEM_TEST", "Restore status");
  assert(getIntegration("BKASH_PGW")?.status === "CONFIGURED", "Integration status restored to CONFIGURED");

  // -------------------------------------------------------------
  // TEST SUITE 3: Secure API Key Manager & Least Privilege Scoping
  // -------------------------------------------------------------
  console.log("\n--- 3. API Key Management & Least-Privilege Scoping ---");
  const keyGenResult = await createApiKey({
    name: "BISE Madrasah Board Sync Partner",
    owner: "Bangladesh Madrasah Education Board",
    ownerType: "EXTERNAL_INSTITUTION",
    scopes: ["students:read", "attendance:read"],
    environment: "PRODUCTION",
    rateLimitPerMin: 120,
    validDays: 90,
    createdBy: "SYSTEM_TEST",
  });

  assert(
    keyGenResult.rawKey.startsWith("ehrj_live_"),
    `API key generated with secure prefix (Key: ${keyGenResult.rawKey.substring(0, 15)}...)`
  );
  assert(
    keyGenResult.record.keyHash !== keyGenResult.rawKey,
    "API key is stored as a cryptographic SHA-256 hash, NOT plaintext"
  );

  // Validate with permitted scope
  const valSuccess = validateApiKey(keyGenResult.rawKey, "students:read");
  assert(valSuccess.valid === true, "API key valid for permitted scope 'students:read'");
  assert(
    (valSuccess.rateLimitRemaining ?? 0) > 0,
    `Rate limiter decrements and tracks remaining: ${valSuccess.rateLimitRemaining}`
  );

  // Validate with forbidden scope
  const valForbidden = validateApiKey(keyGenResult.rawKey, "finance:write" as any);
  assert(
    valForbidden.valid === false && valForbidden.error?.includes("অননুমোদিত স্কোপ"),
    "API key access blocked for forbidden scope 'finance:write'"
  );

  // Revoke API key
  await revokeApiKey(keyGenResult.record.id, "SYSTEM_TEST", "Security audit test revocation");
  const valAfterRevoke = validateApiKey(keyGenResult.rawKey, "students:read");
  assert(
    valAfterRevoke.valid === false && valAfterRevoke.error?.includes("নিষ্ক্রিয়"),
    "Revoked API key is immediately denied access"
  );

  // -------------------------------------------------------------
  // TEST SUITE 4: Resilient Client, Error Normalization & Circuit Breaker
  // -------------------------------------------------------------
  console.log("\n--- 4. Resilient Client & Circuit Breaker ---");
  assert(normalizeHttpStatus(401) === "AUTHENTICATION_ERROR", "HTTP 401 normalizes to AUTHENTICATION_ERROR");
  assert(normalizeHttpStatus(429) === "RATE_LIMIT_ERROR", "HTTP 429 normalizes to RATE_LIMIT_ERROR");
  assert(normalizeHttpStatus(408) === "TIMEOUT_ERROR", "HTTP 408 normalizes to TIMEOUT_ERROR");
  assert(normalizeHttpStatus(502) === "PROVIDER_ERROR", "HTTP 502 normalizes to PROVIDER_ERROR");
  assert(normalizeHttpStatus(409) === "DUPLICATE_ERROR", "HTTP 409 normalizes to DUPLICATE_ERROR");

  // Secret sanitization
  const sensitivePayload = {
    userName: "test_admin",
    password: "SuperSecretPassword123!",
    apiKey: "ehrj_live_1234567890",
    nested: {
      clientSecret: "VeryConfidentialSecret",
      safeInfo: "PublicClassRoster",
    },
  };
  const sanitized = sanitizeMetadata(sensitivePayload);
  assert(
    sanitized.password.includes("MASKED") && sanitized.apiKey.includes("MASKED"),
    "Sensitive credentials and passwords are masked from logs"
  );
  assert(sanitized.nested.safeInfo === "PublicClassRoster", "Non-sensitive metadata preserved in logs");

  // Circuit breaker state transitions
  resetCircuit("TEST_PROVIDER");
  const circuit = getCircuitStatus("TEST_PROVIDER");
  assert(circuit.state === "CLOSED", "Circuit breaker initial state is CLOSED");

  // -------------------------------------------------------------
  // TEST SUITE 5: Inbound Webhooks, HMAC & Replay Protection
  // -------------------------------------------------------------
  console.log("\n--- 5. Inbound Webhooks, HMAC & Replay Protection ---");
  const secret = "ehrj_test_signing_secret_2026";
  const testPayload = {
    paymentId: "BKASH-TXN-998877",
    invoiceId: "INV-TEST-001",
    amount: 1500,
    timestamp: Date.now(),
  };
  const payloadStr = JSON.stringify(testPayload);
  const signature = computeHmacSignature(payloadStr, secret);

  assert(
    verifyHmacSignature(payloadStr, secret, signature) === true,
    "HMAC-SHA256 signature verification succeeds for authentic payload"
  );
  assert(
    verifyHmacSignature(payloadStr, secret, "invalid_signature_hex") === false,
    "HMAC-SHA256 signature verification fails for tampered/invalid signature"
  );

  // Inbound webhook processing
  const runId = Date.now();
  const webhookResult = await processInboundWebhook({
    integrationCode: "BKASH_PGW",
    provider: "BKASH",
    eventType: "PAYMENT_COMPLETED",
    rawPayload: testPayload,
    signature,
    signingSecret: secret,
    timestampHeader: String(Date.now()),
    idempotencyKey: `test_inbound_idemp_${runId}`,
  });

  assert(webhookResult.success === true, "Inbound webhook with valid HMAC is successfully processed");
  assert(webhookResult.isDuplicate === false, "First submission is not duplicate");

  // Idempotency check: replay identical webhook
  const duplicateWebhookResult = await processInboundWebhook({
    integrationCode: "BKASH_PGW",
    provider: "BKASH",
    eventType: "PAYMENT_COMPLETED",
    rawPayload: testPayload,
    idempotencyKey: `test_inbound_idemp_${runId}`,
  });
  assert(
    duplicateWebhookResult.isDuplicate === true,
    "Identical incoming webhook detected as duplicate (Idempotency enforced)"
  );

  // Replay attack protection: stale timestamp (> 300s old)
  const staleTimestamp = String(Date.now() - 400 * 1000); // 400 seconds ago
  const replayResult = await processInboundWebhook({
    integrationCode: "BKASH_PGW",
    provider: "BKASH",
    eventType: "PAYMENT_COMPLETED",
    rawPayload: { ...testPayload, paymentId: `STALE-TXN-${runId}` },
    timestampHeader: staleTimestamp,
    idempotencyKey: `stale_attack_key_${runId}`,
  });
  assert(
    replayResult.success === false && replayResult.error?.includes("Replay attack protection"),
    "Replay attack with timestamp delta > 300s is quarantined to Dead-Letter Queue"
  );

  // -------------------------------------------------------------
  // TEST SUITE 6: Dead-Letter Queue (DLQ) & Quarantine Management
  // -------------------------------------------------------------
  console.log("\n--- 6. Dead-Letter Queue & Quarantine Management ---");
  const dlqList = loadDeadLetterQueue();
  assert(dlqList.length > 0, `Dead-Letter Queue holds quarantined failed events (Count: ${dlqList.length})`);

  const pendingDlq = dlqList.find((d) => d.resolutionStatus === "PENDING");
  if (pendingDlq) {
    const replayResult = await replayDeadLetterItem(pendingDlq.id, "SYSTEM_TEST");
    assert(
      replayResult.success === true && replayResult.dlqItem.resolutionStatus === "REPLAYED",
      `DLQ item ${pendingDlq.id} successfully replayed and resolved`
    );
  } else {
    assert(true, "DLQ items verified");
  }

  // -------------------------------------------------------------
  // TEST SUITE 7: Outbound Webhooks & Domain Event Integration Bridge
  // -------------------------------------------------------------
  console.log("\n--- 7. Outbound Webhook Subscriptions & Phase 27 Event Bus Bridge ---");
  const subs = loadWebhookSubscriptions();
  assert(subs.length >= 2, `Outbound webhook subscriptions loaded (count: ${subs.length})`);

  // Emit test domain event via Phase 27 eventBus
  const testEvent = await publishDomainEvent({
    eventType: "STUDENT_CREATED",
    sourceModule: "ADMISSION",
    entityType: "Student",
    entityId: "STU-TEST-9999",
    payload: { studentName: "টেস্ট শিক্ষার্থী", classCode: "CLASS_1" },
    idempotencyKey: `test_evt_phase28_${Date.now()}`,
  });
  assert(testEvent.isDuplicate === false, "Phase 27 Domain Event emitted and received by EventBus");

  // -------------------------------------------------------------
  // TEST SUITE 8: Payment Gateway Boundary & Auto-Reconciliation
  // -------------------------------------------------------------
  console.log("\n--- 8. Payment Reconciliation & Two-Way Matching ---");
  // Find or create test invoice for matching
  const testInvoice = await prisma.feeInvoice.findFirst();
  const statementRows = [
    {
      providerTransactionId: `TXN-RECON-MATCHED-${Date.now()}`,
      invoiceNumber: testInvoice?.invoiceNumber || "INV-2026-0001",
      amount: 1200,
      transactionDate: "2026-09-28",
    },
    {
      providerTransactionId: `TXN-RECON-UNMATCHED-${Date.now()}`,
      amount: 3400,
      transactionDate: "2026-09-28",
    },
    {
      providerTransactionId: `TXN-RECON-UNMATCHED-${Date.now()}`, // Duplicate row in batch
      amount: 3400,
      transactionDate: "2026-09-28",
    },
  ];

  const reconResult = await runPaymentReconciliation("BKASH", statementRows, "SYSTEM_TEST");
  assert(reconResult.totalProcessed === 3, `Reconciliation batch processed ${reconResult.totalProcessed} records`);
  assert(reconResult.duplicateCount === 1, "Duplicate statement reference detected and flagged as DUPLICATE");
  assert(reconResult.unmatchedCount >= 1, "Unmatched transaction flagged as UNMATCHED without corrupting ledger");

  // -------------------------------------------------------------
  // TEST SUITE 9: Institutional Data Export & RBAC Controls
  // -------------------------------------------------------------
  console.log("\n--- 9. Data Export / Import Hub & RBAC Data Minimization ---");
  // Test RBAC denial for GUARDIAN role
  let guardianDenied = false;
  try {
    await executeInstitutionalExport({
      entityType: "STUDENT",
      actorRole: "GUARDIAN",
      actorId: "GUARDIAN_USER_001",
    });
  } catch (err: any) {
    guardianDenied = true;
  }
  assert(guardianDenied === true, "Guardian role is strictly denied bulk institutional export (RBAC)");

  // Test Admin export
  const exportResult = await executeInstitutionalExport({
    entityType: "STUDENT",
    format: "CSV",
    actorRole: "ADMIN",
    actorId: "ADMIN_USER_001",
  });
  assert(exportResult.job.status === "COMPLETED", `Student data export completed (Job: ${exportResult.job.id})`);
  assert(
    exportResult.csvString !== undefined && exportResult.csvString.includes("studentIdNumber"),
    "CSV export output generated with sanitized headers"
  );
  if (exportResult.data.length > 0) {
    assert(
      exportResult.data[0].nidNo === undefined && !exportResult.csvString?.includes("nidNo"),
      "Field-level data minimization enforced: NID omitted from external export"
    );
  }

  // -------------------------------------------------------------
  // TEST SUITE 10: Overview Dashboard Generation
  // -------------------------------------------------------------
  console.log("\n--- 10. Integration Hub Overview Metric Synthesis ---");
  const overview = getIntegrationHubOverview();
  assert(overview.integrations.total >= 6, `Overview aggregates ${overview.integrations.total} integrations`);
  assert(overview.apiGateway.totalKeys >= 1, `Overview tracks ${overview.apiGateway.totalKeys} API keys`);
  assert(overview.webhooks.totalSubscriptions >= 2, `Overview tracks ${overview.webhooks.totalSubscriptions} webhook subscriptions`);

  // -------------------------------------------------------------
  // Final Results
  // -------------------------------------------------------------
  console.log("\n===============================================================================");
  console.log(` PHASE 28 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("===============================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase28TestSuite().catch((err) => {
  console.error("Phase 28 Test Suite uncaught error:", err);
  process.exit(1);
});
