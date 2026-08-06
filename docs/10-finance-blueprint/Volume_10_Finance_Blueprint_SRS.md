# Volume 10 – Finance Blueprint (EHRJ-SRS-V10)

**Document Code:** EHRJ-SRS-V10  
**Module:** Finance Management Blueprint  
**Applies To:** Finance Department, Accounts Office, Admin ERP, Student Portal, Guardian Portal, Public Website  

---

## 1. Purpose & Architectural Separation
Finance Module হলো EHRJ ERP-এর সম্পূর্ণ Fee Collection, Invoice Generation, Payment Processing, Due Management, Scholarship, Discount, Fine Rules, Refund, Receipt Generation এবং Online Payment Gateway পরিচালনাকারী বিলিং ইঞ্জিন।

```text
Admission ➔ Fee Structure ➔ Invoice ➔ Invoice Items ➔ Payment ➔ Receipt ➔ Double Entry Accounting ➔ Financial Dashboard
```
- **Separation of Concerns Mandate:** Finance Module কখনোই Accounting Module-এর বিকল্প হবে না। 
  - **Finance Module:** Billing, Invoicing, Collection & Receipts পরিচালনা করবে।
  - **Accounting Module:** Double Entry General Ledger, Journal Entries, Trial Balance, Income Statement & Balance Sheet পরিচালনা করবে।

---

## 2. Core Billing & Collection Engines

### A. 17 Master Fee Categories & Structure Matrix
- **Categories:** Admission, Registration, Monthly Tuition, Exam, Form Fill-up, Session, Development, Library, Laboratory, Hostel, Transport, Uniform, Book, ID Card, Certificate, Fine, Miscellaneous.
- **Matrix Mapping:** Sessional configuration mapped by Department, Class, Section, Shift, Group with Installment rules and Expiry/Late Fine dates.

### B. Invoicing & Payment Processing Engine
- **Invoice Statuses:** `Draft`, `Unpaid`, `Partially Paid`, `Paid`, `Cancelled`, `Refunded`.
- **Payment Modes:** Cash, Bank, Cheque, Mobile Banking.
- **Online Gateway Callbacks:** **bKash, Nagad, Rocket, SSLCommerz** with Signature Validation, Callback Check, and Retry capabilities.

### C. Scholarships, Discounts, Fines & Refunds
- **Scholarships & Waivers:** Full, Partial, Merit-Based, Need-Based with approval workflows.
- **Automated Fine Rules:** Daily, Weekly, Monthly, or Flat late fine calculation after Due Date.
- **Refund Workflow:** 
  `Finance Officer Request` ➔ `Accounts Verification` ➔ `Principal Approval` ➔ `Refund Execution`

---

## 3. Cash Counter & Receipt Generation
- **Cash Counter:** Opening Balance, Daily Collection, Closing Balance, Cash Adjustments.
- **Receipts:** Auto Receipt Number, QR Code Verification, Barcode, Digital Signature, Institute Logo, PDF/Print downloads.

---

## 4. Scalability & Performance Standard (100,000+ Invoices)
- **High-Volume DB Indexes:** Prisma indexing on `Invoice`, `Payment`, `Receipt`, and `Student` IDs.
- **Queue-Driven Notifications:** BullMQ queues for automated SMS/Email receipts and payment reminders.
- **Redis Metrics Cache:** Real-time dashboard KPI metric caching in Redis.

---

## 5. REST API Integration Contracts (19 Endpoints)
- `GET /api/v1/finance/dashboard`
- `GET /api/v1/finance/invoices`
- `POST /api/v1/finance/invoices`
- `PUT /api/v1/finance/invoices/:id`
- `GET /api/v1/finance/invoices/:id`
- `POST /api/v1/finance/payments`
- `GET /api/v1/finance/payments`
- `GET /api/v1/finance/receipts`
- `GET /api/v1/finance/fee-types`
- `POST /api/v1/finance/fee-types`
- `GET /api/v1/finance/fee-structures`
- `POST /api/v1/finance/fee-structures`
- `GET /api/v1/finance/scholarships`
- `POST /api/v1/finance/scholarships`
- `GET /api/v1/finance/discounts`
- `POST /api/v1/finance/discounts`
- `GET /api/v1/finance/refunds`
- `POST /api/v1/finance/refunds`
- `GET /api/v1/finance/reports`

---

## 6. Master Database Entities Mapped (15 Entities)
`FeeType`, `FeeStructure`, `Invoice`, `InvoiceItem`, `Payment`, `Receipt`, `Scholarship`, `Discount`, `FineRule`, `Refund`, `Installment`, `PaymentGateway`, `FinanceSetting`, `StudentLedger`, `AuditLog`

---

## 7. RBAC Permission Matrix Keys
- `finance.view`, `finance.create.invoice`, `finance.edit.invoice`, `finance.delete.invoice`, `finance.collect.payment`, `finance.refund`, `finance.discount.manage`, `finance.scholarship.manage`, `finance.report.export`, `finance.settings.manage`

---

## 8. Verification & 16-Point Completion Condition
Finance Blueprint বাস্তবায়িত বলা যাবে কেবল তখনই যখন:
- [ ] ১৭টি Fee Category এবং Fee Structure সঠিকভাবে কাজ করবে।
- [ ] অটো এবং ম্যানুয়াল ইনভয়েস জেনারেট কার্যকর হবে।
- [ ] ক্যাশ, ব্যাংক ও অনলাইন পেমেন্ট কালেকশন কাজ করবে।
- [ ] কিউআর ও বারকোড সমৃদ্ধ PDF রসিদ জেনারেট হবে।
- [ ] স্কলারশিপ, ডিসকাউন্ট, ফাইন এবং রিফান্ড ওয়ার্কফ্লো কার্যকর থাকবে।
- [ ] স্টুডেন্ট ও গার্ডিয়ান পোর্টাল রিয়েল ডাটা প্রদর্শন করবে।
- [ ] পেমেন্ট হওয়া মাত্রই Accounting Module-এ জার্নাল এন্ট্রি সিঙ্ক হবে।
- [ ] কোনো Placeholder বা Mock Data অবশিষ্ট থাকবে না।
- [ ] TypeScript Build (`npm run build`) সফল হবে।
- [ ] Clean Production Build পাস করবে।
- [ ] Playwright E2E Test Suite পাস করবে।
- [ ] Runtime Verification সম্পন্ন হবে।
- [ ] Physical Screenshot Evidence সংরক্ষিত থাকবে।
- [ ] Physical Screen Recording Evidence সংরক্ষিত থাকবে।
