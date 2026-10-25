# EHRJ Digital Campus & ERP — Complete API Endpoints Reference

> **System:** Eliotgonj Hazi Rohmatollah Jamiria Madrasha Web Application & Enterprise ERP  
> **Framework:** Next.js 14 App Router Route Handlers (`src/app/api/**/route.ts`)  
> **Total Active Endpoints:** 469 Route Files (693 HTTP Method Operations)  
> **Base URL:** `http://localhost:3000/api` (Development) | `https://ehrj-madrasa.edu.bd/api` (Production)  
> **Audit Status:** Verified against active source code, SQLite schema, and frontend client calls.

---

## 1. Architectural Overview & Routing Conventions

The EHRJ backend is completely embedded inside the Next.js 14 App Router. Every endpoint corresponds to an explicit route directory containing a `route.ts` file exporting standard asynchronous HTTP method handlers: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, and `OPTIONS`.

### 1.1 Global Invariants & Conventions

| Property | Standard Convention | Implementation Reality |
| :--- | :--- | :--- |
| **Protocol** | HTTPS (Production), HTTP (Local Dev) | Enforced by reverse proxy (Nginx) & Next.js headers |
| **Content-Type** | `application/json` (UTF-8) | Standard on all mutation and query routes |
| **Authentication** | Session Cookie (`ehrj_session_token`) OR `Authorization: Bearer <JWT>` | Verified in Next.js Middleware & `src/lib/auth.ts` |
| **Session Lifetime** | 8 Hours (Rolling sliding window) | Configured in JWT signing logic with 30s clock tolerance |
| **Security Headers** | `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` | Injected globally in `src/middleware.ts` |
| **Database Engine** | SQLite 3 with WAL Mode via Prisma ORM (`@/lib/prisma`) | 120 Schema Models, strict foreign keys |

---

## 2. API Scope & Role-Based Access Control (RBAC) Matrix

Routing security is enforced in two complementary layers:
1. **Edge Middleware Layer (`src/middleware.ts`):** Pattern matches URL paths and validates the JWT session before the route handler is invoked.
2. **Handler Inspection Layer (`getSessionUser()` / `getCurrentUser()`):** Extracts the active principal inside the handler for resource ownership verification.

| Path Prefix | Minimum Required Role | Auth Mechanism | Middleware Protection |
| :--- | :--- | :--- | :--- |
| `/api/admin/**` | `ADMIN`, `PRINCIPAL` (with limited GET access for `TEACHER`) | Cookie / Bearer JWT | Enforced in `src/middleware.ts` |
| `/api/teacher/**` | `TEACHER`, `ADMIN`, `PRINCIPAL` | Cookie / Bearer JWT | Enforced in `src/middleware.ts` |
| `/api/principal/**` | `PRINCIPAL`, `ADMIN` | Cookie / Bearer JWT | Enforced in `src/middleware.ts` |
| `/api/portal/**` | `GUARDIAN`, `ADMIN`, `PRINCIPAL` | Cookie / Bearer JWT | Enforced in `src/middleware.ts` |
| `/api/auth/**` | Public (Login/Recover) / Authenticated (Session/Me) | Token / Cookie | Bypass in middleware; handler enforced |
| `/api/verify/**` | Public (Zero PII, Cryptographic Hash / QR) | None (Public) | Publicly accessible |
| `/api/admission` | Public (Online Intake Form) | None (Public) | Publicly accessible |
| `/api/v1/webhooks/**` | External Provider Signature / IP Whitelist | Gateway Secret | Publicly accessible at boundary |

---

## 3. Complete Endpoint Reference by Domain

### 3.1 Authentication & Session Management (7 Endpoints)

#### `POST /api/auth/forgot-password/reset-password`

