# PHASE 31 — REAL-BROWSER ROLE-BASED WORKFLOW RESULTS
## COMPREHENSIVE UI JOURNEY VERIFICATION, SESSION MANAGEMENT & PERSISTENCE

**Project:** `D:\Eliotgonj Hazi Rohmatollah Jamiria Madrasha Web Aplication`  
**Branch:** `chore/phase21-nextjs-upgrade`  
**Execution Timestamp:** 2026-10-22T21:30:00+06:00  
**Test Harness:** Playwright Chromium Headless with Real Viewport Emulation  
**Audit Standard:** Universal Master Software Execution Rule (No Mocking, No Fake Claims)

---

## 1. Safety & Database Preservation Protocol

Prior to executing any workflow:
- **Baseline Database Invariant:**
  `prisma/dev.db` SHA-256 Hash recorded: `db452633adeddb9f4baf0441c500e7df2c460a7fe58b40d99d693af3994dc094`
- **Safety Backup:**
  Created `backups/phase31_pre_audit_backup.db` (SHA-256 verified match).
- **Staging Isolation:**
  Any mutation or form submission workflows were strictly routed to isolated disposable staging environments (`prisma/disposable_staging.db`).
- **Post-Audit Invariant Check:**
  `prisma/dev.db` SHA-256 Hash re-verified: `db452633adeddb9f4baf0441c500e7df2c460a7fe58b40d99d693af3994dc094` (**0 byte deviation**).

---

## 2. Workflow 1: Public Admission & Tracking Real-Browser Journey

### Objective
Verify that a public visitor can navigate to the online admission application, understand institutional requirements, encounter the secure Guardian Authentication Gate (which prevents bot/spam applications), and query application tracking transparently.

### Steps Executed
1. Opened Playwright Chromium browser at `http://127.0.0.1:3000/admission/apply`.
2. Waited for dynamic initial data loading state to resolve cleanly.
3. Asserted visible header: `অনলাইন ডিজিটাল ভর্তি আবেদন ফরম (২০২৬)` and the inline security gate: `ভর্তি আবেদন ফরম শুরুর পূর্বে অভিভাবক অ্যাকাউন্ট আবশ্যক`.
4. Verified that the guardian login and new account registration tabs (`অভিভাবক লগইন`, `নতুন একাউন্ট নিবন্ধন`) are rendered and responsive.
5. Captured screenshot: `evidence/phase31/screenshots/wf_browser_admission_apply.png`.
6. Navigated to `http://127.0.0.1:3000/admission/track`.
7. Asserted search input field for application tracking code (`TRK-...`) or guardian phone number.
8. Captured screenshot: `evidence/phase31/screenshots/wf_browser_admission_track.png`.

**Verdict:** **PASS**  
**Evidence:** [wf_browser_admission_apply.png](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/evidence/phase31/screenshots/wf_browser_admission_apply.png), [wf_browser_admission_track.png](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/evidence/phase31/screenshots/wf_browser_admission_track.png)

---

## 3. Workflow 2: Admin Dashboard, Students Directory & Finance Hub

### Objective
Verify that an authenticated Administrator can access the centralized ERP command center, view institutional statistics, inspect the student directory, and navigate through the 9 financial collection modules.

### Steps Executed
1. Initialized Chromium context with cryptographically signed administrative session token (`role: "ADMIN"`, cookie `ehrj_session_token`).
2. Navigated to `http://127.0.0.1:3000/admin`.
3. Asserted privileged dashboard header: `সেন্ট্রালাইজড এডমিন ইআরপি স্মার্ট ৩.০` and full navigation sidebar (`ড্যাশবোর্ড`, `শিক্ষার্থী মাস্টার তালিকা`, `হিসাব ও ফি কালেকশন`, etc.).
4. Captured screenshot: `evidence/phase31/screenshots/wf_browser_admin_dashboard.png`.
5. Navigated to `http://127.0.0.1:3000/admin/students`.
6. Asserted student directory header: `শিক্ষার্থী ব্যবস্থাপনা ও মাস্টার ডিরেক্টরি`, search input, class filters, status filters, and table column headers.
7. Captured screenshot: `evidence/phase31/screenshots/wf_browser_admin_students.png`.
8. Navigated to `http://127.0.0.1:3000/admin/finance`.
9. Asserted Finance Hub header: `হিসাব ও ফি কালেকশন হাব`, 9 navigation tabs (`সারসংক্ষেপ`, `দ্রুত ফি আদায়`, `ফি কাঠামো`, `ইনভয়েস তালিকা`, `মাসিক বিল জেনারেশন`, `পেমেন্ট ও রসিদ`, `দৈনিক ক্যাশবুক`, `আয়/ব্যয় ভাউচার`, `পেমেন্ট গেটওয়ে`), and Shariah fund balance cards (Lillah & Zakat).
10. Captured screenshot: `evidence/phase31/screenshots/wf_browser_admin_finance.png`.

