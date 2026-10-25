# ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
## ডিজিটাল ক্যাম্পাস ও ইআরপি — প্রোডাকশন লাইভ ডেপ্লয়মেন্ট ও কনফিগারেশন গাইড
**সংস্করণ:** ১.০.০ (প্রোডাকশন রিলিজ)  
**নিরাপত্তা স্তর:** সংবেদনশীল প্রাতিষ্ঠানিক ডেপ্লয়মেন্ট  

---

### সূচিপত্র
1. [সার্ভার রিকোয়ারমেন্ট ও প্রাক-প্রস্তুতি](#১-সার্ভার-রিকোয়ারমেন্ট-ও-প্রাক-প্রস্তুতি)
2. [এনভায়রনমেন্ট ভেরিয়েবল ও সিক্রেট কী কনফিগারেশন](#২-এনভায়রনমেন্ট-ভেরিয়েবল-ও-সিক্রেট-কী-কনফিগারেশন)
3. [লাইভ পেমেন্ট গেটওয়ে (bKash ও Nagad) সক্রিয়করণ](#৩-লাইভ-পেমেন্ট-গেটওয়ে-bkash-ও-nagad-সক্রিয়করণ)
4. [বাল্ক এসএমএস ও ইমেইল নোটিফিকেশন সেটআপ](#৪-বাল্ক-এসএমএস-ও-ইমেইল-নোটিফিকেশন-সেটআপ)
5. [ডিপ্লয়মেন্ট পদ্ধতি (Docker Compose বনাম PM2+Nginx)](#৫-ডিপ্লয়মেন্ট-পদ্ধতি)
6. [ডোমেন ও SSL সার্টিফিকেট (Let's Encrypt)](#৬-ডোমেন-ও-ssl-সার্টিফিকেট)
7. [স্বয়ংক্রিয় ব্যাকআপ ও ক্লাউড ডিজাস্টার রিকভারি](#৭-স্বয়ংক্রিয়-ব্যাকআপ-ও-ক্লাউড-ডিজাস্টার-রিকভারি)
8. [প্রি-ফ্লাইট ভেরিফিকেশন ও চেকলিস্ট](#৮-প্রি-ফ্লাইট-ভেরিফিকেশন-ও-চেকলিস্ট)

---

### ১. সার্ভার রিকোয়ারমেন্ট ও প্রাক-প্রস্তুতি

মাদরাসার ডাটা নিরাপত্তা ও নির্বিঘ্ন সেবা নিশ্চিত করতে নিচের স্পেসিফিকেশন সম্পন্ন ক্লাউড ভিপিএস (DigitalOcean, Hetzner, Linode, AWS বা বাংলাদেশি বিডি-ডোমেন হোস্টিং) সুপারিশ করা হচ্ছে:

| উপাদান | ন্যূনতম স্পেসিফিকেশন | সুপারিশকৃত স্পেসিফিকেশন |
| :--- | :--- | :--- |
| **অপারেটিং সিস্টেম** | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS (x64) |
| **প্রসেসর (CPU)** | 2 Core vCPU | 4 Core vCPU |
| **মেমোরি (RAM)** | 2 GB RAM (with 2GB Swap) | 4 GB RAM বা তার বেশি |
| **স্টোরেজ (Disk)** | 25 GB NVMe SSD | 50 GB NVMe SSD |
| **রানটাইম** | Node.js v20.x LTS | Node.js v20.x LTS |

#### সার্ভার ইনিশিয়ালাইজেশন কমান্ড:
```bash
# প্যাকেজ আপডেট
sudo apt update && sudo apt upgrade -y

# প্রয়োজনীয় প্যাকেজসমূহ ইনস্টলেশন
sudo apt install -y curl git ufw nginx certbot python3-certbot-nginx

# Node.js 20 LTS ইনস্টলেশন
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# গ্লোবাল PM2 ইনস্টলেশন
sudo npm install -g pm2
```

---

### ২. এনভায়রনমেন্ট ভেরিয়েবল ও সিক্রেট কী কনফিগারেশন

প্রোডাকশন সার্ভারে প্রোজেক্ট ডিরেক্টরিতে `.env.production` ফাইল তৈরি করুন:
```bash
cp .env.production.example .env.production
chmod 600 .env.production
nano .env.production
```

#### ক্রিপ্টোগ্রাফিক সিক্রেট জেনারেশন:
সার্ভার টার্মিনালে নিচের কমান্ডগুলো চালিয়ে ইউনিক সিক্রেট কী তৈরি করুন:

1. **JWT_SECRET (ন্যূনতম ৩২ অক্ষর):**
   ```bash
   openssl rand -base64 48
   ```
2. **WEBHOOK_SIGNING_SECRET:**
   ```bash
   openssl rand -hex 32
   ```
3. **CRON_SECRET (অটোমেটেড মেইনটেন্যান্স ক্রন টোকেন):**
   ```bash
   openssl rand -hex 24
   ```

---

### ৩. লাইভ পেমেন্ট গেটওয়ে (bKash ও Nagad) সক্রিয়করণ

#### ৩.১ বিকাশ মার্চেন্ট গেটওয়ে (bKash Tokenized Checkout)
বিকাশ মার্চেন্ট অ্যাকাউন্ট সম্পন্ন হওয়ার পর বিকাশ মার্চেন্ট পোর্টাল থেকে লাইভ ক্রেডেনশিয়াল সংগ্রহ করুন:
```env
BKASH_MODE=PRODUCTION
BKASH_BASE_URL=https://tokenized.pay.bka.sh/v1.2.0-beta
BKASH_APP_KEY=আপনার_লাইভ_বিকাশ_অ্যাপ_কি
BKASH_APP_SECRET=আপনার_লাইভ_বিকাশ_অ্যাপ_সিক্রেট
BKASH_USERNAME=আপনার_লাইভ_মার্চেন্ট_ইউজারনেম
BKASH_PASSWORD=আপনার_লাইভ_মার্চেন্ট_পাসওয়ার্ড
BKASH_WEBHOOK_SECRET=আপনার_নির্ধারিত_ওয়েবহুক_সিক্রেট
```
> **নিরাপত্তা নোট:** বিকাশ পেমেন্ট ইন্টেন্ট তৈরির পর অর্থ পরিশোধ হলে স্বয়ংক্রিয়ভাবে মাদরাসার বিকাশ মার্চেন্ট ওয়ালেট এবং সাধারণ শিক্ষা তহবিলে ক্রেডিট এন্ট্রি তৈরি হয়।

#### ৩.২ নগদ মার্চেন্ট গেটওয়ে (Nagad Merchant API)
নগদ কর্পোরেট অ্যাকাউন্ট থেকে প্রাপ্ত ক্রেডেনশিয়াল ইনপুট করুন:
```env
NAGAD_MODE=PRODUCTION
NAGAD_BASE_URL=https://api.nagad.com.bd
NAGAD_MERCHANT_ID=আপনার_লাইভ_নগদ_মার্চেন্ট_আইডি
NAGAD_PUBLIC_KEY=আপনার_নগদ_পাবলিক_কি_পিইএম
NAGAD_PRIVATE_KEY=আপনার_নগদ_মার্চেন্ট_প্রাইভেট_কি_পিইএম
```

---

### ৪. বাল্ক এসএমএস ও ইমেইল নোটিফিকেশন সেটআপ

#### ৪.১ এসএমএস গেটওয়ে (অভিভাবকদের মোবাইলে অনুপস্থিতি ও ফি নোটিফিকেশন)
সিস্টেমে বাংলাদেশের যেকোনো স্বীকৃত বাল্ক এসএমএস এপিআই (Greenweb, SSL Wireless, MimSMS, BulkSMSBD) সমর্থন করে:
```env
SMS_GATEWAY_PROVIDER=GREENWEB
SMS_API_KEY=আপনার_এসএমএস_এপিআই_টোকেন
SMS_SENDER_ID=EHRJ_MADRASA
SMS_MOCK=false
```

#### ৪.২ ইমেইল নোটিফিকেশন (Gmail App Password)
মাদরাসার প্রাতিষ্ঠানিক জিমেইল অ্যাকাউন্টে **2-Step Verification** চালু করে একটি **16-digit App Password** তৈরি করুন:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ehrjmadrasha@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM="ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা <no-reply@ehrjmadrasha.com>"
SMTP_MOCK=false
```

---

### ৫. ডিপ্লয়মেন্ট পদ্ধতি

#### অপশন ক: ডকার কম্পোজ (সুপারিশকৃত ও সবচেয়ে সহজ)
```bash
# ১. রিপোজিটরি ক্লোন
git clone https://github.com/your-repo/ehrj-madrasha.git /app/ehrj
cd /app/ehrj

# ২. ডকার কন্টেইনার বিল্ড ও রান
docker compose up -d --build

# ৩. কন্টেইনার স্ট্যাটাস পর্যবেক্ষণ
docker compose ps
docker compose logs -f ehrj-app
```

#### অপশন খ: পিএম২ (PM2) ও সরাসরি নোড সার্ভিস (VPS)
```bash
# ১. ডিপেন্ডেন্সি ও বিল্ড
npm ci --production=false
npx prisma generate
npm run build

# ২. ডাটাবেজ ডিরেক্টরি পারমিশন নিশ্চিতকরণ
sudo mkdir -p /var/lib/ehrj/data /var/lib/ehrj/backups
sudo chown -R $USER:$USER /var/lib/ehrj

# ৩. পিএম২ দিয়ে সিঙ্গেল ইনস্ট্যান্স (SQLite-safe) রান
pm2 start deployment/ecosystem.config.js
pm2 save
pm2 startup
```

---

### ৬. ডোমেন ও SSL সার্টিফিকেট (Nginx + Let's Encrypt)

#### ৬.১ Nginx সাইট কনফিগারেশন:
`/etc/nginx/sites-available/ehrjmadrasha.com` তৈরি করুন:
```nginx
server {
    listen 80;
    server_name ehrjmadrasha.com www.ehrjmadrasha.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# সাইট এনাবল
sudo ln -s /etc/nginx/sites-available/ehrjmadrasha.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# ফ্রি অটো-রিনিউয়িং SSL সার্টিফিকেট গ্রহণ
sudo certbot --nginx -d ehrjmadrasha.com -d www.ehrjmadrasha.com
```

---

### ৭. স্বয়ংক্রিয় ব্যাকআপ ও ক্লাউড ডিজাস্টার রিকভারি

সিস্টেমে ডাটাবেজ ব্যাকআপ ও অডিট লগ অটোমেট করতে ক্রনট্যাব সেট করুন:
```bash
crontab -e
```
নিচের লাইনটি যুক্ত করুন (প্রতিদিন রাত ২:০০ টায় অটোমেটিক ব্যাকআপ গ্রহণ):
```cron
0 2 * * * curl -s -X POST http://localhost:3000/api/admin/operations/cron -H "Authorization: Bearer <আপনার_CRON_SECRET>" -H "Content-Type: application/json" -d '{"jobKey":"DAILY_DATABASE_BACKUP"}' >> /var/log/ehrj-backup.log 2>&1
```

---

### ৮. প্রি-ফ্লাইট ভেরিফিকেশন ও চেকলিস্ট

লাইভ সার্ভারে সফটওয়্যারটি চালুর পূর্বে প্রি-ফ্লাইট অডিট স্ক্রিপ্ট চালান:
```bash
npm run check:env
```

#### প্রত্যাশিত ফলাফল:
```
==================================================================
  EHRJ DIGITAL CAMPUS — PRODUCTION ENVIRONMENT AUDIT
==================================================================
✔ [PASS] [Runtime] NODE_ENV: NODE_ENV is set to production
✔ [PASS] [Security] APP_URL: APP_URL correctly set to https://www.ehrjmadrasha.com
✔ [PASS] [Security] JWT_SECRET: JWT_SECRET is cryptographically sound (64 chars).
✔ [PASS] [Payment Security] WEBHOOK_SIGNING_SECRET: WEBHOOK_SIGNING_SECRET is configured.
✔ [PASS] [Security] CRON_SECRET: CRON_SECRET is configured.
✔ [PASS] [Database] DATABASE_URL: DATABASE_URL configured: file:/var/lib/ehrj/data/prod.db
✔ [PASS] [Database] Filesystem Storage: Database directory is writable.
✔ [PASS] [Payment (bKash)] BKASH_MODE: Configured.
✔ [PASS] [Notifications] SMTP (Email): SMTP configured.
✔ [PASS] [Notifications] SMS Gateway: SMS Gateway API key is configured.
==================================================================
STATUS: 100% PRODUCTION READY — All strict security invariants passed.
==================================================================
```
