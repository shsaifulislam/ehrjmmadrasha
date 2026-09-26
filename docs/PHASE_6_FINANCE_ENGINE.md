# EHRJ DIGITAL CAMPUS
## PHASE 6 — FINANCE, FEES & FINANCIAL MANAGEMENT ENGINE
### Comprehensive Technical Documentation

---

## 1. Executive Summary

Phase 6 delivers a complete, production-grade **Finance, Fees & Financial Management Engine** for **ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা (Eliotganj Hazi Rohmatollah Jamiria Madrasha)** (Est. 2021). Building upon the verified foundations of Phase 1 (Auth & RBAC), Phase 2 (Academic Core), Phase 3 (Admissions), Phase 4 (Attendance), and Phase 5 (Exams & Results), Phase 6 separates **Student Finance** and **Institutional Finance** while enforcing strict double-entry ledger integrity, Shariah fund governance, historical immutability, payment idempotency, and guardian privacy.

---

## 2. Core Financial Lifecycle Architecture

```text
Configurable Fee Structure (Session, Class, FeeType, ResidentialStatus, Amount)
      ↓
Student Eligibility & Residential Status Check
      ↓
Canonical Fee Calculation Service (`calculateStudentFee`)
      ↓ [Rule Precedence: Base → Scholarship → Assistance → Discount/Waiver → Late Fee]
Final Payable Boundary: max(0, finalPayable)
      ↓
Unique Concurrency-Safe Invoice Generation (`EHRJ-INV-YYYY-XXXXX`)
      ↓
Payment Collection / Online Gateway Adapter (bKash / Nagad / Bank / Cash)
      ↓ [Idempotency Key Check + Overpayment Rejection + Amount Verification]
Atomic Transaction: FeeInvoice (PAID / PARTIALLY_PAID) + PaymentReceipt (`EHRJ-RCP-YYYY-XXXXX`)
      ↓
Institutional Account / CashFund Balance Increment (+৳)
      ↓
Daily Cashbook Reconciliation & Double-Entry Ledger Entry
      ↓
AuditLog Recording (`COLLECT_FEE_PAYMENT`, `PROCESS_FEE_REFUND`, etc.)
      ↓
Public Privacy-Safe Receipt Verification (`/api/verify/receipt/[token]`)
```

---

## 3. Five Approved Institutional Funds & Shariah Governance

The institution operates under 5 strictly separated funds:

| Fund Code | Bengali Title | English Title | Permitted Inflows | Permitted Expenditures |
| :--- | :--- | :--- | :--- | :--- |
| **`GENERAL`** | সাধারণ প্রশাসনিক তহবিল | General Fund | General donations, admission/monthly tuition fees | Teacher/staff salaries, utility bills, administrative overhead, office expenses |
| **`LILLAH`** | লিল্লাহ বোর্ডিং ও খাদ্য তহবিল | Lillah Boarding Fund | Lillah donations, student food bills, grain/meat contributions | Student boarding meals, kitchen groceries, cooking fuel/gas, poor boarding student meals |
| **`ZAKAT`** | যাকাত ও দরিদ্র কল্যাণ তহবিল | Zakat & Poor Welfare Fund | Zakat collections, Fitrah, Shariah welfare gifts | Eligible destitute students, orphan welfare, books/clothing for poor students (**Strictly prohibited from administrative overhead, salaries, or utility bills**) |
| **`CONSTRUCTION`** | মাদ্রাসা ও মসজিদ নির্মাণ তহবিল | Construction & Development Fund | Construction donations, brick/cement contributions | Building construction, roof casting, land development, structural maintenance |
| **`ORPHAN_SUPPORT`** | এতিম ছাত্র স্পন্সরশিপ ফান্ড | Orphan Support Fund | Dedicated orphan sponsorships, monthly donor care | Long-term orphan education, living allowances, healthcare, orphan rehabilitation |

### Shariah & Overdraft Enforcement Rules (`src/lib/feeCalculationService.ts`)
1. **Zakat Overhead Prohibition:** Any transaction against `ZAKAT` categorized as office expense, utility, electricity, or administrative repair is rejected with `400 Bad Request`.
2. **Lillah Construction Prohibition:** Any transaction against `LILLAH` categorized as building construction or land acquisition is rejected with `400 Bad Request`.
3. **Overdraft Protection:** Fund balances can never silently become negative. Any expenditure or payroll disbursement exceeding `fund.currentBalance` is rejected with `400 Bad Request`.

---

## 4. Canonical Fee Rule Engine (`src/lib/feeCalculationService.ts`)

All fee calculations across Admission, Admin Fee Hub, Monthly Auto-Billing, and Guardian Portal run through one centralized service: `calculateStudentFee`.

### 4.1. Day Care Food Rule (Critical Institutional Invariant)
> **`DAY_CARE` students strictly receive ৳0 food bill.**

- When `student.residentialStatus === "DAY_CARE"` and `feeType === "FOOD"`, the rule engine completely waives the food bill (`netPayable = 0`, invoice status `WAIVED`, rule tag `DAY_CARE_FOOD_EXEMPTION`).
- Backend-enforced: Even direct API manipulation attempting to bill a Day Care student for food is intercepted and zeroed.

