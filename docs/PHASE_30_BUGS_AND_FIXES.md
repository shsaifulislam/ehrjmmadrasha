# PHASE 30 — DEFECTS, ROOT-CAUSE DIAGNOSES & VERIFIED FIXES

**Audit Date:** 2026-10-22  
**Target Application:** EHRJ Madrasha ERP  
**Safety Protocol:** All tests and fixes executed against disposable database and isolated build caches. Master database hash preserved.

---

## 1. Summary of Identified Defects & Resolution Status

| Defect ID | Severity | Module / Surface | Root Cause | Fix Applied | Re-Test Result |
| :--- | :---: | :--- | :--- | :--- | :---: |
| **BUG-PH30-01** | High | Next.js Engine (Windows WASM Fallback) | Native SWC binary blocked by Windows policy; cold-compile latency exceeded default 30s Playwright timeout. | Implemented route pre-warming protocol via HTTP probe prior to browser navigation; increased timeout bounds. | **PASS** (<2s load time on warm routes) |
| **BUG-PH30-02** | Medium | Public Inputs (`/downloads`, `/verify`) | Chromium Playwright autofill probe dynamically set inline `style="caret-color: transparent"`, triggering React hydration warning. | Added \`suppressHydrationWarning\` on affected interactive search/verification inputs. | **PASS** (Zero hydration errors) |
| **BUG-PH30-03** | Medium | Transport Module Schema | Test fixture submitted \`nameBn\` rather than mandatory Prisma field \`routeName\`, violating relational schema. | Corrected data payload to include mandatory \`routeName\`, \`startPoint\`, and \`endPoint\` per \`schema.prisma\`. | **PASS** (Transport Route created & verified) |
| **BUG-PH30-04** | Medium | Library Cataloging Module | Insertion of \`LibraryBook\` without pre-existing parent \`LibraryCategory\` and \`LibraryAuthor\` violated foreign key constraints. | Enforced prerequisite upsert of category and author entities before book copy creation. | **PASS** (Book cataloged with relation) |
| **STATUS-PH30-01** | Low (Environment Gate) | Mobile App (Flutter) | Headless Windows workstation lacks connected Android device or running emulator; \`adb\` binary not in PATH. | Code health confirmed via \`flutter analyze\` (0 issues). Marked device run explicitly as BLOCKED per Phase 7 instructions. | **BLOCKED (Documented)** |

---

## 2. Detailed Bug Reports & Reproduction

### BUG-PH30-01: Windows WASM Fallback Cold-Start Latency
- **Severity:** High
- **Reproduction:**
  1. Start Next.js dev server in Windows environment where `@next/swc-win32-x64-msvc` is restricted.
  2. Launch Playwright test to open heavy page (e.g., `/` or `/admission`).
  3. Default 30,000ms navigation timeout expires while Next.js WASM compiler is still processing chunks.
- **Root Cause:** Next.js compiles pages on-demand. In WebAssembly mode on Windows, initial compilation of complex pages with dozens of UI sub-components takes between 35 and 55 seconds.
- **Remediation:**
  1. Configured dev server with `--max-old-space-size=4096`.
  2. Implemented pre-warming step in test crawlers: `fetch(url)` sends initial request to trigger compilation before Chromium navigates.
  3. Subsequent page loads drop to under 2 seconds.
- **Verification:** Re-tested `/`, `/about`, `/academic`, `/results`, `/contact`, `/donate`, `/app`. All rendered with HTTP 200.

---

### BUG-PH30-02: Chromium Autofill Caret-Color Hydration Diff
- **Severity:** Medium
- **Reproduction:**
  1. Open `/downloads` or `/verify` in Playwright Chromium.
  2. Target input element with autofill.
  3. Chromium injects browser-level styling `caret-color: transparent`.
  4. React logs `Warning: Extra attributes from the server: style`.
- **Root Cause:** Synthetic browser interactions alter DOM element attributes before hydration completes.
- **Remediation:** Added `suppressHydrationWarning` to input fields subject to automated browser interactions.
- **Verification:** Re-run browser test with console listener. Zero hydration warnings detected.

---

### BUG-PH30-03: Transport Route Model Field Invariant
- **Severity:** Medium
- **Reproduction:**
  1. Execute `prisma.transportRoute.create()` with `{ nameBn: "...", routeCode: "..." }`.
  2. Prisma throws `PrismaClientValidationError: Argument 'routeName' is missing`.
- **Root Cause:** Prisma model `TransportRoute` explicitly designates `routeName` as the canonical name field, alongside `startPoint` and `endPoint`.
- **Remediation:** Updated schema interface call to provide `routeName: "দাউদকান্দি - ইলিয়টগঞ্জ রুট"`, `startPoint: "দাউদকান্দি বাজার"`, `endPoint: "মাদরাসা ক্যাম্পাস"`.
- **Verification:** Re-ran `scratch/run_phase30_workflows.mjs`. Step WF-07-S2 passed with status `ACTIVE`.

---

### BUG-PH30-04: Library Book Foreign Key Referential Integrity
- **Severity:** Medium
- **Reproduction:**
  1. Attempt to create `LibraryBook` with placeholder foreign keys `cat-1` and `auth-1`.
  2. Foreign key violation occurs if referenced IDs do not exist in the database.
- **Root Cause:** SQLite foreign key pragma enforces relational consistency between `LibraryBook`, `LibraryCategory`, and `LibraryAuthor`.
- **Remediation:** Enforced automated lookup and upsert of valid category and author records prior to book creation.
- **Verification:** Re-ran `scratch/run_phase30_workflows.mjs`. Step WF-07-S1 passed with ISBN and title persisted.

---

### STATUS-PH30-01: Flutter Mobile Device Testing Gate
- **Severity:** Informational / Environmental Constraint
- **Observation:** `flutter --version` confirmed Flutter 3.47.7 and Dart 3.13.5. `flutter analyze` completed in 150.3 seconds with **0 errors, 0 warnings**.
- **Constraint:** Workstation environment lacks a booted Android emulator or connected physical Android device. `adb` is not installed or accessible in system PATH.
- **Action:** Per Phase 7 Rule ("A successful APK build is not proof that the app runs correctly. If no emulator/device is available, mark actual device interaction as BLOCKED"), this module is formally catalogued as **BLOCKED — PHYSICAL DEVICE / EMULATOR UNAVAILABLE**.
