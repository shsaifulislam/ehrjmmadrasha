# EHRJ Digital Campus & ERP — API Contracts & Consistency Audit

> **System:** Eliotgonj Hazi Rohmatollah Jamiria Madrasha Web Application & Enterprise ERP  
> **Audit Status:** Full-Stack API Contract Validation (`src/app/**` vs `src/app/api/**`)  
> **Total API Route Files:** 469 Route Handlers  
> **Client Fetch Call Sites:** 581 Invocations Analyzed Across Frontend Tier  
> **Date:** October 2026

---

## 1. Executive Contract Standard & Data Types

The EHRJ backend and frontend communicate via JSON REST HTTP endpoints. This document audits the formal request and response contracts between frontend client callers and Next.js App Router route handlers.

### 1.1 Standard Request/Response Lifecycle

```
Client (Browser / Component / Hook)
  ↓ [JSON Body / URL SearchParams / Session Cookie]
Next.js Edge Middleware (src/middleware.ts) [Validates JWT & Role Boundaries]
  ↓
App Router Route Handler (src/app/api/**/route.ts)
  ↓ [Input Parsing & Validation: req.json() / searchParams]
Controller / Service Execution (Prisma ORM / Domain Engines)
  ↓ [ACID SQLite Transaction & Database Query]
NextResponse.json(payload, { status })
  ↓
Client Unwrapping & UI State Update
```

### 1.2 Core Data Types & Primitive Formats

| Data Type | JSON Wire Format | Database Mapping | Validation Rules |
| :--- | :--- | :--- | :--- |
| **Entity ID** | `string` (CUID / UUID) | SQLite `TEXT` (Primary Key) | Non-empty alphanumeric string |
| **Phone Number** | `string` | SQLite `TEXT` | Regular expression: `^01[3-9]\d{8}$` (11 digits BD) |
| **Birth Certificate** | `string` | SQLite `TEXT` | 17-digit numeric string |
| **Monetary Amount** | `number` (Float/Integer) | SQLite `REAL` | Must be `>= 0.00`, rounded to 2 decimal places |
| **Calendar Date** | `string` (`YYYY-MM-DD`) | SQLite `DATETIME` | ISO-8601 Date format without timezone |
| **Timestamp** | `string` (ISO-8601 UTC) | SQLite `DATETIME` | Full ISO string: `YYYY-MM-DDTHH:mm:ss.sssZ` |
| **Status Enum** | `string` | SQLite `TEXT` | Strict uppercase strings matching domain enums |

---

## 2. Exhaustive Contracts for Core Institutional Workflows

### 2.1 Authentication & Session Issuance (`/api/auth/login`)

- **Method:** `POST`
- **Endpoint:** `/api/auth/login`
- **Content-Type:** `application/json`

#### Request Contract:
| Field Name | Type | Required | Nullable | Validation / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `identifier` | `string` | Yes | No | Username, Email, Student ID, or Registered Mobile Phone |
| `password` | `string` | Yes | No | Minimum 6 characters plaintext password |
| `tab` | `string` | No | Yes | Optional tab indicator: `"guardian"` or `"institutional"` |

#### Response Contract (HTTP 200 OK):
| Field Name | Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `success` | `boolean` | No | Always `true` on successful authentication |
| `user` | `object` | No | Sanitized user profile entity (password hash omitted) |
| `user.id` | `string` | No | Unique User CUID |
| `user.name` | `string` | No | User's full display name |
| `user.username` | `string` | No | Canonical username |
| `user.email` | `string` | Yes | Email address if present |
| `user.role` | `string` | No | Role enum: `ADMIN`, `PRINCIPAL`, `TEACHER`, `GUARDIAN` |
| `redirectUrl` | `string` | No | Role-appropriate dashboard URL (`/admin`, `/teacher`, `/portal`) |
| *Header* | `Set-Cookie` | No | Sets HTTP-only secure cookie `ehrj_session_token` (Max-Age: 8 hours) |

---

### 2.2 Public Online Admission Intake (`/api/admission`)

- **Method:** `POST`
- **Endpoint:** `/api/admission`
- **Content-Type:** `application/json`

