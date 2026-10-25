# EHRJ Digital Campus & ERP — Environments & Configuration Specification
**Document Version:** 1.0.0  
**Target Architecture:** Next.js 14 (App Router) + SQLite 3 (WAL) + Prisma ORM + PM2 + Nginx  
**Production Domain:** `https://www.ehrjmadrasha.com`  

---

## 1. Environments Overview

| Parameter | Development (`development`) | Staging (`staging`) | Production (`production`) |
| :--- | :--- | :--- | :--- |
| **Status** | **VERIFIED & ACTIVE** | **UNKNOWN / NOT IMPLEMENTED** | **VERIFIED & ACTIVE** |
| **Host Target** | Local Workstation | N/A (No separate staging cluster) | VPS (Ubuntu 22.04/24.04 LTS) or Docker Container |
| **Process Manager** | Next.js CLI (`npm run dev`) | N/A | PM2 (`deployment/ecosystem.config.js`) or Docker |
| **Port** | `3000` | N/A | `3000` (Internal) -> `443` (Nginx Reverse Proxy) |
| **Database** | SQLite `file:./dev.db` | N/A | SQLite `file:./prisma/prod.db` or `/app/data/prod.db` |
| **Domain Base URL** | `http://localhost:3000` | N/A | `https://www.ehrjmadrasha.com` |
| **Prisma Logging** | `["warn", "error"]` | N/A | `["error"]` |
| **Secrets Enforcement** | Fallbacks permitted with console warnings | N/A | **Strict Fail-Fast**: Execution halts on invalid secrets |
| **Cron Execution** | Internal fallback token permitted | N/A | Strict: Endpoints reject if `CRON_SECRET` is unset |
| **Webhooks Execution**| Internal fallback token permitted | N/A | Strict: Callbacks reject if `WEBHOOK_SIGNING_SECRET` unset |
| **Payment Gateway** | bKash/Nagad SANDBOX Mode | N/A | bKash/Nagad PRODUCTION (or SANDBOX with warning) |

> [!IMPORTANT]
> **Staging Environment Notice:** There is no dedicated staging environment or separate staging configuration file in this repository. Staging testing is currently performed on local developer environments running production builds (`npm run build && npm run start`) or test runners (`npm run test:phase12` through `test:phase41`).

---

## 2. Environment Variables Catalog

The application uses centralized, fail-fast configuration validation via [`src/lib/env.ts`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/env.ts) and [`src/instrumentation.ts`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/instrumentation.ts).

### 2.1 Core Application Runtime

| Variable | Type | Default / Fallback | Production Requirement | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | String | `"development"` | `"production"` | Controls optimization, caching, logging, and strict security assertions. |
| `PORT` | Integer | `3000` | `3000` | Internal HTTP listening port for Next.js server. |
| `APP_URL` | URL String | `http://localhost:3000` | `https://www.ehrjmadrasha.com` | Base URL used for server-side link generation, QR codes, and notifications. |
| `NEXT_PUBLIC_APP_URL`| URL String | Falls back to `APP_URL` | `https://www.ehrjmadrasha.com` | Client-accessible base URL for metadata, sitemaps, OpenGraph, and API calls. |
| `NEXT_PUBLIC_APP_NAME`| String | `ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা` | Same | Institutional title displayed on public headers and PWA manifest. |

### 2.2 Database & Persistence

| Variable | Type | Default / Fallback | Production Requirement | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Connection String | `"file:./dev.db"` | `"file:./prisma/prod.db"` (Host) or `"file:/app/data/prod.db"` (Docker) | SQLite datasource path read by Prisma Client. Directory must be writable. |

### 2.3 Security & Cryptographic Secrets

| Variable | Type | Default / Fallback | Production Requirement | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `JWT_SECRET` | Secret String | `ehrj-madrasa-digital-campus-secure-production-jwt-secret-key-2026` (Dev only) | **MANDATORY**: Minimum 32 characters, unique, non-default | Cryptographic key used to sign and verify administrative and user JWT session tokens. In production, server crashes if missing or equal to repo default. |
| `CRON_SECRET` | Secret String | `ehrj-internal-cron-token` (Dev only) | **MANDATORY for scheduled tasks**: Unique string | Bearer token required in `Authorization` header for `/api/admin/operations/cron` maintenance jobs. |
| `WEBHOOK_SIGNING_SECRET`| Secret String | `ehrj_demo_webhook_secret_2026` (Dev only) | **MANDATORY for online payments**: Unique string | HMAC secret key used to verify authenticity of inbound payment provider webhooks. |

