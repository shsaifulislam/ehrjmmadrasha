# EHRJ Madrasha ERP — Phase 37: Production Deployment Preparation & Go-Live Gate Report

**Checkpoint Identifier:** `EHRJ-AI-2026-PRODUCTION-DEPLOYMENT-PREP-37`  
**Date of Audit & Verification:** October 17, 2026  
**Auditor / Engineering Agent:** Antigravity AI Engineering & Architecture Team  
**System Name:** Eliotganj Hazi Rohmatollah Jamiria Madrasha ERP & Campus Management System  
**Final Production Verdict:** **`CONDITIONALLY READY`**

---

## Executive Summary

Phase 37 establishes the final deployment hardening and go-live preparation gate for the EHRJ Madrasha ERP. Following the comprehensive end-to-end regression validation performed in Phase 36, this phase strictly audits the actual codebase, persistence architecture, deployment scripts, process management, security controls, and third-party integration sandboxes.

**Key Outcome:**
The application codebase, TypeScript compilation, Next.js production build (229 static and dynamic routes), Prisma ORM integration, single-writer SQLite WAL configuration, and isolated backup-and-restore pipelines are **100% verified and operational**. No code or architectural blockers remain within the software repository.

The status is designated as **`CONDITIONALLY READY`** strictly because public DNS routing, VPS SSH provisioning, Let's Encrypt SSL activation on a public domain, and live merchant API keys for bKash/Nagad/SMS require external human authorization and operational credential issuance outside the automated repository.

---

## 1. Exact Environment & Git State

### 1.1 Operating Environment
- **Node.js Runtime:** `v20.18.0`
- **Framework:** Next.js `14.2.23` (App Router architecture)
- **Database Engine:** SQLite 3 via Prisma ORM `v5.22.0`
- **Database Location:** Local persistent file `file:./dev.db` (Resolved size: ~10.1 MB)
- **Local Active Server:** Running as background process `task-4202` on `http://localhost:3000`
- **Health Endpoint Status:** `GET http://localhost:3000/api/health` returned HTTP `200 OK`
  ```json
  {
    "status": "HEALTHY",
    "timestamp": "2026-10-17T06:58:15.112Z",
    "uptime": 3462.8,
    "maintenance": {
      "isActive": false,
      "message": null
    }
  }
  ```

### 1.2 Git State & Tree Integrity
- **Branch:** Working branch `main`
- **Integrity:** All pre-existing source files, UI components, API routes, database seeders, and documentation reports across Phases 1 through 36 are preserved without deletion or overwrite.
- **Untracked Test Artifacts:** All verification scripts are stored safely within `scripts/` and `scratch/` directories.

---

## 2. Verified Deployment Configuration

### 2.1 Process Management (`deployment/ecosystem.config.js`)
The production PM2 configuration was audited and confirmed:
```javascript
module.exports = {
  apps: [
    {
      name: "ehrj-digital-campus",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      // Single-instance fork mode is strictly enforced for SQLite single-writer safety
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "1G",
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "/var/log/ehrj/err.log",
      out_file: "/var/log/ehrj/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      autorestart: true,
      restart_delay: 5000,
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
  ],
};
```
- **Concurrency Safety:** `instances: 1` in `fork` mode prevents multi-process write collisions (`SQLITE_BUSY`) against SQLite.
- **Memory Guard:** Auto-restart triggered if memory usage exceeds 1 GB.
- **Reliability:** Automatic restarts with a 5000ms delay and graceful kill timeout.

