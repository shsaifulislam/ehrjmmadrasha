/**
 * EHRJ DIGITAL CAMPUS & ERP — PHASE 28
 * Secure API Key & Least-Privilege Scope Manager
 *
 * Core Governance Invariants:
 * 1. Store ONLY cryptographic SHA-256 hashes of API keys.
 * 2. Raw keys are returned exactly ONCE upon creation.
 * 3. NO PRIVILEGE ESCALATION: External keys cannot modify roles, RBAC, or user admin.
 * 4. Enforce strict rate limits and scope verification on every request.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { ApiKeyRecord, ApiScope, IntegrationEnvironment } from "./types";
import { recordAuditLog, checkRateLimit } from "@/lib/security";

const DATA_DIR = path.join(process.cwd(), "data", "integrations");
const API_KEYS_FILE = path.join(DATA_DIR, "api_keys.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadApiKeys(): ApiKeyRecord[] {
  ensureDir();
  if (!fs.existsSync(API_KEYS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(API_KEYS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse api_keys.json:", err);
    return [];
  }
}

export function saveApiKeys(keys: ApiKeyRecord[]): void {
  ensureDir();
  fs.writeFileSync(API_KEYS_FILE, JSON.stringify(keys, null, 2), "utf-8");
}

function hashKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

export async function createApiKey(params: {
  name: string;
  owner: string;
  ownerType: "EXTERNAL_INSTITUTION" | "VENDOR_PARTNER" | "INTERNAL_SERVICE";
  scopes: ApiScope[];
  environment?: IntegrationEnvironment;
  rateLimitPerMin?: number;
  validDays?: number;
  createdBy: string;
}): Promise<{ record: ApiKeyRecord; rawKey: string }> {
  ensureDir();
  const keys = loadApiKeys();

  const env = params.environment || "PRODUCTION";
  const prefixType = env === "PRODUCTION" ? "live" : "test";
  const randomEntropy = crypto.randomBytes(24).toString("hex");
  const rawKey = `ehrj_${prefixType}_${randomEntropy}`;

  const keyPrefix = rawKey.substring(0, 16) + "...";
  const keyHash = hashKey(rawKey);

  const expiresDate = new Date();
  expiresDate.setDate(expiresDate.getDate() + (params.validDays || 180));

  const keyId = `KEY-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

  const newRecord: ApiKeyRecord = {
    id: keyId,
    name: params.name,
    keyPrefix,
    keyHash,
    owner: params.owner,
    ownerType: params.ownerType,
    scopes: params.scopes,
    environment: env,
    rateLimitPerMin: params.rateLimitPerMin || 60,
    status: "ACTIVE",
    expiresAt: expiresDate.toISOString(),
    createdBy: params.createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  keys.push(newRecord);
  saveApiKeys(keys);

  await recordAuditLog({
    userId: params.createdBy,
    action: "CREATE_API_KEY",
    entityType: "ApiKey",
    entityId: keyId,
    details: {
      name: params.name,
      owner: params.owner,
      scopes: params.scopes,
      environment: env,
      expiresAt: newRecord.expiresAt,
    },
  });

  return { record: newRecord, rawKey };
}

export async function revokeApiKey(
  id: string,
  actorId: string,
  reason: string
): Promise<ApiKeyRecord> {
  const keys = loadApiKeys();
  const index = keys.findIndex((k) => k.id === id);
  if (index === -1) {
    throw new Error(`API key with ID ${id} not found.`);
  }

  keys[index].status = "REVOKED";
  keys[index].revokedAt = new Date().toISOString();
  keys[index].revokedReason = reason;
  keys[index].updatedAt = new Date().toISOString();

  saveApiKeys(keys);

  await recordAuditLog({
    userId: actorId,
    action: "REVOKE_API_KEY",
    entityType: "ApiKey",
    entityId: id,
    details: {
      name: keys[index].name,
      reason,
    },
  });

  return keys[index];
}

export function validateApiKey(
  rawKey: string,
  requiredScope?: ApiScope
): {
  valid: boolean;
  record?: ApiKeyRecord;
  error?: string;
  rateLimitRemaining?: number;
} {
  if (!rawKey || typeof rawKey !== "string" || !rawKey.startsWith("ehrj_")) {
    return { valid: false, error: "অবৈধ বা অনুপস্থিত এপিআই কী ফরম্যাট।" };
  }

  const keys = loadApiKeys();
  const inputHash = hashKey(rawKey.trim());
  const recordIndex = keys.findIndex((k) => k.keyHash === inputHash);

  if (recordIndex === -1) {
    return { valid: false, error: "এপিআই কী সঠিক নয় অথবা ডাটাবেজে পাওয়া যায়নি।" };
  }

  const record = keys[recordIndex];

  // 1. Status Check
  if (record.status !== "ACTIVE") {
    return {
      valid: false,
      error: `এপিআই কী বর্তমানে নিষ্ক্রিয় (${record.status === "REVOKED" ? "বাতিলকৃত" : record.status})।`,
    };
  }

  // 2. Expiration Check
  if (new Date(record.expiresAt).getTime() < Date.now()) {
    return { valid: false, error: "এপিআই কী এর মেয়াদ উত্তীর্ণ হয়েছে।" };
  }

  // 3. Scope Verification
  if (requiredScope && !record.scopes.includes(requiredScope)) {
    return {
      valid: false,
      error: `অননুমোদিত স্কোপ। এই অপারেশনের জন্য '${requiredScope}' স্কোপ আবশ্যক।`,
    };
  }

  // 4. Rate Limiting Check
  const rateLimitKey = `api_key:${record.id}`;
  const rateLimitResult = checkRateLimit(rateLimitKey, record.rateLimitPerMin, 60000);
  if (!rateLimitResult.allowed) {
    return {
      valid: false,
      error: `এপিআই রেট লিমিট অতিক্রান্ত হয়েছে (${record.rateLimitPerMin} requests/min)। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।`,
    };
  }

  // 5. Update lastUsedAt asynchronously
  record.lastUsedAt = new Date().toISOString();
  keys[recordIndex] = record;
  saveApiKeys(keys);

  return {
    valid: true,
    record,
    rateLimitRemaining: rateLimitResult.remaining,
  };
}
