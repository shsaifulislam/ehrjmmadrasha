# Volume 27 – Testing Blueprint & Enterprise QA Constitution (EHRJ-SRS-V27)

**Document Code:** EHRJ-SRS-V27  
**Module:** Enterprise Testing Blueprint & QA Constitution  
**Applies To:** Entire ERP, Vitest/Jest Unit Suite, Supertest API Suite, Playwright E2E, k6 Load Testing  

---

## 1. Purpose & Quality Assurance Constitution
Enterprise Testing Blueprint হলো EHRJ Madrasha ERP-এর সর্বোচ্চ কোয়ালিটি অ্যাসিউরেন্স সংবিধান (Quality Assurance Constitution)।
- কোনো ফিচারের টেস্ট কভারেজ, প্লে-রাইট ই-টু-ই টেস্ট, পেনিট্রেশন টেস্ট এবং ভিজ্যুয়াল অডিট না থাকা পর্যন্ত কোনো কোড প্রোডাকশন ডোমেইনে মার্চ বা ডেপ্লয় করা যাবে না।

```text
Developer Code Push ➔ Lint & Type Check ➔ Vitest Unit Tests (70% Py) ➔ Supertest API Contract Tests (20% Py) ➔ Playwright E2E Tests (10% Py) ➔ k6 Load & Stress Audit ➔ Evidence Capture ➔ Production Release Gate
```

---

## 2. Testing Pyramid & Coverage Thresholds

### A. Testing Pyramid Ratio
- **Unit Tests (70% Target):** Services, Utilities, Validators, Custom Hooks & Components.
- **Integration Tests (20% Target):** Controller ➔ Service ➔ Database ➔ Queue ➔ Accounting Events.
- **Playwright E2E Tests (10% Target):** Real Browser End-to-End Workflows across Portals.

### B. Mandatory Code Coverage Thresholds
- **Backend Core Services:** Statement Coverage ≥ 90%, Function Coverage ≥ 90%, Branch Coverage ≥ 85%.
- **Frontend Components:** Component Coverage ≥ 85%.
- **Critical Modules (Finance, Admission, Accounting, RBAC):** Module Coverage ≥ 95%.

---

## 3. Mandatory Testing Disciplines & Tools

### A. Playwright End-to-End (E2E) Browser Testing
- **Workflows Covered:** Login, Logout, Admission Form Submission, Student Creation, Fee Collection, Attendance Scanner, Exam Result Publication, Library Book Issue, Hostel Seat Allocation, Transport Assignment.
- **Portals Verified:** Admin ERP, Student Portal, Guardian Portal, Teacher Portal, Public Website.

### B. Atomic Transaction Fail-Safe Testing
- **Admission Approval Rollback Test:** স্টুডেন্ট তৈরি, গার্ডিয়ান তৈরি, ইনভয়েস অটো-জেনারেট, ডাবল-এন্ট্রি একাউন্টিং পোস্টিং এবং স্টুডেন্ট৩৬০ প্রোফাইল তৈরির মধ্যে যেকোনো **একটি ধাপ ব্যর্থ হলে** সমস্ত অ্যাকশন স্বয়ংক্রিয়ভাবে রোলব্যাক হতে হবে (জিরো অরফান রেকর্ড)।

### C. Performance & k6 Load Benchmarks
- **Response Latency Limits:** Search API < 500ms, General API < 300ms, Dashboard < 3s, Homepage < 2s.
- **k6 Load Stress Targets:** ১,০০০ কনকারেন্ট ইউজার এবং ১০,০০০ রিকোয়েস্ট/মিনিট থ্রুপুট ক্যাপাসিটি।

---

## 4. Automated CI/CD Release Quality Gates
```text
Lint Step ➔ TypeScript Check ➔ Unit Tests ➔ Integration Tests ➔ API Contract Tests ➔ Playwright E2E Tests ➔ Build Gate ➔ Deploy
```
- **Rule:** যেকোনো একটি টেস্ট ব্যর্থ হলে পাইপলাইন সাথে সাথে স্তব্ধ হয়ে যাবে এবং মোট এভিডেন্স (Screenshots, Playwright WebP Video Recordings, Test Execution Logs) রিপোর্টে যুক্ত হবে।

---

## 5. Verification & 20-Point Completion Condition
Testing Blueprint বাস্তবায়িত বলা যাবে কেবল তখনই যখন:
- [ ] Unit & Integration Test Suites ন্যূনতম ৯০% স্টেটমেন্ট কভারেজ পূরণ করবে।
- [ ] Playwright E2E Test Suite সম্পূর্ণ গ্রিন (Green Passed) রেসপন্স দেবে।
- [ ] k6 Load Testing ১,০০০ কনকারেন্ট ইউজারের রেসপন্স টাইম বজায় রাখবে।
- [ ] ট্রানজেকশন রোলব্যাক ভ্যালিডেশন টেস্ট ব্যর্থতার ক্ষেত্রে শূন্য ডুপ্লিকেট ছাড়বে।
- [ ] WCAG 2.2 AA এক্সেসিবিলিটি এবং ৪টি ক্রস-ব্রাউজারে লেআউট রেন্ডার পাস করবে।
- [ ] প্লে-রাইট স্ক্রিনশট এবং ভিডিও এভিডেন্স ফাইল আর্টফ্যাক্টসে সংরক্ষিত থাকবে।
- [ ] কোনো Hardcoded Credentials, Mock Data বা Fake Reports থাকবে না।
- [ ] TypeScript Build (`npm run build`) সফল হবে।
- [ ] Clean Production Build পাস করবে।
- [ ] Physical Screenshot Evidence সংরক্ষিত থাকবে।
- [ ] Physical Screen Recording Evidence সংরক্ষিত থাকবে।
