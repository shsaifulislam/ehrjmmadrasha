# EHRJ Digital Campus & ERP — Rollback & Disaster Recovery Specification
**Document Version:** 1.0.0  
**Disaster Recovery Engine:** `src/lib/operationsEngine.ts`  
**Database Snapshot Directory:** `backups/`  

---

## 1. Current Rollback Capabilities Overview

| Capability | Status | Implementation Detail |
| :--- | :--- | :--- |
| **Application Code Rollback** | **SUPPORTED** | Git commit / release tag checkout + clean rebuild (`npm ci && npm run build`) + PM2 reload. |
| **Database Snapshot Rollback** | **SUPPORTED** | Verified binary replacement via Admin Restore API or manual filesystem copy with automatic `PRE_RESTORE` snapshot. |
| **Configuration Rollback** | **SUPPORTED (MANUAL)**| Reverting changes in `.env` and reloading PM2. |
| **Automated Zero-Downtime Blue/Green Rollback** | **NOT IMPLEMENTED** | Single-node architecture with atomic PM2 reload. |
| **SQL Down-Migrations** | **NOT IMPLEMENTED** | Prisma schema synchronization (`prisma db push`) does not generate reversible down-migration scripts. Database rollback requires full snapshot restore. |
| **Multi-Region Failover** | **NOT IMPLEMENTED** | Application is hosted on a single server node. |

---

## 2. Emergency Rollback Playbook

If a new production release introduces a critical defect, data corruption, or service degradation, follow the appropriate recovery procedure below.

### Scenario A: Application Code Defect (Database Intact)

When the defect is purely in the frontend, server components, or application logic, and the database schema has not been altered:

```bash
# 1. Navigate to application root
cd /var/www/ehrj-app

# 2. Check out the previous verified stable commit or tag
git checkout <PREVIOUS_STABLE_COMMIT_HASH_OR_TAG>

# 3. Clean install dependencies from lockfile
npm ci --production=false

# 4. Re-generate Prisma Client matching previous codebase
npx prisma generate

# 5. Recompile Next.js bundle
npm run build

# 6. Gracefully reload PM2 process
pm2 reload ehrj-digital-campus

# 7. Confirm application recovery
curl -i http://localhost:3000/api/health
```

---

### Scenario B: Database Schema or Data Corruption

When bad migration, corrupted state, or data loss has occurred:

> [!CRITICAL]
> **Safety Rule:** Never overwrite a production database without taking an immediate backup snapshot first. The system automated restore engine enforces this invariant.

#### Method 1: Automated Restore via Admin Operations API (Recommended)

The system includes a built-in recovery mechanism in [`src/lib/operationsEngine.ts`](file:///d:/Eliotgonj%20Hazi%20Rohmatollah%20Jamiria%20Madrasha%20Web%20Aplication/src/lib/operationsEngine.ts):

1. **Locate Target Backup ID:**
   Check available backups in the Admin UI (`/admin/operations`) or query SQLite:
   ```bash
   node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.systemBackup.findMany({ where: { status: 'COMPLETED' }, orderBy: { createdAt: 'desc' }, take: 5 }).then(console.log);"
   ```
2. **Execute Disaster Recovery Drill (Optional Dry-Run):**
   Verifies snapshot header, checksum, and uncorrupted tables without affecting the live DB.
3. **Execute Restore:**
   Send authenticated POST request to `/api/admin/operations/restore`:
   ```bash
   curl -X POST http://localhost:3000/api/admin/operations/restore \
     -H "Cookie: auth_session=<ADMIN_SESSION_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{
       "backupId": "<TARGET_BACKUP_RECORD_ID>",
       "confirmation": "RESTORE PRODUCTION DATABASE",
       "reason": "Emergency rollback of release due to critical bug"
     }'
   ```
   **What happens automatically:**
   - System creates an automatic safety snapshot (`PRE_RESTORE`) of the current live database before touching it.
   - Atomically swaps the database file.
   - Preserves backup history records into the restored database.
   - Records an immutable audit log entry in `AuditLog`.
4. **Reload Process:**
   ```bash
   pm2 reload ehrj-digital-campus
   ```

#### Method 2: Manual Filesystem Recovery (Emergency Fallback)

If the web server is completely unresponsive:

```bash
# 1. Stop PM2 process
pm2 stop ehrj-digital-campus

# 2. Navigate to application root
cd /var/www/ehrj-app

# 3. Create manual safety copy of current corrupt database
cp prisma/prod.db prisma/prod.db.emergency-bak-$(date +%Y%m%d%H%M%S)

# 4. Choose verified backup file from backups/ directory
# Example: backups/EHRJ-BKP-20260928-154118.db
ls -lht backups/*.db | head -n 5

# 5. Overwrite production database file
cp backups/<CHOSEN_BACKUP_FILE>.db prisma/prod.db

# 6. Remove stale SQLite WAL and shared memory sidecar files
rm -f prisma/prod.db-wal prisma/prod.db-shm

# 7. Verify SQLite 3 file header
head -c 16 prisma/prod.db
# Must print: SQLite format 3

# 8. Start PM2 process
pm2 start ehrj-digital-campus

# 9. Verify health
curl -i http://localhost:3000/api/health
```

---

## 3. Configuration Rollback (`.env`)

If an environment configuration change broke functionality:
1. Revert `.env` to the prior known-good configuration.
2. If `JWT_SECRET` was rotated and users are locked out, reverting to the previous secret immediately restores existing sessions (unless sessions expired or were revoked in DB).
3. If payment gateway credentials were changed, reverting immediately restores the prior gateway mode.
4. Restart PM2: `pm2 restart ehrj-digital-campus --update-env`.

---

## 4. Post-Rollback Verification Checklist

Following any rollback action, immediately verify:
- [ ] Process status: `pm2 status` shows `online` with 0 unexpected restarts.
- [ ] Health endpoint: `curl http://localhost:3000/api/health` returns status `HEALTHY`.
- [ ] SQLite WAL status: `prisma/prod.db` is present and queryable.
- [ ] Authentication: Administrator can log in at `/login`.
- [ ] Critical Portals: Check `/results`, `/admission`, `/portal`, and `/admin`.
- [ ] Audit Log: Confirm the restore action was logged in `/admin/operations`.
