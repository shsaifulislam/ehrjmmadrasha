# EHRJ MADRASHA ERP — SECURITY & HARDENING AUDIT REPORT
## Vulnerability Assessment, Defect Remediations & Production Security Posture

**Document ID:** `EHRJ-SEC-AUDIT-01`  
**Date:** October 18, 2026  
**Auditor / Security Lead:** Lead Application Security Architect  
**Classification:** Internal Restricted Technical Audit  
**Status:** **AUDITED, HARDENED & REGRESSION TESTED**  

---

## 1. Executive Summary

This security audit evaluates the web application, backend API, mobile client endpoints, and data layers of the Eliotganj Hazi Rohmatollah Jamiria Madrasha ERP. 

All identified vulnerabilities were investigated without weakening security controls, and safe remediations were implemented and empirically verified through automated test suites.

---

## 2. Security Assessment & Audit Findings

### 2.1 Identity & Authentication
- **Password Hashing:** Implemented with `bcryptjs` using a salt work factor of 12 (`hashPassword()` in `src/lib/auth.ts`). Resistant to modern GPU cracking attacks.
- **Session Tokens:** Signed with HMAC-SHA256 (`HS256`) via `jose` library with strict expiration (7 days), unique token IDs (`jti`), and database session tracking (`Session` table).
- **Revocation & Blacklisting:** Token revocation engine in `src/lib/auth.ts` writes revoked tokens to `data/security/revoked_tokens.json` and deletes database sessions upon user logout. Expired revocation entries are pruned every 7 days.
- **Fail-Fast Secret Enforcement:** `src/lib/env.ts` enforces that `JWT_SECRET` must be at least 32 characters long in production environments and halts startup if default development keys are detected.

### 2.2 Role-Based Access Control (RBAC) & IDOR Protection
- **Middleware Enforcement:** `src/middleware.ts` enforces role separation across routes:
  - `/admin/*`, `/api/admin/*`: Limited to `ADMIN` and `PRINCIPAL`.
  - `/teacher/*`, `/api/teacher/*`: Limited to `TEACHER`, `ADMIN`, `PRINCIPAL`.
  - `/principal/*`, `/api/principal/*`: Limited to `PRINCIPAL`, `ADMIN`.
  - `/portal/*`, `/api/portal/*`: Limited to `GUARDIAN`, `STUDENT`, `ADMIN`.
- **In-Depth IDOR Protection (Guardian Scoping):**
  - Evaluated in `src/app/api/portal/attendance/route.ts`, `src/app/api/portal/results/route.ts`, `src/app/api/portal/finance/route.ts`, and `src/lib/analyticsEngine.ts`.
  - Every child-specific query validates relational ownership in `GuardianStudent` table (`where: { studentId, guardian: { userId } }`).
  - Unauthorized queries for non-ward student IDs are blocked with `403 Forbidden` and localized Bengali alerts.

### 2.3 Rate Limiting & Denial of Service (DoS) Defense
- **Implementation:** Sliding-window in-memory rate limiter with TTL eviction and bounded FIFO capacity (`src/lib/security.ts`).
- **Enforced Thresholds:**
  - `POST /api/auth/login`: 10 requests per minute per IP.
  - `POST /api/auth/register`: 5 requests per 10 minutes per IP.
  - `POST /api/auth/forgot-password/send-otp`: 5 requests per 5 minutes per IP.
  - `POST /api/admissions/apply`: 5 applications per hour per IP.
  - Public search endpoints: 20 queries per minute per IP.

### 2.4 Financial Integrity & Duplicate Payment Prevention
- **Atomic Ledgers:** Payment processing in `src/app/api/admin/finance/payments/route.ts` and `quick-collect/route.ts` utilizes Prisma `$transaction` blocks to update invoices, issue numbered receipts, record cash fund movements, and log audit entries atomically.
- **Idempotency Defense:** Deterministic SHA-256 idempotency hashing (`invoiceId + amount + 30s window`) rejects duplicate clicks.
- **TrxID Deduplication (Repaired in Phase 5):** Added explicit uniqueness checks on `transactionId` in `quick-collect/route.ts`, `payments/route.ts`, and `donations/route.ts`. Duplicate bank/bKash TrxID submissions are rejected with `409 Conflict`.

### 2.5 File Upload Security & Access Control
- **Endpoint:** `POST /api/principal/signature/route.ts`.
- **RBAC:** Restricted to authenticated `ADMIN` and `PRINCIPAL` users.
- **MIME Type Whitelist:** Restricted strictly to `image/png`, `image/jpeg`, `image/jpg`, and `image/webp`.
- **Payload Size Limits:** Enforced maximum upload ceiling of 2 MB (2,097,152 bytes).
- **Path Traversal Protection:** User filenames are discarded; unique random server-generated filenames (`principal_signature_[timestamp]_[rand].ext`) are assigned upon storage in `public/uploads/signatures/`.

### 2.6 Security Headers & CORS
- **Headers in `next.config.js`:**
  - `X-Frame-Options: SAMEORIGIN` (prevents clickjacking)
  - `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (enforces HSTS)
  - `Content-Security-Policy` with trusted CDNs (Google Fonts, YouTube)
- **CORS Preflight (Repaired in Phase 5):** Handled `OPTIONS` requests on `/api/*` in `src/middleware.ts` with `204 No Content` and appropriate access-control headers, enabling legitimate mobile API integration while keeping route guards intact.

### 2.7 Audit Logging & Sensitive Data Redaction
- **Audit Logging:** Implemented in `src/lib/security.ts` (`recordAuditLog()`). Records user ID, IP address, timestamp, action type, entity type, entity ID, and structured JSON metadata in SQLite `AuditLog` table.
- **Sensitive Data Redaction:** Passwords, password hashes, and raw cryptographic secrets are stripped from public responses and omitted from system log streams.

---

## 3. Empirical Security Test Verification

The security test suite (`scratch/test_duplicate_payment_security.ts`) confirmed the following outcomes:

1. **CORS Preflight Test:**
   - Request: `OPTIONS /api/admin/finance/payments`
   - Outcome: `204 No Content`, `Access-Control-Allow-Origin: *` **[PASSED]**
2. **Duplicate TrxID in Quick-Collect Test:**
   - Request: `POST /api/admin/finance/payments/quick-collect` with existing TrxID
   - Outcome: `409 Conflict` (`এই ট্রানজ্যাকশন আইডিটি (TrxID) ইতিপূর্বে ব্যবহার করা হয়েছে।`) **[PASSED]**
3. **Duplicate TrxID in Donations Test:**
   - Request: `POST /api/donations` with identical TrxID twice
   - Outcome: First submission -> `200 OK`; Second submission -> `409 Conflict` **[PASSED]**
4. **Guardian IDOR Access Control Test:**
   - Request: Guardian query for unlinked student attendance and results
   - Outcome: `403 Forbidden` (`নিরাপত্তা সতর্কতা: আপনি শুধুমাত্র আপনার নিবন্ধিত সন্তানের ফলাফল দেখার অনুমতিপ্রাপ্ত।`) **[PASSED]**

---

## 4. Residual Risks & Staging Recommendations

1. **In-Memory Rate Limiting:**
   - *Current State:* Rate limiting operates in-memory on the active node process.
   - *Production Recommendation:* When scaling to multiple cluster instances behind a load balancer, migrate the rate-limiting store to Redis (Upstash / AWS ElastiCache).
2. **Production Secrets:**
   - *Current State:* Default secrets exist in local development environment.
   - *Production Recommendation:* Secrets must be injected via environment variables at server launch, never stored in repository git history.
