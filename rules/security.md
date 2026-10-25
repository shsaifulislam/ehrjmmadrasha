# EHRJ Digital Campus & ERP — Comprehensive Security Rules Specification

> **System:** Eliotgonj Hazi Rohmatollah Jamiria Madrasha Web Application & Enterprise ERP  
> **Status:** Authoritative Evidence-Based Security Architecture Extraction  
> **Standard:** Zero-Trust Authorization & Continuous Security Monitoring  
> **Legend:**  
> - `[IMPLEMENTED]` — Directly verified in active code with line-level evidence.  
> - `[INFERRED]` — Derived from security configurations and edge runtime logic.  
> - `[MISSING]` — Recommended security control currently absent in the codebase.  
> - `[UNKNOWN]` — Indeterminate without dynamic penetration testing evidence.

---

## 1. Authentication & Credential Architecture

### SEC-AUTH-001: Strong Password Hashing with Salt Cost Factor 12
- **Status:** `[IMPLEMENTED]`
- **Domain:** Credential Storage
- **Implementation Evidence:** [`src/lib/auth.ts:59-66`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/auth.ts)
- **Rule Specification:** Passwords must never be stored in plaintext. Passwords must be hashed using `bcryptjs` with a minimum cost factor of 12 rounds (`bcrypt.genSalt(12)`).
- **Enforcement Mechanics:** All registration, password change, and seeding routines invoke `hashPassword(plaintext)` before database insertion.

### SEC-AUTH-002: JWT Session Token Issuance & Cryptographic Signing
- **Status:** `[IMPLEMENTED]`
- **Domain:** Session Management
- **Implementation Evidence:** [`src/lib/auth.ts:78-106`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/auth.ts) & [`src/lib/env.ts:40-60`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/env.ts)
- **Rule Specification:** Session tokens are minted as signed JSON Web Tokens using `jose` library (`HS256` algorithm) backed by a 256-bit cryptographically random secret key obtained via `getJwtSecretBytes()`.
- **Session Duration:** Tokens carry an explicit expiration time of 7 days (`.setExpirationTime("7d")`).
- **Clock Skew:** Token verification applies a 30-second clock tolerance (`{ clockTolerance: 30 }`) to prevent issues from minor NTP drift between edge proxy and backend runtime.

### SEC-AUTH-003: Authoritative Database Session Verification & Status Guard
- **Status:** `[IMPLEMENTED]`
- **Domain:** Session Integrity
- **Implementation Evidence:** [`src/lib/auth.ts:192-224`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/auth.ts)
- **Rule Specification:** A valid JWT signature alone is NOT sufficient for authentication. `getCurrentUser` must cross-reference:
  1. `prisma.session.findUnique({ where: { token } })` ensuring the session has not been deleted or expired.
  2. `prisma.user.findUnique({ where: { id: payload.userId } })` verifying that `user.status === "ACTIVE"`.
- **Enforcement Impact:** Users whose status is `LOCKED`, `SUSPENDED`, or `INACTIVE` are instantly rejected, even if they possess a valid, unexpired JWT cookie.

### SEC-AUTH-004: Dual-Channel Session Revocation & Denylist
- **Status:** `[IMPLEMENTED]`
- **Domain:** Session Termination
- **Implementation Evidence:** [`src/lib/auth.ts:19-57, 253-270`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/auth.ts)
- **Rule Specification:** Upon user logout, administrator revocation, or security lockout, tokens are invalidated across two channels:
  1. Database: Deletion of all session rows in `prisma.session`.
  2. Disk Denylist: Token hash appended to `data/security/revoked_tokens.json` via atomic writes with an automated 7-day retention pruning algorithm.

---

## 2. Brute-Force & Denial-of-Service Defense

### SEC-BRUTE-001: Composite Key Rate Limiting & Account Lockout
- **Status:** `[IMPLEMENTED]`
- **Domain:** Authentication Defense
- **Implementation Evidence:** [`src/lib/securityEngine.ts:152-286`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/securityEngine.ts)
- **Rule Specification:** Login attempts are monitored under a composite tracking key: `lock:${normalizedIdentifier}::${ipAddress}`.
  - **Sliding Window:** 10 minutes (600,000 ms).
  - **Threshold:** 5 failed consecutive attempts.
  - **Lockout Duration:** 15 minutes (900,000 ms).
  - **Threat Defense:** The composite key prevents malicious actors from launching distributed denial-of-service attacks to lock legitimate administrators out of their accounts from foreign IP addresses.
- **Persistence:** Lockout state is held in-memory and synchronized to `data/security/lockout_records.json` with a maximum capacity cap of 5,000 records.

---

## 3. Zero-Trust Access & Resource Ownership (IDOR) Rules

