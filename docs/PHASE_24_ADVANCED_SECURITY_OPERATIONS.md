# EHRJ MADRASHA DIGITAL CAMPUS & ERP
## PHASE 24 — ADVANCED SECURITY OPERATIONS, IDENTITY, ACCESS GOVERNANCE & ZERO-TRUST ENGINE

**Institution:**  
- **Bengali:** ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা  
- **English:** Eliotganj Hazi Rohmatollah Jamiria Madrasha (EHRJ Madrasha)  
- **Arabic:** الجامعة الإسلامية رحمة الله إليوت غنج  
- **Location:** পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা, বাংলাদেশ  
- **Checkpoint ID:** `EHRJ-AI-2026-PHASE24`

---

## 1. SECURITY ARCHITECTURE AUDIT MATRIX

Before implementation, an in-depth audit of the current production codebase was performed across all nine mandated architectural areas:

| Area | Current State | Risk Identified | Required Phase 24 Change | Priority |
| :--- | :--- | :--- | :--- | :---: |
| **Authentication** | Passwords hashed with bcrypt (salt 12). Account active check enforced. Login failure responses unified to prevent username enumeration. However, `/api/auth/forgot-password/send-otp` returns 404 on unknown email. | Attackers can enumerate registered parent and teacher email addresses via password reset OTP endpoint. | Unify `/api/auth/forgot-password/send-otp` response to a generic success message regardless of email existence. Add consecutive failure tracking to detect brute-force. | **P1** |
| **Sessions** | JWT token issued in HttpOnly cookie (`ehrj_session_token`) with 7-day expiration. `prisma.session` model exists in schema but is not populated or queried in `getCurrentUser()`. | Stolen or stale JWT tokens cannot be revoked before 7-day expiry; "Logout All Devices" or account suspension does not immediately invalidate active tokens. | Implement dual stateful session tracking: persist sessions in `prisma.session`, check DB validity on requests, and provide instant revocation API. | **P0** |
| **RBAC & Zero-Trust** | Role-based checks performed ad-hoc in controllers (`session.role !== 'ADMIN'`). Principal has broad read access; Teacher has section scope; Guardian has linked children. | Inconsistent permission evaluation across disparate routes; lack of a formal Zero-Trust pipeline with granular permissions. | Establish centralized `verifyZeroTrustAccess()` engine evaluating Identity, Session, Status, Role, Granular Permission, and Resource Scope. | **P1** |
| **IDOR Protection** | Guardian and Teacher routes enforce entity relationship checks (Phase 17). | Parameter tampering in guardian portal routes could expose unlinked children if relationship checks are bypassed. | Formalize `verifyGuardianChildLink(guardianId, studentId)` helper and verify across all child portal workflows with automated test suite. | **P1** |
| **Payments / Webhooks** | Idempotency keys enforced in `PaymentReceipt`; online-only processing enforced (Phase 23 offline queue rejects payment mutations). | Webhook forgery or callback replay if signature validation is absent. | Implement webhook HMAC signature verification, timestamp replay checks, and security event logging for tampered signatures. | **P1** |
| **Files & Documents** | Verification tokens used for public certificate verification; student documents restricted to authorized users. | Path traversal or unauthenticated file enumeration. | Strict filename sanitization, MIME verification, path containment, and authenticated session checks for all private document download routes. | **P1** |
| **AI / RAG Security** | Phase 21 & 22 implemented RBAC retrieval filtering, prompt injection sanitization, PII masking, and master kill-switch. | Indirect injection attempting to manipulate institutional guidance or bypass administrative controls. | Integrate AI security telemetry (`AI_INJECTION_DETECTED`, `AI_PERMISSION_DENIED`) into the centralized security event engine. | **P2** |
| **PWA / Client Cache** | Phase 23 service worker excludes private & mutation APIs from cache; offline draft queue blocks financial/academic finalization. | Sensitive session or student data remaining in client cache across shared device logout. | Enforce client-side cache wipe upon logout and ensure all private APIs include `Cache-Control: no-store`. | **P2** |
| **Backup & Restore** | Backup and Restore in Prisma schema; restore requires exact confirmation phrase ("RESTORE-DATABASE-CONFIRM"). | Accidental or malicious database wipe via restore operation. | Require High-Risk Step-Up confirmation and audit logging for backup initiation, download, and database restoration. | **P1** |

---

## 2. ZERO-TRUST REQUEST PIPELINE

Every incoming sensitive request passes through the server-side Zero-Trust pipeline:

```
[ Incoming Request ]
         │
         ▼
[ 1. Authenticate Request ] ────────► Cryptographic JWT signature check
         │
         ▼
[ 2. Stateful Session Check ] ──────► Verify session active in prisma.session (Not Revoked)
         │
         ▼
[ 3. Account Status Check ] ────────► User status == 'ACTIVE' (Reject if LOCKED/SUSPENDED)
         │
         ▼
[ 4. Role Authorization ] ──────────► Strict Role Check (ADMIN / PRINCIPAL / TEACHER / GUARDIAN)
         │
         ▼
[ 5. Granular Permission ] ─────────► Permission check (e.g. finance.refund, security.manage)
         │
         ▼
[ 6. Resource Scope & Ownership ] ──► Teacher Assignment / Guardian Child link validation
         │
         ▼
[ 7. High-Risk Step-Up Guard ] ─────► If High-Risk action: verify explicit confirmation phrase
         │
         ▼
[ 8. Execute Business Logic & Record Security / Audit Log ]
```

---

## 3. SECURITY EVENT & INCIDENT MODEL

### Event Severities:
- `INFO`: Normal security events (e.g., successful login, clean logout).
- `LOW`: Minor security notices (e.g., password change, profile update).
- `MEDIUM`: Unusual events (e.g., session revoked, single failed login).
- `HIGH`: Suspicious activities (e.g., multiple failed logins, IDOR attempt, rate limit exceeded).
- `CRITICAL`: Active security threats (e.g., brute force attack detected, account locked, unauthorized restore attempt).

### Incident Lifecycle:
$$\text{OPEN} \longrightarrow \text{INVESTIGATING} \longrightarrow \text{CONTAINED} \longrightarrow \text{RESOLVED} \longrightarrow \text{CLOSED}$$

### Incident Priorities:
- `P0`: Catastrophic emergency (database compromise, active data exfiltration).
- `P1`: Critical operational failure (widespread account lockouts, payment gateway compromise).
- `P2`: High risk (targeted brute-force attack on staff accounts, persistent IDOR attempts).
- `P3`: Moderate security anomaly (isolated rate-limit triggers, single suspicious IP).
- `P4`: Low severity or informational security inquiry.
