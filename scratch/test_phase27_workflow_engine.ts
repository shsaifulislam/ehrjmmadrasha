/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 27
 * Automated Verification & Regression Suite for Master Workflow Automation,
 * Rules Engine & Event-Driven Process Orchestration
 *
 * Checkpoint ID: EHRJ-AI-2026-PHASE27
 */

import {
  publishDomainEvent,
  loadDomainEvents,
  eventBus,
  DomainEvent,
} from "../src/lib/workflow/eventBus";
import {
  enqueueAutomationJob,
  executeJob,
  loadAutomationJobs,
  replayDeadLetterJob,
  cancelJob,
  getJobQueueMetrics,
  jobQueue,
} from "../src/lib/workflow/jobQueue";
import {
  evaluateCondition,
  evaluateRule,
  runRuleSimulation,
  detectRuleConflicts,
  loadBusinessRules,
  BusinessRule,
} from "../src/lib/workflow/rulesEngine";
import {
  createApprovalRequest,
  resolveApprovalRequest,
  loadApprovalRequests,
  sweepExpiredApprovals,
  getApprovalMetrics,
} from "../src/lib/workflow/approvalEngine";
import {
  handleEventThroughWorkflow,
  loadWorkflowInstances,
  resumeWorkflowAfterApproval,
  generateAiDraftRule,
  getWorkflowMetrics,
} from "../src/lib/workflow/workflowEngine";
import { prisma } from "../src/lib/prisma";
import { createSessionToken } from "../src/lib/auth";

let totalAssertions = 0;
let passedAssertions = 0;