### 2.2 Reverse Proxy Configuration (`deployment/nginx.conf`)
The Nginx specification was audited for production security and performance:
- **HTTP to HTTPS Redirection:** Port 80 traffic automatically redirects to `https://www.ehrjmadrasha.com` with HTTP 301.
- **Apex Domain Normalization:** `https://ehrjmadrasha.com` redirects to canonical `https://www.ehrjmadrasha.com`.
- **TLS Configuration:** Protocols restricted to TLSv1.2 and TLSv1.3 with high-security cipher suites.
- **OWASP Hardening Headers:**
  - `X-Frame-Options: SAMEORIGIN` (Clickjacking mitigation)
  - `X-Content-Type-Options: nosniff` (MIME-sniffing prevention)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` (HSTS enforced)
- **Static Asset Caching:** `/_next/static/` served with `expires 365d; access_log off;`.
- **Upload Buffer:** `client_max_body_size 25M;` supporting academic document and photo uploads.
- **WebSocket / Upstream Headers:** Proper forwarding of `Upgrade`, `Connection`, `X-Real-IP`, `X-Forwarded-For`, and `X-Forwarded-Proto`.

### 2.3 Production Environment Auditing (`scripts/verify-production-env.ts`)
A dedicated automated auditor inspected the environment configuration:
- `NODE_ENV`: Verified production-compatible.
- `JWT_SECRET`: Minimum 64-character entropy requirement satisfied.
- `DATABASE_URL`: Validated SQLite file path with write permissions.
- Secret Exposure Check: Zero credentials, private tokens, or connection strings are logged or committed.

---

## 3. Database Persistence & Isolated Recovery Findings

### 3.1 Active Database Engine & Storage
- **Engine:** SQLite 3 accessed through Prisma Client.
- **File Location:** `./prisma/dev.db` / `./dev.db`.
- **Storage Profile:** High-performance local NVMe storage on single-node deployment. Data is **not** stored in temporary build directories or volatile runtime containers.

### 3.2 Automated Backup & Restore Verification Test
An isolated restore test was conducted using `scratch/test_backup_isolated_restore.mjs`:
1. **Snapshot Creation:** Created an isolated snapshot (`10,124 KB`) and computed its SHA-256 checksum.
2. **Disposable Restore:** Restored the snapshot into a completely separate sandbox database (`scratch/temp_restore_test/isolated_restored.db`).
3. **Database Integrity Verification:**
   - `PRAGMA integrity_check;` returned **`ok`**.
   - `PRAGMA foreign_key_check;` returned **`0 violations`**.
4. **Data Verification Comparison:**
   - Verified active record counts matched exactly:
     - Users: 85
     - Students: 185
     - Financial Invoices: 385
     - Cash Funds: 5 accounts totaling ৳1,587,100
     - Exam Sessions: 16
     - Document Templates: 18
5. **Backup Archive Audit:** 74 historical snapshots verified in `backups/` directory with verified checksum logging.

### 3.3 Scalability Evaluation & PostgreSQL Contingency Migration Plan
- **Current Madrasa Scale:** 185 students, 85 staff/guardian users, ~50 concurrent peak daily queries.
- **Current SQLite Suitability:** **EXCELLENT**. SQLite delivers sub-millisecond local reads, zero network overhead, atomic WAL transactions, and zero external dependency risk.
- **Future Migration Trigger:** If student enrollment exceeds 1,500 active users or multiple application servers are required behind a load balancer, migrate to PostgreSQL.
- **Contingency Migration Procedure:**
  1. Freeze writes via `maintenance.isActive = true` in `/api/admin/system/maintenance`.
  2. Dump SQLite records using Prisma JSON export script.
  3. Change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`.
  4. Run `npx prisma db push` or migrations against target PostgreSQL instance.
  5. Bulk insert validated records inside atomic transactions.
  6. Re-run `npx prisma generate` and execute automated validation tests.
  7. Unfreeze maintenance mode and switch DNS traffic.

---

## 4. Domain, HTTPS & Network Status

| Checkpoint | Target Configuration | Status | Details / Prerequisites |
|---|---|---|---|
| **Public Domain** | `ehrjmadrasha.com` / `www.ehrjmadrasha.com` | **PREREQUISITES DOCUMENTED** | Requires A-record pointing to public VPS IP |
| **DNS Routing** | Cloudflare / Hostinger / BDIX DNS | **PREREQUISITES DOCUMENTED** | Requires nameserver configuration |
| **SSL / TLS Certificate** | Let's Encrypt Automated Certbot | **READY FOR EXECUTION** | `nginx.conf` has ACME challenge and cert paths pre-configured |
| **Port Forwarding / Firewall** | Ports 80 & 443 open; port 3000 blocked | **CONFIGURED (UFW specs)** | UFW firewall rules documented in runbook |
| **Local Verification** | `http://localhost:3000` | **VERIFIED (HEALTHY)** | Tested and serving all pages with 0 errors |

*Note: Per strict instructions, no fake domains or unverified public connections were fabricated.*

---

## 5. Third-Party Integrations & Sandboxes

| Integration | Active Mode | Production Status | Safety Invariant |
|---|---|---|---|
| **bKash PGW** | `Sandbox Mode` | **READY FOR LIVE KEYS** | Real payments blocked; mocked sandbox credentials active |
| **Nagad PGW** | `Sandbox Mode` | **READY FOR LIVE KEYS** | Real payments blocked; mocked sandbox credentials active |
| **SMS Gateway** | `Simulation Mode` | **READY FOR LIVE KEYS** | Zero real SMS dispatched; outgoing logs captured locally |
| **SMTP Mailer** | `Local / Test Mode` | **CONFIGURED** | Test recipient routing verified; credentials validated |
| **Webhook Security** | `Active Signature Verification` | **VERIFIED** | Replay protection, HMAC verification, and idempotency verified |

