// EHRJ MADRASHA ERP — PRODUCTION PM2 ECOSYSTEM SPECIFICATION
module.exports = {
  apps: [
    {
      name: "ehrj-digital-campus",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      // SQLite safety: use single-instance fork mode to prevent SQLITE_BUSY write locks.
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/pm2-err.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      autorestart: true,
      restart_delay: 5000,
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
  ],
};
