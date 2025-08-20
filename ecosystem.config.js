module.exports = {
  apps: [{
    name: 'allertify-backend',
    script: 'docker exec -it allertify-be node dist/index.js',
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
      CLOUDINARY_CLOUD_NAME: 'dvlsclorg',
      CLOUDINARY_API_KEY: '726327219123868',
      CLOUDINARY_API_SECRET: 'UF0HD89O-4IhQY2_NWE0qBjDfCc',
      GEMINI_API_KEY: 'AIzaSyBKPkySOCvHasm2MlFi0Njp36RNmwIZ2XI',
      SMTP_USER: 'arvanyudhistiaardana@gmail.com',
      SMTP_PASS: 'mglckoproodsaief',
      SMTP_FROM: 'arvanyudhistiaardana@gmail.com',
      BYPASS_AUTH: 'false',
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
