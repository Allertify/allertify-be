module.exports = {
  apps: [{
    name: 'allertify-backend',
    script: 'docker exec allertify-be node dist/index.js',
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
      DATABASE_URL: 'postgresql://allertify:12345678@localhost:5437/allertify',
      JWT_ACCESS_SECRET: '4lL3rT1FFy_BE_ACC',
      JWT_REFRESH_SECRET: '4lL3rT1FFy_BE_RFR',
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS,
      SMTP_FROM: process.env.SMTP_FROM,
      BYPASS_AI: 'false',
      DEFAULT_TIMEZONE: 'Asia/Jakarta',
      HARDCODED_USER_ID: '1',
      HARDCODED_USER_EMAIL: 'test@example.com',
      HARDCODED_USER_ROLE: 'user',
      HARDCODED_ALLERGENS: 'gluten,lactose,nuts,shellfish,eggs'
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true
  }]
};
