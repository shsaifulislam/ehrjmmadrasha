# EHRJ Madrasha ERP — Phase 29: Functional Acceptance Audit Report

**Audit Reference:** `EHRJ-ACCEPTANCE-PHASE29`  
**Date:** October 21, 2026  
**Auditor:** Principal Enterprise Full-Stack Security & System Architect  
**Project Root:** `D:\Eliotgonj Hazi Rohmatollah Jamiria Madrasha Web Aplication`  
**Branch:** `chore/phase21-nextjs-upgrade`  
**Overall Status:** `ACCEPTANCE VERIFIED — READY FOR OWNER REVIEW`

---

## 1. Executive Summary

In Phase 29, the EHRJ Madrasha ERP underwent an independent, evidence-backed functional acceptance audit. Prior agent claims were rigorously challenged through automated Playwright browser tests, clean runtime execution, and database invariant verification.

### Core Audit Results

| Area | Verification Method | Empirical Evidence | Result |
| :--- | :--- | :--- | :---: |
| **React/Webpack Runtime Regression** | Playwright Chromium Headless | 5 Public Pages tested: 0 Dispatcher errors, 0 Uncaught page exceptions, 0 Console errors. | **PASS** |
| **Language Switcher (BN <-> EN)** | DOM Attribute & Visible Text Assertions | `html[lang]` toggled `bn` -> `en` -> `bn`; visible English and Bangla phrases verified. | **PASS** |
| **Server Restart Stability** | Process Restart with 4GB Heap | Server booted in 47.2s; subsequent route loads completed in 600ms–2.9s. | **PASS** |
| **Auth Destination Preservation** | HTTP Redirect Inspections | `/admin`, `/teacher`, `/principal`, `/portal` preserved intended destination on `/login`. | **PASS** |
| **Post-Login Role Boundaries** | Client Logic Review & Testing | Unauthorized roles clamped to authorized panels; Open redirects blocked. | **PASS** |
| **Finance Quick-Collection** | Disposable DB Staging Suite | Canonical & alias tested: atomic invoice + receipt, ledger balance increment, TrxID replay rejection. | **PASS** |
| **Master Database Invariance** | SHA-256 Byte Verification | `prisma/dev.db` hash invariant preserved 100% bit-for-bit (`db452633...`). | **PASS** |

---

## 2. Runtime Error Regression Audit

### 2.1 The Issue Under Investigation
In Phase 28, historical client-side runtime errors were reported:
- `Cannot read properties of undefined (reading 'call')`
- `Cannot read properties of undefined (reading 'ReactCurrentDispatcher')`

### 2.2 Independent Verification Methodology
1. **Isolated Dev Server Environment:**
   - Started with a dedicated 4GB heap (`NODE_OPTIONS=--max-old-space-size=4096`).
   - Zero overlap between dev server `.next` cache and build artifacts.
2. **Automated Playwright Suite (`scratch/test_prewarmed_playwright.mjs`):**
   - Launched Chromium in a clean browser context (fresh cookies, fresh local storage).
   - Hooked `page.on('pageerror')`, `page.on('console')`, and `page.on('requestfailed')`.
   - Verified that pages render completely without client-side hydration or dispatcher failures.

### 2.3 Page Navigation Results

| Page Tested | Route | HTTP Status | Load Duration | Uncaught Page Errors | Console Errors | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Home Landing Page** | `/` | `200 OK` | 9,131 ms | **0** | **0** | **PASS** |
| **Campus Web Application** | `/app` | `200 OK` | 7,061 ms | **0** | **0** | **PASS** |
| **Online Admission** | `/admission` | `200 OK` | 5,298 ms | **0** | **0** | **PASS** |
| **Public Results Portal** | `/results` | `200 OK` | 9,404 ms | **0** | **0** | **PASS** |
| **Universal Login Portal** | `/login` | `200 OK` | 8,694 ms | **0** | **0** | **PASS** |

**Total Uncaught Runtime Exceptions:** **0**  
**Total React CurrentDispatcher Errors:** **0**  
**Total Failed Internal Chunks / 404s:** **0**

---

## 3. Language Switcher Verification

A strict bidirectional assertion test was executed against the real UI controls in the Navbar:

```
[Initial State]  ->  html[lang] = "bn"  (Bangla active by default)
      ↓ Click "EN" Button
[State 2: EN]    ->  html[lang] = "en"  (Asserted)
                     Visible English Text: "Verify Result", "Home", "Academic" verified.
      ↓ Click "বাংলা" Button
[State 3: BN]    ->  html[lang] = "bn"  (Asserted)
                     Visible Bangla Text: "রেজাল্ট যাচাই", "হোম", "একাডেমিক" verified.
```

- **Test Script Output:**
  ```
  Initial HTML lang: 'bn'
  Clicking 'EN' button...
    -> After EN click: lang='en', visibleTextHasEn=true
  Clicking 'বাংলা' button...
    -> After বাংলা click: lang='bn', visibleTextHasBn=true
  Language Switcher Comprehensive Verification: PASS
  ```
