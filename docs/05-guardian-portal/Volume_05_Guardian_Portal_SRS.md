# Volume 05 – Guardian Portal Complete SRS (EHRJ-SRS-V05)

**Document Code:** EHRJ-SRS-V05  
**Module:** Guardian Portal  
**Applies To:** Parent/Guardian Portal (Web + Mobile Ready)  

---

## 1. Purpose & Operational Architecture
Guardian Portal হলো অভিভাবকের জন্য একটি সম্পূর্ণ Self-Service Portal যেখানে তিনি তার এক বা একাধিক সন্তানের একাডেমিক, আর্থিক, উপস্থিতি, পরীক্ষা, ফলাফল এবং নোটিশ সম্পর্কিত সমস্ত তথ্য এক জায়গায় রিয়েল-টাইমে দেখতে ও পরিশোধ করতে পারবেন।

```text
Guardian ➔ Guardian Portal ➔ [ Dashboard, Children, Student360, Attendance, Routine, Exams, Results, Finance, Payments, Library, Hostel, Transport, Certificates, Notices, Messages, Applications, Settings ]
```
- **Data Integrity Policy:** Guardian Portal কখনো আলাদা Database ব্যবহার করবে না। সব তথ্য মূল ERP Database থেকে Real-time API ও `Student360Service` এর মাধ্যমে আসবে।

---

## 2. Authentication & Login Options
- **Identifiers:** Mobile Number, Email, Guardian ID, Username.
- **Authentication Standard:** JWT Access Token, Refresh Token, Remember Login, Device Session, OTP Login, Password Recovery, 2FA Ready.

---

## 3. Guardian Dashboard & Multi-Child Switcher

```text
               ┌────────────────────────────────────────────────────────┐
               │              Guardian Multi-Child Switcher              │
               └───────────────────────────┬────────────────────────────┘
                                           │
             ┌─────────────────────────────┼─────────────────────────────┐
             ▼                             ▼                             ▼
       [ Child 1 ]                   [ Child 2 ]                   [ Child 3 ]
   Class Six | Roll 05           Class Nine | Roll 12           Alim 1st | Roll 02
```

- **Widgets & KPI Cards:** Total Children, Present Today, Absent Today, Pending Fees, Upcoming Exams, Unread Notices/Messages, Library Due Books, Hostel Status, Transport Route.
- **Quick Action Handlers:** Pay Fees, Download Receipt, View Result, Apply Leave, Contact Teacher, Download Routine.

---

## 4. Sub-System Specifications

1. **Student360 Integration:** Read-only access across Personal, Guardian, Admission, Academic, Attendance, Routine, Exam, Result, Finance, Library, Hostel, Transport, Inventory, Medical, Discipline, Certificates, Documents, Communication, Timeline, and Activity tabs.
2. **Attendance Heatmap & Reports:** Today/Daily/Monthly/Yearly attendance reports, Absent alerts, Late entry tracking, Leave history with PDF & Print capabilities.
3. **Online Fee Payment Engine:** Instant fee payment via **bKash, Nagad, Rocket, SSLCommerz**. Retry failed payments, Payment status logs, and instant QR Code Receipt generation.
4. **Direct Communication & Applications:** Two-way direct messaging with Teachers, Admin, Principal, Accounts Office. Submitting and tracking Leave Applications, Certificate Applications, Fee Waivers, Hostel/Transport Requests.
5. **Certificates & Downloads:** Downloading Character Certificates, Bonafide Certificates, Testimonials, Transfer Certificates, Student ID Cards with dynamic **QR Verification**.

---

## 5. REST API Integration Contracts (24 Endpoints)
- `GET /api/v1/guardian/dashboard`
- `GET /api/v1/guardian/profile`
- `GET /api/v1/guardian/children`
- `GET /api/v1/guardian/student360`
- `GET /api/v1/guardian/attendance`
- `GET /api/v1/guardian/routine`
- `GET /api/v1/guardian/exams`
- `GET /api/v1/guardian/results`
- `GET /api/v1/guardian/finance`
- `GET /api/v1/guardian/invoices`
- `GET /api/v1/guardian/payments`
- `POST /api/v1/guardian/pay`
- `GET /api/v1/guardian/library`
- `GET /api/v1/guardian/hostel`
- `GET /api/v1/guardian/transport`
- `GET /api/v1/guardian/notices`
- `GET /api/v1/guardian/messages`
- `GET /api/v1/guardian/applications`
- `POST /api/v1/guardian/applications`
- `GET /api/v1/guardian/certificates`
- `GET /api/v1/guardian/downloads`
- `GET /api/v1/guardian/activity`
- `PUT /api/v1/guardian/profile`
- `PUT /api/v1/guardian/password`

---

## 6. Master Database Entities Mapped (28 Entities)
`Guardian`, `Student`, `User`, `Admission`, `Attendance`, `Routine`, `Subject`, `Exam`, `Result`, `Invoice`, `InvoiceItem`, `Payment`, `Receipt`, `LibraryMember`, `LibraryIssue`, `HostelAllocation`, `TransportAllocation`, `Certificate`, `Notice`, `Download`, `Gallery`, `Event`, `Notification`, `Message`, `Ticket`, `ActivityLog`, `AuditLog`

---

## 7. Verification & 13-Point Completion Condition
Guardian Portal তখনই বাস্তবায়িত হিসেবে বিবেচিত হবে যখন:
- [ ] নির্ধারিত সমস্ত রুট ও পেজ নিখুঁতভাবে জেনারেট হবে।
- [ ] ২৪টি API মূল ডাটাবেসের সাথে সংযুক্ত থাকবে।
- [ ] একাধিক সন্তানের অভিভাবকত্ব (Child Switcher) নিরবচ্ছিন্ন কাজ করবে।
- [ ] Student360 রিয়েল-টাইমে ডাটা রেন্ডার করবে।
- [ ] Online Payment Gateways (bKash/Nagad/Rocket/SSLCommerz) লাইভ থাকবে।
- [ ] কোনো Placeholder বা Mock Data অবশিষ্ট থাকবে না।
- [ ] RBAC ও Tenant Isolation শতভাগ নিশ্চিত হবে।
- [ ] Desktop, Tablet এবং Mobile-এ Fully Responsive হবে।
- [ ] TypeScript Build (`npm run build`) সফল হবে।
- [ ] Production Build Clean Pass করবে।
- [ ] Playwright E2E Test Suite পাস করবে।
- [ ] Runtime Verification সম্পন্ন হবে।
- [ ] Screenshot ও Screen Recording প্রমাণাদি সংরক্ষিত থাকবে।
