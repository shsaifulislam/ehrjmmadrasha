# EHRJ DIGITAL CAMPUS
## PHASE 7 — CERTIFICATE, DOCUMENT & STUDENT DOCUMENT FACTORY
### Production Architecture, Engine Specification & Verification Report

---

## 1. Executive Summary

- **Institution:** ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা (Eliotganj Hazi Rohmatollah Jamiria Madrasha, Est. 2021)
- **Location:** পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা, বাংলাদেশ
- **System:** EHRJ Digital Campus
- **Phase Completed:** Phase 7 — Certificate, Document & Student Document Factory
- **Baseline Cumulative Status:**
  - Phase 1 (Auth & RBAC): 39 / 39
  - Phase 2 (Academic Core): 42 / 42
  - Phase 3 (Admission): 63 / 63
  - Phase 4 (Attendance): 50 / 50
  - Phase 5 (Exams & Results): 55 / 55
  - Phase 6 (Finance & Fees): 56 / 56
  - **Phase 7 (Document Factory): 69 / 69**
  - **Integrated Total: 374 / 374 Automated Tests Passed (100% Pass Rate)**
- **Next.js Production Build:** 95 Routes compiled successfully (0 errors, 0 warnings)
- **Git Checkpoint:** `EHRJ-AI-2026-PHASE7`

---

## 2. Core Architecture & Design Principles

### Authoritative Database Principle
The system **never** generates an official certificate from manually typed or arbitrary user input. Certificates are synthesized strictly from authoritative, verified database entities:
- `Student` master record
- `Guardian` & `GuardianStudent` relations
- `AcademicSession`
- `JamatClass` (Dynamic Jamat) & `Section`
- `Enrollment` & `Roll`
- `ExamResult` & published exam marks (Phase 5)
- `AdmissionApplication` (Phase 3)
- `FeeInvoice` & `PaymentReceipt` (Phase 6)

### Historical Immutability Principle
When a certificate is issued, an immutable snapshot of all authoritative data at that exact point in time is recorded into `snapshotJson`. If a student's profile (name, phone, address) is updated later, previously issued certificates remain unaltered.
If a certificate requires changes, it follows the mandatory **REVOKE + REISSUE** lifecycle ($v1 \to v2$) with an immutable `AuditLog` trail.

### Privacy-Safe Public Verification
Every official document is assigned a cryptographically secure verification token (e.g. `EHRJ-VER-2026-XXXXX`) embedded in a high-density, scalable base64 QR code.
Scanning the QR code or visiting `/verify/document/[token]` exposes **only** public-safe information:
- Institution name & branding
- Document type & unique document number
- Safe student name & Jamat/Class
- Issue date, current status (`VALID` or `REVOKED`), and version
- **Strictly Omitted:** Guardian phone numbers, NID, birth registration certificates, private residential addresses, fee records, and internal administrative notes.

---

## 3. Database Schema Models (`prisma/schema.prisma`)

