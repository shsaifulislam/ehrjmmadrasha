# ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
## EHRJ DIGITAL CAMPUS — PHASE 3: ADMISSION, VERIFICATION & ENROLLMENT WORKFLOW
### Architectural Blueprint & Verification Report

---

## ১. ভূমিকা ও উদ্দেশ্য (Overview & Objective)

Phase 3 সফলভাবে বাস্তবায়নের মাধ্যমে ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার অনলাইন ও অফলাইন শিক্ষার্থী ভর্তি প্রক্রিয়াকে সম্পূর্ণ অটোমেটেড, যাচাইযোগ্য, নিরাপদ এবং ট্রানজ্যাকশনাল কাঠামোর আওতায় আনা হয়েছে। 

এই মডিউলটি Phase 2-এ প্রতিষ্ঠিত একাডেমিক কোর (Session, JamatClass, Section, Student, Guardian, Enrollment, FeeInvoice, AuditLog)-এর উপর নির্মিত। কোনো ফেক বা ফ্রন্টএন্ড-অনলি অনুমোদন নয়, প্রতিটি ধাপ সার্ভার-সাইড প্রিজমা ট্রানজ্যাকশন ও বাস্তব ডাটাবেজ স্থায়িত্বের সাথে সংযুক্ত।

---

## ২. ভর্তি ডাটা মডেল ও ফিল্ডসমূহ (Admission Data Model)

Prisma স্কিমা `Application` মডেলটি Phase 3-এর সকল চাহিদা অনুযায়ী বর্ধিত করা হয়েছে:

```prisma
model Application {
  id                          String    @id @default(uuid())
  applicationNumber           String    @unique // e.g. "EHRJ-ADM-2026-0001"
  source                      String    @default("ONLINE") // ONLINE, OFFICE
  sessionId                   String?
  desiredClassId              String
  desiredSectionId            String?
  studentNameBn               String
  studentNameEn               String
  studentNameAr               String?
  dateOfBirth                 DateTime
  gender                      String    // MALE, FEMALE
  bloodGroup                  String?
  birthCertificateNo          String?
  nidNo                       String?
  nationality                 String    @default("Bangladeshi")
  desiredResidentialStatus    String    @default("NON_RESIDENTIAL") // RESIDENTIAL, NON_RESIDENTIAL, DAY_CARE
  fatherNameBn                String?
  fatherPhone                 String?
  fatherOccupation            String?
  motherNameBn                String?
  motherPhone                 String?
  guardianName                String
  guardianPhone               String
  guardianEmail               String?
  guardianRelation            String?   @default("FATHER")
  guardianAddress             String?
  address                     String
  presentAddress              String?
  permanentAddress            String?
  previousInstitute           String?
  previousClass               String?
  isOrphan                    Boolean   @default(false)
  isFinanciallyWeak           Boolean   @default(false)
  financialAssistanceRequested Boolean  @default(false)
  specialAssistanceDetails    String?
  documentsJson               String?   // JSON list of uploaded doc objects
  submissionToken             String?   @unique // Idempotency protection
  status                      String    @default("SUBMITTED") // SUBMITTED, UNDER_REVIEW, VERIFICATION, EXAM_INTERVIEW, CORRECTION_REQUESTED, APPROVED, REJECTED
  remarks                     String?
  reviewNotes                 String?
  verificationStatus          String?   @default("PENDING") // PENDING, VERIFIED, REJECTED
  verificationNotes           String?
  verifiedByUserId            String?
  examInterviewScheduledAt    DateTime?
  examInterviewResult         String?   // PASS, FAIL
  correctionReason            String?
  rejectionReason             String?
  rejectedByUserId            String?
  approvedByUserId            String?
  createdStudentId            String?
  submittedAt                 DateTime  @default(now())
  reviewedAt                  DateTime?
  approvedAt                  DateTime?
  rejectedAt                  DateTime?
  createdAt                   DateTime  @default(now())
  updatedAt                   DateTime  @updatedAt
}
```

---

## ৩. ইউনিক ট্র্যাকিং নম্বর জেনারেশন (Tracking ID Format)

- **ফরম্যাট:** `EHRJ-ADM-YYYY-XXXX` (যেমন: `EHRJ-ADM-2026-0001`)
- **বৈশিষ্ট্য:**
  - সম্পূর্ণ সার্ভার-সাইড জেনারেটেড (`src/lib/admissionId.ts`).
  - কনকারেন্সি-সেফ ও ইউনিক ইন্ডেক্সযুক্ত।
  - তৈরি হওয়ার পর অপরিবর্তনীয় (Immutable)।
  - শিক্ষার্থীর চূড়ান্ত রোল ও স্থায়ী আইডি (`EHRJ-YYYY-XXXX`) থেকে সম্পূর্ণ পৃথক।

---

