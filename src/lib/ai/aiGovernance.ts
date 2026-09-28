/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 21
 * Master AI Governance, Feature Flags, Emergency Kill-Switch & Usage Tracking
 * 
 * Invariants:
 * 1. AI ASSISTS. AUTHORIZED HUMANS DECIDE.
 * 2. ERP MUST OPERATE FULLY IF AI IS DISABLED OR FAILS.
 * 3. TRACK TOKEN USAGE, LATENCY & HUMAN CORRECTIONS WITHOUT STORING RAW SENSITIVE PROMPTS.
 */

import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

const AI_DATA_DIR = path.join(process.cwd(), "data", "ai");

function ensureAiDir() {
  if (!fs.existsSync(AI_DATA_DIR)) {
    fs.mkdirSync(AI_DATA_DIR, { recursive: true });
  }
}

export interface AIFeatureFlags {
  masterEnabled: boolean;
  academicAi: boolean;
  financeAi: boolean;
  admissionAi: boolean;
  helpdeskAi: boolean;
  documentAi: boolean;
  arabicNameAi: boolean;
  lastToggledAt: string;
  toggledBy?: string;
  toggleReason?: string;
}

export interface AIUsageRecord {
  requestId: string;
  userId?: string;
  userRole?: string;
  module: "ACADEMIC" | "FINANCE" | "ADMISSION" | "HELPDESK" | "OPERATIONS" | "GENERAL";
  queryIntent: string;
  model: string;
  provider: "LOCAL_FALLBACK" | "CLOUD_GEMINI" | "CLOUD_OPENAI";
  estimatedTokens: number;
  latencyMs: number;
  status: "SUCCESS" | "BLOCKED_BY_FIREWALL" | "FAILED" | "FALLBACK_USED";
  humanReviewRequired: boolean;
  humanReviewStatus?: "PENDING" | "APPROVED" | "REJECTED" | "MODIFIED" | "NOT_REQUIRED";
  timestamp: string;
}

export interface AIHumanReviewItem {
  reviewId: string;
  requestId: string;
  module: string;
  proposedAction: string;
  entityType: string;
  entityId?: string;
  recommendationSummary: string;
  supportingEvidence: string;
  riskTier: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "PENDING" | "APPROVED" | "REJECTED" | "MODIFIED";
  reviewedBy?: string;
  reviewedAt?: string;
  decisionNotes?: string;
  createdAt: string;
}

const FLAGS_FILE = path.join(AI_DATA_DIR, "feature_flags.json");
const USAGE_FILE = path.join(AI_DATA_DIR, "usage_log.json");
const REVIEWS_FILE = path.join(AI_DATA_DIR, "human_reviews.json");

export function getAIFeatureFlags(): AIFeatureFlags {
  ensureAiDir();
  if (!fs.existsSync(FLAGS_FILE)) {
    const defaultFlags: AIFeatureFlags = {
      masterEnabled: true,
      academicAi: true,
      financeAi: true,
      admissionAi: true,
      helpdeskAi: true,
      documentAi: true,
      arabicNameAi: true,
      lastToggledAt: new Date().toISOString(),
      toggledBy: "System Baseline",
      toggleReason: "Initial Phase 21 Activation",
    };
    fs.writeFileSync(FLAGS_FILE, JSON.stringify(defaultFlags, null, 2), "utf8");
    return defaultFlags;
  }
  try {
    return JSON.parse(fs.readFileSync(FLAGS_FILE, "utf8"));
  } catch {
    return {
      masterEnabled: true,
      academicAi: true,
      financeAi: true,
      admissionAi: true,
      helpdeskAi: true,
      documentAi: true,
      arabicNameAi: true,
      lastToggledAt: new Date().toISOString(),
    };
  }
}

export async function toggleAIFeatureFlags(
  flags: Partial<AIFeatureFlags>,
  actorUserId?: string,
  reason?: string
): Promise<AIFeatureFlags> {
  const current = getAIFeatureFlags();
  const updated: AIFeatureFlags = {
    ...current,
    ...flags,
    lastToggledAt: new Date().toISOString(),
    toggledBy: actorUserId || "Admin",
    toggleReason: reason || "Administrative policy update",
  };

  fs.writeFileSync(FLAGS_FILE, JSON.stringify(updated, null, 2), "utf8");

  if (actorUserId) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: actorUserId,
          action: "AI_FEATURE_FLAGS_UPDATED",
          entityType: "AIGovernance",
          entityId: "FLAGS",
          detailsJson: JSON.stringify({ updated, reason }),
        },
      });
    } catch {}
  }

  return updated;
}

