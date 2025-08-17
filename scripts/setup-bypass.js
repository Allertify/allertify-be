#!/usr/bin/env node

/**
 * Universal Setup Script untuk Bypass Authentication
 * Bisa dijalankan dari npm scripts atau langsung
 */

const fs = require('fs');
const path = require('path');

console.log('🔓 Setting up Bypass Authentication for Development...\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), 'env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    console.log('📁 .env file tidak ditemukan, copying dari env.example...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file berhasil dibuat dari env.example');
  } else {
    console.log('❌ env.example tidak ditemukan, membuat .env baru...');
    const defaultEnvContent = `# Database Configuration
DATABASE_URL="postgresql://postgres:PasswordBaru123!@localhost:5432/allertify_"

# JWT Configuration
JWT_ACCESS_SECRET="your-secret-key-here"
JWT_REFRESH_SECRET="your-refresh-secret-here"

# Development/Testing Bypass
BYPASS_AUTH="true"

# Hardcoded User Data
HARDCODED_USER_ID="1"
HARDCODED_USER_EMAIL="test@example.com"
HARDCODED_USER_ROLE="user"

# Hardcoded Allergens
HARDCODED_ALLERGENS="gluten,lactose,nuts,shellfish,eggs"

# AI Service Configuration
OPENAI_API_KEY="your-openai-api-key"
GOOGLE_AI_API_KEY="your-google-ai-api-key"
GEMINI_API_KEY="your-gemini-api-key"

# AI Bypass (set to 'true' to use mock AI responses)
BYPASS_AI="true"

# Server Configuration
PORT=3000
NODE_ENV="development"
`;
    fs.writeFileSync(envPath, defaultEnvContent);
    console.log('✅ .env file berhasil dibuat dengan konfigurasi default');
  }
}

// Read current .env content
let envContent = fs.readFileSync(envPath, 'utf8');

// Update bypass settings
const updates = {
  'BYPASS_AUTH': 'true',
  'HARDCODED_USER_ID': '1',
  'HARDCODED_USER_EMAIL': 'test@example.com',
  'HARDCODED_USER_ROLE': 'user',
  'HARDCODED_ALLERGENS': 'gluten,lactose,nuts,shellfish,eggs',
  'BYPASS_AI': 'true'
};

let updated = false;
Object.entries(updates).forEach(([key, value]) => {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(envContent)) {
    // Update existing value
    envContent = envContent.replace(regex, `${key}="${value}"`);
    console.log(`✅ Updated ${key}="${value}"`);
    updated = true;
  } else {
    // Add new key-value pair
    envContent += `\n# Hardcoded User Data\n${key}="${value}"`;
    console.log(`➕ Added ${key}="${value}"`);
    updated = true;
  }
});

if (updated) {
  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ .env file berhasil diupdate dengan bypass settings!');
} else {
  console.log('\n✅ .env file sudah memiliki bypass settings yang benar');
}

console.log('\n🚀 Cara menggunakan bypass authentication:');
console.log('   1. Jalankan aplikasi: npm run dev');
console.log('   2. Atau jalankan dengan bypass: npm run dev:bypass');
console.log('   3. Test endpoints: npm run test:scan');
console.log('\n⚠️  PERINGATAN: Jangan gunakan bypass auth di production!');

// Check if cross-env is installed
try {
  require('cross-env');
  console.log('\n✅ cross-env sudah terinstall');
} catch (error) {
  console.log('\n⚠️  cross-env belum terinstall, jalankan: npm install cross-env');
  console.log('   Atau gunakan environment variables manual');
}
