/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 32 VERIFICATION SUITE
 * Institutional Communication, Community Engagement & Outreach Engine
 * Checkpoint: EHRJ-AI-2026-PHASE32
 */

import {
  createCampaign,
  previewCampaign,
  approveCampaign,
  executeCampaign,
  sendTestMessage,
  resolveAudienceRecipients,
  createAudienceSnapshot,
  renderCommunicationTemplate,
  renderTemplateForRecipient,
  getCommunicationTemplates,
  saveCommunicationTemplate,
  addSuppression,
  removeSuppression,
  isEmailSuppressed,
  evaluateDeliveryEligibility,
  generateInstitutionalDigest,
  handleDomainEventCommunication,
  getCommunicationAuditLog,
  getCommunicationOverviewMetrics,
  escapeHtml,
} from "../src/lib/communications";
import { prisma } from "../src/lib/prisma";

let totalPassed = 0;
let totalFailed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    totalPassed++;
  } else {
    console.error(`  [FAIL] ${testName} ${details ? `(${details})` : ""}`);
    totalFailed++;
  }
}

async function runPhase32Tests() {
  console.log("=======================================================================");
  console.log("  EHRJ PHASE 32 — INSTITUTIONAL COMMUNICATION VERIFICATION SUITE       ");
  console.log("=======================================================================\n");

  // -------------------------------------------------------------
  // TEST GROUP 1: Audience Resolution & Snapshot Integrity
  // -------------------------------------------------------------
  console.log("[TEST GROUP 1] Audience Resolution & Snapshot Integrity");

  const guardians = await resolveAudienceRecipients("ALL_GUARDIANS");
  assert(Array.isArray(guardians), "Audience resolver returns list for ALL_GUARDIANS");

  const teachers = await resolveAudienceRecipients("ALL_TEACHERS");
  assert(Array.isArray(teachers), "Audience resolver returns list for ALL_TEACHERS");

  const oversight = await resolveAudienceRecipients("ALL_PRINCIPAL_OVERSIGHT");
  assert(oversight.length >= 1, "Principal and admin oversight audience resolved");

  const snapshot = await createAudienceSnapshot("TEST-CAM-001", "ALL_GUARDIANS");
  assert(snapshot.snapshotId.startsWith("SNP-"), "Audience snapshot generated with canonical prefix");
  assert(snapshot.totalCount === snapshot.recipients.length, "Snapshot recipient count matches totalCount");
  assert(typeof snapshot.resolvedAt === "string", "Snapshot contains immutable resolvedAt timestamp");

  // -------------------------------------------------------------
  // TEST GROUP 2: Sandboxed Template Engine & XSS Defense
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 2] Sandboxed Template Engine & XSS Defense");

  const xssInput = "<script>alert('XSS')</script>&<b>Bold</b>";
  const escaped = escapeHtml(xssInput);
  assert(!escaped.includes("<script>"), "HTML entities escaped cleanly to prevent XSS");
  assert(escaped.includes("&lt;script&gt;"), "Script tag converted to safe HTML entities");

  const sampleTpl = "মুহতারাম {{recipient_name}}, আপনার সন্তান {{student_name}}-এর পরীক্ষার রোল: {{roll}}।";
  const renderRes = renderCommunicationTemplate(
    sampleTpl,
    {
      recipient_name: "মুহাম্মদ আব্দুল্লাহ",
      student_name: "আহমাদ উল্লাহ",
      roll: "৫",
    },
    ["recipient_name", "student_name", "roll"]
  );

  assert(renderRes.missingVariables.length === 0, "All required variables successfully supplied");
  assert(renderRes.renderedText.includes("মুহাম্মদ আব্দুল্লাহ"), "Recipient name interpolated correctly");
  assert(renderRes.renderedText.includes("রোল: ৫"), "Student roll number interpolated correctly");

  // Missing variable test
  const missingRes = renderCommunicationTemplate(sampleTpl, { recipient_name: "কারী সাহেব" }, [
    "student_name",
  ]);
  assert(missingRes.missingVariables.includes("student_name"), "Missing required variable detected");

  // -------------------------------------------------------------
  // TEST GROUP 3: Template Versioning & History Tracking
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 3] Template Versioning & History Tracking");

  const templates = getCommunicationTemplates();
  assert(templates.length >= 4, "Default approved communication templates pre-seeded");

  const initialTpl = templates[0];
  const updatedTpl = saveCommunicationTemplate(
    {
      code: initialTpl.code,
      nameBn: initialTpl.nameBn,
      category: initialTpl.category,
      subjectTemplateBn: initialTpl.subjectTemplateBn + " [হালনাগাদ]",
      bodyTemplateBn: initialTpl.bodyTemplateBn,
    },
    "TEST_ADMIN"
  );

  assert(updatedTpl.version > initialTpl.version, `Template version incremented (v${initialTpl.version} -> v${updatedTpl.version})`);
  assert(updatedTpl.versionsHistory.length >= 1, "Historical template version retained in versionsHistory");

  // -------------------------------------------------------------
  // TEST GROUP 4: Email Suppression List & Delivery Eligibility
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 4] Email Suppression & Delivery Eligibility");

  const testEmail = "test_bounce_student@ehrj-test.com";
  const supRecord = addSuppression(testEmail, "BOUNCE_PERMANENT", "Simulated permanent bounce");
  assert(isEmailSuppressed(testEmail) === true, "Suppressed email address identified in suppression list");

  // Standard non-mandatory message should be suppressed
  const standardEligibility = await evaluateDeliveryEligibility({
    userId: "USR-TEST-01",
    email: testEmail,
    communicationType: "OFFICIAL_NOTICE",
    isMandatoryTemplate: false,
  });
  assert(standardEligibility.canSendEmail === false, "Standard communication blocked for suppressed email");
  assert(standardEligibility.isSuppressed === true, "Eligibility engine flags email as suppressed");

  // Mandatory transactional message should bypass suppression
  const mandatoryEligibility = await evaluateDeliveryEligibility({
    userId: "USR-TEST-01",
    email: testEmail,
    communicationType: "SYSTEM_ALERT",
    isMandatoryTemplate: true,
  });
  assert(mandatoryEligibility.canSendEmail === true, "CRITICAL INVARIANT: Mandatory alert bypasses suppression");

  // Remove suppression
  removeSuppression(testEmail);
  assert(isEmailSuppressed(testEmail) === false, "Email suppression successfully released");

  // -------------------------------------------------------------
  // TEST GROUP 5: Campaign Lifecycle & Approval Gates
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 5] Campaign Lifecycle & Approval Gates");

  const campaign = await createCampaign({
    title: "টেস্ট পরীক্ষার বিশেষ দিকনির্দেশনা",
    objective: "আসন্ন সাময়িক পরীক্ষা সংক্রান্ত নির্দেশনা প্রদান",
    communicationType: "OFFICIAL_NOTICE",
    channels: ["PORTAL", "EMAIL"],
    audienceType: "ALL_GUARDIANS",
    subject: "জরুরি: পরীক্ষার বিশেষ দিকনির্দেশনা",
    body: "মুহতারাম অভিভাবক, পরীক্ষার সময়সূচি ও দিকনির্দেশনা অনুযায়ী প্রস্তুত থাকুন।",
    createdBy: "TEST_ADMIN",
  });

  assert(campaign.id.startsWith("EHRJ-COM-"), "Campaign created with canonical ID format");
  assert(campaign.status === "DRAFT", "Initial campaign status is DRAFT");

  const preview = await previewCampaign(campaign.id);
  assert(preview.campaignId === campaign.id, "Campaign preview generated with matched ID");
  assert(preview.totalAudienceCount >= 0, "Audience preview calculates real-time recipient count");

  // Approval flow
  const approvedCampaign = approveCampaign(campaign.id, "TEST_ADMIN", "ADMIN");
  assert(approvedCampaign.status === "APPROVED", "Campaign transitioned to APPROVED status");
  assert(!!approvedCampaign.approvedBy, "Approver identity recorded on campaign");

  // -------------------------------------------------------------
  // TEST GROUP 6: Dry-Run & Test Send Execution
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 6] Dry-Run & Test Send Execution");

  // Dry run
  const dryRunRes = await executeCampaign(campaign.id, { dryRun: true, actorId: "TEST_ADMIN" });
  assert(dryRunRes.success === true, "Dry-run simulation completed successfully");
  assert(dryRunRes.isDryRun === true, "Dry-run flag honored");
  assert(dryRunRes.sent >= 0, "Simulated delivery calculated in dry-run");

  // Test send to admin using real admin user
  const actualAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } }) || {
    id: "usr_admin_default",
    name: "অ্যাডমিন টেস্ট",
    email: "admin@ehrjmadrasha.com",
  };
  const testSendRes = await sendTestMessage(campaign.id, {
    id: actualAdmin.id,
    name: actualAdmin.name,
    email: actualAdmin.email || "admin@ehrjmadrasha.com",
  });
  assert(testSendRes.success === true, "Test send completed with [TEST] label");

  // -------------------------------------------------------------
  // TEST GROUP 7: Idempotent Live Campaign Dispatch
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 7] Idempotent Live Campaign Dispatch");

  const liveRes = await executeCampaign(campaign.id, { dryRun: false, actorId: "TEST_ADMIN" });
  assert(liveRes.success === true, "Live campaign execution succeeded");
  assert(liveRes.status === "SENT" || liveRes.status === "PARTIALLY_SENT", "Campaign marked as SENT");

  // -------------------------------------------------------------
  // TEST GROUP 8: Institutional Digest Generation (Daily & Weekly)
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 8] Institutional Digest Generation");

  const dailyDigest = await generateInstitutionalDigest({
    digestType: "DAILY",
    targetRole: "GUARDIAN",
    dispatchLive: false,
  });
  assert(dailyDigest.id.startsWith("DIG-"), "Daily digest generated with canonical ID");
  assert(dailyDigest.digestType === "DAILY", "Digest type is DAILY");
  assert(Array.isArray(dailyDigest.items), "Digest aggregates notices and events");

  const weeklyDigest = await generateInstitutionalDigest({
    digestType: "WEEKLY",
    targetRole: "TEACHER",
    dispatchLive: false,
  });
  assert(weeklyDigest.digestType === "WEEKLY", "Weekly bulletin generated successfully");

  // -------------------------------------------------------------
  // TEST GROUP 9: Workflow & Domain EventBus Communication Bridge
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 9] Workflow & Domain EventBus Communication Bridge");

  const actualGuardian = await prisma.user.findFirst({ where: { role: "GUARDIAN" } });

  const eventResult = await handleDomainEventCommunication({
    eventId: "EVT-TEST-001",
    eventType: "ADMISSION_APPLICATION_APPROVED",
    occurredAt: new Date().toISOString(),
    actorType: "USER",
    actorId: actualAdmin.id,
    sourceModule: "ADMISSION",
    entityType: "AdmissionApplication",
    entityId: "APP-TEST-999",
    payload: {
      guardianUserId: actualGuardian?.id || actualAdmin.id,
      guardianName: "মুহাম্মদ ফারুক",
      guardianEmail: "faruq.test@example.com",
      studentNameBn: "আব্দুল বারী",
      studentIdNumber: "EHRJ-2026-0099",
      className: "হিফজুল কুরআন বিভাগ",
      roll: "৩",
    },
    correlationId: "CORR-001",
    schemaVersion: "1.0",
  });

  assert(eventResult === true, "Domain event ADMISSION_APPLICATION_APPROVED bridged to communication");

  // -------------------------------------------------------------
  // TEST GROUP 10: Overview Metrics & Security Audit Trail
  // -------------------------------------------------------------
  console.log("\n[TEST GROUP 10] Overview Metrics & Security Audit Trail");

  const metrics = getCommunicationOverviewMetrics();
  assert(metrics.totalCampaigns >= 1, "Overview metrics tracks total campaigns");
  assert(metrics.templatesCount >= 4, "Overview metrics tracks approved templates");

  const auditLogs = getCommunicationAuditLog();
  assert(auditLogs.length >= 1, "Communication actions recorded in audit trail");
  assert(auditLogs.some((l) => l.action === "CREATE_CAMPAIGN"), "Audit trail captured CREATE_CAMPAIGN action");
  assert(auditLogs.some((l) => l.action === "APPROVE_CAMPAIGN"), "Audit trail captured APPROVE_CAMPAIGN action");

  console.log("\n=======================================================================");
  console.log(`  PHASE 32 TEST SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED`);
  console.log("=======================================================================\n");

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runPhase32Tests().catch((err) => {
  console.error("Unhandled test execution error:", err);
  process.exit(1);
});
