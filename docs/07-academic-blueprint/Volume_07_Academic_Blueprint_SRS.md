# Volume 07 – Academic Management Blueprint (EHRJ-SRS-V07)

**Document Code:** EHRJ-SRS-V07  
**Module:** Academic Management Blueprint  
**Applies To:** Academic Administration, Teachers, Students, Guardians, Public Website  

---

## 1. Purpose & Core Engine Architecture
Academic Management হলো পুরো EHRJ ERP-এর মূল ভিত্তি। Admission, Student360, Attendance, Routine, Exam, Result, Certificate, Finance, Library, Hostel এবং Portals সহ সমস্ত মডিউল এই Master Academic Engine-এর গ্লোবাল স্ট্রাকচারের ওপর সরাসরি নির্ভর করবে।

```text
Institute ➔ Academic Session ➔ Medium ➔ Department ➔ Class ➔ Section ➔ Shift ➔ Group ➔ Subject ➔ Teacher ➔ Students
```
- **Service Event Propagation Policy:** Academic Structure-এ যেকোনো পরিবর্তন সার্ভিস-লেয়ার ইভেন্ট ও অডিট লগের মাধ্যমে সাথে সাথে সমস্ত ডিপেন্ডেন্ট মডিউলে অটোমেটিক প্রোপাগেট হতে হবে।

---

## 2. Sub-System Engines & Features

### A. Academic Session & Active Rules
- **Session Actions:** Create, Edit, Archive, Activate, Close, Session Promotion.
- **Strict Single-Active Session Policy:** সিস্টেমে যেকোনো সময়ে কেবল **১টি** Active Session থাকতে পারবে। Active Session ডিলিট করা সম্পূর্ণ নিষিদ্ধ। সেশন ক্লোজ না করে প্রমোশন চালনা করা যাবে না।

### B. Hierarchy & Resource Allocations
- **Departments & Classes:** Hifz, Qawmi, General, Dakhil, Alim, Fazil, Kamil ইত্যাদি।
- **Shifts & Groups:** Morning, Day, Evening shifts; Science, Commerce, Humanities, General, Hifz, Qawmi groups.
- **Subject & Teacher Allocation:** Subject Code, Pass Marks, Total Marks, Theory/Practical split. Teacher Workload & Collision Detection System.
- **Classroom Allocation:** Room Capacity, Building, Floor, Projector, AC, Smart Board resource tracking.

### C. Automated Student Promotion Engine

```text
Current Session Finished ➔ Results Published ➔ Promotion Rules Evaluated ➔ Next Session Allocated ➔ Previous Record Archived ➔ Roll & Section Generated ➔ Routine & Student360 Updated
```

### D. Routine & Conflict Resolution Engine
- **Validation Rules:**
  1. একই শিক্ষকের একই সময়ে দুই ক্লাসে পড়া ব্লক করা।
  2. একই রুম একই সময়ে দুই ক্লাসের জন্য বরাদ্দ ব্লক করা।
  3. একই বিষয়ের রুটিন সেশন শিডিউল কনফ্লিক্ট ডিটেকশন।

---

## 3. Scalability & Performance Standard
- **50,000+ Students Ready:** সেশন, ক্লাস, সেকশন ও সাবজেক্ট টেবিল সমূহে প্রসপেক্টিভ Prisma Indexing।
- **High-Speed Redis Caching:** একাডেমিক লুকআপ ডাটা রেডিস ক্যাশ লেয়ারে সংরক্ষিত থাকবে।
- **Background Jobs:** প্রমোশন এবং বাল্ক স্টুডেন্ট অ্যাসাইনমেন্ট BullMQ ব্যাকগ্রাউন্ড জবস দিয়ে এক্সিকিউট হবে।

---

## 4. REST API Integration Contracts (16 Endpoints)
- `GET /api/v1/academic/dashboard`
- `GET /api/v1/academic/sessions`
- `POST /api/v1/academic/sessions`
- `PUT /api/v1/academic/sessions/:id`
- `GET /api/v1/academic/departments`
- `GET /api/v1/academic/classes`
- `GET /api/v1/academic/sections`
- `GET /api/v1/academic/shifts`
- `GET /api/v1/academic/groups`
- `GET /api/v1/academic/subjects`
- `POST /api/v1/academic/subjects`
- `GET /api/v1/academic/routine`
- `POST /api/v1/academic/routine`
- `GET /api/v1/academic/calendar`
- `POST /api/v1/academic/promote`
- `GET /api/v1/academic/reports`

---

## 5. Master Database Entities Mapped (19 Entities)
`AcademicSession`, `Department`, `Class`, `Section`, `Shift`, `Group`, `Subject`, `SubjectTeacher`, `StudentAcademic`, `TeacherAcademic`, `AcademicCalendar`, `Routine`, `Classroom`, `Curriculum`, `Book`, `LessonPlan`, `PromotionHistory`, `AcademicSetting`, `AuditLog`

---

## 6. RBAC Permission Matrix Keys
- `academic.view`, `academic.create`, `academic.update`, `academic.delete`, `academic.promote`, `academic.assign.teacher`, `academic.assign.student`, `academic.routine.manage`, `academic.settings.manage`, `academic.report.export`

---

## 7. Verification & 15-Point Completion Condition
Academic Blueprint বাস্তবায়িত বলা যাবে কেবল তখনই যখন:
- [ ] সমস্ত ১৯টি এনটিটি ডাটাবেসে সচল থাকবে।
- [ ] এন্ড-টু-এন্ড সেশন প্রমোশন সফলভাবে এক্সিকিউট হবে।
- [ ] রুটিন ইঞ্জিন কনফ্লিক্ট ভ্যালিডেশন পাস করবে।
- [ ] শিক্ষক ও ছাত্র অ্যাসাইনমেন্ট সিঙ্কড হবে।
- [ ] Student360 এবং ড্যাশবোর্ড অটোমেটিক আপডেট হবে।
- [ ] সমস্ত এপিআই রিয়েল ডাটাবেস ব্যবহার করবে (Zero Placeholder/Mock Data)।
- [ ] RBAC এবং Permission validation সক্রিয় থাকবে।
- [ ] TypeScript Build (`npm run build`) সফল হবে।
- [ ] Production Build পাস করবে।
- [ ] Playwright E2E Test Suite সম্পূর্ণ পাস করবে।
- [ ] Runtime Verification সফল হবে।
- [ ] Physical Screenshot Evidence সংরক্ষিত থাকবে।
- [ ] Physical Screen Recording Evidence সংরক্ষিত থাকবে।
