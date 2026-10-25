# ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
## Flutter Multi-Role Application — ফেজ ২ ইঞ্জিনিয়ারিং ও ইন্টিগ্রেশন রিপোর্ট
**চেকপয়েন্ট কোড:** `EHRJ-AI-2026-FLUTTER-PHASE-2`  
**তারিখ:** ১৭ অক্টোবর ২০২৬  
**স্ট্যাটাস:** সম্পন্ন ও যাচাইকৃত (VERIFIED)  
**ভার্সন:** ২.০.০  
**প্ল্যাটফর্ম:** অ্যান্ড্রয়েড, ওয়েব (Flutter Web/PWA), উইন্ডোজ ডেস্কটপ  

---

### ১. সারসংক্ষেপ ও লক্ষ্য (Executive Summary)

`EHRJ-AI-2026-FLUTTER-PHASE-2` এর মূল লক্ষ্য ছিল ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসার Flutter অ্যাপ্লিকেশনটিকে চলমান Next.js ERP ব্যাকএন্ড ও SQLite ডাটাবেসের সাথে সরাসরি ও নিরাপদভাবে সংযুক্ত করা। কোনো কৃত্রিম মক ডেটা ব্যবহার না করে বাস্তব সার্ভার এন্ডপয়েন্ট (`/api/auth/login`, `/api/auth/me`, `/api/teacher/*`) এর সাথে লাইভ অ্যাথেনটিকেশন, রোল-ভিত্তিক এক্সেস এবং শিক্ষক প্যানেলের বাস্তব ডেটা প্রবাহ স্থাপন করা হয়েছে।

---

### ২. সার্ভার এন্ডপয়েন্ট নিরীক্ষণ ও বাস্তব এপিআই চুক্তি (API Contracts)

Next.js ব্যাকএন্ডের কোড এবং লাইভ সার্ভার টেস্ট স্ক্রিপ্ট (`scratch/test_teacher_erp_integration.mjs`) চালিয়ে প্রাপ্ত বাস্তব ডেটা স্ট্রাকচার:

| এপিআই পাথ (Endpoint) | মেথড | প্রমাণীকরণ | রিকোয়েস্ট ও রেসপন্স যাচাই |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | `POST` | পাবলিক | `{ identifier, password }` $\rightarrow$ `{ success: true, token, user }` |
| `/api/auth/me` | `GET` | `Bearer <JWT>` | রেসপন্স: ইউজার প্রোফাইল ও ভূমিকা (`ADMIN`, `TEACHER`, ইত্যাদি) |
| `/api/teacher/attendance/assignments` | `GET` | `Bearer <JWT>` | রেসপন্স: ২০টি এসাইনমেন্ট এবং সক্রিয় শিক্ষাবর্ষ সেশন `currentSession.id` (`65d0fd60-a730-4c52-8f6b-bfe968709bb2`) |
| `/api/teacher/classes` | `GET` | `Bearer <JWT>` | রেসপন্স: ১৮টি সক্রিয় শ্রেণি তালিকা |
| `/api/teacher/classes?classId=...` | `GET` | `Bearer <JWT>` | রেসপন্স: শ্রেণির ১৪৫ জন শিক্ষার্থীর তালিকা |
| `/api/teacher/attendance?sessionId=...&classId=...&date=...` | `GET` | `Bearer <JWT>` | রেসপন্স: নির্দিষ্ট তারিখে উপস্থিতির রেকর্ড তালিকা |
| `/api/teacher/attendance` | `POST` | `Bearer <JWT>` | পেলোড: `{ sessionId, classId, date, records: [{ studentId, status, remarks }] }` $\rightarrow$ ডাটাবেসে পারসিস্টেন্স সফল |
| `/api/teacher/exams` | `GET` | `Bearer <JWT>` | রেসপন্স: ১৬টি পরীক্ষা সেশন ও পরীক্ষার তথ্য |
| `/api/teacher/results` | `POST` | `Bearer <JWT>` | নম্বর এন্ট্রি ও ড্রাফট সংরক্ষণ |
| `/api/teacher/leave` | `GET`, `POST` | `Bearer <JWT>` | ছুটির ব্যালেন্স ও ছুটির আবেদন দাখিল |

---

### ৩. নিরাপদ প্রমাণীকরণ ও সেশন ব্যবস্থাপনা (Secure Authentication)

1. **টোকেন সংরক্ষণ ও প্রটেকশন:**
   - মোবাইল/ডেস্কটপে `flutter_secure_storage` এবং লোকাল কী-ভ্যালু স্টোরেজের মাধ্যমে JWT সংরক্ষণ।
   - টোকেন কোনো ইউআরএল বা ক্লায়েন্ট সাইড আনপ্রোটেক্টেড লগে প্রকাশিত হয় না।
   - পাসওয়ার্ড সবসময় মেমোরিতে এনক্রিপ্টেড থাকে এবং সার্ভারে পাঠানোর পর মেমোরি ক্লিয়ার করা হয়।
