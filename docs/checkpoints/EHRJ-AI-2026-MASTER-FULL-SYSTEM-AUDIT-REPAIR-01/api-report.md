# EHRJ Digital Campus & ERP — Comprehensive API Master Report

> **Checkpoint:** `EHRJ-AI-2026-MASTER-FULL-SYSTEM-AUDIT-REPAIR-01`  
> **Total API Routes:** 475 backend route handlers in `src/app/api/**`  
> **Status:** VERIFIED & HARDENED

---

## 1. API Architecture & Routing Standards

All endpoints follow RESTful conventions with JSON payloads, strict HTTP status codes, and server-side authorization.

### Endpoint Distribution
- **Administrative APIs (`/api/admin/**`):** 280+ endpoints managing academic classes, fees, general ledger, students, exams, admissions, inventory, HR, procurement, and operations.
- **Teacher Workplace APIs (`/api/teacher/**`):** 35+ endpoints providing scoped class rosters, attendance recording, and mark submissions.
- **Guardian Portal APIs (`/api/portal/**`):** 40+ endpoints allowing guardians to view linked child dues, initiate payments, submit leave/support requests, and inspect report cards.
- **Principal Oversight APIs (`/api/principal/**`):** 15+ executive oversight endpoints for reviewing high-value refunds, admissions, and institutional metrics.
- **Public & Verification APIs (`/api/verify/**`, `/api/notices`, `/api/admissions`):** 25+ public endpoints for anonymous notice viewing, public certificate verification, and admissions application intake.

---

## 2. Security Assertions & Guardrails

### 2.1 Mutating Route Authorization
Every mutating route (`POST`, `PUT`, `PATCH`, `DELETE`) in the administrative, faculty, and parental zones enforces server-side session checks:
```typescript
const user = await getSessionUser();
if (!user || !ALLOWED_ROLES.includes(user.role)) {
  return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস" }, { status: 403 });
}
```
During our audit, calendar resource booking (`/api/calendar/resources/book`) and events mutations (`/api/events/**`) were hardened to require authenticated session tokens rather than trusting client-supplied parameters.

### 2.2 Public Endpoint Rate Limiting
- Public admissions application intake (`/api/admissions/apply`) enforces IP rate limiting (maximum 5 requests per hour).
- Public student/result search (`/api/students/search`) enforces IP rate limiting (maximum 20 lookups per minute).
- Login endpoint (`/api/auth/login`) triggers a 15-minute account lockout upon 5 consecutive failed attempts.

### 2.3 Bounded Query Pagination
All list query endpoints implement strict pagination bounds (`parsePaginationParams`) with a default limit of 50 records and a hard ceiling of 200 records, preventing denial-of-service via unbounded database queries.

### 2.4 Cryptographic Webhook Verifications
Inbound payment provider webhooks (`/api/v1/webhooks/inbound/[provider]` and `/api/admin/integrations/webhooks`) implement HMAC SHA-256 signature verification (`hasSignatureCheck: true`) before acknowledging transaction status.

---

## 3. Public Verification Data Minimization

The public verification endpoints (`/api/verify/document/[token]`, `/api/verify/receipt/[token]`, `/api/verify/result/[code]`, `/api/students/search`) adhere to strict data privacy invariants:
- **Redacted Information:** Financial dues, guardian phone numbers, home addresses, National IDs, birth registration numbers, and passwords are never exposed.
- **Permitted Verification Data:** Student Name (English & Bengali), Academic Class, Jamat Roll Number, Session, Exam Title, Letter Grade, and Issue Date.
- **Revocation Safety:** Revoked certificates explicitly return a status of `REVOKED` without exposing historical PII.
