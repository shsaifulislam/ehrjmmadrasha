/**
 * EHRJ DIGITAL CAMPUS & ERP — CONFIGURATION & ENVIRONMENT VALIDATION LAYER
 * Centralized, fail-fast environment variable management.
 * Enforces production invariants, prevents silent fallbacks to insecure defaults,
 * and harmonizes public URLs across client and server.
 */

export interface AppEnv {
  NODE_ENV: "development" | "production" | "test";
  DATABASE_URL: string;
  JWT_SECRET: string;
  APP_URL: string;
  NEXT_PUBLIC_APP_URL: string;
  CRON_SECRET?: string;
  WEBHOOK_SIGNING_SECRET?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  // Payment Gateway Configurations (bKash & Nagad)
  BKASH_APP_KEY?: string;
  BKASH_APP_SECRET?: string;
  BKASH_USERNAME?: string;
  BKASH_PASSWORD?: string;
  BKASH_BASE_URL?: string;
  BKASH_MODE?: "SANDBOX" | "PRODUCTION";
  NAGAD_MERCHANT_ID?: string;
  NAGAD_BASE_URL?: string;
  NAGAD_MODE?: "SANDBOX" | "PRODUCTION";
}

const INSECURE_FALLBACK_JWT = "ehrj-madrasa-digital-campus-secure-production-jwt-secret-key-2026";
const INSECURE_FALLBACK_CRON = "ehrj-internal-cron-token";
const INSECURE_FALLBACK_WEBHOOK = "ehrj_demo_webhook_secret_2026";

export function getNodeEnv(): "development" | "production" | "test" {
  const env = process.env.NODE_ENV;
  if (env === "production" || env === "test") return env;
  return "development";
}

export function isProduction(): boolean {
  return getNodeEnv() === "production";
}

/**
 * Authoritative Public Application URL
 * Prioritizes NEXT_PUBLIC_APP_URL, then APP_URL, falling back safely.
 */
export function getAppUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (configuredUrl && configuredUrl.trim().length > 0) {
    return configuredUrl.trim().replace(/\/+$/, "");
  }
  if (isProduction()) {
    return "https://www.ehrjmadrasha.com";
  }
  return "http://localhost:3000";
}

/**
 * Returns JWT secret bytes. Enforces minimum 32 characters in production.
 * In production, halts execution if JWT_SECRET is missing or matches public fallback.
 */
export function getJwtSecretBytes(): Uint8Array {
  const rawSecret = process.env.JWT_SECRET?.trim();

  if (isProduction()) {
    if (!rawSecret || rawSecret.length < 32 || rawSecret === INSECURE_FALLBACK_JWT) {
      throw new Error(
        "FATAL SECURITY CONFIGURATION ERROR: JWT_SECRET must be explicitly set to a unique key of at least 32 characters in production mode."
      );
    }
    return new TextEncoder().encode(rawSecret);
  }

  // Development / Test fallback with explicit audit trail
  const fallback = rawSecret || INSECURE_FALLBACK_JWT;
  return new TextEncoder().encode(fallback);
}

/**
 * Returns Cron secret for scheduled operational maintenance.
 * In production, returns null if unconfigured to prevent unauthorized cron triggering.
 */
export function getCronSecret(): string | null {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret && secret.length > 0) return secret;
  if (isProduction()) {
    return null; // Production must NOT silently accept demo cron token
  }
  return INSECURE_FALLBACK_CRON;
}

/**
 * Returns Webhook HMAC signing secret for bKash/Nagad/Banking callbacks.
 * In production, returns null if unconfigured to prevent forged inbound webhooks.
 */
export function getWebhookSigningSecret(): string | null {
  const secret = process.env.WEBHOOK_SIGNING_SECRET?.trim();
  if (secret && secret.length > 0) return secret;
  if (isProduction()) {
    return null; // Production must NOT silently accept demo webhook secret
  }
  return INSECURE_FALLBACK_WEBHOOK;
}

/**
 * Validates critical configuration on startup or health checks.
 */
export function validateEnvironment(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.trim().length === 0) {
    errors.push("DATABASE_URL is missing or empty.");
  }

  const jwt = process.env.JWT_SECRET?.trim();
  if (isProduction()) {
    if (!jwt) {
      errors.push("JWT_SECRET is missing in production.");
    } else if (jwt.length < 32) {
      errors.push("JWT_SECRET must be at least 32 characters long in production.");
    } else if (jwt === INSECURE_FALLBACK_JWT) {
      errors.push("JWT_SECRET matches known repository fallback string in production.");
    }
  } else {
    if (!jwt) {
      warnings.push("JWT_SECRET is not set; using local development fallback.");
    }
  }

  const cron = getCronSecret();
  if (isProduction() && !cron) {
    warnings.push("CRON_SECRET is not configured; automated scheduled cron endpoints are blocked.");
  }

  const webhookSecret = getWebhookSigningSecret();
  if (isProduction() && !webhookSecret) {
    warnings.push("WEBHOOK_SIGNING_SECRET is not configured; inbound payment webhooks will be rejected.");
  }

  // Payment Gateway Production Validations (SECTION 5.1 & 5.2)
  if (isProduction()) {
    if (process.env.BKASH_MODE === "PRODUCTION") {
      if (!process.env.BKASH_APP_KEY || process.env.BKASH_APP_KEY.includes("***")) {
        errors.push("Production BKASH_APP_KEY is unconfigured or using placeholder value.");
      }
      if (!process.env.BKASH_APP_SECRET || process.env.BKASH_APP_SECRET.includes("***")) {
        errors.push("Production BKASH_APP_SECRET is unconfigured or using placeholder value.");
      }
      if (!process.env.BKASH_USERNAME || !process.env.BKASH_PASSWORD) {
        errors.push("Production BKASH credentials (username/password) are incomplete.");
      }
    } else {
      warnings.push("bKash payment gateway is running in SANDBOX mode.");
    }

    if (process.env.NAGAD_MODE === "PRODUCTION") {
      if (!process.env.NAGAD_MERCHANT_ID || process.env.NAGAD_MERCHANT_ID.includes("***")) {
        errors.push("Production NAGAD_MERCHANT_ID is unconfigured or using placeholder value.");
      }
      if (!process.env.NAGAD_BASE_URL) {
        warnings.push("NAGAD_BASE_URL is not configured; defaulting to production endpoint.");
      }
    } else {
      warnings.push("Nagad payment gateway is running in SANDBOX mode.");
    }

    if (!process.env.SMS_API_KEY && !process.env.SMS_GATEWAY_API_KEY) {
      warnings.push("SMS Gateway is unconfigured; SMS notifications will be routed to simulation mode.");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Resolves SQLite database file path from DATABASE_URL.
 * Handles "file:./dev.db", "file:/app/data/prod.db", "file:./prisma/dev.db" etc.
 */
export function getDatabaseFilePath(): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pathModule = require("path");
  const dbUrl = process.env.DATABASE_URL?.trim();
  if (dbUrl && dbUrl.startsWith("file:")) {
    const rawPath = dbUrl.substring(5);
    if (pathModule.isAbsolute(rawPath)) {
      return rawPath;
    }
    const clean = rawPath.replace(/^\.\//, "").replace(/\\/g, "/");
    const sub = clean.startsWith("prisma/") ? clean : `prisma/${clean}`;
    return pathModule.resolve(process.cwd(), sub);
  }
  return pathModule.join(process.cwd(), "prisma", "dev.db");
}

