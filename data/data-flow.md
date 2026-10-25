# Data Flow

## 1. Overview

The **EHRJ Digital Campus & ERP** is built on the **Next.js 14 App Router** fullstack framework. Data flows seamlessly from user interfaces (Server and Client Components) through authenticated API route handlers, domain service engines, and the Prisma Object-Relational Mapping (ORM) layer, ultimately persisting into an ACID-compliant **SQLite 3 database** operating in **Write-Ahead Logging (WAL)** mode.

The application enforces a **unidirectional, secure data pipeline**:
- Every client-initiated state mutation passes through server-side authentication (`getSessionUser`).
- Role-Based Access Control (RBAC) and object-level relational ownership boundaries (e.g., `GuardianStudent`, `TeacherAssignment`) are checked *before* any database query or mutation executes.
- High-stakes financial and academic operations are wrapped in atomic database transactions (`prisma.$transaction`), guaranteeing that multi-table state transitions either commit completely or roll back without leaving partial states.

---

## 2. System-Level Data Flow

The following Mermaid diagram traces the end-to-end movement of data across the client, proxy, application, domain services, database, and external integrations.

```mermaid
flowchart TD
    subgraph ClientLayer ["1. Client & Presentation Layer"]
        A1[Web Browser / Mobile PWA]
        A2[Guardian / Student Portal UI]
        A3[Teacher Workplace UI]
        A4[Admin & Principal Cockpit UI]
        A5[Public Website & Admission Form]
    end

    subgraph NetworkProxy ["2. Network & Proxy Layer"]
        B1[Nginx Reverse Proxy / SSL Termination]
        B2[Production Security Headers & Rate Limiter]
    end

    subgraph AppRouter ["3. Next.js 14 Application Server (Node.js)"]
        C1[Next.js App Router Middleware]
        C2[React Server Components / SSR Pages]
        C3[API Route Handlers - /api/**]
        C4[Auth Guard - getSessionUser]
    end

    subgraph DomainEngines ["4. Domain Services & Business Logic"]
        D1[Fee & Financial Engine - feeCalculationService.ts]
        D2[Payment Gateway Adapter - Bkash / Nagad]
        D3[Qawmi Examination & Grading Engine]
        D4[Attendance & Routine Verification Engine]
        D5[Document & Certificate Factory - documentFactory.ts]
        D6[Operational Health & Backup Engine - operationsEngine.ts]
        D7[Notification Outbox & Event Bus - eventBus.ts]
    end

    subgraph DataAccess ["5. Persistence & Database Layer"]
        E1[Prisma ORM Client - Parameterized Queries]
        E2[Database Transactions - prisma.$transaction]
        E3[(SQLite 3 Database Engine - prisma/dev.db)]
        E4[WAL Journal - dev.db-wal & dev.db-shm]
        E5[Local Filesystem Storage - public/uploads/]
        E6[Backup Snapshot Directory - backups/]
    end

    subgraph ExternalServices ["6. External Service Providers"]
        F1[Gmail SMTP - nodemailer]
        F2[bKash Payment Gateway - Sandbox / Production]
        F3[Nagad Payment Gateway - Sandbox / Production]
    end

    %% Flow connections
    A1 & A2 & A3 & A4 & A5 -->|HTTPS Requests| B1
    B1 --> B2
    B2 --> C1
    C1 --> C2 & C3
    C3 --> C4
    C4 -->|Authorized Context| DomainEngines
    DomainEngines -->|Prisma Operations| E1
    E1 --> E2
    E2 --> E3
    E3 <--> E4
    D5 -->|Save Attachments| E5
    D6 -->|Create Snapshots| E6
    D2 <-->|API Calls / Callbacks| F2 & F3
    D7 -->|Dispatch Emails| F1

    %% Response cycle
    E3 -->|Queried Records| E1
    E1 -->|Typed Models| DomainEngines
    DomainEngines -->|Structured DTOs| C3
    C3 -->|JSON Response| A1 & A2 & A3 & A4 & A5
```

---

## 3. Authentication Flow

