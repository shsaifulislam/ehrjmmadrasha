// EHRJ MADRASHA ERP — PRODUCTION PM2 ECOSYSTEM SPECIFICATION
module.exports = {
  apps: [
    {
      name: "ehrj-digital-campus",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: "/var/www/ehrj-app",
      instances: "max", // Cluster mode across all CPU cores
      exec_mode: "cluster",
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