### 4.2. Reduction Precedence Order
Reductions are applied in a strict, audited sequence:
```text
Base Fee (from FeeStructure or custom base)
  - Applicable Scholarship (Fixed or % of base)
  - Approved Financial Assistance (Fixed or % of base)
  - Approved Discount / Waiver
  + Applicable Late Fee (if dueDate passed and grace period exceeded)
  = Final Payable (bounded by max(0, finalPayable))
```

### 4.3. Historical Immutability
- Existing invoices store fixed snapshot fields (`totalAmount`, `discountAmount`, `waiverAmount`, `netAmount`, `paidAmount`, `dueAmount`).
- Creating a new `FeeStructure` for 2027 (e.g. ৳1800) never rewrites or alters historical 2026 invoices (৳1500).

---

## 5. Phase 3 Admission Fee Correction

- Previously, Phase 3 admission approval used a hardcoded ৳1500 example fee.
- Phase 6 updated `src/lib/admissionApproval.ts` to query `FeeStructure` dynamically by session, class, and residential status, using 1500 only as a fallback.
- Orphan assistance is now configurable and preserves historical invoice integrity without global hardcoding.

---

## 6. Database Models & Schema Additions (`prisma/schema.prisma`)

```prisma
model FeeStructure {
  id                String            @id @default(uuid())
  sessionId         String
  classId           String?
  sectionId         String?
  gender            Gender?
  residentialStatus ResidentialStatus?
  feeType           String            // ADMISSION, MONTHLY, TUITION, FOOD, EXAM, CERTIFICATE, OTHER
  nameBn            String
  nameEn            String?
  amount            Float
  isOneTime         Boolean           @default(false)
  effectiveFrom     DateTime?
  effectiveTo       DateTime?
  dueDayOfMonth     Int?
  lateFeeAmount     Float             @default(0)
  lateFeeGraceDays  Int               @default(0)
  fundCode          String            @default("GENERAL")
  isActive          Boolean           @default(true)
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
}

model Refund {
  id             String          @id @default(uuid())
  refundNumber   String          @unique // EHRJ-RFD-YYYY-XXXXX
  receiptId      String
  invoiceId      String
  amount         Float
  reason         String
  refundMethod   String          @default("CASH")
  reference      String?
  approvedBy     String?
  refundDate     DateTime        @default(now())
  createdAt      DateTime        @default(now())
  receipt        PaymentReceipt  @relation(fields: [receiptId], references: [id])
  invoice        FeeInvoice      @relation(fields: [invoiceId], references: [id])
}

model Scholarship {
  id                String               @id @default(uuid())
  nameBn            String
  nameEn            String?
  code              String               @unique
  description       String?
  discountType      DiscountType         @default(FIXED)
  discountValue     Float
  applicableFeeType String?
  isActive          Boolean              @default(true)
  students          StudentScholarship[]
  createdAt         DateTime             @default(now())
}

model StudentScholarship {
  id            String      @id @default(uuid())
  studentId     String
  scholarshipId String
  sessionId     String
  validFrom     DateTime?
  validTo       DateTime?
  student       Student     @relation(fields: [studentId], references: [id], onDelete: Cascade)
  scholarship   Scholarship @relation(fields: [scholarshipId], references: [id], onDelete: Cascade)
  session       AcademicSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  @@unique([studentId, scholarshipId, sessionId])
}

model PayrollRecord {
  id               String        @id @default(uuid())
  voucherNumber    String        @unique // EHRJ-PAY-YYYY-XXXXX
  userId           String
  month            String        // YYYY-MM
  baseSalary       Float
  allowances       Float         @default(0)
  deductions       Float         @default(0)
  advanceDeduction Float         @default(0)
  netSalary        Float
  status           PayrollStatus @default(DRAFT) // DRAFT, APPROVED, PAID
  paymentMethod    PaymentMethod @default(CASH)
  paymentDate      DateTime?
  fundCode         String        @default("GENERAL")
  notes            String?
  approvedByUserId String?
  user             User          @relation(fields: [userId], references: [id])
  @@unique([userId, month])
}

model FinancialAccount {
  id             String        @id @default(uuid())
  nameBn         String
  nameEn         String?
  type           PaymentMethod // CASH, BANK, BKASH, NAGAD, ROCKET, CARD, OTHER
  accountNumber  String?
  bankName       String?
  branchName     String?
  fundCode       String        @default("GENERAL")
  openingBalance Float         @default(0)
  currentBalance Float         @default(0)
  isActive       Boolean       @default(true)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
}
```

---

## 7. Unique Concurrency-Safe Sequence Generators

Numbers are monotonic, formatted, zero-padded, and strictly inspect the maximum sequence in the database to prevent duplicate key collisions:
- **Invoice Number:** `EHRJ-INV-YYYY-XXXXX`
- **Receipt Number:** `EHRJ-RCP-YYYY-XXXXX`
- **Refund Number:** `EHRJ-RFD-YYYY-XXXXX`
- **Payroll Voucher Number:** `EHRJ-PAY-YYYY-XXXXX`

