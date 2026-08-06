# Volume 13 – Library Management Blueprint (EHRJ-SRS-V13)

**Document Code:** EHRJ-SRS-V13  
**Module:** Library Management Blueprint  
**Applies To:** Library Department, Students, Teachers, Staff, Guardians, Student360, Admin ERP  

---

## 1. Purpose & Physical/Digital Scope
EHRJ Madrasha-এর ফিজিক্যাল লাইব্রেরি (Physical Library) এবং ই-লাইব্রেরি (Digital Library) অটোমেশনের জন্য এই মডিউল ব্যবহৃত হবে।
- Book Cataloging, Accession Number Generation, OPAC Search Engine, Barcode/QR Verification, Book Issue/Return/Renewal, Fine Calculation Engine, Digital E-Book Library এবং Student360 Integration এই মডিউলের মূল চালিকাশক্তি।

```text
Purchase Book ➔ Catalog Entry ➔ Accession No & Code128 Barcode ➔ Shelf Allocation ➔ OPAC Search ➔ Issue Book ➔ Renew/Return ➔ Late Fine / Lost Book Invoice ➔ Double Entry Accounting
```

---

## 2. Core Library Systems & Engines

### A. Code128 Barcode & QR Verification Engine
- **Code128 Barcode:** প্রতিটি বইয়ের কপি (Book Copy), লাইব্রেরি মেম্বারশিপ কার্ড এবং ইস্যু স্লিপের জন্য বারকোড জেনারেট।
- **QR Code Verification:** ডিজিটাল বুক রিডিং, মেম্বারশিপ কার্ড ভেরিফিকেশন এবং বুক ডিটেইলস ভিউ।

### B. OPAC (Online Public Access Catalog) Search Engine
- **Features:** বইয়ের শিরোনাম, ISBN, বারকোড, লেখক, প্রকাশনী, বিষয়বস্তু ও ক্যাটাগরি অনুযায়ী তাৎক্ষণিক সার্চ।
- **Performance:** 500,000+ বইয়ের জন্য Redis OPAC Cache এবং Full-Text Search Engine।

### C. Issue, Return, Lost & Fine Engine
- **Book Issue & Limit:** শিক্ষার্থী ও শিক্ষকের টাইপ অনুযায়ী সর্বাধিক বই নেওয়ার সীমা ও মেয়াদ কনফিগারেশন।
- **Fine Workflow:** 
  `Late Return / Lost Book` ➔ `Fine Calculation` ➔ `Finance Invoice` ➔ `Payment Collection` ➔ `Accounting Journal Entry` (Debit: Cash/Bank, Credit: Library Fine Income).

### D. Digital Library Vault
- ওয়াটারমার্কযুক্ত PDF, EPUB, অডিও বুক ও ভিডিও টিউটোরিয়াল রিসোর্স সংবহন এবং সাইনড সিকিউর ডাউনলোডের সুবিধা।

---

## 3. Integrations with Portals & ERP Core
- **Student360:** শিক্ষার্থীর ইস্যুকৃত বইয়ের তালিকা, রিটার্ন ডেট, বকেয়া জরিমানা ও ই-বুক হিস্ট্রি সরাসরি ভিউ।
- **Teacher & Guardian Portals:** শিক্ষকদের রিকুইজিশন ও বুক রিজার্ভেশন সুবিধা; অভিভাবক কর্তৃক সন্তানের লাইব্রেরি জরিমানা ও বুক হিস্ট্রি ভিউ।
- **Finance & Accounting Sync:** বই হারানোর জরিমানা এবং লেট ফি স্বয়ংক্রিয়ভাবে জেনারেট হয়ে ডাবল এন্ট্রি একাউন্টিং লেজারে রিফ্লেক্ট হবে।

---

## 4. REST API Integration Contracts (20 API Groups)
- `GET /api/v1/library/books`
- `POST /api/v1/library/books`
- `GET /api/v1/library/opac-search`
- `GET /api/v1/library/categories`
- `GET /api/v1/library/authors`
- `GET /api/v1/library/publishers`
- `POST /api/v1/library/issue`
- `POST /api/v1/library/return`
- `POST /api/v1/library/renew`
- `POST /api/v1/library/reserve`
- `POST /api/v1/library/fine/calculate`
- `POST /api/v1/library/fine/pay`
- `GET /api/v1/library/barcode/:code`
- `GET /api/v1/library/digital-books`
- `GET /api/v1/library/membership`
- `GET /api/v1/library/reports`
- `GET /api/v1/library/dashboard`
- `POST /api/v1/library/import`
- `GET /api/v1/library/export`

---

## 5. Master Database Entities Mapped (25 Core Entities)
`LibraryCategory`, `Author`, `Publisher`, `Book`, `BookCopy`, `Accession`, `Shelf`, `Rack`, `LibraryMember`, `Issue`, `Return`, `Reservation`, `Fine`, `FinePayment`, `DigitalBook`, `LibraryCard`, `BookHistory`, `BookReview`, `LibraryAudit`, `LibrarySettings`, `Vendor`, `Purchase`, `StockAdjustment`, `DamageReport`, `LostReport`

---

## 6. Verification & 15-Point Completion Condition
Library Management মডিউল সম্পূর্ণ বাস্তবায়িত বলা যাবে কেবল তখনই যখন:
- [ ] OPAC Search Engine 500,000+ বইয়ের জন্য দ্রুত রেসপন্স করবে।
- [ ] Code128 Barcode এবং QR ভেরিফিকেশন স্ক্যানার সক্রিয় থাকবে।
- [ ] বই ইস্যু, রিটার্ন, রিনিউ এবং ওয়েটিং কিউ রিজার্ভেশন কাজ করবে।
- [ ] লেট ফাইন এবং হারিয়ে যাওয়া বইয়ের চালান জেনারেট হয়ে একাউন্টিং-এ ডেবিক/ক্রেডিট হবে।
- [ ] Student360 এবং পোর্টাল সমূহে লাইব্রেরি ডাটা লাইভ সিঙ্ক থাকবে।
- [ ] ডিজিটাল ই-বুক সিকিউর ওয়াটারমার্কসহ ডাউনলোড করা যাবে।
- [ ] কোনো Placeholder বা Mock Data অবশিষ্ট থাকবে না।
- [ ] TypeScript Build (`npm run build`) সফল হবে।
- [ ] Clean Production Build পাস করবে।
- [ ] Playwright E2E Test Suite পাস করবে।
- [ ] Runtime Verification সফল হবে।
- [ ] Physical Screenshot Evidence সংরক্ষিত থাকবে।
- [ ] Physical Screen Recording Evidence সংরক্ষিত থাকবে।
