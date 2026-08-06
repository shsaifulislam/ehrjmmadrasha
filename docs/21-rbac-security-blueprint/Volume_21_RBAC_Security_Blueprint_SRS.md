# Volume 21 – RBAC (Role-Based Access Control) & Enterprise Security Blueprint (EHRJ-SRS-V21)

**Document Code:** EHRJ-SRS-V21  
**Module:** RBAC & Enterprise Security Blueprint  
**Applies To:** Security Core, System Infrastructure, All ERP Modules, Portals, API Engine  

---

## 1. Purpose & Security Core Architecture
RBAC (Role-Based Access Control) হলো পুরো EHRJ ERP-এর কেন্দ্রীয় নিরাপত্তা ইঞ্জিন (Security Core)।
- সিস্টেমে ফ্রন্টএন্ড মেকার থেকে শুরু করে ব্যাকএন্ড API এন্ডপয়েন্ট, ডেটাবেস রো (Row-level Scope), মেনু ভিজিবিলিটি এবং বাটন অ্যাকশন—সবকিছু `module.action` ফরম্যাটের সুনির্দিষ্ট পারমিশন ও ডেটা স্কোপ ইঞ্জিন দ্বারা কঠোরভাবে নিয়ন্ত্রিত হবে।

```text
User Request ➔ Authentication (JWT/Session) ➔ RBAC Middleware ➔ Permission Engine (module.action < 10ms) ➔ Data Scope Engine (Row Isolation) ➔ Controller/Service ➔ Database ➔ Immutable Audit Log
```

---

## 2. 20 Enterprise Default System Roles
1. `Super Admin` (Full System Access & Emergency Controls)
2. `Chairman` & `Principal` (Executive Management & Reports)
3. `Vice Principal` & `Academic Coordinator` (Academic & Routine Supervision)
4. `Accountant` & `Finance Manager` (Finance, Billing & Double Entry Accounting)
5. `HR Manager` (Employee Lifecycle, Attendance & Payroll)
6. `Admission Officer` (Student Onboarding & Applications)
7. `Office Staff`, `Librarian`, `Hostel Manager`, `Transport Manager`, `Store Manager`
8. `Teacher` & `Class Teacher` (Classroom Workspace & Student Performance)
9. `Student` & `Guardian` (Personal Portal & Multi-Child Access)
10. `Auditor`, `Guest`, `API Client`

---

## 3. String-Format Permission & Data Scope Engine

### A. Permission Naming Format
সমস্ত পারমিশন `module.action` ফরম্যাটে সংরক্ষিত হবে:
- **Examples:** `student.create`, `student.update`, `student.delete`, `finance.invoice.create`, `accounting.journal.post`, `library.book.issue`, `hostel.room.allocate`.

### B. Dynamic Data Scope Isolation
- **Teacher Scope:** কেবল নিজের Assigned Classes, Subjects এবং Students ভিউ ও অ্যাকশন।
- **Guardian Scope:** কেবল নিজের ডায়নামিক সন্তানদের (Own Children) রেকর্ড এক্সেস।
- **Student Scope:** কেবল নিজের প্রোফাইল, ফলাফল ও ফি বিবরণী ভিউ।
- **Accountant Scope:** কেবল ফিনান্স ও হিসাববিজ্ঞান ডাটা ভিউ।

---

## 4. Multi-Layer Security & Emergency Controls
- **Authentication & 2FA:** JWT Access Token (Validation < 5ms), Refresh Tokens, OTP Verification, Email/SMS 2FA support.
- **Login Defense:** Rate Limiting, Captcha Trigger, Brute-Force Account Locking, Device & Browser Fingerprinting.
- **Emergency System Controls:** সুপার এডমিন কর্তৃক ১-ক্লিকে **Force Logout Everyone**, **Maintenance Mode**, **Token Revocation** এবং **IP Restriction Whitelist**.
- **Immutable Security Audit Trail:** পারমিশন পরিবর্তন, ডাটা মিউটেশন, এক্সপোর্ট এবং বিফল হওয়া এক্সেস চেষ্টার আগের ও পরের মানসহ ডিভাইস IP অডিট ট্রেইল।

---

## 5. REST API Integration Contracts (14 API Groups)
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh-token`
- `POST /api/v1/auth/2fa/verify`
- `GET /api/v1/rbac/roles`
- `POST /api/v1/rbac/roles`
- `GET /api/v1/rbac/permissions`
- `POST /api/v1/rbac/users/:id/roles`
- `POST /api/v1/rbac/users/:id/permissions`
- `GET /api/v1/security/active-sessions`
- `POST /api/v1/security/force-logout`
- `GET /api/v1/security/audit-logs`
- `GET /api/v1/security/dashboard`
- `POST /api/v1/security/emergency/maintenance-mode`

---

## 6. Master Database Entities Mapped (20 Core Entities)
`User`, `Role`, `Permission`, `RolePermission`, `UserRole`, `UserPermission`, `LoginHistory`, `UserSession`, `Device`, `TrustedDevice`, `PasswordHistory`, `PasswordReset`, `TwoFactorSecret`, `ApiToken`, `AuditLog`, `SecurityEvent`, `PermissionGroup`, `DataScope`, `UserPreference`, `LoginAttempt`

---

## 7. Performance & Security Benchmarks
- **Permission Check Latency:** Redis Tree Caching ব্যবহার করে পারমিশন চেক < 10ms এবং JWT ভ্যালিডেশন < 5ms.
- **1,000 Concurrent Security Checks Support:** ব্যাকএন্ড মিডিলেওয়্যার লেভেলে জিরো-ব্লকিং পারমিশন এক্সিকিউশন।

---

## 8. Verification & 20-Point Completion Condition
RBAC & Enterprise Security মডিউল সম্পূর্ণ বাস্তবায়িত বলা যাবে কেবল তখনই যখন:
- [ ] প্রতিটি বাটন, পেজ ও API এন্ডপয়েন্টে `module.action` পারমিশন চেক সক্রিয় থাকবে।
- [ ] ব্যাকএন্ড API এবং ডেটা স্কোপ ইঞ্জিন অননুমোদিত ইউজারকে ৪০৩ ফরবিডেন প্রদান করবে।
- [ ] ২এফএ (2FA), ডিভাইস ট্র্যাকিং ও পাসওয়ার্ড পলিসি শতভাগ ভ্যালিডেশন পাস করবে।
- [ ] ইমার্জেন্সি ফোর্স লগআউট ও রেট লিমিটিং ডিফেন্স সফল কাজ করবে।
- [ ] CSRF, XSS এবং SQL Injection প্রটেকশন ভ্যালিডেশন টেস্ট পাস করবে।
- [ ] যেকোনো তথ্য পরিবর্তনের সময় আগের ভ্যালু ও নতুন ভ্যালু অডিট লগে সেভ হবে।
- [ ] কোনো Hardcoded Permissions বা Fake Data থাকবে না।
- [ ] TypeScript Build (`npm run build`) সফল হবে।
- [ ] Clean Production Build পাস করবে।
- [ ] Playwright E2E Test Suite সম্পূর্ণ সফল হবে।
- [ ] Runtime Verification এবং Penetration Verification সম্পূর্ণ পাস করবে।
- [ ] Physical Screenshot Evidence সংরক্ষিত থাকবে।
- [ ] Physical Screen Recording Evidence সংরক্ষিত থাকবে।