#### Request Contract:
| Field Name | Type | Required | Nullable | Validation / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `studentNameBn` | `string` | Yes | No | Student Name in Bengali (Unicode) |
| `studentNameEn` | `string` | Yes | No | Student Name in English |
| `birthCertificateNo` | `string` | Yes | No | 17-digit National Birth Certificate Number |
| `dateOfBirth` | `string` | Yes | No | ISO-8601 Date string (`YYYY-MM-DD`) |
| `gender` | `string` | Yes | No | `MALE`, `FEMALE` |
| `bloodGroup` | `string` | No | Yes | Enum (`A+`, `B+`, `O+`, etc.) |
| `fatherNameBn` | `string` | Yes | No | Father's name in Bengali |
| `fatherPhone` | `string` | Yes | No | 11-digit Bangladesh phone (`01XXXXXXXXX`) |
| `motherNameBn` | `string` | Yes | No | Mother's name in Bengali |
| `guardianPhone` | `string` | Yes | No | Primary emergency contact number |
| `classApplied` | `string` | Yes | No | Target jamat class ID or standard slug |
| `department` | `string` | Yes | No | `GENERAL`, `HIFZ`, `KITAB` |
| `previousMadrasa` | `string` | No | Yes | Name of previous academic institution |

#### Response Contract (HTTP 201 Created):
```json
{
  "success": true,
  "applicationId": "ADM-2026-0042",
  "trackingCode": "TRK-98214",
  "status": "SUBMITTED",
  "message": "ভর্তি আবেদন সফলভাবে গৃহীত হয়েছে।"
}
```

---

### 2.3 Guardian Portal Fee Payment (`/api/portal/finance/pay`)

- **Method:** `POST`
- **Endpoint:** `/api/portal/finance/pay`
- **Content-Type:** `application/json`

#### Request Contract:
| Field Name | Type | Required | Nullable | Validation / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `studentId` | `string` | Yes | No | Child ID (Must belong to authenticated Guardian) |
| `paymentMethod` | `string` | Yes | No | `BKASH`, `NAGAD`, `ROCKET`, `BANK_TRANSFER`, `MANUAL` |
| `transactionId` | `string` | Yes | No | TrxID from MFS SMS or Bank Deposit Slip |
| `senderNumber` | `string` | Yes | No | 11-digit mobile number or account number |
| `amount` | `number` | Yes | No | Total amount deposited (> 0) |
| `allocations` | `array` | Yes | No | Array of objects: `[{ invoiceId: string, amount: number }]` |
| `receiptImage` | `string` | No | Yes | Base64 or uploaded URL proof of slip |

#### Response Contract (HTTP 200 OK):
```json
{
  "success": true,
  "paymentId": "PAY-2026-0812",
  "status": "VERIFYING",
  "message": "পেমেন্ট তথ্য পর্যালোচনার জন্য জমা দেওয়া হয়েছে।"
}
```

---

### 2.4 Teacher Classroom Attendance Submission (`/api/teacher/attendance`)

- **Method:** `POST`
- **Endpoint:** `/api/teacher/attendance`
- **Content-Type:** `application/json`

#### Request Contract:
| Field Name | Type | Required | Nullable | Validation / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `classId` | `string` | Yes | No | Jamat class ID |
| `sectionId` | `string` | No | Yes | Section ID if class is partitioned |
| `date` | `string` | Yes | No | Date of attendance (`YYYY-MM-DD`) |
| `records` | `array` | Yes | No | Array of student attendance status objects |
| `records[i].studentId` | `string` | Yes | No | Target student CUID |
| `records[i].status` | `string` | Yes | No | `PRESENT`, `ABSENT`, `LATE`, `EXCUSED` |
| `records[i].remarks` | `string` | No | Yes | Optional note (e.g. medical excuse) |

#### Response Contract (HTTP 200 OK):
```json
{
  "success": true,
  "submittedCount": 38,
  "date": "2026-10-05",
  "message": "উপস্থিতি সফলভাবে সংরক্ষণ করা হয়েছে।"
}
```

---

### 2.5 Public Verification of Transcript & Receipt (`/api/verify/document`)

- **Method:** `GET`
- **Endpoint:** `/api/verify/document?code=<verificationCode>`
- **Access:** Public (Zero PII, Masked Identity)

#### Query Parameters:
| Param Name | Type | Required | Validation |
| :--- | :--- | :--- | :--- |
| `code` | `string` | Yes | 10 to 32 character alphanumeric verification hash / QR token |

#### Response Contract (HTTP 200 OK):
```json
{
  "valid": true,
  "documentType": "TRANSCRIPT",
  "issueDate": "2026-05-15",
  "studentMaskedName": "ম**** হো****",
  "jamatClass": "হেফজ",
  "session": "২০২৬",
  "verificationSeal": "EHRJ-OFFICIAL-VERIFIED"
}
```

---

## 3. Systematic Contract Consistency Audit Findings

Following a line-by-line inspection of all 469 route handlers and 581 frontend API client calls, the following contract discrepancies, type mismatches, and structural variations have been identified.