Authentication is managed via JSON Web Tokens (JWT) signed with the HMAC-SHA256 algorithm and stored in an `HttpOnly`, `SameSite=Lax` session cookie.

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Guardian / Teacher / Admin
    participant UI as Login Page (/login)
    participant AuthAPI as POST /api/auth/login
    participant DB as SQLite (User, Session, LoginHistory)
    participant Browser as Browser Storage / Cookies

    User->>UI: Enter email/username and password
    UI->>AuthAPI: POST { email, password }
    AuthAPI->>DB: Find User by email or username
    alt User not found
        AuthAPI->>DB: Log failed login in LoginHistory
        AuthAPI-->>UI: Return HTTP 401 (Invalid Credentials)
    else User exists
        AuthAPI->>AuthAPI: bcrypt.compare(password, user.passwordHash)
        alt Password invalid
            AuthAPI->>DB: Log failed login in LoginHistory
            AuthAPI-->>UI: Return HTTP 401 (Invalid Credentials)
        else Password valid
            AuthAPI->>DB: Log successful attempt in LoginHistory
            AuthAPI->>AuthAPI: Sign JWT with claims (userId, role, jti, exp)
            AuthAPI->>DB: Insert row in Session table (token, expiresAt)
            AuthAPI-->>Browser: Set-Cookie: ehrj_session_token=... (HttpOnly, Secure)
            AuthAPI-->>UI: Return HTTP 200 { user, redirectUrl }
            UI->>User: Redirect to dashboard based on role
        end
    end
```

### Role-Based Redirection Target:
- `ADMIN`: Redirects to `/admin` (Executive administrative dashboard).
- `PRINCIPAL`: Redirects to `/principal` (Governance and policy cockpit).
- `TEACHER`: Redirects to `/teacher` (Assigned classes, attendance, marks).
- `GUARDIAN`: Redirects to `/portal` (Linked children, fee invoices, results).

---

## 4. Create Data Flow

### Example A: Online Student Admission Application

```mermaid
sequenceDiagram
    autonumber
    actor Applicant as Prospective Student / Guardian
    participant AdmissionUI as /admission Form
    participant API as POST /api/admission
    participant DB as SQLite (Application, Student, Guardian, Enrollment)
    actor Admin as Madrasa Administrator

    Applicant->>AdmissionUI: Fill admission form details
    AdmissionUI->>API: POST /api/admission { studentNameBn, fatherName, classId, ... }
    API->>API: Validate input schemas (Zod / TypeScript)
    API->>API: Generate sequential applicationNumber (EHRJ-ADM-YYYY-XXXX)
    API->>DB: Insert into Application (status = "SUBMITTED")
    API-->>AdmissionUI: Return HTTP 201 { applicationNumber, trackingCode }

    Note over Admin,DB: Formal Administrative Review & Approval
    Admin->>API: POST /api/admin/admissions/[id]/approve
    API->>DB: BEGIN TRANSACTION (prisma.$transaction)
    API->>DB: Update Application (status = "APPROVED")
    API->>DB: Insert Student (studentIdNumber, demographics)
    API->>DB: Upsert Guardian & insert GuardianStudent
    API->>DB: Insert Enrollment for current AcademicSession
    API->>DB: Insert initial FeeInvoice with InvoiceItem
    API->>DB: Insert AuditLog record
    API->>DB: COMMIT TRANSACTION
    API-->>Admin: Return HTTP 200 (Enrolled Successfully)
```

### Example B: Manual Online Fee Payment Submission
1. Guardian selects unpaid invoices in `/portal/finance` and inputs a mobile money TrxID (e.g. bKash/Nagad).
2. Client sends `POST /api/portal/finance/pay` with `allocations: [{ invoiceId, amount }]` and `transactionId`.
3. The server queries `GuardianStudent` to verify that the invoices belong to the logged-in guardian's ward (IDOR defense).
4. Server validates that the transaction ID has not been previously used (`paymentReceipt.findFirst({ where: { transactionId } })`).
5. **Core Invariant:** The payment record is inserted into `PaymentReceipt` with status `PENDING_VERIFICATION`. The invoice's `dueAmount` and `paidAmount` remain untouched until the institutional cashier reconciles the bank statement.

---

## 5. Read Data Flow

### Example: Guardian Financial Ledger Query (`/api/portal/finance`)

```mermaid
sequenceDiagram
    autonumber
    actor Guardian as Logged-in Guardian
    participant Portal as /portal/finance UI
    participant API as GET /api/portal/finance?studentId=...
    participant Auth as getSessionUser()
    participant DB as SQLite Database

    Guardian->>Portal: Navigate to Finance tab
    Portal->>API: GET /api/portal/finance?studentId=STU_UUID
    API->>Auth: Verify JWT cookie & extract userId
    alt User is not GUARDIAN
        API-->>Portal: HTTP 403 Forbidden
    else User is GUARDIAN
        API->>DB: Query Guardian record for authenticated userId
        API->>DB: Check GuardianStudent (guardianId = GUA_UUID, studentId = STU_UUID)
        alt Student not linked to Guardian (IDOR attempt)
            API-->>Portal: HTTP 403 Forbidden ("অননুমোদিত অ্যাক্সেস")
        else Student verified
            API->>DB: Fetch FeeInvoice (where studentId = STU_UUID, include items, payments, refunds)
            API->>API: Aggregate totalBilled, totalPaid, totalDue, totalRefunded
            API-->>Portal: Return HTTP 200 { invoices, summaryStats }
            Portal->>Guardian: Render fee statement & pay buttons
        end
    end
