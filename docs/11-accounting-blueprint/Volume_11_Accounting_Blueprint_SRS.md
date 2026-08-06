# Volume 11 – Double Entry Accounting Blueprint (EHRJ-SRS-V11)

**Document ID:** EHRJ-SRS-V11  
**Module:** Double Entry Accounting  
**Priority:** Critical Core Engine  
**Dependencies:** Finance, HR, Inventory, Admission, Payroll, Hostel, Library, Transport  

---

## 1. Purpose & Event-Driven Architecture
Accounting Module হলো পুরো EHRJ ERP-এর কেন্দ্রীয় আর্থিক প্রাণকেন্দ্র (Central Financial Core)।

```text
Other Modules (Finance, Payroll, Admission, Inventory, Hostel, Transport)
                            │
                    [ Accounting Event ]
                            │
                            ▼
                     Journal Builder
                            │
                            ▼
                     Journal Entry ──► Check: Total Debit == Total Credit?
                            │                  │
                            │             [ Yes ] ──► Ledger Post ──► Trial Balance ──► Financial Statements
                            │                  │
                            └─────────────► [ No ] ──► ROLLBACK TRANSACTION
```

- **Fundamental Rule of Double Entry:** প্রতিটি Transaction-এ **Total Debit = Total Credit** মিলতে হবে। এই ব্যালেন্স না মিললে সিস্টেম স্বয়ংক্রিয়ভাবে ডাটাবেস ট্রানজেকশন `ROLLBACK` করবে।
- **Event-Driven Policy:** Finance, Admission, Payroll বা অন্য কোনো মডিউল কখনো সরাসরি Ledger-এ ডাটা রাইট করবে না। তারা কেবল ইভেন্ট ট্রিগার করবে এবং Accounting Engine সেই ইভেন্ট রিসিভ করে জার্নাল ভাউচার জেনারেট করবে।

---

## 2. Chart of Accounts Taxonomy
1. **Assets:** Current Assets (Cash, Bank, Accounts Receivable, Inventory), Fixed Assets.
2. **Liabilities:** Accounts Payable, Salary Payable, Income Tax Payable.
3. **Equity:** Capital, Retained Earnings.
4. **Income:** Admission Fee, Tuition Fee, Exam Fee, Library Fee, Hostel Fee, Transport Fee, Donations.
5. **Expenses:** Salary Expense, Electricity, Internet, Office Expense, Maintenance, Scholarships, Depreciation.

---

## 3. Automatic Journal Posting Specifications

| Action / Event | Debit Account | Credit Account |
| :--- | :--- | :--- |
| **Admission Approval** | Cash / Accounts Receivable | Admission Income |
| **Fee Collection** | Cash / Bank | Accounts Receivable |
| **Salary Payment** | Salary Expense | Cash / Bank |
| **Asset / Item Purchase** | Inventory / Fixed Assets | Cash / Accounts Payable |
| **Utility Bill Payment** | Utility Expense | Cash / Bank |

---

## 4. Multi-Stage Voucher Approval & Audit Security
- **Voucher Approval Workflow:**
  `Draft` ➔ `Submitted` ➔ `Accountant Review` ➔ `Finance Manager` ➔ `Principal Approval` ➔ `Posted`
- **Immutability Policy:** জার্নাল এন্ট্রি একবার `POSTED` হয়ে গেলে তা সিস্টেমে কোনো অবস্থাতেই **Delete** করা যাবে না। ভুল সংশোধনের জন্য অবশ্যই **Reversal Entry** দিতে হবে।
- **Fiscal Year Closing:** সেশন শেষে পরবর্তী বছরের জন্য Opening Balance ক্যারি ফরোয়ার্ড করা এবং পূর্ববর্তী সেশনের লেজার ও পিরিয়ড স্থায়ীভাবে লক করে রাখা।

---

## 5. Performance Standard (1,000,000+ Journal Lines)
- **High-Scale Database Indexing:** `VoucherNo`, `AccountID`, `Date`, এবং `FiscalYear` ফিল্ড সমূহে প্রসপেক্টিভ বি-ট্রি ইনডেক্সিং।
- **Redis Financial Cache:** ব্যালেন্স শিট, ইনকাম স্টেটমেন্ট এবং ট্রায়াল ব্যালেন্সের জন্য রিয়েল-টাইম রেডিস ক্যাশিং লেয়ার।
- **Background Report Engines:** BullMQ ওয়ার্কার ব্যবহার করে হেভি ফিনান্সিয়াল রিপোর্ট জেনারেট।

---

## 6. REST API Integration Contracts (15 Core Endpoints)
- `GET /api/v1/accounting/dashboard`
- `GET /api/v1/accounting/chart`
- `POST /api/v1/accounting/chart`
- `PUT /api/v1/accounting/chart/:id`
- `GET /api/v1/accounting/journal`
- `POST /api/v1/accounting/journal`
- `PUT /api/v1/accounting/journal/:id`
- `POST /api/v1/accounting/journal/:id/post`
- `POST /api/v1/accounting/journal/:id/reverse`
- `GET /api/v1/accounting/ledger`
- `GET /api/v1/accounting/trial-balance`
- `GET /api/v1/accounting/income-statement`
- `GET /api/v1/accounting/balance-sheet`
- `GET /api/v1/accounting/cash-flow`
- `GET /api/v1/accounting/vouchers`
- `GET /api/v1/accounting/reports`

---

## 7. Master Database Entities Mapped (17 Entities)
`ChartOfAccount`, `AccountGroup`, `JournalEntry`, `JournalLine`, `Ledger`, `FiscalYear`, `Voucher`, `VoucherSeries`, `Budget`, `CostCenter`, `OpeningBalance`, `ClosingBalance`, `TrialBalance`, `IncomeStatement`, `BalanceSheet`, `CashFlow`, `AuditLog`

---

## 8. RBAC Permission Matrix Keys
- `accounting.view`, `accounting.create`, `accounting.edit`, `accounting.post`, `accounting.reverse`, `accounting.approve`, `accounting.export`, `accounting.print`, `accounting.settings`, `accounting.audit`

---

## 9. Verification & 20-Point Completion Condition
Accounting Engine বাস্তবায়িত বলা যাবে কেবল তখনই যখন:
- [ ] Chart of Accounts তৈরি ও শ্রেণিবিভাগ সফল হবে।
- [ ] ইভেন্ট ভিত্তিক Journal Entry Auto Posting সক্রিয় থাকবে।
- [ ] General Ledger স্বয়ংক্রিয় আপডেট হবে।
- [ ] Trial Balance-এ Total Debit = Total Credit মিলবে।
- [ ] Balance Sheet, Income Statement ও Cash Flow রিয়েল-টাইম রেন্ডার হবে।
- [ ] Reversal Entry নীতি মেনে পোস্ট করা জার্নাল ইমিউটেবল থাকবে।
- [ ] Cost Center & Budget Tracking কাজ করবে।
- [ ] ১,০০০,০০০+ জার্নাল লাইনের জন্য ক্যাশ ও ইনডেক্সিং টিউনড হবে।
- [ ] RBAC এবং Audit Log সক্রিয় থাকবে।
- [ ] TypeScript Build (`npm run build`) সফল হবে।
- [ ] Production Build পাস করবে।
- [ ] Playwright E2E Test Suite সম্পূর্ণ পাস করবে।
- [ ] Physical Screenshot & Video Evidence সংরক্ষিত থাকবে।
