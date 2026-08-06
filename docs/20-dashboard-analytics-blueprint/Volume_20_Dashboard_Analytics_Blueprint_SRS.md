# Volume 20 – Dashboard & Analytics Blueprint (EHRJ-SRS-V20)

**Document Code:** EHRJ-SRS-V20  
**Module:** Dashboard & Analytics Blueprint  
**Applies To:** Central Command Center, Super Admin, Principal, Accountant, Admission, Teacher, Student, Guardian  

---

## 1. Purpose & Command Center Architecture
Dashboard হলো পুরো EHRJ Madrasha ERP-এর কেন্দ্রীয় কমান্ড সেন্টার (Central Command Center)।
- ERP-এর ১৪টি মডিউলের কোনো তথ্যই Hardcoded বা Mock হবে না। সমস্ত কেপিআই (KPIs), চার্ট ও উইজেট সরাসরি ডাটাবেস, রেডিস ক্যাশ এবং কিউ মনিটরিং সার্ভিস থেকে স্বয়ংক্রিয়ভাবে রেসপন্স করবে।

```text
User Request (Super Admin / Principal / Accountant / Teacher / Student / Guardian)
                                      │
                                      ▼
                             RBAC Permission Gate
                                      │
                                      ▼
                           Dashboard Service Layer
                                      │
                                      ▼
                      Redis Cache Metrics Aggregator (Response Time < 500ms)
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
   Database KPIs              System Health & Queues          Sub-System Analytics
(Finance/Academic/HR)       (Redis/BullMQ/CPU/RAM)        (Student360/Library/Hostel)
```

---

## 2. 7 Distinct Persona Dashboard Types

1. **Super Admin Dashboard:** সমগ্র প্রতিষ্ঠানের সার্বিক নিয়ন্ত্রণ, রেভিনিউ, ক্যাশ/ব্যাংক ব্যালেন্স, উপস্থিতির সার্বিক চিত্র, ইনভেন্টরি অ্যালার্ট এবং গ্লোবাল সিকিউরিটি স্ট্যাটাস।
2. **Principal Executive Dashboard:** স্টুডেন্ট সংখ্যা, শিক্ষক উপস্থিতি, একাডেমিকাল রুটিন, পরীক্ষার অবস্থা, একাডেমিক নোটিশ ও পারফরম্যান্স কেপিআই।
3. **Accountant Dashboard:** দৈনিক কালেকশন, ক্যাশ/ব্যাংক ট্রানজেকশন, বকেয়া ফি, জার্নাল পোস্টিং এবং বিফল হওয়া অনলাইন পেমেন্টের হিসাব।
4. **Admission Officer Dashboard:** পেন্ডিং আবেদন, এপ্রুভড, রিজেক্টেড, ড্রাফট, অনলাইন/অফলাইন ট্রেন্ড ও ক্লাস-ভিত্তিক আবেদন।
5. **Teacher Dashboard:** আজকের ক্লাস রুটিন, পেন্ডিং এটেন্ডেন্স, পেন্ডিং মার্কস এন্ট্রি, হোমওয়ার্ক সাবমিশন ও ছুটির ব্যালেন্স।
6. **Student Dashboard:** নিজের উপস্থিতি %, টিউশন ফি বকেয়া, রুটিন, পরীক্ষার রেজাল্ট, অ্যাসাইনমেন্ট ও সার্টিফিকেট বুকিং।
7. **Guardian Dashboard:** সকল সন্তানের পারিবারিক সুইচিং ভিউ, উপস্থিতি, অনলাইন ফি পেমেন্ট ও বার্তা বিনিময়।

---

## 3. Real-time Monitoring & Infrastructure Visualizers
- **System Health Engine:** PostgreSQL DB স্ট্যাটাস, Redis ক্যাশ কানেক্টিভিটি, BullMQ কিউ সাইজ, মেমরি (RAM), CPU ইউটিলাইজেশন এবং সার্ভিস আপটাইম।
- **Queue Monitoring Engine:** SMS, Email, Push এবং PDF কিউতে Waiting, Active, Completed এবং Failed মেসেজের সংখ্যা লাইভ ট্র্যাকিং।
- **Security Dashboard:** বিফল হওয়া লগইন চেষ্টা (Failed Logins), লকড অ্যাকাউন্টস, একটিভ ডিভাইস সেশন এবং ট্রানজেকশন অডিট অ্যালার্ট।

