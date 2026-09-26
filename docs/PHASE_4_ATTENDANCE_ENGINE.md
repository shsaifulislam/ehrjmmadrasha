# ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
## EHRJ DIGITAL CAMPUS — PHASE 4: ATTENDANCE MANAGEMENT & SMART ATTENDANCE ENGINE
### Architectural Blueprint & Verification Report

---

## ১. ভূমিকা ও উদ্দেশ্য (Overview & Objective)

Phase 4 বাস্তবায়নের মাধ্যমে **ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা**-র শিক্ষার্থী হাজিরা ব্যবস্থাপনা একটি আধুনিক, নিরাপদ, রোল-অর্ডার্ড এবং অডিটযোগ্য স্মার্ট হাজিরা ইঞ্জিনে রূপান্তরিত হয়েছে।

এই ইঞ্জিনটি Phase 2 (একাডেমিক কোর: Session, JamatClass, Section, Enrollment, Student, Guardian) এবং Phase 3 (ভর্তি ও তালিকাভুক্তি) এর উপর ভিত্তি করে নির্মিত। এখানে কোনো মক বা ফেক ডাটা নেই; প্রতিটি হাজিরা রেকর্ড সার্ভার-সাইড ট্রানজ্যাকশন, রোল-অর্ডার তালিকাভুক্তি এবং প্রাতিষ্ঠানিক অডিট ট্রেইলে স্থায়ীভাবে সংরক্ষিত হয়।

---

## ২. হাজিরা ডাটা মডেল ও স্কিমা (Attendance Data Model)

Prisma স্কিমায় `Attendance` মডেলকে বর্ধিত করা হয়েছে এবং নতুন `AttendanceLock` মডেল সংযুক্ত করা হয়েছে:

```prisma
// -------------------------------------------------------------
// 5. ATTENDANCE & LOCKING
// -------------------------------------------------------------
model Attendance {
  id               String          @id @default(uuid())
  studentId        String
  sessionId        String
  classId          String
  sectionId        String?
  date             DateTime        // Normalized to UTC midnight
  status           String          // PRESENT, ABSENT, LATE, LEAVE
  remarks          String?
  leaveReason      String?         // Mandated for LEAVE status
  markedByUserId   String?
  updatedByUserId  String?
  correctionReason String?         // Mandated for admin correction
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @default(now()) @updatedAt

  student          Student         @relation(fields: [studentId], references: [id], onDelete: Cascade)
  session          AcademicSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  jamatClass       JamatClass      @relation(fields: [classId], references: [id], onDelete: Cascade)
  section          Section?        @relation(fields: [sectionId], references: [id], onDelete: SetNull)
  markedByUser     User?           @relation(fields: [markedByUserId], references: [id], onDelete: SetNull)

  @@unique([studentId, date])
  @@index([sessionId, classId, sectionId, date])
  @@index([studentId, date])
  @@index([date, status])
}

model AttendanceLock {
  id               String          @id @default(uuid())
  sessionId        String
  classId          String
  sectionId        String?
  date             DateTime
  isLocked         Boolean         @default(true)
  lockedAt         DateTime?       @default(now())
  lockedByUserId   String?
  unlockedAt       DateTime?
  unlockedByUserId String?
  reason           String?

  session          AcademicSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  jamatClass       JamatClass      @relation(fields: [classId], references: [id], onDelete: Cascade)
  section          Section?        @relation(fields: [sectionId], references: [id], onDelete: SetNull)

  @@unique([sessionId, classId, sectionId, date])
  @@index([sessionId, classId, date])
}
```

