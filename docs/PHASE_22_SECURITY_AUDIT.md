# EHRJ Madrasha ERP — Phase 22: Security Audit & Threat Boundary Analysis

**Date of Execution:** 2026-10-20  
**Branch:** `chore/phase21-nextjs-upgrade`  
**Security Posture:** Production Gate Locked (Staging Validation Only)

---

## 1. Executive Summary

Phase 22 validated that upgrading the framework to `next@15.5.28` (LTS patched security backport) eliminated all known critical SSR remote code execution (RCE) and denial-of-service vulnerabilities.

### Vulnerability Summary (`npm audit --json`)
| Severity | Count | Status | Notes |
|----------|-------|--------|-------|
| **Critical** | **0** | **RESOLVED** | All SSR image optimization and RCE advisories closed |
| **High** | 6 | **CONTAINED** | Transitive build/dev tooling (`tailwindcss`, `chokidar`, `braces`, `postcss`) |
| **Moderate** | 3 | **CONTAINED** | Build-time CSS parser (`postcss-selector-parser`, `postcss-nested`) |
| **Low / Info** | 0 | **CLEAN** | None |
| **Total** | **9** | **0 Critical Runtime Vulnerabilities** | Build-time only; unexposed to untrusted runtime inputs |

---

## 2. Dependency Advisory Analysis & Threat Containment

### 2.1 Critical Vulnerabilities: 0
In Next.js 14, CVE-2024-34351 and related SSR image optimization buffer overflow/SSRF advisories posed critical severity. Upgrading to `next@15.5.28` closed these vulnerabilities at the engine level.

### 2.2 Transitive Build-Time Advisories
The 9 remaining advisories reside exclusively in build-time and development dependencies:
1. **`braces` / `micromatch` / `fast-glob` / `chokidar` (High):**
   * *Advisory:* Stack-exhaustion denial of service when compiling deeply nested glob patterns.
   * *Exploitability in EHRJ Madrasha ERP:* **Zero runtime exposure.** Used solely during Tailwind CSS compilation and development file watching. No untrusted user inputs pass through glob parsers at runtime.
2. **`postcss` / `postcss-selector-parser` / `postcss-nested` (High & Moderate):**
   * *Advisory:* Path traversal in previous source map auto-loading (`sourceMappingURL`) and quadratic selector parsing complexity.
   * *Exploitability in EHRJ Madrasha ERP:* **Zero runtime exposure.** PostCSS runs only during `npm run build` or local development server startup. Runtime CSS delivery is static.

---

## 3. Runtime Security Boundaries & Access Controls

### 3.1 IDOR & Cross-Student Privacy
* **Test:** Cross-student fee inquiry by an authenticated guardian.
* **Result:** `HTTP 404` with strict authorization boundary enforcement. Guardian cannot access records of students not explicitly linked to their national ID/phone number in the database.

### 3.2 Passwordless Persona Elevation
* **Test:** Attempted unauthorized role switching via API headers/cookies.
* **Result:** Strictly rejected with `HTTP 403: PERSONA_SWITCH_FORBIDDEN`.

### 3.3 Webhook Cryptographic Verification
* **Test:** Unsigned or tampered inbound payment/SMS webhook payload.
* **Result:** Rejected with `HTTP 401: Invalid HMAC signature`.

### 3.4 Public Dynamic Verification Pages
* Dynamic public verification routes (`/verify/student/[id]`, `/verify/document/[token]`, `/verify/gatepass/[token]`, `/library/verify/copy/[token]`):
  * **Privacy Guard:** Return only minimal non-sensitive public metadata (student name, class, card validity, status).
  * **Sensitive Data Shield:** Financial balances, transaction IDs, phone numbers, and addresses are strictly excluded from public verification payloads.

---

## 4. Release Safety & Hardening Boundaries

| Boundary Check | Safety Requirement | Verified Status |
|----------------|---------------------|-----------------|
| **Master SQLite DB** | Byte-for-byte SHA-256 preservation | **VERIFIED** (`db452633...` exact match) |
| **Staging Isolation** | Disposable test data on Port 3001 only | **VERIFIED** (No cross-talk with master DB) |
| **Live Payment Credentials** | Live bKash/Nagad merchant credentials blocked | **VERIFIED** (Test sandbox credentials only) |
| **Live SMS Gateway** | Bulk SMS broadcasting blocked | **VERIFIED** (Console/mock simulation mode) |
| **Android Release Keystore** | No fake keys; signing blocked until institutional approval | **VERIFIED** (Release APK build blocked) |
| **Automated Merge / Deploy** | No automated merge to `main` or production deployment | **VERIFIED** (Branch isolated in `chore/phase21-nextjs-upgrade`) |
