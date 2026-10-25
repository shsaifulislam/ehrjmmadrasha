# EHRJ MADRASHA ERP — MASTER DATA FLOW MAP
**Document Code:** `EHRJ-DATAFLOW-01`  
**Date:** October 18, 2026  
**Auditor & Lead Architect:** Principal Software Architect & Engineering Lead  
**Scope:** End-to-End Bidirectional Data Flow between Next.js Web ERP, Flutter Mobile Client, and SQLite Database (`prisma/dev.db`)  
**Core Architectural Law:** ONE AUTHORITATIVE BACKEND. NO CONFLICTING INDEPENDENT DATA STORES.

---

## 1. Unified Authoritative Data Flow Architecture

The EHRJ Madrasha ERP operates on a single authoritative database architecture. Both the Next.js web application and the Flutter mobile client communicate exclusively through authenticated REST endpoints provided by the Next.js API runtime.

```
┌─────────────────────────────────┐        ┌─────────────────────────────────┐
│     NEXT.JS WEB CLIENT          │        │      FLUTTER MOBILE CLIENT      │
│  - React 18 UI State            │        │  - Provider / StatefulWidget    │
│  - SWR / Server Components      │        │  - Local Encrypted Draft Cache  │
│  - HTTP-only Session Cookie     │        │  - Bearer JWT Authorization     │
└────────────────┬────────────────┘        └────────────────┬────────────────┘
                 │                                          │
                 │ JSON / Cookies                           │ JSON / Bearer Token
                 ▼                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       NEXT.JS UNIFIED API GATEWAY                           │
│                      (`src/app/api/*` - 525 Endpoints)                      │
│                                                                             │
│  1. Authentication Guard: `verifySession(request)`                          │
│     - Inspects Cookie `ehrj_session_token` OR `Authorization: Bearer <jwt>` │
│     - Resolves user identity, role, and active status                       │
│                                                                             │
│  2. Authorization & RBAC Guard:                                             │
│     - Validates role against required permissions (ADMIN, PRINCIPAL, etc.)  │
│     - Enforces Object-Level Access Control (IDOR prevention)                │
│                                                                             │
│  3. Input Validation & Digit Normalizer:                                    │
│     - Normalizes Bengali numerals (০-৯) to English digits (0-9)             │
│     - Strips malicious payloads / XSS sanitization                          │
│                                                                             │
│  4. Transaction Manager: `prisma.$transaction()`                            │
│     - Enforces atomic commits across related entities                       │
│     - Idempotent request handling via unique transaction keys               │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Prisma Client v5.22.0
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AUTHORITATIVE SQLITE DATABASE                            │
│                    `prisma/dev.db` (10,366,976 Bytes)                       │
│                        123 Models / 117 Populated                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Bidirectional Synchronization Lifecycles

### 2.1 Web-to-App Data Synchronization
When an authoritative record changes on the Next.js Web ERP (e.g., Principal approves a notice, or Accountant issues a fee invoice):
1. **Web Commit:** Next.js Server Action or API route executes `prisma.notice.create()` or `prisma.feeInvoice.create()`.
2. **Database Persistence:** The record is committed atomically to `prisma/dev.db`. An `AuditLog` entry is recorded.
3. **App Discovery (Pull-to-Refresh & Navigation):**
   - When the Flutter app user opens the screen or triggers a Pull-to-Refresh gesture, `ApiClient.get()` requests the latest data from `/api/notices` or `/api/portal/finance`.
   - The response is parsed into immutable Dart data models.
   - Stale cache entries in `LocalStorageService` are overwritten with the fresh server response.
4. **Instant UI Re-render:** The Flutter UI updates with zero data lag.

### 2.2 App-to-Web Data Synchronization
When an authorized mobile user modifies a record (e.g., Teacher marks attendance or Admin issues a gatepass):
1. **Mobile Mutation:** User confirms the action in the Flutter UI.
2. **Request Dispatch:** `ApiClient.post()` sends an authenticated HTTP POST payload with `Authorization: Bearer <token>` to `/api/teacher/attendance` or `/api/gatepass`.
3. **Backend Authorization & Validation:**
   - Server verifies session token and ensures user possesses the required role.
   - For teachers, server verifies active class assignment in `teacherAssignment`.
4. **Database Transaction:** The backend executes `prisma.$transaction()`, persisting attendance rows and updating daily class metrics.
5. **Server Confirmation:** HTTP 200/201 response returns the created record with server-generated ID and timestamp.
6. **Web Discovery:** When the Principal, Admin, or Guardian visits `/portal/attendance` or `/admin/gatepass` on the web, Next.js Server Components query `prisma.attendance` directly from `prisma/dev.db`, immediately reflecting the update made via mobile.

---

## 3. Offline Drafts & Auto-Sync Engine

For field operations with intermittent connectivity (e.g., teachers recording attendance in rural classrooms):

```mermaid
sequenceDiagram
    autonumber
    actor Teacher as Ustad (Mobile App)
    participant Provider as TeacherProvider
    participant LocalCache as LocalStorageService
    participant Sync as SyncProvider
    participant API as Next.js API Server
    participant DB as SQLite (dev.db)

    Teacher->>Provider: Tap "হাজিরা সংরক্ষণ করুন" (Save Attendance)
    alt Device is Offline (No Internet)
        Provider->>LocalCache: Save Draft as JSON (draft_attendance_class_date)
        Provider-->>Teacher: Show Amber Offline Badge: "ড্রাফট হিসেবে সংরক্ষিত হয়েছে"
        Note over Teacher, LocalCache: Draft is NOT official until synced
    else Device is Online
        Provider->>API: POST /api/teacher/attendance (Payload + Bearer Token)
        API->>DB: prisma.$transaction(commit attendance records)
        DB-->>API: Transaction Committed
        API-->>Provider: HTTP 200 { success: true, count: 25 }
        Provider->>LocalCache: Clear local draft
        Provider-->>Teacher: Show Green Success Toast: "হাজিরা সার্ভারে সংরক্ষিত হয়েছে"
    end

    Note over Sync: Background Connectivity Listener
    Sync->>Sync: Detects Internet Connection Restored
    Sync->>LocalCache: Query pending drafts
    Sync->>API: POST /api/teacher/attendance (Idempotent sync batch)
    API->>DB: Commit records
    API-->>Sync: HTTP 200 OK
    Sync->>LocalCache: Purge synchronized draft
    Sync-->>Teacher: Notify: "সকল ড্রাফট সার্ভারে সিঙ্ক সম্পন্ন হয়েছে"
```

### Critical Synchronization Guarantees:
- **No False Success:** The mobile client NEVER displays a green "Saved to ERP" badge for unsynchronized drafts. Offline drafts display an explicit Amber/Yellow "Saved Locally (Draft)" status.
- **Idempotent Retries:** Every attendance submission payload contains a unique compound key `classId_sectionId_date`. Re-submitting the same payload updates existing rows rather than creating duplicate records.
- **Stale Overwrite Protection:** The server checks `AttendanceLock` before allowing updates to past dates.

---

## 4. End-to-End Workflow Sequence Diagrams

### 4.1 Authentication & Multi-Role Session Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Web or Mobile)
    participant Client as Client UI
    participant AuthAPI as /api/auth/login
    participant DB as prisma/dev.db

    User->>Client: Enter Identifier (01845162664 / 01845162664 in Bengali) & Password
    Client->>AuthAPI: POST { identifier, password, role }
    AuthAPI->>AuthAPI: Normalize Bengali digits to English digits
    AuthAPI->>DB: prisma.user.findFirst({ where: { phone/email } })
    DB-->>AuthAPI: Return User + passwordHash
    AuthAPI->>AuthAPI: bcrypt.compare(password, passwordHash)
    
    alt Password Invalid
        AuthAPI->>DB: prisma.loginHistory.create({ status: "FAILED" })
        AuthAPI-->>Client: HTTP 401 "ভুল পাসওয়ার্ড বা ব্যবহারকারী আইডি"
    else Password Valid
        AuthAPI->>DB: prisma.session.create({ token, userId, expiresAt })
        AuthAPI->>DB: prisma.loginHistory.create({ status: "SUCCESS" })
        AuthAPI-->>Client: HTTP 200 { success: true, token, user } + Set-Cookie
        Client->>Client: Store Token (Preferences / Secure Storage)
        Client->>Client: Route to Role Dashboard (Admin/Teacher/Guardian/etc.)
    end
```

### 4.2 Campus Gatepass Issuance & QR Verification Flow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin / Staff (Mobile App)
    participant GatepassUI as AdminGatepassScreen
    participant API as /api/gatepass
    participant DB as prisma/dev.db
    actor GateKeeper as Gate Security (Web / Mobile Scanner)
    participant VerifyAPI as /api/verify/gatepass/[token]

    Admin->>GatepassUI: Fill Gatepass (Student Roll: 101, Reason: জরুরি ছুটি, Escort: আবদুর রহিম)
    GatepassUI->>API: POST /api/gatepass (Bearer Token)
    API->>API: Generate unguessable verification token UUID
    API->>DB: prisma.gatepass.create({ status: "APPROVED", qrToken })
    DB-->>API: Return Gatepass record
    API-->>GatepassUI: HTTP 201 Created
    GatepassUI-->>Admin: Display Digital Gatepass with Tamper-evident QR

    Note over GateKeeper: Student reaches campus exit gate
    GateKeeper->>GateKeeper: Scan QR Code with device camera
    GateKeeper->>VerifyAPI: GET /api/verify/gatepass/[token]
    VerifyAPI->>DB: prisma.gatepass.findUnique({ where: { qrToken } })
    DB-->>VerifyAPI: Return Gatepass + Student Details
    VerifyAPI-->>GateKeeper: HTTP 200 { valid: true, student: "মোহাম্মদ আব্দুল্লাহ", status: "APPROVED" }
    GateKeeper->>GateKeeper: Tap "প্রস্থান নিশ্চিত করুন" (Confirm Exit)
```

---

## 5. Security & Boundary Controls Across Data Flows

| Boundary | Control Mechanism | Implementation File | Verification Test |
| :--- | :--- | :--- | :--- |
| **Transport Layer** | HTTPS / TLS 1.3 in production; cleartext permitted only for local RFC1918 subnets | `network_security_config.xml` | Pixel 7 network security check |
| **Session Boundary** | JWT with 7-day expiration mapped to `Session` table; revoked immediately on `/api/auth/logout` | `src/app/api/auth/logout/route.ts` | Test #3 in `app_unit_test.dart` |
| **Object Authorization** | Guardian queries strictly restricted to `guardianId == session.userId` | `src/app/api/portal/children/route.ts` | IDOR isolation test |
| **Faculty Assignment** | Attendance submissions strictly restricted to `teacherAssignment` | `src/app/api/teacher/attendance/route.ts` | Faculty boundary test |
| **Input Sanitization** | Bengali digit normalizer; regex phone validation (`01[3-9]\d{8}`) | `src/app/api/auth/login/route.ts` | Tests #9-#12 in `app_unit_test.dart` |
| **Data Integrity** | Multi-table mutations wrapped in `prisma.$transaction()` | `src/app/api/admin/finance/*` | Transaction rollback test |

---

## 6. Data Flow Summary

The EHRJ Madrasha ERP data flow is unified, bidirectional, and authoritative:
- **Single Source of Truth:** `prisma/dev.db` is the sole persistence tier.
- **Consistent API Contracts:** 525 endpoints serve identical JSON data structures to both Next.js Web and Flutter Mobile.
- **Resilient Offline Handling:** Client-side drafts prevent data loss in the field without corrupting the authoritative server ledger.