## ৪. ডুপ্লিকেট শনাক্তকরণ ইঞ্জিন (Duplicate Detection Engine)

ভর্তি আবেদনের তথ্যের সাথে পূর্ববর্তী আবেদন এবং ভর্তি হওয়া শিক্ষার্থীদের তথ্য স্বয়ংক্রিয়ভাবে তুলনা করা হয় (`src/lib/duplicateDetection.ts`):

1. **HIGH CONFIDENCE (উচ্চ নিশ্চয়তা):**
   - জন্ম নিবন্ধন নম্বর (Birth Certificate No) অথবা জাতীয় পরিচয়পত্র (NID) হুবহু মিলে গেলে।
2. **MEDIUM CONFIDENCE (মাঝারি নিশ্চয়তা):**
   - অভিভাবকের ফোন নম্বর + শিক্ষার্থীর জন্মতারিখ হুবহু মিলে গেলে।
3. **LOW CONFIDENCE (সাধারণ মিল):**
   - শুধুমাত্র একই নাম বা নাম অংশের মিল।

> **অপরিবর্তনীয় মূলনীতি:** ডুপ্লিকেট সতর্কবার্তা কখনোই স্বয়ংক্রিয়ভাবে আবেদন বাতিল করে না। অ্যাডমিন ককপিটে **“সম্ভাব্য পূর্ববর্তী রেকর্ড পাওয়া গেছে”** সতর্কবার্তা প্রদর্শন করে অ্যাডমিনকে সিদ্ধান্তের সুযোগ দেওয়া হয় (যেমন: বিদ্যমান শিক্ষার্থীর সাথে নতুন সেশনের লিংক করা)।

---

## ৫. ডুপ্লিকেট সাবমিশন ও রিফ্রেশ সুরক্ষা (Idempotency Guard)

- প্রতিটি অনলাইন ফর্ম লোডের সময় একটি অনন্য ক্রিপ্টোগ্রাফিক বা টাইমস্ট্যাম্পড `submissionToken` তৈরি হয়।
- সাবমিট বাটনে ডাবল-ক্লিক বা নিশ্চিতকরণ পেজ রিফ্রেশ করলেও ডাটাবেজে একাধিক আবেদন সৃষ্টি হয় না।
- পূর্বের আবেদন ইতিমধ্যে গৃহীত থাকলে সার্ভার বিদ্যমান ট্র্যাকিং নম্বর নিরাপদে ফিরিয়ে দেয়।

---

## ৬. অ্যাডমিন রিভিউ ও ওয়ার্কফ্লো রূপান্তর (Workflow State Machine)

```
SUBMITTED (দাখিলকৃত)
   ↓
UNDER_REVIEW (পর্যালোচনাধীন — /api/admin/admissions/:id/review)
   ↓
VERIFICATION (কাগজপত্র যাচাই — /api/admin/admissions/:id/verify)
   ↓
EXAM_INTERVIEW (ঐচ্ছিক পরীক্ষা/সাক্ষাতকার — /api/admin/admissions/:id/exam-interview)
   ↓
[CORRECTION_REQUESTED] (সংশোধন অনুরোধ — /api/admin/admissions/:id/correction)
   ↓
APPROVED (চূড়ান্ত অনুমোদন)  /  REJECTED (বাতিল — কারণসহ সংরক্ষণ)
```

- **বাতিল নীতি:** বাতিলকৃত আবেদন কখনোই ডাটাবেজ থেকে মোছা হয় না। সুনির্দিষ্ট কারণসহ অডিট ট্রেইলে সংরক্ষিত থাকে।
- **অবস্থা ভ্যালিডেশন:** একবার `APPROVED` হয়ে যাওয়া আবেদন পুনরায় বাতিল বা রিভিউতে নেওয়া যায় না।

---

## ৭. ট্রানজ্যাকশনাল অনুমোদন ইঞ্জিন (Atomic Approval Transaction)

অ্যাডমিন যখন **ভর্তি চূড়ান্ত অনুমোদন** করেন, তখন ব্যাকএন্ডে একটি পারমাণবিক ডেটাবেজ ট্রানজ্যাকশন পরিচালিত হয় (`src/lib/admissionApproval.ts`):

```text
BEGIN TRANSACTION:
  1. Validate Application existence & ensure status !== "APPROVED" (Double Approval Guard).
  2. Validate Target Class and Academic Session.
  3. Check Student Conflict / Link to Existing Student if requested.
  4. Generate Permanent Student ID (EHRJ-YYYY-XXXX).
  5. Create Student Master Record.
  6. Create / Link Guardian by phone and set GuardianStudent with isPrimary: true.
  7. Concurrency-safe Roll Number Generation for Class + Section.
  8. Create Enrollment record with ACTIVE status.
  9. Create Initial FeeInvoice:
     - ইয়াতীম (Orphan) শিক্ষার্থী হলে ১০০% ফি মওকুফ (Total: 1500, Discount: 1500, Net: 0, Status: WAIVED).
     - সাধারণ শিক্ষার্থী হলে নির্ধারিত ফি (Total: 1500, Net: 1500, Status: UNPAID).
 10. Update Application status to APPROVED with createdStudentId & approvedAt.
 11. Create immutable AuditLog entry.
COMMIT TRANSACTION
```

