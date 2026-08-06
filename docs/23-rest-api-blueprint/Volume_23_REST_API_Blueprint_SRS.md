# Volume 23 – Complete REST API Documentation & Integration Blueprint (EHRJ-SRS-V23)

**Document Code:** EHRJ-SRS-V23  
**Module:** REST API Documentation & Integration Blueprint  
**Applies To:** Backend Express Services, Next.js Frontend, Portals, OpenAPI 3.1, Swagger UI  

---

## 1. Purpose & Gateway Architecture
REST API Documentation Blueprint হলো EHRJ ERP-এর ব্যাকএন্ড সার্ভিসের একক ও বাধ্যতামূলক নির্দেশিকা (Single Source of Truth)।
- কোনো ফ্রন্টএন্ড পেজ, মোবাইল অ্যাপ, পোর্টাল বা ৩য় পক্ষ এই ডকুমেন্টের বাইরে নিজস্ব কোনো এন্ডপয়েন্ট ব্যবহার বা কল করতে পারবে না।

```text
Client Request (Web / Portals / Mobile)
                   │
                   ▼
       HTTPS API Gateway (/api/v1/...)
                   │
                   ▼
  JWT Auth & Bearer Token Verification
                   │
                   ▼
    RBAC Permission & Data Scope Check
                   │
                   ▼
      Zod DTO Request Schema Validation
                   │
                   ▼
      Controller ➔ Service ➔ Repository ➔ DB
                   │
                   ▼
Standard JSON Envelope Response (< 300ms Simple / < 1s Complex)
```

---

## 2. Standard Request & Response Envelopes

### A. Base URL & Versioning
- **Production Base:** `https://api.ehrjm.edu.bd/api/v1`
- **Development Base:** `http://localhost:5000/api/v1`

### B. Standard Success Response Envelope
```json
{
  "success": true,
  "message": "Request executed successfully",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "pages": 25
  },
  "timestamp": "2026-08-02T12:55:00Z",
  "requestId": "req-uuid-v4-998877"
}
```

### C. Standard Failure Response Envelope
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "code": "STUDENT001",
      "field": "birthRegistrationNo",
      "message": "Birth registration number must be exactly 17 digits"
    }
  ],
  "timestamp": "2026-08-02T12:55:00Z",
  "requestId": "req-uuid-v4-998877"
}
```

---

## 3. Core API Standards & Rules

### A. Idempotency Header Enforcement
পেমেন্ট প্রসেসিং, ইনভয়েস জেনারেট, ভর্তি অনুমোদন এবং পে-রোলের মতো গুরুত্বপূর্ণ এন্ডপয়েন্টে **`Idempotency-Key`** হেডার বাধ্যতামূলক। ডুপ্লিকেট পেমেন্ট বা ওভার-ইনভয়েসিং সম্পূর্ণ ব্লক হবে।

### B. Rate Limiting Tiers
- **General APIs:** 100 Requests / Minute
- **Auth & Password APIs:** 10 Requests / Minute
- **OTP Verification APIs:** 5 Requests / Minute

### C. Standard Query Filters, Pagination & Search
- `?page=1&limit=20`
- `?sort=createdAt&order=desc`
- `?q=search_term` (Name, Roll, ID, Mobile, NID, Barcode, QR)

---

## 4. API Groups Breakdown (600+ Endpoints)
1. `/api/v1/auth/*` (Login, OTP, Refresh, 2FA)
2. `/api/v1/users/*` & `/api/v1/students/*` & `/api/v1/guardians/*`
3. `/api/v1/teachers/*` & `/api/v1/staff/*`
4. `/api/v1/admissions/*` & `/api/v1/academic/*`
5. `/api/v1/attendance/*` & `/api/v1/exams/*` & `/api/v1/results/*`
6. `/api/v1/finance/*` & `/api/v1/accounting/*`
7. `/api/v1/hr/*` & `/api/v1/payroll/*`
8. `/api/v1/library/*`, `/api/v1/hostel/*`, `/api/v1/transport/*`, `/api/v1/inventory/*`
9. `/api/v1/certificates/*` & `/api/v1/cms/*`
10. `/api/v1/dashboard/*`, `/api/v1/reports/*`, `/api/v1/settings/*`, `/api/v1/notifications/*`, `/api/v1/audit/*`

---

## 5. Performance & Security Benchmarks
- **OpenAPI 3.1 & Swagger Specification:** কোড থেকে অটো-জেনারেটেড ডক্স ও পোস্টম্যান কালেকশন।
- **Response Latency:** সিম্পল API < 300ms এবং কমপ্লেক্স রিপোর্ট API < 1s.
- **BullMQ Background Processing:** ভারী PDF, ব্যাকআপ, এক্সপোর্ট ও এসএমএস প্রসেসিং ব্যাকগ্রাউন্ড কিউতে এক্সিকিউট।

---

## 6. Verification & 20-Point Completion Condition
REST API Layer সম্পূর্ণ বাস্তবায়িত বলা যাবে কেবল তখনই যখন:
- [ ] ৬০০+ REST এন্ডপয়েন্ট OpenAPI 3.1 / Swagger UI-তে অ্যাক্সেসযোগ্য হবে।
- [ ] সমস্ত API সাকসেস এবং ফেলিউর স্ট্যান্ডার্ড JSON Envelope অনুসরণ করবে।
- [ ] `Idempotency-Key` ডুপ্লিকেট পেমেন্ট ও ইনভয়েস জেনারেশন ব্লক করবে।
- [ ] Zod DTO Schema ভ্যালিডেশন এবং রেট লিমিটিং কাজ করবে।
- [ ] ফিল্টারিং, সর্টিং, সার্ভার-সাইড পেজিনেশন ও গ্লোবাল সার্চ ভ্যালিড হবে।
- [ ] কোনো এন্ডপয়েন্ট আন-ডকুমেন্টেড বা প্লেসহোল্ডার অবস্থায় থাকবে না।
- [ ] TypeScript Build (`npm run build`) সফল হবে।
- [ ] Clean Production Build পাস করবে।
- [ ] Playwright E2E & API Contract Test Suite সম্পূর্ণ সফল হবে।
- [ ] Runtime Verification সম্পূর্ণ পাস করবে।
- [ ] Physical Screenshot Evidence সংরক্ষিত থাকবে।
- [ ] Physical Screen Recording Evidence সংরক্ষিত থাকবে।
