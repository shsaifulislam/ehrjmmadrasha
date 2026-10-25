# EHRJ Digital Campus & ERP — API Error Reference & Diagnostics Catalog

> **System:** Eliotgonj Hazi Rohmatollah Jamiria Madrasha Web Application & Enterprise ERP  
> **Scope:** Error Envelopes, HTTP Status Mappings, Trigger Conditions & Client Mitigations  
> **Total Endpoints Analyzed:** 469 Route Files  
> **Date:** October 2026

---

## 1. Error Handling Architecture & Philosophy

The EHRJ backend utilizes Next.js App Router error handling paradigms combined with standard HTTP status semantics. Route handlers execute within structured `try / catch` blocks that catch exceptions, log diagnostic traces to the server console, and return user-facing JSON error payloads.

### 1.1 Global HTTP Status Code Mappings

| HTTP Status | Semantic Category | Common Triggers in EHRJ | Standard Response Structure |
| :---: | :--- | :--- | :--- |
| **400** | Bad Request | Missing required fields, invalid phone format, negative amounts, failed confirmation phrase | `{ "error": "<Bengali Message>" }` |
| **401** | Unauthorized | Missing session token, expired JWT, invalid bearer signature | `{ "error": "অননুমোদিত: অনুগ্রহ করে লগইন করুন (401)" }` |
| **403** | Forbidden | Role hierarchy violation (e.g. Guardian accessing Admin API, Teacher modifying exams) | `{ "error": "অননুমোদিত অ্যাক্সেস: কেবলমাত্র অ্যাডমিনের জন্য (403)" }` |
| **404** | Not Found | Resource ID does not exist in SQLite DB (student, class, book, fee invoice) | `{ "error": "<Entity> খুঁজে পাওয়া যায়নি।" }` |
| **409** | Conflict | Duplicate student ID, duplicate roll number, overlapping leave dates, duplicate TrxID | `{ "error": "এই তথ্যটি পূর্বে নিবন্ধিত হয়েছে।" }` |
| **422** | Unprocessable Entity | Domain logic validation failure (e.g. invalid date order, closed financial period) | `{ "error": "<Validation details>" }` |
| **429** | Too Many Requests | Brute-force rate limit exceeded on login or OTP endpoints | `{ "error": "অতিরিক্ত অনুরোধ। কিছুক্ষণ পর পুনরায় চেষ্টা করুন।" }` |
| **500** | Internal Server Error | Unhandled SQLite exception, foreign key constraint failure, disk I/O failure | `{ "error": "সার্ভারে ত্রুটি ঘটেছে। দয়া করে পুনরায় চেষ্টা করুন।" }` |

---

## 2. Error Envelope Discrepancy Analysis

Across the 469 route handlers in the application, three primary error envelope patterns were detected:

### Pattern A: Direct Error Property (`{ error: string }`) — 1,297 occurrences
```json
{
  "error": "ব্যবহারকারী খুঁজে পাওয়া যায়নি।"
}
```
*Location:* Standard in administrative CRUD operations, authentication guards, and resource lookups.

### Pattern B: Success-Flagged Error Property (`{ success: false, error: string }`) — 584 occurrences
```json
{
  "success": false,
  "error": "শ্রেণি তালিকা লোড করতে ব্যর্থ হয়েছে।"
}
```
*Location:* Standard in academic engines, admission processing, and financial calculations.

### Pattern C: Message Property Only (`{ message: string }`) — 6 occurrences
```json
{
  "message": "অননুমোদিত অ্যাক্সেস।"
}
```
*Location:* Legacy middleware fallbacks and raw text responses.

> [!NOTE]
> While both Pattern A and Pattern B are handled by standard UI toast notifications in the EHRJ frontend (which inspect `data.error || data.message`), standardizing on a single unified error envelope will improve API contract predictability for external integrations and automated testing.

---

## 3. Comprehensive Error Reference Catalog

### 3.1 Authentication & Authorization Errors

#### ERR-AUTH-001: Missing Session Token
- **Status:** `401 Unauthorized`
- **Error Code:** `ERR_UNAUTHENTICATED`
- **Returned Structure:** `{ "error": "অননুমোদিত: অনুগ্রহ করে লগইন করুন (401 Unauthorized)" }`
- **Trigger:** Request to protected `/api/admin/**`, `/api/teacher/**`, `/api/principal/**`, or `/api/portal/**` without the `ehrj_session_token` cookie or `Authorization: Bearer` header.
- **Affected Endpoints:** All protected endpoints across the ERP.
- **Client Action:** Redirect browser to `/login?redirect=<current_path>`.
- **Implementation Evidence:** `src/middleware.ts:51-54`

#### ERR-AUTH-002: Invalid or Expired Session Token
- **Status:** `401 Unauthorized`
- **Error Code:** `ERR_TOKEN_EXPIRED`
- **Returned Structure:** `{ "error": "অবৈধ বা মেয়াদোত্তীর্ণ সেশন (401 Unauthorized)" }`
- **Trigger:** Session cookie or JWT has expired (exceeded 8-hour window) or has an invalid signature.
- **Affected Endpoints:** All protected routes.
- **Client Action:** Clear client storage, display "Session Expired" alert, and redirect to `/login`.
- **Implementation Evidence:** `src/middleware.ts:151-154`

