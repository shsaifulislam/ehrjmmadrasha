# Volume 14 – Hostel Management Blueprint (EHRJ-SRS-V14)

**Document Code:** EHRJ-SRS-V14  
**Module:** Hostel Management Blueprint  
**Applies To:** Hostel Administration, Wardens, Students, Guardians, Security, Student360, Admin ERP  

---

## 1. Purpose & Structural Scope
EHRJ Madrasha-এর আবাসিক হোস্টেল কমপ্লেক্স (Boys/Girls Buildings, Floors, Rooms, Beds), সিট বুকিং, স্মার্ট রুম অ্যালটমেন্ট, মিল সিলেক্টর ও মিল হিসাব, কিউআর নাইট অ্যাটেন্ডেন্স, ভিজিটর ট্র্যাকিং, হোস্টেল ইনভেন্টরি, সিকিউরিটি লকডাউন এবং হোস্টেল ফি কালেকশন এই মডিউলের মাধ্যমে অটোমেটেড হবে।

```text
Hostel Application ➔ Eligibility & Waiting List ➔ Approval ➔ Room & Bed Allocation ➔ Meal Assignment ➔ Hostel Fee Invoice ➔ Check-In & Security Registration ➔ Daily QR Attendance & Meal Count ➔ Check-Out & Refund
```

---

## 2. Core Hostel Systems & Engines

### A. Smart Room Allocation Engine
- **Capacity Overflow & Collision Prevention:** একই বেডে ডাবল অ্যালটমেন্ট ব্লক করা।
- **Dynamic Allocation Rules:** জেন্ডার (Boys/Girls Building), সেশন, ক্লাস, ডিপার্টমেন্ট, রুম ক্যালাসিটি, রিজার্ভড সিট এবং ডিজেবল্ড-ফ্রেন্ডলি এক্সেসিবল সিট ফিল্টারিং।

### B. Attendance & Meal Management Engine
- **Meal Scheduler:** প্রাতরাশ, মধ্যাহ্নভোজ, নৈশভোজ, স্পেশাল মিল এবং রমজান ট্র্যাকিং শিডিউল।
- **Attendance-Based Meal Count:** রাতের কিউআর/বায়োমেট্রিক উপস্থিতির ওপর নির্ভর করে কিচেন মিল কাউন্ট অটোমেটিক এডজাস্টমেন্ট।

### C. Visitor & Security Pass System
- **Visitor Registration & Pass:** অভিভাবক ও ভিজিটরদের ডিজিটাল কিউআর পাস জেনারেট, ইন/আউট সময় ট্র্যাকিং এবং ব্ল্যাকলিস্ট করা ভিজিটর ব্লক করা।
- **Security Guard Portal:** গেটে দায়িত্বরত গার্ড কর্তৃক ডিজিটাল বারকোড/কিউআর স্ক্যান করে হোস্টেল স্টুডেন্ট ও অনুমোদনকৃত ভিজিটর যাচাইকরণ।

### D. Multi-Stage Leave & Complaint Management
- **Hostel Leave Approval:** `Student Request` ➔ `Hostel Warden Review` ➔ `Guardian Approval` ➔ `Gate Pass Active & Security Logged`.
- **Complaint & Maintenance:** বিদ্যুৎ, পানি, খাদ্য, আসবাবপত্র ও ইন্টারনেট সংক্রান্ত ইস্যু ট্র্যাকিং ও মেইনটেন্যান্স ক্লোজার।

---

## 3. Integrations with Finance, Accounting & Student360
- **Student360 Sync:** শিক্ষার্থীর হোস্টেল বিল্ডিং, রুম নং, বেড নং, নাইট অ্যাটেন্ডেন্স, ভিজিটর লগ, সিকিউরিটি ডিপোজিট ও ইনভেন্টরি সামগ্রীর তথ্য লাইভ প্রদর্শন।
- **Finance Billing:** হোস্টেল এডমিশন ফি, মান্থলি রেন্ট, মেস চার্জ ও লেট ফাইন জেনারেট।
- **Accounting Double Entry Posting:**
  - **Hostel Fee Collection:** `Debit: Cash/Bank` | `Credit: Hostel Income`
  - **Security Deposit Collection:** `Debit: Cash/Bank` | `Credit: Security Deposit Liability`

---

## 4. REST API Integration Contracts (21 API Groups)
- `GET /api/v1/hostel/buildings`
- `POST /api/v1/hostel/buildings`
- `GET /api/v1/hostel/floors`
- `GET /api/v1/hostel/rooms`
- `POST /api/v1/hostel/rooms`
- `GET /api/v1/hostel/beds`
- `POST /api/v1/hostel/allocate`
- `POST /api/v1/hostel/transfer`
- `POST /api/v1/hostel/attendance`
- `GET /api/v1/hostel/meals`
- `POST /api/v1/hostel/meals`
- `POST /api/v1/hostel/visitors`
- `POST /api/v1/hostel/leave`
- `POST /api/v1/hostel/complaints`
- `GET /api/v1/hostel/inventory`
- `GET /api/v1/hostel/fees`
- `GET /api/v1/hostel/dashboard`
- `GET /api/v1/hostel/reports`
- `GET /api/v1/hostel/qr-verify`
- `POST /api/v1/hostel/check-in`
- `POST /api/v1/hostel/check-out`

---

## 5. Master Database Entities Mapped (27 Core Entities)
`Hostel`, `HostelBuilding`, `HostelFloor`, `HostelRoom`, `HostelBed`, `HostelApplication`, `HostelAllocation`, `HostelTransfer`, `HostelAttendance`, `HostelMealPlan`, `HostelMealAttendance`, `HostelVisitor`, `HostelLeave`, `HostelComplaint`, `HostelMaintenance`, `HostelInventory`, `HostelInventoryIssue`, `HostelFine`, `HostelInvoice`, `HostelSettings`, `HostelAudit`, `HostelTimeline`, `HostelSecurityLog`, `HostelNotice`, `HostelCheckInOut`, `HostelEmergencyContact`, `HostelBlacklist`

---

## 6. Verification & 19-Point Completion Condition
Hostel Management মডিউল সম্পূর্ণ বাস্তবায়িত বলা যাবে কেবল তখনই যখন:
- [ ] রুম ও বেড অ্যালটমেন্ট ইঞ্জিন ডাবল অ্যালটমেন্ট সম্পূর্ণ ব্লক করবে।
- [ ] মিল প্ল্যান ও অ্যাটেন্ডেন্সের সাথে কিচেন সামারি সিঙ্কড হবে।
- [ ] কিউআর ভিজিটর পাস এবং গেইট পাস নিরাপত্তা মডিউলে স্ক্যানযোগ্য হবে।
- [ ] হোস্টেল মেইনটেন্যান্স ও ইনভেন্টরি ট্র্যাকিং কাজ করবে।
- [ ] সিকিউরিটি ডিপোজিট এবং মান্থলি রেন্ট একাউন্টিং লেজারে সঠিকভাবে জমা হবে।
- [ ] Student360 এবং গার্ডিয়ান পোর্টালে হোস্টেল ডাটা রিয়েল-টাইমে শো করবে।
- [ ] কোনো Placeholder বা Mock Data অবশিষ্ট থাকবে না।
- [ ] TypeScript Build (`npm run build`) সফল হবে।
- [ ] Clean Production Build পাস করবে।
- [ ] Playwright E2E Test Suite সফল হবে।
- [ ] Runtime Verification সম্পূর্ণ পাস করবে।
- [ ] Physical Screenshot Evidence সংরক্ষিত থাকবে।
- [ ] Physical Screen Recording Evidence সংরক্ষিত থাকবে।