### SEC-IDOR-001: Guardian Portal Scope Isolation
- **Status:** `[IMPLEMENTED]`
- **Domain:** Insecure Direct Object Reference (IDOR) Protection
- **Implementation Evidence:** [`src/lib/securityEngine.ts:355-389`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/securityEngine.ts)
- **Rule Specification:** An authenticated user with the `GUARDIAN` role requesting student attendance, academic results, fee structures, or documents MUST have their authorization validated against the server-side relationship in `prisma.guardian`.
- **Enforcement Mechanics:** `verifyZeroTrustAccess` queries the guardian profile and extracts all `linkedStudentIds`. If the requested `targetStudentId` is not contained within this authorized list, an `IDOR_ATTEMPT` security event (Severity: `HIGH`) is logged and the request is aborted with HTTP 403 Forbidden.

### SEC-IDOR-002: Teacher Roster & Assessment Scoping
- **Status:** `[IMPLEMENTED]`
- **Domain:** Privilege Separation
- **Implementation Evidence:** [`src/lib/securityEngine.ts:391-417`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/securityEngine.ts)
- **Rule Specification:** A faculty user holding the `TEACHER` role can only access students, submit attendance, or enter exam marks for classes and sections assigned to them in `TeacherAssignment`.

---

## 4. High-Risk Privileged Operations & Step-Up Verification

### SEC-RISK-001: Step-Up Confirmation Phrases for Destructive Administrative Actions
- **Status:** `[IMPLEMENTED]`
- **Domain:** Privilege Escalation & Accidental Deletion Defense
- **Implementation Evidence:** [`src/lib/securityEngine.ts:424-452`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/securityEngine.ts)
- **Rule Specification:** Sensitive operations cannot execute via simple button clicks. The request payload must supply an exact confirmation phrase:
  - **Account Suspension:** `"CONFIRM-ACCOUNT-SUSPEND"`
  - **Database Restoration:** `"RESTORE-DATABASE-CONFIRM"`
  - **Bulk Centralized Result Publication:** `"CONFIRM-PUBLISH-RESULTS"`
  - **System Backup Purging:** `"DELETE-BACKUP-CONFIRM"`
- **Failure Behavior:** Returns HTTP 400 Bad Request if the phrase is missing or misspelled.

---

## 5. Transport, Browser & Client Hardening Rules

### SEC-TRANS-001: Global Security Response Headers
- **Status:** `[IMPLEMENTED]`
- **Domain:** Browser Protection
- **Implementation Evidence:** [`src/middleware.ts:36-37, 53, 83, 145-146`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/middleware.ts)
- **Rule Specification:** Every HTTP response generated across API routes and web pages must include standard defensive headers:
  - `X-Content-Type-Options: nosniff` (Prevents MIME-sniffing exploits)
  - `X-Frame-Options: SAMEORIGIN` (Mitigates clickjacking attacks)

### SEC-TRANS-002: Secure Cookie Flagging
- **Status:** `[IMPLEMENTED]`
- **Domain:** Session Transport
- **Implementation Evidence:** [`src/lib/auth.ts:123-129`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/auth.ts)
- **Rule Specification:** The session cookie `ehrj_session_token` must be configured with:
  - `httpOnly: true` (Inaccessible to client-side JavaScript, defeating XSS token theft)
  - `sameSite: "lax"` (CSRF defense for top-level navigations)
  - `secure: true` (Enforced when `process.env.NODE_ENV === "production"`)
  - `path: "/"`

---

## 6. Public Privacy & Data Leakage Prevention

### SEC-PRIV-001: Zero PII on Public Document Verification Endpoints
- **Status:** `[IMPLEMENTED]`
- **Domain:** Data Privacy & Public APIs
- **Implementation Evidence:** [`src/app/api/verify/document/[token]/route.ts`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/app/api/verify/document/[token]/route.ts) & [`src/app/api/verify/receipt/[token]/route.ts`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/app/api/verify/receipt/[token]/route.ts)
- **Rule Specification:** The public verification interface accessed by QR codes on printed transcripts and money receipts must NOT leak personally identifiable information.
- **Enforcement Mechanics:**
  - Student names are masked (e.g. `"ম**** হো****"`).
  - Mobile numbers are masked to first 3 and last 2 digits (`"017****89"`).
  - National Birth Certificate numbers and internal user IDs are completely omitted from response payloads.

---

## 7. Audit Logging & Security Event Monitoring

### SEC-AUD-001: Comprehensive Security Event Logging & Incident Escalation
- **Status:** `[IMPLEMENTED]`
- **Domain:** Security Operations
- **Implementation Evidence:** [`src/lib/securityEngine.ts:62-114`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/securityEngine.ts)
- **Rule Specification:** Security-sensitive actions (logins, failed logins, logouts, lockouts, permission denials, IDOR attempts, step-up operations) are written to an append-only JSON event store (`data/security/security_events.json`).
- **Escalation Invariant:** Events tagged with severity `HIGH` or `CRITICAL` automatically mirror into the relational database as active `OperationalAlert` records for administrative triage.
