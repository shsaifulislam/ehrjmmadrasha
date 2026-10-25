#!/bin/bash
# EHRJ Madrasha ERP — Automated Daily PostgreSQL Backup Script
# Place in /var/www/backup_db.sh and add to crontab (0 2 * * *)

BACKUP_DIR="/var/backups/ehrj_madrasha"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="db_backup_${DATE}.sql.gz"
LOG_FILE="/var/log/db_backup.log"

# Ensure backup directory exists
mkdir -p $BACKUP_DIR

# Perform Database Dump
pg_dump -U ehrj_user -h 127.0.0.1 -p 5432 ehrj_madrasha_db | gzip > "${BACKUP_DIR}/${FILENAME}"

# Verify backup success
if [ $? -eq 0 ]; then
  echo "[$(date)] SUCCESS: Database backup created at ${BACKUP_DIR}/${FILENAME}" >> $LOG_FILE
else
  echo "[$(date)] ERROR: Database backup failed!" >> $LOG_FILE
fi

# Retention policy: Delete backups older than 30 days
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +30 -delete
