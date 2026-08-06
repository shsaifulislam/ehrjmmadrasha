# Volume 01 – Project Vision & Enterprise Architecture

## Chapter 1: Project Information
- **Project Name:** EHRJ Madrasha ERP Enterprise System
- **Short Name:** EHRJ ERP
- **Organization:** Eliotganj Hazi Rohmatollah Jamiriya Madrasha

---

## Chapter 2: Project Vision
এই ERP-এর লক্ষ্য শুধু একটি ওয়েবসাইট তৈরি করা নয়।
এটি হবে একটি সম্পূর্ণ Enterprise Management Platform যেখানে মাদ্রাসার প্রতিটি কাজ একটি সিস্টেমের মাধ্যমে পরিচালিত হবে।

সিস্টেমের অন্তর্ভুক্ত মূল ক্ষেত্রসমূহ:
- Admission
- Student & Guardian
- Teacher & Employee
- Academic & Attendance
- Exam & Result
- Finance & Double Entry Accounting
- Payroll & HR
- Hostel & Library
- Transport & Inventory
- Website CMS, Notice, SMS & Email
- Certificate Generation
- Dashboard & Analytics

সবকিছু একটি একক কেন্দ্রীয় Database (PostgreSQL) ব্যবহার করবে।

---

## Chapter 3: Primary Objectives

1. **Academic Automation:** পুরো Academic System ডিজিটাল হবে।
2. **Financial Automation:** সব টাকা Double Entry Accounting অনুসারে পরিচালিত হবে।
3. **Paperless Administration:** যেখানে সম্ভব সেখানে PDF ও Digital Record ব্যবহার হবে।
4. **Student Lifecycle Management:**
    একজন Student-এর জীবনচক্র একই Database-এ ট্র্যাক করা হবে:
   `Admission` ➔ `Student` ➔ `Attendance` ➔ `Exam` ➔ `Result` ➔ `Certificate` ➔ `Alumni`
5. **Security & Governance:**
   - Role Based Access Control (RBAC)
   - Detailed Audit Log
   - Encrypted Passwords & Security Tokens
   - Permission Matrix (বাধ্যতামূলক)

---

## Chapter 4: Technology Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, Shadcn UI, TanStack Query, React Hook Form, Zod
- **Backend:** Node.js, Express.js, TypeScript
- **Database & ORM:** PostgreSQL, Prisma ORM
- **Queue & Background Jobs:** Redis, BullMQ
- **Storage:** Local Storage, Amazon S3 Compatible Storage
- **Authentication:** JWT, Refresh Token
- **Deployment & Infrastructure:** Docker, Nginx, SSL

---

## Chapter 5: Folder Structure Standard

```text
docs/
 ├── 01-project-vision/
 │    └── Volume_01_Project_Vision_Enterprise_Architecture.md
 ├── 02-public-website/
 ├── 03-admin-erp/
 ├── 04-student-portal/
 ├── 05-guardian-portal/
 ├── 06-teacher-portal/
 ├── 07-academic-blueprint/
 ├── 08-admission-blueprint/
 ├── ...
 └── 30-master-checklist/
```

---

## Chapter 6: ERP Modules (17 Core Modules)

1. Admission
2. Student360
3. Academic
4. Attendance
5. Examination
6. Finance
7. Accounting
8. HR & Payroll
9. Library
10. Hostel
11. Transport
12. Inventory
13. Certificate
14. Website CMS
15. Communication (SMS, Email, WhatsApp)
16. Settings & RBAC
17. Dashboard & Analytics

---

## Chapter 7: Development Rules

প্রতিটি Module-এর জন্য নিচের আইটেমগুলো থাকা বাধ্যতামূলক:
- Database Schema & Prisma Relation
- Zod DTO & Validation
- Service Layer & Controller Layer
- REST API Endpoints
- Responsive Frontend UI
- Search, Filter, Pagination
- Export, Import, Print, PDF, QR, Barcode
- Audit Log & Notification
- Build Verification & Automated Testing

---

## Chapter 8: Coding Principles

1. Business Logic শুধুমাত্র **Service Layer**-এ থাকবে।
2. Controller-এ কোনো Database Query লেখা যাবে না।
3. Raw SQL এড়িয়ে **Prisma ORM** ব্যবহার করতে হবে।
4. Shared Component (`AppTable`, `AppForm`, etc.) পুনঃব্যবহার করতে হবে।
5. Hardcoded Data বা Placeholder ("Coming Soon", "TODO", "Mock Data") ব্যবহার করা নিষিদ্ধ।

---

## Chapter 9: Completion Policy

কোনো Module-কে "Complete" বা "Done" বলা যাবে না যদি:
- UI অসম্পূর্ণ থাকে
- API অসম্পূর্ণ থাকে
- Database Relation মিসিং থাকে
- Build Fail করে
- Test Fail করে
- Mobile Responsive না হয়
- Physical/Screenshot Evidence না থাকে

---

## Chapter 10: Development Workflow

প্রতিটি Feature বাস্তবায়নের ধারাবাহিক ধাপ:
1. SRS পড়া ও অনুধাবন
2. Repository Scan (Pre-Scan Audit)
3. Database Design & Prisma Schema update
4. API Design & Zod Validation
5. Service Layer & Business Logic Implementation
6. Frontend Implementation & Integration
7. Build, Test (Playwright E2E) & Evidence Gathering
8. Code Review & Status Update
