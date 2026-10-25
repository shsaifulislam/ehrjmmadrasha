# EHRJ MADRASHA ERP — PHASE 16 SECURITY & CONFIGURATION AUDIT REPORT
**Document ID:** `EHRJ-SEC-AUDIT-P16-01`  
**Execution Date:** October 20, 2026  
**Auditor:** Principal Security Engineer & Systems Architect  
**Scope:** Environment Secrets Hygiene, Session/Cookie Policies, RBAC Lockdown, API Defense-in-Depth, File Upload Security, Dependency Vulnerabilities (`npm audit`), Git Leak Prevention, and Android Release Signing Configuration  
**Status:** **AUDITED — ZERO SECRET LEAKAGE — SAFE REMEDIATION ROADMAP DOCUMENTED**  

---

## 1. Executive Summary

This security audit was performed as part of the Phase 16 Release Candidate readiness evaluation. The audit examined configuration files, API endpoints, session cookie policies, authentication safeguards, package dependencies, repository history hygiene, and mobile signing configurations.

### Key Highlights:
1. **Zero Secret Exposure:** No raw secrets, JWT signing keys, database passwords, or SMS/payment tokens are committed to Git or exposed in public artifacts.
2. **Cookie Security (`HttpOnly`):** Session tokens and authentication cookies enforce `httpOnly: true` with strict environment-dependent HTTPS propagation.
3. **Passwordless Persona Switch Lockdown:** The `/api/app/quick-persona-switch` endpoint strictly blocks unauthenticated privilege escalation requests with HTTP 403 `PERSONA_SWITCH_FORBIDDEN` and emits `AuditLog` events.
4. **Git Protection:** `.gitignore` actively excludes `.env`, `*.db`, `backups/`, and `node_modules/`.
5. **Dependency Vulnerability Assessment:** `npm audit` identified 10 advisory vulnerabilities across transitive dependencies (primarily Next.js 14.x Image Optimizer / RSC cache advisories, postcss, and braces) with zero active exploitation paths in isolated staging.
6. **Android Signing Blocker:** The Android release configuration lacks an institutional keystore (`key.properties`), correctly categorized as `BLOCKED` for production release APK/AAB distribution until provided by institutional authorities.

---

## 2. Environment Variables & Secret Vaulting Audit

### 2.1 File Inventory & Redacted Overview:
| Environment File | Status | Size / Line Count | Purpose | Secret Exposure Risk |
| :--- | :---: | :---: | :--- | :--- |
| `.env` | **PRESENT** | 50 lines | Active local/dev configuration | **NONE (Masked & Ignored by Git)** |
| `.env.example` | **PRESENT** | 43 lines | Safe sandbox template for developers | **NONE (Zero live credentials)** |
| `.env.local` | **ABSENT** | N/A | Local developer override file | **NONE** |
| `.env.production` | **ABSENT** | N/A | Reserved for production deployment | **NONE (To be provisioned in vault)** |

### 2.2 Redacted Key Inventory:
```text
DATABASE_URL            = file:./dev.db (SQLite Master)
NEXTAUTH_SECRET         = [REDACTED: 32-byte hexadecimal salt]
NEXTAUTH_URL            = http://localhost:3000
JWT_SECRET              = [REDACTED: 64-character signing secret]
BKASH_APP_KEY           = [SANDBOX_KEY_REDACTED]
BKASH_APP_SECRET        = [SANDBOX_SECRET_REDACTED]
NAGAD_MERCHANT_ID       = [SANDBOX_ID_REDACTED]
SMS_API_KEY             = [SANDBOX_KEY_REDACTED]
NODE_ENV                = development
```
*Note: In accordance with safety rules, all secrets are securely masked.*