```prisma
model DocumentTemplate {
  id              String       @id @default(uuid())
  code            String       @unique // e.g. "STUDENT_ID", "STUDY_CERTIFICATE"
  nameBn          String       // বাংলা নাম
  nameEn          String       // English Name
  documentType    DocumentType // STUDENT_ID | STUDY_CERTIFICATE | CHARACTER_CERTIFICATE | TRANSFER_CERTIFICATE | TESTIMONIAL | ADMISSION_CONFIRMATION | OTHER
  headerHtml      String?
  bodyTemplateBn  String       // Template with {{student.nameBn}}, {{class.nameBn}}, etc.
  bodyTemplateEn  String?
  footerHtml      String?
  signaturesJson  String?      // Authorized signature titles/roles
  hasSeal         Boolean      @default(true)
  hasQrCode       Boolean      @default(true)
  isActive        Boolean      @default(true)
  version         Int          @default(1)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  certificates    Certificate[]
  requests        DocumentRequest[]
}

model DocumentRequest {
  id              String         @id @default(uuid())
  requestNumber   String         @unique // EHRJ-REQ-YYYY-XXXXX
  studentId       String
  student         Student        @relation(fields: [studentId], references: [id])
  guardianId      String?
  guardian        Guardian?      @relation(fields: [guardianId], references: [id])
  documentType    DocumentType
  templateId      String?
  template        DocumentTemplate? @relation(fields: [templateId], references: [id])
  purpose         String
  neededDate      DateTime?
  notes           String?
  status          DocRequestStatus @default(SUBMITTED) // SUBMITTED | UNDER_REVIEW | APPROVED | REJECTED | GENERATED | ISSUED | CANCELLED
  rejectionReason String?
  reviewedByUserId String?
  reviewedByUser  User?          @relation("DocReqReviewedBy", fields: [reviewedByUserId], references: [id])
  reviewedAt      DateTime?
  feeInvoiceId    String?        @unique
  feeInvoice      FeeInvoice?    @relation(fields: [feeInvoiceId], references: [id])
  certificateId   String?        @unique
  certificate     Certificate?   @relation("DocRequestCertificate", fields: [certificateId], references: [id])
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
}

model Certificate {
  id                String       @id @default(uuid())
  certificateNumber String       @unique // e.g. EHRJ-CHAR-2026-00001
  certificateType   DocumentType
  studentId         String
  student           Student      @relation(fields: [studentId], references: [id])
  sessionId         String?
  session           AcademicSession? @relation(fields: [sessionId], references: [id])
  requestId         String?      @unique
  request           DocumentRequest? @relation("DocRequestCertificate")
  templateId        String?
  template          DocumentTemplate? @relation(fields: [templateId], references: [id])
  version           Int          @default(1)
  reissuedFromId    String?
  reissuedFrom      Certificate? @relation("ReissueChain", fields: [reissuedFromId], references: [id])
  reissues          Certificate[] @relation("ReissueChain")
  status            DocStatus    @default(ISSUED) // DRAFT | GENERATED | ISSUED | REVOKED
  issueDate         DateTime     @default(now())
  issuedByUserId    String?
  issuedByUser      User?        @relation("CertIssuedBy", fields: [issuedByUserId], references: [id])
  revokedAt         DateTime?
  revokedByUserId   String?
  revokedByUser     User?        @relation("CertRevokedBy", fields: [revokedByUserId], references: [id])
  revokeReason      String?
  verificationToken String       @unique // e.g. EHRJ-VER-2026-XXXXX
  qrCodeUrl         String?      // Base64 Data URL or public verification URL
  snapshotJson      String?      // Frozen authoritative student, guardian & enrollment state
  fileUrl           String?
  isRevoked         Boolean      @default(false)
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
}
```

---

## 4. Supported Document Types

1. **Student ID Card (`STUDENT_ID`):**
   - Format: `EHRJ-ID-YYYY-XXXXX`
   - Content: Permanent Student ID, current session, Jamat/class, section, roll number, residential status, bilingual names, photo slot, and base64 QR code.
2. **Study / Enrollment Certificate (`STUDY_CERTIFICATE`):**
   - Format: `EHRJ-STUDY-YYYY-XXXXX`
   - Content: Official attestation of active enrollment in current academic year, class name, father/guardian name, roll number, and institution seal.
3. **Character Certificate (`CHARACTER_CERTIFICATE`):**
   - Format: `EHRJ-CHAR-YYYY-XXXXX`
   - Content: Attestation of good moral conduct, discipline, Islamic character, and attendance record.
4. **Transfer Certificate (`TRANSFER_CERTIFICATE`):**
   - Format: `EHRJ-TC-YYYY-XXXXX`
   - Content: Formal transfer slip specifying last session, Jamat passed/studied, reason for departure, conduct, and clearance.
5. **Testimonial (`TESTIMONIAL`):**
   - Format: `EHRJ-TESTI-YYYY-XXXXX`
   - Content: Comprehensive academic testimonial stating student's achievements and moral standing.
6. **Admission Confirmation Document (`ADMISSION_CONFIRMATION`):**
   - Format: `EHRJ-ADM-YYYY-XXXXX`
   - Content: Official slip confirming enrollment post-Phase 3 admission approval.
7. **Exam Result Marksheet (Integrated with Phase 5):**
   - Consumes published, frozen result snapshot from Phase 5 (`ExamResult`).
8. **Fee / Payment Receipt (Integrated with Phase 6):**
   - Consumes authoritative payment receipts (`PaymentReceipt`) from Phase 6.

---

## 5. Canonical Lifecycle Workflows

