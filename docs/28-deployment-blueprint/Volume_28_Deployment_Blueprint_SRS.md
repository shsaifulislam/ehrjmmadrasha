# Volume 28 – Production Deployment Blueprint & Production Operations Constitution (EHRJ-SRS-V28)

**Document Code:** EHRJ-SRS-V28  
**Module:** Production Deployment Blueprint & Production Operations Constitution  
**Applies To:** Entire ERP, Docker Containers, Nginx Proxy, PostgreSQL, Redis, Cloudflare, Infrastructure  

---

## 1. Purpose & Operations Constitution
Production Deployment Blueprint হলো EHRJ Madrasha ERP-এর প্রোডাকশন অপারেশনস এবং ডেপ্লয়মেন্টের সর্বোচ্চ সংবিধান (Production Operations Constitution)।
- ডেভেলপমেন্ট (Dev), স্টেজিং (Staging) এবং প্রোডাকশন (Production) পরিবেশ সম্পূর্ণ আলাদা থাকবে।
- প্রোডাকশন এনভায়রনমেন্টে অটোমেটেড সিআই/সিডি পাইপলাইন, ডকার কন্টেইনারাইজেশন, ব্লু-গ্রিন ডেপ্লয়মেন্ট, প্রমেথিউস মনিটরিং এবং ব্যাকআপ ছাড়া কোনো কোড ছাড় দেওয়া হবে না।

```text
Git Push ➔ Lint & Type Check ➔ Vitest & Supertest ➔ Playwright E2E ➔ Docker Build ➔ Staging Deploy ➔ Approval Gate ➔ Blue-Green Production Deploy ➔ Health Check APIs ➔ Automated Backup Snapshot
```

---

## 2. Production Containerized Architecture (Docker Compose)
- **Separate Micro-Containers:** `frontend` (Next.js 15), `backend` (Express API), `postgres` (DB), `redis` (Cache & Queue), `nginx` (Proxy & SSL), `worker` (BullMQ Workers), `scheduler` (Cron Tasks).
- **Subdomain Routing:** `admin.ehrjm.edu.bd`, `student.ehrjm.edu.bd`, `guardian.ehrjm.edu.bd`, `teacher.ehrjm.edu.bd`, `api.ehrjm.edu.bd`, `files.ehrjm.edu.bd`.

---

## 3. Mandatory Infrastructure & Monitoring Stack

### A. Health Check APIs (Zero Downtime Audit)
- `GET /health` (Overall System Health)
- `GET /health/database` (PostgreSQL Connection Pool Status)
- `GET /health/redis` (Redis & BullMQ Ping)
- `GET /health/storage` (S3 Object Storage Connectivity)
- `GET /health/queue` (BullMQ Waiting/Active Worker Count)

### B. Monitoring, Logging & Alerting
- **Prometheus & Grafana:** CPU, RAM, Disk, Active Connections & Latency Dashboard.
- **Centralized Logging (Loki / ELK):** API Request/Response Time, Error Tracebacks and Security Audits.
- **Multi-Channel Alerting:** সিস্টেম গ্রাউন্ডিং বা কিউ ফেইলিউরে তাৎক্ষণিক SMS, Telegram ও Email অ্যালার্ট।

---

## 4. Rollback Strategy & Production Performance KPIs
- **Max Rollback Time ≤ 15 Minutes:** ব্লু-গ্রিন প্রসেস বা রিলিজ ব্যর্থ হলে স্বয়ংক্রিয়ভাবে আগের Docker Image ও Database Snapshot এ রোলব্যাক করার মেকানিজম।
- **Production Target KPIs:** System Uptime ≥ 99.9%, API Latency < 300ms, Homepage Load < 2s, Queue Processing Delay < 5s, System Error Rate < 1%.

---

## 5. Verification & 20-Point Completion Condition
Production Deployment Blueprint বাস্তবায়িত বলা যাবে কেবল তখনই যখন:
- [ ] ডকার কন্টেইনার সার্ভিসসমূহ ইন্ডিপেন্ডেন্টলি সচল থাকবে।
- [ ] TLS 1.3, SSL Certificate এবং HSTS হেডার সক্রিয় থাকবে।
- [ ] Health Check APIs (`/health`, `/health/database`, `/health/redis`) গ্রিন রেসপন্স দেবে।
- [ ] ব্লু-গ্রিন অথবা রোলিং ডেপ্লয়মেন্টে জিরো ডাউনটাইম অর্জিত হবে।
- [ ] প্রমেথিউস, গ্রাফানা এবং সেন্ট্রালাইজড সেন্ট্রি/লোকি লগিং সক্রিয় থাকবে।
- [ ] ১৫ মিনিটের মধ্যে অটোমেটেড রোলব্যাক মেকানিজম ভ্যালিডেশন পাস করবে।
- [ ] কোনো Hardcoded Credentials, Untested Code বা Manual SQL Execution থাকবে না।
- [ ] TypeScript Build (`npm run build`) সফল হবে।
- [ ] Clean Production Build পাস করবে।
- [ ] Post-Deploy Smoke Test ও Playwright E2E সম্পূর্ণ সফল হবে।
- [ ] Runtime Verification সম্পূর্ণ পাস করবে।
- [ ] Physical Screenshot Evidence সংরক্ষিত থাকবে।
- [ ] Physical Screen Recording Evidence সংরক্ষিত থাকবে।
