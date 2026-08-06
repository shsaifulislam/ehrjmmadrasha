# Volume 26 – Security Blueprint & Enterprise Security Constitution (EHRJ-SRS-V26)

**Document Code:** EHRJ-SRS-V26  
**Module:** Enterprise Security Blueprint  
**Applies To:** Entire ERP, All Modules, APIs, Portals, Infrastructure, Cloudflare WAF, PostgreSQL  

---

## 1. Purpose & Security Constitution
Enterprise Security Blueprint হলো EHRJ Madrasha ERP-এর সর্বোচ্চ নিরাপত্তা সংবিধান (Enterprise Security Constitution)।
- সিস্টেমে তৈরি প্রতিটি ফিচার, ড্যাশবোর্ড, REST API, ডাটাবেস কোয়েরি, ব্যাকগ্রাউন্ড কিউ এবং সার্ভার ডেপ্লয়মেন্ট এই নিরাপত্তা সংবিধানের বিধানাবলি কঠোরভাবে মেনে চলবে।

```text
User Traffic ➔ Cloudflare WAF ➔ Nginx Reverse Proxy (Fail2Ban/SSL) ➔ Rate Limiter (IP/User) ➔ JWT/Argon2id Auth & MFA ➔ RBAC Authorization Gate ➔ Parameterized Service/Prisma Layer ➔ Encrypted Database (AES-256 / TLS 1.3) ➔ Immutable Audit Log
```

---

## 2. Core Security Pillars & Standards

### A. Authentication & Argon2id Password Encryption
- **Password Policy:** ন্যূনতম ১২ ক্যারেক্টার (বড় হাতের, ছোট হাতের অক্ষর, সংখ্যা ও স্পেশাল সিম্বল বাধ্যতামূলক) এবং গত ৫টি ব্যবহৃত পাসওয়ার্ডের হিস্ট্রি লক।
- **Hashing Algorithm:** Argon2id প্রাথমিক হ্যাশিং অ্যালগরিদম (Bcrypt ব্যাকআপ)। পাসওয়ার্ড টেক্সট বা রিভার্সিবল এনক্রিপশন সম্পূর্ণ নিষিদ্ধ।

### B. OWASP Top 10 Defense & Data Protection
- **Injection Defense:** কাস্টম Raw SQL সম্পূর্ণ নিষিদ্ধ; Prisma ORM এর প্যারামিটারাইজড কোয়েরি প্রয়োগ।
- **XSS & CSRF Defense:** HTML/Markdown ইনপুট স্যানিটাইজেশন, স্টেটফুল রিকোয়েস্টে CSRF টোকেন ভ্যালিডেশন এবং `SameSite=Strict` HTTP-Only কুকিজ।
- **Security Headers:** HSTS, CSP (Content Security Policy), X-Frame-Options, X-Content-Type-Options এবং Referrer-Policy সক্রিয় রাখা।

### C. Rate Limiting & Brute-Force Defense
- **Account Locking:** পরপর ৫বার বিফল লগইন চেষ্টার পর একাউন্ট সাময়িকভাবে লককরণ, সুপার এডমিন অ্যালার্ট এবং IP ট্র্যাকিং অডিট পোস্টিং।
- **Tiered Rate Limits:** লগইন, পেমেন্ট, ওটিপি এবং গ্লোবাল API এন্ডপয়েন্টে পৃথক রেট লিমিটিং পলিসি।

---

## 3. Storage, Encryption & Disaster Recovery
- **File Upload Protection:** আপলোডকৃত ফাইলে ভাইরাস স্ক্যানিং, প্রাইভেট স্টোরেজ এবং এক্সেসে মেয়াদী Signed URLs ব্যবহার।
- **Data Encryption:** ডাটাবেস ও ব্যাকআপে AES-256 (At Rest) এবং সার্ভার ট্রাফিকে TLS 1.3 (In Transit) এনক্রিপশন।
- **Backups & DR Plan:** দৈনিক, সাপ্তাহিক ও মাসিক ক্লাউড ব্যাকআপ এবং পয়েন্ট-ইন-টাইম রিকভারি (PITR) গ্যারান্টি।

---

## 4. Developer Security Rules (Zero-Tolerance Policy)
1. **Never Hardcode Secrets:** কোডে কোনো API Key, DB Password বা JWT Secret রাখা সম্পূর্ণ নিষিদ্ধ (সবকিছু `.env` ফাইল থেকে লোড হবে)।
2. **Always Sanitize & Validate:** প্রতিটি API রিকোয়েস্টে Zod Schema স্যানিটাইজেশন বাধ্যতামূলক।
3. **Always Enforce RBAC & Audit:** পারমিশন ও অডিট লগ ছাড়া কোনো মিউটেশন অপারেশন গ্রান্ট করা যাবে না।

---

## 5. Verification & 20-Point Completion Condition
Security Blueprint বাস্তবায়িত বলা যাবে কেবল তখনই যখন:
- [ ] Argon2id পাসওয়ার্ড হ্যাশিং এবং MFA সঠিকভাবে কাজ করবে।
- [ ] Zod DTO স্কিমা দিয়ে ১০০% API রিকোয়েস্ট স্যানিটাইজড হবে।
- [ ] Cloudflare WAF, Nginx SSL এবং HSTS সিকিউরিটি হেডার একটিভ থাকবে।
- [ ] OWASP Top 10 স্ক্রিন টেস্ট (SQLi, XSS, CSRF, IDOR, SSRF) পাস করবে।
- [ ] ইমার্জেন্সি একাউন্ট লকিং এবং Brute Force প্রটেকশন কাজ করবে।
- [ ] এনক্রিপ্টেড ব্যাকআপ এবং Signed URL ফাইল এক্সেস ভ্যালিডেশন পাস করবে।
- [ ] কোনো Plain Passwords, Mock Data বা Hardcoded Secrets থাকবে না।
- [ ] TypeScript Build (`npm run build`) সফল হবে।
- [ ] Clean Production Build পাস করবে।
- [ ] Playwright E2E Security Test Suite সম্পূর্ণ সফল হবে।
- [ ] Runtime Verification এবং Penetration Verification সম্পূর্ণ পাস করবে।
- [ ] Physical Screenshot Evidence সংরক্ষিত থাকবে।
- [ ] Physical Screen Recording Evidence সংরক্ষিত থাকবে।
