# EHRJ Digital Campus & ERP — Comprehensive Threat Model

> **System:** Eliotgonj Hazi Rohmatollah Jamiria Madrasha Web Application & Enterprise ERP  
> **Methodology:** STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)  
> **Status:** Authoritative Evidence-Based Security Assessment  
> **Date:** October 2026

---

## 1. Executive Summary & System Description

The EHRJ Digital Campus and ERP is an integrated institution management platform supporting educational administration, examination grading, online admissions, student life-cycle tracking, fee billing, mobile financial service (MFS) integration, human resources, and institutional governance.

The platform is constructed on Next.js 14 App Router, utilizing an embedded SQLite 3 database operating in Write-Ahead Logging (WAL) mode via Prisma ORM. It interfaces with external SMS gateways (Greenweb), email relays (SMTP), and payment gateways (bKash and Nagad).

---

## 2. Institutional Assets & Data Classification

| Asset ID | Asset Description | Confidentiality | Integrity | Availability | Storage Location |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **AST-01** | **Student & Guardian PII** (Birth certificates, mobile numbers, family relations, home addresses) | **HIGH** | **HIGH** | **HIGH** | SQLite DB (`Student`, `Guardian`, `Application`) |
| **AST-02** | **Academic & Examination Records** (Exam marks, Mumtaz grades, student transcripts, graduation records) | **MEDIUM** | **CRITICAL** | **HIGH** | SQLite DB (`ExamMark`, `Result`, `Enrollment`) |
| **AST-03** | **Financial & Accounting Ledgers** (Fee invoices, payment receipts, MFS TrxIDs, bank slips, payroll records) | **HIGH** | **CRITICAL** | **CRITICAL** | SQLite DB (`FeeInvoice`, `Payment`, `LedgerEntry`) |
| **AST-04** | **Identity & Session Credentials** (Bcrypt password hashes, active JWT tokens, session denylist) | **CRITICAL** | **CRITICAL** | **HIGH** | SQLite DB (`User`, `Session`) & `data/security/` |
| **AST-05** | **Cryptographic Secrets & Config** (JWT signing key, webhook HMAC secret, cron secret, MFS credentials) | **CRITICAL** | **CRITICAL** | **HIGH** | Environment Variables (`process.env`) |
| **AST-06** | **Institutional Governance & Audit Trails** (Immutable audit logs, security events, access reviews, risk logs) | **HIGH** | **CRITICAL** | **HIGH** | SQLite DB (`AuditLog`) & `data/security/security_events.json` |
| **AST-07** | **Physical Database & Backup Archives** (`dev.db`, WAL files, automated snapshot tarballs) | **CRITICAL** | **CRITICAL** | **CRITICAL** | Local Filesystem (`prisma/`, `backups/`) |

---

## 3. Trust Boundaries & Architecture

```
                                  [ PUBLIC INTERNET ]
                                           │
  ═════════════════════════════════════════╪═════════════════════════════════════════
  TRUST BOUNDARY 1 (Edge Ingress)          │ (HTTPS / Reverse Proxy / Nginx)
  ═════════════════════════════════════════╪═════════════════════════════════════════
                                           ▼
                       [ Next.js Middleware: src/middleware.ts ]
                               (JWT Token & Path Guards)
                                           │
  ═════════════════════════════════════════╪═════════════════════════════════════════
  TRUST BOUNDARY 2 (Internal App Route)    │ (Headers / Cleaned Context)
  ═════════════════════════════════════════╪═════════════════════════════════════════
                                           ▼
                     [ Route Handlers: src/app/api/**/route.ts ]
                      (Input Parsing & Zero-Trust Checks)
                                           │
  ═════════════════════════════════════════╪═════════════════════════════════════════
  TRUST BOUNDARY 3 (Domain Engine Core)    │ (Service Method Arguments)
  ═════════════════════════════════════════╪═════════════════════════════════════════
                                           ▼
                 [ Domain Engines: src/lib/* & Prisma ORM Client ]
                                           │
  ═════════════════════════════════════════╪═════════════════════════════════════════
  TRUST BOUNDARY 4 (Persistence Boundary)  │ (ACID Transactions / Parameterized Queries)
  ═════════════════════════════════════════╪═════════════════════════════════════════
                                           ▼
                        [ SQLite 3 Database & File Store ]
                 (dev.db, dev.db-wal, data/security, backups/)
                                           │
  ═════════════════════════════════════════╪═════════════════════════════════════════
  TRUST BOUNDARY 5 (Third-Party Outbound)  │ (REST / TLS / Webhook Callbacks)
  ═════════════════════════════════════════╪═════════════════════════════════════════
                                           ▼
                      [ bKash / Nagad / Greenweb / SMTP ]
```