```

---

## 6. Update Data Flow

### Example: Teacher Submitting Class Attendance (`/api/teacher/attendance`)
1. Teacher selects Jamat, Section, and Date on `/teacher/attendance`.
2. Form submits `POST /api/teacher/attendance` with attendance status (`PRESENT`, `ABSENT`, `LATE`, `EXCUSED`) for each enrolled student.
3. **Teacher Scope Guard:** Server checks `verifyTeacherClassAssignment(userId, sessionId, classId, sectionId)`. If the teacher is not assigned to this class, the request is rejected with **HTTP 403 Forbidden**.
4. **Attendance Lock Guard:** Server checks if the date is beyond the editable lockout window in `AttendanceLock`. If locked and user is not Admin/Principal, update is blocked.
5. Server opens `prisma.$transaction`:
   - Iterates through students and upserts records in `Attendance`.
   - Records an `AuditLog` entry: `action = "TEACHER_ATTENDANCE_RECORDED"`.
6. Transaction commits and returns HTTP 200 with recorded count.

---

## 7. Delete / Lifecycle Transition Flow

In accordance with institutional compliance and Shariah auditing requirements, the EHRJ ERP avoids destructive hard deletions for operational records. Instead, it utilizes **explicit lifecycle status transitions**:

| Entity | "Deletion" Method | Resulting State | Historical Behavior |
| :--- | :--- | :--- | :--- |
| **Certificate** | Revocation | `isRevoked = true`, `status = "REVOKED"` | Verification URL returns `verified: false` and shows revocation reason. Historical row preserved. |
| **Fee Invoice** | Cancellation / Waiver | `status = "CANCELLED"` or `"WAIVED"` | Balance zeroed out; preserved in student financial ledger for auditing. |
| **Student** | Inactivation / Transfer | `status = "TRANSFERRED"` or `"INACTIVE"` | Historical enrollment, results, and fee transactions remain completely intact. |
| **Session** | User Logout | Hard deletion from `Session` table | Physically revokes JWT token; forces re-authentication. |

---

## 8. External Services Data Flow

### 1. Gmail SMTP Integration
- **Purpose:** Dispatching payment confirmation receipts, password reset links, and institutional notices.
- **Protocol:** TLS connection over port 587/465 to `smtp.gmail.com` via `nodemailer`.
- **Flow:** Domain service → `nodemailer.sendMail()` → Gmail SMTP Server → Recipient Inbox.
- **Fallback:** If SMTP fails, the notification is captured in `NotificationOutbox` with `status = "FAILED"` for automatic retry.

### 2. Payment Gateway Integrations (bKash & Nagad)
- **Initiate Flow:**
  - Guardian clicks "Pay Online" → `PaymentIntentService.createIntent()` creates a `PaymentIntent` record in `PENDING` state.
  - Calls bKash Tokenized Checkout API (`createPayment`) using credentials in environment variables.
  - Returns gateway payment URL to client for redirection.
- **Finalize / Callback Flow:**
  - Payer enters PIN on official gateway page.
  - Gateway redirects back to `/api/portal/finance/gateway/callback`.
  - Server invokes server-to-server `executePayment` API to authoritatively confirm settlement.
  - On gateway approval, `prisma.$transaction` updates `PaymentReceipt` to `SUCCESSFUL`, credits the designated `CashFund`, and decrements `FeeInvoice.dueAmount`.

---

## 9. File & Document Storage Flow

```mermaid
flowchart LR
    A[Client File Input] -->|Multipart Form POST| B[Next.js API Handler]
    B -->|Generate UUID Filename| C[Server Local Storage: public/uploads/]
    B -->|Save Relative Path| D[(SQLite Database)]
    D -->|Return URL in JSON| E[React UI Component]
    E -->|Fetch Asset| F[Nginx / Next.js Static Asset Server]
    F -->|Stream File| A
