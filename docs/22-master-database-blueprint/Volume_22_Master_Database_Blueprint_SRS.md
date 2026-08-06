# Volume 22 – Master Database Design & Enterprise Data Architecture (EHRJ-SRS-V22)

**Document Code:** EHRJ-SRS-V22  
**Module:** Master Database Design  
**Applies To:** PostgreSQL Engine, Prisma ORM, Repositories, Data Integrity, Enterprise Migration  

---

## 1. Purpose & Data Architecture Directives
Master Database Design হলো পুরো EHRJ Madrasha ERP-এর একক ও অখণ্ড তথ্যভাণ্ডার (Single Source of Truth)।
- সিস্টেমে বিদ্যমান ১৭টি মডিউল, ৩টি পোর্টাল, সিএমএস এবং ড্যাশবোর্ড একই ডাটাবেস ডিজাইন অনুসরণ করবে।
- **Layering & Repository Rule:** কন্ট্রোলার থেকে সরাসরি ডাটাবেসে এক্সেস সম্পূর্ণ নিষিদ্ধ। ডিরেক্ট SQL বা জটিল ক্যোয়ারী শুধুমাত্র **Repository Layer**-এ সীমাবদ্ধ থাকবে এবং সমস্ত ডাটা এক্সেস **Service Layer** মাধ্যমে নিয়ন্ত্রিত হবে।

```text
Frontend ➔ REST API ➔ Controller ➔ Service Layer (Business Logic) ➔ Repository Layer ➔ Prisma ORM ➔ PostgreSQL Engine (Asia/Dhaka App / UTC DB)
```

---

## 2. Mandatory 10 Standard Columns Spec
ডাটাবেসে প্রস্তুতকৃত ১৮০+ টেবিলের প্রতিটি মডেলে নিচের ১০টি গ্লোবাল কলাম থাকা বাধ্যতামূলক:
1. `id` (Primary Key: UUID / CUID)
2. `createdAt` (DateTime - Auto UTC)
3. `updatedAt` (DateTime - Auto UTC)
4. `createdBy` (String - User ID)
5. `updatedBy` (String - User ID)
6. `deletedAt` (DateTime - Nullable for Soft Delete)
7. `deletedBy` (String - Nullable)
8. `version` (Int - Optimistic Locking Counter)
9. `isActive` (Boolean - Default true)
10. `remarks` (String - Nullable Notes)

---

## 3. Core Database Policies & Integrity Standards

### A. Soft Delete & Production Protection Policy
- সিস্টেমে কখনোই স্থায়ী ডাটা মুছা যাবে না (`deletedAt` কলাম স্ট্যাম্প করা হবে)।
- উৎপাদন ডাটা (Production Data) স্থায়ীভাবে মুছে ফেলার (Hard Purge) একমাত্র ক্ষমতা থাকবে `Super Admin`-এর অনুমতি সাপেক্ষে।

### B. Optimistic Concurrency Control (Version Column)
- রেস কন্ডিশন (Race Condition) এবং সমসাময়িক ডাটা রাইট ওভারল্যাপ বন্ধ করতে প্রতিটি মডেলে `version` কলাম দ্বারা কনকারেন্সি ভ্যালিডেশন নিশ্চিত করা হবে।

### C. Prisma Atomic Transaction Mandate
- ভর্তি অনুমোদন, পে-রোল প্রসেসিং, ফি কালেকশন, ইনভেন্টরি ইস্যু, এবং সেশন প্রমোশনে বাধ্যতামূলকভাবে `prisma.$transaction()` ব্যবহার করা হবে। যেকোনো একটি অপারেশন ব্যর্থ হলে সম্পূর্ণ ট্রানজেকশন রোলব্যাক হবে।

### D. Migration Directive
- স্কিমার যেকোনো পরিবর্তন শুধুমাত্র **Prisma Migration (`npx prisma migrate dev`)** এর মাধ্যমে সম্পাদন করতে হবে। প্রোডাকশন ডাটাবেসে ম্যানুয়াল SQL কোয়েরি চালানো সম্পূর্ণ নিষিদ্ধ।

---

## 4. Master Data Scale & Entity Overview (180+ Tables)
- **Scale Metrics:** 180+ Core Tables, 450+ Foreign Keys, 900+ B-Tree & Composite Indexes, 300+ Unique Constraints.
- **Partitioning Strategy:** উচ্চমাত্রার টেবিল (Attendance, Payment, Journal Lines, Audit Logs, SMS/Email Logs) ডেট-ভিত্তিক টেবিল পার্টিশনিং দ্বারা পরিচালিত হবে।

---

## 5. Master Entity Relationship Execution Map

```text
Admission ➔ Guardian ➔ Student ➔ Class/Section ➔ Fee Invoice ➔ Payment Collection ➔ Journal Entry ➔ General Ledger ➔ Dashboard ➔ Student360
```

---

## 6. Composite Indexes & Redis Caching Strategy
- **Composite Indexes:** `(Session + Class)`, `(Student + Date)`, `(Invoice + Status)`, `(Attendance + Date)`, `(Payment + Date)`.
- **Redis Cache Layer:** ড্যাশবোর্ড মেট্রিক্স, সিস্টেম সেটিংস, পারমিশন ট্রিস, স্টুডেন্ট৩৬০ প্রোফাইলস এবং সিএমএস কনটেন্টের জন্য রেডিস ক্যাশ ব্যবহার।

---

## 7. Verification & 19-Point Completion Condition
Master Database Blueprint বাস্তবায়িত বলা যাবে কেবল তখনই যখন:
- [ ] ১৮০+ মডেলের সাথে ১০টি বাধ্যতামূলক কলাম Prisma Schema-তে সংজ্ঞায়িত থাকবে।
- [ ] Foreign Keys ও Explicit Relations কভারেজ থাকবে (কোনো অনাথ বা ইলিসিট রিলেশন থাকবে না)।
- [ ] Soft Delete এবং Optimistic Locking (`version`) কাজ করবে।
- [ ] `prisma.$transaction()` ফেল করা মাত্রই রোলব্যাক নিশ্চিত হবে।
- [ ] প্রিজমা মাইগ্রেশন ফাইল দ্বারা ডুপ্লিকেট ছাড়া ডাটাবেস মাইগ্রেট করা যাবে।
- [ ] সার্চ অপটিমাইজেশনের জন্য বি-ট্রি ও কম্পোজিট ইনডেক্স সক্রিয় থাকবে।
- [ ] কোনো Placeholder, Hardcoded Credentials বা Fake DB Data থাকবে না।
- [ ] TypeScript Build (`npm run build`) সফল হবে।
- [ ] Clean Production Build পাস করবে।
- [ ] Playwright E2E Test Suite সফল হবে।
- [ ] Runtime Verification সম্পূর্ণ পাস করবে।
- [ ] Physical Screenshot Evidence সংরক্ষিত থাকবে।
- [ ] Physical Screen Recording Evidence সংরক্ষিত থাকবে।
