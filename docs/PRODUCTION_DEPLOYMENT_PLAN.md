# EHRJ MADRASHA ERP — PRODUCTION DEPLOYMENT PLAN
## Infrastructure Architecture, Hosting Topology, Secret Management & Release Engineering

**Document ID:** `EHRJ-DEPLOYMENT-PLAN-01`  
**Date:** October 18, 2026  
**Status:** **DEPLOYMENT STAGING PROPOSAL (AWAITING INFRASTRUCTURE PROVISIONING)**  
**Target Domain:** `https://www.ehrjmadrasha.com` (Apex & Subdomain SSL)  
**Target Host:** Linux VPS (Ubuntu 22.04/24.04 LTS) or Containerized Cluster  

---

## 1. Production Architecture & Topology

```
                     [ Public Internet / Android Clients ]
                                       │
                                       ▼ HTTPS (Port 443)
                         ┌──────────────────────────┐
                         │   Cloudflare CDN / DNS   │ (DDoS Protection, Edge SSL)
                         └─────────────┬────────────┘
                                       │
                                       ▼ Strict TLS / Let's Encrypt
                         ┌──────────────────────────┐
                         │   Nginx Reverse Proxy    │ (Rate limiting, Static caching,
                         │    (Ubuntu 24.04 LTS)    │  Security Headers, Gzip/Brotli)
                         └─────────────┬────────────┘
                                       │
                                       ▼ HTTP Proxy (Port 3000)
                         ┌──────────────────────────┐
                         │   Next.js 14 App Router  │
                         │    (PM2 Cluster Mode)    │ (SSR, API Handlers, SWR)
                         └─────────────┬────────────┘
                                       │
                         ┌─────────────┴────────────┐
                         │                          │
                         ▼                          ▼
               ┌───────────────────┐      ┌───────────────────┐
               │ Managed Database  │      │ Persistent Object │
               │ (PostgreSQL 15+)  │      │ Storage / Uploads │
               │ (Prisma Client)   │      │ (/var/data/uploads│
               └───────────────────┘      └───────────────────┘
```

---

## 2. Infrastructure & Hosting Requirements

### 2.1 Hardware Sizing (Recommended Baseline)
- **CPU:** 4 vCPU (x86_64 or ARM64)
- **RAM:** 8 GB (Minimum 4 GB for Node.js + Prisma Engine memory stability)
- **Storage:** 80 GB NVMe SSD (ext4 with daily automated snapshots)
- **Network:** 1 Gbps port with static IPv4 and IPv6

### 2.2 Process Management (PM2 Configuration)
Reference: [`deployment/ecosystem.config.js`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/deployment/ecosystem.config.js):
- Application instances: `max` (or 2 workers on 4 vCPU to balance database connections)
- Auto-restart on memory limit: `max_memory_restart: '1G'`
- Error & out log rotation via `pm2-logrotate` (10MB max per log, keep 14 rotated archives).

### 2.3 Nginx Web Server & TLS Termination
Reference: [`deployment/nginx.conf`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/deployment/nginx.conf):
- Enforce HTTP to HTTPS automatic redirection (`301 Moved Permanently`).
- TLS 1.2 and TLS 1.3 only; modern cipher suites (`ECDHE-ECDSA-AES128-GCM-SHA256`).
- Upload limits: `client_max_body_size 10M;`
- Static asset caching: `/_next/static/` cached with `expires 365d; add_header Cache-Control "public, immutable";`.

---

## 3. Environment Variables & Secret Management

All production secrets must be provisioned through systemd service files, Doppler, or Docker secret vaults. **No secret must be committed to git.**

### Mandatory Production Secrets:
| Environment Variable | Minimum Requirement | Purpose |
| :--- | :--- | :--- |
| `NODE_ENV` | Must be `"production"` | Enables optimizations, strict security assertions, minimal logging |
| `APP_URL` | Must be `"https://www.ehrjmadrasha.com"` | Authoritative URL for QR generation, webhooks, and notifications |
| `DATABASE_URL` | Valid PostgreSQL or secured SQLite URI | Database datasource connection string |
| `JWT_SECRET` | Minimum 32 high-entropy chars (`openssl rand -base64 48`) | Signs session tokens; server halts if default key detected |
| `CRON_SECRET` | 32-character random token | Authenticates automated administrative maintenance tasks |
| `WEBHOOK_SIGNING_SECRET`| 32-character HMAC secret | Validates authentic payment gateway callbacks |

