/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 32
 * Email Suppression & Communication Preference Engine
 * Protects users against unsolicited email while preserving critical transactional delivery.
 * Checkpoint: EHRJ-AI-2026-PHASE32
 */

import { prisma } from "@/lib/prisma";
import { isEmailSuppressed, addSuppression, removeSuppression } from "./communicationStore";
import { CommunicationType } from "./types";

// Critical categories that MUST NOT be suppressed by standard unsubscribe policies
const MANDATORY_TRANSACTIONAL_TYPES: CommunicationType[] = [
  "SYSTEM_ALERT",
  "PAYMENT_CONFIRMATION",
  "ADMISSION_UPDATE",
  "DOCUMENT_NOTIFICATION",
];

export interface DeliveryEligibilityResult {
  canSendEmail: boolean;
  canSendPortal: boolean;
  reason?: string;
  isSuppressed: boolean;
}

/**
 * Checks whether a message can be delivered to a recipient across email and portal channels
 */
export async function evaluateDeliveryEligibility(params: {
  userId: string;
  email?: string;
  communicationType: CommunicationType;
  isMandatoryTemplate?: boolean;
}): Promise<DeliveryEligibilityResult> {
  const { userId, email, communicationType, isMandatoryTemplate } = params;

  const isMandatory = isMandatoryTemplate || MANDATORY_TRANSACTIONAL_TYPES.includes(communicationType);

  // 1. Email Suppression Check
  const emailSuppressed = email ? isEmailSuppressed(email) : true;

  // 2. Query User Notification Preferences from Prisma
  let pref = null;
  try {
    pref = await prisma.notificationPreference.findUnique({
      where: {
        userId_category: {
          userId,
          category: communicationType,
        },
      },
    });
  } catch (err) {
    // If preference lookup fails, default to allowed
  }

  // 3. Evaluate Portal Channel
  let canSendPortal = true;
  if (!isMandatory && pref && pref.portalEnabled === false) {
    canSendPortal = false;
  }

  // 4. Evaluate Email Channel
  let canSendEmail = false;
  let reason: string | undefined;

  if (!email) {
    canSendEmail = false;
    reason = "ইমেইল ঠিকানা অনুপস্থিত";
  } else if (emailSuppressed && !isMandatory) {
    canSendEmail = false;
    reason = "ইমেইল ঠিকানা বাউন্স/আনসাবস্ক্রাইব তালিকায় রয়েছে (Suppressed)";
  } else if (!isMandatory && pref && pref.emailEnabled === false) {
    canSendEmail = false;
    reason = "ব্যবহারকারী এই ক্যাটাগরির নোটিফিকেশন বন্ধ রেখেছেন";
  } else {
    canSendEmail = true;
  }

  return {
    canSendEmail,
    canSendPortal,
    reason,
    isSuppressed: emailSuppressed,
  };
}

/**
 * Processes an opt-out / unsubscribe request from a recipient
 */
export async function processUnsubscribe(
  email: string,
  reason: "USER_UNSUBSCRIBE" | "BOUNCE_PERMANENT" | "INVALID_ADDRESS" = "USER_UNSUBSCRIBE",
  sourceCampaignId?: string
) {
  return addSuppression(email, reason, "ব্যবহারকারীর অনুরোধে আনসাবস্ক্রাইব করা হয়েছে", sourceCampaignId);
}

export { isEmailSuppressed, addSuppression, removeSuppression };