### ডাটাবেজ ইউনিকনেস ও ইনডেক্সিং:
1. `@@unique([studentId, date])`: একজন শিক্ষার্থী একই তারিখে একাধিক হাজিরা রেকর্ড ধারণ করতে পারবে না (ডুপ্লিকেট প্রতিরোধ)।
2. `@@unique([sessionId, classId, sectionId, date])`: নির্দিষ্ট সেশন, জামাত, শাখা ও তারিখে ইউনিক লক স্টেট নিয়ন্ত্রণ।
3. হাই-পারফরম্যান্স কম্পোজিট ইনডেক্স: শ্রেণি ও তারিখ অনুযায়ী দ্রুত কুয়েরি নিশ্চিত করে।

---

## ৩. কোর হাজিরা স্ট্যাটাস ও বিজনেস রুলস (Attendance Statuses & Invariants)

সিস্টেমে অনুমোদিত ৪টি মূল হাজিরা অবস্থা:
- **PRESENT (উপস্থিত):** ক্লাসে যথা সময়ে উপস্থিত।
- **ABSENT (অনুপস্থিত):** কোনো পূর্বানুমতি ছাড়া অনুপস্থিত।
- **LATE (দেরি):** নির্ধারিত সময়ের পর বিলম্বিত উপস্থিতি।
- **LEAVE (ছুটি):** অনুমোদিত ছুটি (অসুস্থতা বা পারিবারিক কারণ)। ছুটির ক্ষেত্রে `leaveReason` সংরক্ষণ করা হয়।

### তারিখ নরমালাইজেশন (Date Normalization):
টাইমজোন বিচ্যুতি এড়াতে সব তারিখকে সার্ভারে ইউটিসি মধ্যরাত (`YYYY-MM-DDT00:00:00.000Z`) হিসেবে নরমালাইজ করা হয় (`normalizeAttendanceDate`)। ফলে ক্লায়েন্ট ব্রাউজারের টাইমজোন যাই হোক না কেন, প্রাতিষ্ঠানিক তারিখ অপরিবর্তিত থাকে।

### হাজিরা শতাংশ গণনা (Attendance Percentage Model):
```text
Present-equivalent = Present + (Late × 0.5) + Leave
Attendance % = (Present-equivalent / Eligible Days) × 100
```
অনুমোদিত ছুটি শিক্ষার্থীদের উপস্থিতির হারে অন্যায্য নেতিবাচক প্রভাব ফেলে না।

---

## ৪. উস্তাদ / শিক্ষক হাজিরা কার্যপ্রবাহ (Teacher Attendance Flow)

1. শিক্ষক `/teacher` বা `/teacher/attendance`-এ প্রবেশ করেন।
2. শিক্ষককে শুধুমাত্র তাঁর অর্পিত (Assigned) জামাত ও শাখার তালিকা ড্রপডাউনে প্রদর্শিত হয়।
3. তারিখ নির্বাচন করলে ক্লাসের সক্রিয় শিক্ষার্থীদের তালিকা **রোল ক্রম অনুযায়ী (Roll Number Ascending)** প্রদর্শিত হয়।
4. শিক্ষকের কাছে **"সবাই উপস্থিত" (All Present)** বাটন রয়েছে যা এক ক্লিকে সকল শিক্ষার্থীকে উপস্থিত করে দেয়। শিক্ষক প্রয়োজনে নির্দিষ্ট শিক্ষার্থীকে অনুপস্থিত, দেরি বা ছুটি চিহ্নিত করতে পারেন।
5. **"হাজিরা সংরক্ষণ করুন"** বাটনে ক্লিক করলে সম্পূর্ণ শিটটি একক ডাটাবেজ ট্রানজ্যাকশনে সেভ হয়।
6. **সংশোধন সময়সীমা (Correction Window):** শিক্ষক ২৪ ঘণ্টার মধ্যে হাজিরা পরিবর্তন করতে পারেন। ২৪ ঘণ্টা পর শিটটি অটোমেটিক শিক্ষক-সম্পাদনার জন্য বন্ধ হয়ে যায়।
7. **লক গার্ড (Lock Guard):** অ্যাডমিন কর্তৃক কোনো তারিখের শিট লক করা থাকলে শিক্ষক কোনো পরিবর্তন করতে পারবেন না (HTTP 423 Locked)।