### 5.1 Guardian Request Workflow
```text
Guardian Portal (/portal/documents)
       ↓ Select Child & Document Type
Eligibility Validation (Active Enrollment, Fees)
       ↓ Submit Request
DocumentRequest Created (Status: SUBMITTED, EHRJ-REQ-YYYY-XXXXX)
       ↓
Admin Document Queue (/admin/documents/requests)
       ↓ Review & Check
Admin Approval (Status: APPROVED, Optional FeeInvoice Linkage)
       ↓ 1-Click Generate & Issue
Frozen Snapshot Captured & Base64 QR Code Minted
       ↓
Certificate Persisted (Status: ISSUED, EHRJ-DOC-YYYY-XXXXX)
       ↓
Guardian Notified & Instant Privacy-Safe Printable PDF Available
```

### 5.2 Direct Admin Generation Workflow
```text
Admin Document Hub (/admin/documents)
       ↓ Select Student & Document Type
Eligibility Pre-flight Check
       ↓
Live Preview with Authoritative DB Data
       ↓ Explicit Confirmation
Issue Document (Atomic DB Transaction)
       ↓
AuditLog Recorded (GENERATE_OFFICIAL_DOCUMENT)
```

### 5.3 Revoke and Reissue Workflow ($v1 \to v2$)
```text
Issued Certificate (Version 1, Status: ISSUED)
       ↓ Administrative Error or Correction Required
Revocation Request (/api/admin/documents/[id]/revoke)
       ↓ Mandatory Reason Required ("ডাটা সংশোধন")
Original Document Marked REVOKED (isRevoked = true)
Public QR Verification Immediately Reflects: "⚠ সনদপত্রটি বাতিল (REVOKED)"
       ↓ Reissue Request (/api/admin/documents/[id]/reissue)
New Certificate Generated:
  - Version: 2
  - reissuedFromId: [Original Certificate ID]
  - New Document Number: EHRJ-CHAR-2026-00002
  - New Cryptographic Verification Code: EHRJ-VER-2026-YYYYY
  - New Base64 QR Code
  - Fresh Authoritative Data Snapshot
Historical Chain Completely Preserved in Database & Audit Logs
```

---

## 6. Security & IDOR Verification

1. **Role-Based Access Control (RBAC):**
   - `ADMIN`: Full authority to manage templates, review requests, approve, generate, issue, revoke, and reissue documents.
   - `TEACHER`: Strictly blocked from Admin document endpoints and certificate issuance APIs (403 Forbidden).
   - `GUARDIAN`: Strictly isolated to linked children. Attempts to view or request documents for unlinked students are blocked (403 Forbidden).
   - `PUBLIC`: Only allowed access to `/verify/document/[token]` and `/api/verify/document/[token]`. Direct PDF downloads or database queries are inaccessible.
2. **Duplicate Request Idempotency Guard:**
   - Submitting duplicate pending requests for the same child and same document type is prevented with HTTP 409 Conflict.
3. **Double Revocation Guard:**
   - Attempting to revoke an already revoked document is rejected with clear error messaging.

---

## 7. Automated Test Suite Execution Evidence

All 7 project phases were verified consecutively against the production server with zero errors:

```text
=================================================================
  EHRJ DIGITAL CAMPUS - INTEGRATED SYSTEM REGRESSION REPORT
=================================================================
  Phase 1: Foundation, Auth & RBAC               39 / 39 PASSED
  Phase 2: Academic Core & Sessions              42 / 42 PASSED
  Phase 3: Admissions & Enrollment               63 / 63 PASSED
  Phase 4: Attendance & Timelines                50 / 50 PASSED
  Phase 5: Exams, Routine & Results              55 / 55 PASSED
  Phase 6: Finance, Invoices & Cashbook          56 / 56 PASSED
  Phase 7: Document Factory & Verification       69 / 69 PASSED
-----------------------------------------------------------------
  CUMULATIVE AUTOMATED SUITE:                   374 / 374 PASSED (100%)
  NEXT.JS PRODUCTION BUILD:                      95 ROUTES (0 ERRORS)
=================================================================
```

---

## 8. Git Checkpoint

- **Checkpoint Tag:** `EHRJ-AI-2026-PHASE7`
- **Commit Summary:** `feat(documents): implement phase 7 certificate and document factory [EHRJ-AI-2026-PHASE7]`