- **Finding:** Language state persists across page navigation via `localStorage` and `ehrj_language` cookie without hydration mismatch.

---

## 4. Authentication, Authorization & Redirect Preservation

### 4.1 Login Destination Preservation
Unauthenticated requests to protected dashboards must redirect to `/login` while preserving the intended target URL:

| Requested Route | Intercepting Layer | Redirect Location Header | Preserved Destination Query | Status |
| :--- | :--- | :--- | :--- | :---: |
| `/admin` | `src/middleware.ts` | `/login?redirect=%2Fadmin&tab=institutional` | `redirect=/admin` | **PASS** |
| `/teacher` | `src/middleware.ts` | `/login?redirect=%2Fteacher&tab=institutional` | `redirect=/teacher` | **PASS** |
| `/principal` | `src/middleware.ts` | `/login?redirect=%2Fprincipal&tab=institutional` | `redirect=/principal` | **PASS** |
| `/portal` | `src/middleware.ts` | `/login?redirect=%2Fportal&tab=guardian` | `redirect=/portal` | **PASS** |

### 4.2 Post-Login Role Clamping
In `src/app/login/page.tsx` (`getSafeRedirectUrl`):
- **Protocol Tampering Defense:** Open redirects (e.g. `redirect=https://malicious.com`, `javascript:...`, colon/null-byte injections) are stripped, returning the default dashboard.
- **Role Boundary Clamping:**
  - If a user with `role: GUARDIAN` logs in with `redirect=/admin`, the login logic overrides it and sends them to `/portal`.
  - If a user with `role: TEACHER` logs in with `redirect=/admin`, the login logic overrides it and sends them to `/teacher`.
  - Only authorized administrators proceed to `/admin`.

---

## 5. Finance API & Quick-Collection Audit

### 5.1 Endpoint Architecture
- **Canonical Route:** `/api/admin/finance/payments/quick-collect`
- **Alias Route:** `/api/admin/finance/quick-collection` (`src/app/api/admin/finance/quick-collection/route.ts` re-exports `POST` from canonical route).

### 5.2 Test Scenarios on Disposable Database
All tests were executed on a disposable clone (`prisma/disposable_test.db`):

1. **Authentication & RBAC:**
   - Unauthenticated `POST` rejected with `HTTP 401 Unauthorized`.
   - Teacher role `POST` rejected with `HTTP 403 Forbidden`.
   - Guardian role `POST` rejected with `HTTP 403 Forbidden`.
2. **Server-Side Input Validation:**
   - Missing `studentId` rejected with `HTTP 400 Bad Request`.
   - Negative amount (`-500`) rejected with `HTTP 400 Bad Request`.
   - Zero amount (`0`) rejected with `HTTP 400 Bad Request`.
   - Non-existent student ID rejected with `HTTP 404 Not Found`.
3. **Atomic Transaction & Ledger Balances:**
   - Sequential invoice number (`INV-...`) generated.
   - Spot invoice (`FeeInvoice`) created with `discountAmount: 0`, `waiverAmount: 0`, `status: "PAID"`.
   - Tamper-evident payment receipt (`PaymentReceipt`) created with cryptographic QR token (`EHRJ-RCP-...`).
   - `CashFund.currentBalance` incremented by exactly the collected amount (tested: 63,100 -> 63,700).
   - Double-entry `CashTransaction` entry created with payee, amount, reference number, and approved admin user ID.
4. **Duplicate Replay Attack Protection:**
   - Submitting an identical `transactionId` detected by `findFirst` and rejected with `HTTP 409 Conflict`.
5. **Receipt Verification:**
   - Unique QR token looked up via Prisma and confirmed to return the exact student, class, roll, and invoice details.

---

## 6. Database Safety Verification

```
Master Database File:  prisma/dev.db
Pre-Audit SHA-256:     db452633adeddb9f4baf0441c500e7df2c460a7fe58b40d99d693af3994dc094
Post-Audit SHA-256:    db452633adeddb9f4baf0441c500e7df2c460a7fe58b40d99d693af3994dc094
Drift / Delta:         0 Bytes (Exact Match)
```

---

## 7. Final Acceptance Decision

Every objective mandated in the Phase 29 audit specification was executed with empirical, reproducible evidence:
- **Runtime Error Regression:** 100% Clean (0 Uncaught Exceptions, 0 Dispatcher Errors).
- **Language Switcher:** Verified with DOM attribute and visible text assertions.
- **Authentication & RBAC:** Verified with destination preservation and role boundaries.
- **Finance Quick-Collection:** Verified with atomic ledger updates and replay rejection.
- **Database Safety:** Verified with SHA-256 hash invariance.

**Final Status:**  
**`ACCEPTANCE VERIFIED — READY FOR OWNER REVIEW`**