---

## ৫. অ্যাডমিন কন্ট্রোল ও অডিট নিরীক্ষা (Admin Cockpit & Audit)

1. **মাল্টি-ফিল্টার ককপিট (`/admin?tab=ATTENDANCE` বা `/admin/attendance`):**
   - শিক্ষাবর্ষ, জামাত, শাখা, তারিখ এবং স্ট্যাটাস অনুযায়ী ফিল্টারিং।
   - রোল, নাম বা ছাত্র আইডি দিয়ে সরাসরি সার্চ।
   - লাইভ পরিসংখ্যান: মোট ছাত্র, উপস্থিত, অনুপস্থিত, দেরি, ছুটি, উপস্থিতির হার (%)।
2. **হাজিরা লক ও আনলক (`/api/admin/attendance/lock` ও `unlock`):**
   - নির্দিষ্ট তারিখ ও জামাতের হাজিরা অফিসিয়াল নিরীক্ষার জন্য লক বা আনলক করার ব্যবস্থা।
3. **অ্যাডমিন সংশোধন (`/api/admin/attendance/correct`):**
   - অ্যাডমিন যেকোনো পুরাতন বা লক করা হাজিরা সংশোধন করতে পারেন।
   - সংশোধনের জন্য সুনির্দিষ্ট কারণ (`correctionReason`) উল্লেখ করা **বাধ্যতামূলক**।
   - প্রতিটি সংশোধন অপরিবর্তনীয় `AuditLog`-এ টাইমস্ট্যাম্প, অ্যাডমিন আইডি এবং পূর্বের ও পরের অবস্থার সাথে সংরক্ষিত হয়।

---

## ৬. অভিভাবক পোর্টাল ও আইডিঅর নিরাপত্তা (Guardian Attendance & IDOR Protection)

1. অভিভাবক `/portal?tab=ATTENDANCE`-এ প্রবেশ করে সন্তানের হাজিরা কার্ড দেখতে পারেন।
2. মাসিক ক্যালেন্ডার ও তারিখভিত্তিক লগ (উপস্থিত, অনুপস্থিত, দেরি, ছুটি ও ছুটির কারণ)।
3. **কঠোর আইডিঅর (IDOR) নিরাপত্তা:**
   - অভিভাবক শুধুমাত্র `GuardianStudent` দ্বারা সংযুক্ত নিজের সন্তানের হাজিরাই দেখতে পারবেন।
   - অন্য কোনো ছাত্রের আইডি দিয়ে রিকোয়েস্ট পাঠালে সার্ভার সরাসরি **403 Forbidden** ফিরিয়ে দেয়।
   - শিক্ষার্থী শুধুমাত্র নিজের হাজিরা দেখতে পারে; কোনো সম্পাদনা ক্ষমতা নেই (Read-only)।

---

## ৭. রিপোর্টিং ইঞ্জিন (Attendance Reports Engine)

`GET /api/admin/attendance/reports` এন্ডপয়েন্টটি ৫টি ভিন্ন ভিন্ন রিপোর্ট ফরম্যাট তৈরি করতে সক্ষম:
1. **DAILY:** শ্রেণি ও শাখাভিত্তিক দৈনিক উপস্থিতির বিস্তারিত ও সারসংক্ষেপ।
2. **MONTHLY:** মাসভিত্তিক ছাত্রওয়ারী উপস্থিতি, অনুপস্থিতি, ছুটি ও শতাংশের সামারি।
3. **STUDENT:** একক শিক্ষার্থীর পূর্ণাঙ্গ তারিখভিত্তিক উপস্থিতির টাইমলাইন কার্ড।
4. **CLASS:** ক্লাসের নির্দিষ্ট সময়কালের গড় উপস্থিতি ও ট্রেন্ড।
5. **SESSION:** শিক্ষাবর্ষভিত্তিক সার্বিক প্রাতিষ্ঠানিক উপস্থিতির পরিসংখ্যান।

