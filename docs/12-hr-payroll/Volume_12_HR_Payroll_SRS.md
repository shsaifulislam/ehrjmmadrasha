# Volume 12 – HR & Payroll Blueprint (EHRJ-SRS-V12)

**Document Code:** EHRJ-SRS-V12  
**Module:** Human Resource & Payroll Blueprint  
**Applies To:** HR Department, Accounts Office, Teachers, Staff, Employee Portal, Admin ERP  

---

## 1. Purpose & Scope
EHRJ Madrasha ERP-এর শিক্ষক, কর্মকর্তা ও কর্মচারীদের সম্পূর্ণ জীবনচক্র (Job Circular ➔ Joining ➔ Probation ➔ Attendance ➔ Leave ➔ Salary ➔ Increment ➔ Promotion ➔ Transfer ➔ Retirement) এবং বেতন হিসাববিজ্ঞান (Payroll Engine, Payslips, Tax, PF, Loans) এই মডিউলের মাধ্যমে পরিচালিত হবে।

```text
Job Circular ➔ Application ➔ Interview ➔ Joining ➔ Employee ID ➔ Attendance/Leave ➔ Payroll Engine ➔ Accounting Journal ➔ Payslip & SMS/Email ➔ Increment/Promotion ➔ Retirement
```

---

## 2. Payroll Calculation & Approval Engine

```text
Salary Structure (Basic + Allowances)
            │
            ▼
   Attendance & Overtime (+)
            │
            ▼
Leave, Absent & Late Deductions (-)
            │
            ▼
Tax, PF, Loan & Advance Deductions (-)
            │
            ▼
Calculated Net Salary ──► Verification & Review ──► Admin Approval ──► PAYROLL LOCK
                                                                          │
                                                           ┌──────────────┴──────────────┐
                                                           ▼                             ▼
                                                Double Entry Accounting          Signed Payslip PDF
                                              (Salary Exp Dr / Payable Cr)     & SMS/Email Distribution
```

- **Payroll Lock Directive:** পে-রোল অনুমোদিত হয়ে `LOCKED` স্ট্যাটাসে গেলে তা আর কোনো সাধারণ ইউজার বা একাউন্ট্যান্ট এডিট করতে পারবেন না। লক খোলার একমাত্র অধিকার থাকবে `Super Admin`-এর।

---

## 3. Double Entry Accounting Integration
পে-রোল প্রসেসিং সম্পূর্ণ ডাবল এন্ট্রি একাউন্টিং নীতি অনুসরণ করবে:
1. **Salary Processing Entry:**
   - **Debit:** Salary Expense Account
   - **Credit:** Salary Payable Account
2. **Salary Disbursement Entry (Bank/Cash Payment):**
   - **Debit:** Salary Payable Account
   - **Credit:** Cash Account / Bank Account

---

## 4. Multi-Method Attendance Sync
- Biometric Fingerprint / Face Recognition Machine Integration.
- QR Code Mobile Attendance & GPS-based Geofenced Attendance for Field Staff.
- Real-time Redis Attendance Caching for fast check-in processing.

---

## 5. Scalability & Performance Standard (100,000+ Employees)
- **Queued Payroll Processing:** BullMQ ব্যাকগ্রাউন্ড কিউ ব্যবহার করে বেচ স্যালারি ক্যালকুলেশন ও পে-স্লিপ পিডিএফ তৈরি।
- **Redis Cache Layer:** উপস্থিতি ও স্যালারি স্ট্রাকচার রেডিস ক্যাশে সংরক্ষণ।

---

## 6. REST API Integration Contracts (22 API Groups)
- `GET /api/v1/hr/employees`
- `POST /api/v1/hr/employees`
- `PUT /api/v1/hr/employees/:id`
- `GET /api/v1/hr/departments`
- `GET /api/v1/hr/designations`
- `POST /api/v1/hr/attendance/biometric-sync`
- `POST /api/v1/hr/attendance/qr`
- `GET /api/v1/hr/leave/applications`
- `POST /api/v1/hr/leave/apply`
- `PUT /api/v1/hr/leave/:id/approve`
- `POST /api/v1/hr/payroll/generate`
- `POST /api/v1/hr/payroll/approve`
- `POST /api/v1/hr/payroll/lock`
- `GET /api/v1/hr/payslips/:id`
- `GET /api/v1/hr/salary-structures`
- `POST /api/v1/hr/increments`
- `POST /api/v1/hr/promotions`
- `POST /api/v1/hr/transfers`
- `GET /api/v1/hr/loans`
- `POST /api/v1/hr/loans`
- `GET /api/v1/hr/dashboard`
- `GET /api/v1/hr/reports`

---

## 7. Master Database Entities Mapped (26 Core Entities)
`Employee`, `Department`, `Designation`, `EmployeeDocument`, `EmployeeBank`, `Attendance`, `AttendanceLog`, `LeaveType`, `LeaveApplication`, `LeaveApproval`, `Payroll`, `PayrollItem`, `SalaryStructure`, `SalaryComponent`, `Increment`, `Promotion`, `Transfer`, `Loan`, `AdvanceSalary`, `ProvidentFund`, `TaxRule`, `Payslip`, `Holiday`, `Shift`, `Overtime`, `EmployeeTimeline`, `EmployeeAudit`

---

## 8. Verification & 15-Point Completion Condition
HR & Payroll মডিউল বাস্তবায়ন সফল বলা যাবে কেবল তখনই যখন:
- [ ] বায়োমেট্রিক ও কিউআর অ্যাটেন্ডেন্স সিঙ্ক কাজ করবে।
- [ ] ছুটির মাল্টি-স্টেজ অনুমোদন ফ্লো সম্পূর্ণ হবে।
- [ ] পে-রোল ক্যালকুলেশন সঠিক নিট স্যালারি প্রদান করবে।
- [ ] পে-রোল লক ও সুপার-এডমিন আনলক ব্যবস্থা কার্যকর হবে।
- [ ] ডাবল এন্ট্রি একাউন্টিং-এ স্যালারি জার্নাল অটো-পোস্ট হবে।
- [ ] পিডিএফ পে-স্লিপ জেনারেট ও ডিজিটাল সিগনেচার সক্রিয় থাকবে।
- [ ] প্রমোশন, ইনক্রিমেন্ট ও ট্রান্সফার হিস্ট্রি প্রিজার্ভড হবে।
- [ ] কোনো Placeholder বা Mock Data অবশিষ্ট থাকবে না।
- [ ] TypeScript Build (`npm run build`) সফল হবে।
- [ ] Clean Production Build পাস করবে।
- [ ] Playwright E2E Test Suite সম্পূর্ণ পাস করবে।
- [ ] Runtime Verification সফল হবে।
- [ ] Physical Screenshot Evidence সংরক্ষিত থাকবে।
- [ ] Physical Screen Recording Evidence সংরক্ষিত থাকবে।