### Secret Rotation Procedure:
1. Generate new candidate secret (`openssl rand -base64 48`).
2. Deploy code with dual-verification window if migrating JWT secrets, or schedule a 1-minute maintenance window for immediate token invalidation and re-login.
3. Update production environment manager and reload process (`pm2 reload ecosystem.config.js --update-env`).

---

## 4. Persistent Storage for Uploads and Media

- **Upload Path:** `/var/www/ehrj-campus/public/uploads`
- **Subdirectories:**
  - `signatures/`: Principal and official authority digital signatures.
  - `students/`: Official student admission photographs.
  - `documents/`: Scanned birth certificates and guardian NID documents.
- **Permissions:** `chown -R www-data:www-data /var/www/ehrj-campus/public/uploads` with directory mode `0755` and file mode `0644`. Execution of scripts inside upload folders is disabled at the Nginx level.

---

## 5. Monitoring, Health Checks & Operational Telemetry

1. **System Health Endpoint:** `GET /api/health`
   - Returns 200 OK with uptime, memory consumption, database connectivity, and component health.
2. **Operations Dashboard:**
   - Accessible to `ADMIN` and `PRINCIPAL` at `/admin` (Operations Hub).
   - Monitors backup status, incident response logs, disk space, and slow query logs.
3. **Automated Alerting:**
   - Uptime monitor (e.g. UptimeRobot or BetterStack) polling `https://www.ehrjmadrasha.com/api/health` every 60 seconds.
   - Immediate notification dispatched upon 2 consecutive failures.

---

## 6. Mobile Application (Flutter) Production Configuration

1. **Production Base URL:**
   - Pre-configured in `lib/data/repositories/api_repository.dart` pointing to `https://www.ehrjmadrasha.com`.
   - In-app dynamic endpoint switcher allows authorized administrators to point to staging or local test clusters for offline verification.
2. **Secure Token Storage:**
   - Session tokens stored in `flutter_secure_storage` (Android Keystore / iOS Keychain).
   - Tokens transmit via standard `Authorization: Bearer <token>` HTTP headers.
3. **Release Distribution:**
   - Built with `flutter build apk --release` (or `appbundle` for Google Play Console).
   - Signed with the institutional release keystore (`ehrj-release-key.jks`).

---

## 7. Staging Validation & Release Approval Gate

```
[STAGING VALIDATION RUN]
         │
         ├──── 1. Run Automated Checks (npx tsc --noEmit && flutter test)
         │
         ├──── 2. Verify Database Backup (PRAGMA wal_checkpoint + createDatabaseBackup)
         │
         ├──── 3. Deploy to Staging Target
         │
         ├──── 4. Execute 10 Core Modules Integration Suite
         │
         ├──── 5. Device Verification on Pixel 7 Client
         │
         ├──── 6. Institutional Sign-Off (Principal & Managing Committee)
         │
         └──── 7. Execute Production Cutover
```

---

## 8. Phase 6 Staging Verification Outcomes & Cloud Database Recommendation

Following Phase 6 isolated staging tests (`docs/PHASE_6_POSTGRESQL_STAGING_REPORT.md`):

1. **Database Compatibility:**
   - **PostgreSQL 15+ / 18+ Compatibility:** 100% verified across 123 models and 11,994 records.
   - **Financial Ledger Parity:** Verified exact match (৳ 424,095).
   - **Foreign Key Integrity:** 0 broken relations or orphan records.
2. **Recommended Cloud Database Providers:**
   - **Option A (Managed Cloud - Recommended):** Neon Serverless PostgreSQL or Supabase Database (pgvector, automated point-in-time recovery, connection pooling with PgBouncer).
   - **Option B (Self-Hosted VPS):** Managed PostgreSQL 16 on Ubuntu 24.04 LTS (16 GB RAM, 4 vCPU, NVMe storage) with daily automated pg_dump to encrypted object storage.
3. **Database Access Restrictions:**
   - PostgreSQL must only listen on `127.0.0.1` (or private VPC subnet).
   - Public internet access to port `5432` must be blocked by firewall (`ufw deny 5432`).
   - SSL connection enforcement (`sslmode=require`).