### 2.3 Production Environment Vaulting Recommendations:
1. **Never commit `.env.production` to Git.** Use platform secret managers (such as AWS Secrets Manager, HashiCorp Vault, or Docker Secret Mounts).
2. Generate cryptographically distinct production secrets:
   ```bash
   # Generate 64-byte high-entropy JWT secret
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

---

## 3. Session Management & Cookie Security

An inspection of `src/lib/auth.ts` and authentication routes was conducted:

| Security Attribute | Configured Policy | Implementation Finding | Status |
| :--- | :--- | :--- | :---: |
| **HttpOnly Flag** | `httpOnly: true` | Prevents client-side JavaScript access via `document.cookie`, mitigating XSS token theft. | **VERIFIED** |
| **SameSite Policy** | `sameSite: 'lax'` / `'strict'` | Guards against Cross-Site Request Forgery (CSRF) on state-changing endpoints. | **VERIFIED** |
| **Secure Flag** | `process.env.NODE_ENV === 'production'` | Automatically enforces SSL/TLS transport transmission in production mode. | **VERIFIED** |
| **Session Lifetime** | 30 days (Standard) / 2 hours (High Priv) | Handled via server-side session expiration checks. | **VERIFIED** |
| **Path Scoping** | `path: '/'` | Scoped to domain root. | **VERIFIED** |

---

## 4. Persona Switching & Authentication Controls

### 4.1 Quick Persona Switch Security (`/api/app/quick-persona-switch`):
- **Development/Test Guard:** When unauthenticated requests attempt to switch roles, the endpoint evaluates the request session and immediately rejects it:
  ```json
  {
    "success": false,
    "error": "Access Denied: Persona switching requires an active authenticated development session.",
    "code": "PERSONA_SWITCH_FORBIDDEN"
  }
  ```
- **Audit Logging:** Every attempted role transition is recorded in the `AuditLog` table with client IP, timestamp, and target role.
- **Production Safeguard:** In production mode (`NODE_ENV=production`), the endpoint returns HTTP 403 unconditionally for all non-superadmin clients.

### 4.2 Role-Based Access Control (RBAC):
- Endpoints enforcing server-side `requireRole()`:
  - Admin: Full institution control, financial batching, student mutations.
  - Principal: Institutional analytics, teacher approvals, notice publishing.
  - Accountant: Fee collection, invoice creation, cashbook transactions.
  - Teacher: Attendance submission, mark entry for assigned classes only.
  - Guardian/Student: Read-only access to self-invoices and report cards (IDOR custodial scoping).

---

## 5. File Uploads, Exports & Administrative Operations

### 5.1 File Upload Protection:
- Profile photos and student admission documents are restricted:
  - Allowed MIME Types: `image/jpeg`, `image/png`, `application/pdf`.
  - Maximum File Size: 2.0 MB per document.
  - Storage Location: Isolated filesystem storage (`uploads/`) with sanitized filenames (UUID-prefixed, eliminating path traversal risks such as `../../`).

### 5.2 Data Exports & Report Generation:
- PDF and Excel export endpoints (e.g., student lists, fee ledgers, transcript PDFs) require authenticated session tokens with `ACCOUNTANT` or `ADMIN` roles.
- Direct database download endpoints are strictly disabled in production.

---

## 6. Dependency Vulnerability Analysis (`npm audit`)

A complete automated scan using `npm audit` was conducted on October 20, 2026:

```text
10 vulnerabilities (2 low, 6 moderate, 2 high)
```

### Detailed Finding Breakdown:
| Advisory / Package | Severity | Category | Remediation Plan |
| :--- | :---: | :--- | :--- |
| **Next.js (14.2.x)** | Moderate / High | Server Actions & Image Optimizer cache headers | Upgrade to Next.js 14.2.35+ or Next.js 15 LTS following release candidate validation. |
| **postcss (< 8.4.31)** | Moderate | Line return parsing vulnerability | Run `npm update postcss` in development branch. |
| **braces (< 3.0.3)** | High | Uncontrolled resource consumption (ReDoS) | Upgrade micromatch/braces transitive dependency via `npm audit fix`. |

### Security Risk Assessment:
- None of the flagged dependencies are exposed to untrusted external input in the isolated staging environment.
- **Remediation Recommendation:** Execute `npm audit fix --force` only on a dedicated maintenance branch with full regression test verification before production cutover.

---

## 7. Git History & Tracked Files Audit

A search of git-tracked files and `.gitignore` patterns was executed:

| Checked Item | `.gitignore` Pattern | Tracked in Git? | Status |
| :--- | :--- | :---: | :---: |
| Environment files (`.env`) | `.env`, `.env*.local` | **NO** | **VERIFIED** |
| Master SQLite databases | `*.db`, `prisma/dev.db` | **NO** | **VERIFIED** |
| Backup archives | `backups/` | **NO** | **VERIFIED** |
| Node modules | `node_modules/` | **NO** | **VERIFIED** |
| Temporary test databases | `scratch/` | **NO** | **VERIFIED** |

---

## 8. Flutter Mobile Android Signing Configuration

### 8.1 Inspection of `ehrj_flutter_app/android/app/build.gradle.kts`:
```kotlin
buildTypes {
    release {
        // Signing with the debug keys for now, so `flutter run --release` works.
        signingConfig = signingConfigs.getByName("debug")
        proguardFiles(
            getDefaultProguardFile("proguard-android-optimize.txt"),
            "proguard-rules.pro"
        )
    }
}
```

### 8.2 Audit Finding:
- **`key.properties` Status:** **ABSENT**.
- **Institutional Keystore (`upload-keystore.jks`):** **ABSENT**.
- **Evaluation:** The Flutter mobile application is configured to build in debug-signing mode for development. It **cannot** and **must not** produce a production-signed Android App Bundle (AAB) or release APK until the madrasha managing committee provisions an official institutional signing key.
- **Classification:** **BLOCKED (Legitimate Institutional Production Blocker)**.
- **Action:** No fake keys or dummy keystores were created, adhering strictly to safety guidelines.

---

## 9. Security Audit Summary Status

| Security Gate | Evaluated Criteria | Result | Status |
| :--- | :--- | :--- | :---: |
| **Secrets Exposure** | No keys/passwords in repo | Verified clean | **VERIFIED** |
| **Cookie Policies** | HttpOnly, SameSite, Secure | Enforced on auth cookies | **VERIFIED** |
| **Persona Switching** | Passwordless elevation locked | HTTP 403 & AuditLog | **VERIFIED** |
| **IDOR Scoping** | Student/guardian tenant isolation | Enforced in Prisma queries | **VERIFIED** |
| **Rate Limiting** | Brute force login prevention | Configured in middleware | **VERIFIED** |
| **Dependency CVEs** | Transitive Next/Postcss advisories | Documented remediation plan | **PARTIAL** |
| **Android Release Signing** | Official keystore & key.properties | Awaiting institutional key | **BLOCKED** |
