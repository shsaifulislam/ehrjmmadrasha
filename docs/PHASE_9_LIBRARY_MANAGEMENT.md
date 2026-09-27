# EHRJ MADRASHA DIGITAL CAMPUS & ERP
## PHASE 9 — LIBRARY MANAGEMENT & E-LIBRARY ENGINE
### Master Production Architecture & Verification Documentation

---

### 1. OVERVIEW & INSTITUTIONAL CONTEXT

- **Institution (বাংলা):** ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
- **Institution (English):** Eliotganj Hazi Rohmatollah Jamiria Madrasha
- **Institution (العربية):** الجامعة الإسلامية رحمة الله إليوت غنج
- **Established:** 2021
- **Location:** পূর্ব লক্ষ্মীপুর, ইলিয়টগঞ্জ, দাউদকান্দি, কুমিল্লা, বাংলাদেশ
- **Founder & Muhtamim:** মাওলানা মহা. আবুল কালাম সরকার

The **Library Management & E-Library Engine** (Phase 9) provides a production-grade, concurrency-safe, and privacy-first circulation and cataloging infrastructure for the central institutional library (দারুল কুতুব).

Phase 9 seamlessly integrates with existing production baselines:
- **RBAC & Auth (Phase 1):** Zero additional roles created (managed strictly under existing `ADMIN`, `PRINCIPAL`, `TEACHER`, and `GUARDIAN`).
- **Student & Academic Core (Phase 2):** Student identities and Jamat context directly linked to library memberships.
- **Finance Engine (Phase 6):** All overdue fines, lost book replacement charges, and damage liabilities create canonical `FeeInvoice` records under the `LIBRARY_FINE` category. Direct cash balance mutations are strictly forbidden.
- **Communication Engine (Phase 8):** Multi-channel in-app and email dispatch for issue, due soon, overdue alert, return, fine assessment, and loss notifications.
- **Tamper-Proof Verification (Phase 7):** Physical copies feature unique Accession Numbers, Barcodes, and Cryptographic QR Tokens resolving to privacy-safe public verification endpoints.

---

### 2. CORE CIRCULATION ARCHITECTURE

```text
       ┌────────────────────────────────────────────────────────┐
       │             ADMIN LIBRARY OPERATIONS COCKPIT           │
       │              (src/app/admin/library/page.tsx)          │
       └───────────┬────────────────────────────────────────────┘
                   │
                   ▼
       ┌────────────────────────────────────────────────────────┐
       │             LIBRARY CIRCULATION & DOMAIN ENGINE        │
       │              (src/lib/libraryEngine.ts)                │
       └─────┬──────────────────┬──────────────────┬────────────┘
             │                  │                  │
             ▼                  ▼                  ▼
    [ Atomic Issue ]    [ Idempotent Return ] [ Renewal Engine ]
     • Lock copy status  • Calculate overdue   • Check rule limit
     • Concurrency guard • Compute daily fine  • Extend due date
     • Sequence Issue #  • Phase 6 Invoice     • Audit log trail
             │                  │                  │
             └──────────────────┼──────────────────┘
                                │
                                ▼
         ┌──────────────────────────────────────────────┐
         │             INTEGRATION ENGINES              │
         ├──────────────────────┬───────────────────────┤
         │ Phase 6 Finance      │ Phase 8 Communication │
         │ • FeeInvoice (Fine)  │ • Portal Notification │
         │ • Fund integration   │ • Institutional Email │
         │ • Payment receipts   │ • Idempotency Keys    │
         └──────────────────────┴───────────────────────┘
```

---

### 3. DATABASE SCHEMA & MODELS

Implemented in `prisma/schema.prisma`:

1. **`LibraryCategory`**: Hierarchical categories (`কুরআন`, `হাদীস`, `তাফসীর`, `ফিকহ`, `আকীদাহ`, `আরবি`, `বাংলা`, `ইংরেজি`, `সাহিত্য`, `ইতিহাস`, `শিক্ষা`, `অন্যান্য`) with dual language names and sort order.
2. **`LibraryAuthor`**: Authors with Bangla, English, and Arabic typography support and biography.
3. **`LibraryPublisher`**: Publishers with contact, address, and notes.
4. **`LibraryBook`**: Master catalog entity with titles, subtitle, edition, publication year, optional ISBN (preserving madrasa heritage books), subject, shelf location, cover image, and future-ready digital fields (`isDigital`, `digitalUrl`, `digitalType`, `accessRestricted`).
5. **`LibraryBookCopy`**: Individual physical copies with unique sequential **Accession Numbers** (`EHRJ-LIB-YYYY-XXXXXX`), unique barcodes, and cryptographic QR tokens (`qrToken`). Statuses: `AVAILABLE`, `ISSUED`, `LOST`, `DAMAGED`, `REPAIR`, `REMOVED`.
6. **`LibraryMember`**: Member records for Students (`studentId`) and Teachers (`userId`), with unique sequential Member Numbers (`EHRJ-LIB-M-YYYY-XXXX`). Compound unique indexes guarantee single membership per profile.
7. **`LibraryRule`**: Dynamic database-backed circulation policies by member type: `maxBooks`, `loanDays`, `renewalLimit`, `finePerDay`, `graceDays`, `lostChargeMultiplier`, `damagedChargeDefault`.
8. **`LibraryIssue`**: Circulation issue transactions with unique sequence (`EHRJ-ISS-YYYY-XXXXXX`), timestamps, calculated due dates, renewal counter, overdue tracker, and foreign key to Phase 6 `FeeInvoice`.
9. **`LibraryRenewal`**: Historical renewal audit trail recording previous and new due dates, timestamp, and administrator identity.
10. **`LibraryConditionHistory`**: Historical wear-and-tear ledger logging previous/new conditions, reasons, and assessed charges.
11. **`LibraryAccessionSequence` & `LibraryMemberSequence`**: Concurrency-safe atomic year-based sequence counters preventing race conditions and numbering collisions.

---

### 4. API ARCHITECTURE & SECURITY

| Route | Method | Access | Description & Security Boundary |
|---|---|---|---|
| `/api/admin/library/books` | GET, POST | `ADMIN`, `PRINCIPAL` (RO) | List catalog with server-side pagination & filter; create new book. |
| `/api/admin/library/books/[id]` | GET, PATCH | `ADMIN` | Retrieve single book detail or update metadata. |
| `/api/admin/library/categories` | GET, POST | `ADMIN`, `PRINCIPAL` | Catalog category taxonomy management. |
| `/api/admin/library/authors` | GET, POST | `ADMIN`, `PRINCIPAL` | Author registry management. |
| `/api/admin/library/publishers` | GET, POST | `ADMIN`, `PRINCIPAL` | Publisher directory management. |
| `/api/admin/library/copies` | GET, POST | `ADMIN`, `PRINCIPAL` | List physical copies & register new copies with auto-generated accession numbers. |
| `/api/admin/library/copies/[id]` | PATCH | `ADMIN` | Update copy condition or shelf location. |
| `/api/admin/library/members` | GET, POST | `ADMIN`, `PRINCIPAL` | Manage student and teacher library memberships. |
| `/api/admin/library/rules` | GET, PUT | `ADMIN` | Configure issue duration, limits, and fines. |
| `/api/admin/library/issues` | GET, POST | `ADMIN` | Search circulation history; atomically issue available copies. |
| `/api/admin/library/issues/[id]/return` | POST | `ADMIN` | Idempotent book return, overdue fine assessment & Phase 6 invoicing. |
| `/api/admin/library/issues/[id]/renew` | POST | `ADMIN` | Safe loan renewal with policy boundary checks. |
| `/api/admin/library/copies/[id]/lost` | POST | `ADMIN` | Mark physical copy lost & generate replacement invoice. |
| `/api/admin/library/copies/[id]/damaged` | POST | `ADMIN` | Assess physical wear/tear with condition history logging. |
| `/api/admin/library/reports` | GET | `ADMIN`, `PRINCIPAL` | Aggregated inventory, circulation, member, and fine analytics. |
| `/api/admin/library/barcode-sheet` | GET | `ADMIN` | Printable barcode & QR book spine labels. |
| `/api/portal/library` | GET | `GUARDIAN` | Strict child-scoped library history. Unauthorized children blocked with 403 Forbidden. |
| `/api/teacher/library` | GET | `TEACHER` | Session-scoped personal borrowing history. Other teachers' records strictly blocked. |
| `/api/public/library/books` | GET | `PUBLIC` (No Auth) | Public catalog search. Zero borrower identity exposure. |
| `/api/public/library/copy/[token]` | GET | `PUBLIC` (No Auth) | Tamper-proof physical copy verification. Personal details omitted. |

