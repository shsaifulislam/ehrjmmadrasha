# Volume 03 – Admin ERP Complete SRS

## 1. Purpose & Core Operational Scope
এটি EHRJ Madrasha ERP-এর Central Control Panel।
মাদ্রাসার সমস্ত অপারেশন এখান থেকে পরিচালিত হবে।
- কোনো Module আলাদা বা বিচ্ছিন্ন থাকবে না।
- সমস্ত Module কেন্দ্রীয় Database, Dashboard, Notification, Finance, Student360 এবং Audit System-এর সাথে রিলেশনালভাবে Connected থাকবে।

---

## 2. Admin ERP Master Sitemap (400–500+ Pages Architecture)

### 📊 Dashboard & Overview
- `/admin` (Core Executive Dashboard)

### 📝 Admission Module
- `/admin/admissions`
- `/admin/admissions/dashboard`
- `/admin/admissions/create`
- `/admin/admissions/import`
- `/admin/admissions/export`
- `/admin/admissions/settings`
- `/admin/admissions/pending`
- `/admin/admissions/approved`
- `/admin/admissions/rejected`
- `/admin/admissions/draft`
- `/admin/admissions/online`
- `/admin/admissions/offline`
- `/admin/admissions/[id]`
- `/admin/admissions/[id]/edit`
- `/admin/admissions/[id]/documents`
- `/admin/admissions/[id]/timeline`
- `/admin/admissions/[id]/payment`
- `/admin/admissions/[id]/receipt`
- `/admin/admissions/[id]/approval-letter`
- `/admin/admissions/[id]/pdf`

### 🎓 Student Module
- `/admin/students`
- `/admin/students/create`
- `/admin/students/import`
- `/admin/students/export`
- `/admin/students/[id]` (Student360 Overview)
- `/admin/students/[id]/edit`
- `/admin/students/[id]/documents`
- `/admin/students/[id]/attendance`
- `/admin/students/[id]/results`
- `/admin/students/[id]/fees`
- `/admin/students/[id]/library`
- `/admin/students/[id]/hostel`
- `/admin/students/[id]/transport`
- `/admin/students/[id]/inventory`
- `/admin/students/[id]/timeline`
- `/admin/students/[id]/audit`

### 👨‍👩‍👦 Guardian Module
- `/admin/guardians`
- `/admin/guardians/create`
- `/admin/guardians/[id]`

### 👨‍🏫 Teacher & Staff Modules
- `/admin/teachers`, `/admin/teachers/create`, `/admin/teachers/[id]`, `/admin/teachers/payroll`, `/admin/teachers/attendance`, `/admin/teachers/leave`
- `/admin/staff`, `/admin/staff/create`, `/admin/staff/payroll`, `/admin/staff/attendance`, `/admin/staff/leave`

### 📚 Academic Module
- `/admin/sessions`, `/admin/classes`, `/admin/sections`, `/admin/groups`, `/admin/departments`, `/admin/subjects`, `/admin/books`, `/admin/syllabuses`, `/admin/class-routine`, `/admin/exam-routine`, `/admin/holidays`, `/admin/events`, `/admin/academic-calendar`

### ⏱️ Attendance Module
- `/admin/attendance`, `/admin/attendance/live`, `/admin/attendance/manual`, `/admin/attendance/reports`, `/admin/attendance/settings`

### 📝 Exams & Results Module
- `/admin/exams`, `/admin/exams/create`, `/admin/exams/schedule`, `/admin/exams/marks`, `/admin/exams/results`, `/admin/exams/tabulation`, `/admin/exams/transcripts`

### 💰 Finance & Fee Collection
- `/admin/finance/dashboard`, `/admin/invoices`, `/admin/payments`, `/admin/receipts`, `/admin/fees`, `/admin/waivers`, `/admin/fines`, `/admin/discounts`, `/admin/due-collection`, `/admin/transactions`

### 🏛️ Double Entry Accounting
- `/admin/accounting/dashboard`, `/admin/chart-of-accounts`, `/admin/journal`, `/admin/ledger`, `/admin/trial-balance`, `/admin/balance-sheet`, `/admin/income-statement`, `/admin/cash-book`, `/admin/bank-book`, `/admin/vouchers`, `/admin/fiscal-years`

### 💳 HR & Payroll
- `/admin/payroll`, `/admin/salary`, `/admin/allowance`, `/admin/deduction`, `/admin/advance`, `/admin/loan`, `/admin/payslip`

### 📖 Library, Hostel, Transport & Inventory
- `/admin/library`, `/admin/books`, `/admin/book-copies`, `/admin/book-categories`, `/admin/issue`, `/admin/return`, `/admin/fines`
- `/admin/hostels`, `/admin/buildings`, `/admin/rooms`, `/admin/allocations`, `/admin/meals`, `/admin/bills`
- `/admin/routes`, `/admin/vehicles`, `/admin/drivers`, `/admin/stoppages`, `/admin/allocations`, `/admin/fees`
- `/admin/items`, `/admin/categories`, `/admin/purchase`, `/admin/stock`, `/admin/issues`, `/admin/vendors`