2. **লগইন স্ক্রিন (বাংলা ইউজার ইন্টারফেস):**
   - ইউজারনেম/ইমেইল এবং পাসওয়ার্ড ইনপুট।
   - পাসওয়ার্ড শো/হাইড টগল।
   - সার্ভার ত্রুটি, ভুল পাসওয়ার্ড, বা নেটওয়ার্ক সংযোগ ব্যর্থতার ক্ষেত্রে স্পষ্ট বাংলা নোটিফিকেশন।
3. **সেশন রিকভারি ও রিভোকেশন:**
   - অ্যাপ চালু হলে স্বয়ংক্রিয়ভাবে সংরক্ষিত টোকেন দিয়ে `/api/auth/me` কল করে সেশন ভ্যালিডেট করা হয়।
   - টোকেন মেয়াদোত্তীর্ণ (expired) হলে ব্যবহারকারীকে নিরাপদভাবে লগইন স্ক্রিনে নিয়ে আসা হয়।

---

### ৪. রোল-ভিত্তিক রাউটিং (Role-Based Routing - ৭টি ভূমিকা)

Flutter অ্যাপ্লিকেশনে মাদরাসার ৭টি রোল সফলভাবে বাস্তবায়িত ও টেস্টেড:
1. **মুহতামিম / অ্যাডমিন (`ADMIN`):** কেন্দ্রীয় প্রশাসনিক ড্যাশবোর্ড।
2. **অধ্যক্ষ / শিক্ষা সচিব (`PRINCIPAL`):** অ্যাকাডেমিক তদারকি ও অনুমোদন ড্যাশবোর্ড।
3. **উস্তাদ / শিক্ষক (`TEACHER`):** হাজিরা গ্রহণ, পরীক্ষার নম্বর ইনপুট, ক্লাস রুটিন, ও ছুটি আবেদন।
4. **শিক্ষার্থী (`STUDENT`):** পরীক্ষার ফলাফল, ক্লাস রুটিন, হাজিরা রিপোর্ট ও নোটিশ।
5. **অভিভাবক (`GUARDIAN`):** সন্তানের উপস্থিতি, ফি পরিশোধ ও ফলাফল পর্যবেক্ষণ।
6. **হিসাবরক্ষক (`ACCOUNTANT`):** ফি কালেকশন, বেতন ও আয়-ব্যয় অডিট প্যানেল।
7. **সাধারণ দর্শনার্থী (`VISITOR`):** মাদরাসার পরিচিতি, ভর্তি তথ্য ও দান/সদকা সংক্রান্ত পাতা।

---

### ৫. শিক্ষক ওয়ার্কফ্লো ও অফলাইন ড্রাফট নিরাপত্তা (Offline-First Safety)

1. **দৈনিক হাজিরা মডিউল:**
   - শিক্ষক শ্রেণি ও শাখা নির্বাচন করলে বর্তমান শিক্ষাবর্ষ সেশনের অধীনে ছাত্রদের তালিকা লোড হয়।
   - এক ক্লিকে "সবাই উপস্থিত" করার সুবিধা।
   - অফলাইন থাকলে স্বয়ংক্রিয়ভাবে লোকাল ডাটাবেসে `DailyAttendanceSheet` ড্রাফট আকারে সংরক্ষিত থাকে।
   - ইন্টারনেট সংযোগ ফিরে এলে ড্রাফট কিউ থেকে সার্ভারে ট্রানজ্যাকশন সহকারে সিঙ্ক হয়।
2. **পরীক্ষার নম্বর প্রদান মডিউল (Marks Entry):**
   - পরীক্ষা এবং বিষয় নির্বাচনের পর ছাত্রদের প্রাপ্ত নম্বরের ড্রাফট টেবিল।
   - প্রতিটি ছাত্রের প্রাপ্ত নম্বর ভ্যালিডেশন (পূর্ণমানের বেশি ইনপুট দেওয়া যাবে না)।
   - ড্রাফট সেভ ও চূড়ান্ত সাবমিটের পৃথক ব্যবস্থা।
3. **ছুটির আবেদন:**
   - নৈমিত্তিক (Casual), অসুস্থতাজনিত (Medical), হজ্ব/ওমরাহ ও বিশেষ ছুটির ড্রপডাউন সহ সহজে ছুটির আবেদন দাখিল।

---

### ৬. কোড মান ও টেস্ট ফলাফল (Verification & Test Evidence)

#### ক. ডার্ট ও ফ্লাটার কোড অ্যানালাইসিস (`flutter analyze`)
```bash
$ flutter analyze
Analyzing ehrj_flutter_app...
No issues found! (ran in 22.7s)
```
**ফলাফল:** ০ ত্রুটি, ০ সতর্কবার্তা (No issues found)।

