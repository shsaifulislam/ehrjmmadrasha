#!/bin/bash
# ==============================================================================
# Automated PostgreSQL Daily Cron Backup Script for Madrasa ERP Production VPS
# Path: /var/www/madrasha_erp/backend/scripts/cron_daily_backup.sh
# ==============================================================================

BACKUP_DIR="/var/backups/madrasha_erp"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="${BACKUP_DIR}/db_backup_${TIMESTAMP}.sql.gz"
LOG_FILE="${BACKUP_DIR}/backup.log"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting daily PostgreSQL backup..." >> "${LOG_FILE}"

# Load environment variables
if [ -f /var/www/madrasha_erp/backend/.env ]; then
  export $(grep -v '^#' /var/www/madrasha_erp/backend/.env | xargs)
fi

# Run pg_dump with gzip compression
pg_dump "${DATABASE_URL}" --clean --if-exists | gzip > "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
  echo "[$(date)] ✅ Backup successful: ${BACKUP_FILE}" >> "${LOG_FILE}"
  # Retain last 30 days of backups only (delete older backups)
  find "${BACKUP_DIR}" -name "db_backup_*.sql.gz" -mtime +30 -exec rm -f {} \;
  echo "[$(date)] 🧹 Purged backups older than 30 days." >> "${LOG_FILE}"
else
  echo "[$(date)] ❌ Backup FAILED!" >> "${LOG_FILE}"
  exit 1
fi