- **Purpose:** Authentication, session issuance, credential recovery, and security verification
- **Source File:** [`src/app/api/auth/forgot-password/reset-password/route.ts`](file:///src/app/api/auth/forgot-password/reset-password/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Database Entities:** `passwordResetOtp`, `user`, `session`
- **Side Effects:** Mutates existing records in SQLite DB; Removes records from SQLite DB; Executes atomic multi-table transaction
- **Status Codes:** `400`, `404`, `500`
- **Response Payload Keys:** `error`, `success`, `message`, `আপনার নতুন পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে! এখন লগইন করুন।"`

#### `POST /api/auth/forgot-password/send-otp`

- **Purpose:** Authentication, session issuance, credential recovery, and security verification
- **Source File:** [`src/app/api/auth/forgot-password/send-otp/route.ts`](file:///src/app/api/auth/forgot-password/send-otp/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Database Entities:** `user`, `passwordResetOtp`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB
- **Status Codes:** `429`, `400`, `500`
- **Response Payload Keys:** `error`, `success`, `message`, `তবে ভেরিফিকেশন কোড পাঠানো হয়েছে।"`, `email`

#### `POST /api/auth/forgot-password/verify-otp`

- **Purpose:** Authentication, session issuance, credential recovery, and security verification
- **Source File:** [`src/app/api/auth/forgot-password/verify-otp/route.ts`](file:///src/app/api/auth/forgot-password/verify-otp/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Database Entities:** `passwordResetOtp`
- **Side Effects:** Mutates existing records in SQLite DB
- **Status Codes:** `400`, `429`, `500`
- **Response Payload Keys:** `error`, `success`, `resetToken`, `message`

#### `POST /api/auth/login`

- **Purpose:** Authentication, session issuance, credential recovery, and security verification
- **Source File:** [`src/app/api/auth/login/route.ts`](file:///src/app/api/auth/login/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Database Entities:** `user`, `loginHistory`
- **Side Effects:** Persists new records to SQLite DB; Appends immutable audit/security event
- **Status Codes:** `429`, `400`, `423`, `401`, `403`, `500`
- **Response Payload Keys:** `error`, `success`, `user`, `name`, `username`, `email`, `role`

#### `POST /api/auth/logout`

- **Purpose:** Authentication, session issuance, credential recovery, and security verification
- **Source File:** [`src/app/api/auth/logout/route.ts`](file:///src/app/api/auth/logout/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Side Effects:** Appends immutable audit/security event
- **Status Codes:** `200`
- **Response Payload Keys:** `success`, `message`

#### `GET /api/auth/me`

- **Purpose:** Authentication, session issuance, credential recovery, and security verification
- **Source File:** [`src/app/api/auth/me/route.ts`](file:///src/app/api/auth/me/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`
- **Response Payload Keys:** `authenticated`, `user`

#### `POST /api/auth/register`

- **Purpose:** Authentication, session issuance, credential recovery, and security verification
- **Source File:** [`src/app/api/auth/register/route.ts`](file:///src/app/api/auth/register/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Database Entities:** `user`
- **Side Effects:** Persists new records to SQLite DB; Appends immutable audit/security event; Executes atomic multi-table transaction
- **Status Codes:** `429`, `400`, `409`, `500`
- **Response Payload Keys:** `error`, `success`, `message`, `user`, `name`, `username`, `email`, `role`

### 3.2 Admissions & Intake Processing (32 Endpoints)

#### `GET, POST /api/admin/admissions`

- **Purpose:** Administrative management and ERP operations for admissions
- **Source File:** [`src/app/api/admin/admissions/route.ts`](file:///src/app/api/admin/admissions/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `status`, `sessionId`, `classId`, `source`, `search`, `residentialStatus`, `isOrphan`, `isFinanciallyWeak`, `page`, `limit`
- **Database Entities:** `application`, `jamatClass`, `academicSession`
- **Side Effects:** Persists new records to SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `admissions`, `stats`, `pagination`, `limit`, `totalCount`, `totalPages`, `জন্মতারিখ`, `জামাত`, `অভিভাবকের নাম ও ফোন) প্রদান করুন।"`, `message`

#### `POST /api/admin/admissions/[id]/approve`

- **Purpose:** Administrative management and ERP operations for admissions/:param/approve
- **Source File:** [`src/app/api/admin/admissions/[id]/approve/route.ts`](file:///src/app/api/admin/admissions/[id]/approve/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`
- **Response Payload Keys:** `error`

#### `GET /api/admin/admissions/[id]/audit`

- **Purpose:** Administrative management and ERP operations for admissions/:param/audit
- **Source File:** [`src/app/api/admin/admissions/[id]/audit/route.ts`](file:///src/app/api/admin/admissions/[id]/audit/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Database Entities:** `auditLog`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `auditLogs`

#### `POST /api/admin/admissions/[id]/correction`

- **Purpose:** Administrative management and ERP operations for admissions/:param/correction
- **Source File:** [`src/app/api/admin/admissions/[id]/correction/route.ts`](file:///src/app/api/admin/admissions/[id]/correction/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Database Entities:** `application`
- **Side Effects:** Mutates existing records in SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `400`, `404`, `500`
- **Response Payload Keys:** `error`, `success`, `message`, `application`

#### `POST /api/admin/admissions/[id]/exam-interview`

- **Purpose:** Administrative management and ERP operations for admissions/:param/exam-interview
- **Source File:** [`src/app/api/admin/admissions/[id]/exam-interview/route.ts`](file:///src/app/api/admin/admissions/[id]/exam-interview/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Database Entities:** `application`
- **Side Effects:** Mutates existing records in SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `404`, `400`, `500`
- **Response Payload Keys:** `error`, `success`, `message`, `application`

#### `POST /api/admin/admissions/[id]/reject`

- **Purpose:** Administrative management and ERP operations for admissions/:param/reject
- **Source File:** [`src/app/api/admin/admissions/[id]/reject/route.ts`](file:///src/app/api/admin/admissions/[id]/reject/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Database Entities:** `application`
- **Side Effects:** Mutates existing records in SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `400`, `404`, `500`
- **Response Payload Keys:** `error`, `success`, `message`, `application`

#### `POST /api/admin/admissions/[id]/review`

- **Purpose:** Administrative management and ERP operations for admissions/:param/review
- **Source File:** [`src/app/api/admin/admissions/[id]/review/route.ts`](file:///src/app/api/admin/admissions/[id]/review/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Database Entities:** `application`
- **Side Effects:** Mutates existing records in SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `404`, `400`, `500`
- **Response Payload Keys:** `error`, `success`, `message`, `application`

#### `GET, PATCH /api/admin/admissions/[id]`

- **Purpose:** Administrative management and ERP operations for admissions/:param
- **Source File:** [`src/app/api/admin/admissions/[id]/route.ts`](file:///src/app/api/admin/admissions/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Database Entities:** `application`, `jamatClass`, `section`, `academicSession`, `student`, `auditLog`
- **Side Effects:** Mutates existing records in SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `404`, `500`
- **Response Payload Keys:** `error`, `success`, `application`, `desiredClass`, `desiredSection`, `session`, `createdStudent`, `documents`, `message`

#### `POST /api/admin/admissions/[id]/verify`

- **Purpose:** Administrative management and ERP operations for admissions/:param/verify
- **Source File:** [`src/app/api/admin/admissions/[id]/verify/route.ts`](file:///src/app/api/admin/admissions/[id]/verify/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Database Entities:** `application`
- **Side Effects:** Mutates existing records in SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `404`, `400`, `500`
- **Response Payload Keys:** `error`, `success`, `message`

#### `POST /api/admissions/apply`

- **Purpose:** Core institutional service for admissions/apply
- **Source File:** [`src/app/api/admissions/apply/route.ts`](file:///src/app/api/admissions/apply/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Database Entities:** `application`, `academicSession`, `jamatClass`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Appends immutable audit/security event
- **Status Codes:** `400`, `500`
- **Response Payload Keys:** `error`, `সঠিক জন্মতারিখ`, `জামাত পছন্দ`, `অভিভাবকের নাম ও মোবাইল নম্বর) সঠিকভাবে প্রদান করুন।"`, `success`, `applicationNumber`, `application`, `isDuplicateSubmission`, `message`, `...(isDev && error?.message ? { debugMessage`

#### `POST /api/admissions/approve`

- **Purpose:** Core institutional service for admissions/approve
- **Source File:** [`src/app/api/admissions/approve/route.ts`](file:///src/app/api/admissions/approve/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Request Body Fields:** `applicationId`, `assignedSectionId`, `linkExistingStudentId`, `approvalNotes`, `customAdmissionFee`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`

#### `POST /api/admissions/check-duplicate`

- **Purpose:** Core institutional service for admissions/check-duplicate
- **Source File:** [`src/app/api/admissions/check-duplicate/route.ts`](file:///src/app/api/admissions/check-duplicate/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `hasDuplicates`, `matches`, `error`

#### `GET, PUT /api/admissions/config`

- **Purpose:** Core institutional service for admissions/config
- **Source File:** [`src/app/api/admissions/config/route.ts`](file:///src/app/api/admissions/config/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`, `403`
- **Response Payload Keys:** `success`, `config`, `error`, `message`

#### `GET, POST /api/admissions/draft`

- **Purpose:** Core institutional service for admissions/draft
- **Source File:** [`src/app/api/admissions/draft/route.ts`](file:///src/app/api/admissions/draft/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Query Parameters:** `draftId`, `token`, `resumeToken`, `phone`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `400`, `404`, `500`
- **Response Payload Keys:** `success`, `message`, `draftId`, `resumeToken`, `progressPercentage`, `missingFields`, `missingDocuments`, `draft`, `error`, `রিজিউম টোকেন অথবা মোবাইল নম্বর প্রদান করুন।"`

#### `GET /api/admissions/fees`

- **Purpose:** Core institutional service for admissions/fees
- **Source File:** [`src/app/api/admissions/fees/route.ts`](file:///src/app/api/admissions/fees/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Query Parameters:** `classId`, `sessionId`, `residentialStatus`, `isOrphan`, `isFinanciallyWeak`, `financialAssistanceRequested`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `400`, `500`
- **Response Payload Keys:** `error`, `success`, `feeBreakdown`

#### `POST /api/admissions/resubmit`

- **Purpose:** Core institutional service for admissions/resubmit
- **Source File:** [`src/app/api/admissions/resubmit/route.ts`](file:///src/app/api/admissions/resubmit/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `400`
- **Response Payload Keys:** `error`, `success`, `message`, `trackingId`, `status`

#### `POST /api/admissions`

- **Purpose:** Core institutional service for admissions
- **Source File:** [`src/app/api/admissions/route.ts`](file:///src/app/api/admissions/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `200`

#### `GET, POST /api/admissions/track`

- **Purpose:** Core institutional service for admissions/track
- **Source File:** [`src/app/api/admissions/track/route.ts`](file:///src/app/api/admissions/track/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Query Parameters:** `trackingId`, `appId`, `phone`, `enhanced`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `400`, `404`, `500`
- **Response Payload Keys:** `error`, `success`, `tracking`

#### `GET /api/admissions/track/[trackingId]`

- **Purpose:** Core institutional service for admissions/track/:param
- **Source File:** [`src/app/api/admissions/track/[trackingId]/route.ts`](file:///src/app/api/admissions/track/[trackingId]/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Path Parameters:** `trackingId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `200`

#### `POST /api/public/contact`

- **Purpose:** Core institutional service for public/contact
- **Source File:** [`src/app/api/public/contact/route.ts`](file:///src/app/api/public/contact/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `messageBn`

#### `GET /api/public/content/admission-status`

- **Purpose:** Core institutional service for public/content/admission-status
- **Source File:** [`src/app/api/public/content/admission-status/route.ts`](file:///src/app/api/public/content/admission-status/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Database Entities:** `academicSession`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `admissionState`, `announcementBn`, `sessionName`, `sessionId`, `updatedAt`, `error`

#### `GET /api/public/content/downloads`

- **Purpose:** Core institutional service for public/content/downloads
- **Source File:** [`src/app/api/public/content/downloads/route.ts`](file:///src/app/api/public/content/downloads/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `downloads`, `error`

#### `GET /api/public/content/events`

- **Purpose:** Core institutional service for public/content/events
- **Source File:** [`src/app/api/public/content/events/route.ts`](file:///src/app/api/public/content/events/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `events`, `error`

#### `GET /api/public/content/faqs`

- **Purpose:** Core institutional service for public/content/faqs
- **Source File:** [`src/app/api/public/content/faqs/route.ts`](file:///src/app/api/public/content/faqs/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `faqs`, `error`

#### `GET /api/public/content/gallery`

- **Purpose:** Core institutional service for public/content/gallery
- **Source File:** [`src/app/api/public/content/gallery/route.ts`](file:///src/app/api/public/content/gallery/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `items`, `error`

#### `GET /api/public/content/profile`

- **Purpose:** Core institutional service for public/content/profile
- **Source File:** [`src/app/api/public/content/profile/route.ts`](file:///src/app/api/public/content/profile/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `profile`, `error`

#### `GET /api/public/hr/verify/[token]`

- **Purpose:** Core institutional service for public/hr/verify/:param
- **Source File:** [`src/app/api/public/hr/verify/[token]/route.ts`](file:///src/app/api/public/hr/verify/[token]/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Path Parameters:** `token`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `400`, `500`
- **Response Payload Keys:** `error`

#### `GET /api/public/inventory/verify/asset/[token]`

- **Purpose:** Core institutional service for public/inventory/verify/asset/:param
- **Source File:** [`src/app/api/public/inventory/verify/asset/[token]/route.ts`](file:///src/app/api/public/inventory/verify/asset/[token]/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Path Parameters:** `token`
- **Database Entities:** `inventoryAsset`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `404`, `500`
- **Response Payload Keys:** `error`, `success`, `institution`, `nameEn`, `established`, `addressBn`

#### `GET /api/public/library/books`

- **Purpose:** Core institutional service for public/library/books
- **Source File:** [`src/app/api/public/library/books/route.ts`](file:///src/app/api/public/library/books/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Query Parameters:** `search`, `categoryId`, `language`, `page`, `limit`
- **Database Entities:** `libraryBook`, `libraryCategory`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `books`, `categories`, `pagination`, `limit`, `total`, `totalPages`, `error`

#### `GET /api/public/library/copy/[token]`

- **Purpose:** Core institutional service for public/library/copy/:param
- **Source File:** [`src/app/api/public/library/copy/[token]/route.ts`](file:///src/app/api/public/library/copy/[token]/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Path Parameters:** `token`
- **Database Entities:** `libraryBookCopy`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `404`, `500`
- **Response Payload Keys:** `error`, `institution`, `nameEn`, `established`, `location`

#### `GET /api/public/search`

- **Purpose:** Core institutional service for public/search
- **Source File:** [`src/app/api/public/search/route.ts`](file:///src/app/api/public/search/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Query Parameters:** `q`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `...searchResult`, `error`, `results`, `count`

#### `GET /api/public/transport`

- **Purpose:** Core institutional service for public/transport
- **Source File:** [`src/app/api/public/transport/route.ts`](file:///src/app/api/public/transport/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Database Entities:** `transportRoute`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `routes`, `error`

### 3.3 Academic Structure & Classes (12 Endpoints)

#### `GET /api/academic/classes`

- **Purpose:** Core institutional service for academic/classes
- **Source File:** [`src/app/api/academic/classes/route.ts`](file:///src/app/api/academic/classes/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Database Entities:** `jamatClass`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `classes`, `error`

#### `GET /api/academic/sections`

- **Purpose:** Core institutional service for academic/sections
- **Source File:** [`src/app/api/academic/sections/route.ts`](file:///src/app/api/academic/sections/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Query Parameters:** `classId`
- **Database Entities:** `section`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `sections`, `error`

#### `GET /api/academic/sessions`

- **Purpose:** Core institutional service for academic/sessions
- **Source File:** [`src/app/api/academic/sessions/route.ts`](file:///src/app/api/academic/sessions/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Database Entities:** `academicSession`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `sessions`, `error`

#### `GET, POST /api/admin/academic/classes`

- **Purpose:** Administrative management and ERP operations for academic/classes
- **Source File:** [`src/app/api/admin/academic/classes/route.ts`](file:///src/app/api/admin/academic/classes/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Database Entities:** `jamatClass`
- **Side Effects:** Persists new records to SQLite DB; Executes atomic multi-table transaction
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `classes`, `jamatClass`

#### `GET, PATCH, DELETE /api/admin/academic/classes/[id]`

- **Purpose:** Administrative management and ERP operations for academic/classes/:param
- **Source File:** [`src/app/api/admin/academic/classes/[id]/route.ts`](file:///src/app/api/admin/academic/classes/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Database Entities:** `jamatClass`, `enrollment`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Removes records from SQLite DB; Executes atomic multi-table transaction
- **Status Codes:** `403`, `404`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `jamatClass`, `message`

#### `GET, POST /api/admin/academic/sections`

- **Purpose:** Administrative management and ERP operations for academic/sections
- **Source File:** [`src/app/api/admin/academic/sections/route.ts`](file:///src/app/api/admin/academic/sections/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `classId`
- **Database Entities:** `section`, `jamatClass`, `auditLog`
- **Side Effects:** Persists new records to SQLite DB
- **Status Codes:** `403`, `500`, `400`, `404`
- **Response Payload Keys:** `error`, `success`, `sections`, `section`

#### `GET, PATCH, DELETE /api/admin/academic/sections/[id]`

- **Purpose:** Administrative management and ERP operations for academic/sections/:param
- **Source File:** [`src/app/api/admin/academic/sections/[id]/route.ts`](file:///src/app/api/admin/academic/sections/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Database Entities:** `section`, `enrollment`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Removes records from SQLite DB; Executes atomic multi-table transaction
- **Status Codes:** `403`, `404`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `section`, `message`

#### `GET, POST /api/admin/academic/sessions`

- **Purpose:** Administrative management and ERP operations for academic/sessions
- **Source File:** [`src/app/api/admin/academic/sessions/route.ts`](file:///src/app/api/admin/academic/sessions/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Database Entities:** `academicSession`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Executes atomic multi-table transaction
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `sessions`, `শুরুর তারিখ এবং শেষের তারিখ আবশ্যক।"`, `session`

#### `POST /api/admin/academic/sessions/[id]/activate`

- **Purpose:** Administrative management and ERP operations for academic/sessions/:param/activate
- **Source File:** [`src/app/api/admin/academic/sessions/[id]/activate/route.ts`](file:///src/app/api/admin/academic/sessions/[id]/activate/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Database Entities:** `academicSession`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Executes atomic multi-table transaction
- **Status Codes:** `403`, `404`, `500`
- **Response Payload Keys:** `error`, `success`, `message`

#### `POST /api/admin/academic/sessions/[id]/close`

- **Purpose:** Administrative management and ERP operations for academic/sessions/:param/close
- **Source File:** [`src/app/api/admin/academic/sessions/[id]/close/route.ts`](file:///src/app/api/admin/academic/sessions/[id]/close/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Database Entities:** `academicSession`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Executes atomic multi-table transaction
- **Status Codes:** `403`, `404`, `500`
- **Response Payload Keys:** `error`, `success`, `message`

#### `GET, PATCH, DELETE /api/admin/academic/sessions/[id]`

- **Purpose:** Administrative management and ERP operations for academic/sessions/:param
- **Source File:** [`src/app/api/admin/academic/sessions/[id]/route.ts`](file:///src/app/api/admin/academic/sessions/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Database Entities:** `academicSession`, `enrollment`, `feeInvoice`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Removes records from SQLite DB; Executes atomic multi-table transaction
- **Status Codes:** `403`, `404`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `session`, `message`

#### `GET, POST, PATCH /api/admin/subjects`

- **Purpose:** Administrative management and ERP operations for subjects
- **Source File:** [`src/app/api/admin/subjects/route.ts`](file:///src/app/api/admin/subjects/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `classId`
- **Database Entities:** `subject`, `jamatClass`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Appends immutable audit/security event
- **Status Codes:** `401`, `500`, `400`, `404`, `409`
- **Response Payload Keys:** `error`, `subjects`, `বিষয়ের বাংলা ও ইংরেজি নাম এবং বিষয় কোড আবশ্যক।"`, `subject`, `message`

### 3.4 Student Management & Records (9 Endpoints)

#### `GET, POST /api/admin/guardians`

- **Purpose:** Administrative management and ERP operations for guardians
- **Source File:** [`src/app/api/admin/guardians/route.ts`](file:///src/app/api/admin/guardians/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `q`, `page`, `limit`
- **Database Entities:** `guardian`, `guardianStudent`
- **Side Effects:** Persists new records to SQLite DB; Executes atomic multi-table transaction
- **Status Codes:** `401`, `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `guardians`, `total`, `page`, `totalPages`, `guardian`, `message`

#### `GET, PATCH /api/admin/guardians/[id]`

- **Purpose:** Administrative management and ERP operations for guardians/:param
- **Source File:** [`src/app/api/admin/guardians/[id]/route.ts`](file:///src/app/api/admin/guardians/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Database Entities:** `guardian`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Executes atomic multi-table transaction
- **Status Codes:** `401`, `404`, `403`, `500`
- **Response Payload Keys:** `error`, `success`, `guardian`

#### `POST /api/admin/promotions/preview`

- **Purpose:** Administrative management and ERP operations for promotions/preview
- **Source File:** [`src/app/api/admin/promotions/preview/route.ts`](file:///src/app/api/admin/promotions/preview/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Database Entities:** `enrollment`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `error`, `success`, `candidates`, `totalCandidates`, `nextAvailableRoll`

#### `GET, POST /api/admin/promotions`

- **Purpose:** Administrative management and ERP operations for promotions
- **Source File:** [`src/app/api/admin/promotions/route.ts`](file:///src/app/api/admin/promotions/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Database Entities:** `auditLog`, `academicSession`, `jamatClass`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Executes atomic multi-table transaction
- **Status Codes:** `403`, `500`, `400`, `404`
- **Response Payload Keys:** `error`, `success`, `history`, `message`

#### `GET, POST /api/admin/students`

- **Purpose:** Administrative management and ERP operations for students
- **Source File:** [`src/app/api/admin/students/route.ts`](file:///src/app/api/admin/students/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `page`, `limit`, `q`, `sessionId`, `classId`, `sectionId`, `gender`, `residentialStatus`, `status`, `isOrphan`, `isFinanciallyWeak`
- **Database Entities:** `teacherAssignment`, `student`, `academicSession`
- **Side Effects:** Persists new records to SQLite DB; Executes atomic multi-table transaction
- **Status Codes:** `401`, `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `students`, `total`, `page`, `totalPages`, `limit`, `stats`, `residential`, `dayCare`, `orphan`, `activeSession`, `জন্মতারিখ`, `পিতার নাম`, `মাতার নাম ও বর্তমান ঠিকানা) পূরণ করুন।"`, `student`, `message`

#### `GET, POST /api/admin/students/[id]/documents`

- **Purpose:** Administrative management and ERP operations for students/:param/documents
- **Source File:** [`src/app/api/admin/students/[id]/documents/route.ts`](file:///src/app/api/admin/students/[id]/documents/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Database Entities:** `guardianStudent`, `studentDocument`
- **Side Effects:** Persists new records to SQLite DB; Executes atomic multi-table transaction
- **Status Codes:** `401`, `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `documents`, `ফাইলের নাম ও লিংক আবশ্যক।"`, `document`

#### `GET, POST /api/admin/students/[id]/guardians`

- **Purpose:** Administrative management and ERP operations for students/:param/guardians
- **Source File:** [`src/app/api/admin/students/[id]/guardians/route.ts`](file:///src/app/api/admin/students/[id]/guardians/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Database Entities:** `guardianStudent`, `student`, `guardian`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Executes atomic multi-table transaction
- **Status Codes:** `401`, `403`, `500`, `400`, `404`
- **Response Payload Keys:** `error`, `success`, `guardians`, `link`, `message`

#### `GET, PATCH, DELETE /api/admin/students/[id]`

- **Purpose:** Administrative management and ERP operations for students/:param
- **Source File:** [`src/app/api/admin/students/[id]/route.ts`](file:///src/app/api/admin/students/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Database Entities:** `student`, `teacherAssignment`, `auditLog`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Removes records from SQLite DB; Executes atomic multi-table transaction
- **Status Codes:** `401`, `404`, `403`, `500`
- **Response Payload Keys:** `error`, `success`, `student`, `auditLogs`, `message`

#### `POST /api/students/search`

- **Purpose:** Core institutional service for students/search
- **Source File:** [`src/app/api/students/search/route.ts`](file:///src/app/api/students/search/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Request Body Fields:** `rollOrId`, `rollNumber`
- **Database Entities:** `student`, `enrollment`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `429`, `400`, `404`, `500`
- **Response Payload Keys:** `error`, `success`, `student`, `studentIdNumber`, `fullNameBn`, `fullNameEn`, `gender`, `residentialStatus`, `className`, `sectionName`, `rollNumber`, `sessionName`, `fatherName`, `verificationStatus`, `results`, `totalMarks`, `percentage`, `grade`, `publishedAt`

### 3.5 Attendance & Biometric Operations (5 Endpoints)

#### `POST /api/admin/attendance/correct`

- **Purpose:** Administrative management and ERP operations for attendance/correct
- **Source File:** [`src/app/api/admin/attendance/correct/route.ts`](file:///src/app/api/admin/attendance/correct/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `success`, `message`, `record`

#### `POST /api/admin/attendance/lock`

- **Purpose:** Administrative management and ERP operations for attendance/lock
- **Source File:** [`src/app/api/admin/attendance/lock/route.ts`](file:///src/app/api/admin/attendance/lock/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `error`, `জামাত এবং তারিখ প্রদান আবশ্যক।"`, `success`, `message`, `lock`

#### `GET /api/admin/attendance/reports`

- **Purpose:** Administrative management and ERP operations for attendance/reports
- **Source File:** [`src/app/api/admin/attendance/reports/route.ts`](file:///src/app/api/admin/attendance/reports/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `type`, `sessionId`, `classId`, `sectionId`, `studentId`, `date`, `month`, `year`, `startDate`, `endDate`
- **Database Entities:** `academicSession`, `attendance`, `student`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `404`, `500`
- **Response Payload Keys:** `error`, `success`, `reportType`, `date`, `sessionId`, `summary`, `classBreakdown`, `records`, `studentIdNumber`, `fullNameBn`, `residentialStatus`, `classNameBn`, `sectionNameBn`, `status`, `leaveReason`, `year`, `month`, `studentSummaries`, `student`, `remarks`, `classId`, `timeline`, `totalDaysRecorded`

#### `GET, POST /api/admin/attendance`

- **Purpose:** Administrative management and ERP operations for attendance
- **Source File:** [`src/app/api/admin/attendance/route.ts`](file:///src/app/api/admin/attendance/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `sessionId`, `classId`, `sectionId`, `date`, `status`, `search`
- **Database Entities:** `academicSession`, `enrollment`, `attendance`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `error`, `success`, `date`, `sessionId`, `classId`, `sectionId`, `isLocked`, `lockReason`, `lockedAt`, `summary`, `totalEnrolled`, `items`, `totalRecords`, `studentId`, `studentIdNumber`, `fullNameBn`, `photoUrl`, `residentialStatus`, `fatherPhone`, `classNameBn`, `sectionNameBn`, `status`, `leaveReason`, `remarks`, `correctionReason`, `updatedAt`, `জামাত`, `তারিখ এবং অন্তত একজন শিক্ষার্থীর হাজিরা প্রদান আবশ্যক।"`

#### `POST /api/admin/attendance/unlock`

- **Purpose:** Administrative management and ERP operations for attendance/unlock
- **Source File:** [`src/app/api/admin/attendance/unlock/route.ts`](file:///src/app/api/admin/attendance/unlock/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `error`, `জামাত এবং তারিখ প্রদান আবশ্যক।"`, `success`, `message`, `lock`

### 3.6 Examinations, Marks & Results (8 Endpoints)

#### `GET, POST /api/admin/exams`

- **Purpose:** Administrative management and ERP operations for exams
- **Source File:** [`src/app/api/admin/exams/route.ts`](file:///src/app/api/admin/exams/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `sessionId`
- **Database Entities:** `exam`, `academicSession`, `examType`
- **Side Effects:** Persists new records to SQLite DB; Appends immutable audit/security event
- **Status Codes:** `401`, `500`, `400`, `404`
- **Response Payload Keys:** `error`, `exams`, `পরীক্ষার বাংলা নাম`, `ইংরেজি নাম এবং তারিখ আবশ্যক।"`, `exam`, `message`

#### `GET, POST, PATCH /api/admin/exams/types`

- **Purpose:** Administrative management and ERP operations for exams/types
- **Source File:** [`src/app/api/admin/exams/types/route.ts`](file:///src/app/api/admin/exams/types/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Database Entities:** `examType`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Appends immutable audit/security event
- **Status Codes:** `401`, `500`, `400`, `409`
- **Response Payload Keys:** `error`, `examTypes`, `বাংলা ও ইংরেজি নাম আবশ্যক।"`, `examType`, `message`

#### `GET, PATCH, DELETE /api/admin/exams/[id]`

- **Purpose:** Administrative management and ERP operations for exams/:param
- **Source File:** [`src/app/api/admin/exams/[id]/route.ts`](file:///src/app/api/admin/exams/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Database Entities:** `exam`
- **Side Effects:** Mutates existing records in SQLite DB; Removes records from SQLite DB; Appends immutable audit/security event
- **Status Codes:** `401`, `404`, `500`, `400`
- **Response Payload Keys:** `error`, `exam`, `message`

#### `GET, POST, PATCH, DELETE /api/admin/exams/[id]/routine`

- **Purpose:** Administrative management and ERP operations for exams/:param/routine
- **Source File:** [`src/app/api/admin/exams/[id]/routine/route.ts`](file:///src/app/api/admin/exams/[id]/routine/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Query Parameters:** `classId`, `sectionId`, `routineId`
- **Database Entities:** `examRoutine`, `exam`, `examSubject`, `subject`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Removes records from SQLite DB; Appends immutable audit/security event
- **Status Codes:** `401`, `500`, `400`, `404`, `409`
- **Response Payload Keys:** `error`, `routines`, `বিষয়`, `পরীক্ষার তারিখ`, `শুরুর সময় ও শেষের সময় আবশ্যক।"`, `routine`, `message`

#### `GET, POST /api/admin/exams/[id]/subjects`

- **Purpose:** Administrative management and ERP operations for exams/:param/subjects
- **Source File:** [`src/app/api/admin/exams/[id]/subjects/route.ts`](file:///src/app/api/admin/exams/[id]/subjects/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Query Parameters:** `classId`
- **Database Entities:** `examSubject`, `exam`, `subject`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Appends immutable audit/security event
- **Status Codes:** `401`, `500`, `404`, `400`
- **Response Payload Keys:** `error`, `examSubjects`, `message`, `examSubject`

#### `POST /api/admin/results/correct`

- **Purpose:** Administrative management and ERP operations for results/correct
- **Source File:** [`src/app/api/admin/results/correct/route.ts`](file:///src/app/api/admin/results/correct/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Database Entities:** `exam`, `enrollment`, `examSubject`, `examMark`, `result`
- **Side Effects:** Mutates existing records in SQLite DB; Upserts records into SQLite DB; Appends immutable audit/security event
- **Status Codes:** `401`, `400`, `404`, `500`
- **Response Payload Keys:** `error`, `শিক্ষার্থী আইডি`, `বিষয় আইডি এবং সংশোধনের কারণ (Correction Reason) উল্লেখ করা আবশ্যক।"`, `message`, `recalculated`

#### `POST /api/admin/results/publish`

- **Purpose:** Administrative management and ERP operations for results/publish
- **Source File:** [`src/app/api/admin/results/publish/route.ts`](file:///src/app/api/admin/results/publish/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Database Entities:** `exam`, `examSubject`, `enrollment`, `examMark`, `result`
- **Side Effects:** Mutates existing records in SQLite DB; Upserts records into SQLite DB; Appends immutable audit/security event; Executes atomic multi-table transaction
- **Status Codes:** `401`, `400`, `404`, `422`, `500`
- **Response Payload Keys:** `error`, `issues`, `10)`, `totalIssues`, `canForcePublish`, `message`

#### `GET /api/admin/results`

- **Purpose:** Administrative management and ERP operations for results
- **Source File:** [`src/app/api/admin/results/route.ts`](file:///src/app/api/admin/results/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `examId`, `classId`
- **Database Entities:** `exam`, `examSubject`, `enrollment`, `examMark`, `result`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `400`, `404`, `500`
- **Response Payload Keys:** `error`, `exam`, `nameBn`, `nameEn`, `status`, `isPublished`

### 3.7 Finance, Fees, Transactions & Accounting (14 Endpoints)

#### `GET, POST /api/admin/finance/assistance`

- **Purpose:** Administrative management and ERP operations for finance/assistance
- **Source File:** [`src/app/api/admin/finance/assistance/route.ts`](file:///src/app/api/admin/finance/assistance/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `status`, `sessionId`
- **Database Entities:** `financialAssistance`
- **Side Effects:** Mutates existing records in SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `500`, `400`, `404`
- **Response Payload Keys:** `error`, `success`, `assistances`, `message`

#### `GET /api/admin/finance/cashbook`

- **Purpose:** Administrative management and ERP operations for finance/cashbook
- **Source File:** [`src/app/api/admin/finance/cashbook/route.ts`](file:///src/app/api/admin/finance/cashbook/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `date`, `fundCode`
- **Database Entities:** `cashTransaction`, `cashFund`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `date`, `summary`, `todayExpense`, `netMovement`, `totalBalance`

#### `POST /api/admin/finance/funds/transaction`

- **Purpose:** Administrative management and ERP operations for finance/funds/transaction
- **Source File:** [`src/app/api/admin/finance/funds/transaction/route.ts`](file:///src/app/api/admin/finance/funds/transaction/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Database Entities:** `cashFund`, `cashTransaction`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Appends immutable audit/security event; Executes atomic multi-table transaction
- **Status Codes:** `403`, `400`, `404`, `500`
- **Response Payload Keys:** `error`, `ধরন (আয়/ব্যয়)`, `খাত`, `সঠিক পরিমাণ এবং নাম প্রদান করুন।"`, `success`, `message`

#### `POST /api/admin/finance/invoices/monthly-generate`

- **Purpose:** Administrative management and ERP operations for finance/invoices/monthly-generate
- **Source File:** [`src/app/api/admin/finance/invoices/monthly-generate/route.ts`](file:///src/app/api/admin/finance/invoices/monthly-generate/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Database Entities:** `enrollment`, `feeInvoice`
- **Side Effects:** Persists new records to SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `error`, `success`, `message`, `createdCount`, `skippedCount`

#### `GET, POST /api/admin/finance/invoices`

- **Purpose:** Administrative management and ERP operations for finance/invoices
- **Source File:** [`src/app/api/admin/finance/invoices/route.ts`](file:///src/app/api/admin/finance/invoices/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `sessionId`, `classId`, `status`, `feeType`, `search`, `page`, `limit`
- **Database Entities:** `feeInvoice`, `enrollment`
- **Side Effects:** Persists new records to SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `invoices`, `pagination`, `page`, `limit`, `totalPages`, `সেশন এবং ফি ধরন প্রদান করা আবশ্যক।"`, `message`

#### `POST /api/admin/finance/invoices/[id]/cancel`

- **Purpose:** Administrative management and ERP operations for finance/invoices/:param/cancel
- **Source File:** [`src/app/api/admin/finance/invoices/[id]/cancel/route.ts`](file:///src/app/api/admin/finance/invoices/[id]/cancel/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Request Body Fields:** `reason`
- **Database Entities:** `feeInvoice`
- **Side Effects:** Mutates existing records in SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `400`, `404`, `500`
- **Response Payload Keys:** `error`, `success`, `message`

#### `POST /api/admin/finance/payments/refund`

- **Purpose:** Administrative management and ERP operations for finance/payments/refund
- **Source File:** [`src/app/api/admin/finance/payments/refund/route.ts`](file:///src/app/api/admin/finance/payments/refund/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Database Entities:** `paymentReceipt`, `cashFund`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Appends immutable audit/security event; Executes atomic multi-table transaction
- **Status Codes:** `403`, `400`, `404`, `500`
- **Response Payload Keys:** `error`, `success`, `message`

#### `GET, POST /api/admin/finance/payments`

- **Purpose:** Administrative management and ERP operations for finance/payments
- **Source File:** [`src/app/api/admin/finance/payments/route.ts`](file:///src/app/api/admin/finance/payments/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `search`, `method`, `studentId`, `page`, `limit`
- **Database Entities:** `paymentReceipt`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Appends immutable audit/security event; Executes atomic multi-table transaction
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `payments`, `pagination`, `page`, `limit`, `totalPages`, `message`, `receipt`, `isDuplicate`

#### `POST /api/admin/finance/payments/verify`

- **Purpose:** Administrative management and ERP operations for finance/payments/verify
- **Source File:** [`src/app/api/admin/finance/payments/verify/route.ts`](file:///src/app/api/admin/finance/payments/verify/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Database Entities:** `paymentReceipt`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Appends immutable audit/security event; Executes atomic multi-table transaction
- **Status Codes:** `403`, `400`, `404`, `500`
- **Response Payload Keys:** `error`, `success`, `message`, `receipt`

#### `GET, POST /api/admin/finance/payroll`

- **Purpose:** Administrative management and ERP operations for finance/payroll
- **Source File:** [`src/app/api/admin/finance/payroll/route.ts`](file:///src/app/api/admin/finance/payroll/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `month`
- **Database Entities:** `payrollRecord`, `user`, `cashFund`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Upserts records into SQLite DB; Appends immutable audit/security event; Executes atomic multi-table transaction
- **Status Codes:** `403`, `500`, `400`, `404`
- **Response Payload Keys:** `error`, `success`, `month`, `payrolls`, `teachers`, `মাস এবং মূল বেতনের পরিমাণ আবশ্যক।"`, `message`

#### `GET, POST /api/admin/finance`

- **Purpose:** Administrative management and ERP operations for finance
- **Source File:** [`src/app/api/admin/finance/route.ts`](file:///src/app/api/admin/finance/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Request Body Fields:** `fundId`, `type`, `category`, `amount`, `payeeOrPayer`, `paymentMethod`, `notes`
- **Database Entities:** `cashFund`, `cashTransaction`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Appends immutable audit/security event; Executes atomic multi-table transaction
- **Status Codes:** `403`, `500`, `400`, `404`
- **Response Payload Keys:** `error`, `success`, `funds`, `recentTransactions`, `ধরন (আয়/ব্যয়)`, `সঠিক পরিমাণ এবং দাতা/গ্রহীতার নাম প্রদান করুন।"`, `message`

#### `POST /api/admin/finance/scholarships/assign`

- **Purpose:** Administrative management and ERP operations for finance/scholarships/assign
- **Source File:** [`src/app/api/admin/finance/scholarships/assign/route.ts`](file:///src/app/api/admin/finance/scholarships/assign/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Database Entities:** `studentScholarship`
- **Side Effects:** Upserts records into SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `error`, `শিক্ষার্থী এবং সেশন আইডি আবশ্যক।"`, `success`, `message`, `allocation`

#### `GET, POST /api/admin/finance/scholarships`

- **Purpose:** Administrative management and ERP operations for finance/scholarships
- **Source File:** [`src/app/api/admin/finance/scholarships/route.ts`](file:///src/app/api/admin/finance/scholarships/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Database Entities:** `scholarship`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `scholarships`, `কোড এবং সঠিক ছাড়ের পরিমাণ আবশ্যক।"`, `message`, `scholarship`

#### `GET, POST /api/admin/finance/structures`

- **Purpose:** Administrative management and ERP operations for finance/structures
- **Source File:** [`src/app/api/admin/finance/structures/route.ts`](file:///src/app/api/admin/finance/structures/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `sessionId`, `classId`, `feeType`
- **Database Entities:** `feeStructure`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `structures`, `ফি ধরন`, `নাম এবং বৈধ টাকার পরিমাণ আবশ্যক।"`, `message`, `structure`

### 3.8 Guardian Self-Service Portal (31 Endpoints)

#### `GET, PATCH /api/portal/alumni`

- **Purpose:** Guardian self-service portal operations for alumni
- **Source File:** [`src/app/api/portal/alumni/route.ts`](file:///src/app/api/portal/alumni/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `500`, `404`, `400`
- **Response Payload Keys:** `success`, `error`, `isRegistered`, `message`, `profile`, `groups`, `joined`, `data`

#### `GET /api/portal/analytics/[childId]`

- **Purpose:** Guardian self-service portal operations for analytics/:param
- **Source File:** [`src/app/api/portal/analytics/[childId]/route.ts`](file:///src/app/api/portal/analytics/[childId]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Path Parameters:** `childId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`
- **Response Payload Keys:** `error`, `success`, `data`

#### `GET /api/portal/attendance`

- **Purpose:** Guardian self-service portal operations for attendance
- **Source File:** [`src/app/api/portal/attendance/route.ts`](file:///src/app/api/portal/attendance/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Query Parameters:** `studentId`, `sessionId`, `month`, `year`
- **Database Entities:** `student`, `guardian`, `academicSession`, `attendance`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `400`, `404`, `403`, `401`, `500`
- **Response Payload Keys:** `error`, `success`, `student`, `studentIdNumber`, `fullNameBn`, `fullNameEn`, `photoUrl`, `residentialStatus`, `currentClass`, `currentSection`, `rollNumber`

#### `GET /api/portal/children`

- **Purpose:** Guardian self-service portal operations for children
- **Source File:** [`src/app/api/portal/children/route.ts`](file:///src/app/api/portal/children/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Database Entities:** `guardian`, `enrollment`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `500`
- **Response Payload Keys:** `error`, `children`, `success`

#### `GET, POST, PATCH /api/portal/data-correction`

- **Purpose:** Guardian self-service portal operations for data-correction
- **Source File:** [`src/app/api/portal/data-correction/route.ts`](file:///src/app/api/portal/data-correction/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Database Entities:** `guardian`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `403`, `500`, `404`, `400`
- **Response Payload Keys:** `error`, `success`, `data`, `requestedFields এবং reasonBn আবশ্যক।"`, `messageBn`

#### `POST /api/portal/documents/request`

- **Purpose:** Guardian self-service portal operations for documents/request
- **Source File:** [`src/app/api/portal/documents/request/route.ts`](file:///src/app/api/portal/documents/request/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Database Entities:** `guardian`, `documentRequest`, `academicSession`
- **Side Effects:** Persists new records to SQLite DB; Appends immutable audit/security event
- **Status Codes:** `401`, `400`, `404`, `403`, `409`, `500`
- **Response Payload Keys:** `error`, `প্রত্যয়নপত্রের ধরন এবং আবেদনের উদ্দেশ্য উল্লেখ করা আবশ্যক।"`, `success`, `message`

#### `GET /api/portal/documents`

- **Purpose:** Guardian self-service portal operations for documents
- **Source File:** [`src/app/api/portal/documents/route.ts`](file:///src/app/api/portal/documents/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Query Parameters:** `studentId`
- **Database Entities:** `guardian`, `certificate`, `documentRequest`, `documentTemplate`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `404`, `403`, `500`
- **Response Payload Keys:** `error`, `success`, `student`, `name`, `studentIdNumber`, `className`, `rollNumber`

#### `GET /api/portal/events`

- **Purpose:** Guardian self-service portal operations for events
- **Source File:** [`src/app/api/portal/events/route.ts`](file:///src/app/api/portal/events/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Query Parameters:** `phone`, `guardianId`, `studentId`
- **Database Entities:** `guardian`, `student`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `400`, `500`
- **Response Payload Keys:** `success`, `error`, `guardian`, `nameBn`, `phone`

#### `POST /api/portal/finance/assistance`

- **Purpose:** Guardian self-service portal operations for finance/assistance
- **Source File:** [`src/app/api/portal/finance/assistance/route.ts`](file:///src/app/api/portal/finance/assistance/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Database Entities:** `guardian`, `financialAssistance`
- **Side Effects:** Persists new records to SQLite DB; Appends immutable audit/security event
- **Status Codes:** `401`, `400`, `403`, `500`
- **Response Payload Keys:** `error`, `শিক্ষাবর্ষ এবং বিস্তারিত কারণ (কমপক্ষে ১০ অক্ষর) আবশ্যক।"`, `success`, `message`, `application`

#### `GET /api/portal/finance/gateway/callback`

- **Purpose:** Guardian self-service portal operations for finance/gateway/callback
- **Source File:** [`src/app/api/portal/finance/gateway/callback/route.ts`](file:///src/app/api/portal/finance/gateway/callback/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Query Parameters:** `paymentID`, `payment_ref_id`, `status`, `provider`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `200`

#### `POST /api/portal/finance/gateway/execute`

- **Purpose:** Guardian self-service portal operations for finance/gateway/execute
- **Source File:** [`src/app/api/portal/finance/gateway/execute/route.ts`](file:///src/app/api/portal/finance/gateway/execute/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `400`
- **Response Payload Keys:** `error`

#### `POST /api/portal/finance/gateway/initiate`

- **Purpose:** Guardian self-service portal operations for finance/gateway/initiate
- **Source File:** [`src/app/api/portal/finance/gateway/initiate/route.ts`](file:///src/app/api/portal/finance/gateway/initiate/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `403`, `400`
- **Response Payload Keys:** `error`, `success`, `message`

#### `POST /api/portal/finance/pay`

- **Purpose:** Guardian self-service portal operations for finance/pay
- **Source File:** [`src/app/api/portal/finance/pay/route.ts`](file:///src/app/api/portal/finance/pay/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Database Entities:** `guardian`, `feeInvoice`
- **Side Effects:** Persists new records to SQLite DB; Appends immutable audit/security event; Executes atomic multi-table transaction
- **Status Codes:** `401`, `403`, `400`, `404`, `409`, `500`
- **Response Payload Keys:** `error`, `success`, `status`, `message`

#### `GET /api/portal/finance`

- **Purpose:** Guardian self-service portal operations for finance
- **Source File:** [`src/app/api/portal/finance/route.ts`](file:///src/app/api/portal/finance/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Query Parameters:** `studentId`
- **Database Entities:** `guardian`, `student`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `400`, `403`, `404`, `500`
- **Response Payload Keys:** `error`, `success`, `student`, `studentIdNumber`, `fullNameBn`, `fullNameEn`, `residentialStatus`, `className`, `rollNumber`

#### `GET, POST /api/portal/helpdesk`

- **Purpose:** Guardian self-service portal operations for helpdesk
- **Source File:** [`src/app/api/portal/helpdesk/route.ts`](file:///src/app/api/portal/helpdesk/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Query Parameters:** `studentId`, `status`, `page`, `limit`
- **Request Body Fields:** `categoryCode`, `requestType`, `subject`, `description`, `studentId`, `priority`, `relatedEntityType`, `relatedEntityId`, `attachments`
- **Database Entities:** `guardian`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `404`, `500`, `403`, `400`
- **Response Payload Keys:** `error`, `success`, `guardian`, `name`, `children`, `studentIdNumber`, `fullNameBn`, `আবেদনের ধরন`, `বিষয় ও বিস্তারিত বিবরণ আবশ্যক।"`, `ticket`

#### `POST /api/portal/helpdesk/[id]/messages`

- **Purpose:** Guardian self-service portal operations for helpdesk/:param/messages
- **Source File:** [`src/app/api/portal/helpdesk/[id]/messages/route.ts`](file:///src/app/api/portal/helpdesk/[id]/messages/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Request Body Fields:** `content`
- **Database Entities:** `guardian`, `supportRequest`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `403`, `404`, `400`
- **Response Payload Keys:** `error`, `success`, `message`

#### `POST /api/portal/helpdesk/[id]/reopen`

- **Purpose:** Guardian self-service portal operations for helpdesk/:param/reopen
- **Source File:** [`src/app/api/portal/helpdesk/[id]/reopen/route.ts`](file:///src/app/api/portal/helpdesk/[id]/reopen/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Request Body Fields:** `reason`
- **Database Entities:** `guardian`, `supportRequest`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `403`, `404`, `400`
- **Response Payload Keys:** `error`, `success`, `ticket`

#### `GET /api/portal/helpdesk/[id]`

- **Purpose:** Guardian self-service portal operations for helpdesk/:param
- **Source File:** [`src/app/api/portal/helpdesk/[id]/route.ts`](file:///src/app/api/portal/helpdesk/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Database Entities:** `guardian`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `403`, `404`
- **Response Payload Keys:** `error`, `success`, `ticket`

#### `POST /api/portal/hostel/request`

- **Purpose:** Guardian self-service portal operations for hostel/request
- **Source File:** [`src/app/api/portal/hostel/request/route.ts`](file:///src/app/api/portal/hostel/request/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `400`
- **Response Payload Keys:** `error`, `আবেদনের ধরন`, `প্রত্যাশিত স্ট্যাটাস এবং কারণ) প্রদান করুন।"`, `success`, `message`

#### `GET /api/portal/hostel`

- **Purpose:** Guardian self-service portal operations for hostel
- **Source File:** [`src/app/api/portal/hostel/route.ts`](file:///src/app/api/portal/hostel/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Query Parameters:** `studentId`
- **Database Entities:** `guardian`, `residentialEnrollment`, `residentialHistory`, `residentialRequest`, `feeInvoice`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `404`, `403`, `500`
- **Response Payload Keys:** `error`, `success`, `children`, `activeStudent`, `student`, `currentEnrollment`, `enrollments`, `histories`, `requests`, `invoices`, `financeSummary`, `totalPaid`

#### `GET /api/portal/library`

- **Purpose:** Guardian self-service portal operations for library
- **Source File:** [`src/app/api/portal/library/route.ts`](file:///src/app/api/portal/library/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Query Parameters:** `studentId`
- **Database Entities:** `guardian`, `libraryMember`, `feeInvoice`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `404`, `403`, `500`
- **Response Payload Keys:** `error`, `students`, `selectedStudentId`, `currentStudent`, `membership`, `memberNumber`, `status`, `maxBooks`, `activeCount`

#### `GET /api/portal/notices`

- **Purpose:** Guardian self-service portal operations for notices
- **Source File:** [`src/app/api/portal/notices/route.ts`](file:///src/app/api/portal/notices/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Query Parameters:** `category`
- **Database Entities:** `guardian`, `notice`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `500`
- **Response Payload Keys:** `error`, `success`, `notices`, `data`

#### `POST /api/portal/notifications/mark-all-read`

- **Purpose:** Guardian self-service portal operations for notifications/mark-all-read
- **Source File:** [`src/app/api/portal/notifications/mark-all-read/route.ts`](file:///src/app/api/portal/notifications/mark-all-read/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Database Entities:** `notification`
- **Side Effects:** Mutates existing records in SQLite DB
- **Status Codes:** `401`, `500`
- **Response Payload Keys:** `error`, `success`, `message`

#### `GET, POST /api/portal/notifications/preferences`

- **Purpose:** Guardian self-service portal operations for notifications/preferences
- **Source File:** [`src/app/api/portal/notifications/preferences/route.ts`](file:///src/app/api/portal/notifications/preferences/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Database Entities:** `notificationPreference`
- **Side Effects:** Upserts records into SQLite DB
- **Status Codes:** `401`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `preferences`, `data`, `message`, `preference`

#### `GET /api/portal/notifications`

- **Purpose:** Guardian self-service portal operations for notifications
- **Source File:** [`src/app/api/portal/notifications/route.ts`](file:///src/app/api/portal/notifications/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Query Parameters:** `type`, `unreadOnly`, `page`, `limit`
- **Database Entities:** `notification`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `500`
- **Response Payload Keys:** `error`, `success`, `notifications`, `data`, `unreadCount`, `pagination`, `page`, `limit`, `totalPages`

#### `PATCH /api/portal/notifications/[id]/read`

- **Purpose:** Guardian self-service portal operations for notifications/:param/read
- **Source File:** [`src/app/api/portal/notifications/[id]/read/route.ts`](file:///src/app/api/portal/notifications/[id]/read/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Database Entities:** `notification`
- **Side Effects:** Mutates existing records in SQLite DB
- **Status Codes:** `401`, `404`, `403`, `500`
- **Response Payload Keys:** `error`, `success`, `notification`, `data`

#### `GET /api/portal/results`

- **Purpose:** Guardian self-service portal operations for results
- **Source File:** [`src/app/api/portal/results/route.ts`](file:///src/app/api/portal/results/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Query Parameters:** `studentId`, `examId`
- **Database Entities:** `guardian`, `student`, `result`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `400`, `403`, `404`, `500`
- **Response Payload Keys:** `error`, `student`, `studentIdNumber`, `fullNameBn`, `fullNameEn`, `className`, `sectionName`, `rollNumber`, `sessionYear`

#### `GET, POST /api/portal/security/sessions`

- **Purpose:** Guardian self-service portal operations for security/sessions
- **Source File:** [`src/app/api/portal/security/sessions/route.ts`](file:///src/app/api/portal/security/sessions/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Database Entities:** `session`
- **Side Effects:** Appends immutable audit/security event
- **Status Codes:** `403`, `500`, `400`, `404`
- **Response Payload Keys:** `error`, `success`, `data`, `total`, `message`

#### `GET /api/portal/surveys`

- **Purpose:** Guardian self-service portal operations for surveys
- **Source File:** [`src/app/api/portal/surveys/route.ts`](file:///src/app/api/portal/surveys/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `500`
- **Response Payload Keys:** `success`, `error`, `data`, `total`

#### `POST /api/portal/transport/request`

- **Purpose:** Guardian self-service portal operations for transport/request
- **Source File:** [`src/app/api/portal/transport/request/route.ts`](file:///src/app/api/portal/transport/request/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `400`, `500`
- **Response Payload Keys:** `error`, `রুট এবং পিকআপ স্টপ নির্বাচন আবশ্যক।"`, `success`, `message`, `request`

#### `GET /api/portal/transport`

- **Purpose:** Guardian self-service portal operations for transport
- **Source File:** [`src/app/api/portal/transport/route.ts`](file:///src/app/api/portal/transport/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `GUARDIAN, ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `404`, `500`
- **Response Payload Keys:** `error`, `success`, `guardian`, `fullNameBn`, `phone`

### 3.9 Teacher Cockpit & Evaluation (8 Endpoints)

#### `GET /api/teacher/analytics`

- **Purpose:** Teacher cockpit class, attendance, and evaluation operations for analytics
- **Source File:** [`src/app/api/teacher/analytics/route.ts`](file:///src/app/api/teacher/analytics/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `TEACHER, ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `data`

#### `GET /api/teacher/attendance/assignments`

- **Purpose:** Teacher cockpit class, attendance, and evaluation operations for attendance/assignments
- **Source File:** [`src/app/api/teacher/attendance/assignments/route.ts`](file:///src/app/api/teacher/attendance/assignments/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `TEACHER, ADMIN, PRINCIPAL`
- **Database Entities:** `academicSession`, `jamatClass`, `teacherAssignment`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `assignments`, `currentSession`, `success`

#### `GET, POST /api/teacher/attendance`

- **Purpose:** Teacher cockpit class, attendance, and evaluation operations for attendance
- **Source File:** [`src/app/api/teacher/attendance/route.ts`](file:///src/app/api/teacher/attendance/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `TEACHER, ADMIN, PRINCIPAL`
- **Query Parameters:** `sessionId`, `classId`, `sectionId`, `date`
- **Database Entities:** `enrollment`, `attendance`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `জামাত এবং তারিখ প্রদান করা বাধ্যতামূলক।"`, `success`, `date`, `totalStudents`, `isLocked`, `lockReason`, `lockedAt`, `canEdit`, `correctionWindowHours`, `summary`, `students`, `জামাত`, `তারিখ এবং অন্তত একজন শিক্ষার্থীর হাজিরা প্রদান আবশ্যক।"`

#### `GET /api/teacher/hostel`

- **Purpose:** Teacher cockpit class, attendance, and evaluation operations for hostel
- **Source File:** [`src/app/api/teacher/hostel/route.ts`](file:///src/app/api/teacher/hostel/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `TEACHER, ADMIN, PRINCIPAL`
- **Database Entities:** `teacherAssignment`, `student`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `students`

#### `GET /api/teacher/inventory/assets`

- **Purpose:** Teacher cockpit class, attendance, and evaluation operations for inventory/assets
- **Source File:** [`src/app/api/teacher/inventory/assets/route.ts`](file:///src/app/api/teacher/inventory/assets/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `TEACHER, ADMIN, PRINCIPAL`
- **Database Entities:** `inventoryAsset`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `assets`

#### `GET /api/teacher/library`

- **Purpose:** Teacher cockpit class, attendance, and evaluation operations for library
- **Source File:** [`src/app/api/teacher/library/route.ts`](file:///src/app/api/teacher/library/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `TEACHER, ADMIN, PRINCIPAL`
- **Database Entities:** `libraryMember`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `teacherName`, `membership`, `memberNumber`, `status`, `maxBooks`, `activeCount`

#### `GET, POST /api/teacher/results`

- **Purpose:** Teacher cockpit class, attendance, and evaluation operations for results
- **Source File:** [`src/app/api/teacher/results/route.ts`](file:///src/app/api/teacher/results/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `TEACHER, ADMIN, PRINCIPAL`
- **Query Parameters:** `examId`, `classId`, `sectionId`, `subjectId`
- **Database Entities:** `exam`, `examSubject`, `subject`, `enrollment`, `examMark`
- **Side Effects:** Mutates existing records in SQLite DB; Upserts records into SQLite DB; Appends immutable audit/security event; Executes atomic multi-table transaction
- **Status Codes:** `401`, `400`, `404`, `403`, `500`
- **Response Payload Keys:** `error`, `জামাত এবং বিষয় নির্বাচন আবশ্যক।"`, `exam`, `nameBn`, `nameEn`, `status`, `isPublished`, `জামাত`, `বিষয় এবং নম্বর তালিকা আবশ্যক।"`, `message`

#### `GET /api/teacher/transport`

- **Purpose:** Teacher cockpit class, attendance, and evaluation operations for transport
- **Source File:** [`src/app/api/teacher/transport/route.ts`](file:///src/app/api/teacher/transport/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `TEACHER, ADMIN, PRINCIPAL`
- **Query Parameters:** `routeId`
- **Database Entities:** `transportEnrollment`, `transportRoute`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `routes`, `roster`

### 3.10 Principal Executive Oversight (2 Endpoints)

#### `GET, POST /api/principal/issues`

- **Purpose:** Executive principal oversight, governance, and institutional approvals for issues
- **Source File:** [`src/app/api/principal/issues/route.ts`](file:///src/app/api/principal/issues/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `PRINCIPAL, ADMIN`
- **Query Parameters:** `status`, `priority`, `page`, `limit`
- **Database Entities:** `supportRequest`, `supportRequestCategory`
- **Side Effects:** Appends immutable audit/security event
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `issues`, `pagination`, `page`, `limit`, `totalPages`, `message`, `ticket`

#### `GET, PUT /api/principal/profile`

- **Purpose:** Executive principal oversight, governance, and institutional approvals for profile
- **Source File:** [`src/app/api/principal/profile/route.ts`](file:///src/app/api/principal/profile/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `PRINCIPAL, ADMIN`
- **Database Entities:** `principalProfile`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Appends immutable audit/security event
- **Status Codes:** `500`, `403`
- **Response Payload Keys:** `success`, `profile`, `error`, `message`

### 3.11 Documents, Certificates & Verification (13 Endpoints)

#### `GET, POST /api/admin/documents/intelligence`

- **Purpose:** Administrative management and ERP operations for documents/intelligence
- **Source File:** [`src/app/api/admin/documents/intelligence/route.ts`](file:///src/app/api/admin/documents/intelligence/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `action`, `docId`, `search`, `type`, `status`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `integrity`, `logs`, `jobs`, `documents`, `stats`, `document`, `duplicates`, `job`, `field`, `signature`, `result`

#### `GET /api/admin/documents/requests`

- **Purpose:** Administrative management and ERP operations for documents/requests
- **Source File:** [`src/app/api/admin/documents/requests/route.ts`](file:///src/app/api/admin/documents/requests/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `status`, `type`, `search`, `page`, `limit`
- **Database Entities:** `documentRequest`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `requests`, `pagination`, `page`, `limit`, `totalPages`

#### `POST /api/admin/documents/requests/[id]/issue`

- **Purpose:** Administrative management and ERP operations for documents/requests/:param/issue
- **Source File:** [`src/app/api/admin/documents/requests/[id]/issue/route.ts`](file:///src/app/api/admin/documents/requests/[id]/issue/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Database Entities:** `documentRequest`
- **Side Effects:** Appends immutable audit/security event
- **Status Codes:** `403`, `404`, `400`
- **Response Payload Keys:** `error`, `success`, `message`, `certificate`

#### `POST /api/admin/documents/requests/[id]/review`

- **Purpose:** Administrative management and ERP operations for documents/requests/:param/review
- **Source File:** [`src/app/api/admin/documents/requests/[id]/review/route.ts`](file:///src/app/api/admin/documents/requests/[id]/review/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Database Entities:** `documentRequest`, `documentTemplate`, `academicSession`, `feeInvoice`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `404`, `400`, `500`
- **Response Payload Keys:** `error`, `success`, `message`, `request`

#### `GET, POST /api/admin/documents`

- **Purpose:** Administrative management and ERP operations for documents
- **Source File:** [`src/app/api/admin/documents/route.ts`](file:///src/app/api/admin/documents/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `search`, `type`, `status`, `sessionId`, `page`, `limit`
- **Database Entities:** `certificate`, `documentRequest`
- **Side Effects:** Appends immutable audit/security event
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `documents`, `pagination`, `page`, `limit`, `totalPages`, `message`, `certificate`

#### `GET, POST /api/admin/documents/templates`

- **Purpose:** Administrative management and ERP operations for documents/templates
- **Source File:** [`src/app/api/admin/documents/templates/route.ts`](file:///src/app/api/admin/documents/templates/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Database Entities:** `documentTemplate`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `500`, `400`, `404`
- **Response Payload Keys:** `error`, `success`, `templates`, `শিরোনাম এবং মূল বক্তব্য আবশ্যক।"`, `message`, `template`

#### `POST /api/admin/documents/[id]/reissue`

- **Purpose:** Administrative management and ERP operations for documents/:param/reissue
- **Source File:** [`src/app/api/admin/documents/[id]/reissue/route.ts`](file:///src/app/api/admin/documents/[id]/reissue/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Appends immutable audit/security event
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `success`, `message`

#### `POST /api/admin/documents/[id]/revoke`

- **Purpose:** Administrative management and ERP operations for documents/:param/revoke
- **Source File:** [`src/app/api/admin/documents/[id]/revoke/route.ts`](file:///src/app/api/admin/documents/[id]/revoke/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Appends immutable audit/security event
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `success`, `message`, `certificate`

#### `GET /api/admin/documents/[id]`

- **Purpose:** Administrative management and ERP operations for documents/:param
- **Source File:** [`src/app/api/admin/documents/[id]/route.ts`](file:///src/app/api/admin/documents/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Database Entities:** `certificate`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `404`, `500`
- **Response Payload Keys:** `error`, `success`, `document`, `parsedSnapshot`

#### `POST /api/certificates/verify`

- **Purpose:** Core institutional service for certificates/verify
- **Source File:** [`src/app/api/certificates/verify/route.ts`](file:///src/app/api/certificates/verify/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Request Body Fields:** `code`
- **Database Entities:** `certificate`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `400`, `500`
- **Response Payload Keys:** `error`, `success`, `verified`, `certificate`, `type`, `studentName`, `studentId`, `className`, `issueDate`, `isRevoked`, `revokeReason`

#### `GET /api/verify/document/[token]`

- **Purpose:** Public cryptographic and QR verification for official transcripts, receipts, and certificates
- **Source File:** [`src/app/api/verify/document/[token]/route.ts`](file:///src/app/api/verify/document/[token]/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Path Parameters:** `token`
- **Database Entities:** `certificate`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `400`, `404`, `500`
- **Response Payload Keys:** `error`, `verified`, `success`, `document`, `verificationCode`, `documentType`, `titleBn`, `titleEn`, `studentName`, `studentId`, `className`, `sessionName`, `issueDate`, `version`, `isRevoked`, `status`, `revocationNotice`, `institution`, `nameEn`, `address`, `ইলিয়টগঞ্জ`, `দাউদকান্দি`, `কুমিল্লা"`, `principal`

#### `GET /api/verify/receipt/[token]`

- **Purpose:** Public cryptographic and QR verification for official transcripts, receipts, and certificates
- **Source File:** [`src/app/api/verify/receipt/[token]/route.ts`](file:///src/app/api/verify/receipt/[token]/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Path Parameters:** `token`
- **Database Entities:** `paymentReceipt`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `400`, `404`, `500`
- **Response Payload Keys:** `error`, `success`, `verified`, `message`, `isPendingVerification`, `verificationNote`

#### `GET /api/verify/result/[code]`

- **Purpose:** Public cryptographic and QR verification for official transcripts, receipts, and certificates
- **Source File:** [`src/app/api/verify/result/[code]/route.ts`](file:///src/app/api/verify/result/[code]/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Path Parameters:** `code`
- **Database Entities:** `result`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `400`, `404`, `500`
- **Response Payload Keys:** `error`, `isValid`, `verification`

### 3.12 Human Resources & Payroll (17 Endpoints)

#### `GET, POST /api/admin/hr/attendance`

- **Purpose:** Administrative management and ERP operations for hr/attendance
- **Source File:** [`src/app/api/admin/hr/attendance/route.ts`](file:///src/app/api/admin/hr/attendance/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `employeeId`, `date`, `startDate`, `endDate`, `status`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`, `201`
- **Response Payload Keys:** `error`, `success`, `attendances`, `তারিখ ও উপস্থিতি স্ট্যাটাস আবশ্যক।"`, `attendance`

#### `GET, POST /api/admin/hr/departments`

- **Purpose:** Administrative management and ERP operations for hr/departments
- **Source File:** [`src/app/api/admin/hr/departments/route.ts`](file:///src/app/api/admin/hr/departments/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `isActive`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`, `201`
- **Response Payload Keys:** `error`, `success`, `departments`, `department`

#### `PUT /api/admin/hr/departments/[id]`

- **Purpose:** Administrative management and ERP operations for hr/departments/:param
- **Source File:** [`src/app/api/admin/hr/departments/[id]/route.ts`](file:///src/app/api/admin/hr/departments/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `success`, `department`

#### `GET, POST /api/admin/hr/designations`

- **Purpose:** Administrative management and ERP operations for hr/designations
- **Source File:** [`src/app/api/admin/hr/designations/route.ts`](file:///src/app/api/admin/hr/designations/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `departmentId`, `isActive`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`, `201`
- **Response Payload Keys:** `error`, `success`, `designations`, `designation`

#### `PUT /api/admin/hr/designations/[id]`

- **Purpose:** Administrative management and ERP operations for hr/designations/:param
- **Source File:** [`src/app/api/admin/hr/designations/[id]/route.ts`](file:///src/app/api/admin/hr/designations/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `success`, `designation`

#### `GET, POST /api/admin/hr/employees`

- **Purpose:** Administrative management and ERP operations for hr/employees
- **Source File:** [`src/app/api/admin/hr/employees/route.ts`](file:///src/app/api/admin/hr/employees/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `search`, `employeeType`, `departmentId`, `designationId`, `status`, `hasUserAccount`, `page`, `limit`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`, `201`
- **Response Payload Keys:** `error`, `success`, `...result`, `ইংরেজি নাম ও মোবাইল নম্বর আবশ্যক।"`, `employee`

#### `POST /api/admin/hr/employees/[id]/documents`

- **Purpose:** Administrative management and ERP operations for hr/employees/:param/documents
- **Source File:** [`src/app/api/admin/hr/employees/[id]/documents/route.ts`](file:///src/app/api/admin/hr/employees/[id]/documents/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `201`
- **Response Payload Keys:** `error`, `শিরোনাম ও ফাইল লিঙ্ক আবশ্যক।"`, `success`, `document`

#### `POST /api/admin/hr/employees/[id]/documents/[docId]/verify`

- **Purpose:** Administrative management and ERP operations for hr/employees/:param/documents/:param/verify
- **Source File:** [`src/app/api/admin/hr/employees/[id]/documents/[docId]/verify/route.ts`](file:///src/app/api/admin/hr/employees/[id]/documents/[docId]/verify/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`, `docId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `success`, `document`

#### `POST, DELETE /api/admin/hr/employees/[id]/qualifications`

- **Purpose:** Administrative management and ERP operations for hr/employees/:param/qualifications
- **Source File:** [`src/app/api/admin/hr/employees/[id]/qualifications/route.ts`](file:///src/app/api/admin/hr/employees/[id]/qualifications/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Query Parameters:** `qualificationId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `201`
- **Response Payload Keys:** `error`, `success`, `qualification`

#### `GET, PUT /api/admin/hr/employees/[id]`

- **Purpose:** Administrative management and ERP operations for hr/employees/:param
- **Source File:** [`src/app/api/admin/hr/employees/[id]/route.ts`](file:///src/app/api/admin/hr/employees/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Query Parameters:** `card`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `404`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `cardData`, `employee`

#### `POST /api/admin/hr/employees/[id]/status`

- **Purpose:** Administrative management and ERP operations for hr/employees/:param/status
- **Source File:** [`src/app/api/admin/hr/employees/[id]/status/route.ts`](file:///src/app/api/admin/hr/employees/[id]/status/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `success`, `employee`

#### `GET, POST /api/admin/hr/leave/requests`

- **Purpose:** Administrative management and ERP operations for hr/leave/requests
- **Source File:** [`src/app/api/admin/hr/leave/requests/route.ts`](file:///src/app/api/admin/hr/leave/requests/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `employeeId`, `status`, `year`, `limit`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`, `201`
- **Response Payload Keys:** `error`, `success`, `requests`, `ছুটির ধরন`, `শুরুর তারিখ`, `শেষের তারিখ ও কারণ আবশ্যক।"`, `request`

#### `POST /api/admin/hr/leave/requests/[id]/review`

- **Purpose:** Administrative management and ERP operations for hr/leave/requests/:param/review
- **Source File:** [`src/app/api/admin/hr/leave/requests/[id]/review/route.ts`](file:///src/app/api/admin/hr/leave/requests/[id]/review/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `success`, `request`

#### `GET /api/admin/hr/leave/types`

- **Purpose:** Administrative management and ERP operations for hr/leave/types
- **Source File:** [`src/app/api/admin/hr/leave/types/route.ts`](file:///src/app/api/admin/hr/leave/types/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `leaveTypes`

#### `GET /api/admin/hr/reports`

- **Purpose:** Administrative management and ERP operations for hr/reports
- **Source File:** [`src/app/api/admin/hr/reports/route.ts`](file:///src/app/api/admin/hr/reports/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `type`, `departmentId`, `designationId`, `employeeType`, `status`, `leaveTypeId`, `year`, `days`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `error`, `success`, `type`, `data`

#### `GET /api/admin/hr/stats`

- **Purpose:** Administrative management and ERP operations for hr/stats
- **Source File:** [`src/app/api/admin/hr/stats/route.ts`](file:///src/app/api/admin/hr/stats/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `stats`

#### `GET, POST /api/admin/teachers`

- **Purpose:** Administrative management and ERP operations for teachers
- **Source File:** [`src/app/api/admin/teachers/route.ts`](file:///src/app/api/admin/teachers/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Request Body Fields:** `name`, `email`, `phone`, `password`
- **Database Entities:** `user`
- **Side Effects:** Persists new records to SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `teachers`, `ইমেইল ও পাসওয়ার্ড প্রদান করা আবশ্যক।"`, `message`, `teacher`, `name`, `email`, `phone`, `role`

### 3.13 Inventory & Asset Management (24 Endpoints)

#### `GET, POST /api/admin/inventory/assets`

- **Purpose:** Administrative management and ERP operations for inventory/assets
- **Source File:** [`src/app/api/admin/inventory/assets/route.ts`](file:///src/app/api/admin/inventory/assets/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `itemId`, `locationId`, `status`, `condition`, `assignedUserId`, `search`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `assets`, `asset`

#### `POST /api/admin/inventory/assets/[id]/assign`

- **Purpose:** Administrative management and ERP operations for inventory/assets/:param/assign
- **Source File:** [`src/app/api/admin/inventory/assets/[id]/assign/route.ts`](file:///src/app/api/admin/inventory/assets/[id]/assign/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `success`, `asset`

#### `POST /api/admin/inventory/assets/[id]/condition`

- **Purpose:** Administrative management and ERP operations for inventory/assets/:param/condition
- **Source File:** [`src/app/api/admin/inventory/assets/[id]/condition/route.ts`](file:///src/app/api/admin/inventory/assets/[id]/condition/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Request Body Fields:** `condition`, `newCondition`, `status`, `newStatus`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `স্থিতি (Status) ও ইভেন্ট নির্বাচন আবশ্যক।"`, `success`, `asset`

#### `POST /api/admin/inventory/assets/[id]/dispose`

- **Purpose:** Administrative management and ERP operations for inventory/assets/:param/dispose
- **Source File:** [`src/app/api/admin/inventory/assets/[id]/dispose/route.ts`](file:///src/app/api/admin/inventory/assets/[id]/dispose/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `success`, `asset`

#### `GET /api/admin/inventory/assets/[id]`

- **Purpose:** Administrative management and ERP operations for inventory/assets/:param
- **Source File:** [`src/app/api/admin/inventory/assets/[id]/route.ts`](file:///src/app/api/admin/inventory/assets/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `404`, `500`
- **Response Payload Keys:** `error`, `success`, `asset`

#### `GET, POST /api/admin/inventory/categories`

- **Purpose:** Administrative management and ERP operations for inventory/categories
- **Source File:** [`src/app/api/admin/inventory/categories/route.ts`](file:///src/app/api/admin/inventory/categories/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `onlyActive`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `categories`, `category`

#### `PUT /api/admin/inventory/categories/[id]`

- **Purpose:** Administrative management and ERP operations for inventory/categories/:param
- **Source File:** [`src/app/api/admin/inventory/categories/[id]/route.ts`](file:///src/app/api/admin/inventory/categories/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `category`

#### `GET, POST /api/admin/inventory/items`

- **Purpose:** Administrative management and ERP operations for inventory/items
- **Source File:** [`src/app/api/admin/inventory/items/route.ts`](file:///src/app/api/admin/inventory/items/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `categoryId`, `isConsumable`, `isActive`, `search`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `items`, `ক্যাটাগরি ও একক (Unit) নির্বাচন আবশ্যক।"`, `item`

#### `GET, PUT /api/admin/inventory/items/[id]`

- **Purpose:** Administrative management and ERP operations for inventory/items/:param
- **Source File:** [`src/app/api/admin/inventory/items/[id]/route.ts`](file:///src/app/api/admin/inventory/items/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `404`, `500`
- **Response Payload Keys:** `error`, `success`, `item`

#### `GET, POST /api/admin/inventory/locations`

- **Purpose:** Administrative management and ERP operations for inventory/locations
- **Source File:** [`src/app/api/admin/inventory/locations/route.ts`](file:///src/app/api/admin/inventory/locations/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `onlyActive`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `locations`, `location`

#### `PUT /api/admin/inventory/locations/[id]`

- **Purpose:** Administrative management and ERP operations for inventory/locations/:param
- **Source File:** [`src/app/api/admin/inventory/locations/[id]/route.ts`](file:///src/app/api/admin/inventory/locations/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `location`

#### `GET, POST /api/admin/inventory/procurement/orders`

- **Purpose:** Administrative management and ERP operations for inventory/procurement/orders
- **Source File:** [`src/app/api/admin/inventory/procurement/orders/route.ts`](file:///src/app/api/admin/inventory/procurement/orders/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `supplierId`, `status`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `orders`, `order`

#### `POST /api/admin/inventory/procurement/orders/[id]/receive`

- **Purpose:** Administrative management and ERP operations for inventory/procurement/orders/:param/receive
- **Source File:** [`src/app/api/admin/inventory/procurement/orders/[id]/receive/route.ts`](file:///src/app/api/admin/inventory/procurement/orders/[id]/receive/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `success`, `...result`

#### `GET, POST /api/admin/inventory/procurement/requests`

- **Purpose:** Administrative management and ERP operations for inventory/procurement/requests
- **Source File:** [`src/app/api/admin/inventory/procurement/requests/route.ts`](file:///src/app/api/admin/inventory/procurement/requests/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `status`, `priority`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `requests`, `উদ্দেশ্য ও আইটেম তালিকা প্রদান আবশ্যক।"`, `request`

#### `POST /api/admin/inventory/procurement/requests/[id]/review`

- **Purpose:** Administrative management and ERP operations for inventory/procurement/requests/:param/review
- **Source File:** [`src/app/api/admin/inventory/procurement/requests/[id]/review/route.ts`](file:///src/app/api/admin/inventory/procurement/requests/[id]/review/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `error`, `success`, `request`

#### `GET /api/admin/inventory/stats`

- **Purpose:** Administrative management and ERP operations for inventory/stats
- **Source File:** [`src/app/api/admin/inventory/stats/route.ts`](file:///src/app/api/admin/inventory/stats/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `stats`

#### `POST /api/admin/inventory/stock/adjust`

- **Purpose:** Administrative management and ERP operations for inventory/stock/adjust
- **Source File:** [`src/app/api/admin/inventory/stock/adjust/route.ts`](file:///src/app/api/admin/inventory/stock/adjust/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `লোকেশন`, `গণনাকৃত প্রকৃত মজুদ ও সমন্বয়ের কারণ আবশ্যক।"`, `success`, `...result`

#### `GET /api/admin/inventory/stock/balances`

- **Purpose:** Administrative management and ERP operations for inventory/stock/balances
- **Source File:** [`src/app/api/admin/inventory/stock/balances/route.ts`](file:///src/app/api/admin/inventory/stock/balances/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `itemId`, `locationId`, `lowStockOnly`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `balances`

#### `POST /api/admin/inventory/stock/in`

- **Purpose:** Administrative management and ERP operations for inventory/stock/in
- **Source File:** [`src/app/api/admin/inventory/stock/in/route.ts`](file:///src/app/api/admin/inventory/stock/in/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `লোকেশন ও পরিমাণ প্রদান আবশ্যক।"`, `success`, `...result`

#### `POST /api/admin/inventory/stock/out`

- **Purpose:** Administrative management and ERP operations for inventory/stock/out
- **Source File:** [`src/app/api/admin/inventory/stock/out/route.ts`](file:///src/app/api/admin/inventory/stock/out/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `লোকেশন`, `পরিমাণ ও ব্যবহারের উদ্দেশ্য প্রদান আবশ্যক।"`, `success`, `...result`

#### `GET /api/admin/inventory/stock/transactions`

- **Purpose:** Administrative management and ERP operations for inventory/stock/transactions
- **Source File:** [`src/app/api/admin/inventory/stock/transactions/route.ts`](file:///src/app/api/admin/inventory/stock/transactions/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `itemId`, `locationId`, `type`, `limit`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `transactions`

#### `POST /api/admin/inventory/stock/transfer`

- **Purpose:** Administrative management and ERP operations for inventory/stock/transfer
- **Source File:** [`src/app/api/admin/inventory/stock/transfer/route.ts`](file:///src/app/api/admin/inventory/stock/transfer/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `উৎস লোকেশন`, `গন্তব্য লোকেশন ও পরিমাণ আবশ্যক।"`, `success`, `...result`

#### `GET, POST /api/admin/inventory/suppliers`

- **Purpose:** Administrative management and ERP operations for inventory/suppliers
- **Source File:** [`src/app/api/admin/inventory/suppliers/route.ts`](file:///src/app/api/admin/inventory/suppliers/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `onlyActive`, `search`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `suppliers`, `supplier`

#### `PUT /api/admin/inventory/suppliers/[id]`

- **Purpose:** Administrative management and ERP operations for inventory/suppliers/:param
- **Source File:** [`src/app/api/admin/inventory/suppliers/[id]/route.ts`](file:///src/app/api/admin/inventory/suppliers/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `supplier`

### 3.14 Procurement, Orders & Vendor Management (19 Endpoints)

#### `GET, POST /api/admin/procurement/contracts`

- **Purpose:** Administrative management and ERP operations for procurement/contracts
- **Source File:** [`src/app/api/admin/procurement/contracts/route.ts`](file:///src/app/api/admin/procurement/contracts/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `status`, `vendorId`, `type`, `query`
- **Request Body Fields:** `vendorId`, `titleBn`, `startDate`, `endDate`, `totalContractValue`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `total`, `contracts`, `শিরোনাম`, `চুক্তির মেয়াদ এবং মোট চুক্তি মূল্য প্রদান করুন।"`, `contract`, `message`

#### `GET, PATCH /api/admin/procurement/contracts/[id]`

- **Purpose:** Administrative management and ERP operations for procurement/contracts/:param
- **Source File:** [`src/app/api/admin/procurement/contracts/[id]/route.ts`](file:///src/app/api/admin/procurement/contracts/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Request Body Fields:** `action`, `targetStatus`, `reasonBn`, `changeReason`, `newContractValue`, `newEndDate`, `newPaymentTermsBn`, `newNotes`, `deliverableId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `404`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `contract`, `threeWayMatch`, `message`

#### `GET, POST /api/admin/procurement/decisions`

- **Purpose:** Administrative management and ERP operations for procurement/decisions
- **Source File:** [`src/app/api/admin/procurement/decisions/route.ts`](file:///src/app/api/admin/procurement/decisions/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `rfqId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `total`, `evaluations`, `evaluation`, `rfq`, `quotation`, `message`

#### `GET, POST /api/admin/procurement/evaluations`

- **Purpose:** Administrative management and ERP operations for procurement/evaluations
- **Source File:** [`src/app/api/admin/procurement/evaluations/route.ts`](file:///src/app/api/admin/procurement/evaluations/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `rfqId`
- **Request Body Fields:** `rfqId`, `recommendedVendorId`, `recommendedQuotationId`, `recommendationJustificationBn`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `total`, `evaluations`, `প্রস্তাবিত ভেন্ডর`, `কোটেশন এবং সুপারিশের যৌক্তিকতা উল্লেখ করুন।"`, `evaluation`, `message`

#### `POST /api/admin/procurement/evaluations/[id]/approve`

- **Purpose:** Administrative management and ERP operations for procurement/evaluations/:param/approve
- **Source File:** [`src/app/api/admin/procurement/evaluations/[id]/approve/route.ts`](file:///src/app/api/admin/procurement/evaluations/[id]/approve/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Request Body Fields:** `decisionNotes`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `success`, `error`, `evaluation`, `rfq`, `quotation`, `message`

#### `GET /api/admin/procurement/quotations/comparison`

- **Purpose:** Administrative management and ERP operations for procurement/quotations/comparison
- **Source File:** [`src/app/api/admin/procurement/quotations/comparison/route.ts`](file:///src/app/api/admin/procurement/quotations/comparison/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `rfqId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `success`, `error`, `matrix`

#### `GET, POST /api/admin/procurement/quotations`

- **Purpose:** Administrative management and ERP operations for procurement/quotations
- **Source File:** [`src/app/api/admin/procurement/quotations/route.ts`](file:///src/app/api/admin/procurement/quotations/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `rfqId`, `vendorId`
- **Request Body Fields:** `rfqId`, `vendorId`, `items`, `validUntilDate`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `total`, `quotations`, `ভেন্ডর`, `মেয়াদ এবং আইটেম তালিকা প্রদান করুন।"`, `quotation`, `message`

#### `GET /api/admin/procurement/reports`

- **Purpose:** Administrative management and ERP operations for procurement/reports
- **Source File:** [`src/app/api/admin/procurement/reports/route.ts`](file:///src/app/api/admin/procurement/reports/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `type`, `rfqId`, `vendorId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `success`, `error`, `reportType`, `reportTitle`, `institutionHeader`, `summaryStats`, `data`

#### `GET, POST /api/admin/procurement/rfqs`

- **Purpose:** Administrative management and ERP operations for procurement/rfqs
- **Source File:** [`src/app/api/admin/procurement/rfqs/route.ts`](file:///src/app/api/admin/procurement/rfqs/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `status`, `query`
- **Request Body Fields:** `titleBn`, `descriptionBn`, `categoryCode`, `submissionDeadline`, `items`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `total`, `rfqs`, `বিবরণ`, `ক্যাটাগরি`, `শেষ সময় ও পণ্যের তালিকা প্রদান করুন।"`, `rfq`, `message`

#### `GET, PATCH /api/admin/procurement/rfqs/[id]`

- **Purpose:** Administrative management and ERP operations for procurement/rfqs/:param
- **Source File:** [`src/app/api/admin/procurement/rfqs/[id]/route.ts`](file:///src/app/api/admin/procurement/rfqs/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Request Body Fields:** `action`, `targetStatus`, `notes`, `invitedVendorIds`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `404`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `rfq`, `quotations`, `evaluation`, `comparisonMatrix`, `message`

#### `GET /api/admin/procurement/stats`

- **Purpose:** Administrative management and ERP operations for procurement/stats
- **Source File:** [`src/app/api/admin/procurement/stats/route.ts`](file:///src/app/api/admin/procurement/stats/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `success`, `error`, `stats`, `expiringContracts`, `triggeredReminders`, `pendingVendors`, `eligiblePRs`, `recentAudits`

#### `GET, POST /api/admin/procurement/vendors`

- **Purpose:** Administrative management and ERP operations for procurement/vendors
- **Source File:** [`src/app/api/admin/procurement/vendors/route.ts`](file:///src/app/api/admin/procurement/vendors/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `query`, `category`, `status`, `type`
- **Request Body Fields:** `legalNameBn`, `phone`, `addressBn`, `categoryCode`, `vendorType`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `total`, `vendors`, `ফোন`, `ঠিকানা`, `ক্যাটাগরি`, `ধরণ) সঠিকভাবে পূরণ করুন।"`, `vendor`, `duplicateWarnings`, `message`

#### `GET, PATCH /api/admin/procurement/vendors/[id]`

- **Purpose:** Administrative management and ERP operations for procurement/vendors/:param
- **Source File:** [`src/app/api/admin/procurement/vendors/[id]/route.ts`](file:///src/app/api/admin/procurement/vendors/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Request Body Fields:** `targetStatus`, `reasonBn`, `verificationId`, `status`, `notes`, `contact`, `document`, `bankAccountNumber`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `404`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `vendor`, `contracts`, `quotations`, `reviews`, `risks`, `message`

#### `GET, POST /api/admin/vendors`

- **Purpose:** Administrative management and ERP operations for vendors
- **Source File:** [`src/app/api/admin/vendors/route.ts`](file:///src/app/api/admin/vendors/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `query`, `category`, `status`, `type`
- **Request Body Fields:** `legalNameBn`, `phone`, `addressBn`, `categoryCode`, `vendorType`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `total`, `vendors`, `ফোন`, `ঠিকানা`, `ক্যাটাগরি`, `ধরণ) সঠিকভাবে পূরণ করুন।"`, `vendor`, `duplicateWarnings`, `message`

#### `GET, POST /api/admin/vendors/[id]/documents`

- **Purpose:** Administrative management and ERP operations for vendors/:param/documents
- **Source File:** [`src/app/api/admin/vendors/[id]/documents/route.ts`](file:///src/app/api/admin/vendors/[id]/documents/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `404`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `vendorId`, `legalNameBn`, `documents`, `vendor`, `message`

#### `GET /api/admin/vendors/[id]/performance`

- **Purpose:** Administrative management and ERP operations for vendors/:param/performance
- **Source File:** [`src/app/api/admin/vendors/[id]/performance/route.ts`](file:///src/app/api/admin/vendors/[id]/performance/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `404`, `500`
- **Response Payload Keys:** `success`, `error`, `scorecard`

#### `GET, POST /api/admin/vendors/[id]/reviews`

- **Purpose:** Administrative management and ERP operations for vendors/:param/reviews
- **Source File:** [`src/app/api/admin/vendors/[id]/reviews/route.ts`](file:///src/app/api/admin/vendors/[id]/reviews/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Request Body Fields:** `reviewPeriod`, `totalOrders`, `factualSummaryBn`, `onTimeDeliveries`, `delayedDeliveries`, `qualityPassedOrders`, `qualityIssueOrders`, `disputeCount`, `averageResponseDays`, `recommendedAction`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `404`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `vendorId`, `legalNameBn`, `totalReviews`, `reviews`, `মোট অর্ডার (totalOrders) এবং বাস্তবিক বিবরণ আবশ্যক।"`, `review`, `message`

#### `GET, PATCH /api/admin/vendors/[id]`

- **Purpose:** Administrative management and ERP operations for vendors/:param
- **Source File:** [`src/app/api/admin/vendors/[id]/route.ts`](file:///src/app/api/admin/vendors/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Request Body Fields:** `targetStatus`, `reasonBn`, `verificationId`, `status`, `notes`, `contact`, `document`, `bankAccountNumber`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `404`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `vendor`, `contracts`, `quotations`, `reviews`, `risks`, `message`

#### `GET, POST /api/admin/vendors/[id]/verification`

- **Purpose:** Administrative management and ERP operations for vendors/:param/verification
- **Source File:** [`src/app/api/admin/vendors/[id]/verification/route.ts`](file:///src/app/api/admin/vendors/[id]/verification/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `404`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `vendorId`, `legalNameBn`, `verificationStatus`, `verifications`, `vendor`, `message`

### 3.15 Contracts & Legal Commitments (5 Endpoints)

#### `GET, POST /api/admin/contracts`

- **Purpose:** Administrative management and ERP operations for contracts
- **Source File:** [`src/app/api/admin/contracts/route.ts`](file:///src/app/api/admin/contracts/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `vendorId`, `status`, `type`, `expiringOnly`
- **Request Body Fields:** `vendorId`, `titleBn`, `startDate`, `endDate`, `totalContractValue`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `total`, `contracts`, `চুক্তির শিরোনাম`, `মেয়াদকাল এবং মূল্য আবশ্যক।"`, `contract`, `message`

#### `GET, POST /api/admin/contracts/[id]/obligations`

- **Purpose:** Administrative management and ERP operations for contracts/:param/obligations
- **Source File:** [`src/app/api/admin/contracts/[id]/obligations/route.ts`](file:///src/app/api/admin/contracts/[id]/obligations/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `404`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `contractId`, `titleBn`, `deliverables`, `threeWayMatchStatus`, `contract`, `message`

#### `GET, POST /api/admin/contracts/[id]/renewals`

- **Purpose:** Administrative management and ERP operations for contracts/:param/renewals
- **Source File:** [`src/app/api/admin/contracts/[id]/renewals/route.ts`](file:///src/app/api/admin/contracts/[id]/renewals/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `404`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `contractId`, `titleBn`, `vendorName`, `status`, `startDate`, `endDate`, `daysUntilExpiry`, `renewalReminders`, `isRenewalDue`, `versionsCount`, `contract`, `message`

#### `GET, PATCH /api/admin/contracts/[id]`

- **Purpose:** Administrative management and ERP operations for contracts/:param
- **Source File:** [`src/app/api/admin/contracts/[id]/route.ts`](file:///src/app/api/admin/contracts/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Request Body Fields:** `targetStatus`, `reasonBn`, `changeReasonBn`, `revisedValue`, `revisedEndDate`, `revisedPaymentTerms`, `revisedScopeOfWorkBn`, `deliverableId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `404`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `contract`, `vendor`, `message`

#### `GET, POST /api/admin/contracts/[id]/versions`

- **Purpose:** Administrative management and ERP operations for contracts/:param/versions
- **Source File:** [`src/app/api/admin/contracts/[id]/versions/route.ts`](file:///src/app/api/admin/contracts/[id]/versions/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `404`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `contractId`, `currentVersion`, `versions`, `contract`, `latestVersionSnapshot`, `message`

### 3.16 Budgets & Fiscal Planning (11 Endpoints)

#### `GET, POST /api/admin/budgets/alerts`

- **Purpose:** Administrative management and ERP operations for budgets/alerts
- **Source File:** [`src/app/api/admin/budgets/alerts/route.ts`](file:///src/app/api/admin/budgets/alerts/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `budgetId`, `level`
- **Request Body Fields:** `alertId`, `budgetId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `total`, `alerts`, `message`, `alert`

#### `GET, POST /api/admin/budgets/lines`

- **Purpose:** Administrative management and ERP operations for budgets/lines
- **Source File:** [`src/app/api/admin/budgets/lines/route.ts`](file:///src/app/api/admin/budgets/lines/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `budgetId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `404`, `500`
- **Response Payload Keys:** `success`, `error`, `total`, `lines`, `খাতের নাম এবং বরাদ্দের পরিমাণ আবশ্যক।"`, `message`, `line`, `budget`

#### `GET, POST /api/admin/budgets/periods`

- **Purpose:** Administrative management and ERP operations for budgets/periods
- **Source File:** [`src/app/api/admin/budgets/periods/route.ts`](file:///src/app/api/admin/budgets/periods/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Request Body Fields:** `titleBn`, `startDate`, `endDate`, `id`, `periodCode`, `titleEn`, `periodType`, `status`, `notes`, `approvedBy`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `total`, `periods`, `শুরুর তারিখ ও শেষ তারিখ আবশ্যক।"`, `message`, `period`

#### `GET, POST /api/admin/budgets/projects`

- **Purpose:** Administrative management and ERP operations for budgets/projects
- **Source File:** [`src/app/api/admin/budgets/projects/route.ts`](file:///src/app/api/admin/budgets/projects/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Request Body Fields:** `nameBn`, `fundCode`, `approvedBudget`, `startDate`, `endDate`, `id`, `projectCode`, `nameEn`, `descriptionBn`, `fundNameBn`, `status`, `revisedBudget`, `actualExpense`, `committedAmount`, `projectManagerName`, `contractorVendorName`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `total`, `projects`, `ফান্ড`, `অনুমোদিত বরাদ্দ এবং তারিখ আবশ্যক।"`, `message`, `project`

#### `GET, POST /api/admin/budgets/revisions`

- **Purpose:** Administrative management and ERP operations for budgets/revisions
- **Source File:** [`src/app/api/admin/budgets/revisions/route.ts`](file:///src/app/api/admin/budgets/revisions/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `budgetId`, `status`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `total`, `revisions`, `রিভিশন শিরোনাম`, `কারণ এবং লাইনের পরিবর্তন তালিকা আবশ্যক।"`, `message`, `revision`

#### `POST /api/admin/budgets/revisions/[id]/approve`

- **Purpose:** Administrative management and ERP operations for budgets/revisions/:param/approve
- **Source File:** [`src/app/api/admin/budgets/revisions/[id]/approve/route.ts`](file:///src/app/api/admin/budgets/revisions/[id]/approve/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Request Body Fields:** `approvalReference`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `success`, `error`, `message`

#### `GET, POST /api/admin/budgets`

- **Purpose:** Administrative management and ERP operations for budgets
- **Source File:** [`src/app/api/admin/budgets/route.ts`](file:///src/app/api/admin/budgets/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `status`, `fiscalYear`, `search`
- **Request Body Fields:** `titleBn`, `periodId`, `fiscalYear`, `startDate`, `endDate`, `titleEn`, `periodNameBn`, `notes`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`, `201`
- **Response Payload Keys:** `success`, `error`, `total`, `budgets`, `বাজেট মেয়াদ`, `অর্থবছর এবং তারিখ আবশ্যক।"`, `message`, `budget`

#### `GET /api/admin/budgets/stats`

- **Purpose:** Administrative management and ERP operations for budgets/stats
- **Source File:** [`src/app/api/admin/budgets/stats/route.ts`](file:///src/app/api/admin/budgets/stats/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `success`, `error`, `stats`

#### `GET /api/admin/budgets/variance`

- **Purpose:** Administrative management and ERP operations for budgets/variance
- **Source File:** [`src/app/api/admin/budgets/variance/route.ts`](file:///src/app/api/admin/budgets/variance/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `budgetId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `404`, `500`
- **Response Payload Keys:** `success`, `error`, `budgetCode`, `titleBn`, `totalLines`, `varianceReport`, `fundSummaries`

#### `POST /api/admin/budgets/[id]/action`

- **Purpose:** Administrative management and ERP operations for budgets/:param/action
- **Source File:** [`src/app/api/admin/budgets/[id]/action/route.ts`](file:///src/app/api/admin/budgets/[id]/action/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `success`, `error`, `message`

#### `GET, PATCH /api/admin/budgets/[id]`

- **Purpose:** Administrative management and ERP operations for budgets/:param
- **Source File:** [`src/app/api/admin/budgets/[id]/route.ts`](file:///src/app/api/admin/budgets/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `404`, `500`
- **Response Payload Keys:** `success`, `error`, `budget`, `message`

### 3.17 Governance, Audit & Risk Assurance (28 Endpoints)

#### `GET, POST /api/admin/governance/actions`

- **Purpose:** Administrative management and ERP operations for governance/actions
- **Source File:** [`src/app/api/admin/governance/actions/route.ts`](file:///src/app/api/admin/governance/actions/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `findingId`, `status`, `overdue`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `total`, `actions`, `অ্যাকশন ধরণ`, `বিবরণ`, `দায়িত্বপ্রাপ্ত কর্মকর্তা এবং সময়সীমা আবশ্যক।"`, `actionItem`, `message`

#### `PATCH /api/admin/governance/actions/[id]`

- **Purpose:** Administrative management and ERP operations for governance/actions/:param
- **Source File:** [`src/app/api/admin/governance/actions/[id]/route.ts`](file:///src/app/api/admin/governance/actions/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Request Body Fields:** `completionNotesBn`, `evidenceRef`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `success`, `error`, `actionItem`, `message`

#### `GET, POST /api/admin/governance/control-tests`

- **Purpose:** Administrative management and ERP operations for governance/control-tests
- **Source File:** [`src/app/api/admin/governance/control-tests/route.ts`](file:///src/app/api/admin/governance/control-tests/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `controlId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `total`, `tests`, `পরীক্ষা পদ্ধতি`, `প্রত্যাশিত ও বাস্তব ফলাফল`, `ফলাফল ও প্রমাণ রেফারেন্স আবশ্যক।"`, `testRecord`, `message`

#### `GET, POST /api/admin/governance/controls`

- **Purpose:** Administrative management and ERP operations for governance/controls
- **Source File:** [`src/app/api/admin/governance/controls/route.ts`](file:///src/app/api/admin/governance/controls/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `category`, `status`, `effectiveness`, `search`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `total`, `controls`, `বিবরণ`, `উদ্দেশ্য`, `ক্যাটাগরি`, `ধরণ এবং দায়িত্বপ্রাপ্ত কর্মকর্তা আবশ্যক।"`, `control`, `message`

#### `GET, PATCH /api/admin/governance/controls/[id]`

- **Purpose:** Administrative management and ERP operations for governance/controls/:param
- **Source File:** [`src/app/api/admin/governance/controls/[id]/route.ts`](file:///src/app/api/admin/governance/controls/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `404`, `500`
- **Response Payload Keys:** `success`, `error`, `control`, `testRecords`, `exceptions`, `mappedRisks`, `message`

#### `GET /api/admin/governance/dashboard`

- **Purpose:** Administrative management and ERP operations for governance/dashboard
- **Source File:** [`src/app/api/admin/governance/dashboard/route.ts`](file:///src/app/api/admin/governance/dashboard/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `success`, `error`, `checkpoint`, `institutionHeader`, `nameEn`, `subtitleBn`, `অভ্যন্তরীণ নিয়ন্ত্রণ ও সুশাসন নিশ্চয়তা ককপিট"`

#### `GET /api/admin/governance/data-quality`

- **Purpose:** Administrative management and ERP operations for governance/data-quality
- **Source File:** [`src/app/api/admin/governance/data-quality/route.ts`](file:///src/app/api/admin/governance/data-quality/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `report`

#### `GET, POST /api/admin/governance/exceptions`

- **Purpose:** Administrative management and ERP operations for governance/exceptions
- **Source File:** [`src/app/api/admin/governance/exceptions/route.ts`](file:///src/app/api/admin/governance/exceptions/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `total`, `exceptions`, `কারণ`, `আওতা`, `শুরু ও শেষ তারিখ এবং ক্ষতিপূরণমূলক বিকল্প নিয়ন্ত্রণ আবশ্যক।"`, `exception`, `message`

#### `GET, POST /api/admin/governance/findings`

- **Purpose:** Administrative management and ERP operations for governance/findings
- **Source File:** [`src/app/api/admin/governance/findings/route.ts`](file:///src/app/api/admin/governance/findings/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `status`, `severity`, `rootCause`, `search`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `total`, `findings`, `বিবরণ`, `উৎস`, `তীব্রতা`, `দায়িত্বপ্রাপ্ত কর্মকর্তা`, `মূল কারণ এবং সুপারিশ আবশ্যক।"`, `finding`, `message`

#### `GET, PATCH /api/admin/governance/findings/[id]`

- **Purpose:** Administrative management and ERP operations for governance/findings/:param
- **Source File:** [`src/app/api/admin/governance/findings/[id]/route.ts`](file:///src/app/api/admin/governance/findings/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Request Body Fields:** `action`, `resolutionNotesBn`, `evidenceRef`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `404`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `finding`, `linkedActions`, `relatedRisk`, `relatedControl`, `message`

#### `GET /api/admin/governance/reports`

- **Purpose:** Administrative management and ERP operations for governance/reports
- **Source File:** [`src/app/api/admin/governance/reports/route.ts`](file:///src/app/api/admin/governance/reports/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `type`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `success`, `error`, `reportType`, `reportTitle`, `institutionHeader`, `summaryStats`, `data`

#### `GET, POST /api/admin/governance/reviews`

- **Purpose:** Administrative management and ERP operations for governance/reviews
- **Source File:** [`src/app/api/admin/governance/reviews/route.ts`](file:///src/app/api/admin/governance/reviews/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Request Body Fields:** `action`, `reviewId`, `summaryDecisionsBn`, `actionItemsCount`, `evidenceRef`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `total`, `reviews`, `review`, `message`, `calendarSync`

#### `GET, POST /api/admin/governance/risks`

- **Purpose:** Administrative management and ERP operations for governance/risks
- **Source File:** [`src/app/api/admin/governance/risks/route.ts`](file:///src/app/api/admin/governance/risks/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `category`, `level`, `status`, `search`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `total`, `risks`, `বিবরণ`, `ক্যাটাগরি`, `উৎস মডিউল এবং দায়িত্বপ্রাপ্ত কর্মকর্তার নাম আবশ্যক।"`, `risk`, `message`

#### `POST /api/admin/governance/risks/[id]/assessment`

- **Purpose:** Administrative management and ERP operations for governance/risks/:param/assessment
- **Source File:** [`src/app/api/admin/governance/risks/[id]/assessment/route.ts`](file:///src/app/api/admin/governance/risks/[id]/assessment/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Request Body Fields:** `inherentLikelihood`, `inherentImpact`, `existingControlIds`, `residualLikelihood`, `residualImpact`, `assessmentNotesBn`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `success`, `error`, `risk`, `message`

#### `GET, PATCH /api/admin/governance/risks/[id]`

- **Purpose:** Administrative management and ERP operations for governance/risks/:param
- **Source File:** [`src/app/api/admin/governance/risks/[id]/route.ts`](file:///src/app/api/admin/governance/risks/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Request Body Fields:** `action`, `closureReasonBn`, `evidenceRef`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `404`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `risk`, `linkedControls`, `linkedFindings`, `audits`, `message`

#### `POST /api/admin/governance/risks/[id]/treatment`

- **Purpose:** Administrative management and ERP operations for governance/risks/:param/treatment
- **Source File:** [`src/app/api/admin/governance/risks/[id]/treatment/route.ts`](file:///src/app/api/admin/governance/risks/[id]/treatment/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Request Body Fields:** `action`, `acceptanceReasonBn`, `nextReviewDate`, `conditionsBn`, `treatmentType`, `treatmentPlanBn`, `treatmentOwner`, `treatmentTargetDate`, `targetStatus`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `success`, `error`, `risk`, `message`, `পরিকল্পনা`, `দায়িত্বপ্রাপ্ত ব্যক্তি এবং লক্ষ্যমাত্রা তারিখ আবশ্যক।"`

#### `GET, POST /api/admin/governance`

- **Purpose:** Administrative management and ERP operations for governance
- **Source File:** [`src/app/api/admin/governance/route.ts`](file:///src/app/api/admin/governance/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Request Body Fields:** `title`, `requesterName`, `requesterRole`, `objective`, `businessJustification`, `affectedModules`, `changeType`, `priority`, `databaseImpact`, `rollbackPlan`, `changeId`, `decision`, `reviewNotes`, `commitHash`, `implementationDetails`, `verificationEvidence`, `module`, `risk`, `impact`, `workaround`, `plannedResolution`, `status`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `summary`, `changeRequest`, `technicalDebtItem`

#### `GET /api/governance/acknowledgements`

- **Purpose:** Core institutional service for governance/acknowledgements
- **Source File:** [`src/app/api/governance/acknowledgements/route.ts`](file:///src/app/api/governance/acknowledgements/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Query Parameters:** `mode`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `500`
- **Response Payload Keys:** `error`, `success`, `pending`, `completed`, `totalCount`, `acknowledgements`

#### `GET, POST /api/governance/conflicts`

- **Purpose:** Core institutional service for governance/conflicts
- **Source File:** [`src/app/api/governance/conflicts/route.ts`](file:///src/app/api/governance/conflicts/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `totalCount`, `openCount`, `conflicts`, `message`, `conflict`

#### `GET, POST /api/governance/documents`

- **Purpose:** Core institutional service for governance/documents
- **Source File:** [`src/app/api/governance/documents/route.ts`](file:///src/app/api/governance/documents/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Query Parameters:** `category`, `documentType`, `status`, `confidentiality`, `audience`, `search`, `effectiveOnDate`
- **Request Body Fields:** `documentCode`
- **Side Effects:** Appends immutable audit/security event
- **Status Codes:** `500`, `403`, `400`
- **Response Payload Keys:** `success`, `totalCount`, `documents`, `error`, `ক্যাটাগরি এবং ডকুমেন্ট টাইপ প্রদান করা আবশ্যক।"`, `message`

#### `POST /api/governance/documents/[id]/acknowledge`

- **Purpose:** Core institutional service for governance/documents/:param/acknowledge
- **Source File:** [`src/app/api/governance/documents/[id]/acknowledge/route.ts`](file:///src/app/api/governance/documents/[id]/acknowledge/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `400`, `500`
- **Response Payload Keys:** `error`, `success`, `message`, `acknowledgement`

#### `POST /api/governance/documents/[id]/action`

- **Purpose:** Core institutional service for governance/documents/:param/action
- **Source File:** [`src/app/api/governance/documents/[id]/action/route.ts`](file:///src/app/api/governance/documents/[id]/action/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `404`, `400`, `403`, `500`
- **Response Payload Keys:** `error`, `success`, `message`, `document`, `previousStatus`, `newStatus`

#### `POST /api/governance/documents/[id]/approve`

- **Purpose:** Core institutional service for governance/documents/:param/approve
- **Source File:** [`src/app/api/governance/documents/[id]/approve/route.ts`](file:///src/app/api/governance/documents/[id]/approve/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `error`, `'REVISION_REQUIRED'`, `'REJECTED') প্রদান করুন।"`, `success`, `message`, `document`, `approvalRecord`

#### `GET, PATCH /api/governance/documents/[id]`

- **Purpose:** Core institutional service for governance/documents/:param
- **Source File:** [`src/app/api/governance/documents/[id]/route.ts`](file:///src/app/api/governance/documents/[id]/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Path Parameters:** `id`
- **Query Parameters:** `effectiveDate`
- **Request Body Fields:** `reviewDate`, `tags`, `relatedSystemModules`, `linkedWorkflowId`, `requiresAcknowledgement`, `mandatoryAckRoles`, `targetAudiences`, `titleBn`, `titleEn`, `titleAr`, `description`, `category`, `ownerDepartment`, `confidentiality`, `contentText`, `contentMarkdown`, `sopSteps`, `handbookSections`, `effectiveFrom`, `effectiveUntil`
- **Side Effects:** Appends immutable audit/security event
- **Status Codes:** `404`, `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `document`, `historicalResolution`, `message`

#### `POST /api/governance/documents/[id]/version`

- **Purpose:** Core institutional service for governance/documents/:param/version
- **Source File:** [`src/app/api/governance/documents/[id]/version/route.ts`](file:///src/app/api/governance/documents/[id]/version/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `error`, `success`, `message`, `newVersion`, `document`

#### `GET, POST /api/governance/exceptions`

- **Purpose:** Core institutional service for governance/exceptions
- **Source File:** [`src/app/api/governance/exceptions/route.ts`](file:///src/app/api/governance/exceptions/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Side Effects:** Appends immutable audit/security event
- **Status Codes:** `403`, `500`, `400`, `404`
- **Response Payload Keys:** `error`, `success`, `totalCount`, `exceptions`, `বিষয়`, `কারণ`, `শুরুর ও সমাপ্তির তারিখ প্রদান আবশ্যক।"`, `message`, `exception`

#### `GET /api/governance/stats`

- **Purpose:** Core institutional service for governance/stats
- **Source File:** [`src/app/api/governance/stats/route.ts`](file:///src/app/api/governance/stats/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `stats`

#### `POST /api/governance/sync-rag`

- **Purpose:** Core institutional service for governance/sync-rag
- **Source File:** [`src/app/api/governance/sync-rag/route.ts`](file:///src/app/api/governance/sync-rag/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Side Effects:** Appends immutable audit/security event
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `message`, `data`

### 3.18 Compliance & Regulatory Auditing (10 Endpoints)

#### `GET /api/admin/compliance/dashboard`

- **Purpose:** Administrative management and ERP operations for compliance/dashboard
- **Source File:** [`src/app/api/admin/compliance/dashboard/route.ts`](file:///src/app/api/admin/compliance/dashboard/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `success`, `error`, `data`, `activeRequirements`, `totalObligations`, `compliantObligations`, `overdueObligations`, `pendingEvidence`, `activeExceptions`, `openRemediations`, `complianceRate`

#### `GET, POST, PATCH /api/admin/compliance/evidence`

- **Purpose:** Administrative management and ERP operations for compliance/evidence
- **Source File:** [`src/app/api/admin/compliance/evidence/route.ts`](file:///src/app/api/admin/compliance/evidence/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `obligationId`, `status`
- **Request Body Fields:** `evidenceId`, `verificationStatus`, `notes`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `data`, `count`, `message`

#### `GET, POST, PATCH /api/admin/compliance/exceptions`

- **Purpose:** Administrative management and ERP operations for compliance/exceptions
- **Source File:** [`src/app/api/admin/compliance/exceptions/route.ts`](file:///src/app/api/admin/compliance/exceptions/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Request Body Fields:** `exceptionId`, `decision`, `reason`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `data`, `count`, `message`

#### `GET, POST /api/admin/compliance/obligations`

- **Purpose:** Administrative management and ERP operations for compliance/obligations
- **Source File:** [`src/app/api/admin/compliance/obligations/route.ts`](file:///src/app/api/admin/compliance/obligations/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `requirementId`, `status`, `frequency`, `ownerId`, `isOverdue`, `search`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `data`, `count`, `message`

#### `GET, PATCH /api/admin/compliance/obligations/[id]`

- **Purpose:** Administrative management and ERP operations for compliance/obligations/:param
- **Source File:** [`src/app/api/admin/compliance/obligations/[id]/route.ts`](file:///src/app/api/admin/compliance/obligations/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Request Body Fields:** `action`, `ownerId`, `ownerName`, `ownerRole`, `backupOwnerId`, `backupOwnerName`, `status`, `notes`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `404`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `data`, `requirement`, `evidence`, `reviews`, `exceptions`, `remediations`, `message`

#### `GET, POST, PATCH /api/admin/compliance/remediation`

- **Purpose:** Administrative management and ERP operations for compliance/remediation
- **Source File:** [`src/app/api/admin/compliance/remediation/route.ts`](file:///src/app/api/admin/compliance/remediation/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `obligationId`
- **Request Body Fields:** `remediationId`, `isVerified`, `verificationNotes`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `data`, `count`, `message`

#### `GET /api/admin/compliance/reports`

- **Purpose:** Administrative management and ERP operations for compliance/reports
- **Source File:** [`src/app/api/admin/compliance/reports/route.ts`](file:///src/app/api/admin/compliance/reports/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `type`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `success`, `error`, `data`

#### `GET, POST /api/admin/compliance/requirements`

- **Purpose:** Administrative management and ERP operations for compliance/requirements
- **Source File:** [`src/app/api/admin/compliance/requirements/route.ts`](file:///src/app/api/admin/compliance/requirements/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `category`, `source`, `scope`, `status`, `isApplicable`, `search`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `data`, `count`, `message`

#### `GET, PATCH /api/admin/compliance/requirements/[id]`

- **Purpose:** Administrative management and ERP operations for compliance/requirements/:param
- **Source File:** [`src/app/api/admin/compliance/requirements/[id]/route.ts`](file:///src/app/api/admin/compliance/requirements/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Request Body Fields:** `action`, `isApplicable`, `reason`, `reviewer`, `evidenceRef`, `updates`, `isMajorChange`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `404`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `data`, `message`

#### `GET, POST /api/admin/compliance/reviews`

- **Purpose:** Administrative management and ERP operations for compliance/reviews
- **Source File:** [`src/app/api/admin/compliance/reviews/route.ts`](file:///src/app/api/admin/compliance/reviews/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `obligationId`, `requirementId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `data`, `count`, `message`

### 3.19 Calendar & Academic Schedule (21 Endpoints)

#### `PUT /api/admin/calendar/bookings/[id]`

- **Purpose:** Administrative management and ERP operations for calendar/bookings/:param
- **Source File:** [`src/app/api/admin/calendar/bookings/[id]/route.ts`](file:///src/app/api/admin/calendar/bookings/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `400`, `409`, `404`, `500`
- **Response Payload Keys:** `success`, `error`, `message`, `booking`

#### `GET, POST /api/admin/calendar/events`

- **Purpose:** Administrative management and ERP operations for calendar/events
- **Source File:** [`src/app/api/admin/calendar/events/route.ts`](file:///src/app/api/admin/calendar/events/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`, `400`
- **Response Payload Keys:** `success`, `count`, `data`, `error`, `শুরুর সময় এবং শেষ সময় আবশ্যক।"`, `message`, `event`

#### `GET, PUT, DELETE /api/admin/calendar/events/[id]`

- **Purpose:** Administrative management and ERP operations for calendar/events/:param
- **Source File:** [`src/app/api/admin/calendar/events/[id]/route.ts`](file:///src/app/api/admin/calendar/events/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Query Parameters:** `reason`, `actorId`
- **Request Body Fields:** `startAt`, `rescheduleReason`, `actorId`, `actorRole`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `404`, `500`
- **Response Payload Keys:** `success`, `error`, `event`, `message`

#### `GET, POST /api/admin/calendar/holidays`

- **Purpose:** Administrative management and ERP operations for calendar/holidays
- **Source File:** [`src/app/api/admin/calendar/holidays/route.ts`](file:///src/app/api/admin/calendar/holidays/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`, `400`
- **Response Payload Keys:** `success`, `count`, `data`, `error`, `শুরুর তারিখ এবং সমাপ্তির তারিখ আবশ্যক।"`, `message`, `holiday`

#### `GET, POST /api/admin/calendar/meetings`

- **Purpose:** Administrative management and ERP operations for calendar/meetings
- **Source File:** [`src/app/api/admin/calendar/meetings/route.ts`](file:///src/app/api/admin/calendar/meetings/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`, `400`, `409`
- **Response Payload Keys:** `success`, `count`, `data`, `error`, `সময় এবং আয়োজকের তথ্য আবশ্যক।"`, `message`, `meeting`

#### `POST /api/admin/calendar/routines/check-conflicts`

- **Purpose:** Administrative management and ERP operations for calendar/routines/check-conflicts
- **Source File:** [`src/app/api/admin/calendar/routines/check-conflicts/route.ts`](file:///src/app/api/admin/calendar/routines/check-conflicts/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Request Body Fields:** `contextType`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `400`, `500`
- **Response Payload Keys:** `success`, `type`, `hasBlockingConflicts`, `conflicts`, `isBlocked`, `holiday`, `conflict`, `error`

#### `GET, POST /api/admin/calendar/routines`

- **Purpose:** Administrative management and ERP operations for calendar/routines
- **Source File:** [`src/app/api/admin/calendar/routines/route.ts`](file:///src/app/api/admin/calendar/routines/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `classId`, `sectionId`, `teacherId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`, `400`, `409`
- **Response Payload Keys:** `success`, `count`, `data`, `error`, `বিষয়`, `শিক্ষক`, `বার এবং সময়সূচি আবশ্যক।"`, `message`, `slot`

#### `DELETE /api/admin/calendar/routines/[id]`

- **Purpose:** Administrative management and ERP operations for calendar/routines/:param
- **Source File:** [`src/app/api/admin/calendar/routines/[id]/route.ts`](file:///src/app/api/admin/calendar/routines/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Query Parameters:** `actorId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `404`, `500`
- **Response Payload Keys:** `success`, `error`, `message`

#### `GET /api/calendar/events`

- **Purpose:** Core institutional service for calendar/events
- **Source File:** [`src/app/api/calendar/events/route.ts`](file:///src/app/api/calendar/events/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Query Parameters:** `start`, `end`, `role`, `userId`, `classId`, `search`, `type`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `count`, `startDate`, `endDate`, `userRole`, `data`, `error`

#### `GET /api/calendar/export`

- **Purpose:** Core institutional service for calendar/export
- **Source File:** [`src/app/api/calendar/export/route.ts`](file:///src/app/api/calendar/export/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Query Parameters:** `start`, `end`, `role`, `userId`, `title`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `200`, `500`
- **Response Payload Keys:** `success`, `error`

#### `GET /api/calendar/holidays`

- **Purpose:** Core institutional service for calendar/holidays
- **Source File:** [`src/app/api/calendar/holidays/route.ts`](file:///src/app/api/calendar/holidays/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Query Parameters:** `publicOnly`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `count`, `data`, `error`

#### `POST /api/calendar/resources/book`

- **Purpose:** Core institutional service for calendar/resources/book
- **Source File:** [`src/app/api/calendar/resources/book/route.ts`](file:///src/app/api/calendar/resources/book/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `400`, `409`, `500`
- **Response Payload Keys:** `success`, `error`, `শিরোনাম`, `শুরুর সময় এবং শেষ সময় আবশ্যক।"`, `message`, `booking`

#### `GET /api/calendar/resources`

- **Purpose:** Core institutional service for calendar/resources
- **Source File:** [`src/app/api/calendar/resources/route.ts`](file:///src/app/api/calendar/resources/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Query Parameters:** `type`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `count`, `resources`, `activeBookings`, `error`

#### `GET, POST /api/events`

- **Purpose:** Core institutional service for events
- **Source File:** [`src/app/api/events/route.ts`](file:///src/app/api/events/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Query Parameters:** `status`, `type`, `isPublic`, `role`, `search`
- **Request Body Fields:** `actorRole`, `typeCode`, `titleBn`, `titleEn`, `titleAr`, `descriptionBn`, `descriptionEn`, `organizer`, `sessionId`, `sessionName`, `audienceRule`, `startAt`, `endAt`, `registrationOpensAt`, `registrationClosesAt`, `venueText`, `resourceId`, `isRegistrationRequired`, `maxCapacity`, `waitlistCapacity`, `isPublic`, `status`, `leadTeacherId`, `assignedTeacherIds`, `bannerUrl`, `instructionsBn`, `contactPhone`, `contactEmail`, `hasFee`, `feeAmount`, `createdBy`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`, `403`, `400`, `201`
- **Response Payload Keys:** `success`, `count`, `types`, `data`, `error`

#### `GET, POST, DELETE /api/events/[id]/certificates`

- **Purpose:** Core institutional service for events/:param/certificates
- **Source File:** [`src/app/api/events/[id]/certificates/route.ts`](file:///src/app/api/events/[id]/certificates/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Path Parameters:** `id`
- **Query Parameters:** `studentId`, `certificateId`, `reason`, `actorId`, `actorRole`
- **Request Body Fields:** `actorRole`, `actorId`, `studentId`, `category`, `awardTextBn`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `404`, `500`, `400`, `201`
- **Response Payload Keys:** `success`, `error`, `count`, `data`, `message`

#### `GET, POST /api/events/[id]/checkin`

- **Purpose:** Core institutional service for events/:param/checkin
- **Source File:** [`src/app/api/events/[id]/checkin/route.ts`](file:///src/app/api/events/[id]/checkin/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Path Parameters:** `id`
- **Query Parameters:** `role`
- **Request Body Fields:** `studentIdOrCode`, `status`, `teacherId`, `teacherName`, `recordedMethod`, `notes`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `404`, `403`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `count`, `data`, `attendance`

#### `GET, POST /api/events/[id]/feedback`

- **Purpose:** Core institutional service for events/:param/feedback
- **Source File:** [`src/app/api/events/[id]/feedback/route.ts`](file:///src/app/api/events/[id]/feedback/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Path Parameters:** `id`
- **Query Parameters:** `role`
- **Request Body Fields:** `rating`, `commentsBn`, `isAnonymous`, `studentId`, `guardianId`, `suggestionsBn`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `404`, `500`, `400`, `201`
- **Response Payload Keys:** `success`, `error`, `count`, `data`

#### `GET, POST, DELETE /api/events/[id]/register`

- **Purpose:** Core institutional service for events/:param/register
- **Source File:** [`src/app/api/events/[id]/register/route.ts`](file:///src/app/api/events/[id]/register/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Path Parameters:** `id`
- **Query Parameters:** `role`, `registrationId`, `reason`, `actorId`, `actorRole`
- **Request Body Fields:** `studentId`, `registeredByRole`, `registeredByUserId`, `guardianId`, `consentGiven`, `notes`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `404`, `403`, `500`, `400`, `201`
- **Response Payload Keys:** `success`, `error`, `count`, `data`, `message`

#### `GET /api/events/[id]/report`

- **Purpose:** Core institutional service for events/:param/report
- **Source File:** [`src/app/api/events/[id]/report/route.ts`](file:///src/app/api/events/[id]/report/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `404`, `500`
- **Response Payload Keys:** `success`, `error`, `data`

#### `GET, POST /api/events/[id]/results`

- **Purpose:** Core institutional service for events/:param/results
- **Source File:** [`src/app/api/events/[id]/results/route.ts`](file:///src/app/api/events/[id]/results/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Path Parameters:** `id`
- **Query Parameters:** `role`
- **Request Body Fields:** `actorRole`, `actorId`, `action`, `studentId`, `competitionCategory`, `score`, `maxScore`, `rank`, `awardType`, `judgeName`, `judgeCommentsBn`, `isPublished`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `404`, `500`, `403`, `400`, `201`
- **Response Payload Keys:** `success`, `error`, `count`, `data`, `message`

#### `GET, PATCH /api/events/[id]`

- **Purpose:** Core institutional service for events/:param
- **Source File:** [`src/app/api/events/[id]/route.ts`](file:///src/app/api/events/[id]/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Path Parameters:** `id`
- **Request Body Fields:** `actorId`, `actorRole`, `targetStatus`, `reason`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `404`, `500`, `400`, `403`
- **Response Payload Keys:** `success`, `error`, `data`

### 3.20 Communications, SMS & Notifications (15 Endpoints)

#### `POST /api/admin/communications/ai-draft`

- **Purpose:** Administrative management and ERP operations for communications/ai-draft
- **Source File:** [`src/app/api/admin/communications/ai-draft/route.ts`](file:///src/app/api/admin/communications/ai-draft/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `draft`, `approvalRequired`, `suggestedSubject`, `suggestedBody`, `suggestedAudience`, `disclaimerBn`, `error`

#### `POST /api/admin/communications/audience/preview`

- **Purpose:** Administrative management and ERP operations for communications/audience/preview
- **Source File:** [`src/app/api/admin/communications/audience/preview/route.ts`](file:///src/app/api/admin/communications/audience/preview/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Request Body Fields:** `audienceType`, `audienceFilter`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `audienceType`, `totalCount`, `sampleRecipients`, `10).map((r) => ({
        recipientId`, `name`, `role`, `email`, `phone`, `4)`, `error`

#### `GET, POST /api/admin/communications/campaigns`

- **Purpose:** Administrative management and ERP operations for communications/campaigns
- **Source File:** [`src/app/api/admin/communications/campaigns/route.ts`](file:///src/app/api/admin/communications/campaigns/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `status`
- **Request Body Fields:** `title`, `subject`, `body`, `audienceType`, `objective`, `communicationType`, `channels`, `audienceFilter`, `templateCode`, `variables`, `actionUrl`, `publicCmsNoticeId`, `priority`, `scheduledAt`, `actorId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`, `400`
- **Response Payload Keys:** `success`, `count`, `campaigns`, `error`, `Subject`, `Body`, `and Audience Type are required."`, `campaign`

#### `POST /api/admin/communications/campaigns/[id]/approve`

- **Purpose:** Administrative management and ERP operations for communications/campaigns/:param/approve
- **Source File:** [`src/app/api/admin/communications/campaigns/[id]/approve/route.ts`](file:///src/app/api/admin/communications/campaigns/[id]/approve/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Request Body Fields:** `approverId`, `role`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `400`
- **Response Payload Keys:** `success`, `message`, `campaign`, `error`

#### `GET, PUT, DELETE /api/admin/communications/campaigns/[id]`

- **Purpose:** Administrative management and ERP operations for communications/campaigns/:param
- **Source File:** [`src/app/api/admin/communications/campaigns/[id]/route.ts`](file:///src/app/api/admin/communications/campaigns/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Request Body Fields:** `actorId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `404`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `campaign`, `preview`, `message`

#### `POST /api/admin/communications/campaigns/[id]/send`

- **Purpose:** Administrative management and ERP operations for communications/campaigns/:param/send
- **Source File:** [`src/app/api/admin/communications/campaigns/[id]/send/route.ts`](file:///src/app/api/admin/communications/campaigns/[id]/send/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `400`
- **Response Payload Keys:** `success`, `error`

#### `POST /api/admin/communications/digests/generate`

- **Purpose:** Administrative management and ERP operations for communications/digests/generate
- **Source File:** [`src/app/api/admin/communications/digests/generate/route.ts`](file:///src/app/api/admin/communications/digests/generate/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Request Body Fields:** `digestType`, `targetRole`, `dispatchLive`, `actorId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `digest`, `error`

#### `GET /api/admin/communications/overview`

- **Purpose:** Administrative management and ERP operations for communications/overview
- **Source File:** [`src/app/api/admin/communications/overview/route.ts`](file:///src/app/api/admin/communications/overview/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `metrics`, `error`

#### `GET, POST, DELETE /api/admin/communications/suppressions`

- **Purpose:** Administrative management and ERP operations for communications/suppressions
- **Source File:** [`src/app/api/admin/communications/suppressions/route.ts`](file:///src/app/api/admin/communications/suppressions/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `email`
- **Request Body Fields:** `email`, `reason`, `notes`, `sourceCampaignId`, `actorId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`, `400`
- **Response Payload Keys:** `success`, `count`, `suppressions`, `error`, `record`, `removed`

#### `GET, POST /api/admin/communications/templates`

- **Purpose:** Administrative management and ERP operations for communications/templates
- **Source File:** [`src/app/api/admin/communications/templates/route.ts`](file:///src/app/api/admin/communications/templates/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Request Body Fields:** `code`, `nameBn`, `category`, `actorId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`, `400`
- **Response Payload Keys:** `success`, `count`, `templates`, `error`, `Name`, `and Category are required."`, `template`

#### `GET /api/admin/notifications/delivery`

- **Purpose:** Administrative management and ERP operations for notifications/delivery
- **Source File:** [`src/app/api/admin/notifications/delivery/route.ts`](file:///src/app/api/admin/notifications/delivery/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `status`, `destination`, `page`, `limit`
- **Database Entities:** `notificationDelivery`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `deliveries`, `data`, `summary`, `pagination`, `page`, `limit`, `totalPages`

#### `POST /api/admin/notifications/delivery/[id]/retry`

- **Purpose:** Administrative management and ERP operations for notifications/delivery/:param/retry
- **Source File:** [`src/app/api/admin/notifications/delivery/[id]/retry/route.ts`](file:///src/app/api/admin/notifications/delivery/[id]/retry/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Database Entities:** `notificationDelivery`
- **Side Effects:** Mutates existing records in SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `404`, `400`, `502`, `500`
- **Response Payload Keys:** `error`, `success`, `message`, `delivery`, `data`

#### `GET /api/admin/notifications`

- **Purpose:** Administrative management and ERP operations for notifications
- **Source File:** [`src/app/api/admin/notifications/route.ts`](file:///src/app/api/admin/notifications/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `type`, `priority`, `page`, `limit`
- **Database Entities:** `notification`, `notificationDelivery`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `notifications`, `stats`, `unreadTotal`, `deliveries`

#### `POST /api/admin/notifications/send`

- **Purpose:** Administrative management and ERP operations for notifications/send
- **Source File:** [`src/app/api/admin/notifications/send/route.ts`](file:///src/app/api/admin/notifications/send/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Appends immutable audit/security event
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `error`, `success`, `message`

#### `GET, POST /api/admin/notifications/templates`

- **Purpose:** Administrative management and ERP operations for notifications/templates
- **Source File:** [`src/app/api/admin/notifications/templates/route.ts`](file:///src/app/api/admin/notifications/templates/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Database Entities:** `notificationTemplate`
- **Side Effects:** Upserts records into SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `templates`, `data`, `নাম`, `সাবজেক্ট ও বডি টেমপ্লেট পূরণ করা আবশ্যক।"`, `message`, `template`

### 3.21 Library Management System (16 Endpoints)

#### `GET, POST, PUT /api/admin/library/authors`

- **Purpose:** Administrative management and ERP operations for library/authors
- **Source File:** [`src/app/api/admin/library/authors/route.ts`](file:///src/app/api/admin/library/authors/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Database Entities:** `libraryAuthor`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `500`, `400`, `201`
- **Response Payload Keys:** `error`, `authors`, `success`, `author`

#### `POST /api/admin/library/barcode-sheet`

- **Purpose:** Administrative management and ERP operations for library/barcode-sheet
- **Source File:** [`src/app/api/admin/library/barcode-sheet/route.ts`](file:///src/app/api/admin/library/barcode-sheet/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Database Entities:** `libraryBookCopy`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `error`, `labels`

#### `GET, POST /api/admin/library/books`

- **Purpose:** Administrative management and ERP operations for library/books
- **Source File:** [`src/app/api/admin/library/books/route.ts`](file:///src/app/api/admin/library/books/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `search`, `categoryId`, `authorId`, `language`, `status`, `page`, `limit`
- **Database Entities:** `libraryBook`
- **Side Effects:** Persists new records to SQLite DB; Appends immutable audit/security event; Executes atomic multi-table transaction
- **Status Codes:** `403`, `500`, `400`, `201`
- **Response Payload Keys:** `error`, `books`, `pagination`, `limit`, `total`, `totalPages`, `ইংরেজি নাম`, `ক্যাটাগরি ও লেখক আবশ্যক।"`, `success`, `...result`

#### `GET, PUT, DELETE /api/admin/library/books/[id]`

- **Purpose:** Administrative management and ERP operations for library/books/:param
- **Source File:** [`src/app/api/admin/library/books/[id]/route.ts`](file:///src/app/api/admin/library/books/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Database Entities:** `libraryBook`, `libraryIssue`
- **Side Effects:** Mutates existing records in SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `404`, `500`, `400`
- **Response Payload Keys:** `error`, `book`, `success`, `message`

#### `GET, POST, PUT /api/admin/library/categories`

- **Purpose:** Administrative management and ERP operations for library/categories
- **Source File:** [`src/app/api/admin/library/categories/route.ts`](file:///src/app/api/admin/library/categories/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Database Entities:** `libraryCategory`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `500`, `400`, `201`
- **Response Payload Keys:** `error`, `categories`, `success`, `category`

#### `GET, POST /api/admin/library/copies`

- **Purpose:** Administrative management and ERP operations for library/copies
- **Source File:** [`src/app/api/admin/library/copies/route.ts`](file:///src/app/api/admin/library/copies/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `bookId`, `status`, `condition`, `search`, `page`, `limit`
- **Database Entities:** `libraryBookCopy`, `libraryBook`
- **Side Effects:** Persists new records to SQLite DB; Appends immutable audit/security event; Executes atomic multi-table transaction
- **Status Codes:** `403`, `500`, `400`, `404`, `201`
- **Response Payload Keys:** `error`, `copies`, `pagination`, `limit`, `total`, `totalPages`, `success`, `count`

#### `POST /api/admin/library/copies/[id]/damaged`

- **Purpose:** Administrative management and ERP operations for library/copies/:param/damaged
- **Source File:** [`src/app/api/admin/library/copies/[id]/damaged/route.ts`](file:///src/app/api/admin/library/copies/[id]/damaged/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `success`, `...result`

#### `POST /api/admin/library/copies/[id]/lost`

- **Purpose:** Administrative management and ERP operations for library/copies/:param/lost
- **Source File:** [`src/app/api/admin/library/copies/[id]/lost/route.ts`](file:///src/app/api/admin/library/copies/[id]/lost/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `success`, `...result`

#### `GET, PUT /api/admin/library/copies/[id]`

- **Purpose:** Administrative management and ERP operations for library/copies/:param
- **Source File:** [`src/app/api/admin/library/copies/[id]/route.ts`](file:///src/app/api/admin/library/copies/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Database Entities:** `libraryBookCopy`, `libraryConditionHistory`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `404`, `500`
- **Response Payload Keys:** `error`, `copy`, `success`

#### `GET, POST /api/admin/library/issues`

- **Purpose:** Administrative management and ERP operations for library/issues
- **Source File:** [`src/app/api/admin/library/issues/route.ts`](file:///src/app/api/admin/library/issues/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `status`, `memberId`, `copyId`, `search`, `page`, `limit`
- **Database Entities:** `libraryIssue`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`, `201`
- **Response Payload Keys:** `error`, `issues`, `pagination`, `limit`, `total`, `totalPages`, `success`, `issue`

#### `POST /api/admin/library/issues/[id]/renew`

- **Purpose:** Administrative management and ERP operations for library/issues/:param/renew
- **Source File:** [`src/app/api/admin/library/issues/[id]/renew/route.ts`](file:///src/app/api/admin/library/issues/[id]/renew/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `success`, `issue`

#### `POST /api/admin/library/issues/[id]/return`

- **Purpose:** Administrative management and ERP operations for library/issues/:param/return
- **Source File:** [`src/app/api/admin/library/issues/[id]/return/route.ts`](file:///src/app/api/admin/library/issues/[id]/return/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `success`, `issue`

#### `GET, POST /api/admin/library/members`

- **Purpose:** Administrative management and ERP operations for library/members
- **Source File:** [`src/app/api/admin/library/members/route.ts`](file:///src/app/api/admin/library/members/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `memberType`, `status`, `search`, `page`, `limit`
- **Database Entities:** `libraryMember`
- **Side Effects:** Persists new records to SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `500`, `400`, `409`, `201`
- **Response Payload Keys:** `error`, `members`, `pagination`, `limit`, `total`, `totalPages`, `success`, `member`

#### `GET, POST, PUT /api/admin/library/publishers`

- **Purpose:** Administrative management and ERP operations for library/publishers
- **Source File:** [`src/app/api/admin/library/publishers/route.ts`](file:///src/app/api/admin/library/publishers/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Database Entities:** `libraryPublisher`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `500`, `400`, `201`
- **Response Payload Keys:** `error`, `publishers`, `success`, `publisher`

#### `GET /api/admin/library/reports`

- **Purpose:** Administrative management and ERP operations for library/reports
- **Source File:** [`src/app/api/admin/library/reports/route.ts`](file:///src/app/api/admin/library/reports/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Database Entities:** `libraryBook`, `libraryBookCopy`, `libraryIssue`, `libraryMember`, `libraryCategory`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `summary`, `totalCopies`, `availableCopies`, `issuedCopies`, `overdueCopies`, `lostCopies`, `damagedCopies`, `repairCopies`, `activeMembers`, `studentMembers`, `teacherMembers`, `todayIssuesCount`, `todayReturnsCount`, `totalFinesAssessed`

#### `GET, PUT /api/admin/library/rules`

- **Purpose:** Administrative management and ERP operations for library/rules
- **Source File:** [`src/app/api/admin/library/rules/route.ts`](file:///src/app/api/admin/library/rules/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Database Entities:** `libraryRule`
- **Side Effects:** Upserts records into SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `rules`, `success`, `rule`

### 3.22 Hostel & Boarding Accommodation (10 Endpoints)

#### `POST /api/admin/hostel/check-in`

- **Purpose:** Administrative management and ERP operations for hostel/check-in
- **Source File:** [`src/app/api/admin/hostel/check-in/route.ts`](file:///src/app/api/admin/hostel/check-in/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `success`, `message`, `enrollment`

#### `POST /api/admin/hostel/check-out`

- **Purpose:** Administrative management and ERP operations for hostel/check-out
- **Source File:** [`src/app/api/admin/hostel/check-out/route.ts`](file:///src/app/api/admin/hostel/check-out/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `success`, `message`, `enrollment`

#### `GET /api/admin/hostel/reports`

- **Purpose:** Administrative management and ERP operations for hostel/reports
- **Source File:** [`src/app/api/admin/hostel/reports/route.ts`](file:///src/app/api/admin/hostel/reports/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `type`, `sessionId`, `startDate`, `endDate`
- **Database Entities:** `student`, `residentialEnrollment`, `feeInvoice`, `residentialHistory`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `error`, `success`, `summary`, `residential`, `dayCare`, `nonResidential`, `enrollmentsByStatus`, `finance`, `totalPaid`, `totalDue`, `checkins`, `checkouts`, `histories`

#### `GET /api/admin/hostel/requests`

- **Purpose:** Administrative management and ERP operations for hostel/requests
- **Source File:** [`src/app/api/admin/hostel/requests/route.ts`](file:///src/app/api/admin/hostel/requests/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `status`, `requestType`, `sessionId`, `page`, `limit`
- **Database Entities:** `residentialRequest`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `requests`, `pagination`, `limit`, `total`, `totalPages`

#### `POST /api/admin/hostel/requests/[id]/review`

- **Purpose:** Administrative management and ERP operations for hostel/requests/:param/review
- **Source File:** [`src/app/api/admin/hostel/requests/[id]/review/route.ts`](file:///src/app/api/admin/hostel/requests/[id]/review/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `success`, `message`, `request`

#### `GET, POST /api/admin/hostel/residents`

- **Purpose:** Administrative management and ERP operations for hostel/residents
- **Source File:** [`src/app/api/admin/hostel/residents/route.ts`](file:///src/app/api/admin/hostel/residents/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `search`, `residentialStatus`, `enrollmentStatus`, `classId`, `sessionId`, `page`, `limit`
- **Database Entities:** `student`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `students`, `residents`, `pagination`, `limit`, `total`, `totalPages`, `message`, `enrollment`

#### `GET /api/admin/hostel/residents/[studentId]`

- **Purpose:** Administrative management and ERP operations for hostel/residents/:param
- **Source File:** [`src/app/api/admin/hostel/residents/[studentId]/route.ts`](file:///src/app/api/admin/hostel/residents/[studentId]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `studentId`
- **Database Entities:** `student`, `feeInvoice`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `404`, `500`
- **Response Payload Keys:** `error`, `success`, `student`, `studentIdNumber`, `fullNameBn`, `fullNameEn`, `photoUrl`, `residentialStatus`, `isOrphan`, `isFinanciallyWeak`, `class`, `section`, `rollNumber`, `session`, `guardians`, `relation`, `phone`

#### `GET, PUT /api/admin/hostel/rules`

- **Purpose:** Administrative management and ERP operations for hostel/rules
- **Source File:** [`src/app/api/admin/hostel/rules/route.ts`](file:///src/app/api/admin/hostel/rules/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `sessionId`
- **Database Entities:** `academicSession`, `residentialRule`
- **Side Effects:** Persists new records to SQLite DB; Upserts records into SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `404`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `rule`, `message`

#### `GET /api/admin/hostel/stats`

- **Purpose:** Administrative management and ERP operations for hostel/stats
- **Source File:** [`src/app/api/admin/hostel/stats/route.ts`](file:///src/app/api/admin/hostel/stats/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `sessionId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `stats`

#### `POST /api/admin/hostel/status-change`

- **Purpose:** Administrative management and ERP operations for hostel/status-change
- **Source File:** [`src/app/api/admin/hostel/status-change/route.ts`](file:///src/app/api/admin/hostel/status-change/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `success`, `message`

### 3.23 Transport, Fleet & Route Logistics (15 Endpoints)

#### `GET, POST /api/admin/transport/drivers`

- **Purpose:** Administrative management and ERP operations for transport/drivers
- **Source File:** [`src/app/api/admin/transport/drivers/route.ts`](file:///src/app/api/admin/transport/drivers/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `status`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `drivers`, `মোবাইল নম্বর`, `ড্রাইভিং লাইসেন্স নম্বর ও মেয়াদ আবশ্যক।"`, `driver`

#### `PUT /api/admin/transport/drivers/[id]`

- **Purpose:** Administrative management and ERP operations for transport/drivers/:param
- **Source File:** [`src/app/api/admin/transport/drivers/[id]/route.ts`](file:///src/app/api/admin/transport/drivers/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `driver`

#### `GET, POST /api/admin/transport/enrollments`

- **Purpose:** Administrative management and ERP operations for transport/enrollments
- **Source File:** [`src/app/api/admin/transport/enrollments/route.ts`](file:///src/app/api/admin/transport/enrollments/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `status`, `routeId`, `search`
- **Database Entities:** `transportEnrollment`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `enrollments`, `শিক্ষাবর্ষ এবং রুট নির্বাচন আবশ্যক।"`, `enrollment`

#### `PUT, DELETE /api/admin/transport/enrollments/[id]`

- **Purpose:** Administrative management and ERP operations for transport/enrollments/:param
- **Source File:** [`src/app/api/admin/transport/enrollments/[id]/route.ts`](file:///src/app/api/admin/transport/enrollments/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Query Parameters:** `reason`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `error`, `success`, `enrollment`

#### `POST /api/admin/transport/invoices`

- **Purpose:** Administrative management and ERP operations for transport/invoices
- **Source File:** [`src/app/api/admin/transport/invoices/route.ts`](file:///src/app/api/admin/transport/invoices/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Database Entities:** `transportEnrollment`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `404`, `500`
- **Response Payload Keys:** `error`, `success`, `result`, `generatedCount`, `results`, `errors`

#### `GET /api/admin/transport/requests`

- **Purpose:** Administrative management and ERP operations for transport/requests
- **Source File:** [`src/app/api/admin/transport/requests/route.ts`](file:///src/app/api/admin/transport/requests/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `status`
- **Database Entities:** `transportRequest`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `requests`

#### `POST /api/admin/transport/requests/[id]/review`

- **Purpose:** Administrative management and ERP operations for transport/requests/:param/review
- **Source File:** [`src/app/api/admin/transport/requests/[id]/review/route.ts`](file:///src/app/api/admin/transport/requests/[id]/review/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `error`, `success`, `...result`

#### `GET, POST /api/admin/transport/routes`

- **Purpose:** Administrative management and ERP operations for transport/routes
- **Source File:** [`src/app/api/admin/transport/routes/route.ts`](file:///src/app/api/admin/transport/routes/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `includeInactive`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `routes`, `রুট কোড`, `প্রারম্ভিক স্থান এবং গন্তব্য প্রদান করা আবশ্যক।"`, `route`

#### `GET, PUT, DELETE /api/admin/transport/routes/[id]`

- **Purpose:** Administrative management and ERP operations for transport/routes/:param
- **Source File:** [`src/app/api/admin/transport/routes/[id]/route.ts`](file:///src/app/api/admin/transport/routes/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `404`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `route`

#### `GET /api/admin/transport/stats`

- **Purpose:** Administrative management and ERP operations for transport/stats
- **Source File:** [`src/app/api/admin/transport/stats/route.ts`](file:///src/app/api/admin/transport/stats/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `stats`

#### `POST /api/admin/transport/stops`

- **Purpose:** Administrative management and ERP operations for transport/stops
- **Source File:** [`src/app/api/admin/transport/stops/route.ts`](file:///src/app/api/admin/transport/stops/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `স্টপের নাম এবং ক্রমিক নম্বর দেওয়া আবশ্যক।"`, `success`, `stop`

#### `PUT, DELETE /api/admin/transport/stops/[id]`

- **Purpose:** Administrative management and ERP operations for transport/stops/:param
- **Source File:** [`src/app/api/admin/transport/stops/[id]/route.ts`](file:///src/app/api/admin/transport/stops/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `stop`

#### `GET /api/admin/transport/students/[id]`

- **Purpose:** Administrative management and ERP operations for transport/students/:param
- **Source File:** [`src/app/api/admin/transport/students/[id]/route.ts`](file:///src/app/api/admin/transport/students/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `profile`

#### `GET, POST /api/admin/transport/vehicles`

- **Purpose:** Administrative management and ERP operations for transport/vehicles
- **Source File:** [`src/app/api/admin/transport/vehicles/route.ts`](file:///src/app/api/admin/transport/vehicles/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `status`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `vehicles`, `vehicle`

#### `PUT /api/admin/transport/vehicles/[id]`

- **Purpose:** Administrative management and ERP operations for transport/vehicles/:param
- **Source File:** [`src/app/api/admin/transport/vehicles/[id]/route.ts`](file:///src/app/api/admin/transport/vehicles/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `vehicle`

### 3.24 Helpdesk, Grievances & Support Tickets (9 Endpoints)

#### `GET, POST /api/admin/helpdesk/categories`

- **Purpose:** Administrative management and ERP operations for helpdesk/categories
- **Source File:** [`src/app/api/admin/helpdesk/categories/route.ts`](file:///src/app/api/admin/helpdesk/categories/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `includeInactive`
- **Request Body Fields:** `code`, `nameBn`, `nameEn`, `description`, `slaHours`, `icon`, `sortOrder`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `categories`, `category`

#### `PUT /api/admin/helpdesk/categories/[id]`

- **Purpose:** Administrative management and ERP operations for helpdesk/categories/:param
- **Source File:** [`src/app/api/admin/helpdesk/categories/[id]/route.ts`](file:///src/app/api/admin/helpdesk/categories/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Request Body Fields:** `nameBn`, `nameEn`, `description`, `slaHours`, `icon`, `sortOrder`, `isActive`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `success`, `category`

#### `GET /api/admin/helpdesk/reports`

- **Purpose:** Administrative management and ERP operations for helpdesk/reports
- **Source File:** [`src/app/api/admin/helpdesk/reports/route.ts`](file:///src/app/api/admin/helpdesk/reports/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `startDate`, `endDate`
- **Database Entities:** `supportRequest`, `supportRequestCategory`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `report`, `resolvedCount`, `avgResolutionHours`, `slaBreachedCount`, `slaMetCount`, `statusBreakdown`, `label`, `count`

#### `GET, POST /api/admin/helpdesk/requests`

- **Purpose:** Administrative management and ERP operations for helpdesk/requests
- **Source File:** [`src/app/api/admin/helpdesk/requests/route.ts`](file:///src/app/api/admin/helpdesk/requests/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `ticketNumber`, `status`, `categoryId`, `categoryCode`, `requestType`, `priority`, `studentId`, `guardianId`, `search`, `isUrgent`, `page`, `limit`
- **Request Body Fields:** `categoryCode`, `requestType`, `subject`, `description`, `guardianId`, `studentId`, `priority`, `relatedEntityType`, `relatedEntityId`, `attachments`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `...data`, `ধরন`, `বিষয় ও বিবরণ আবশ্যক।"`, `ticket`

#### `POST /api/admin/helpdesk/requests/[id]/attachments`

- **Purpose:** Administrative management and ERP operations for helpdesk/requests/:param/attachments
- **Source File:** [`src/app/api/admin/helpdesk/requests/[id]/attachments/route.ts`](file:///src/app/api/admin/helpdesk/requests/[id]/attachments/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Request Body Fields:** `fileName`, `fileUrl`, `fileSize`, `mimeType`, `isInternal`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `success`, `attachment`

#### `POST /api/admin/helpdesk/requests/[id]/messages`

- **Purpose:** Administrative management and ERP operations for helpdesk/requests/:param/messages
- **Source File:** [`src/app/api/admin/helpdesk/requests/[id]/messages/route.ts`](file:///src/app/api/admin/helpdesk/requests/[id]/messages/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Request Body Fields:** `content`, `isInternal`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `success`, `message`

#### `GET /api/admin/helpdesk/requests/[id]`

- **Purpose:** Administrative management and ERP operations for helpdesk/requests/:param
- **Source File:** [`src/app/api/admin/helpdesk/requests/[id]/route.ts`](file:///src/app/api/admin/helpdesk/requests/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `404`, `500`
- **Response Payload Keys:** `error`, `success`, `ticket`

#### `PATCH /api/admin/helpdesk/requests/[id]/status`

- **Purpose:** Administrative management and ERP operations for helpdesk/requests/:param/status
- **Source File:** [`src/app/api/admin/helpdesk/requests/[id]/status/route.ts`](file:///src/app/api/admin/helpdesk/requests/[id]/status/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Request Body Fields:** `toStatus`, `notes`, `resolutionSummary`, `rejectionReason`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `success`, `ticket`

#### `GET /api/admin/helpdesk/stats`

- **Purpose:** Administrative management and ERP operations for helpdesk/stats
- **Source File:** [`src/app/api/admin/helpdesk/stats/route.ts`](file:///src/app/api/admin/helpdesk/stats/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `stats`

### 3.25 Business Intelligence & Advanced Analytics (19 Endpoints)

#### `GET /api/admin/analytics/academic`

- **Purpose:** Administrative management and ERP operations for analytics/academic
- **Source File:** [`src/app/api/admin/analytics/academic/route.ts`](file:///src/app/api/admin/analytics/academic/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `examId`, `sessionId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `data`

#### `GET /api/admin/analytics/admissions`

- **Purpose:** Administrative management and ERP operations for analytics/admissions
- **Source File:** [`src/app/api/admin/analytics/admissions/route.ts`](file:///src/app/api/admin/analytics/admissions/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `sessionId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `data`

#### `GET /api/admin/analytics/attendance`

- **Purpose:** Administrative management and ERP operations for analytics/attendance
- **Source File:** [`src/app/api/admin/analytics/attendance/route.ts`](file:///src/app/api/admin/analytics/attendance/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `sessionId`, `classId`, `startDate`, `endDate`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `data`

#### `GET /api/admin/analytics/comparison`

- **Purpose:** Administrative management and ERP operations for analytics/comparison
- **Source File:** [`src/app/api/admin/analytics/comparison/route.ts`](file:///src/app/api/admin/analytics/comparison/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `sessionAId`, `sessionBId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `error`, `success`, `data`

#### `GET /api/admin/analytics/finance`

- **Purpose:** Administrative management and ERP operations for analytics/finance
- **Source File:** [`src/app/api/admin/analytics/finance/route.ts`](file:///src/app/api/admin/analytics/finance/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `filter`, `start`, `end`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `data`

#### `GET /api/admin/analytics/operations`

- **Purpose:** Administrative management and ERP operations for analytics/operations
- **Source File:** [`src/app/api/admin/analytics/operations/route.ts`](file:///src/app/api/admin/analytics/operations/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `data`

#### `GET /api/admin/analytics/overview`

- **Purpose:** Administrative management and ERP operations for analytics/overview
- **Source File:** [`src/app/api/admin/analytics/overview/route.ts`](file:///src/app/api/admin/analytics/overview/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `filter`, `start`, `end`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `data`

#### `POST /api/admin/analytics/reports/builder`

- **Purpose:** Administrative management and ERP operations for analytics/reports/builder
- **Source File:** [`src/app/api/admin/analytics/reports/builder/route.ts`](file:///src/app/api/admin/analytics/reports/builder/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Request Body Fields:** `module`, `startDate`, `endDate`, `sessionId`, `classId`, `limit`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `error`, `success`, `result`

#### `GET, POST /api/admin/analytics/reports/saved`

- **Purpose:** Administrative management and ERP operations for analytics/reports/saved
- **Source File:** [`src/app/api/admin/analytics/reports/saved/route.ts`](file:///src/app/api/admin/analytics/reports/saved/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Request Body Fields:** `title`, `module`, `reportType`, `filtersJson`, `description`, `isPublic`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`, `201`
- **Response Payload Keys:** `error`, `success`, `reports`, `মডিউল`, `ধরন এবং ফিল্টার কনফিগারেশন আবশ্যক।"`, `saved`

#### `DELETE /api/admin/analytics/reports/saved/[id]`

- **Purpose:** Administrative management and ERP operations for analytics/reports/saved/:param
- **Source File:** [`src/app/api/admin/analytics/reports/saved/[id]/route.ts`](file:///src/app/api/admin/analytics/reports/saved/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `message`

#### `GET /api/admin/analytics/students`

- **Purpose:** Administrative management and ERP operations for analytics/students
- **Source File:** [`src/app/api/admin/analytics/students/route.ts`](file:///src/app/api/admin/analytics/students/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `sessionId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `data`

#### `GET /api/admin/bi/ai-insight`

- **Purpose:** Administrative management and ERP operations for bi/ai-insight
- **Source File:** [`src/app/api/admin/bi/ai-insight/route.ts`](file:///src/app/api/admin/bi/ai-insight/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `data`

#### `POST /api/admin/bi/forecast`

- **Purpose:** Administrative management and ERP operations for bi/forecast
- **Source File:** [`src/app/api/admin/bi/forecast/route.ts`](file:///src/app/api/admin/bi/forecast/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Request Body Fields:** `metricKey`, `horizon`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `error`, `success`, `data`

#### `GET /api/admin/bi/metrics`

- **Purpose:** Administrative management and ERP operations for bi/metrics
- **Source File:** [`src/app/api/admin/bi/metrics/route.ts`](file:///src/app/api/admin/bi/metrics/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `domain`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `data`, `metrics`

#### `GET /api/admin/bi/overview`

- **Purpose:** Administrative management and ERP operations for bi/overview
- **Source File:** [`src/app/api/admin/bi/overview/route.ts`](file:///src/app/api/admin/bi/overview/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `data`, `todayAttendanceRate`, `overallPassRate`, `monthlyCollections`, `totalOutstanding`, `operatingExpenses`, `netOperatingBalance`, `fundsBalance`, `lowStockCount`, `openTicketsCount`

#### `POST /api/admin/bi/scenarios`

- **Purpose:** Administrative management and ERP operations for bi/scenarios
- **Source File:** [`src/app/api/admin/bi/scenarios/route.ts`](file:///src/app/api/admin/bi/scenarios/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Request Body Fields:** `type`, `horizonMonths`, `collectionDeltaPct`, `expenseDeltaPct`, `enrollmentDeltaPct`, `customTitleBn`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `data`

#### `GET /api/admin/bi/trends`

- **Purpose:** Administrative management and ERP operations for bi/trends
- **Source File:** [`src/app/api/admin/bi/trends/route.ts`](file:///src/app/api/admin/bi/trends/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `domain`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `data`

#### `GET /api/admin/bi/warnings`

- **Purpose:** Administrative management and ERP operations for bi/warnings
- **Source File:** [`src/app/api/admin/bi/warnings/route.ts`](file:///src/app/api/admin/bi/warnings/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `domain`, `severity`, `status`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `data`, `activeCount`, `anomaliesCount`, `warnings`, `anomalies`, `rules`

#### `PATCH /api/admin/bi/warnings/[id]`

- **Purpose:** Administrative management and ERP operations for bi/warnings/:param
- **Source File:** [`src/app/api/admin/bi/warnings/[id]/route.ts`](file:///src/app/api/admin/bi/warnings/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `error`, `success`, `data`

### 3.26 Data Quality, Cleansing & Reconciliation (11 Endpoints)

#### `POST /api/admin/data-quality/duplicates/merge`

- **Purpose:** Administrative management and ERP operations for data-quality/duplicates/merge
- **Source File:** [`src/app/api/admin/data-quality/duplicates/merge/route.ts`](file:///src/app/api/admin/data-quality/duplicates/merge/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `error`, `success`, `messageBn`, `data`

#### `POST /api/admin/data-quality/duplicates/plan`

- **Purpose:** Administrative management and ERP operations for data-quality/duplicates/plan
- **Source File:** [`src/app/api/admin/data-quality/duplicates/plan/route.ts`](file:///src/app/api/admin/data-quality/duplicates/plan/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `error`, `success`, `data`

#### `GET /api/admin/data-quality/duplicates`

- **Purpose:** Administrative management and ERP operations for data-quality/duplicates
- **Source File:** [`src/app/api/admin/data-quality/duplicates/route.ts`](file:///src/app/api/admin/data-quality/duplicates/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `scan`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `data`, `candidates`

#### `POST /api/admin/data-quality/import/commit`

- **Purpose:** Administrative management and ERP operations for data-quality/import/commit
- **Source File:** [`src/app/api/admin/data-quality/import/commit/route.ts`](file:///src/app/api/admin/data-quality/import/commit/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Request Body Fields:** `rows`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `error`, `success`, `messageBn`, `insertedCount`

#### `POST /api/admin/data-quality/import/validate`

- **Purpose:** Administrative management and ERP operations for data-quality/import/validate
- **Source File:** [`src/app/api/admin/data-quality/import/validate/route.ts`](file:///src/app/api/admin/data-quality/import/validate/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Request Body Fields:** `rows`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `error`, `success`, `data`

#### `GET /api/admin/data-quality/issues`

- **Purpose:** Administrative management and ERP operations for data-quality/issues
- **Source File:** [`src/app/api/admin/data-quality/issues/route.ts`](file:///src/app/api/admin/data-quality/issues/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `domain`, `severity`, `status`, `search`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `data`, `issues`, `rules`

#### `GET, PATCH /api/admin/data-quality/issues/[id]`

- **Purpose:** Administrative management and ERP operations for data-quality/issues/:param
- **Source File:** [`src/app/api/admin/data-quality/issues/[id]/route.ts`](file:///src/app/api/admin/data-quality/issues/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `404`, `500`
- **Response Payload Keys:** `error`, `success`, `data`, `messageBn`

#### `GET /api/admin/data-quality/lineage`

- **Purpose:** Administrative management and ERP operations for data-quality/lineage
- **Source File:** [`src/app/api/admin/data-quality/lineage/route.ts`](file:///src/app/api/admin/data-quality/lineage/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `metricKey`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `data`

#### `GET /api/admin/data-quality/overview`

- **Purpose:** Administrative management and ERP operations for data-quality/overview
- **Source File:** [`src/app/api/admin/data-quality/overview/route.ts`](file:///src/app/api/admin/data-quality/overview/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `data`, `summary`, `openIssues`, `criticalCount`, `highCount`, `mediumCount`, `lowCount`, `resolvedCount`, `pendingDuplicates`, `reconciliationMismatches`

#### `GET, POST /api/admin/data-quality/reconciliation`

- **Purpose:** Administrative management and ERP operations for data-quality/reconciliation
- **Source File:** [`src/app/api/admin/data-quality/reconciliation/route.ts`](file:///src/app/api/admin/data-quality/reconciliation/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `data`, `messageBn`

#### `POST /api/admin/data-quality/run`

- **Purpose:** Administrative management and ERP operations for data-quality/run
- **Source File:** [`src/app/api/admin/data-quality/run/route.ts`](file:///src/app/api/admin/data-quality/run/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Request Body Fields:** `domains`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `messageBn`

### 3.27 Workflow Automation Engine (6 Endpoints)

#### `POST /api/admin/workflows/ai-draft`

- **Purpose:** Administrative management and ERP operations for workflows/ai-draft
- **Source File:** [`src/app/api/admin/workflows/ai-draft/route.ts`](file:///src/app/api/admin/workflows/ai-draft/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `error`, `success`, `data`, `noticeBn`

#### `GET, PATCH /api/admin/workflows/approvals`

- **Purpose:** Administrative management and ERP operations for workflows/approvals
- **Source File:** [`src/app/api/admin/workflows/approvals/route.ts`](file:///src/app/api/admin/workflows/approvals/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `status`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `data`, `requests`, `message`

#### `GET /api/admin/workflows/events`

- **Purpose:** Administrative management and ERP operations for workflows/events
- **Source File:** [`src/app/api/admin/workflows/events/route.ts`](file:///src/app/api/admin/workflows/events/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `eventType`, `sourceModule`, `correlationId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `data`, `events`

#### `GET, POST /api/admin/workflows/jobs`

- **Purpose:** Administrative management and ERP operations for workflows/jobs
- **Source File:** [`src/app/api/admin/workflows/jobs/route.ts`](file:///src/app/api/admin/workflows/jobs/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `status`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `data`, `jobs`, `message`

#### `GET /api/admin/workflows/overview`

- **Purpose:** Administrative management and ERP operations for workflows/overview
- **Source File:** [`src/app/api/admin/workflows/overview/route.ts`](file:///src/app/api/admin/workflows/overview/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `data`, `jobs`, `approvals`, `totalRules`, `activeRules`, `totalEventsEmitted`, `recentEvents`, `recentInstances`, `timestamp`

#### `GET, POST /api/admin/workflows/rules`

- **Purpose:** Administrative management and ERP operations for workflows/rules
- **Source File:** [`src/app/api/admin/workflows/rules/route.ts`](file:///src/app/api/admin/workflows/rules/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `domain`, `status`
- **Request Body Fields:** `dryRun`, `action`, `ruleId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`, `404`
- **Response Payload Keys:** `error`, `success`, `data`, `rules`, `conflicts`, `simulation`, `message`, `ট্রিগার ইভেন্ট`, `শর্তাবলী এবং অ্যাকশন বাধ্যতামূলক।"`

### 3.28 External Integrations Hub (9 Endpoints)

#### `GET, POST, DELETE /api/admin/integrations/api-keys`

- **Purpose:** Administrative management and ERP operations for integrations/api-keys
- **Source File:** [`src/app/api/admin/integrations/api-keys/route.ts`](file:///src/app/api/admin/integrations/api-keys/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `id`, `reason`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `data`, `ওনার এবং কমপক্ষে একটি ভ্যালিড স্কোপ আবশ্যক।"`, `message`, `এটি পুনরায় আর প্রদর্শিত হবে না।"`, `rawKey`

#### `GET, POST /api/admin/integrations/dead-letter`

- **Purpose:** Administrative management and ERP operations for integrations/dead-letter
- **Source File:** [`src/app/api/admin/integrations/dead-letter/route.ts`](file:///src/app/api/admin/integrations/dead-letter/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `data`, `message`

#### `GET, POST /api/admin/integrations/jobs`

- **Purpose:** Administrative management and ERP operations for integrations/jobs
- **Source File:** [`src/app/api/admin/integrations/jobs/route.ts`](file:///src/app/api/admin/integrations/jobs/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `data`, `message`

#### `GET /api/admin/integrations/logs`

- **Purpose:** Administrative management and ERP operations for integrations/logs
- **Source File:** [`src/app/api/admin/integrations/logs/route.ts`](file:///src/app/api/admin/integrations/logs/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `limit`, `code`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `data`

#### `GET /api/admin/integrations/overview`

- **Purpose:** Administrative management and ERP operations for integrations/overview
- **Source File:** [`src/app/api/admin/integrations/overview/route.ts`](file:///src/app/api/admin/integrations/overview/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `data`

#### `GET, POST /api/admin/integrations/reconciliation`

- **Purpose:** Administrative management and ERP operations for integrations/reconciliation
- **Source File:** [`src/app/api/admin/integrations/reconciliation/route.ts`](file:///src/app/api/admin/integrations/reconciliation/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `data`, `message`

#### `GET, PATCH /api/admin/integrations/registry`

- **Purpose:** Administrative management and ERP operations for integrations/registry
- **Source File:** [`src/app/api/admin/integrations/registry/route.ts`](file:///src/app/api/admin/integrations/registry/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Appends immutable audit/security event
- **Status Codes:** `403`, `500`, `400`, `404`
- **Response Payload Keys:** `error`, `success`, `data`, `message`

#### `POST /api/admin/integrations/test-connection`

- **Purpose:** Administrative management and ERP operations for integrations/test-connection
- **Source File:** [`src/app/api/admin/integrations/test-connection/route.ts`](file:///src/app/api/admin/integrations/test-connection/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `error`, `success`, `data`

#### `GET, POST /api/admin/integrations/webhooks`

- **Purpose:** Administrative management and ERP operations for integrations/webhooks
- **Source File:** [`src/app/api/admin/integrations/webhooks/route.ts`](file:///src/app/api/admin/integrations/webhooks/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Mutates existing records in SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `data`, `deliveries`, `inbound`, `টার্গেট URL এবং কমপক্ষে একটি ইভেন্ট টাইপ আবশ্যক।"`, `message`, `signingSecret`

### 3.29 Institutional Knowledge Base (5 Endpoints)

#### `GET /api/admin/knowledge/analytics`

- **Purpose:** Administrative management and ERP operations for knowledge/analytics
- **Source File:** [`src/app/api/admin/knowledge/analytics/route.ts`](file:///src/app/api/admin/knowledge/analytics/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `stats`, `publishedDocs`, `draftDocs`, `reviewDocs`, `supersededDocs`, `staleDocsCount`, `totalSearches`, `avgLatencyMs`, `openGapsCount`, `totalFeedbackCount`

#### `POST /api/admin/knowledge/feedback`

- **Purpose:** Administrative management and ERP operations for knowledge/feedback
- **Source File:** [`src/app/api/admin/knowledge/feedback/route.ts`](file:///src/app/api/admin/knowledge/feedback/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `400`, `500`
- **Response Payload Keys:** `error`, `success`, `message`, `feedback`

#### `GET, POST /api/admin/knowledge`

- **Purpose:** Administrative management and ERP operations for knowledge
- **Source File:** [`src/app/api/admin/knowledge/route.ts`](file:///src/app/api/admin/knowledge/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `category`, `status`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `totalCount`, `documents`, `শিরোনাম ও বিবরণ আবশ্যক।"`, `document`

#### `POST /api/admin/knowledge/[id]/action`

- **Purpose:** Administrative management and ERP operations for knowledge/:param/action
- **Source File:** [`src/app/api/admin/knowledge/[id]/action/route.ts`](file:///src/app/api/admin/knowledge/[id]/action/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `404`, `500`
- **Response Payload Keys:** `error`, `success`, `message`

#### `GET, PATCH /api/admin/knowledge/[id]`

- **Purpose:** Administrative management and ERP operations for knowledge/:param
- **Source File:** [`src/app/api/admin/knowledge/[id]/route.ts`](file:///src/app/api/admin/knowledge/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `404`, `500`
- **Response Payload Keys:** `error`, `success`, `document`, `chunks`

### 3.30 Faculty Training & Professional Development (10 Endpoints)

#### `POST /api/training/assessments/[id]/submit`

- **Purpose:** Core institutional service for training/assessments/:param/submit
- **Source File:** [`src/app/api/training/assessments/[id]/submit/route.ts`](file:///src/app/api/training/assessments/[id]/submit/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Path Parameters:** `id`
- **Request Body Fields:** `employeeId`, `employeeName`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `404`, `400`, `500`
- **Response Payload Keys:** `success`, `error`, `message`, `পর্যালোচনার অপেক্ষায় রয়েছে।"`, `submission`

#### `GET, POST /api/training/attendance`

- **Purpose:** Core institutional service for training/attendance
- **Source File:** [`src/app/api/training/attendance/route.ts`](file:///src/app/api/training/attendance/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Query Parameters:** `programId`, `sessionId`, `employeeId`
- **Request Body Fields:** `qrPayload`, `sessionId`, `employeeId`, `employeeName`, `trainingProgramId`, `status`, `checkInTime`, `checkOutTime`, `qrVerified`, `notes`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`, `401`, `403`, `400`
- **Response Payload Keys:** `success`, `total`, `records`, `error`, `record`, `message`, `সেশন`, `কর্মী এবং উপস্থিতির স্ট্যাটাস আবশ্যক।"`, `updatedRate`

#### `GET, POST /api/training/certificates`

- **Purpose:** Core institutional service for training/certificates
- **Source File:** [`src/app/api/training/certificates/route.ts`](file:///src/app/api/training/certificates/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Query Parameters:** `programId`, `employeeId`, `status`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`, `401`, `400`, `403`
- **Response Payload Keys:** `success`, `total`, `certificates`, `error`, `message`, `certificate`

#### `GET, POST /api/training/programs`

- **Purpose:** Core institutional service for training/programs
- **Source File:** [`src/app/api/training/programs/route.ts`](file:///src/app/api/training/programs/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Query Parameters:** `type`, `status`, `mandatory`, `department`, `search`
- **Request Body Fields:** `titleBn`, `titleEn`, `instructorName`, `totalHours`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`, `403`, `400`, `201`
- **Response Payload Keys:** `success`, `total`, `programs`, `error`, `প্রশিক্ষক এবং মোট ঘন্টা আবশ্যক।"`, `message`, `program`

#### `POST /api/training/programs/[id]/action`

- **Purpose:** Core institutional service for training/programs/:param/action
- **Source File:** [`src/app/api/training/programs/[id]/action/route.ts`](file:///src/app/api/training/programs/[id]/action/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `success`, `error`, `message`

#### `POST /api/training/programs/[id]/enroll`

- **Purpose:** Core institutional service for training/programs/:param/enroll
- **Source File:** [`src/app/api/training/programs/[id]/enroll/route.ts`](file:///src/app/api/training/programs/[id]/enroll/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Path Parameters:** `id`
- **Request Body Fields:** `employeeId`, `employeeName`, `designation`, `department`, `isAssignment`, `dueDate`, `notes`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `404`, `400`, `500`
- **Response Payload Keys:** `success`, `error`, `status`, `message`, `enrollment`

#### `GET, PATCH /api/training/programs/[id]`

- **Purpose:** Core institutional service for training/programs/:param
- **Source File:** [`src/app/api/training/programs/[id]/route.ts`](file:///src/app/api/training/programs/[id]/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `404`, `500`, `403`
- **Response Payload Keys:** `success`, `error`, `program`, `message`

#### `GET, POST /api/training/renewals`

- **Purpose:** Core institutional service for training/renewals
- **Source File:** [`src/app/api/training/renewals/route.ts`](file:///src/app/api/training/renewals/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `500`, `403`, `400`
- **Response Payload Keys:** `success`, `error`, `expiringSoonCount`, `expiredCount`, `expiringSoon`, `expired`, `message`

#### `GET, POST /api/training/sessions`

- **Purpose:** Core institutional service for training/sessions
- **Source File:** [`src/app/api/training/sessions/route.ts`](file:///src/app/api/training/sessions/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Query Parameters:** `programId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`, `403`, `400`
- **Response Payload Keys:** `success`, `total`, `sessions`, `error`, `তারিখ ও সময় আবশ্যক।"`, `message`, `session`, `calendarPayload`

#### `GET /api/training/stats`

- **Purpose:** Core institutional service for training/stats
- **Source File:** [`src/app/api/training/stats/route.ts`](file:///src/app/api/training/stats/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `stats`, `error`

### 3.31 Institutional Surveys & Feedback (8 Endpoints)

#### `GET, POST /api/surveys`

- **Purpose:** Core institutional service for surveys
- **Source File:** [`src/app/api/surveys/route.ts`](file:///src/app/api/surveys/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Query Parameters:** `status`, `surveyType`, `isPublic`, `audienceType`
- **Request Body Fields:** `titleBn`, `titleEn`, `surveyType`, `audience`, `titleAr`, `descriptionBn`, `descriptionEn`, `startDate`, `endDate`, `responseMode`, `responseLimit`, `instructionsBn`, `relatedModule`, `relatedEntityId`, `isPublic`, `questions`, `allowHelpdeskConversion`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`, `403`, `400`
- **Response Payload Keys:** `success`, `data`, `total`, `error`, `titleEn`, `surveyType`, `audience"`, `message`

#### `GET, POST /api/surveys/[id]/actions`

- **Purpose:** Core institutional service for surveys/:param/actions
- **Source File:** [`src/app/api/surveys/[id]/actions/route.ts`](file:///src/app/api/surveys/[id]/actions/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Path Parameters:** `id`
- **Request Body Fields:** `action`, `findingBn`, `ownerName`, `dueDate`, `relatedQuestionId`, `findingEn`, `priority`, `ownerId`, `assignedRole`, `evidenceDescription`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `data`, `total`, `message`, `ownerName`, `and dueDate are required"`

#### `GET /api/surveys/[id]/analytics`

- **Purpose:** Core institutional service for surveys/:param/analytics
- **Source File:** [`src/app/api/surveys/[id]/analytics/route.ts`](file:///src/app/api/surveys/[id]/analytics/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `success`, `error`, `data`

#### `GET /api/surveys/[id]/responses`

- **Purpose:** Core institutional service for surveys/:param/responses
- **Source File:** [`src/app/api/surveys/[id]/responses/route.ts`](file:///src/app/api/surveys/[id]/responses/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `404`, `500`
- **Response Payload Keys:** `success`, `error`, `data`, `isSmallGroupSuppressed`, `total`, `responseMode`

#### `GET, PATCH, DELETE /api/surveys/[id]`

- **Purpose:** Core institutional service for surveys/:param
- **Source File:** [`src/app/api/surveys/[id]/route.ts`](file:///src/app/api/surveys/[id]/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `404`, `403`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `data`, `message`

#### `POST /api/surveys/[id]/status`

- **Purpose:** Core institutional service for surveys/:param/status
- **Source File:** [`src/app/api/surveys/[id]/status/route.ts`](file:///src/app/api/surveys/[id]/status/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `success`, `error`, `data`, `message`

#### `POST /api/surveys/[id]/submit`

- **Purpose:** Core institutional service for surveys/:param/submit
- **Source File:** [`src/app/api/surveys/[id]/submit/route.ts`](file:///src/app/api/surveys/[id]/submit/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `400`
- **Response Payload Keys:** `success`, `error`, `data`, `message`

#### `POST /api/surveys/[id]/version`

- **Purpose:** Core institutional service for surveys/:param/version
- **Source File:** [`src/app/api/surveys/[id]/version/route.ts`](file:///src/app/api/surveys/[id]/version/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `success`, `error`, `data`, `message`

### 3.32 Alumni Network & Career Tracking (8 Endpoints)

#### `GET, POST /api/alumni/contributions`

- **Purpose:** Core institutional service for alumni/contributions
- **Source File:** [`src/app/api/alumni/contributions/route.ts`](file:///src/app/api/alumni/contributions/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Query Parameters:** `alumniId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`, `400`
- **Response Payload Keys:** `success`, `data`, `summary`, `error`, `a valid fund (GENERAL`, `LILLAH`, `ZAKAT`, `CONSTRUCTION`, `ORPHAN_SUPPORT) and positive amount are required."`, `message`

#### `GET, POST /api/alumni/groups`

- **Purpose:** Core institutional service for alumni/groups
- **Source File:** [`src/app/api/alumni/groups/route.ts`](file:///src/app/api/alumni/groups/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Query Parameters:** `alumniId`
- **Request Body Fields:** `action`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`, `400`, `403`
- **Response Payload Keys:** `success`, `groups`, `userMemberships`, `error`, `data`, `message`, `nameBn`, `nameEn`, `and type are required."`

#### `GET, POST /api/alumni/import`

- **Purpose:** Core institutional service for alumni/import
- **Source File:** [`src/app/api/alumni/import/route.ts`](file:///src/app/api/alumni/import/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Request Body Fields:** `action`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `success`, `error`, `batches`, `preview`, `result`, `message`

#### `GET, POST /api/alumni/mentorship`

- **Purpose:** Core institutional service for alumni/mentorship
- **Source File:** [`src/app/api/alumni/mentorship/route.ts`](file:///src/app/api/alumni/mentorship/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Query Parameters:** `topic`, `alumniId`, `studentId`
- **Request Body Fields:** `action`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`, `400`, `403`
- **Response Payload Keys:** `success`, `mentors`, `alumniRequests`, `studentRequests`, `error`, `data`, `message`, `mentorAlumniId`, `topic`, `and goalsNote are required."`

#### `GET, POST /api/alumni`

- **Purpose:** Core institutional service for alumni
- **Source File:** [`src/app/api/alumni/route.ts`](file:///src/app/api/alumni/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Query Parameters:** `search`, `passOutYear`, `department`, `currentCity`, `currentProfession`, `page`, `limit`, `stats`, `view`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`, `400`
- **Response Payload Keys:** `success`, `data`, `total`, `page`, `limit`, `stats`, `...result`, `error`, `fullNameBn`, `fullNameEn`, `passOutYear are mandatory."`, `message`

#### `GET, POST /api/alumni/volunteering`

- **Purpose:** Core institutional service for alumni/volunteering
- **Source File:** [`src/app/api/alumni/volunteering/route.ts`](file:///src/app/api/alumni/volunteering/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Query Parameters:** `alumniId`
- **Request Body Fields:** `action`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`, `400`, `403`
- **Response Payload Keys:** `success`, `opportunities`, `applications`, `error`, `data`, `message`, `titleEn`, `and category are required."`

#### `GET, PATCH /api/alumni/[id]`

- **Purpose:** Core institutional service for alumni/:param
- **Source File:** [`src/app/api/alumni/[id]/route.ts`](file:///src/app/api/alumni/[id]/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `404`, `500`, `403`, `400`
- **Response Payload Keys:** `success`, `error`, `data`, `isOwner`, `isAdmin`, `message`

#### `POST /api/alumni/[id]/verify`

- **Purpose:** Core institutional service for alumni/:param/verify
- **Source File:** [`src/app/api/alumni/[id]/verify/route.ts`](file:///src/app/api/alumni/[id]/verify/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Path Parameters:** `id`
- **Request Body Fields:** `action`, `notes`, `verificationNotes`, `isLegacy`, `legacySourceNote`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `404`, `400`
- **Response Payload Keys:** `success`, `error`, `data`, `message`

### 3.33 Content Management (CMS) & Public Notices (16 Endpoints)

#### `POST /api/admin/content/ai-draft`

- **Purpose:** Administrative management and ERP operations for content/ai-draft
- **Source File:** [`src/app/api/admin/content/ai-draft/route.ts`](file:///src/app/api/admin/content/ai-draft/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Request Body Fields:** `task`, `topic`, `context`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `400`, `500`
- **Response Payload Keys:** `success`, `error`, `task`, `topic`, `draft`, `disclaimer`

#### `GET, POST /api/admin/content/downloads`

- **Purpose:** Administrative management and ERP operations for content/downloads
- **Source File:** [`src/app/api/admin/content/downloads/route.ts`](file:///src/app/api/admin/content/downloads/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `downloads`, `error`, `messageBn`, `item`

#### `GET, POST, DELETE /api/admin/content/events`

- **Purpose:** Administrative management and ERP operations for content/events
- **Source File:** [`src/app/api/admin/content/events/route.ts`](file:///src/app/api/admin/content/events/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`, `400`
- **Response Payload Keys:** `success`, `events`, `error`, `messageBn`, `event`

#### `GET, POST /api/admin/content/faqs`

- **Purpose:** Administrative management and ERP operations for content/faqs
- **Source File:** [`src/app/api/admin/content/faqs/route.ts`](file:///src/app/api/admin/content/faqs/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `faqs`, `error`, `messageBn`, `faq`

#### `GET, POST /api/admin/content/gallery`

- **Purpose:** Administrative management and ERP operations for content/gallery
- **Source File:** [`src/app/api/admin/content/gallery/route.ts`](file:///src/app/api/admin/content/gallery/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Request Body Fields:** `isPublic`, `consentVerified`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`, `400`
- **Response Payload Keys:** `success`, `gallery`, `error`, `messageBn`, `item`

#### `GET, POST /api/admin/content/homepage`

- **Purpose:** Administrative management and ERP operations for content/homepage
- **Source File:** [`src/app/api/admin/content/homepage/route.ts`](file:///src/app/api/admin/content/homepage/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `config`, `error`, `messageBn`

#### `GET /api/admin/content/overview`

- **Purpose:** Administrative management and ERP operations for content/overview
- **Source File:** [`src/app/api/admin/content/overview/route.ts`](file:///src/app/api/admin/content/overview/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Database Entities:** `notice`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `metrics`, `totalEvents`, `publishedEvents`, `totalFaqs`, `approvedFaqs`, `pendingFaqs`, `totalDownloads`, `publicDownloads`, `totalGallery`, `consentVerifiedGallery`, `admissionState`, `error`

#### `GET, POST /api/admin/content/profile`

- **Purpose:** Administrative management and ERP operations for content/profile
- **Source File:** [`src/app/api/admin/content/profile/route.ts`](file:///src/app/api/admin/content/profile/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `profile`, `error`, `messageBn`

#### `GET, POST /api/admin/content/seo`

- **Purpose:** Administrative management and ERP operations for content/seo
- **Source File:** [`src/app/api/admin/content/seo/route.ts`](file:///src/app/api/admin/content/seo/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `seo`, `error`, `messageBn`

#### `GET, POST, DELETE /api/admin/notices`

- **Purpose:** Administrative management and ERP operations for notices
- **Source File:** [`src/app/api/admin/notices/route.ts`](file:///src/app/api/admin/notices/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `status`, `category`, `audience`, `search`, `page`, `limit`, `id`
- **Database Entities:** `notice`
- **Side Effects:** Removes records from SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `500`, `400`, `201`, `404`
- **Response Payload Keys:** `error`, `success`, `notices`, `counts`, `pagination`, `page`, `limit`, `totalPages`, `message`, `notice`, `data`

#### `POST /api/admin/notices/scheduler`

- **Purpose:** Administrative management and ERP operations for notices/scheduler
- **Source File:** [`src/app/api/admin/notices/scheduler/route.ts`](file:///src/app/api/admin/notices/scheduler/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `message`

#### `POST /api/admin/notices/[id]/archive`

- **Purpose:** Administrative management and ERP operations for notices/:param/archive
- **Source File:** [`src/app/api/admin/notices/[id]/archive/route.ts`](file:///src/app/api/admin/notices/[id]/archive/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Database Entities:** `notice`
- **Side Effects:** Mutates existing records in SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `404`, `500`
- **Response Payload Keys:** `error`, `success`, `message`, `notice`, `data`

#### `POST /api/admin/notices/[id]/publish`

- **Purpose:** Administrative management and ERP operations for notices/:param/publish
- **Source File:** [`src/app/api/admin/notices/[id]/publish/route.ts`](file:///src/app/api/admin/notices/[id]/publish/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `message`, `notice`, `data`

#### `GET, PATCH /api/admin/notices/[id]`

- **Purpose:** Administrative management and ERP operations for notices/:param
- **Source File:** [`src/app/api/admin/notices/[id]/route.ts`](file:///src/app/api/admin/notices/[id]/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Database Entities:** `notice`
- **Side Effects:** Mutates existing records in SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `404`, `500`
- **Response Payload Keys:** `error`, `success`, `notice`, `message`, `data`

#### `GET /api/notices`

- **Purpose:** Core institutional service for notices
- **Source File:** [`src/app/api/notices/route.ts`](file:///src/app/api/notices/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Query Parameters:** `category`, `search`, `page`, `limit`
- **Database Entities:** `notice`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `notices`, `data`, `pagination`, `page`, `limit`, `totalPages`, `error`

#### `GET /api/notices/[id]`

- **Purpose:** Core institutional service for notices/:param
- **Source File:** [`src/app/api/notices/[id]/route.ts`](file:///src/app/api/notices/[id]/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Path Parameters:** `id`
- **Database Entities:** `notice`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `404`, `403`, `500`
- **Response Payload Keys:** `error`, `success`, `notice`, `data`

### 3.34 AI Intelligence & Search (7 Endpoints)

#### `POST /api/ai/admissions/arabic-name`

- **Purpose:** Core institutional service for ai/admissions/arabic-name
- **Source File:** [`src/app/api/ai/admissions/arabic-name/route.ts`](file:///src/app/api/ai/admissions/arabic-name/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `500`
- **Response Payload Keys:** `error`, `success`, `evaluation`

#### `POST /api/ai/governance/review`

- **Purpose:** Core institutional service for ai/governance/review
- **Source File:** [`src/app/api/ai/governance/review/route.ts`](file:///src/app/api/ai/governance/review/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `error`, `success`, `review`

#### `GET, POST /api/ai/governance`

- **Purpose:** Core institutional service for ai/governance
- **Source File:** [`src/app/api/ai/governance/route.ts`](file:///src/app/api/ai/governance/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `data`, `usage`, `pendingReviews`, `financialAnomalies`, `flags`

#### `POST /api/ai/knowledge-answer`

- **Purpose:** Core institutional service for ai/knowledge-answer
- **Source File:** [`src/app/api/ai/knowledge-answer/route.ts`](file:///src/app/api/ai/knowledge-answer/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `400`, `500`
- **Response Payload Keys:** `error`, `success`, `result`

#### `POST /api/ai/query`

- **Purpose:** Core institutional service for ai/query
- **Source File:** [`src/app/api/ai/query/route.ts`](file:///src/app/api/ai/query/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `400`, `500`
- **Response Payload Keys:** `error`, `success`, `result`

#### `GET /api/global-search`

- **Purpose:** Core institutional service for global-search
- **Source File:** [`src/app/api/global-search/route.ts`](file:///src/app/api/global-search/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Query Parameters:** `q`, `type`, `limit`, `ai`
- **Database Entities:** `guardian`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `...aiResults`, `...results`, `error`

#### `GET, POST /api/search`

- **Purpose:** Core institutional service for search
- **Source File:** [`src/app/api/search/route.ts`](file:///src/app/api/search/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Query Parameters:** `q`, `category`, `limit`, `studentId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `500`
- **Response Payload Keys:** `success`, `...results`, `error`

### 3.35 Operations, System Health & Background Crons (25 Endpoints)

#### `GET /api/admin/command-center`

- **Purpose:** Administrative management and ERP operations for command-center
- **Source File:** [`src/app/api/admin/command-center/route.ts`](file:///src/app/api/admin/command-center/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Database Entities:** `application`, `feeInvoice`, `documentRequest`, `supportRequest`, `inventoryItem`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `pendingTasks`, `titleBn`, `count`, `url`, `category`, `severity`

#### `GET /api/admin/completeness`

- **Purpose:** Administrative management and ERP operations for completeness
- **Source File:** [`src/app/api/admin/completeness/route.ts`](file:///src/app/api/admin/completeness/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `success`, `error`, `data`

#### `GET /api/admin/operations/alerts`

- **Purpose:** Administrative management and ERP operations for operations/alerts
- **Source File:** [`src/app/api/admin/operations/alerts/route.ts`](file:///src/app/api/admin/operations/alerts/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `status`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `alerts`

#### `PATCH /api/admin/operations/alerts/[id]/acknowledge`

- **Purpose:** Administrative management and ERP operations for operations/alerts/:param/acknowledge
- **Source File:** [`src/app/api/admin/operations/alerts/[id]/acknowledge/route.ts`](file:///src/app/api/admin/operations/alerts/[id]/acknowledge/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `success`, `alert`

#### `PATCH /api/admin/operations/alerts/[id]/resolve`

- **Purpose:** Administrative management and ERP operations for operations/alerts/:param/resolve
- **Source File:** [`src/app/api/admin/operations/alerts/[id]/resolve/route.ts`](file:///src/app/api/admin/operations/alerts/[id]/resolve/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `success`, `alert`

#### `GET, POST /api/admin/operations/backups`

- **Purpose:** Administrative management and ERP operations for operations/backups
- **Source File:** [`src/app/api/admin/operations/backups/route.ts`](file:///src/app/api/admin/operations/backups/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `type`, `limit`
- **Request Body Fields:** `type`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `201`
- **Response Payload Keys:** `error`, `success`, `backups`, `backup`

#### `POST /api/admin/operations/backups/[id]/drill`

- **Purpose:** Administrative management and ERP operations for operations/backups/:param/drill
- **Source File:** [`src/app/api/admin/operations/backups/[id]/drill/route.ts`](file:///src/app/api/admin/operations/backups/[id]/drill/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `drill`

#### `POST /api/admin/operations/backups/[id]/restore`

- **Purpose:** Administrative management and ERP operations for operations/backups/:param/restore
- **Source File:** [`src/app/api/admin/operations/backups/[id]/restore/route.ts`](file:///src/app/api/admin/operations/backups/[id]/restore/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Request Body Fields:** `confirmation`, `reason`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`, `500`
- **Response Payload Keys:** `error`, `success`, `restore`

#### `POST /api/admin/operations/backups/[id]/verify`

- **Purpose:** Administrative management and ERP operations for operations/backups/:param/verify
- **Source File:** [`src/app/api/admin/operations/backups/[id]/verify/route.ts`](file:///src/app/api/admin/operations/backups/[id]/verify/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `success`, `backup`

#### `GET, POST /api/admin/operations/cron`

- **Purpose:** Administrative management and ERP operations for operations/cron
- **Source File:** [`src/app/api/admin/operations/cron/route.ts`](file:///src/app/api/admin/operations/cron/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `job`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `report`

#### `GET /api/admin/operations/health`

- **Purpose:** Administrative management and ERP operations for operations/health
- **Source File:** [`src/app/api/admin/operations/health/route.ts`](file:///src/app/api/admin/operations/health/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `health`

#### `GET, POST /api/admin/operations/incidents`

- **Purpose:** Administrative management and ERP operations for operations/incidents
- **Source File:** [`src/app/api/admin/operations/incidents/route.ts`](file:///src/app/api/admin/operations/incidents/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `status`, `severity`, `limit`
- **Request Body Fields:** `title`, `description`, `severity`, `affectedService`, `assignedToId`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`, `201`
- **Response Payload Keys:** `error`, `success`, `incidents`, `incident`

#### `PATCH /api/admin/operations/incidents/[id]/status`

- **Purpose:** Administrative management and ERP operations for operations/incidents/:param/status
- **Source File:** [`src/app/api/admin/operations/incidents/[id]/status/route.ts`](file:///src/app/api/admin/operations/incidents/[id]/status/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Path Parameters:** `id`
- **Request Body Fields:** `status`, `note`, `resolution`, `rootCause`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `400`
- **Response Payload Keys:** `error`, `success`, `incident`

#### `GET, POST /api/admin/operations/maintenance`

- **Purpose:** Administrative management and ERP operations for operations/maintenance
- **Source File:** [`src/app/api/admin/operations/maintenance/route.ts`](file:///src/app/api/admin/operations/maintenance/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Request Body Fields:** `isActive`, `reason`, `messageBn`, `messageEn`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `maintenance`, `result`

#### `GET /api/admin/release-candidate`

- **Purpose:** Administrative management and ERP operations for release-candidate
- **Source File:** [`src/app/api/admin/release-candidate/route.ts`](file:///src/app/api/admin/release-candidate/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `success`, `error`, `data`

#### `POST /api/admin/security/accounts`

- **Purpose:** Administrative management and ERP operations for security/accounts
- **Source File:** [`src/app/api/admin/security/accounts/route.ts`](file:///src/app/api/admin/security/accounts/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Database Entities:** `user`
- **Side Effects:** Mutates existing records in SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `400`, `404`, `500`
- **Response Payload Keys:** `error`, `success`, `message`

#### `GET /api/admin/security/events`

- **Purpose:** Administrative management and ERP operations for security/events
- **Source File:** [`src/app/api/admin/security/events/route.ts`](file:///src/app/api/admin/security/events/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `severity`, `eventType`, `userId`, `limit`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `data`, `total`

#### `GET, POST /api/admin/security/incidents`

- **Purpose:** Administrative management and ERP operations for security/incidents
- **Source File:** [`src/app/api/admin/security/incidents/route.ts`](file:///src/app/api/admin/security/incidents/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `status`
- **Database Entities:** `systemIncident`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`, `400`
- **Response Payload Keys:** `error`, `success`, `data`, `total`, `message`

#### `GET /api/admin/security/overview`

- **Purpose:** Administrative management and ERP operations for security/overview
- **Source File:** [`src/app/api/admin/security/overview/route.ts`](file:///src/app/api/admin/security/overview/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Database Entities:** `session`, `user`, `systemIncident`, `operationalAlert`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `data`, `lockedAccounts`, `suspendedAccounts`, `openIncidents`, `recentHighRiskEvents`

#### `GET, POST /api/admin/security/sessions`

- **Purpose:** Administrative management and ERP operations for security/sessions
- **Source File:** [`src/app/api/admin/security/sessions/route.ts`](file:///src/app/api/admin/security/sessions/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `userId`
- **Database Entities:** `session`, `user`
- **Side Effects:** Appends immutable audit/security event
- **Status Codes:** `403`, `500`, `400`, `404`
- **Response Payload Keys:** `error`, `success`, `data`, `userId`, `user`, `ipAddress`, `userAgent`, `createdAt`, `expiresAt`, `message`

#### `GET, PUT /api/admin/settings`

- **Purpose:** Administrative management and ERP operations for settings
- **Source File:** [`src/app/api/admin/settings/route.ts`](file:///src/app/api/admin/settings/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Database Entities:** `session`, `cashFund`, `academicSession`, `documentTemplate`, `systemBackup`, `principalProfile`, `auditLog`
- **Side Effects:** Mutates existing records in SQLite DB; Appends immutable audit/security event
- **Status Codes:** `403`, `500`
- **Response Payload Keys:** `error`, `success`, `settings`, `message`

#### `GET, POST, PATCH /api/admin/users`

- **Purpose:** Administrative management and ERP operations for users
- **Source File:** [`src/app/api/admin/users/route.ts`](file:///src/app/api/admin/users/route.ts)
- **Access & Authorization:** Protected (Next.js Middleware + Route Handler) | **Allowed Roles:** `ADMIN, PRINCIPAL`
- **Query Parameters:** `role`, `status`, `q`
- **Database Entities:** `user`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Appends immutable audit/security event
- **Status Codes:** `200`
- **Response Payload Keys:** `success`, `error`, `data`, `total`, `message`

#### `GET /api/dashboard/stats`

- **Purpose:** Core institutional service for dashboard/stats
- **Source File:** [`src/app/api/dashboard/stats/route.ts`](file:///src/app/api/dashboard/stats/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Database Entities:** `student`, `user`, `application`, `notice`, `cashFund`, `feeInvoice`, `auditLog`, `paymentReceipt`, `documentRequest`, `supportRequest`, `systemIncident`, `attendance`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `403`, `500`
- **Response Payload Keys:** `error`, `success`, `stats`, `activeStudents`, `residentialStudents`, `dayCareStudents`, `orphanStudents`, `totalTeachers`, `newAdmissions`, `pendingApplications`, `totalNotices`, `totalFundBalance`, `funds`, `financials`, `totalCollected`, `totalDue`

#### `GET /api/health`

- **Purpose:** Core institutional service for health
- **Source File:** [`src/app/api/health/route.ts`](file:///src/app/api/health/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `503`
- **Response Payload Keys:** `status`, `error`

#### `POST /api/sync/process`

- **Purpose:** Core institutional service for sync/process
- **Source File:** [`src/app/api/sync/process/route.ts`](file:///src/app/api/sync/process/route.ts)
- **Access & Authorization:** Authenticated (Session Token) | **Allowed Roles:** `AUTHENTICATED`
- **Database Entities:** `attendance`, `academicSession`, `supportRequestCategory`, `supportRequest`
- **Side Effects:** Persists new records to SQLite DB; Upserts records into SQLite DB
- **Status Codes:** `401`, `400`, `403`, `409`, `500`
- **Response Payload Keys:** `error`, `idempotencyKey ও payload আবশ্যক।"`, `ফলাফল চূড়ান্তকরণ বা সনদ ইস্যুকরণ অফলাইনে অনুমোদিত নয়।"`, `success`, `idempotent`, `message`, `data`, `conflict`, `conflictReason`

### 3.36 Payment Gateways & Webhooks (4 Endpoints)

#### `GET /api/v1/attendance`

- **Purpose:** Core institutional service for v1/attendance
- **Source File:** [`src/app/api/v1/attendance/route.ts`](file:///src/app/api/v1/attendance/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Query Parameters:** `date`, `page`, `limit`
- **Database Entities:** `attendance`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `403`, `500`
- **Response Payload Keys:** `error`, `success`, `data`, `pagination`, `page`, `limit`, `totalPages`

#### `GET /api/v1/finance/invoices`

- **Purpose:** Core institutional service for v1/finance/invoices
- **Source File:** [`src/app/api/v1/finance/invoices/route.ts`](file:///src/app/api/v1/finance/invoices/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Query Parameters:** `status`, `page`, `limit`
- **Database Entities:** `feeInvoice`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `403`, `500`
- **Response Payload Keys:** `error`, `success`, `data`, `pagination`, `page`, `limit`, `totalPages`

#### `GET /api/v1/students`

- **Purpose:** Core institutional service for v1/students
- **Source File:** [`src/app/api/v1/students/route.ts`](file:///src/app/api/v1/students/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Query Parameters:** `page`, `limit`, `classCode`
- **Database Entities:** `student`
- **Side Effects:** Read-only query (no side effects)
- **Status Codes:** `401`, `403`, `500`
- **Response Payload Keys:** `error`, `success`, `data`, `pagination`, `page`, `limit`, `totalPages`

#### `POST /api/v1/webhooks/inbound/[provider]`

- **Purpose:** Inbound webhook notification handler for external payment gateways and integrations
- **Source File:** [`src/app/api/v1/webhooks/inbound/[provider]/route.ts`](file:///src/app/api/v1/webhooks/inbound/[provider]/route.ts)
- **Access & Authorization:** Public | **Allowed Roles:** `PUBLIC`
- **Path Parameters:** `provider`
- **Request Body Fields:** `eventType`, `paymentId`, `idempotencyKey`, `transactionId`, `status`, `invoiceId`, `amount`, `trxID`
- **Database Entities:** `inboundWebhookEvent`, `deadLetterQueue`
- **Side Effects:** Persists new records to SQLite DB; Mutates existing records in SQLite DB; Upserts records into SQLite DB
- **Status Codes:** `400`, `401`, `500`
- **Response Payload Keys:** `error`, `success`, `isDuplicate`, `message`, `webhookId`, `domainResult`

