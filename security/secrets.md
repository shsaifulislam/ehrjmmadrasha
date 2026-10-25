# EHRJ Digital Campus & ERP — Secrets & Configuration Audit

> **System:** Eliotgonj Hazi Rohmatollah Jamiria Madrasha Web Application & Enterprise ERP  
> **Status:** Authoritative Evidence-Based Security Audit  
> **Date:** October 2026

---

## 1. Inventory of Expected Secrets & Sensitive Configurations

The EHRJ platform relies on several categories of cryptographic keys, service credentials, and internal tokens:

| Secret Identifier | Secret Type | Sensitivity | Primary Consumer | Purpose |
| :--- | :--- | :---: | :--- | :--- |
| `DATABASE_URL` | Connection String / File Path | **HIGH** | Prisma Client (`src/lib/prisma.ts`) | Points to SQLite database file (`file:./dev.db`) |
| `JWT_SECRET` | 256-bit Symmetric Key | **CRITICAL** | Auth Engine (`src/lib/auth.ts`) | Signs and verifies user session JWTs via `jose` |
| `CRON_SECRET` | Bearer Token | **HIGH** | Scheduler / Cron Handlers | Authorizes background maintenance triggers |
| `WEBHOOK_SIGNING_SECRET` | HMAC Shared Secret | **CRITICAL** | Payment Engine (`src/lib/payment/*`) | Validates authenticity of bKash/Nagad callbacks |
| `SMTP_USER` / `SMTP_PASS` | Service Credentials | **HIGH** | Mailer (`src/lib/mail.ts`) | Relays transactional admission & notification emails |
| `BKASH_APP_KEY` / `_SECRET` | API Credentials | **CRITICAL** | Payment Adapter (`src/lib/payment/*`) | Authenticates checkout token grants with bKash |
| `BKASH_USERNAME` / `_PASSWORD` | HTTP Credentials | **CRITICAL** | Payment Adapter | Authorizes bKash API merchant session |
| `NAGAD_MERCHANT_ID` | Merchant Identifier | **HIGH** | Payment Adapter | Identifies institutional merchant account with Nagad |

---

## 2. Environment & Configuration Handling Audit

### 2.1 Centralized Validation Layer (`src/lib/env.ts`)
The application implements an environment validation layer in [`src/lib/env.ts`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/env.ts):

- **Fail-Fast Invariant for Production:**
  In production mode (`process.env.NODE_ENV === "production"`), `getJwtSecretBytes()` explicitly validates that `JWT_SECRET` is configured, has a minimum length of 32 characters, and does NOT match the known development fallback string.
  ```typescript
  if (isProduction()) {
    if (!rawSecret || rawSecret.length < 32 || rawSecret === INSECURE_FALLBACK_JWT) {
      throw new Error("FATAL SECURITY CONFIGURATION ERROR: JWT_SECRET must be explicitly set...");
    }
  }
  ```
- **Zero Insecure Fallbacks in Production:**
  For `CRON_SECRET` and `WEBHOOK_SIGNING_SECRET`, `src/lib/env.ts` returns `null` in production mode if unconfigured. This prevents attackers from using known repository fallback tokens to trigger internal cron jobs or forge fake payment webhook callbacks.

---

## 3. Vulnerability & Exposure Analysis

### 3.1 Hardcoded Secret Risks
- **Audit Findings:** No production API keys, database credentials, or private certificates are hardcoded into the source code.
- **Development Fallback Tokens:**
  Development fallback constants (`INSECURE_FALLBACK_JWT`, `INSECURE_FALLBACK_CRON`, `INSECURE_FALLBACK_WEBHOOK`) exist in `src/lib/env.ts` strictly to enable zero-configuration local developer booting and CI test runs. As verified above, production execution enforces runtime halts if these strings are supplied.

### 3.2 Client-Side Exposure Risks (`NEXT_PUBLIC_*`)
- Next.js exposes any environment variable prefixed with `NEXT_PUBLIC_` to browser bundles.
- **Codebase Inspection:**
  Only `NEXT_PUBLIC_APP_URL` is utilized across the frontend components for constructing canonical hyperlinks. Zero sensitive secrets, passwords, or cryptographic tokens carry the `NEXT_PUBLIC_` prefix.

### 3.3 Git & Source Code Repository Exposure Risks
- The repository root contains an active [`.gitignore`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/.gitignore) file that explicitly excludes:
  - `.env`
  - `.env*.local`
  - `.env.production`
  - `prisma/*.db`, `prisma/*.db-journal`, `prisma/*.db-wal`, `prisma/*.db-shm`
  - `backups/`
  - `node_modules/`
- **Verification:** A git status audit confirms that local SQLite database files and local environment files remain untracked.

### 3.4 Logging & Error Payload Leakage Risks
- **Audit Logging:** The `recordAuditLog` function in `src/lib/security.ts` records structured operational details. User passwords and raw hashes are strictly omitted before JSON serialization.
- **Database Query Errors:** Handlers catch Prisma exceptions and output user-friendly Bengali messages (e.g. `{ error: "ডাটাবেজ অপারেশনে সমস্যা দেখা দিয়েছে।" }`), preventing database schema paths and table structures from being leaked in response bodies.

---

## 4. Secret Lifecycle & Rotation Procedures

### 4.1 JWT Secret Rotation
When `JWT_SECRET` is rotated in production:
1. All currently active JWT session cookies become mathematically invalid.
2. The middleware will catch the verification error and redirect users to `/login`.
3. To ensure smooth rotation without abrupt mass disconnects, maintain a dual-secret verification array during a 24-hour transition window if required.

### 4.2 Webhook & MFS Secret Rotation
1. Update credentials in the bKash / Nagad merchant portal.
2. Update the environment variables in the host environment (`.env.production`).
3. Trigger application reload via process manager (`pm2 reload ehrj-app`).
