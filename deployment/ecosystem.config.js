// EHRJ MADRASHA ERP — PRODUCTION PM2 ECOSYSTEM SPECIFICATION
module.exports = {
  apps: [
    {
      name: "ehrj-digital-campus",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      // SQLite safety: use single-instance fork mode to prevent SQLITE_BUSY write locks.
      // (Set instances: "max", exec_mode: "cluster" only when using external PostgreSQL)
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "1G",
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "/var/log/ehrj/err.log",
      out_file: "/var/log/ehrj/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      autorestart: true,
      restart_delay: 5000,
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
  ],
};