---

## 4. Personalization & Deep Linking
- **Drag & Drop Layout Manager:** ব্যবহারকারীরা নিজের সুবিধা অনুযায়ী ড্যাশবোর্ড উইজেট সরাতে (Rearrange), ডার্ক মোড অন করতে এবং লেআউট সেভ করতে পারবেন।
- **Deep Linking:** ড্যাশবোর্ডের প্রতিটি কার্ড সরাসরি **Student360**, **Finance Invoice**, **Academic Routine** বা **Notification Inbox**-এর সাথে ২-ওয়ে লিঙ্কড থাকবে।

---

## 5. REST API Integration Contracts (13 API Groups)
- `GET /api/v1/dashboard/overview`
- `GET /api/v1/dashboard/metrics`
- `GET /api/v1/dashboard/kpis`
- `GET /api/v1/dashboard/charts`
- `GET /api/v1/dashboard/system-health`
- `GET /api/v1/dashboard/queues`
- `GET /api/v1/dashboard/live-feed`
- `GET /api/v1/dashboard/security`
- `GET /api/v1/dashboard/analytics/finance`
- `GET /api/v1/dashboard/analytics/academic`
- `GET /api/v1/dashboard/analytics/hr`
- `POST /api/v1/dashboard/preferences/layout`
- `POST /api/v1/dashboard/export`

---

## 6. Master Database Entities Mapped (15 Core Entities)
`DashboardWidget`, `DashboardLayout`, `DashboardPreference`, `DashboardMetric`, `DashboardSnapshot`, `DashboardFilter`, `DashboardReport`, `SystemHealth`, `QueueMetric`, `AnalyticsCache`, `UserDashboard`, `KPI`, `WidgetPermission`, `DashboardTheme`, `DashboardLog`

---

## 7. Performance Benchmarks (< 500ms Response Time)
- **100,000+ Active Users Support:** রেডিস ক্যাশিং মেকানিক্স ও ব্যাকগ্রাউন্ড মেট্রিক্স সিঙ্ক্রোনাইজেশন।
- **Virtualized Widgets & Lazy Loading:** স্ক্রিনের বাইরের চার্ট ও ডাটা লেজি-লোড মাধ্যমে রেন্ডারিং।

---

## 8. Verification & 16-Point Completion Condition
Dashboard & Analytics মডিউল সম্পূর্ণ বাস্তবায়িত বলা যাবে কেবল তখনই যখন:
- [ ] ৭টি ভিন্ন ইউজার রোল অনুযায়ী স্বতন্ত্র ড্যাশবোর্ড লেআউট নিখুঁত রেন্ডার করবে।
- [ ] কোনো মেট্রিকে প্লেসহোল্ডার বা ফেক ডাটা থাকবে না (১০০% লাইভ ডাটাবেস ও রেডিস থেকে আসবে)।
- [ ] সিস্টেম হেলথ (CPU, RAM, DB, Redis) এবং কিউ মনিটরিং রিয়েল-টাইম তথ্য প্রদর্শন করবে।
- [ ] ড্যাশবোর্ড উইজেট থেকে ১-ক্লিকে **Student360** এবং ফিনান্সিয়াল লেজারে লিঙ্ক কাজ করবে।
- [ ] রেসপন্স টাইম ৫০০ms এর নিচে নিশ্চিত হবে।
- [ ] ড্যাশবোর্ড লেআউট রিরিঅ্যারেঞ্জ এবং ডার্ক মোড সেভ হবে।
- [ ] TypeScript Build (`npm run build`) সফল হবে।
- [ ] Clean Production Build পাস করবে।
- [ ] Playwright E2E Test Suite সফল হবে।
- [ ] Runtime Verification সম্পন্ন হবে।
- [ ] Physical Screenshot Evidence সংরক্ষিত থাকবে।
- [ ] Physical Screen Recording Evidence সংরক্ষিত থাকবে।