---

### 5. FINANCE ENGINE (PHASE 6) INTEGRATION

Library financial liabilities flow directly into the established Phase 6 accounting engine:
1. **Fee Category:** Seeded canonical category `LIBRARY_FINE` (`কুতুবখানা ও লাইব্রেরি জরিমানা/চার্জ`).
2. **Overdue Calculation:**
   $$\text{Chargeable Days} = \max(0, \text{Overdue Days} - \text{Grace Days})$$
   $$\text{Fine Amount} = \text{Chargeable Days} \times \text{Daily Fine}$$
3. **Lost Book Replacement:**
   $$\text{Replacement Charge} = \text{Purchase Price} \times \text{Multiplier (1.5x)}$$
4. **Invoice Generation:** When a fine or replacement charge is assessed for an active student borrower, the engine calls `createInvoiceFromFeeRule` or directly provisions a `FeeInvoice` with:
   - Unique Number: `EHRJ-INV-YYYY-XXXXX`
   - Due Date: 14 days from return
   - Status: `UNPAID`
   - Fund Code: `GENERAL`
5. **No Independent Cash Registers:** The library module does not handle cash or online collections directly. Borrowers settle charges via the existing Guardian Portal payment gateway or through office cash collection with formal `PaymentReceipt` issuance.

---

### 6. NOTIFICATION ENGINE (PHASE 8) INTEGRATION

Phase 9 provisions 6 standardized institutional notification templates:
1. `LIBRARY_BOOK_ISSUED`: Sent upon book checkout with accession number and return deadline.
2. `LIBRARY_DUE_SOON`: Reminder sent prior to due date to avoid overdue penalties.
3. `LIBRARY_BOOK_OVERDUE`: Urgent alert with overdue duration and accumulating daily fine.
4. `LIBRARY_BOOK_RETURNED`: Acknowledgement of safe book restitution.
5. `LIBRARY_FINE_ASSESSED`: Notification of overdue or damage invoice creation.
6. `LIBRARY_BOOK_LOST`: Notice of lost copy replacement liability.

Each notification enforces idempotency via structured keys (`LIBRARY_OVERDUE_{issueId}_{date}`) to prevent duplicate messaging across retries and background jobs.

---

### 7. VERIFICATION & QUALITY EVIDENCE

#### Automated Test Suite Execution
- **Phase 9 Test Suite (`scripts/test_phase9_library.js`):** **50 / 50 PASSED (0 FAILED)**
- **Regression Verification:**
  - Phase 1 Foundation: 39 / 39 PASSED
  - Phase 2 Academic Core: 42 / 42 PASSED
  - Phase 3 Admissions & Enrollment: 63 / 63 PASSED
  - Phase 4 Attendance: 50 / 50 PASSED
  - Phase 5 Exam & Results: 55 / 55 PASSED
  - Phase 6 Finance & Fees: 56 / 56 PASSED
  - Phase 7 Documents & Certificates: 69 / 69 PASSED
  - Phase 8 Communication & Notices: 72 / 72 PASSED
- **Grand Total System Assertions:** **496 / 496 PASSED (100% SUCCESS, 0 REGRESSIONS)**

#### Production Build Verification
- **Command:** `npm run build`
- **Output:** Clean exit code `0`
- **Route Count:** 99 total compiled pages and API routes
- **TypeScript Diagnostics:** 0 errors (`npx tsc --noEmit` clean)
- **Git Checkpoint Tag:** `EHRJ-AI-2026-PHASE9`
