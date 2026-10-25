# EHRJ MADRASHA ERP — PHASE 27 PRODUCTION DEPLOYMENT PLAN
**Project:** Eliotganj Hazi Rohmatollah Jamiria Madrasha ERP  
**Target Environment:** Production Public Deployment  
**Lead DevOps & Systems Architect:** Principal Enterprise Full-Stack Agent  
**Date:** 2026-10-21  

---

## 1. Hosting Architecture & Server Sizing

For reliable 24/7 institutional operations supporting ~1,500 students, 60 teachers, and 3,000 active guardians, the following production topology is specified:

```
[ Internet Traffic ]
        │
        ▼ (HTTPS / Port 443)
[ Cloudflare / Let's Encrypt TLS ]
        │
        ▼ (Reverse Proxy)
[ Nginx Web Server ] ──── (Static Assets / Gzip / Caching)
        │
        ▼ (Port 3000)
[ Next.js Node.js Cluster (PM2 Supervised) ]
        │
        ▼ (Database Connection Pool)
[ PostgreSQL 16+ Production Database (WAL Enabled) ]
        │
        ▼ (Automated Daily Backups)
[ S3 / Cloudflare R2 Offsite Encrypted Storage ]
```

### Recommended Infrastructure Specifications
- **Compute (VPS):** 4 vCPU, 8 GB RAM, 160 GB NVMe SSD (Ubuntu 24.04 LTS).
- **Providers:** Hetzner Cloud (CPX31 / ~$16/mo) or DigitalOcean (Droplet / ~$24/mo).
- **Estimated Infrastructure Cost:** ~$95 - $110 / month (including SMS & Cloud Storage).

---

## 2. Step-by-Step Server Setup & Next.js Deployment

### Step 1: System Packages & Node.js Runtime
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx postgresql postgresql-contrib certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### Step 2: Production Database Provisioning
```bash
sudo -u postgres psql
CREATE DATABASE ehrj_production;
CREATE USER ehrj_user WITH ENCRYPTED PASSWORD 'REPLACE_WITH_STRONG_RANDOM_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE ehrj_production TO ehrj_user;
\q
```

### Step 3: Application Code & Production Build
```bash
cd /var/www/
git clone https://github.com/organization/ehrj-madrasha-erp.git erp
cd erp
cp .env.example .env.production
# Configure DATABASE_URL, NEXTAUTH_SECRET, and BASE_URL in .env.production
npm ci --omit=dev
npx prisma migrate deploy
npm run build
```

### Step 4: PM2 Process Supervision
```bash
pm2 start npm --name "ehrj-erp" -- run start
pm2 save
pm2 startup
```

### Step 5: Nginx Reverse Proxy Configuration (`/etc/nginx/sites-available/ehrj`)
```nginx
server {
    server_name ehrjmadrasha.edu.bd www.ehrjmadrasha.edu.bd;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 25M;
}
```

### Step 6: Automated SSL/TLS Certificate
```bash
sudo ln -s /etc/nginx/sites-available/ehrj /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d ehrjmadrasha.edu.bd -d www.ehrjmadrasha.edu.bd
```

---

## 3. Automated Backup & Disaster Recovery Protocol

### Daily Automated Database Snapshot (`/opt/scripts/backup_db.sh`)
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/ehrj"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/ehrj_backup_$TIMESTAMP.sql.gz"
mkdir -p $BACKUP_DIR
pg_dump -U ehrj_user -h localhost ehrj_production | gzip > $FILENAME
# Retain 30 days locally
find $BACKUP_DIR -name "ehrj_backup_*.sql.gz" -mtime +30 -delete
```
- Schedule via cron: `0 2 * * * /opt/scripts/backup_db.sh` (Runs nightly at 2:00 AM).

### Rollback Procedure
If a production deployment encounters a critical regression:
1. Revert to previous Git release tag: `git checkout tags/v1.0.X`
2. Rebuild Next.js bundle: `npm run build`
3. Reload PM2 process cluster: `pm2 reload ehrj-erp`
4. If database rollback is needed, restore snapshot:
   ```bash
   gunzip -c /var/backups/ehrj/ehrj_backup_YYYYMMDD.sql.gz | psql -U ehrj_user -d ehrj_production
   ```

---

## 4. Flutter Mobile App Release & Signing Instructions

### Step 1: Institutional Keystore Generation
Execute once on a secure offline machine (never commit keystore to Git):
```bash
keytool -genkey -v -keystore ehrj-release.keystore \
  -alias ehrj-madrasha \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

### Step 2: Configure Android Release Properties
Create `ehrj_flutter_app/android/key.properties`:
```properties
storePassword=STORE_PASSWORD_HERE
keyPassword=KEY_PASSWORD_HERE
keyAlias=ehrj-madrasha
storeFile=/path/to/ehrj-release.keystore
```

### Step 3: Build Production Android App Bundle (AAB)
```bash
cd ehrj_flutter_app
flutter build appbundle --release --dart-define=API_BASE_URL=https://ehrjmadrasha.edu.bd
```
*Output Artifact:* `build/app/outputs/bundle/release/app-release.aab`  
*Destination:* Upload directly to Google Play Console under the Madrasa's verified developer account.

---

## 5. Live Gateway Integration Checklist (Owner Actions)

| Gateway | Required Information | Configuration Location | Status |
| :--- | :--- | :--- | :--- |
| **bKash Checkout** | `app_key`, `app_secret`, `username`, `password` | `.env.production` | Awaiting merchant credential delivery |
| **Nagad Online** | `merchant_id`, `merchant_private_key`, `pg_public_key` | `.env.production` | Awaiting merchant credential delivery |
| **BTRC Bulk SMS** | Masking Sender ID (`EHRJ_MADRASHA`), API Key | `.env.production` | Awaiting telecom token approval |
| **Google Play** | Google Play Console Developer Account ($25 fee) | Google Play Portal | Awaiting institutional account registration |