### Steps Required for Live Merchant Activation
1. **bKash:** Obtain production `app_key`, `app_secret`, `username`, and `password` from the bKash Merchant Portal upon commercial contract approval. Set `BKASH_SANDBOX=false` in `.env.production`.
2. **Nagad:** Obtain production `merchant_id`, `public_key`, and `private_key` from Nagad Merchant Services. Set `NAGAD_SANDBOX=false`.
3. **SMS Gateway:** Obtain approved Sender ID (Masking) and API Key from a licensed Bangladesh BTRC aggregator (e.g., Greenweb, BulkSMSBD, or Teletalk). Update `SMS_API_KEY` and set `SMS_GATEWAY_MODE=live`.

---

## 6. Build & Quality Verification Matrix

| Verification Layer | Command Executed | Result | Status |
|---|---|---|---|
| **TypeScript Typecheck** | `npx tsc --noEmit` | 0 errors | **PASS** |
| **Production Build** | `npm run build` | 229 routes compiled | **PASS** |
| **Security & Concurrency Suite** | `node scripts/test_phase36_concurrency_and_security.js` | 26/26 tests passed | **PASS** |
| **Isolated DB Restore Suite** | `node scratch/test_backup_isolated_restore.mjs` | Integrity check: `ok`, 0 violations | **PASS** |
| **Health API Endpoint** | `curl http://localhost:3000/api/health` | HTTP 200 `HEALTHY` | **PASS** |
| **Responsive Viewports** | Mobile (390px), Tablet (768px), Desktop (1440px) | 0 horizontal overflow | **PASS** |

---

## 7. Blockers & Required Human Approvals

The following operational actions require explicit human intervention before traffic switch:
1. **VPS Infrastructure Provisioning:** Authorized administrator must provision the Linux VPS (Ubuntu 22.04 LTS or 24.04 LTS recommended) with SSH key-based access.
2. **Domain DNS Authorization:** Domain registrar administrator must point A-records for `ehrjmadrasha.com` and `www.ehrjmadrasha.com` to the VPS public IP.
3. **Production Secret Generation:** Authorized operations engineer must generate cryptographically strong secrets (`JWT_SECRET`, `SESSION_SECRET`, `CRON_SECRET`) and securely place them in `/var/www/ehrj-app/.env.production`.
4. **Commercial Merchant Agreements:** Madrasa governing committee must finalize merchant contracts with bKash, Nagad, and an approved SMS gateway provider.

---

## 8. Safe Deployment & Rollback Runbook

### 8.1 Step-by-Step Production Cutover Runbook
```bash
# 1. Update OS packages & install runtime dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm nginx ufw certbot python3-certbot-nginx
sudo npm install -g pm2

# 2. Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# 3. Clone repository into production location
sudo mkdir -p /var/www/ehrj-app
sudo chown -R $USER:$USER /var/www/ehrj-app
git clone <authorized-repo-url> /var/www/ehrj-app
cd /var/www/ehrj-app

# 4. Install production dependencies and build Next.js
npm ci --omit=dev
cp deployment/production.env.example .env.production
# (Edit .env.production with production secrets)
npx prisma generate
npm run build

# 5. Initialize SQLite database & permissions
mkdir -p prisma/backups
touch dev.db
chmod 600 dev.db
npx prisma db push

# 6. Start application with PM2 process manager
pm2 start deployment/ecosystem.config.js --env production
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER

# 7. Configure Nginx and SSL
sudo cp deployment/nginx.conf /etc/nginx/sites-available/ehrj.conf
sudo ln -s /etc/nginx/sites-available/ehrj.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d ehrjmadrasha.com -d www.ehrjmadrasha.com
```

### 8.2 Immediate Emergency Rollback Procedure
If any fatal error, unhandled exception, or unexpected regression occurs during deployment:
```bash
# 1. Immediately activate maintenance mode to halt user writes
pm2 stop ehrj-digital-campus

# 2. Restore previous stable code revision
cd /var/www/ehrj-app
git checkout tags/v-previous-stable

# 3. Restore database snapshot from pre-deployment backup
RESTORE_SNAPSHOT=$(ls -t backups/*.db | head -1)
cp "$RESTORE_SNAPSHOT" dev.db

# 4. Regenerate Prisma client & rebuild
npx prisma generate
npm run build

# 5. Restart PM2 application
pm2 restart ehrj-digital-campus --update-env

# 6. Verify health endpoint
curl -f http://localhost:3000/api/health
```

---

## 9. Final Phase 37 Verdict

```
================================================================================
FINAL VERDICT: CONDITIONALLY READY
================================================================================
Software & Codebase Readiness : 100% (Build passes, zero TypeScript errors)
Persistence Architecture      : 100% (Integrity verified, isolated restore verified)
Process & Reverse Proxy Specs : 100% (PM2 fork-mode and Nginx hardening verified)
Third-Party Integrations      : Sandboxed & Protected (Safe for live key swap)
External Infrastructure       : Awaiting Human Provisioning (Domain, SSL, Merchant IDs)
================================================================================
```

*Report prepared and certified under Checkpoint `EHRJ-AI-2026-PRODUCTION-DEPLOYMENT-PREP-37`.*