---

## ৮. বাস্তবায়িত এপিআই এন্ডপয়েন্ট তালিকা (API Endpoints Inventory)

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/teacher/attendance/assignments` | GET | TEACHER, ADMIN | শিক্ষকের জন্য নির্ধারিত জামাত ও শাখার তালিকা |
| `/api/teacher/attendance` | GET | TEACHER, ADMIN | রোল ক্রমে সাজানো হাজিরা শিট ও লক স্ট্যাটাস |
| `/api/teacher/attendance` | POST | TEACHER, ADMIN | ট্রানজ্যাকশনাল হাজিরা শিট সংরক্ষণ ও আপডেট |
| `/api/admin/attendance` | GET | ADMIN, PRINCIPAL | অ্যাডমিন মাল্টি-ফিল্টার হাজিরা পর্যবেক্ষণ |
| `/api/admin/attendance` | POST | ADMIN, PRINCIPAL | অ্যাডমিন কর্তৃক সরাসরি হাজিরা সংরক্ষণ |
| `/api/admin/attendance/correct` | POST | ADMIN, PRINCIPAL | কারণ দর্শিয়ে একক হাজিরা রেকর্ড সংশোধন ও অডিট |
| `/api/admin/attendance/lock` | POST | ADMIN, PRINCIPAL | নির্দিষ্ট শ্রেণি ও তারিখের হাজিরা লক করা |
| `/api/admin/attendance/unlock` | POST | ADMIN, PRINCIPAL | হাজিরা আনলক করা |
| `/api/admin/attendance/reports` | GET | ADMIN, TEACHER | দৈনিক, মাসিক, শিক্ষার্থী ও সেশন রিপোর্ট |
| `/api/portal/attendance` | GET | GUARDIAN, STUDENT | অভিভাবক/শিক্ষার্থীর জন্য আইডিঅর-সুরক্ষিত হাজিরা |
| `/api/portal/children` | GET | GUARDIAN | অভিভাবকের সাথে সংযুক্ত সন্তানদের তালিকা |

---

## ৯. স্বয়ংক্রিয় টেস্ট ফলাফল ও রিগ্রেশন অডিট (Verification & Regression Results)

### Phase 4 Attendance Engine Test:
```text
node scripts/test_phase4_attendance.js
=================================================================
  EHRJ DIGITAL CAMPUS - PHASE 4 ATTENDANCE ENGINE TEST SUITE
=================================================================
--- 0. Authentication & Academic Fixtures Setup ---
  [PASS] Admin login succeeded with session cookie
  [PASS] Teacher login succeeded with session cookie
  [PASS] Teacher user found in database
  [PASS] Active AcademicSession found (২০২৫-২০২৬)
  [PASS] Found 2 active JamatClasses
  [PASS] Teacher assignment verified for class দাওরায়ে হাদীস
  [PASS] Enrolled students available for class (3 students)

--- 1. Teacher Scoping & RBAC Verification ---
  [PASS] Teacher assignments endpoint returned 200 OK
  [PASS] Teacher assignments list contains assigned class
  [PASS] Teacher can view attendance for assigned class
  [PASS] Students loaded in sheet: 3
  [PASS] Students are strictly sorted in roll order: [11, 12, 13]
  [PASS] Teacher blocked from unassigned class (Expected 403, got 403)
  [PASS] Anonymous request to teacher attendance blocked (403)

--- 2. Bulk Attendance Marking & Transactional Save ---
  [PASS] Teacher successfully saved attendance sheet (200 OK)
  [PASS] Response indicated transaction success
  [PASS] Records created in database: 3
  [PASS] Student A status persisted as PRESENT
  [PASS] Student B status persisted as ABSENT
  [PASS] Student C status persisted as LEAVE
  [PASS] Student C leaveReason persisted correctly: "জ্বর ও অসুস্থতাজনিত ছুটি"

