/**
 * EHRJ DIGITAL CAMPUS & ERP — PRODUCTION READINESS & ENVIRONMENT AUDITOR
 * CLI Verification Tool for Production Deployment
 *
 * Usage:
 *   npx tsx scripts/verify-production-env.ts
 *   npx tsx scripts/verify-production-env.ts --env-file=.env.production
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

interface AuditResult {
  category: string;
  item: string;
  status: "PASS" | "WARN" | "FAIL";
  message: string;
  recommendation?: string;
}

const results: AuditResult[] = [];

function record(category: string, item: string, status: "PASS" | "WARN" | "FAIL", message: string, recommendation?: string) {
  results.push({ category, item, status, message, recommendation });
}

function loadEnvFile() {
  const args = process.argv.slice(2);
  let targetFile = ".env.production";
  for (const arg of args) {
    if (arg.startsWith("--file=")) {
      targetFile = arg.split("=")[1];
    } else if (arg.startsWith("--env-file=")) {
      targetFile = arg.split("=")[1];
    }
  }

  const filePath = path.resolve(process.cwd(), targetFile);
  if (fs.existsSync(filePath)) {
    console.log(`[INFO] Loading environment file: ${targetFile}`);
    const content = fs.readFileSync(filePath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        let val = trimmed.substring(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  } else {
    // Fall back to .env if .env.production does not exist
    const fallbackPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(fallbackPath)) {
      console.log(`[INFO] ${targetFile} not found. Falling back to .env`);
      const content = fs.readFileSync(fallbackPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx > 0) {
          const key = trimmed.substring(0, eqIdx).trim();
          let val = trimmed.substring(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    } else {
      console.log(`[INFO] No .env or ${targetFile} found on disk. Checking active process.env.`);
    }
  }
}

async function auditProductionEnvironment() {
  loadEnvFile();

  console.log("==================================================================");
  console.log("  EHRJ DIGITAL CAMPUS — PRODUCTION ENVIRONMENT AUDIT");
  console.log("==================================================================\n");

  const cwd = process.cwd();

  // 1. Core Server & Node Environment
  const nodeEnv = process.env.NODE_ENV || "development";
  if (nodeEnv === "production") {
    record("Runtime", "NODE_ENV", "PASS", "NODE_ENV is set to production");
  } else {
    record("Runtime", "NODE_ENV", "WARN", `Current NODE_ENV is '${nodeEnv}'. Ensure NODE_ENV=production in live deployment.`, "Set NODE_ENV=production in systemd/docker/env");
  }

  // 2. Public URLs & HTTPS enforcement
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    record("Security", "APP_URL", "FAIL", "APP_URL / NEXT_PUBLIC_APP_URL is missing.", "Configure APP_URL=https://your-domain.edu.bd");
  } else if (!appUrl.startsWith("https://") && nodeEnv === "production") {
    record("Security", "APP_URL", "FAIL", `APP_URL (${appUrl}) is not using HTTPS.`, "SSL/TLS certificate required for production security headers and cookies.");
  } else if (appUrl.endsWith("/")) {
    record("Configuration", "APP_URL", "WARN", "APP_URL contains a trailing slash.", "Remove trailing slash to avoid double-slash URL redirects.");
  } else {
    record("Security", "APP_URL", "PASS", `APP_URL correctly set to ${appUrl}`);
  }

  // 3. Cryptographic Secrets & JWT
  const jwtSecret = process.env.JWT_SECRET?.trim();
  const INSECURE_JWT = "ehrj-madrasa-digital-campus-secure-production-jwt-secret-key-2026";
  if (!jwtSecret) {
    record("Security", "JWT_SECRET", "FAIL", "JWT_SECRET is completely missing.", "Generate with: openssl rand -base64 48");
  } else if (jwtSecret === INSECURE_JWT) {
    record("Security", "JWT_SECRET", "FAIL", "JWT_SECRET matches known repository fallback token.", "Generate a unique secret: openssl rand -base64 48");
  } else if (jwtSecret.length < 32) {
    record("Security", "JWT_SECRET", "FAIL", `JWT_SECRET is only ${jwtSecret.length} characters (minimum required: 32).`, "Use high-entropy string: openssl rand -hex 32");
  } else {
    record("Security", "JWT_SECRET", "PASS", `JWT_SECRET is cryptographically sound (${jwtSecret.length} chars).`);
  }

  // 4. Webhook Signing Secret
  const webhookSecret = process.env.WEBHOOK_SIGNING_SECRET?.trim();
  const INSECURE_WEBHOOK = "ehrj_demo_webhook_secret_2026";
  if (!webhookSecret) {
    record("Payment Security", "WEBHOOK_SIGNING_SECRET", "WARN", "WEBHOOK_SIGNING_SECRET is missing. Inbound payment callbacks will fail verification.", "Set a strong shared HMAC key with gateway providers.");
  } else if (webhookSecret === INSECURE_WEBHOOK) {
    record("Payment Security", "WEBHOOK_SIGNING_SECRET", "WARN", "Using default demo webhook signing secret.", "Generate dedicated key: openssl rand -hex 32");
  } else {
    record("Payment Security", "WEBHOOK_SIGNING_SECRET", "PASS", "WEBHOOK_SIGNING_SECRET is configured.");
  }

  // 5. Automated Operational Cron Token
  const cronSecret = process.env.CRON_SECRET?.trim();
  const INSECURE_CRON = "ehrj-internal-cron-token";
  if (!cronSecret) {
    record("Security", "CRON_SECRET", "WARN", "CRON_SECRET is missing. Background maintenance and backup crons cannot be remotely invoked safely.", "Set a secret bearer token: openssl rand -hex 24");
  } else if (cronSecret === INSECURE_CRON) {
    record("Security", "CRON_SECRET", "WARN", "Using public demo CRON_SECRET.", "Change to private token.");
  } else {
    record("Security", "CRON_SECRET", "PASS", "CRON_SECRET is configured.");
  }

  // 6. Database Storage & Persistence
  const dbUrl = process.env.DATABASE_URL?.trim();
  if (!dbUrl) {
    record("Database", "DATABASE_URL", "FAIL", "DATABASE_URL is missing.", "Configure DATABASE_URL=file:/var/lib/ehrj/prod.db or file:./prisma/prod.db");
  } else {
    record("Database", "DATABASE_URL", "PASS", `DATABASE_URL configured: ${dbUrl}`);

    // Check directory writability
    let resolvedPath = dbUrl.replace(/^file:/, "");
    if (!path.isAbsolute(resolvedPath)) {
      resolvedPath = path.resolve(cwd, resolvedPath.startsWith("prisma/") ? resolvedPath : path.join("prisma", resolvedPath));
    }
    const dbDir = path.dirname(resolvedPath);
    try {
      if (fs.existsSync(dbDir)) {
        fs.accessSync(dbDir, fs.constants.W_OK);
        record("Database", "Filesystem Storage", "PASS", `Database directory (${dbDir}) is writable.`);
      } else {
        record("Database", "Filesystem Storage", "WARN", `Database directory (${dbDir}) does not exist yet. Ensure parent directory permissions allow creation.`);
      }
    } catch {
      record("Database", "Filesystem Storage", "FAIL", `Database directory (${dbDir}) is NOT writable by current user.`, "Run: chmod -R 755 " + dbDir);
    }
  }

  // 7. Payment Gateways (bKash & Nagad)
  const bkashMode = process.env.BKASH_MODE || "SANDBOX";
  if (bkashMode === "PRODUCTION") {
    if (!process.env.BKASH_APP_KEY || process.env.BKASH_APP_KEY.includes("***")) {
      record("Payment (bKash)", "BKASH_APP_KEY", "FAIL", "Production BKASH_APP_KEY is unconfigured.");
    }
    if (!process.env.BKASH_APP_SECRET || process.env.BKASH_APP_SECRET.includes("***")) {
      record("Payment (bKash)", "BKASH_APP_SECRET", "FAIL", "Production BKASH_APP_SECRET is unconfigured.");
    }
    if (!process.env.BKASH_USERNAME || !process.env.BKASH_PASSWORD) {
      record("Payment (bKash)", "BKASH_CREDENTIALS", "FAIL", "Production bKash username or password missing.");
    }
  } else {
    record("Payment (bKash)", "BKASH_MODE", "WARN", "bKash is operating in SANDBOX mode. Live financial transactions are not active.", "Set BKASH_MODE=PRODUCTION and provide merchant keys when ready for live launch.");
  }

  const nagadMode = process.env.NAGAD_MODE || "SANDBOX";
  if (nagadMode === "PRODUCTION") {
    if (!process.env.NAGAD_MERCHANT_ID || process.env.NAGAD_MERCHANT_ID.includes("***")) {
      record("Payment (Nagad)", "NAGAD_MERCHANT_ID", "FAIL", "Production NAGAD_MERCHANT_ID is unconfigured.");
    }
  } else {
    record("Payment (Nagad)", "NAGAD_MODE", "WARN", "Nagad is operating in SANDBOX mode.", "Set NAGAD_MODE=PRODUCTION and configure merchant ID for live launch.");
  }

  // 8. Communication (Email / SMS)
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass) {
    record("Notifications", "SMTP (Email)", "WARN", "SMTP_USER or SMTP_PASS is missing. Email dispatch will operate in simulation/mock mode.", "Configure Gmail App Password or SMTP credentials in .env.production");
  } else {
    record("Notifications", "SMTP (Email)", "PASS", `SMTP configured for sender: ${smtpUser}`);
  }

  const smsKey = process.env.SMS_API_KEY || process.env.SMS_GATEWAY_API_KEY;
  if (!smsKey) {
    record("Notifications", "SMS Gateway", "WARN", "SMS API key is not configured. Parental SMS notifications will be routed to simulation logs.", "Configure SMS_API_KEY and SMS_SENDER_ID for automated mobile messaging.");
  } else {
    record("Notifications", "SMS Gateway", "PASS", "SMS Gateway API key is configured.");
  }

  // Output formatting
  console.log("------------------------------------------------------------------");
  console.log("AUDIT RESULTS:");
  console.log("------------------------------------------------------------------");

  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  for (const r of results) {
    const symbol = r.status === "PASS" ? "✔ [PASS]" : r.status === "WARN" ? "⚠ [WARN]" : "✖ [FAIL]";
    console.log(`${symbol} [${r.category}] ${r.item}: ${r.message}`);
    if (r.recommendation) {
      console.log(`         ↳ Action: ${r.recommendation}`);
    }
    if (r.status === "PASS") passCount++;
    if (r.status === "WARN") warnCount++;
    if (r.status === "FAIL") failCount++;
  }

  console.log("\n==================================================================");
  console.log(`SUMMARY: ${passCount} Passed | ${warnCount} Warnings | ${failCount} Failures`);
  if (failCount > 0) {
    console.log("STATUS: BLOCKED — Critical production configuration errors detected.");
    console.log("Resolve all [FAIL] items before deploying to public production.");
    console.log("==================================================================");
    process.exit(1);
  } else if (warnCount > 0) {
    console.log("STATUS: READY WITH ADVISORIES — System can launch (e.g., Sandbox / Staging).");
    console.log("Review [WARN] items before taking real commercial transactions.");
    console.log("==================================================================");
  } else {
    console.log("STATUS: 100% PRODUCTION READY — All strict security invariants passed.");
    console.log("==================================================================");
  }
}

auditProductionEnvironment().catch((err) => {
  console.error("Fatal audit error:", err);
  process.exit(1);
});
