/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 32
 * Campaign Lifecycle, Execution & Dispatch Engine
 * Bridges Campaigns -> Audience Snapshots -> Phase 8 Notification Dispatcher
 * Checkpoint: EHRJ-AI-2026-PHASE32
 */

import {
  CommunicationCampaign,
  CampaignStatus,
  AudienceType,
  AudienceFilter,
  CommunicationChannel,
  CommunicationType,
} from "./types";
import {
  getCommunicationCampaigns,
  getCommunicationCampaignById,
  saveCommunicationCampaign,
  getAudienceSnapshotById,
  recordCommunicationAudit,
} from "./communicationStore";
import { createAudienceSnapshot, resolveAudienceRecipients } from "./audienceResolver";
import { getTemplateByCode, renderTemplateForRecipient } from "./templateEngine";
import { evaluateDeliveryEligibility } from "./suppressionManager";
import { dispatchNotification } from "@/lib/communicationEngine";

/**
 * Creates a new communication campaign
 */
export async function createCampaign(input: {
  title: string;
  objective: string;
  communicationType: CommunicationType;
  channels: CommunicationChannel[];
  audienceType: AudienceType;
  audienceFilter?: AudienceFilter;
  templateCode?: string;
  subject: string;
  body: string;
  variables?: Record<string, any>;
  actionUrl?: string;
  publicCmsNoticeId?: string;
  priority?: "NORMAL" | "IMPORTANT" | "URGENT";
  scheduledAt?: string;
  createdBy: string;
}): Promise<CommunicationCampaign> {
  const year = new Date().getFullYear();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const campaignId = `EHRJ-COM-${year}-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;

  // Estimate audience size to determine if approval gate is mandatory
  const preliminaryRecipients = await resolveAudienceRecipients(
    input.audienceType,
    input.audienceFilter || {}
  );

  const isSensitiveType = [
    "OFFICIAL_NOTICE",
    "PAYMENT_REMINDER",
    "SYSTEM_ALERT",
    "RESULT_NOTIFICATION",
  ].includes(input.communicationType);

  const requiresApproval = preliminaryRecipients.length >= 25 || isSensitiveType;

  // Resolve template version if template was selected
  let templateVersion = 1;
  if (input.templateCode) {
    const tpl = getTemplateByCode(input.templateCode);
    if (tpl) templateVersion = tpl.version;
  }

  const campaign: CommunicationCampaign = {
    id: campaignId,
    title: input.title.trim(),
    objective: input.objective.trim(),
    communicationType: input.communicationType,
    channels: input.channels.length > 0 ? input.channels : ["PORTAL", "EMAIL"],
    audienceType: input.audienceType,
    audienceFilter: input.audienceFilter || {},
    templateCode: input.templateCode,
    templateVersion,
    subject: input.subject.trim(),
    body: input.body.trim(),
    variables: input.variables || {},
    actionUrl: input.actionUrl,
    publicCmsNoticeId: input.publicCmsNoticeId,
    priority: input.priority || "NORMAL",
    status: "DRAFT",
    requiresApproval,
    scheduledAt: input.scheduledAt,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metrics: {
      queued: preliminaryRecipients.length,
      sent: 0,
      delivered: 0,
      failed: 0,
      suppressed: 0,
    },
  };

  saveCommunicationCampaign(campaign);

  recordCommunicationAudit({
    actorId: input.createdBy,
    actorRole: "ADMIN",
    action: "CREATE_CAMPAIGN",
    campaignId,
    details: {
      title: campaign.title,
      audienceType: campaign.audienceType,
      estimatedRecipients: preliminaryRecipients.length,
      requiresApproval,
    },
  });

  return campaign;
}

/**
 * Previews a campaign with real audience rendering and channel breakdown
 */
export async function previewCampaign(campaignId: string) {
  const campaign = getCommunicationCampaignById(campaignId);
  if (!campaign) throw new Error(`Campaign not found: ${campaignId}`);

  const recipients = await resolveAudienceRecipients(
    campaign.audienceType,
    campaign.audienceFilter
  );

  // Render a sample preview for the first recipient
  let sampleRender = {
    renderedSubject: campaign.subject,
    renderedBody: campaign.body,
    missingVariables: [] as string[],
  };

  const sampleRecipient = recipients[0];
  if (sampleRecipient) {
    if (campaign.templateCode) {
      const tpl = getTemplateByCode(campaign.templateCode);
      if (tpl) {
        sampleRender = renderTemplateForRecipient(
          tpl,
          sampleRecipient,
          campaign.variables,
          "bn"
        );
      }
    }
  }

  return {
    campaignId: campaign.id,
    title: campaign.title,
    audienceType: campaign.audienceType,
    totalAudienceCount: recipients.length,
    channels: campaign.channels,
    sampleRecipient: sampleRecipient
      ? {
          name: sampleRecipient.name,
          role: sampleRecipient.role,
          email: sampleRecipient.email,
          studentNameBn: sampleRecipient.studentNameBn,
        }
      : null,
    sampleRender,
    status: campaign.status,
    requiresApproval: campaign.requiresApproval,
    isApproved: !!campaign.approvedBy,
  };
}

/**
 * Approves a pending campaign
 */
export function approveCampaign(
  campaignId: string,
  approverId: string,
  role: string = "ADMIN"
): CommunicationCampaign {
  const campaign = getCommunicationCampaignById(campaignId);
  if (!campaign) throw new Error(`Campaign not found: ${campaignId}`);

  if (role !== "ADMIN" && role !== "PRINCIPAL") {
    throw new Error("Unauthorized: Only Admin or Principal can approve communication campaigns");
  }

  campaign.approvedBy = approverId;
  campaign.approvedAt = new Date().toISOString();
  campaign.status = campaign.scheduledAt ? "SCHEDULED" : "APPROVED";

  saveCommunicationCampaign(campaign);

  recordCommunicationAudit({
    actorId: approverId,
    actorRole: role,
    action: "APPROVE_CAMPAIGN",
    campaignId,
    details: { status: campaign.status, scheduledAt: campaign.scheduledAt },
  });

  return campaign;
}

/**
 * Sends a controlled test email to an Admin
 */
export async function sendTestMessage(
  campaignId: string,
  adminUser: { id: string; name: string; email: string }
): Promise<{ success: boolean; message: string }> {
  const campaign = getCommunicationCampaignById(campaignId);
  if (!campaign) throw new Error(`Campaign not found: ${campaignId}`);

  const testSubject = `[TEST CAMPAIGN: ${campaign.id}] ${campaign.subject}`;
  const testBody = `[এই বার্তাটি একটি পরীক্ষামূলক টেস্ট মেসেজ - অ্যাডমিন রিভিউয়ের জন্য প্রেরিত]\n\n${campaign.body}\n\nউদ্দেশ্য: ${campaign.objective}\nলক্ষ্য গ্রাহক: ${campaign.audienceType}`;

  await dispatchNotification({
    templateCode: "SECURITY_ALERT", // Authoritative fallback
    recipients: [
      {
        userId: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: "ADMIN",
      },
    ],
    customTitle: testSubject,
    customBody: testBody,
    variables: {},
    priority: "URGENT",
    idempotencyBaseKey: `test-${campaignId}-${Date.now()}`,
  });

  recordCommunicationAudit({
    actorId: adminUser.id,
    actorRole: "ADMIN",
    action: "TEST_SEND",
    campaignId,
    details: { sentTo: adminUser.email },
  });

  return {
    success: true,
    message: `টেস্ট মেসেজ সফলভাবে ${adminUser.email}-এ প্রেরণ করা হয়েছে।`,
  };
}

/**
 * Executes a campaign (Live or Dry-Run)
 */
export async function executeCampaign(
  campaignId: string,
  options: { dryRun?: boolean; actorId?: string } = {}
): Promise<{
  success: boolean;
  status: CampaignStatus;
  queued: number;
  sent: number;
  delivered: number;
  suppressed: number;
  failed: number;
  isDryRun: boolean;
}> {
  const campaign = getCommunicationCampaignById(campaignId);
  if (!campaign) throw new Error(`Campaign not found: ${campaignId}`);

  const isDryRun = !!options.dryRun;
  const actorId = options.actorId || "SYSTEM";

  // Check approval invariant
  if (!isDryRun && campaign.requiresApproval && !campaign.approvedBy) {
    throw new Error(
      "Approval Required: এই ক্যাম্পেইনটি প্রেরণের পূর্বে প্রশাসনিক অনুমোদন আবশ্যক।"
    );
  }

  // 1. Create or load authoritative Audience Snapshot
  let snapshot = campaign.snapshotId ? getAudienceSnapshotById(campaign.snapshotId) : null;
  if (!snapshot) {
    snapshot = await createAudienceSnapshot(
      campaign.id,
      campaign.audienceType,
      campaign.audienceFilter
    );
    campaign.snapshotId = snapshot.snapshotId;
  }

  let sentCount = 0;
  let deliveredCount = 0;
  let suppressedCount = 0;
  let failedCount = 0;

  const deliveryResults: CommunicationCampaign["deliveryResults"] = [];

  // Update status to SENDING if not dry run
  if (!isDryRun) {
    campaign.status = "SENDING";
    saveCommunicationCampaign(campaign);
  }

  // Resolve template if selected
  const template = campaign.templateCode ? getTemplateByCode(campaign.templateCode) : null;

  for (const recipient of snapshot.recipients) {
    // 2. Evaluate delivery eligibility and email suppression
    const eligibility = await evaluateDeliveryEligibility({
      userId: recipient.userId,
      email: recipient.email,
      communicationType: campaign.communicationType,
      isMandatoryTemplate: template?.isMandatory,
    });

    if (eligibility.isSuppressed && !template?.isMandatory) {
      suppressedCount++;
      deliveryResults.push({
        recipientId: recipient.recipientId,
        userId: recipient.userId,
        channel: "EMAIL",
        destination: recipient.email || "unknown",
        status: "SUPPRESSED",
        error: eligibility.reason,
        dispatchedAt: new Date().toISOString(),
      });
      continue;
    }

    // 3. Render content specifically for this recipient
    let subject = campaign.subject;
    let body = campaign.body;

    if (template) {
      const render = renderTemplateForRecipient(
        template,
        recipient,
        campaign.variables,
        "bn"
      );
      if (render.success) {
        subject = render.renderedSubject;
        body = render.renderedBody;
      }
    }

    // 4. Dispatch live if not dry run
    if (!isDryRun) {
      const idempotencyKey = `camp-${campaign.id}-${recipient.userId}`;

      try {
        const dispatchRes = await dispatchNotification({
          templateCode: "OFFICIAL_NOTICE_ANNOUNCEMENT", // Authoritative template fallback
          recipients: [
            {
              userId: recipient.userId,
              name: recipient.name,
              email: eligibility.canSendEmail && recipient.email ? recipient.email : null,
              role: recipient.role,
            },
          ],
          customTitle: subject,
          customBody: body,
          actionUrl: campaign.actionUrl,
          priority: campaign.priority,
          variables: {},
          idempotencyBaseKey: idempotencyKey,
        });

        sentCount += dispatchRes.dispatchedCount;
        deliveredCount += dispatchRes.dispatchedCount;

        deliveryResults.push({
          recipientId: recipient.recipientId,
          userId: recipient.userId,
          channel: campaign.channels[0] || "PORTAL",
          destination: recipient.email || recipient.name,
          status: "SENT",
          dispatchedAt: new Date().toISOString(),
        });
      } catch (err: any) {
        failedCount++;
        deliveryResults.push({
          recipientId: recipient.recipientId,
          userId: recipient.userId,
          channel: campaign.channels[0] || "PORTAL",
          destination: recipient.email || recipient.name,
          status: "FAILED",
          error: err.message,
          dispatchedAt: new Date().toISOString(),
        });
      }
    } else {
      // Dry run simulated delivery
      sentCount++;
      deliveredCount++;
    }
  }

  // 5. Update Campaign Status and Metrics
  if (!isDryRun) {
    campaign.status = failedCount === 0 ? "SENT" : sentCount > 0 ? "PARTIALLY_SENT" : "FAILED";
    campaign.sentAt = new Date().toISOString();
    campaign.deliveryResults = deliveryResults;
  }

  campaign.metrics = {
    queued: snapshot.totalCount,
    sent: sentCount,
    delivered: deliveredCount,
    suppressed: suppressedCount,
    failed: failedCount,
  };

  saveCommunicationCampaign(campaign);

  recordCommunicationAudit({
    actorId,
    actorRole: "ADMIN",
    action: isDryRun ? "DRY_RUN" : "SEND_CAMPAIGN",
    campaignId: campaign.id,
    details: {
      isDryRun,
      totalAudience: snapshot.totalCount,
      sentCount,
      suppressedCount,
      failedCount,
    },
  });

  return {
    success: true,
    status: campaign.status,
    queued: snapshot.totalCount,
    sent: sentCount,
    delivered: deliveredCount,
    suppressed: suppressedCount,
    failed: failedCount,
    isDryRun,
  };
}