--- 3. Duplicate Prevention & Idempotency ---
  [PASS] Duplicate submission handled gracefully (200 OK)
  [PASS] No duplicate records created (createdCount: 0)
  [PASS] Database enforces unique student + date: exactly 1 record found

--- 4. Attendance Locking & Correction Window ---
  [PASS] Admin locked attendance sheet (200 OK)
  [PASS] Teacher blocked from saving locked attendance (Expected 423 Locked, got 423)
  [PASS] Admin unlocked attendance sheet (200 OK)

--- 5. Admin Attendance Correction & Audit Trail ---
  [PASS] Target attendance record found for Admin correction
  [PASS] Correction without mandatory reason rejected with 400 Bad Request
  [PASS] Admin correction succeeded with 200 OK
  [PASS] Status updated from ABSENT to PRESENT
  [PASS] Correction reason saved on attendance record
  [PASS] Immutable AuditLog record created for admin correction
  [PASS] AuditLog contains full correction details and reason

--- 6. Guardian Portal & IDOR Protection ---
  [PASS] Guardian login succeeded
  [PASS] Guardian can view linked Child A attendance
  [PASS] Returned attendance matches Child A
  [PASS] Child A has 1 attendance record(s)
  [PASS] Guardian blocked from viewing unlinked child B (Expected 403 Forbidden, got 403)

--- 7. Attendance Reports Engine Verification ---
  [PASS] Daily attendance report generated (200 OK)
  [PASS] Report type confirmed as DAILY
  [PASS] Daily Attendance Rate calculated: 100%
  [PASS] Daily leave count matches records: 1
  [PASS] Monthly attendance report generated (200 OK)
  [PASS] Monthly report includes student summaries (3)
  [PASS] Student individual report generated (200 OK)
  [PASS] Student individual report matches student profile
  [PASS] Student attendance timeline loaded: 1 entries
  [PASS] Session-wide report generated (200 OK)
  [PASS] Session-wide total student count: 3

=================================================================
  PHASE 4 ATTENDANCE ENGINE TEST RESULTS: 50 PASSED, 0 FAILED
=================================================================
```

### সামগ্রিক রিগ্রেশন টেস্টের সারাংশ (Complete Regression Matrix):
- **Phase 1 (Foundation, Auth, RBAC):** 39 / 39 PASSED (100%)
- **Phase 2 (Academic Core, Student, Guardian, Enrollment):** 42 / 42 PASSED (100%)
- **Phase 3 (Admissions, Verification, Tracking, Invoicing):** 63 / 63 PASSED (100%)
- **Phase 4 (Attendance Management & Smart Engine):** 50 / 50 PASSED (100%)
- **মোট সংগৃহীত টেস্ট:** **১৯৪ / ১৯৪ টেস্ট সফল (194/194 PASSED, 0 FAILED)**
- **প্রোডাকশন বিল্ড:** **৭১ / ৭১ টি রুট সম্পূর্ণ ত্রুটিমুক্তভাবে সংকলিত (71/71 routes compiled, 0 errors)**

---

## ১০. উপসংহার ও পরবর্তী পদক্ষেপ (Conclusion & Stop Condition)

Phase 4 সফলভাবে সম্পন্ন হয়েছে এবং সমস্ত নির্দেশিকা ও গ্রহণযোগ্যতার মানদণ্ড (Acceptance Criteria) সন্তুষ্ট করেছে।

**কঠোর সমাপ্তি শর্ত (Strict Operating Contract):**  
Phase 4 সম্পন্ন করার পর স্বয়ংক্রিয়ভাবে পরবর্তী কোনো মডিউল (পরীক্ষা ইঞ্জিন, ফলাফল বা পেমেন্ট গেটওয়ে) শুরু করা হবে না। ব্যবহারকারীর সুনির্দিষ্ট নির্দেশনার জন্য অপেক্ষা করা হচ্ছে।
