# EHRJ MADRASHA ERP — PHASE 26 SECURITY & DATA INTEGRITY AUDIT
**Project:** Eliotganj Hazi Rohmatollah Jamiria Madrasha ERP  
**Audit Standard:** Enterprise OWASP ASVS & Financial Data Integrity Standards  
**Audit Date:** 2026-10-21  

---

## 1. Authentication & Session Security

- **Mechanism:** Dual JWT session tokens with encrypted payload and HMAC SHA-256 signing via `src/lib/auth.ts`.
- **Cookie Security:** Auth cookies use `HttpOnly`, `SameSite=Lax`, and `Secure` (in HTTPS environments) flags to prevent client-side JavaScript theft via XSS.
- **Session Expiration:** Standard institutional session window configured for 8 hours with sliding refresh windows.
- **Credential Storage:** User passwords stored as salted cryptographic hashes (BCrypt 10 rounds). Plaintext credentials never logged or returned via API responses.

---

## 2. Server-Side Role-Based Access Control (RBAC) & IDOR Protection

- **Server-Side Enforcement:** Route protection in `src/middleware.ts` and route handlers inspect session claims directly on the server.
- **Negative Testing:**
  - Unauthenticated requests to `/admin`, `/teacher`, or `/principal` redirect immediately to `/login`.
  - Non-admin tokens attempting administrative mutations (e.g., student fee modification, user deletion) receive HTTP 403 Forbidden.
- **IDOR Protection:**
  - Guardian / Student portal endpoints (`/api/portal/*`) enforce ownership filters:
    ```typescript
    where: { guardianId: session.userId }
    ```
    preventing User A from accessing User B's student academic progress or financial invoices.

---

## 3. Financial Authorization & Ledger Invariants

The institutional accounting module strictly enforces double-entry and invoice state consistency:
1. **Idempotency & Replay Protection:**
   - Online payment callbacks require idempotent transaction keys (`txnId`). Repeated webhooks or duplicate POSTs reject replay attempts.
2. **Ledger Balance Invariant:**
   - Every invoice payment automatically computes and verifies:
     $$\text{Total Invoice Amount} = \text{Paid Amount} + \text{Waiver / Discount} + \text{Outstanding Due}$$
   - Partial payments update the invoice status to `PARTIAL` and log an auditable receipt entry. Overpayment beyond total due is rejected at API validation.
3. **Audit Trails:**
   - All financial adjustments, discounts, and fee revisions record `createdById`, `timestamp`, and `auditReason`.

---

## 4. Input Validation & Injection Hardening

- **SQL / NoSQL Injection:** Prevented by design through Prisma ORM's parameterized queries and strict type validation.
- **XSS Sanitization:** React JSX auto-escaping prevents reflected XSS. Dynamic HTML injection sinks (`dangerouslySetInnerHTML`) are strictly restricted and sanitized.
- **Bengali & Arabic Input Handling:** UTF-8 encoding enforced across all layers (Client headers, Next.js request parsing, SQLite/PostgreSQL tables), preventing Unicode truncation or broken Arabic diacritics (Harakat).

---

## 5. Dependency Security & Vulnerability Analysis

A fresh forensic scan via `npm audit --json` yielded:
- **Total Advisories:** 9
- **Runtime Attack Surface:** **0 (Zero)**
- **Advisory Details:**
  - All 9 advisories reside in devDependencies (`tailwindcss` and `postcss`), executed exclusively during compile time.
  - The runtime Next.js bundle (`next@15.5.28` canary) has closed previous upstream vulnerabilities (including GHSA-d253-5cmg-8m35 and CVE-2025-29927).
  - Compatibility evaluation confirmed that forcing major upgrades on build-time tools poses unnecessary build breaking risks with zero runtime security benefit.

---

## 6. Database Invariant & Storage Integrity

- **Master Database (`prisma/dev.db`):**
  - Cryptographic SHA-256: `db452633adeddb9f4baf0441c500e7df2c460a7fe58b40d99d693af3994dc094`.
  - Maintained 100% read-only integrity throughout Phase 26 test suite.
- **Staging Database (PostgreSQL 18.4):**
  - Handled all disposable write mutations and schema migrations without touching production data.