```

1. Files uploaded (e.g. Student photo, NID document, transfer certificate) are parsed in API handlers.
2. A sanitized filename with a cryptographic UUID is generated (e.g. `doc_1791194338872_a8b9c0.pdf`).
3. File is stored in `public/uploads/`.
4. The database stores the web-accessible URI in fields such as `Student.photoUrl` or `StudentDocument.fileUrl`.
5. Static delivery is served directly by the web server with caching headers.

---

## 10. Realtime & Background Processing Flow

### Cron & Outbox Processing Engine
Since SQLite cannot host background daemon threads, asynchronous jobs are handled through a **Transactional Outbox & Scheduled Cron Pattern**:

```mermaid
sequenceDiagram
    autonumber
    participant App as Application Event
    participant Outbox as SQLite (NotificationOutbox)
    participant Cron as Cron Trigger (/api/admin/operations/cron)
    participant Worker as executeMasterCronRegistry()
    participant Mail as SMTP Service

    App->>Outbox: Insert event with idempotencyKey (status = "PENDING")
    Note over Cron,Worker: Periodic trigger via PM2 or External Cron
    Cron->>Worker: Trigger with Authorization: Bearer <CRON_SECRET>
    Worker->>Outbox: Fetch PENDING outbox messages (batch of 50)
    loop For each message
        Worker->>Mail: Send email / notification
        alt Success
            Worker->>Outbox: Update status = "SENT", sentAt = now()
        else Failure
            Worker->>Outbox: Increment retryCount, set error message
        end
    end
    Worker-->>Cron: Return JSON execution report
```

---

## 11. Security Boundaries

Security is enforced at 4 distinct architectural perimeters:
1. **Network Perimeter:** Nginx terminates TLS; enforces rate limiting on `/api/auth/*` and `/api/portal/finance/*`.
2. **Session Perimeter:** `getSessionUser()` decrypts and verifies JWT against the database session store, blocking unauthenticated traffic with HTTP 401.
3. **Role Perimeter:** API route guards inspect `user.role` against permitted roles (e.g., only `ADMIN` can access `/api/admin/*`).
4. **Data Ownership Perimeter:** Relational filtering ensures users cannot access or mutate unauthorized peer records (IDOR protection).

---

## 12. Important Data Transformations

1. **Qawmi Grade Thresholds:**
   - Evaluated in `src/lib/gradingEngine.ts`:
     - $ge 80.00%$ $ightarrow$ **Mumtaz (মুমতাজ)**
     - $70.00% - 79.99%$ $ightarrow$ **Jayyid Jiddan (জায়্যিদ জিদ্দান)**
     - $60.00% - 69.99%$ $ightarrow$ **Jayyid (জায়্যিদ)**
     - $50.00% - 59.99%$ $ightarrow$ **Maqbul (মাকবুল)**
     - $< 50.00%$ or mandatory subject failure $ightarrow$ **Rasib (রাসিব)**
2. **Monetary Precision:** All currency calculations are normalized using `Math.round(amount * 100) / 100` to eliminate IEEE 754 floating-point rounding errors.
3. **Certificate Snapshot Freezing:** When a certificate is issued, student name, father name, jamat, roll, and session are serialized into an immutable JSON string (`snapshotJson`), shielding historical credentials from subsequent profile edits.

---

## 13. Unknown / Unverified Flows

1. **Persistent WebSocket Streams:** Live client-to-server WebSocket bidirectional messaging is not implemented; client interfaces rely on polling and standard HTTP request/response lifecycles.
2. **Offsite Cloud Storage Synchronization:** Automatic background synchronization of files in `public/uploads/` or `backups/` to cloud object storage (e.g. AWS S3, Cloudflare R2) is not currently active in deployment scripts.