function assert(condition: boolean, message: string) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✓ [PASS] ${message}`);
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runPhase27Tests() {
  console.log("\n=======================================================");
  console.log("   EHRJ PHASE 27: WORKFLOW AUTOMATION VERIFICATION SUITE");
  console.log("   Checkpoint: EHRJ-AI-2026-PHASE27");
  console.log("=======================================================\n");

  // -----------------------------------------------------------
  // SECTION 1: DOMAIN EVENT BUS & OUTBOX PATTERN
  // -----------------------------------------------------------
  console.log("--- 1. Testing Domain Event Bus & Canonical Contract ---");

  let subscriberReceived = false;
  let receivedEventType = "";
  const unsubscribe = eventBus.subscribe("TEST_EVENT_PING", (evt) => {
    subscriberReceived = true;
    receivedEventType = evt.eventType;
  });

  const testTimestamp = Date.now();
  const testPayload = { message: "Hello EHRJ Event Bus", testValue: 42, timestamp: testTimestamp };
  const pubResult = await publishDomainEvent({
    eventType: "TEST_EVENT_PING",
    sourceModule: "OPERATIONS",
    entityType: "SystemTest",
    entityId: `SYS-TEST-${testTimestamp}`,
    payload: testPayload,
    actorType: "SYSTEM_AUTOMATION",
    actorId: "SYSTEM",
  });

  assert(!pubResult.isDuplicate, "First emission of domain event is not marked duplicate");
  assert(pubResult.event.eventId.startsWith("EVT-2026-"), "Event ID follows canonical format EVT-2026-XXXXXX");
  assert(pubResult.event.schemaVersion === "1.0", "Event carries schemaVersion 1.0");
  assert(pubResult.event.correlationId !== undefined, "Event carries correlationId");
  assert(pubResult.event.sourceModule === "OPERATIONS", "Event sourceModule is OPERATIONS");

  // Allow async subscriber loop a moment
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert(subscriberReceived, "Event subscriber received the dispatched domain event");
  assert(receivedEventType === "TEST_EVENT_PING", "Event subscriber received correct eventType");
  unsubscribe();

  // Test Event Idempotency
  const dupResult = await publishDomainEvent({
    eventType: "TEST_EVENT_PING",
    sourceModule: "OPERATIONS",
    entityType: "SystemTest",
    entityId: "SYS-TEST-001",
    payload: testPayload,
    idempotencyKey: pubResult.event.idempotencyKey,
  });
  assert(dupResult.isDuplicate, "Re-publishing with identical idempotencyKey is detected as duplicate");

  // Verify Append-Only Event Store
  const storedEvents = loadDomainEvents();
  const matchedEvent = storedEvents.find((e) => e.eventId === pubResult.event.eventId);
  assert(matchedEvent !== undefined, "Domain event is persisted in append-only domain_events.json store");

  // -----------------------------------------------------------
  // SECTION 2: AUTOMATION JOB QUEUE & DEAD-LETTER
  // -----------------------------------------------------------
  console.log("\n--- 2. Testing Job Queue, Exponential Backoff & Dead-Letter ---");

  // Register test job handlers
  jobQueue.registerHandler("TEST_SUCCESSFUL_JOB", async (job) => {
    return { processed: true, number: job.payload.num * 2 };
  });

  let failAttempts = 0;
  jobQueue.registerHandler("TEST_FAILING_JOB", async () => {
    failAttempts++;
    throw new Error(`Simulated transient error attempt #${failAttempts}`);
  });

  // Enqueue and run successful job
  const jobTimestamp = Date.now();
  const { job: job1, isDuplicate: isJobDup } = await enqueueAutomationJob({
    jobType: "TEST_SUCCESSFUL_JOB",
    payload: { num: 21, testRun: jobTimestamp },
    maxAttempts: 3,
  });
  assert(!isJobDup, "Job enqueued with unique ID");
  assert(job1.status === "QUEUED", "Initial job status is QUEUED");

  const executedJob1 = await executeJob(job1.jobId);
  assert(executedJob1.status === "SUCCEEDED", "Job execution transitions status to SUCCEEDED");
  assert(executedJob1.result?.number === 42, "Job handler produces expected result in payload");
  assert(executedJob1.attempts === 1, "Successful job completes in 1 attempt");

  // Test Failing Job -> RETRYING with exponential backoff -> DEAD_LETTER
  const { job: failJob } = await enqueueAutomationJob({
    jobType: "TEST_FAILING_JOB",
    payload: { data: "transient-failure", testRun: jobTimestamp },
    maxAttempts: 2, // will dead-letter on 2nd failure
  });

  // First execution: should fail and become RETRYING
  const retry1 = await executeJob(failJob.jobId);
  assert(retry1.status === "RETRYING", "Job on attempt 1 transitions to RETRYING");
  assert(retry1.attempts === 1, "Job attempts incremented to 1");
  assert(retry1.nextRetryAt !== undefined, "nextRetryAt timestamp calculated using exponential backoff");

  // Second execution: exceeds maxAttempts (2), should transition to DEAD_LETTER
  const retry2 = await executeJob(failJob.jobId);
  assert(retry2.status === "DEAD_LETTER", "Job exceeding maxAttempts transitions to DEAD_LETTER");
  assert(retry2.attempts === 2, "Job attempts recorded as 2");
  assert(retry2.error?.includes("Max attempts"), "Dead-letter job includes descriptive error diagnostic");

  // Test Manual Replay of Dead-Letter Job
  // Update handler to succeed on replay
  jobQueue.registerHandler("TEST_FAILING_JOB", async () => {
    return { replayed: true, resolved: true };
  });
  const replayed = await replayDeadLetterJob(failJob.jobId);
  assert(replayed.status === "SUCCEEDED", "Manual replay of DEAD_LETTER job succeeds after root-cause fix");
  assert(replayed.result?.resolved === true, "Replayed job payload contains successful result");

  // Test Job Cancellation
  const { job: cancelTarget } = await enqueueAutomationJob({
    jobType: "TEST_CANCEL_JOB",
    payload: { action: "cancel-me", testRun: jobTimestamp },
  });
  const cancelled = cancelJob(cancelTarget.jobId, "Admin testing cancellation");
  assert(cancelled.status === "CANCELLED", "cancelJob transitions status to CANCELLED");

  const queueMetrics = getJobQueueMetrics();
  assert(queueMetrics.totalJobs > 0, "Job queue metrics reflect total jobs tracked");
  assert(queueMetrics.succeeded >= 2, "Job queue metrics count succeeded jobs accurately");

  // -----------------------------------------------------------
  // SECTION 3: DECLARATIVE BUSINESS RULES ENGINE
  // -----------------------------------------------------------
  console.log("\n--- 3. Testing Declarative Rules Engine & Dry-Run Simulator ---");

  // Test condition evaluation operators
  assert(evaluateCondition({ field: "status", operator: "EQUALS", value: "ACTIVE" }, { status: "ACTIVE" }), "Condition EQUALS passes");
  assert(evaluateCondition({ field: "age", operator: "GREATER_THAN", value: 10 }, { age: 15 }), "Condition GREATER_THAN passes");
  assert(evaluateCondition({ field: "score", operator: "LESS_THAN_OR_EQUAL", value: 33 }, { score: 30 }), "Condition LESS_THAN_OR_EQUAL passes");
  assert(evaluateCondition({ field: "role", operator: "IN", value: ["ADMIN", "PRINCIPAL"] }, { role: "ADMIN" }), "Condition IN passes");
  assert(evaluateCondition({ field: "notes", operator: "CONTAINS", value: "urgent" }, { notes: "This is urgent review" }), "Condition CONTAINS passes");

  const testRule: BusinessRule = {
    ruleId: "RULE-TEST-001",
    version: "1.0",
    nameBn: "টেস্ট রুল",
    nameEn: "Test Rule",
    domain: "ATTENDANCE",
    triggerEvent: "ATTENDANCE_SAVED",
    conditions: [
      { field: "payload.consecutiveAbsences", operator: "GREATER_THAN_OR_EQUAL", value: 3 },
      { field: "payload.status", operator: "EQUALS", value: "ACTIVE" },
    ],
    actions: [
      {
        actionType: "DISPATCH_NOTIFICATION",
        parameters: { template: "ATTENDANCE_WARNING" },
        isHighRisk: false,
      },
    ],
    riskLevel: "MEDIUM",
    requiresApproval: false,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "TEST_SUITE",
  };

  // Test matching context
  const evalMatch = evaluateRule(testRule, { payload: { consecutiveAbsences: 4, status: "ACTIVE" } });
  assert(evalMatch.matched, "Rule evaluates to matched when all conditions are satisfied");
  assert(evalMatch.actionsToExecute.length === 1, "Matched rule outputs configured actions");

  // Test non-matching context
  const evalNoMatch = evaluateRule(testRule, { payload: { consecutiveAbsences: 1, status: "ACTIVE" } });
  assert(!evalNoMatch.matched, "Rule evaluates to not matched when condition fails");
  assert(evalNoMatch.actionsToExecute.length === 0, "Unmatched rule outputs zero actions");

  // Test Dry-Run Simulation Mode: "SIMULATION — NO DATA WILL BE CHANGED"
  const sim = runRuleSimulation("RULE-ATT-001", { consecutiveAbsences: 5, status: "ACTIVE" });
  assert(sim.simulationNotice.includes("SIMULATION — NO DATA WILL BE CHANGED"), "Dry-run output contains strict simulation notice banner");
  assert(sim.result.isSimulation === true, "Result is flagged isSimulation: true");

  // Test Loop Protection (Execution depth > 5)
  let loopProtectionCaught = false;
  try {
    evaluateRule(testRule, { payload: { consecutiveAbsences: 5 } }, { executionDepth: 6 });
  } catch (err: any) {
    if (err.message.toLowerCase().includes("loop protection")) {
      loopProtectionCaught = true;
    }
  }
  assert(loopProtectionCaught, "Loop protection halts recursive execution cascading deeper than 5 steps");

  // Test Conflict Detection
  const conflictingRules: BusinessRule[] = [
    {
      ...testRule,
      ruleId: "RULE-CONFLICT-A",
      triggerEvent: "SAMPLE_TRIGGER",
      requiresApproval: true,
      status: "ACTIVE",
    },
    {
      ...testRule,
      ruleId: "RULE-CONFLICT-B",
      triggerEvent: "SAMPLE_TRIGGER",
      requiresApproval: false,
      status: "ACTIVE",
    },
  ];
  const conflicts = detectRuleConflicts(conflictingRules);
  assert(conflicts.length === 1, "Conflict detector successfully identifies contradictory approval rules on same trigger");

  // -----------------------------------------------------------
  // SECTION 4: HUMAN APPROVAL GATEWAY ENGINE
  // -----------------------------------------------------------
  console.log("\n--- 4. Testing Human Approval Gateway & Authorization Controls ---");

  const appTimestamp = Date.now();
  const approvalReq = createApprovalRequest({
    workflowCode: "WF-INV-001",
    actionType: "CREATE_PURCHASE_REQUEST",
    entityType: "InventoryItem",
    entityId: `ITEM-TEST-${appTimestamp}`,
    requiredRole: "ADMIN",
    titleBn: "টেস্ট জরুরি মালামাল ক্রয় অনুমোদন",
    reasonBn: "মজুদ নিম্নসীমা অতিক্রম করেছে। জরুরি ভিত্তিতে কেনাকাটা প্রয়োজন।",
    expiryDays: 5,
  });

  assert(approvalReq.requestId.startsWith("EHRJ-APR-2026-"), "Approval request follows canonical ID EHRJ-APR-2026-XXXXXX");
  assert(approvalReq.status === "PENDING", "Approval request initializes in PENDING status");

  // Test Expiry Detection
  const expiredReq = createApprovalRequest({
    workflowCode: "WF-EXP-001",
    actionType: "REFUND_APPROVAL",
    entityType: "FeeInvoice",
    entityId: `INV-EXP-${appTimestamp}`,
    titleBn: "মেয়াদোত্তীর্ণ রিফান্ড রিকুয়েস্ট",
    reasonBn: "মেয়াদোত্তীর্ণ টেস্ট",
    expiryDays: -1, // in the past
  });
  const sweptCount = sweepExpiredApprovals();
  assert(sweptCount >= 1, "sweepExpiredApprovals marks past-due approvals as EXPIRED");

  // Test Role Authority Guard: Unauthorized role cannot approve
  let unauthorizedBlocked = false;
  try {
    resolveApprovalRequest({
      requestId: approvalReq.requestId,
      decision: "APPROVED",
      decidedBy: { userId: "user-teacher-01", role: "TEACHER", name: "সহকারী শিক্ষক" },
      decisionReason: "আমি অনুমোদন করলাম",
    });
  } catch (err: any) {
    if (err.message.includes("Permission Denied")) {
      unauthorizedBlocked = true;
    }
  }
  assert(unauthorizedBlocked, "Unauthorized role (TEACHER) is strictly blocked from approving ADMIN action");

  // Test Authorized Approval Sign-Off
  const approvedReq = resolveApprovalRequest({
    requestId: approvalReq.requestId,
    decision: "APPROVED",
    decidedBy: { userId: "admin-master-01", role: "ADMIN", name: "প্রধান অ্যাডমিন" },
    decisionReason: "যাচাইপূর্বক অনুমোদন প্রদান করা হলো।",
  });
  assert(approvedReq.status === "APPROVED", "Authorized admin successfully approves request");
  assert(approvedReq.decidedBy?.includes("প্রধান অ্যাডমিন"), "Reviewer name and role are permanently recorded in audit trail");
  assert(approvedReq.decisionReason === "যাচাইপূর্বক অনুমোদন প্রদান করা হলো।", "Justification notes permanently recorded");

  const appMetrics = getApprovalMetrics();
  assert(appMetrics.approved >= 1, "Approval metrics reflect approved count");

  // -----------------------------------------------------------
  // SECTION 5: CROSS-MODULE ORCHESTRATION & SAGA RECOVERY
  // -----------------------------------------------------------
  console.log("\n--- 5. Testing Cross-Module Orchestration & Saga Workflows ---");

  // Test Low-Stock Approval Gate Workflow (WF-INV-001)
  const lowStockEventId = `EVT-2026-TEST-${Date.now()}`;
  const lowStockEvent: DomainEvent = {
    eventId: lowStockEventId,
    eventType: "STOCK_LOW",
    occurredAt: new Date().toISOString(),
    actorType: "SYSTEM_AUTOMATION",
    actorId: "SYSTEM",
    sourceModule: "INVENTORY",
    entityType: "InventoryItem",
    entityId: `ITEM-FLOUR-${Date.now()}`,
    payload: { currentStock: 2, reorderLevel: 10, itemName: "আটা ৫০ কেজি" },
    correlationId: "CORR-INV-TEST-001",
    schemaVersion: "1.0",
    idempotencyKey: `evt_stock_low_${Date.now()}`,
  };

  const invInstances = await handleEventThroughWorkflow(lowStockEvent);
  assert(invInstances.length === 1, "STOCK_LOW triggers matching WF-INV-001 workflow instance");
  const invInst = invInstances[0];
  assert(invInst.status === "WAITING_APPROVAL", "High-risk purchase step halts instance at WAITING_APPROVAL");
  assert(invInst.stepsExecution[0].status === "APPROVAL_REQUIRED", "Step status recorded as APPROVAL_REQUIRED");

  const approvalId = invInst.stepsExecution[0].approvalRequestId;
  assert(approvalId !== undefined, "Approval request generated and linked to workflow step");

  // Simulate human approval and resume workflow
  resolveApprovalRequest({
    requestId: approvalId!,
    decision: "APPROVED",
    decidedBy: { userId: "admin-01", role: "ADMIN", name: "অ্যাডমিন অফিসার" },
    decisionReason: "রান্নাঘরের জন্য জরুরি ক্রয় অনুমোদন দেওয়া হলো।",
  });

  const resumed = await resumeWorkflowAfterApproval(approvalId!);
  assert(resumed !== null, "resumeWorkflowAfterApproval successfully finds and resumes instance");
  assert(resumed?.status === "COMPLETED", "Resumed workflow instance finishes remaining steps and marks COMPLETED");

  // Test AI Decision-Support Rule Drafting
  const aiDraft = generateAiDraftRule("যদি কোনো শিক্ষার্থী ৩ দিন অনুপস্থিত থাকে তবে অভিভাবককে এসএমএস পাঠাও");
  assert(aiDraft.domain === "ATTENDANCE", "AI correctly classifies attendance domain from Bengali prompt");
  assert(aiDraft.status === "DRAFT", "AI generated rule is strictly set to DRAFT (never automatically activated)");
  assert(aiDraft.createdBy === "AI_ASSISTANT", "Rule metadata credits AI_ASSISTANT as creator");

  const wfMetrics = getWorkflowMetrics();
  assert(wfMetrics.totalDefinitions >= 4, "System registers default multi-domain workflow definitions");

  // -----------------------------------------------------------
  // SECTION 6: API ENDPOINTS SMOKE TESTS
  // -----------------------------------------------------------
  console.log("\n--- 6. Testing Phase 27 HTTP API Endpoints ---");

  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });
  if (!adminUser) {
    throw new Error("No admin user found in database for smoke tests");
  }

  const adminToken = await createSessionToken({
    userId: adminUser.id,
    username: adminUser.username,
    role: adminUser.role,
    email: adminUser.email,
    name: adminUser.name,
  });

  const headers = {
    Cookie: `ehrj_session_token=${adminToken}`,
    "Content-Type": "application/json",
  };

  // Test GET /api/admin/workflows/overview
  const resOverview = await fetch("http://localhost:3000/api/admin/workflows/overview", { headers });
  assert(resOverview.status === 200, "GET /api/admin/workflows/overview returns HTTP 200");
  const dataOverview = await resOverview.json();
  assert(dataOverview.success === true, "Overview API returns success: true");
  assert(dataOverview.data.workflows !== undefined, "Overview payload contains workflow metrics");

  // Test GET /api/admin/workflows/rules
  const resRules = await fetch("http://localhost:3000/api/admin/workflows/rules", { headers });
  assert(resRules.status === 200, "GET /api/admin/workflows/rules returns HTTP 200");
  const dataRules = await resRules.json();
  assert(Array.isArray(dataRules.data.rules), "Rules API returns array of rules");

  // Test POST /api/admin/workflows/rules (dryRun)
  const resSim = await fetch("http://localhost:3000/api/admin/workflows/rules", {
    method: "POST",
    headers,
    body: JSON.stringify({
      dryRun: true,
      ruleId: "RULE-ATT-001",
      samplePayload: { consecutiveAbsences: 4, status: "ACTIVE" },
    }),
  });
  assert(resSim.status === 200, "POST /api/admin/workflows/rules (dryRun) returns HTTP 200");
  const dataSim = await resSim.json();
  assert(dataSim.simulation.simulationNotice.includes("SIMULATION"), "Simulation API returns dry-run notice");

  // Test GET /api/admin/workflows/approvals
  const resApp = await fetch("http://localhost:3000/api/admin/workflows/approvals", { headers });
  assert(resApp.status === 200, "GET /api/admin/workflows/approvals returns HTTP 200");

  // Test GET /api/admin/workflows/jobs
  const resJobs = await fetch("http://localhost:3000/api/admin/workflows/jobs", { headers });
  assert(resJobs.status === 200, "GET /api/admin/workflows/jobs returns HTTP 200");

  // Test GET /api/admin/workflows/events
  const resEvents = await fetch("http://localhost:3000/api/admin/workflows/events", { headers });
  assert(resEvents.status === 200, "GET /api/admin/workflows/events returns HTTP 200");

  // Test POST /api/admin/workflows/ai-draft
  const resAiDraft = await fetch("http://localhost:3000/api/admin/workflows/ai-draft", {
    method: "POST",
    headers,
    body: JSON.stringify({ promptBn: "নতুন ভর্তি আবেদন জমা হলে অ্যাডমিনকে অবহিত করো" }),
  });
  assert(resAiDraft.status === 200, "POST /api/admin/workflows/ai-draft returns HTTP 200");
  const dataAi = await resAiDraft.json();
  assert(dataAi.data.draftRule.domain === "ADMISSION", "AI Draft API correctly infers ADMISSION domain");

  console.log("\n=======================================================");
  console.log(`   PHASE 27 TEST SUITE RESULT: ${passedAssertions} / ${totalAssertions} ASSERTIONS PASSED`);
  console.log("   ALL WORKFLOW, RULES, APPROVAL & JOB ENGINES VERIFIED!");
  console.log("=======================================================\n");
}

runPhase27Tests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test Suite Fatal Error:", err);
    process.exit(1);
  });