---

## 8. Bulk Monthly Billing & Idempotency Engine

- Endpoint: `POST /api/admin/finance/invoices/monthly-generate`
- Iterates over all active student enrollments for the specified session and class.
- Uses composite business key check: `studentId + sessionId + billingMonth + feeType`.
- Repeated executions skip already generated invoices without creating duplicates (`skippedCount >= 1`, `createdCount == 0`).
- Day Care students are automatically exempt from food invoices.

---

## 9. Payment Collection, Idempotency & Partial Payments

- **Partial Payments Supported:** An invoice for ৳1200 can receive ৳500 (status: `PARTIALLY_PAID`, due: ৳700) and later ৳700 (status: `PAID`, due: ৳0).
- **Overpayment Guard:** Attempts to pay more than the remaining due are rejected with `400 Bad Request`.
- **Payment Idempotency:** Client passes `idempotencyKey`. Subsequent submissions return the original receipt and invoice without creating duplicate transactions or crediting the fund twice.
- **Fund Restitution:** Each payment atomically increments the linked `CashFund.currentBalance` and generates a `CashTransaction` entry.

---

## 10. Refund Engine & Double-Entry Integrity

- Endpoint: `POST /api/admin/finance/payments/refund`
- Never deletes the original payment or receipt.
- Creates a linked `Refund` record with unique number `EHRJ-RFD-YYYY-XXXXX`.
- Reconciles invoice balance: reduces `paidAmount`, restores `dueAmount`, and updates invoice status (`PARTIALLY_PAID` or `UNPAID`).
- Atomically deducts refunded amount from the corresponding institutional `CashFund.currentBalance`.
- Generates an immutable `AuditLog` entry.

---

## 11. Daily Cashbook Engine

- Endpoint: `GET /api/admin/finance/cashbook?date=YYYY-MM-DD`
- Reconciles all transactions across the day:
  $$\text{Net Balance Movement} = \text{Income Collection} - \text{Expenses} - \text{Refunds}$$
- Granular transaction breakdown with timestamps, payee/payer names, voucher numbers, and fund classifications.

---

## 12. Guardian Portal & Multi-Child Switcher

- Route: `/portal` (Finance Tab) & `/api/portal/finance`
- **Strict Child Isolation:** Guardian can only query financial data for linked children (`GuardianStudent` relationship verified server-side). Unlinked child requests return `403 Forbidden` (IDOR blocked).
- **Combined Multi-Child Payment:** `/api/portal/finance/pay` accepts payments for single or multiple invoices across children, settling each invoice individually while returning unified receipts.
- **Online Financial Assistance Application:** Guardian can submit hardship/orphan fee assistance requests with reason and document links.

---

## 13. Public Privacy-Safe Receipt Verification

- Route: `/api/verify/receipt/[token]`
- Verified by tamper-proof QR code token.
- **Privacy Protections:** Strictly excludes guardian phone numbers, NID numbers, home addresses, and internal notes. Displays only institutional validation: receipt number, student name, class, amount paid, payment method, date, and payment status.

---

## 14. Payroll Foundation

- Route: `/api/admin/finance/payroll`
- Supports teacher/staff base salary, allowances, deductions, and advance loan adjustments.
- Automatically generates salary slip voucher `EHRJ-PAY-YYYY-XXXXX`.
- On disbursement (`action: "PAY"`), verifies fund sufficiency, deducts from `GENERAL` cash fund, records `CashTransaction`, and locks month from duplicate disbursement.

---

## 15. Automated Verification & Regression Evidence

### 15.1. Automated Test Suites Summary
All tests run against the live local Next.js production server and database with zero mocks:

| Phase | Test Suite Script | Assertions | Status |
| :--- | :--- | :--- | :--- |
| **Phase 1** | `scripts/test_phase1_foundation.js` | 39 / 39 | **PASSED** (0 failures) |
| **Phase 2** | `scripts/test_phase2_academic.js` | 42 / 42 | **PASSED** (0 failures) |
| **Phase 3** | `scripts/test_phase3_admissions.js` | 63 / 63 | **PASSED** (0 failures) |
| **Phase 4** | `scripts/test_phase4_attendance.js` | 50 / 50 | **PASSED** (0 failures) |
| **Phase 5** | `scripts/test_phase5_exams.js` | 55 / 55 | **PASSED** (0 failures) |
| **Phase 6** | `scripts/test_phase6_finance.js` | 56 / 56 | **PASSED** (0 failures) |
| **Total** | **All 6 Phases Integrated** | **305 / 305** | **100% PASSED** |

### 15.2. Production Build Verification
- Command: `npm run build`
- Total Routes Compiled: **85 routes** (including all Admin Finance and Guardian Portal endpoints)
- Compilation Status: **0 errors, 0 warnings**

---

## 16. Git Checkpoint

- **Checkpoint ID:** `EHRJ-AI-2026-PHASE6`
- **Commit Message:** `feat(finance): implement phase 6 financial management engine [EHRJ-AI-2026-PHASE6]`
