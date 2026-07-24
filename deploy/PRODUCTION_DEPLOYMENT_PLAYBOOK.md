# EHRJ Madrasha ERP — Production Deployment Playbook & Disaster Recovery Plan

This playbook provides step-by-step instructions for deploying and maintaining the **EHRJ Madrasha ERP & Public Website** on a production Ubuntu 22.04 LTS server.

---

## 🏗️ 1. Architecture Overview

```text
               HTTPS Requests (Port 443)
                         │
                         ▼
                ┌──────────────────┐
                │ Nginx Web Server │  (SSL/TLS, Rate Limiting, Static Assets)
                └────────┬─────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
┌──────────────┐                 ┌────────────────┐
│ Next.js App  │  (Port 3000)    │ Node API Cluster│  (Port 3001, PM2 Max Instances)
└──────────────┘                 └───────┬────────┘
                                         │
                   ┌─────────────────────┼─────────────────────┐
                   │                     │                     │
                   ▼                     ▼                     ▼
           ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
           │ Redis Cache   │     │  PgBouncer    │     │ S3/Cloudinary │ (File Storage)
           └───────────────┘     └───────┬───────┘     └───────────────┘
                                         │ (Transaction Pooling)
                                         ▼
                                 ┌───────────────┐
                                 │ PostgreSQL 16 │ (Primary Database)
                                 └───────────────┘
```

---

## 📋 2. Server Requirements & Prerequisites

- **OS:** Ubuntu 22.04 / 24.04 LTS
- **CPU:** 4 Cores minimum (8 Cores recommended for high concurrency)
- **RAM:** 8 GB minimum (16 GB recommended)
- **Storage:** 80 GB NVMe SSD
- **Required Software:** Node.js v20+, PostgreSQL 16, PgBouncer, Redis, Nginx, Certbot, PM2.

---

## 🚀 3. Step-by-Step Production Installation

### Step 3.1: System Updates & Dependencies
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git unzip build-essential ufw certbot python3-certbot-nginx
```

### Step 3.2: Install Node.js v20 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2 pm2-logrotate
```

### Step 3.3: Install PostgreSQL 16, PgBouncer & Redis
```bash
sudo apt install -y postgresql postgresql-contrib pgbouncer redis-server
```

---

## 🗄️ 4. Database Setup & PgBouncer Configuration

### Step 4.1: PostgreSQL User & Database Creation
```bash
sudo -u postgres psql -c "CREATE USER ehrj_user WITH PASSWORD 'SecureProductionPassword2026!';"
sudo -u postgres psql -c "CREATE DATABASE ehrj_madrasha_db OWNER ehrj_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ehrj_madrasha_db TO ehrj_user;"
```

### Step 4.2: PgBouncer Configuration (`/etc/pgbouncer/pgbouncer.ini`)
```ini
[databases]
ehrj_madrasha_db = host=127.0.0.1 port=5432 dbname=ehrj_madrasha_db user=ehrj_user password=SecureProductionPassword2026!

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 5000
default_pool_size = 50
min_pool_size = 10
reserve_pool_size = 10
```

Restart services:
```bash
sudo systemctl restart pgbouncer
sudo systemctl enable pgbouncer
```

---

## ⚙️ 5. Application Deployment

### Step 5.1: Clone & Install Dependencies
```bash
cd /var/www
git clone https://github.com/your-org/ehrjmadrasha_erp_production.git ehrjmadrasha
cd ehrjmadrasha

# Install backend & frontend
cd backend && npm ci
cd ../frontend && npm ci
```

### Step 5.2: Production Environment Variables (`backend/.env`)
```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://ehrjmadrasha.com
DATABASE_URL="postgresql://ehrj_user:SecureProductionPassword2026!@127.0.0.1:6432/ehrj_madrasha_db?pgbouncer=true"
DIRECT_URL="postgresql://ehrj_user:SecureProductionPassword2026!@127.0.0.1:5432/ehrj_madrasha_db"

JWT_SECRET="c987f6e5d4c3b2a10987654321fedcba9876543210123456789abcdef0123456"
JWT_EXPIRES_IN="7d"

REDIS_URL="redis://127.0.0.1:6379"
STORAGE_PROVIDER="local" # Or "s3" / "cloudinary"
MAX_FILE_SIZE=5242880

SMS_PRIMARY_PROVIDER="greenweb"
SMS_FALLBACK_PROVIDER="bulksmsbd"
```

### Step 5.3: Run Database Migrations & Build
```bash
# Backend
cd /var/www/ehrjmadrasha/backend
npx prisma db push
npx prisma generate
npm run build

# Frontend
cd /var/www/ehrjmadrasha/frontend
npm run build
```

### Step 5.4: Start Services via PM2 Cluster Mode
```bash
cd /var/www/ehrjmadrasha
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🌐 6. Nginx & SSL Setup (`deploy/nginx.conf`)

Save to `/etc/nginx/sites-available/ehrjmadrasha.edu.bd`:

```nginx
server {
    server_name ehrjmadrasha.edu.bd www.ehrjmadrasha.edu.bd;

    # Frontend Reverse Proxy
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API Reverse Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static Uploads Direct Nginx Serving with Caching
    location /uploads/ {
        alias /var/www/ehrjmadrasha/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

Enable site & SSL:
```bash
sudo ln -s /etc/nginx/sites-available/ehrjmadrasha.edu.bd /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d ehrjmadrasha.edu.bd -d www.ehrjmadrasha.edu.bd
```

---

## 💾 7. Automated Database Backup & Disaster Recovery Plan

### Automated Backup Script (`/var/www/backup_db.sh`)
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/ehrj_madrasha"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="db_backup_${DATE}.sql.gz"

mkdir -p $BACKUP_DIR
pg_dump -U ehrj_user -h 127.0.0.1 -p 5432 ehrj_madrasha_db | gzip > "${BACKUP_DIR}/${FILENAME}"

# Delete backups older than 30 days
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +30 -delete

echo "[$(date)] Backup completed: ${FILENAME}" >> /var/log/db_backup.log
```

Schedule daily cron at 2 AM:
```bash
crontab -e
# Add: 0 2 * * * /bin/bash /var/www/backup_db.sh
```

### Emergency Restore Procedure (Disaster Recovery)
If server crashes or data gets corrupted:
```bash
# 1. Stop background workers
pm2 stop all

# 2. Drop corrupted database and recreate
sudo -u postgres psql -c "DROP DATABASE ehrj_madrasha_db;"
sudo -u postgres psql -c "CREATE DATABASE ehrj_madrasha_db OWNER ehrj_user;"

# 3. Restore from latest backup
gunzip -c /var/backups/ehrj_madrasha/db_backup_LATEST.sql.gz | psql -U ehrj_user -h 127.0.0.1 -d ehrj_madrasha_db

# 4. Restart services
pm2 restart all
```

---

## 🩺 8. System Health Check Endpoint

Monitor endpoint: `GET https://ehrjmadrasha.edu.bd/api/health`

Response:
```json
{
  "success": true,
  "message": "System is fully operational",
  "database": {
    "status": "HEALTHY",
    "latencyMs": 4
  },
  "uptimeSeconds": 86400,
  "timestamp": "2026-07-23T19:00:00.000Z",
  "environment": "production"
}
```
