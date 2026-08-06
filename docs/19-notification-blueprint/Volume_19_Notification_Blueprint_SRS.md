# Volume 19 – Notification & Communication Engine Blueprint (EHRJ-SRS-V19)

**Document Code:** EHRJ-SRS-V19  
**Module:** Notification & Communication Engine Blueprint  
**Applies To:** All ERP Modules, Admission, Student360, Finance, HR, Portals, Public Website  

---

## 1. Purpose & Event-Driven Architecture
EHRJ Madrasha ERP-এর সমস্ত অটোমেটেড মেসেজিং, সিস্টেম নোটিফিকেশন, প্যারেন্ট কমিউনিকেশন এবং মার্কেটিং ক্যাম্পেইন এই মডিউলের মাধ্যমে পরিচালিত হবে।
- সিস্টেমে যেকোনো বিজনেস ইভেন্ট (ভর্তি অনুমোদন, বেতন রসিদ, উপস্থিতি অনুপস্থিতি, পরীক্ষার রেজাল্ট, লাইব্রেরি বইয়ের মেয়াদ, সিকিউরিটি অ্যালার্ট) ঘটা মাত্রই **Event Dispatcher** স্বয়ংক্রিয়ভাবে মেসেজ প্রসেস করে নির্ধারিত চ্যানেলে পাঠাবে।

```text
Application Business Event ➔ Event Dispatcher ➔ Notification Engine ➔ Redis/BullMQ Queues ➔ Multi-Channel Dispatch (SMS, Email, Push, In-App, WhatsApp) ➔ Exponential Retry Logic ➔ Delivery Status & Immutable Audit Trail
```

---

## 2. Supported Channels & Engine Specifications

### A. SMS Engine (BD Providers Integration)
- **Providers:** GreenWeb, SSL Wireless, Teletalk, Banglalink, Robi, GP Enterprise.
- **Features:** Unicode Bangla & English support, Bulk SMS, Scheduled SMS, Delivery Receipts & Balance API Monitoring.

### B. Email & HTML Template Engine
- **SMTP Protocols:** Gmail, Outlook, Zoho, Amazon SES, SendGrid, Mailgun.
- **Features:** Dynamic HTML Templates, PDF Attachments, Open Tracking Pixels, Queue Processing.

### C. Push, In-App & OTP Engine
- **Push Channels:** Firebase Cloud Messaging (FCM) & OneSignal for Android, iOS, and Web Browsers.
- **In-App Hub:** Header Notification Bell, Toast Alerts, Archive and Read/Unread Status Management.
- **OTP Verification Engine:** ভর্তি, অনলাইন পেমেন্ট, পাসওয়ার্ড রিসেট ও সেনসিটিভ কাজের জন্য কাস্টমাইজড মেয়াদের OTP জেনারেশন।

---

## 3. High-Reliability Queue & Exponential Retry Logic (Redis + BullMQ)
- **Queues:** SMS Queue, Email Queue, Push Queue, PDF Queue, Dead Letter Queue (DLQ).
- **Exponential Retry Pattern:** ব্যর্থ মেসেজের জন্য `1 Minute` ➔ `5 Minutes` ➔ `30 Minutes` ➔ `1 Hour` অন্তর অটো-রিট্রাই। সর্বোচ্চ রিট্রাই ব্যর্থ হলে `Dead Letter Queue`-তে আর্কাইভ এবং এডমিন ড্যাশবোর্ডে অ্যালার্ট।

---

## 4. Multi-Language & Dynamic Placeholders
- **Supported Languages:** Bangla, English, Arabic (Auto Language Selection based on User Preference).
- **Placeholders:** `{StudentName}`, `{Roll}`, `{Class}`, `{Amount}`, `{DueDate}`, `{InvoiceNumber}`, `{ExamName}`, `{Result}`।

---

## 5. REST API Integration Contracts (14 API Groups)
- `GET /api/v1/notifications`
- `POST /api/v1/notifications/send`
- `POST /api/v1/notifications/broadcast`
- `POST /api/v1/notifications/sms`
- `POST /api/v1/notifications/email`
- `POST /api/v1/notifications/push`
- `GET /api/v1/notifications/templates`
- `POST /api/v1/notifications/templates`
- `POST /api/v1/notifications/campaigns`
- `POST /api/v1/notifications/otp/generate`
- `POST /api/v1/notifications/otp/verify`
- `GET /api/v1/notifications/delivery-reports`
- `GET /api/v1/notifications/preferences`
- `GET /api/v1/notifications/dashboard`

---

## 6. Master Database Entities Mapped (20 Core Entities)
`Notification`, `NotificationTemplate`, `NotificationChannel`, `NotificationQueue`, `NotificationHistory`, `NotificationPreference`, `NotificationGroup`, `NotificationCampaign`, `SMSLog`, `EmailLog`, `PushLog`, `WhatsAppLog`, `OTP`, `Broadcast`, `DeliveryReport`, `NotificationSetting`, `QueueStatus`, `FailedNotification`, `RetryQueue`, `WebhookLog`

---

## 7. Verification & 17-Point Completion Condition
Notification Engine সম্পূর্ণ বাস্তবায়িত বলা যাবে কেবল তখনই যখন:
- [ ] এসএমএস, ইমেইল, পুশ ও ইন-অ্যাপ মেসেজিং সফলভাবে কাজ করবে।
- [ ] Redis + BullMQ মেসেজ কিউ সফলভাবে রেসপন্স করবে।
- [ ] ব্যর্থ মেসেজের ক্ষেত্রে Exponential Retry এবং Dead Letter Queue ট্র্যাকিং পাস করবে।
- [ ] ওটিপি জেনারেশন এবং সময়সীমা অতিক্রান্ত হলে অটো-এক্সপায়ার কাজ করবে।
- [ ] Student360 টাইমলাইনে প্রেরিত এসএমএস ও ইমেইলের ডেসক্রিপশন এবং স্ট্যাটাস রেন্ডার করবে।
- [ ] বাংলা (ইউনিকোড) ও ইংরেজি ডাইনামিক টেমপ্লেট মেটাডাটা কাজ করবে।
- [ ] কোনো Placeholder বা Mock Data অবশিষ্ট থাকবে না।
- [ ] TypeScript Build (`npm run build`) সফল হবে।
- [ ] Clean Production Build পাস করবে।
- [ ] Playwright E2E Test Suite সম্পূর্ণ সফল হবে।
- [ ] Runtime Verification সম্পূর্ণ পাস করবে।
- [ ] Physical Screenshot Evidence সংরক্ষিত থাকবে।
- [ ] Physical Screen Recording Evidence সংরক্ষিত থাকবে।