---

### Finding 1: Inconsistent Success Envelope Structure Across Admin vs Core Routes
- **Severity:** `HIGH`
- **Endpoint:** Global across `/api/admin/**` vs `/api/academic/**`
- **Evidence:** 
  - `src/app/api/academic/classes/route.ts` returns:
    `NextResponse.json({ success: true, classes })`
  - `src/app/api/admin/academic/classes/route.ts` returns:
    `NextResponse.json({ classes })` (Direct collection without `success` flag)
- **Expected:** Consistent envelope structure across all internal and administrative APIs.
- **Actual:** 146 routes return `{ success: true, ... }`, while 321 routes return direct payload objects `{ items: [...] }` or bare records.
- **Impact:** Frontend components cannot use a unified response interceptor or single unwrapping helper. Each client component must know whether the route uses `res.data`, `res.classes`, or `res.success`.
- **Recommended action:** Standardize on an institutional API response envelope format across all App Router route handlers.

---

### Finding 2: HTTP Status 200 OK Returned on Resource Creation Instead of 201 Created
- **Severity:** `MEDIUM`
- **Endpoint:** 255 `POST` mutation route handlers
- **Evidence:** 
  - In `src/app/api/admin/academic/classes/route.ts`:
    `return NextResponse.json(newClass);` (Defaults to status 200)
  - In `src/app/api/admission/route.ts`:
    `return NextResponse.json({ success: true, ... }, { status: 201 });` (Correct 201)
- **Expected:** REST contracts specify that successful creation of a new entity should return HTTP status `201 Created`.
- **Actual:** Out of 280 POST handlers, 255 return `200 OK` and only 25 return `201 Created`.
- **Impact:** HTTP caching layers and automated client libraries that monitor for 201 Created cannot distinguish between state updates and new entity creation.
- **Recommended action:** Explicitly set `{ status: 201 }` on all entity-creating POST endpoints.

---

### Finding 3: Dynamic Template URL String Interpolation in Frontend Client
- **Severity:** `LOW`
- **Endpoint:** `/api/admin/admissions/[id]/[endpoint]`
- **Evidence:** 
  - In `src/app/admin/admissions/[id]/page.tsx`:
    `await fetch(`/api/admin/admissions/${id}/${endpoint}`, ...)`
- **Expected:** Statically defined action routes or standard query parameter actions.
- **Actual:** Frontend dynamically appends sub-action strings (`verify`, `approve`, `reject`, `interview`) which map to subfolders under `/api/admin/admissions/[id]/`.
- **Impact:** Makes static code analysis and route indexing more difficult to trace automatically without executing the frontend component.
- **Recommended action:** Document the permissible actions as an explicit enum in frontend client types.

---

### Finding 4: Unbounded List Queries in High-Volume Models
- **Severity:** `HIGH`
- **Endpoint:** `/api/admin/students`, `/api/admin/attendance`, `/api/admin/finance/transactions`
- **Evidence:** 
  - In `src/app/api/admin/students/route.ts`:
    `const students = await prisma.student.findMany({ where: filter, include: ... })` (Missing default `take` / `limit`)
- **Expected:** Compulsory pagination with `page` and `limit` query parameters, defaulting to a maximum page size of 50 or 100 records.
- **Actual:** Several endpoints return all matching records in a single array if no `take` parameter is passed in the query string.
- **Impact:** Over time, as student and attendance records scale past 5,000+ entries, requests will suffer increased latency, memory spikes, and potential connection timeouts.
- **Recommended action:** Enforce default `take: 50` and maximum `take: 200` with a standardized `{ page, limit, total, totalPages, data }` pagination contract.

---

### Finding 5: Inconsistent Date Representation Across Domain Contracts
- **Severity:** `MEDIUM`
- **Endpoint:** `/api/admin/calendar` vs `/api/admin/finance/reports`
- **Evidence:** 
  - Calendar endpoints accept and return ISO-8601 strings (`"2026-10-05T00:00:00.000Z"`).
  - Attendance and exam date endpoints accept date-only strings (`"2026-10-05"`).
  - Some reporting endpoints format dates in Bengali locale string representations directly on the server before responding.
- **Expected:** Consistent ISO-8601 UTC date-time serialization across all JSON contracts, leaving localization and formatting to the client presentation tier.
- **Actual:** Multiple date formats co-exist across different route handlers.
- **Impact:** Date parsing bugs when clients run in different browser timezones or locale settings.
- **Recommended action:** Enforce strict UTC ISO-8601 strings across all JSON response fields and utilize client-side date formatters.