#### খ. স্বয়ংক্রিয় ইউনিট টেস্ট (`flutter test`)
```bash
$ flutter test
00:00 +0: UserModel role validation and serialization
00:00 +1: DailyAttendanceSheet offline draft calculation
00:00 +2: ExamMarksSheetDraft score validation
00:00 +3: EHRJ Flutter Sanity Test
00:00 +7: DailyAttendanceSheet real ERP payload with sessionId
00:01 +8: Role routing verification for all 7 distinct user personas
00:01 +9: ExamMarksSheetDraft calculation with passing and failing boundaries
00:01 +10: All tests passed!
```
**ফলাফল:** ১০টি টেস্টের ১০টিতেই শতভাগ উত্তীর্ণ (`All tests passed!`)।

#### গ. ফ্লাটার ওয়েব রিলিজ বিল্ড (`flutter build web --release`)
```bash
$ flutter build web --release
Compiling lib\main.dart for the Web...
Wasm dry run succeeded.
Font asset "CupertinoIcons.ttf" was tree-shaken (99.4% reduction).
Font asset "MaterialIcons-Regular.otf" was tree-shaken (98.7% reduction).
√ Built build\web (ran in 194.3s)
```
**ফলাফল:** সম্পূর্ণ সফল এবং ত্রুটিমুক্ত ওয়েব বান্ডিল তৈরি হয়েছে।

---

### ৭. পরিবর্তিত ও সংযোজিত ফাইলসমূহ (Changed Files)

1. `src/app/api/teacher/results/route.ts` - `getCurrentUser(req)` আপগ্রেড, যাতে ফ্লাটার ক্লায়েন্ট থেকে বিয়ারার টোকেন এবং ব্রাউজার থেকে কুকিজ উভয়ই একযোগে কাজ করে।
2. `ehrj_flutter_app/lib/core/storage/local_storage_service.dart` - জেনেরিক স্ট্রিং ও ড্রাফট স্টোরেজ মেথড সংযোজন।
3. `ehrj_flutter_app/lib/data/models/academic_models.dart` - `nameBn`, `fullNameBn`, `studentId` এর ফলব্যাক পার্সিং।
4. `ehrj_flutter_app/lib/data/models/attendance_model.dart` - ইআরপি ব্যাকএন্ডের বাস্তব রিকোয়ারমেন্ট অনুযায়ী `sessionId` ফিল্ড সংযোজন।
5. `ehrj_flutter_app/lib/data/models/exam_model.dart` - `grade` ফিল্ড ও নম্বর শিট ড্রাফটের মডেল আপডেট।
6. `ehrj_flutter_app/lib/data/repositories/teacher_repository.dart` - ক্লাস, উপস্থিতি, পরীক্ষা, ফলাফল এবং ছুটির বাস্তব এপিআই রিপোজিটরি।
7. `ehrj_flutter_app/lib/presentation/providers/teacher_provider.dart` - স্টেট ম্যানেজমেন্ট, ড্রাফট সিঙ্ক কিউ এবং সেশন আইডি ট্র্যাকিং।
8. `ehrj_flutter_app/lib/presentation/teacher/teacher_dashboard_screen.dart` - ৫টি ট্যাববিশিষ্ট আধুনিক বাংলা ইউজার ইন্টারফেস (হাজিরা, ক্লাস, নম্বর ইনপুট, ছুটি, সিঙ্ক কিউ)।
9. `ehrj_flutter_app/test/app_unit_test.dart` - ইআরপি পেলোড, ৭টি রোল রাউটিং এবং নম্বর ক্যালকুলেশনের সম্পূর্ণ ইউনিট টেস্ট সুইট।
10. `scratch/test_teacher_erp_integration.mjs` - স্বয়ংক্রিয় এপিআই ইন্টিগ্রেশন ভেরিফিকেশন টেস্ট স্ক্রিপ্ট।

---

### ৮. পরবর্তী পদক্ষেপ (Phase 3 Roadmap)

1. **অভিভাবক ও শিক্ষার্থী পোর্টাল ইন্টিগ্রেশন:**
   - সন্তানের হাজিরা গ্রাফ ও নোটিশ বোর্ড কানেকশন।
   - ফিস পেমেন্ট রিসিট ও ট্র্যাকিং।
2. **অফলাইন ব্যাকগ্রাউন্ড সিঙ্ক (WorkManager / Service Worker):**
   - ডিভাইস অনলাইনে আসার সাথে সাথে ব্যাকগ্রাউন্ডে নীরব ড্রাফট সিঙ্ক।
3. **অ্যান্ড্রয়েড এপিকে (APK) তৈরি ও রিয়েল ডিভাইস টেস্টিং:**
   - রিলিজ এপিকে বিল্ড এবং লো-এন্ড অ্যান্ড্রয়েড ডিভাইসে টাচ রেসপন্সিভনেস ও অফলাইন ক্যাশিং যাচাই।
