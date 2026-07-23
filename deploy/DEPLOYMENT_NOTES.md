# Deployment Notes for EHRJ Madrasha ERP

This guide outlines the basic deployment steps for a production Ubuntu/Debian server.

## 1. Prerequisites
- Node.js (v18 or v20)
- PostgreSQL (v14 or higher)
- PM2 (`npm install -g pm2`)
- Nginx
- Certbot (`sudo apt install certbot python3-certbot-nginx`)

## 2. Server Security (UFW)
Secure your server ports using UFW:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full' # Opens 80 and 443
sudo ufw enable
sudo ufw status
```

## 3. Environment Setup
Copy the production environment variables:
```bash
# In backend/
cp .env.production.example .env

# In frontend/
cp .env.production.example .env
```
Make sure to generate a strong `JWT_SECRET` and set the correct `DATABASE_URL`.

## 4. Build and Start (PM2)
```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma db push # Or npx prisma migrate deploy
npm run build

# Frontend
cd ../frontend
npm install
npm run build

# Start both with PM2
cd ../deploy
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 5. Reverse Proxy (Nginx)
1. Copy `nginx.conf.example` to `/etc/nginx/sites-available/ehrj-erp`
2. Update the `server_name` to your domain.
3. Enable it:
```bash
sudo ln -s /etc/nginx/sites-available/ehrj-erp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 6. SSL Configuration (Certbot)
Run Certbot to automatically configure SSL for your domain:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 7. Database Backup (Cron Job)
Create a backup script `/home/ubuntu/backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
TIMESTAMP=$(date +"%F_%T")
pg_dump postgres://user:password@localhost:5432/madrasha_db > $BACKUP_DIR/db_backup_$TIMESTAMP.sql
```
Make it executable: `chmod +x backup.sh`

Add a Cron job to run daily at 2 AM:
```bash
crontab -e
# Add the following line:
0 2 * * * /home/ubuntu/backup.sh
```
