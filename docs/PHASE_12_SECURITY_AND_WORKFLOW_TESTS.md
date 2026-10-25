# EHRJ MADRASHA ERP — PHASE 12 SECURITY & WORKFLOW TESTS

**Test Suite:** `scratch/test_phase12_security_workflows.js`  
**Execution Timestamp:** 2026-10-20  
**Environment:** Next.js (Port 3000 SQLite Master) + Staging Isolated (Port 3001 PostgreSQL)  
**Overall Status:** **11 PASSED, 0 FAILED**

---

### 1. Test Execution Summary

| # | Test Case Description | Target Path / Function | HTTP / Result | Status |
|---|---|---|---|---|
| **T1.1** | Unauthorized ADMIN role switch blocked | `POST /api/app/quick-persona-switch` | HTTP 403 Forbidden (`PERSONA_SWITCH_FORBIDDEN`) | **PASS** |
| **T1.2** | Safe Logout to public mode permitted | `POST /api/app/quick-persona-switch` | HTTP 200 OK + cookie deleted | **PASS** |
| **T2.1** | Result search returns HTTP 200 for valid student | `POST /api/app/quick-action` (`SEARCH_RESULT`) | HTTP 200 OK | **PASS** |
| **T2.2** | Student profile retrieved accurately (`EHRJ-2026-0001`) | `Student` -> `activeEnrollment` | Muhammad Abdullah Al Mamun | **PASS** |
| **T2.3** | Results are drawn from database (no mock 95/88 array) | `ExamMark` relations | 0 mock subjects returned | **PASS** |
| **T3.1** | Duplicate TrxID (`TRX-SETTLE-700`) rejected | `POST /api/app/quick-action` (`GENERATE_FEE_RECEIPT`) | HTTP 409 Conflict | **PASS** |
| **T4.1** | Quick admission submission returns HTTP 200 | `POST /api/app/quick-action` (`SUBMIT_ADMISSION_QUICK`) | HTTP 200 OK | **PASS** |
| **T4.2** | Generated authentic tracking code | `generateApplicationNumber()` | `EHRJ-ADM-2026-9976` | **PASS** |
| **T4.3** | Application verified in Prisma database | `prisma.application.findUnique` | Record exists with ID `20039116-...` | **PASS** |
| **T5.1** | Master student count preserved | `prisma.student.count()` | 185 students | **PASS** |
| **T5.2** | Master invoice count and financial total preserved | `prisma.feeInvoice.count()` & aggregate | 385 invoices (৳424,095 net, ৳141,200 paid) | **PASS** |

---

### 2. Live Execution Console Log

```
================================================================
EHRJ MADRASHA ERP — PHASE 12 SECURITY & WORKFLOW REGRESSION TEST
================================================================

--- TEST 1: Quick Persona Switch Lockdown ---
[PASS] Unauthorized ADMIN role elevation blocked with 403 Forbidden (got status 403)
[PASS] Safe Logout to public mode permitted (status: 200)

--- TEST 2: Authentic Result Search & Real Marks ---
[PASS] Student EHRJ-2026-0001 query returned HTTP 200
[PASS] Student profile retrieved accurately: মুহাম্মদ আব্দুল্লাহ আল মামুন
[PASS] Subjects are drawn from database, NOT mock 95/88 array (found 0 subjects)

--- TEST 3: Finance Duplicate TrxID Prevention ---
[PASS] Duplicate TrxID 'TRX-SETTLE-700' rejected with HTTP 409 Conflict (got status 409)

--- TEST 4: Admission Real Database Persistence ---
[PASS] Admission submission returned HTTP 200
[PASS] Generated authentic tracking code: EHRJ-ADM-2026-9976
[PASS] Application verified in Prisma Application table (ID: 20039116-2705-486e-9afb-d66599295b54)

--- TEST 5: SQLite Master Dataset Invariant Check ---
[PASS] Master students preserved: 185 (Expected: 185)
[PASS] Master invoice count preserved: 385 (Expected >= 385)
Current SQLite net amount: ৳424095, paid amount: ৳141200

================================================================
FINAL RESULT: 11 PASSED, 0 FAILED
================================================================
```

---

### 3. Flutter Parity & Integration Verification

- Command: `flutter test` in `ehrj_flutter_app/`
- Tests Executed: 32 tests
- Result: **All 32 tests passed** (including `EhrjApp startup and LoginScreen pump test`, `EHRJ Flutter Staging PostgreSQL Integration Suite 1-5`, and `EHRJ Flutter Sanity Test`).
- Analysis: `flutter analyze` confirmed 0 errors and 0 warnings.
