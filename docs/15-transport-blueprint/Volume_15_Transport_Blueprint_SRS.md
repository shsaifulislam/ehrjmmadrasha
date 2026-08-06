# Volume 15 – Transport Management Blueprint (EHRJ-SRS-V15)

**Document Code:** EHRJ-SRS-V15  
**Module:** Transport Management Blueprint  
**Applies To:** Fleet Administration, Drivers, Helpers, Students, Staff, Guardians, Student360, Admin ERP  

---

## 1. Purpose & Core Fleet Scope
EHRJ Madrasha-এর যানবাহন ফ্লিট (Buses, Microbuses, Vans), ড্রাইভার/হেলপার প্রোফাইল, স্মার্ট রুট ও স্টপেজ অ্যাসাইনমেন্ট, সিট অ্যালোকেশন, লাইভ জিপিএস ট্র্যাকিং (Live GPS & Trip Replay), কিউআর/আরএফআইডি অ্যাটেন্ডেন্স, ফুয়েল কনজাম্পশন এনালাইটিক্স, ভেহিক্যাল মেইনটেন্যান্স এবং স্টুডেন্ট ও গার্ডিয়ান পোর্টাল রিয়েল-টাইম বাস ট্র্যাকিং এই মডিউলের মূল চালিকাশক্তি।

```text
Vehicle & Driver Registration ➔ Route & Stop Setup ➔ Student Seat Allocation Check ➔ Transport Invoice ➔ Live GPS Tracking & Trip Replay ➔ Daily QR/RFID Attendance ➔ Fuel & Maintenance Accounting Log
```

---

## 2. Smart Fleet Engines & Integrations

### A. Live GPS Tracking & Guardian Bus Location Engine
- **Live Location Streaming:** বাসের গতিবেগ, বর্তমান জিপিএস অবস্থান, আনুমানিক পৌঁছানোর সময় (ETA) এবং রুট ট্রিপ রিপ্লে সুবিধা।
- **Guardian Portal Live Tracking:** অভিভাবক পোর্টালে সরাসরি বাসের লাইভ ম্যাপ ট্র্যাকিং, ড্রাইভার কল বাটন এবং বাসের বিলম্বের ক্ষেত্রে অটোমেটিক নোটিফিকেশন এলার্ট।

### B. Seat Allocation & Attendance Engine
- **Capacity Overflow Protection:** প্রতিটি রুটে বাসের সিটের অতিরিক্ত বুকিং সম্পূর্ণ নিরোধ করা।
- **QR/RFID Daily Attendance:** স্টুডেন্ট বাসে ওঠা ও নামার সাথে সাথে বাস অ্যাটেন্ডেন্স জেনারেট এবং প্যারেন্টদের কাছে SMS/Push পাঠানো।

### C. Fuel & Maintenance Engine
- **Fuel Analytics:** জিপিএস মাইলেজ ট্র্যাকিং, লিটারপ্রতি মাইলেজ ক্যালকুলেশন এবং ফুয়েল ক্রয়ের ভেন্ডর একাউন্টস রেকর্ড।
- **Maintenance Reminders:** ইঞ্জিন অয়েল চেঞ্জ, টায়ার পরিবর্তন, ব্যাটারি ও ব্রেক সার্ভিসের জন্য স্বয়ংক্রিয় রিমাইন্ডার ইঞ্জিন।

---

## 3. Integrations with Finance, Accounting & Student360
- **Student360 Sync:** ছাত্রের রুট নং, স্টপেজ নাম, বাসের নম্বর, ড্রাইভারের মোবাইল, মাসিক ট্রান্সপোর্ট ফি এবং প্রতিদিনের বাসে ওঠা-নামার সময় প্রদর্শন।
- **Finance Billing:** মাসিক ট্রান্সপোর্ট ফি ও ওয়ান-ওয়ে/টু-ওয়ে ট্রিপ ইনভয়েস জেনারেট।
- **Accounting Double Entry Posting:**
  - **Transport Fee Collection:** `Debit: Cash/Bank` | `Credit: Transport Income`
  - **Fuel Expense:** `Debit: Fuel Expense` | `Credit: Cash/Bank`
  - **Vehicle Maintenance:** `Debit: Maintenance Expense` | `Credit: Cash/Payable`

