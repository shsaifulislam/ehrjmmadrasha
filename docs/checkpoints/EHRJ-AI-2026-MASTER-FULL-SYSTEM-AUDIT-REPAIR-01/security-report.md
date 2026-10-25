# EHRJ Digital Campus & ERP — Comprehensive Security Report

> **Checkpoint:** `EHRJ-AI-2026-MASTER-FULL-SYSTEM-AUDIT-REPAIR-01`  
> **Date:** October 5, 2026  
> **Standard:** Zero-Trust Authorization & Penetration Hardening  
> **Status:** VERIFIED & HARDENED

---

## 1. Authentication & Session Architecture

### Cryptographic Credential Protection
- All credentials hashed via `bcryptjs` with salt work factor 12 (`src/lib/auth.ts:60`).
- No passwords or secrets are ever recorded in plaintext, logs, or error responses.
- Account enumeration is blocked on `/api/auth/login`: identical error message returned for both non-existent usernames and incorrect passwords.

### Session Lifecycle & Dual Denylist
- Session tokens are signed JSON Web Tokens (JWT) using `jose` with `HS256` backed by a 256-bit cryptographically secure secret.
- Session lifetime is capped at 7 days with a 30-second clock tolerance window.
- Upon logout, account suspension, or security lockout, tokens are invalidated simultaneously in `prisma.session` and appended to the disk denylist at `data/security/revoked_tokens.json`.

---

## 2. Authorization & RBAC Enforcement

### Edge Middleware Boundary Matrix
- `/admin/**` & `/api/admin/**`: Strictly requires role `ADMIN` or `PRINCIPAL`.
- `/teacher/**` & `/api/teacher/**`: Strictly requires role `TEACHER`, `ADMIN`, or `PRINCIPAL`.
- `/principal/**` & `/api/principal/**`: Strictly requires role `PRINCIPAL` or `ADMIN`.
- `/portal/**` & `/api/portal/**`: Strictly requires role `GUARDIAN`, `ADMIN`, or `PRINCIPAL`.
- Legacy `/guardian` routes are permanently redirected to `/portal` via HTTP 308.

### Server-Side Zero-Trust & IDOR Defenses
- **Guardian Isolation:** Verified in `src/lib/securityEngine.ts:355-389`. Guardian access to student grades, fees, attendance, and documents requires active parent-child relational linkage in `prisma.guardian`. Unauthorized access returns HTTP 403 Forbidden and logs an `IDOR_ATTEMPT` audit event.
- **Teacher Jamat Scoping:** Teachers can only inspect, mark attendance, or enter grades for classes explicitly assigned to them in `TeacherAssignment`.

---

## 3. Input Sanitization & Injection Defenses

### SQL / NoSQL Injection Defense
- All database operations utilize Prisma ORM with strict parameterized queries.
- Raw SQL injection test payloads (`' OR '1'='1`) executed against database queries failed to alter execution logic.

### Cross-Site Scripting (XSS)
- Client rendering leverages React automatic JSX escaping.
- Dangerous HTML injection payloads (`<script>alert(1)</script>`) executed in test suites are cleanly rendered as inert text.

### Path Traversal Defense
- File upload and download handlers validate filenames against traversal patterns (`../`, `..\\`).

---

## 4. Rate Limiting & Denial-of-Service Defense

- **Login Defense:** 5 failed consecutive attempts per `(username, IP)` composite key triggers a 15-minute account lockout (`src/lib/securityEngine.ts`).
- **Admissions Intake:** Public admission submissions capped at 5 requests per IP per hour; 6th request triggers HTTP 429 Too Many Requests (`src/app/api/admissions/apply/route.ts`).
- **Student Public Search:** Search API capped at 20 lookups per IP per minute (`src/app/api/students/search/route.ts`).

---

## 5. HTTP Transport Security Headers

Enforced across all responses via Next.js Middleware:
- `X-Frame-Options: SAMEORIGIN` (Clickjacking defense)
- `X-Content-Type-Options: nosniff` (MIME-sniffing defense)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Content-Security-Policy: default-src 'self' ...`

---

## 6. Audit & Accountability Logging

- Over 1,986 immutable audit log records in `prisma.auditLog`.
- Every high-stakes transaction (admission approval, exam mark changes, fee payments, refunds, role updates) records actor user ID, entity ID, action type, IP address, and payload snapshot.
- Zero audit records can be edited or deleted.
