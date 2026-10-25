# EHRJ MADRASHA ERP — STAGING CONFIGURATION & RUNTIME GUIDE
## Isolated PostgreSQL Environment Operations, Credential Hardening & Dual-Port Execution

**Document ID:** `EHRJ-STG-CONFIG-01`  
**Date:** October 18, 2026  
**Audience:** DevOps Engineers, System Administrators & Full-Stack Developers  

---

## 1. Architectural Topology

```
+-----------------------------------------------------------------------------------------+
|                               LOCAL DEVELOPMENT HOST                                    |
|                                                                                         |
|  +-----------------------------------+         +-------------------------------------+  |
|  |     PRODUCTION-LIKE WORKSPACE     |         |     ISOLATED STAGING WORKSPACE      |  |
|  |                                   |         |                                     |  |
|  |  Next.js Server: Port 3000        |         |  Next.js Server: Port 3001          |  |
|  |  Config: .env                     |         |  Config: .env.staging (Gitignored)  |  |
|  |  Cache/Dist: .next/               |         |  Cache/Dist: .next_staging/         |  |
|  |  Client: @prisma/client           |         |  Client: scratch/prisma-staging-cl. |  |
|  |  Database: SQLite (dev.db, WAL)   |         |  Database: PostgreSQL (ehrj_staging)|  |
|  +-----------------+-----------------+         +------------------+------------------+  |
|                    |                                              |                     |
|                    v                                              v                     |
|          prisma/dev.db (10.47 MB)                     localhost:5432/ehrj_staging       |
|                                                       (User: ehrj_staging_user)         |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Environment Variables Specification

The staging environment uses an isolated file `.env.staging` (which is strictly gitignored via `.gitignore`). Never commit this file or expose its values in logs.

### Required Variables:
```ini
# Isolated PostgreSQL Staging Configuration
STAGING_DATABASE_URL="postgresql://ehrj_staging_user:<SECURE_PASSWORD>@localhost:5432/ehrj_staging?schema=public"
PORT=3001
NEXT_DIST_DIR=".next_staging"
USE_POSTGRES_STAGING="true"
DATABASE_PROVIDER="postgresql"
NEXT_PUBLIC_APP_ENV="staging"
NEXT_PUBLIC_APP_URL="http://localhost:3001"
```

---

## 3. Dedicated Database Role & Security Hardening

To follow the principle of least privilege, staging queries must **never** connect as the `postgres` superuser. Instead, a dedicated user `ehrj_staging_user` is provisioned.

### Credential Rotation Procedure:
Execute `scratch/rotate_staging_credentials.ts` using `npx tsx`:
```powershell
npx tsx scratch/rotate_staging_credentials.ts
```

This automated script:
1. Generates a 32-character cryptographically random password using Node.js `crypto.randomBytes(24).toString('base64url')`.
2. Connects via superuser and provisions/rotates role `ehrj_staging_user`:
   ```sql
   DO $$
   BEGIN
     IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'ehrj_staging_user') THEN
       CREATE ROLE ehrj_staging_user WITH LOGIN PASSWORD '<GENERATED_PASSWORD>';
     ELSE
       ALTER ROLE ehrj_staging_user WITH PASSWORD '<GENERATED_PASSWORD>';
     END IF;
   END
   $$;
   ```
3. Grants scoped permissions exclusively on database `ehrj_staging`:
   ```sql
   GRANT ALL ON SCHEMA public TO ehrj_staging_user;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ehrj_staging_user;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ehrj_staging_user;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ehrj_staging_user;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ehrj_staging_user;
   ```
4. Rewrites `.env.staging` with the rotated credentials.

---

## 4. Starting the Staging Server Concurrently

To start the staging server on Port 3001 without stopping or interfering with the SQLite server on Port 3000:

```powershell
node scripts/start-staging.mjs
```

### Verification:
Open another terminal and query the health endpoint:
```powershell
curl http://localhost:3001/api/health
```

Expected Output:
```json
{
  "status": "HEALTHY",
  "version": "1.0.0",
  "environment": "staging",
  "databaseProvider": "postgresql",
  "maintenance": { "isActive": false }
}
```

---

## 5. Configuring the Flutter App for Staging

The mobile app supports two independent configuration pathways to target staging:

### Pathway A: Build-Time Environment Variable
When running or compiling the Flutter app, pass `--dart-define`:
```powershell
flutter run --dart-define=API_BASE_URL=http://localhost:3001
# For Android Emulator:
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001
```

### Pathway B: In-App Dynamic Server Switcher
1. Log in to the app with administrative credentials.
2. Navigate to **System Settings (`/admin/settings`)**.
3. Select **Server Configuration**.
4. Enter `http://localhost:3001` (or your LAN IP `http://192.168.0.x:3001`).
5. Tap **Save & Apply**. The app immediately updates `ApiClient.baseUrl` and tests latency.

---

## 6. Teardown & Environment Reset

If you need to abandon or reset the isolated staging database cleanly:

```powershell
# Terminate staging process
# In PostgreSQL superuser psql:
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'ehrj_staging';
DROP DATABASE ehrj_staging;
CREATE DATABASE ehrj_staging;
```

Then re-run the schema push and data migration from `scratch/staging_migration_and_reconciliation.ts`.