export function logAIUsage(record: AIUsageRecord): void {
  ensureAiDir();
  let logs: AIUsageRecord[] = [];
  if (fs.existsSync(USAGE_FILE)) {
    try {
      logs = JSON.parse(fs.readFileSync(USAGE_FILE, "utf8"));
    } catch {
      logs = [];
    }
  }

  logs.push(record);
  // Keep latest 1000 logs to prevent file bloat
  if (logs.length > 1000) logs = logs.slice(-1000);
  fs.writeFileSync(USAGE_FILE, JSON.stringify(logs, null, 2), "utf8");
}

export function listAIUsage(limit = 100): AIUsageRecord[] {
  ensureAiDir();
  if (!fs.existsSync(USAGE_FILE)) return [];
  try {
    const logs: AIUsageRecord[] = JSON.parse(fs.readFileSync(USAGE_FILE, "utf8"));
    return logs.slice(-limit).reverse();
  } catch {
    return [];
  }
}

export function listPendingHumanReviews(): AIHumanReviewItem[] {
  ensureAiDir();
  if (!fs.existsSync(REVIEWS_FILE)) return [];
  try {
    const items: AIHumanReviewItem[] = JSON.parse(fs.readFileSync(REVIEWS_FILE, "utf8"));
    return items.filter((i) => i.status === "PENDING");
  } catch {
    return [];
  }
}

export function listAllHumanReviews(limit = 50): AIHumanReviewItem[] {
  ensureAiDir();
  if (!fs.existsSync(REVIEWS_FILE)) return [];
  try {
    const items: AIHumanReviewItem[] = JSON.parse(fs.readFileSync(REVIEWS_FILE, "utf8"));
    return items.slice(-limit).reverse();
  } catch {
    return [];
  }
}

export function queueAIRecommendationForHumanReview(item: Omit<AIHumanReviewItem, "reviewId" | "createdAt" | "status">): AIHumanReviewItem {
  ensureAiDir();
  let items: AIHumanReviewItem[] = [];
  if (fs.existsSync(REVIEWS_FILE)) {
    try {
      items = JSON.parse(fs.readFileSync(REVIEWS_FILE, "utf8"));
    } catch {
      items = [];
    }
  }

  const reviewId = `EHRJ-AIR-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  const newItem: AIHumanReviewItem = {
    ...item,
    reviewId,
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };

  items.push(newItem);
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(items, null, 2), "utf8");
  return newItem;
}

export async function processHumanReviewDecision(params: {
  reviewId: string;
  reviewerName: string;
  reviewerUserId?: string;
  decision: "APPROVED" | "REJECTED" | "MODIFIED";
  decisionNotes?: string;
}): Promise<AIHumanReviewItem> {
  ensureAiDir();
  if (!fs.existsSync(REVIEWS_FILE)) throw new Error("Human reviews registry is empty.");
  const items: AIHumanReviewItem[] = JSON.parse(fs.readFileSync(REVIEWS_FILE, "utf8"));
  const idx = items.findIndex((i) => i.reviewId === params.reviewId);
  if (idx === -1) throw new Error(`Review item not found: ${params.reviewId}`);

  const item = items[idx];
  item.status = params.decision;
  item.reviewedBy = params.reviewerName;
  item.reviewedAt = new Date().toISOString();
  item.decisionNotes = params.decisionNotes || `Decision marked as ${params.decision}`;

  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(items, null, 2), "utf8");

  if (params.reviewerUserId) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: params.reviewerUserId,
          action: `AI_HUMAN_REVIEW_${params.decision}`,
          entityType: "AIHumanReview",
          entityId: item.reviewId,
          detailsJson: JSON.stringify({
            reviewId: item.reviewId,
            module: item.module,
            decision: params.decision,
            notes: item.decisionNotes,
          }),
        },
      });
    } catch {}
  }

  return item;
}