---

## 4. Threat Actor Profiles

1. **Anonymous External Attacker:** Internet-connected adversary attempting brute-force credential guessing, automated scanning for exposed endpoints, distributed denial-of-service, or injection attacks.
2. **Malicious Admissions Applicant:** Submits falsified birth certificate numbers, crafted JSON payloads, or excessive submissions to flood the admissions queue.
3. **Compromised Guardian:** Authenticated user attempting to access other students' grades, attendance records, or financial billing via IDOR (Insecure Direct Object Reference) exploits.
4. **Malicious / Disgruntled Faculty Member (Insider):** Authenticated teacher attempting to manipulate grades outside assigned classes, alter historical attendance past the 24-hour window, or access administrative configurations.
5. **Compromised Administrator Account:** Privileged actor attempting unauthorized database restoration, bulk ledger modification, or raw data exfiltration.

---

## 5. STRIDE Threat Analysis & Attack Scenarios

### 5.1 Spoofing (Identity Deception)
- **Scenario S-1: Credential Stuffing & Brute Force on Login Portal**
  - *Threat:* Attacker script launches high-frequency login attempts against `/api/auth/login`.
  - *Impact:* Account takeover of administrator or teacher.
  - *Likelihood:* Medium.
  - *Existing Mitigation:* Implemented in [`src/lib/securityEngine.ts:152-286`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/securityEngine.ts#L152-L286) using composite tracking key `lock:${normalizedId}::${ip}`, locking accounts for 15 minutes after 5 failures within 10 minutes.
- **Scenario S-2: Inbound Webhook Forgery**
  - *Threat:* Attacker sends fake HTTP POST to `/api/v1/webhooks/inbound/bkash` claiming invoice payment.
  - *Impact:* Fraudulent marking of fee invoices as paid without real fund transfer.
  - *Likelihood:* Low.
  - *Existing Mitigation:* Verified in [`src/lib/payment/ProviderWebhookVerifier.ts`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/payment/ProviderWebhookVerifier.ts) requiring HMAC cryptographic signature check against `WEBHOOK_SIGNING_SECRET`. In production, `src/lib/env.ts` halts if this secret is unconfigured.

### 5.2 Tampering (Data Manipulation)
- **Scenario T-1: Examination Marks Inflation by Non-Assigned Teacher**
  - *Threat:* Faculty member attempts to alter examination marks for a class they do not instruct.
  - *Impact:* Corruption of official Qawmi Mumtaz grading and academic standing.
  - *Likelihood:* Low.
  - *Existing Mitigation:* Enforced in [`src/lib/securityEngine.ts:391-417`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/securityEngine.ts#L391-L417) verifying `prisma.teacherAssignment` for the specific session, class, and section.
- **Scenario T-2: Historical Attendance Alteration**
  - *Threat:* Teacher attempts to retroactively change attendance records from weeks earlier.
  - *Impact:* Falsification of mandatory 75% attendance threshold.
  - *Likelihood:* Medium.
  - *Existing Mitigation:* Enforced in [`src/lib/attendanceService.ts:75, 140`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/attendanceService.ts#L75) via 24-hour correction window lock (`DEFAULT_CORRECTION_WINDOW_HOURS = 24`). Modifying older records requires explicit admin override.

### 5.3 Repudiation (Denial of Action)
- **Scenario R-1: Untracked Financial Write-Off or Refund**
  - *Threat:* Administrator waives student fees or approves refund and denies responsibility.
  - *Impact:* Internal embezzlement or untracked budget loss.
  - *Likelihood:* Low.
  - *Existing Mitigation:* Enforced via [`src/lib/security.ts:recordAuditLog`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/security.ts), capturing `userId`, `action`, `entityType`, `entityId`, `ipAddress`, and timestamp.
  - *Missing Mitigation:* Dual-person sign-off on refunds exceeding 5,000 BDT is missing.

### 5.4 Information Disclosure (Data Leakage)
- **Scenario I-1: Student PII Leakage via Public QR Code Verification**
  - *Threat:* Unauthorized party scans QR code on transcript or receipt to harvest personal data.
  - *Impact:* Privacy violation of student and family records.
  - *Likelihood:* Medium.
  - *Existing Mitigation:* Public verification route [`src/app/api/verify/document/[token]/route.ts`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/app/api/verify/document/[token]/route.ts) applies strict PII masking (names masked to initials, phone numbers masked, zero financial balance or national ID exposed).
- **Scenario I-2: Guardian IDOR on Linked Students**
  - *Threat:* Guardian modifies student ID in portal API query to view another family's student report card.
  - *Impact:* Unauthorized disclosure of private academic and fee records.
  - *Likelihood:* High.
  - *Existing Mitigation:* Enforced in [`src/lib/securityEngine.ts:355-389`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/securityEngine.ts#L355-L389); cross-references requested student ID against `prisma.guardian` linked student list, logging an `IDOR_ATTEMPT` security alert on mismatch.

### 5.5 Denial of Service (System Exhaustion)
- **Scenario D-1: Unbounded List Queries Causing Server Memory Spikes**
  - *Threat:* Malicious or repeated requests to list endpoints without pagination parameters.
  - *Impact:* Server process out-of-memory crash, elevated latency.
  - *Likelihood:* High.
  - *Missing Mitigation:* `/api/admin/students` and `/api/admin/attendance` do not enforce a hard default `take` limit if not provided in the query string.
- **Scenario D-2: Concurrent SQLite Lock Contention (`SQLITE_BUSY`)**
  - *Threat:* Heavy burst of concurrent writes (attendance submissions + fee payments).
  - *Impact:* Database lock timeout and request failure.
  - *Likelihood:* Medium.
  - *Existing Mitigation:* Enforced via [`src/lib/prisma.ts:23-31`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/prisma.ts#L23-L31) enabling SQLite WAL mode (`PRAGMA journal_mode = WAL;`), 5000ms busy wait timeout, and NORMAL synchronous mode.

### 5.6 Elevation of Privilege (Unauthorized Escalation)
- **Scenario E-1: Accidental or Malicious Database Restoration**
  - *Threat:* Attacker with hijacked administrator session triggers database restore or account suspension.
  - *Impact:* Catastrophic data loss or service disruption.
  - *Likelihood:* Low.
  - *Existing Mitigation:* High-risk operations require explicit step-up confirmation phrases in [`src/lib/securityEngine.ts:424-452`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/securityEngine.ts#L424-L452) (`"RESTORE-DATABASE-CONFIRM"`, `"CONFIRM-ACCOUNT-SUSPEND"`).

---

## 6. Summary of Existing vs Missing Mitigations

| Threat Category | Existing Security Controls | Identified Gaps / Missing Mitigations |
| :--- | :--- | :--- |
| **Authentication** | Bcrypt cost 12, JWT HS256, DB session verification, dual-channel revocation, composite lockout key | Public admission endpoint lacks rate limiting |
| **Authorization** | Edge middleware, in-handler RBAC, Guardian IDOR scoping, Teacher assignment scoping | Teacher role granted unscoped GET access to admin academic routes in middleware |
| **Data Integrity** | Atomic ACID transactions, unique DB constraints, WAL journal mode | Financial refunds lack dual-person approval |
| **Data Privacy** | Zero PII on public verification routes, secure cookie flags | High-volume query pagination bounds need strict enforcement |
| **Auditing & Alerting** | Append-only security events store, automatic alert escalation on HIGH/CRITICAL events | Automated alerting to external SIEM/Syslog not configured |