> **নিরাপত্তা গ্যারান্টি:** ট্রানজ্যাকশনের যেকোনো একটি ধাপে ব্যর্থতা দেখা দিলে সম্পূর্ণ অপারেশন স্বয়ংক্রিয়ভাবে ROLLBACK হয়। কোনো অর্ধ-নির্মিত বা অসম্পূর্ণ রেকর্ড ডাটাবেজে থাকে না।

---

## ৮. পাবলিক ট্র্যাকিং ও ডেটা গোপনীয়তা (Public Privacy Audit)

পাবলিক ট্র্যাকিং পেজ (`/admission/track`) এবং এপিআই (`/api/admissions/track`):
- **প্রদর্শনযোগ্য:** ট্র্যাকিং আইডি, শিক্ষার্থীর বাংলা নাম, জামাত, আবেদনের তারিখ, বর্তমান অবস্থা এবং পরবর্তী করণীয় সংক্রান্ত সুস্পষ্ট বাংলা নির্দেশনা।
- **কঠোরভাবে নিষিদ্ধ ও অপ্রকাশিত:** শিক্ষার্থীর এনআইডি, জন্ম নিবন্ধন নম্বর, অভিভাবকের ব্যক্তিগত তথ্য, অভ্যন্তরীণ অ্যাডমিন নোট এবং অভ্যন্তরীণ অডিট লগ কোনো অবস্থাতেই পাবলিক এপিআই দিয়ে এক্সপোজ করা হয় না।

---

## ৯. এপিআই সারফেস (API Inventory)

### পাবলিক এপিআই
| মেথড | এন্ডপয়েন্ট | বিবরণ |
|---|---|---|
| `POST` | `/api/admissions/apply` | অনলাইন আবেদনপত্র জমাদান (Idempotency Token সহ) |
| `POST` | `/api/admissions/check-duplicate` | ফর্ম পূরণের সময় লাইভ ডুপ্লিকেট তথ্য চেক |
| `GET` | `/api/admissions/track` | আবেদন ট্র্যাকিং (Query param: trackingId / phone) |
| `GET` | `/api/admissions/track/:trackingId` | রেস্টফুল ট্র্যাকিং এপিআই |

### অ্যাডমিন এপিআই (Role: ADMIN Only)
| মেথড | এন্ডপয়েন্ট | বিবরণ |
|---|---|---|
| `GET` | `/api/admin/admissions` | ভর্তি তালিকা, ফিল্টারিং, অনুসন্ধান ও মেট্রিক্স পরিসংখ্যান |
| `POST` | `/api/admin/admissions` | অফিস স্টাফ কর্তৃক সরাসরি ভর্তি আবেদন এন্ট্রি |
| `GET` | `/api/admin/admissions/:id` | আবেদনের পূর্ণ বিবরণ, ডুপ্লিকেট ম্যাচ ও অডিট লগ |
| `PATCH` | `/api/admin/admissions/:id` | শাখা বা রিভিউ নোট সংশোধন |
| `POST` | `/api/admin/admissions/:id/review` | রিভিউ শুরু (UNDER_REVIEW) |
| `POST` | `/api/admin/admissions/:id/verify` | কাগজপত্র যাচাইকরণ সম্পন্ন (VERIFICATION) |
| `POST` | `/api/admin/admissions/:id/exam-interview` | পরীক্ষা/সাক্ষাতকার নির্ধারণ ও ফলাফল (EXAM_INTERVIEW) |
| `POST` | `/api/admin/admissions/:id/correction` | আবেদনকারীর নিকট সংশোধনের অনুরোধ (CORRECTION_REQUESTED) |
| `POST` | `/api/admin/admissions/:id/reject` | সুনির্দিষ্ট কারণসহ আবেদন বাতিল (REJECTED) |
| `POST` | `/api/admin/admissions/:id/approve` | **পারমাণবিক ট্রানজ্যাকশন অনুমোদন** |
| `GET` | `/api/admin/admissions/:id/audit` | আবেদনের নির্দিষ্ট অডিট ট্রেইল সংগ্রহ |

---

## ১০. টেস্ট ভেরিফিকেশন ও ফলাফল (Verification Results)