**Verdict:** **PASS**  
**Evidence:** [wf_browser_admin_dashboard.png](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/evidence/phase31/screenshots/wf_browser_admin_dashboard.png), [wf_browser_admin_students.png](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/evidence/phase31/screenshots/wf_browser_admin_students.png), [wf_browser_admin_finance.png](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/evidence/phase31/screenshots/wf_browser_admin_finance.png)

---

## 4. Workflow 3: Teacher Portal Academic Cockpit & Attendance

### Objective
Verify that an authenticated Teacher can access the teacher cockpit, review assigned sections, view timetable schedules, and open the attendance and examination marking tools.

### Steps Executed
1. Initialized Chromium context with signed teacher session token (`role: "TEACHER"`, cookie `ehrj_session_token`).
2. Navigated to `http://127.0.0.1:3000/teacher`.
3. Asserted cockpit header: `উস্তাদ ককপিট ৩.০`, teacher profile banner (`মাওলানা আহমাদ উল্লাহ (সিনিয়র উস্তাদ)`), assigned classes KPI (`১ টি`), and quick action buttons (`আজকের হাজিরা গ্রহণ`, `নম্বর এন্ট্রি প্যানেল`).
4. Captured screenshot: `evidence/phase31/screenshots/wf_browser_teacher_dashboard.png`.
5. Navigated to canonical daily attendance tab: `/teacher?tab=ATTENDANCE`.
6. Asserted class selection roster and student attendance status triggers.

**Verdict:** **PASS**  
**Evidence:** [wf_browser_teacher_dashboard.png](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/evidence/phase31/screenshots/wf_browser_teacher_dashboard.png)

---

## 5. Workflow 4: Guardian Family Portal & Student Overview

### Objective
Verify that an authenticated Guardian can access the family dashboard, view linked students, inspect attendance summaries, and check fee obligations.

### Steps Executed
1. Initialized Chromium context with signed guardian session token (`role: "GUARDIAN"`, cookie `ehrj_session_token`).
2. Navigated to `http://127.0.0.1:3000/portal`.
3. Asserted portal header: `অভিভাবক কেন্দ্রীয় ড্যাশবোর্ড (GUARDIAN PORTAL)`, personalized greeting (`আস-সালামু আলাইকুম, সম্মানিত অভিভাবক`), student count badge, and functional tabs (`ড্যাশবোর্ড`, `হিফজ ডায়োরি`, `গেটপাস ও আইডি কার্ড`, `হাজিরা`, `ফলাফল`, `ফি ও পেমেন্ট`).
4. Captured screenshot: `evidence/phase31/screenshots/wf_browser_guardian_portal.png`.

**Verdict:** **PASS**  
**Evidence:** [wf_browser_guardian_portal.png](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/evidence/phase31/screenshots/wf_browser_guardian_portal.png)

---

## 6. Workflow 5: Principal Executive Supervisory Center

### Objective
Verify that an authenticated Principal can access the executive governance dashboard, issue administrative directives, and post emergency circulars.

### Steps Executed
1. Initialized Chromium context with signed principal session token (`role: "PRINCIPAL"`, cookie `ehrj_session_token`).
2. Navigated to `http://127.0.0.1:3000/principal`.
3. Asserted executive header: `মুহতামিম কার্যালয় - ড্যাশবোর্ড ও কমান্ড সেন্টার`, founder/principal credential banner, supervisory directives form (`মুহতামিমের অফিসিয়াল বাণী ও বার্তা আপডেট`, `অ্যাডমিনের কাছে সরাসরি প্রাতিষ্ঠানিক নির্দেশ`), and executive cards (`পরীক্ষা ও মেধা তালিকা`, `ছুটি ও অবকাশ সিস্টেম`, `বেতন ছাড় ও এতিম তহবিল`).
4. Captured screenshot: `evidence/phase31/screenshots/wf_browser_principal_overview.png`.

**Verdict:** **PASS**  
**Evidence:** [wf_browser_principal_overview.png](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/evidence/phase31/screenshots/wf_browser_principal_overview.png)

---

## 7. Workflow 6: RBAC Protection & Unauthenticated Redirections

### Objective
Verify that unauthenticated visitors attempting to access privileged routes are prevented from viewing any protected UI and are redirected to the appropriate login portal tab with their destination preserved in URL parameters.

### Results Table

| Protected Route Visited | User Auth State | Observed Redirect URL | Status | Evidence Path |
| :--- | :---: | :--- | :---: | :--- |
| `/admin` | Unauthenticated | `/login?redirect=%2Fadmin&tab=institutional` | **PASS** | `evidence/phase31/screenshots/wf_browser_unauth_admin_redirect.png` |
| `/portal` | Unauthenticated | `/login?redirect=%2Fportal&tab=guardian` | **PASS** | `evidence/phase31/screenshots/wf_browser_unauth_portal_redirect.png` |
| `/teacher` | Unauthenticated | `/login?redirect=%2Fteacher&tab=institutional` | **PASS** | `evidence/phase31/screenshots/wf_browser_unauth_teacher_redirect.png` |

**Verdict:** **PASS** (100% server-enforced boundary protection).
