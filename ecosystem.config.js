module.exports = {
  apps: [{
    name: 'allertify-backend',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3001,
      DATABASE_URL: 'postgresql://allertify:12345678@localhost:5437/allertify'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      DATABASE_URL: 'postgresql://allertify:12345678@localhost:5437/allertify'
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true
  }]
};