### 2.4 Communications & Mail Relay (SMTP)

| Variable | Type | Default / Fallback | Production Requirement | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `SMTP_HOST` | Hostname | `smtp.gmail.com` | Official SMTP relay host | Outgoing email server. |
| `SMTP_PORT` | Integer | `587` | `587` (TLS) or `465` (SSL) | SMTP port. |
| `SMTP_USER` | Email | `adminehrjmadrasha@gmail.com` | Official institutional email | SMTP authentication username. |
| `SMTP_PASS` | Password | Local app password | App-specific password | SMTP authentication secret. |
| `SMTP_FROM` | String | `ইলিয়টগঞ্জ মাদরাসা অফিসিয়াল <info@ehrjmadrasha.com>` | Official display address | Default sender header in outgoing parent/teacher notification emails. |
| `ADMIN_EMAIL` | Email | `adminehrjmadrasha@gmail.com` | Designated sysadmin email | Destination for critical operational, security, and financial alert emails. |

### 2.5 Payment Gateway (bKash & Nagad)

| Variable | Type | Default / Fallback | Production Requirement | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `BKASH_APP_KEY` | String | Unset (Sandbox mock) | Live API Key from bKash | Merchant API identifier. Required if `BKASH_MODE=PRODUCTION`. |
| `BKASH_APP_SECRET` | Secret String | Unset (Sandbox mock) | Live API Secret | Merchant API secret. Required if `BKASH_MODE=PRODUCTION`. |
| `BKASH_USERNAME` | String | Unset | Merchant Username | Merchant authentication. |
| `BKASH_PASSWORD` | Password | Unset | Merchant Password | Merchant authentication. |
| `BKASH_BASE_URL` | URL String | Sandbox URL | `https://tokenized.pay.bka.sh/v1.2.0-beta` | bKash gateway endpoint. |
| `BKASH_MODE` | Enum | `"SANDBOX"` | `"PRODUCTION"` or `"SANDBOX"` | Toggles live gateway vs local sandbox mock. |
| `NAGAD_MERCHANT_ID` | String | Unset | Live Merchant ID | Nagad merchant identifier. |
| `NAGAD_BASE_URL` | URL String | Sandbox URL | Nagad production URL | Nagad gateway endpoint. |
| `NAGAD_MODE` | Enum | `"SANDBOX"` | `"PRODUCTION"` or `"SANDBOX"` | Toggles Nagad live vs sandbox mode. |

---

## 3. Secrets Handling & Storage

### 3.1 What is Verified
- In development, environment variables are loaded from `.env` at the project root.
- A production template exists at [`deployment/production.env.example`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/deployment/production.env.example).
- Startup validation in [`src/instrumentation.ts`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/instrumentation.ts) actively blocks production startup if `JWT_SECRET` is insecure or shorter than 32 characters.
- In Docker deployments, secrets can be passed via environment variables in `docker-compose.yml` or Docker secrets.

### 3.2 What is Unknown / Needs Confirmation
- **Cloud Secrets Manager:** There is no integration with HashiCorp Vault, AWS Secrets Manager, or Doppler in the repository code. Secrets are currently managed via local host filesystem `.env` files.
- **Secret Rotation Automation:** Automated rotation of JWT or Cron secrets is not currently scripted; rotation requires manual update of `.env` followed by a process restart.

---

## 4. Required Runtime Services & System Dependencies

1. **Node.js Runtime:** Version `20.x` LTS.
2. **Nginx Reverse Proxy:** Version `1.22+` with TLS 1.2/1.3 and HTTP/2 support.
3. **PM2 Process Manager:** Global npm package (`npm install -g pm2`).
4. **Certbot:** `certbot` and `python3-certbot-nginx` for automated Let's Encrypt SSL.
5. **Storage System:** Local POSIX or Windows file system with write permissions on:
   - `prisma/` (for SQLite database, WAL, and SHM files)
   - `backups/` (for automated and manual database snapshots)
   - `public/uploads/` (for institutional file, signature, and avatar uploads)
