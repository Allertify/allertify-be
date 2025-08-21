
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


## 📚 API Endpoints

### Scan Endpoints (semua memerlukan auth atau bypass)
- `GET /scans/limit` - Informasi daily scan limit pengguna
- `POST /scans/barcode/:barcode` - Scan produk berdasarkan barcode
- `POST /scans/image` - Scan produk berdasarkan gambar
- `POST /scans/upload` - Upload dan scan gambar produk untuk analisis alergi
- `PUT /scans/:scanId/save` - Toggle save status
- `GET /scans/history` - Riwayat scan pengguna
- `GET /scans/saved` - Scan yang disimpan

### Daily Scan Limits
- **Basic Plan**: 5 scans per day (default untuk user tanpa subscription)
- **Premium Plans**: Sesuai dengan tier plan yang dibeli
- **Limit Reset**: Setiap hari jam 00:00
- **Response**: Setiap scan akan return remaining scans dan daily limit

## 🖼️ Image Upload & Analysis

### Cloudinary Integration
- **Image Upload**: Secure image upload to Cloudinary with automatic optimization
- **AI Analysis**: Integration with Gemini Vision AI for ingredient analysis from images
- **File Validation**: Automatic file type and size validation (max 10MB)
- **Supported Formats**: JPEG, PNG, GIF, WebP, BMP, TIFF

### Testing Cloudinary
```bash
# Test Cloudinary configuration
node scripts/test-cloudinary.js
```

### Documentation
For detailed information about the Cloudinary integration, see [CLOUDINARY_INTEGRATION.md](docs/CLOUDINARY_INTEGRATION.md)

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