```text
=================================================================
  EHRJ DIGITAL CAMPUS - PHASE 3 ADMISSION & ENROLLMENT TEST SUITE
=================================================================
--- 0. Authentication Setup ---
  [PASS] Admin login succeeded with session cookie
  [PASS] Teacher login succeeded with session cookie
  [PASS] Active JamatClass found for testing (শিশু শ্রেণি)

--- 1. Online Application Submission & Tracking ID ---
  [PASS] Online application submitted successfully (HTTP 200)
  [PASS] Tracking ID correctly formatted as EHRJ-ADM-YYYY-XXXX: EHRJ-ADM-2026-0008
  [PASS] Initial application status is SUBMITTED
  [PASS] Application source marked as ONLINE

--- 2. Duplicate Submission Idempotency Guard ---
  [PASS] Duplicate submit returned 200 without error
  [PASS] Duplicate submission flagged and prevented re-creation
  [PASS] Returned existing tracking ID safely

--- 3. Duplicate Record Detection Engine ---
  [PASS] Check duplicate API returned 200
  [PASS] HIGH confidence match detected by birth certificate number without blocking
  [PASS] MEDIUM confidence match detected by Guardian phone + DOB
  [PASS] Application with duplicate record was NOT rejected automatically
  [PASS] Returned hasDuplicateWarning: true for Admin review

--- 4. Office Admission by Admin ---
  [PASS] Office admission created successfully by Admin
  [PASS] Office application source is OFFICE

--- 5. Admin Admission Dashboard & Filter API ---
  [PASS] Admin admissions list fetched successfully
  [PASS] Stats total correctly counted: 10
  [PASS] Admissions records array returned

--- 6. Workflow Transitions: Review, Verify, Exam, Correction ---
  [PASS] Transition to UNDER_REVIEW succeeded
  [PASS] Application status updated to UNDER_REVIEW
  [PASS] Transition to VERIFICATION succeeded
  [PASS] Status updated to VERIFICATION
  [PASS] Verification status is VERIFIED
  [PASS] Transition to EXAM_INTERVIEW succeeded
  [PASS] Status updated to EXAM_INTERVIEW
  [PASS] Exam result set to PASS
  [PASS] Correction request submitted successfully
  [PASS] Status updated to CORRECTION_REQUESTED
  [PASS] Rejection recorded successfully with reason
  [PASS] Application status updated to REJECTED
  [PASS] Rejected application remains preserved in database (never deleted)

--- 7. Transactional Admission Approval (Orphan 100% Fee Waiver) ---
  [PASS] Admission approval transaction succeeded (HTTP 200)
  [PASS] Permanent Student ID generated correctly (EHRJ-YYYY-XXXX): EHRJ-2026-0005
  [PASS] Valid roll number assigned: 2
  [PASS] Student master profile created in database
  [PASS] Student ID matches in DB
  [PASS] Student orphan status preserved
  [PASS] Guardian linked as primary guardian
  [PASS] Guardian phone matches application
  [PASS] Active enrollment record created
  [PASS] Enrollment roll matches approval output
  [PASS] Initial FeeInvoice created for new student
  [PASS] Orphan student granted 100% waiver (netAmount: 0, status: WAIVED)
  [PASS] Application status updated to APPROVED
  [PASS] Application points to created student ID

--- 8. Double Approval Prevention Guard ---
  [PASS] Double approval safely rejected with Conflict (HTTP 409)
  [PASS] No duplicate student created on repeated approval
  [PASS] No duplicate enrollment created

--- 9. Non-Orphan Approval (Payable Invoice) ---
  [PASS] Non-orphan office admission approved
  [PASS] Non-orphan receives payable invoice (netAmount: 1500, status: UNPAID)

--- 10. Public Tracking Privacy Audit ---
  [PASS] Public tracking endpoint returned 200
  [PASS] Tracking ID returned correctly
  [PASS] Status returned correctly
  [PASS] Public next action instruction returned
  [PASS] NID number is NOT exposed to public tracking
  [PASS] Birth registration number is NOT exposed
  [PASS] Internal audit logs are NOT exposed
  [PASS] Guardian phone is NOT exposed publicly

--- 11. RBAC & IDOR Security Tests ---
  [PASS] Teacher approval request blocked with 403 Forbidden
  [PASS] Anonymous request to /api/admin/admissions blocked with 403
  [PASS] Teacher cannot view admission audit history (403 Forbidden)

=================================================================
 PHASE 3 TEST RESULTS: 63 PASSED | 0 FAILED
=================================================================
```

### রিগ্রেশন টেস্টের ফলাফল
- **Phase 1 Foundation Test Suite:** 39/39 PASSED (0 FAILED)
- **Phase 2 Academic Core Test Suite:** 42/42 PASSED (0 FAILED)
- **Next.js Production Build:** 65/65 Routes compiled successfully (Code 0)
- **মোট পাসকৃত টেস্ট:** ১৪৪/১৪৪ টেস্ট ১০০% উত্তীর্ণ।
