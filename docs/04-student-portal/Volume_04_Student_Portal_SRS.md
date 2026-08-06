# Volume 04 – Student Portal Complete SRS (Enterprise Student Hub)

**Document ID:** EHRJ-SRS-V04  
**Version:** 1.0  
**Status:** Approved SRS Blueprint  
**System Component:** Student Personal Workspace & Portal  

---

## 1. Purpose & Core Operational Scope
Student Portal হবে প্রতিটি শিক্ষার্থীর ব্যক্তিগত ড্যাশবোর্ড। এখান থেকে শিক্ষার্থী নিজের একাডেমিক, আর্থিক, উপস্থিতি, পরীক্ষা, লাইব্রেরি, হোস্টেল, ট্রান্সপোর্ট, নোটিশ, সার্টিফিকেট, রেজাল্ট ও প্রোফাইলসহ সমস্ত তথ্য দেখতে পাবে।

```text
Student ➔ Student Portal ➔ [ Student360, Finance, Attendance, Exam, Result, Library, Hostel, Transport, Inventory, Notice, Certificate, Communication ]
```
- **Data Rule:** Student Portal কখনো আলাদা Database ব্যবহার করবে না। সব তথ্য মূল ERP Database ও `Student360Service` থেকে Dynamic-ভাবে আসবে।

---

## 2. Authentication & Student Login Methods
- **Login Identifiers:** Student ID, Username, Mobile Number, Email, QR Code Login, RFID Integration.
- **Authentication Standard:** JWT Access Token + Refresh Token, Multi-Device Session Management, Failed Login Protection, 2FA & OTP verification for sensitive operations.

---

## 3. Student Portal Master Sitemap
```text
/student
├── /student/dashboard
├── /student/profile
├── /student/student360
├── /student/attendance
├── /student/routine
├── /student/exams
├── /student/results
├── /student/finance
│   ├── /student/invoices
│   ├── /student/payments
│   └── /student/receipts
├── /student/library
├── /student/hostel
├── /student/transport
├── /student/inventory
├── /student/assignments
├── /student/online-classes
├── /student/notices
├── /student/downloads
├── /student/gallery
├── /student/events
├── /student/certificates
├── /student/applications
├── /student/messages
├── /student/notifications
├── /student/support
├── /student/settings
├── /student/security
└── /student/activity-log
```

---

## 4. Dashboard Widgets & Performance Visualizers
- **KPI Summary Cards:** Student ID, Roll No, Class, Section, Session, Attendance %, Today's Classes, Pending Fees, Upcoming Exams, Library Books Due, Hostel Status, Transport Route, Unread Notifications, CGPA & Performance Summary.
- **Charts & Visualizers:** Monthly Attendance Heatmap, Fee Payment Breakdown, Exam Marks Trend, Overall Academic Radar Chart.

---

## 5. Sub-System Features

1. **Student360 Read-Only Integration:** Personal, Guardian, Academic, Admission, Attendance, Routine, Exam, Result, Finance, Library, Hostel, Transport, Inventory, Medical, Achievements, Discipline, Documents, Communication, Timeline & Audit tabs.
2. **Profile & Security Constraints:** Full demographic details. Edit permission restricted (Only Profile Photo upload allowed).
3. **Attendance & Routines:** Daily/Monthly/Yearly attendance calendars, Heatmap, Absent/Late logs, Leave history with PDF/Print export options.
4. **Exams, Results & Certificates:** Exam schedules, Seat plans, Downloadable Admit Cards, Subject-wise Marks Cards, Transcripts, Position, GPA, QR Verified Certificates (Character, Testimonial, Transfer, Bonafide, ID Card).
5. **Finance & Online Payments:** Outstanding breakdown, Installment tracking, Invoices, Payment history with instant Gateway integration (**bKash, Nagad, Rocket, SSLCommerz**) and QR Code PDF Receipts.
6. **Online Classes & Assignments:** Zoom / Google Meet live class triggers, Recorded classes repository, Homework/Assignment submission vault with Teacher feedback.
7. **Applications & Helpdesk Support:** Submitting online applications (Leave, Hostel, Transport, Certificate, Library) and Support Ticket generation with status tracking.

---

## 6. REST API Integration Contracts (23 Endpoints)
- `GET /api/v1/student/dashboard`
- `GET /api/v1/student/profile`
- `GET /api/v1/student/student360`
- `GET /api/v1/student/attendance`
- `GET /api/v1/student/routine`
- `GET /api/v1/student/exams`
- `GET /api/v1/student/results`
- `GET /api/v1/student/invoices`
- `GET /api/v1/student/payments`
- `GET /api/v1/student/library`
- `GET /api/v1/student/hostel`
- `GET /api/v1/student/transport`
- `GET /api/v1/student/inventory`
- `GET /api/v1/student/notices`
- `GET /api/v1/student/downloads`
- `GET /api/v1/student/gallery`
- `GET /api/v1/student/events`
- `GET /api/v1/student/certificates`
- `GET /api/v1/student/applications`
- `GET /api/v1/student/messages`
- `GET /api/v1/student/notifications`
- `GET /api/v1/student/security`
- `GET /api/v1/student/activity`

---

## 7. Master Database Tables Mapped (29 Entities)
`Student`, `Guardian`, `User`, `Admission`, `Attendance`, `Routine`, `Subject`, `Exam`, `Result`, `Invoice`, `Payment`, `Receipt`, `LibraryMember`, `LibraryIssue`, `HostelAllocation`, `TransportAllocation`, `InventoryIssue`, `Certificate`, `Notice`, `Download`, `Gallery`, `Event`, `Assignment`, `OnlineClass`, `Notification`, `Message`, `Ticket`, `ActivityLog`, `AuditLog`

---

## 8. Verification & 11-Point Completion Condition
Student Portal-কে তখনই বাস্তবায়ন হয়েছে বলা হবে যখন:
- [ ] সমস্ত ২৯টি রুট এবং পেজ বাস্তবায়িত হবে।
- [ ] সমস্ত ২০২৩টি REST API সংযুক্ত ও সক্রিয় থাকবে।
- [ ] Student360-এর সমস্ত সেকশন লাইভ ডাটাপ্রবাহ প্রদর্শন করবে।
- [ ] কোনো Placeholder বা Mock Data অবশিষ্ট থাকবে না।
- [ ] Desktop, Tablet এবং Mobile-এ ১০০% Responsive লেআউট নিশ্চিত হবে।
- [ ] RBAC এবং Tenant Security (কেবলমাত্র নিজের ডাটা এক্সেস) নিশ্চিত হবে।
- [ ] Playwright E2E Automation Test সম্পূর্ণ সফল হবে।
- [ ] TypeScript Build (`npm run build`) ত্রুটিমুক্ত হবে।
- [ ] Production Bundle Clean Build সফল হবে।
- [ ] Runtime Environment-এ ফিজিক্যাল ভেরিফিকেশন সফল হবে।
- [ ] Physical Screenshot ও Video Evidence রেকর্ডেড ও সংরক্ষিত থাকবে।