---

## 4. REST API Integration Contracts (21 API Groups)
- `GET /api/v1/transport/vehicles`
- `POST /api/v1/transport/vehicles`
- `GET /api/v1/transport/drivers`
- `POST /api/v1/transport/drivers`
- `GET /api/v1/transport/helpers`
- `GET /api/v1/transport/routes`
- `POST /api/v1/transport/routes`
- `GET /api/v1/transport/stops`
- `POST /api/v1/transport/allocate`
- `POST /api/v1/transport/attendance`
- `GET /api/v1/transport/gps-live/:vehicleId`
- `GET /api/v1/transport/fuel`
- `POST /api/v1/transport/fuel`
- `GET /api/v1/transport/maintenance`
- `POST /api/v1/transport/maintenance`
- `GET /api/v1/transport/permits`
- `GET /api/v1/transport/insurance`
- `GET /api/v1/transport/fees`
- `GET /api/v1/transport/dashboard`
- `GET /api/v1/transport/reports`
- `GET /api/v1/transport/live-tracking/guardian`

---

## 5. Master Database Entities Mapped (28 Core Entities)
`TransportVehicle`, `TransportRoute`, `TransportStop`, `TransportDriver`, `TransportHelper`, `TransportAllocation`, `TransportAttendance`, `TransportTrip`, `TransportGPS`, `TransportFuel`, `TransportMaintenance`, `TransportInsurance`, `TransportPermit`, `TransportInvoice`, `TransportPayment`, `TransportFine`, `TransportRefund`, `TransportComplaint`, `TransportIncident`, `TransportTimeline`, `TransportAudit`, `TransportSettings`, `TransportNotification`, `TransportRouteHistory`, `TransportSeat`, `TransportVendor`, `TransportDocument`, `TransportEmergencyContact`

---

## 6. Verification & 20-Point Completion Condition
Transport Management মডিউল সম্পূর্ণ বাস্তবায়িত বলা যাবে কেবল তখনই যখন:
- [ ] সিট ক্যালাসিটি ওভারফ্লো ও ডাবল সিট অ্যালটমেন্ট সম্পূর্ণ ব্লক থাকবে।
- [ ] গার্ডিয়ান পোর্টালে বাসের লাইভ জিপিএস লোকেশন ও ইটিএ ম্যাপ রেন্ডার হবে।
- [ ] কিউআর/আরএফআইডি অ্যাটেন্ডেন্স স্ক্যান কাজ করবে।
- [ ] ফুয়েল কনজাম্পশন ও মাইলেজ এনালাইটিক্স নির্ভুল হিসাব দেবে।
- [ ] যানবাহন রক্ষণাবেক্ষণ ও ইন্স্যুরেন্স মেয়াদের অটোমেটিক এলার্ট কাজ করবে।
- [ ] ইনকাম ও ফুয়েল/মেইনটেন্যান্স খরচ ডাবল এন্ট্রি একাউন্টিং লেজারে রিফ্লেক্ট হবে।
- [ ] Student360 এবং নোটিফিকেশন ইঞ্জিনের সাথে ডাটা সিঙ্কড থাকবে।
- [ ] কোনো Placeholder বা Mock Data অবশিষ্ট থাকবে না।
- [ ] TypeScript Build (`npm run build`) সফল হবে।
- [ ] Clean Production Build পাস করবে।
- [ ] Playwright E2E Test Suite সফল হবে।
- [ ] Runtime Verification সম্পূর্ণ পাস করবে।
- [ ] Physical Screenshot Evidence সংরক্ষিত থাকবে।
- [ ] Physical Screen Recording Evidence সংরক্ষিত থাকবে।
