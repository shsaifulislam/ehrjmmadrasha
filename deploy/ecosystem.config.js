module.exports = {
  apps: [
    {
      name: 'ehrj-backend',
      script: './dist/server.js',
      cwd: './backend',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'ehrj-frontend',
      script: './node_modules/next/dist/bin/next',
      args: 'start',
      cwd: './frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
