
# ALLERTIFY

### Backend
1. Arvan Yudhistia Ardana - Universitas Brawijaya
2. Muchammad Rafif Azis Syahlevi - Institut Teknologi Bandung

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL
- npm/yarn

### Installation
```bash
npm install
```

### Environment Setup
1. Copy `env.example` to `.env`
2. Configure your database and API keys
3. For development without authentication, set `BYPASS_AUTH=true`

### Development Mode (Bypass Authentication)
Untuk development/testing tanpa perlu setup authentication:

```bash
# Set environment variable
export BYPASS_AUTH=true  # Linux/Mac
set BYPASS_AUTH=true     # Windows CMD
$env:BYPASS_AUTH="true"  # Windows PowerShell

# Atau tambahkan ke .env file
BYPASS_AUTH=true
HARDCODED_USER_ID=1
HARDCODED_USER_EMAIL=test@example.com
HARDCODED_USER_ROLE=user
HARDCODED_ALLERGENS=gluten,lactose,nuts,shellfish,eggs
```

### Running the Application
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### Testing Scan Endpoints
```bash
# Install axios if not already installed
npm install axios

# Run test script
node scripts/test-scan.js
```

## 🔓 Bypass Authentication Feature

Fitur ini memungkinkan Anda untuk:
- ✅ Skip JWT token validation
- ✅ Gunakan hardcoded user data
- ✅ Gunakan hardcoded allergen list
- ✅ Test semua endpoints tanpa setup auth

### Environment Variables untuk Bypass
```env
# Enable bypass
BYPASS_AUTH=true

# Hardcoded user
HARDCODED_USER_ID=1
HARDCODED_USER_EMAIL=test@example.com
HARDCODED_USER_ROLE=user

# Hardcoded allergens (comma-separated)
HARDCODED_ALLERGENS=gluten,lactose,nuts,shellfish,eggs
```

### Security Note
⚠️ **JANGAN gunakan bypass auth di production!** Fitur ini hanya untuk development/testing.

## 📚 API Endpoints

### Scan Endpoints (semua memerlukan auth atau bypass)
- `GET /scans/limit` - Informasi daily scan limit pengguna
- `POST /scans/barcode/:barcode` - Scan produk berdasarkan barcode
- `POST /scans/image` - Scan produk berdasarkan gambar
- `PUT /scans/:scanId/save` - Toggle save status
- `GET /scans/history` - Riwayat scan pengguna
- `GET /scans/saved` - Scan yang disimpan

### Daily Scan Limits
- **Basic Plan**: 5 scans per day (default untuk user tanpa subscription)
- **Premium Plans**: Sesuai dengan tier plan yang dibeli
- **Limit Reset**: Setiap hari jam 00:00
- **Response**: Setiap scan akan return remaining scans dan daily limit

## 🛠️ Development

### Project Structure
```
src/
├── controllers/     # Request handlers
├── services/        # Business logic
├── middlewares/     # Auth, validation, etc.
├── routes/          # API endpoints
├── repositories/    # Data access layer
├── types/          # TypeScript types
└── utils/          # Helper functions
```

### Database
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio
```

