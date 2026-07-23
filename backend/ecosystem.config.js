// backend/ecosystem.config.js
// Production PM2 Configuration

module.exports = {
  apps: [
    {
      name: 'madrasha-erp-api',
      script: './dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};