#### ERR-AUTH-003: Insufficient Role Permissions (RBAC Violation)
- **Status:** `403 Forbidden`
- **Error Code:** `ERR_FORBIDDEN_ROLE`
- **Returned Structure:** `{ "error": "অননুমোদিত অ্যাক্সেস: কেবলমাত্র অ্যাডমিনের জন্য প্রযোজ্য (403 Forbidden)" }`
- **Trigger:** User authenticated with `GUARDIAN` or `TEACHER` role attempts to perform write/admin actions on `/api/admin/**`.
- **Affected Endpoints:** `/api/admin/**`, `/api/principal/**`.
- **Client Action:** Display access denied screen; prevent user from attempting further privileged requests.
- **Implementation Evidence:** `src/middleware.ts:81-84`

---

### 3.2 Validation & Input Malformation Errors

#### ERR-VAL-001: Missing Required Request Fields
- **Status:** `400 Bad Request`
- **Error Code:** `ERR_MISSING_FIELDS`
- **Returned Structure:** `{ "error": "প্রয়োজনীয় তথ্য প্রদান করা হয়নি।" }`
- **Trigger:** POST/PUT request body is missing mandatory fields (e.g. `studentNameBn`, `fatherPhone`, `classId`).
- **Affected Endpoints:** `/api/admission`, `/api/admin/academic/classes`, `/api/admin/students`.
- **Client Action:** Highlight invalid input fields in the user form and display inline validation messages.
- **Implementation Evidence:** Handlers check `if (!name || !code) return NextResponse.json({ error: ... }, { status: 400 })`.

#### ERR-VAL-002: Invalid Mobile Phone Number Format
- **Status:** `400 Bad Request`
- **Error Code:** `ERR_INVALID_PHONE`
- **Returned Structure:** `{ "error": "মোবাইল নম্বরটি ১১ ডিজিটের সঠিক বাংলাদেশি নম্বর হতে হবে (যেমন: 01XXXXXXXXX)।" }`
- **Trigger:** Phone number string fails regex `^01[3-9]\d{8}$`.
- **Affected Endpoints:** `/api/admission`, `/api/auth/register`, `/api/portal/finance/pay`.
- **Client Action:** Validate phone format on client before dispatching request.

#### ERR-VAL-003: High-Risk Step-Up Verification Failure
- **Status:** `400 Bad Request`
- **Error Code:** `ERR_STEP_UP_FAILED`
- **Returned Structure:** `{ "error": "নিরাপত্তা নিশ্চিতকরণ বাক্য সঠিক নয়।" }`
- **Trigger:** Destructive administrative action (e.g. Account Suspend, Database Wipe, Ledger Lock) submitted with an incorrect `confirmationPhrase`.
- **Affected Endpoints:** `/api/admin/security/accounts`, `/api/admin/governance/locks`.
- **Client Action:** Prompt administrator to type the exact confirmation phrase shown in the dialog.
- **Implementation Evidence:** `src/lib/securityEngine.ts:verifyHighRiskAction`

---

### 3.3 Resource & State Conflict Errors

#### ERR-RES-001: Target Entity Not Found
- **Status:** `404 Not Found`
- **Error Code:** `ERR_NOT_FOUND`
- **Returned Structure:** `{ "error": "রেকর্ড খুঁজে পাওয়া যায়নি।" }`
- **Trigger:** Route parameter ID does not match any record in the target Prisma model.
- **Affected Endpoints:** All `GET /api/admin/*/[id]`, `PUT /api/admin/*/[id]`, `DELETE /api/admin/*/[id]`.
- **Client Action:** Display 404 Empty State component and allow user to navigate back to the list view.
- **Implementation Evidence:** `if (!record) return NextResponse.json({ error: ... }, { status: 404 })`.

#### ERR-CON-001: Duplicate Record Conflict
- **Status:** `409 Conflict` (or `400 Bad Request`)
- **Error Code:** `ERR_DUPLICATE_ENTRY`
- **Returned Structure:** `{ "error": "এই নম্বরে ইতিমধ্যে একটি আবেদন বা অ্যাকাউন্ট রয়েছে।" }`
- **Trigger:** Unique constraint violation on `birthCertificateNo`, `username`, `email`, or `transactionId`.
- **Affected Endpoints:** `/api/admission`, `/api/auth/register`, `/api/portal/finance/pay`.
- **Client Action:** Prompt user that the entity already exists and offer login or tracking lookup instead.
- **Implementation Evidence:** Pre-check queries `prisma.student.findUnique({ where: { birthCertificateNo } })`.

---

### 3.4 System & Infrastructure Failures

#### ERR-SYS-001: Unhandled SQLite / Prisma Database Error
- **Status:** `500 Internal Server Error`
- **Error Code:** `ERR_DATABASE_FAILURE`
- **Returned Structure:** `{ "error": "ডাটাবেজ অপারেশনে সমস্যা দেখা দিয়েছে।" }`
- **Trigger:** SQLite database busy / locked condition, disk quota, or foreign key constraint violation during cascade deletion.
- **Affected Endpoints:** All database-interacting endpoints.
- **Client Action:** Display user-friendly error dialog with retry button; notify administrator if persistent.
- **Implementation Evidence:** Handlers catch blocks logging error to `console.error` and returning 500.

#### ERR-SYS-002: Third-Party SMS / Email Gateway Failure
- **Status:** `500 Internal Server Error` (or `200 OK` with partial delivery warning)
- **Error Code:** `ERR_EXTERNAL_GATEWAY`
- **Returned Structure:** `{ "success": true, "smsSent": false, "warning": "মেসেজ গেটওয়ে সংযোগ বিচ্ছিন্ন।" }`
- **Trigger:** Greenweb SMS gateway timeout, invalid SMS API key, or SMTP server unreachable.
- **Affected Endpoints:** `/api/admin/communications/sms/send`, `/api/auth/forgot-password/send-otp`.
- **Client Action:** Log transaction as queued; retry via background queue or notify user of SMS delay.
