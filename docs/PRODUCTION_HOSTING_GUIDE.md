# ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা
## প্রফেশনাল ডোমেন ও হোস্টিং ডিপ্লয়মেন্ট গাইডলাইন (Production Hosting Manual)

এই ডকুমেন্টটিতে আমাদের মাদ্রাসার ওয়েব অ্যাপ্লিকেশনটি লোকালহোস্ট থেকে সম্পূর্ণ প্রফেশনাল লাইভ ডোমেন ও হোস্টিংয়ে আপলোড ও চালু করার সহজ ও নির্ভরযোগ্য পদক্ষেপগুলো তুলে ধরা হলো।

---

### ১. ডোমেন ও হোস্টিং কেনার পরামর্শ

#### ক) ডোমেন নির্বাচন:
- **পছন্দসই নাম:** যেমন `ehrjmadrasha.com`, `ehrjmadrasha.edu.bd`, `jamiriamadrasha.org` ইত্যাদি।
- **কোথা থেকে কিনবেন:** Namecheap, Cloudflare, অথবা বাংলাদেশের নির্ভরযোগ্য প্রোভাইডার (যেমন: ExonHost, DianaHost, XeonBD)।

#### খ) হোস্টিং নির্বাচন (৩টি বিকল্পের যেকোনো একটি):
1. **সবচেয়ে ভালো ও সাশ্রয়ী (VPS / Cloud Server - প্রস্তাবিত):**
   - **সার্ভার:** Ubuntu 22.04 বা 24.04 LTS (কমপক্ষে 1GB/2GB RAM, 1 CPU Core, 25GB+ SSD)।
   - **প্রোভাইডার:** Hetzner (€4/মাস), DigitalOcean ($6/মাস), Contabo ($5.50/মাস), বা AWS Lightsail ($5/মাস)।
   - **সুবিধা:** সম্পূর্ণ নিজস্ব সার্ভার, ব্যাকআপ অটোমেশন, কোনো মাসিক ফি নেই, আনলিমিটেড ব্যবহার।
2. **সহজ ক্লাউড ডিপ্লয়মেন্ট (Vercel / Railway):**
   - গিটহাবে পুশ করে ১-ক্লিকেই সম্পূর্ণ লাইভ করা যায়। ফ্রি টিয়ার দিয়েও শুরু করা সম্ভব।
3. **cPanel হোস্টিং (Node.js App Selector সহ):**
   - বাংলাদেশের বেশিরভাগ সাধারণ শেয়ার্ড হোস্টিংয়ে cPanel-এর "Setup Node.js App" অপশন থাকে।

---

### ২. ডোমেনের DNS কনফিগারেশন

ডোমেন কেনার পর ডোমেনের DNS ম্যানেজমেন্টে গিয়ে সার্ভারের আইপি (Server IP) সেট করতে হবে:
- **Type A Record:** Host `@` -> Value `YOUR_SERVER_PUBLIC_IP`
- **Type CNAME Record:** Host `www` -> Value `yourdomain.com`

---

### ৩. VPS সার্ভারে ডিপ্লয় করার সম্পূর্ণ কমান্ড (Step-by-Step)

#### ধাপ ১: সার্ভার আপডেট ও Node.js ইনস্টলেশন
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git certbot python3-certbot-nginx
sudo npm install -g pm2
```

#### ধাপ ২: প্রজেক্ট ক্লোন বা ফাইল আপলোড
```bash
# প্রজেক্ট ডিরেক্টরি তৈরি
sudo mkdir -p /var/www/ehrj-app
sudo chown -R $USER:$USER /var/www/ehrj-app
cd /var/www/ehrj-app

# গিট থেকে ক্লোন করুন অথবা ফাইল আপলোড করুন
git clone <YOUR_GIT_REPO_URL> .
```

#### ধাপ ৩: প্রোডাকশন পরিবেশ কনফিগারেশন (.env)
```bash
cp deployment/production.env.example .env
nano .env
```
`.env` ফাইলে নিচের তথ্যগুলো বসিয়ে সেভ করুন:
```env
NODE_ENV=production
PORT=3000
APP_URL=https://yourdomain.com
JWT_SECRET=your_super_strong_64_character_random_secret_key
DATABASE_URL="file:./prisma/prod.db"
```

#### ধাপ ৪: ডিপেনডেন্সি ইনস্টল ও বিল্ড তৈরি
```bash
npm ci --production=false
npx prisma generate
npx prisma db push
node prisma/seed.js
npm run build
```

#### ধাপ ৫: PM2 দিয়ে ব্যাকগ্রাউন্ডে চালু করা (Auto-Restart on Reboot)
```bash
pm2 start deployment/ecosystem.config.js
pm2 save
pm2 startup
```

---

### ৪. Nginx রিভার্স প্রক্সি ও ফ্রি SSL (HTTPS) কনফিগারেশন

#### ধাপ ১: Nginx কনফিগারেশন সেটআপ
```bash
sudo cp deployment/nginx.conf /etc/nginx/sites-available/ehrj-app
sudo sed -i 's/ehrjmadrasha.com/yourdomain.com/g' /etc/nginx/sites-available/ehrj-app
sudo ln -s /etc/nginx/sites-available/ehrj-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

#### ধাপ ২: ফ্রি SSL (Let's Encrypt HTTPS) সার্টিফিকেট
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
সার্টিফিকেট স্বয়ংক্রিয়ভাবে নবায়ন (Auto-renew) হবে।

---

### ৫. ডকার (Docker) দিয়ে ১-ক্লিকে ডিপ্লয়মেন্ট (বিকল্প পদ্ধতি)

সার্ভারে যদি Docker থাকে, তবে কোনো কনফিগারেশন ছাড়াই ১ ক্লিকে অ্যাপ চালু করতে পারেন:
```bash
docker compose up -d --build
```
এটি স্বয়ংক্রিয়ভাবে কনটেইনারের ভেতরে প্রোডাকশন বিল্ড তৈরি করে পোর্ট `3000`-এ অ্যাপ্লিকেশনটি লাইভ রাখবে।

---

### ৬. নিয়মিত ব্যাকআপ নিশ্চিতকরণ (Cron Job)

প্রতিদিন রাত ২টায় স্বয়ংক্রিয় ব্যাকআপের জন্য সার্ভারে ক্রনজব সক্রিয় করতে পারেন:
```bash
crontab -e
```
নিচের লাইনটি যুক্ত করুন:
```bash
0 2 * * * cd /var/www/ehrj-app && node -e "require('./src/lib/operationsEngine').createSystemBackup('AUTOMATIC')" >> /var/log/ehrj/backup.log 2>&1
```

---

**উপসংহার:** এই আর্কিটেকচারটি সম্পূর্ণ রিয়েল এন্টারপ্রাইজ গ্রেডে প্রস্তুত। আপনি ডোমেন ও হোস্টিং কিনলেই উপরের গাইড অনুযায়ী যেকোনো সময় এটি লাইভ করে ফেলতে পারবেন।