### 📜 Certificates & Website CMS
- `/admin/certificates`, `/admin/templates`, `/admin/generate`, `/admin/verify`
- `/admin/cms/dashboard`, `/admin/cms/pages`, `/admin/cms/menu`, `/admin/cms/homepage`, `/admin/cms/sliders`, `/admin/cms/notices`, `/admin/cms/news`, `/admin/cms/gallery`, `/admin/cms/videos`, `/admin/cms/downloads`, `/admin/cms/faqs`, `/admin/cms/events`, `/admin/cms/teachers`, `/admin/cms/staff`, `/admin/cms/committee`, `/admin/cms/contact`, `/admin/cms/seo`

### 📣 Communication, Reports & Settings
- `/admin/sms`, `/admin/email`, `/admin/templates`, `/admin/notifications`, `/admin/announcements`, `/admin/push`
- `/admin/reports` (30+ specific reporting pages)
- `/admin/settings` (Institute, Academic, Finance, Accounting, SMS, Email, Security, Backup, API)
- `/admin/users`, `/admin/roles`, `/admin/permissions`, `/admin/activity`, `/admin/audit`, `/admin/login-history`, `/admin/system-health`, `/admin/jobs`, `/admin/queues`

---

## 3. Mandatory Page Standard (15-Point Rule)
প্রতিটি Admin Page-এ নিচে উল্লিখিত ১৫টি ফিচার বাধ্যতামূলকভাবে থাকতে হবে:
1. Header & Page Title
2. Dynamic Breadcrumb Navigation
3. RBAC Permission Verification Gate
4. Contextual Stats / Summary Cards
5. Instant Global & Table Search
6. Advanced Filter Drawer / Bar
7. Dynamic Column Sorting
8. Export Options (CSV, Excel, PDF)
9. Bulk Action Handlers (Approve, Reject, Delete, Export)
10. Print & Printable View Layout
11. Primary CTA / Create Button
12. Shared Responsive Data Table / Grid (`AppTable`)
13. Server-Side Pagination
14. Timeline & Audit Drawer
15. Strict UI States: Loading (Skeleton), Empty State, Error Alert, Mobile Responsive Layout

---

## 4. Module Integration Engine (Atomic Atomic Cascade Rule)
কোনো Module একাকী কাজ করবে না।
**উদাহরণ: Admission Approval Execution Workflow:**
যখন একজন ভর্তি আবেদনকারীকে Approve করা হবে, তখন একটি মাত্র ট্রানজেকশনে (Atomic DB Transaction) নিচের কাজগুলো স্বয়ংক্রিয়ভাবে সম্পাদিত হবে:
1. `Guardian` রেকর্ড তৈরি / ম্যাপিং
2. `Student` রেকর্ড তৈরি
3. `User` অ্যাকাউন্ট ও ক্রেডেনশিয়াল তৈরি
4. `Student360` ইকোসিস্টেম তৈরি
5. `Finance Invoice` এবং Admission Fee ডেবিট জেনারেট
6. `Accounting Journal Entry` & Ledger Post (Double Entry)
7. Core `Dashboard Stats` রিয়েল-টাইম আপডেট
8. System Notification & Activity Log এন্ট্রি
9. Parent & Student-কে SMS এবং Email প্রেরন
10. System Audit Log আপডেট
11. Public Website Seat Count / Stats স্বয়ংক্রিয় আপডেট
12. Global Search Index আপডেট

---

## 5. Universal CRUD Standards
প্রতিটি এডমিন মডিউলে নিচের ফিচারসমূহ স্ট্যান্ডার্ড হিসেবে প্রয়োগ করা হবে:
- Create, Read, Update, Soft Delete, Restore
- Print View, PDF Generation, QR Code & Barcode Integration
- CSV/Excel Export & Bulk Import (Zod Validator সহ)
- Activity Timeline & Audit Log Drawer
- File/Document Attachments & Internal Comments
- Multi-tier Approval Workflows

---

## 6. Enterprise Quality & Governance Directives
1. **Zero Hardcoded Data:** সমস্ত ড্রপডাউন, টেবিল সেল, উইজেট ডাটাবেস থেকে আসবে।
2. **Zero Dummy / Placeholder Pages:** কোনো "Coming Soon" বা "TODO" পেজ রাখা নিষিদ্ধ।
3. **Double Entry Compliance:** অর্থ সংক্রান্ত সমস্ত লেদেন পয়েন্টের ব্যাকএন্ডে জার্নাল এন্ট্রি বাধ্যতামূলক।
4. **Audit Enforcement:** সিস্টেমে ডাটা মিউটেশন (Create, Update, Delete) হলে Audit Log এন্ট্রি নিশ্চিত করতে হবে।
5. **RBAC Control:** অনুমতি (Permission Matrix) ছাড়া কোনো বাটন বা অ্যাকশন এপিআই এক্সিকিউট হতে পারবে না।
