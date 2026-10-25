# EHRJ Digital Campus & ERP — Production Release Checklist
**Document Version:** 1.0.0  
**Target Version:** `1.0.0`  
**Standard Release Cadence:** Scheduled Maintenance Window (Off-Peak Hours: 22:00 - 05:00 BST)  

---

## Pre-Release Phase (Local / CI Validation)

### 1. Code & Build Integrity
- [ ] Working tree is clean: `git status` shows no uncommitted files or dirty states.
- [ ] Dependencies are locked: `package-lock.json` matches `package.json`.
- [ ] Clean installation succeeds: `npm ci --production=false` completes with exit code 0.
- [ ] Prisma Client generated cleanly: `npx prisma generate` succeeds without errors.
- [ ] Production build succeeds: `npm run build` exits with code 0.
- [ ] TypeScript checks passed without `any` regressions on critical payment/academic engines.
- [ ] No debug code: Removed any `console.log` statements leaking credentials or private student data.

### 2. Automated Test Suite Execution
- [ ] Run security & authorization suite: `npx tsx scratch/test_phase17_security.ts`
- [ ] Run financial & cashbook regression test: `npm run test:phase12`
- [ ] Run document factory & certificate verification test: `npm run test:phase18`
- [ ] Confirm 100% test pass rate across all active test suites prior to deployment.

### 3. Database & Schema Compatibility
- [ ] Inspect schema diffs: Compare changes in [`prisma/schema.prisma`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/prisma/schema.prisma) with production.
- [ ] Backward compatibility verified: No column deletions or non-nullable column additions without default values on active tables (`User`, `Student`, `Guardian`, `FeeInvoice`, `PaymentReceipt`, `Attendance`).
- [ ] SQLite index coverage: Foreign keys and search fields have indices.
- [ ] Take a pre-release database snapshot on the production server tagged `PRE_MIGRATION`:
  ```bash
  # Via Admin API or curl
  curl -X POST http://localhost:3000/api/admin/operations/cron \
    -H "Authorization: Bearer $CRON_SECRET" \
    -H "Content-Type: application/json" \
    -d '{"jobKey": "DAILY_DATABASE_BACKUP"}'
  ```

### 4. Environment & Secrets Audit
- [ ] `NODE_ENV` is set to `"production"`.
- [ ] `JWT_SECRET` is set to a unique, cryptographically random key of >= 32 characters (NOT the development fallback string).
- [ ] `CRON_SECRET` is set and matches the crontab authorization bearer token.
- [ ] `WEBHOOK_SIGNING_SECRET` is set to verify live payment gateway callbacks.
- [ ] `APP_URL` and `NEXT_PUBLIC_APP_URL` are both set to `https://www.ehrjmadrasha.com`.
- [ ] `DATABASE_URL` points to the designated persistent file path (`file:./prisma/prod.db` or `/app/data/prod.db`).
- [ ] SMTP credentials (`SMTP_USER`, `SMTP_PASS`) are valid and test emails deliver successfully.
- [ ] Payment gateway mode verified (`BKASH_MODE="PRODUCTION"` or `"SANDBOX"`).

---

## Deployment Execution Phase

### 5. Host & Process Deployment
- [ ] Pre-deployment announcement: If significant downtime expected, enable maintenance mode via `/admin/operations`.
- [ ] Pull verified release commit on production host: `git checkout <RELEASE_TAG>`.
- [ ] Install dependencies: `npm ci --production=false`.
- [ ] Synchronize schema: `npx prisma db push --skip-generate`.
- [ ] Rebuild Next.js production bundle: `npm run build`.
- [ ] Verify PM2 configuration in `deployment/ecosystem.config.js`:
  - `instances: 1` (MANDATORY for SQLite single-writer safety).
  - `exec_mode: "fork"`.
- [ ] Reload PM2 process: `pm2 reload deployment/ecosystem.config.js`.
- [ ] Check PM2 logs for crash loops: `pm2 logs ehrj-digital-campus --lines 30`.

### 6. Reverse Proxy & Network Checks
- [ ] Nginx configuration test: `sudo nginx -t` reports syntax OK.
- [ ] Reload Nginx: `sudo systemctl reload nginx`.
- [ ] SSL Certificate validity: Certbot certificate is active and auto-renews:
  `sudo certbot certificates`.
- [ ] HTTP to HTTPS redirection: `curl -I http://www.ehrjmadrasha.com` returns `HTTP/1.1 301 Moved Permanently`.
- [ ] Apex to WWW redirection: `curl -I https://ehrjmadrasha.com` returns `301` redirecting to `https://www.ehrjmadrasha.com`.

---

## Post-Deployment Smoke Testing & Health Verification

### 7. Health & Component Diagnostics
- [ ] Public health endpoint returns HTTP 200:
  ```bash
  curl -i https://www.ehrjmadrasha.com/api/health
  # Must return: {"status":"HEALTHY", ...}
  ```
- [ ] Deep administrative health check: Navigate to `/admin/operations` and verify:
  - Application: HEALTHY
  - Database: HEALTHY (query latency < 20ms)
  - Storage: HEALTHY (uploads and backups directories writable)
  - Authentication: HEALTHY
  - Backups: HEALTHY (latest backup exists and is verified)
- [ ] Robots & Sitemap check:
  - `https://www.ehrjmadrasha.com/robots.txt` contains `Sitemap: https://www.ehrjmadrasha.com/sitemap.xml`
  - `https://www.ehrjmadrasha.com/sitemap.xml` renders valid XML with canonical URLs.

### 8. User Journey Smoke Tests
- [ ] **Public Portal:** Load `https://www.ehrjmadrasha.com/`. Verify institutional branding, phone numbers, and footer.
- [ ] **Admission:** Open `/admission`. Verify online registration form loads, input validation functions, and captcha/protection works.
- [ ] **Results & Marksheet:** Query sample student result on `/results`. Verify marksheet displays with correct grading calculation.
- [ ] **Certificate Verification:** Open `/verify` and test QR verification lookup on an issued student certificate.
- [ ] **Institutional Login:** Navigate to `/login`. Verify admin login works, session cookie (`auth_session`) is created with `HttpOnly` and `Secure`.
- [ ] **Guardian Portal:** Log in as guardian. Verify child attendance, fee invoices, and notices load accurately.
- [ ] **Teacher Workplace:** Log in as teacher. Verify attendance submission form operates without database locks.

### 9. Rollback Readiness Confirmation
- [ ] Pre-release snapshot code recorded and verified in `backups/`.
- [ ] On-call engineer has access to [`deployment/rollback.md`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/deployment/rollback.md).
- [ ] Previous Git commit hash identified and verified ready for emergency checkout.
- [ ] If maintenance mode was enabled, disable maintenance mode via `/admin/operations`.
