# EHRJ MADRASHA ERP — PHASE 28
## INTEGRATION HUB, API GATEWAY & EXTERNAL SYSTEMS AUDIT
**Checkpoint:** `EHRJ-AI-2026-PHASE28`  
**Institution:** Eliotganj Hazi Rohmatollah Jamiria Madrasha (ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা)  
**Date:** September 2026  
**Status:** IMPLEMENTED + CONNECTED + TESTED + VERIFIED  

---

## 1. Executive Summary

Phase 28 establishes the **Centralized Integration Hub, API Gateway & Institutional Interoperability Engine** for EHRJ Madrasha ERP. As institutional operations expanded through Phase 27 (Event-Driven Workflows), EHRJ required a hardened boundary to interface securely with external systems (payment gateways, educational board databases, bank statement reconciliation, webhook subscribers, and third-party APIs).

### Core Architectural Invariant
> **CONNECT SYSTEMS, NOT AUTHORITIES.**  
> External systems must NEVER silently become the source of truth. Internal EHRJ domain services (Finance, Academic, Attendance, Student Master) remain authoritative. Integration Hub only transports, transforms, validates, and observes data across the institution's boundary.

---

## 2. Institutional Source-of-Truth & Data Ownership Matrix

| Domain | Authoritative Internal Engine | Internal Module | External Access | Conflict Resolution Rule |
|---|---|---|---|---|
| **Student Master** | Student & Enrollment Service | Academic & Admissions | READ_ONLY | Internal master always wins. External changes require approval workflow. |
| **Guardian Master** | Guardian Engine | Student & Guardian Services | READ_ONLY | Internal records authoritative; portal requests undergo staff review. |
| **Attendance Records** | Attendance Engine | Attendance Module | READ_ONLY | Teacher/admin marked attendance is authoritative. Biometric feeds validate against class rosters. |
| **Exams & Results** | Academic & Exam Engine | Academic Module | READ_ONLY | Grade book locked after publication; external BI receives read-only snapshots. |
| **Finance Invoices** | Finance Engine | Finance & Accounts | READ_ONLY | Only Finance Engine can create, modify, or cancel invoices. No external gateway can alter dues directly. |
| **Payment Receipts** | Finance & Cash Ledger | Finance & Accounts | WRITE_REQUEST | Two-way status verification. Gateway success initiates internal transaction check before receipt finalization. |
| **Certificates & Docs** | Document & Verification Engine | Document Services | READ_ONLY | Cryptographically signed QR and serials authoritative. External portals query read-only verification service. |
| **Library Catalogue** | Library Engine | Library Services | READ_ONLY | Internal barcode and book registers win over external inventory sync. |
| **Hostel & Residential** | Residential Engine | Hostel Management | READ_ONLY | Internal room and mess roster authoritative. |
| **Transport Fleet** | Transport Engine | Transport Management | READ_ONLY | Vehicle route assignments and stop lists authoritative. |
| **Inventory & Assets** | Inventory Engine | Inventory & Procurement | READ_ONLY | Institutional asset tag register authoritative. |
| **HR & Employee** | HR & Payroll Engine | Human Resources | RESTRICTED | Employment, designations, and salary structures internal only. |
| **Notifications** | Communication Engine (Phase 8) | Communication Module | RESTRICTED | Nodemailer/Gmail delivery status tracked; templates and recipient rules internal. |
| **Workflow Automation**| Workflow Engine (Phase 27) | Process Orchestration | RESTRICTED | Internal rules and approval gates cannot be overridden by external API triggers. |

---

## 3. Discovered Integrations & Architectural Boundary

1. **Email Delivery (`GMAIL_SMTP`):**
   - Authoritative Provider: Google Workspace / Nodemailer (`src/lib/mail.ts`).
   - Status: `ACTIVE` (`HEALTHY`).
   - Wrapped inside Registry: `INT-GMAIL-SMTP-01`.

2. **bKash Payment Gateway (`BKASH_PGW`):**
   - Authoritative Engine: Finance & Cash Ledger (`src/lib/feeCalculationService.ts`).
   - Status: `CONFIGURED` (`SANDBOX`).
   - Honest State: Configured in Sandbox environment; production mode requires institutional production merchant credentials.
   - Idempotency & HMAC signature verification enforced on callback and webhook.

3. **Nagad Payment Gateway (`NAGAD_PGW`):**
   - Status: `CONFIGURED` (`SANDBOX`).
   - Public-key signature check with fallback to `PENDING` on uncertain gateway states.

4. **Event Bus & Webhook Dispatcher (`EHRJ_WEBHOOKS`):**
   - Integrated with Phase 27 Domain Event Bus (`src/lib/workflow/eventBus.ts`).
   - Outbound webhook delivery with HMAC-SHA256 signature (`x-ehrj-signature`).
   - Exponential backoff retry policy (3 attempts).
   - Quarantines unresolvable failures to Dead-Letter Queue (DLQ).

5. **Bank Statement Reconciliation (`EXTERNAL_BANK_RECON`):**
   - Supports Sonali Bank, Islami Bank Bangladesh, and Al-Arafah Islami Bank statements.
   - Classifies rows into `MATCHED`, `UNMATCHED`, `PARTIAL_MATCH`, `DUPLICATE`, and `CONFLICT`.

6. **Institutional Data Exchange Hub (`DATA_IMPORT_EXPORT`):**
   - Integrated with Phase 25 import validator (`src/lib/importValidator.ts`).
   - Enforces RBAC: Teachers restricted from finance/HR exports; Guardians restricted to linked children.
   - Field-level minimization: Excludes NIDs, raw passwords, and unapproved PII from external exports.

---

## 4. Security & Fault-Tolerance Controls

1. **No Secrets in Code or Logs:**
   - All credentials and sensitive fields (`password`, `token`, `secret`, `authorization`, `otp`, `apiKey`) are masked by `sanitizeMetadata()` before logging.
2. **Cryptographic API Key Hashing:**
   - Plaintext keys are generated once (`ehrj_live_...` or `ehrj_test_...`) and returned to the administrator.
   - The database/filesystem stores ONLY the cryptographic SHA-256 hash.
3. **Sliding-Window Rate Limiting:**
   - Configurable per API key (e.g. 60–120 requests/minute).
4. **Resilient HTTP Client & Circuit Breaker:**
   - Bounded timeouts (default 8,000ms; never hangs indefinitely).
   - Circuit breaker states: `CLOSED` -> `OPEN` (trips at 5 consecutive failures) -> `HALF_OPEN` (after 30,000ms cooldown).
5. **Replay Attack & Nonce Protection:**
   - Inbound webhooks require a timestamp header within a strict 300-second window. Any timestamp delta > 300s is quarantined to the Dead-Letter Queue.
