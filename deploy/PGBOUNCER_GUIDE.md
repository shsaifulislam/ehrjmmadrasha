# PgBouncer Integration Guidelines for EHRJ ERP

To support high concurrency, especially since the application now scales across all CPU cores using PM2 cluster mode (`instances: 'max'`), the number of database connections to PostgreSQL can quickly hit the limit. Integrating **PgBouncer** will pool and manage database connections efficiently.

## 1. Installation

### On Ubuntu/Debian:
```bash
sudo apt update
sudo apt install pgbouncer
```

## 2. Configuration (`/etc/pgbouncer/pgbouncer.ini`)

Replace `<DB_USER>` and `<DB_PASS>` with your actual PostgreSQL credentials.

```ini
[databases]
# Format: db_name = host=127.0.0.1 port=5432 dbname=db_name user=db_user password=db_pass
ehrjmadrasha_erp = host=127.0.0.1 port=5432 dbname=ehrjmadrasha_erp

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt

# Transaction pooling is recommended for Prisma
pool_mode = transaction

max_client_conn = 1000
default_pool_size = 20
```

## 3. Auth File (`/etc/pgbouncer/userlist.txt`)

Add the PostgreSQL users and their md5 hashed passwords:
```txt
"ehrjmadrasha_user" "md5_hash_of_password"
```

## 4. Prisma Specific Configuration

Since PgBouncer uses `transaction` mode, Prisma requires specific configuration to work properly.

1. Update your `.env` in the `backend` folder:
```env
# Original database URL (used for migrations)
DIRECT_URL="postgresql://user:password@localhost:5432/ehrjmadrasha_erp?schema=public"

# PgBouncer connection string (note the port 6432 and pgBouncer=true)
DATABASE_URL="postgresql://user:password@localhost:6432/ehrjmadrasha_erp?schema=public&pgbouncer=true"
```

2. Ensure `schema.prisma` is set up correctly (already configured if you followed standard Prisma setup):
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

3. Restart backend and Prisma:
```bash
npx prisma generate
pm2 reload ehrj-backend
```

By following these guidelines, the ERP will seamlessly handle high concurrency without overwhelming the database with too many open connections.
