# Scan API Documentation

## Overview
API untuk fitur scan produk Allertify yang mendukung scan barcode dan analisis gambar menggunakan AI.

## Environment Variables
Tambahkan ke `.env`:
```env
# Google AI API Configuration
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key-here

# Open Food Facts API
OPEN_FOOD_FACTS_API_URL=https://world.openfoodfacts.org/api/v0
```

## Endpoints

### 1. Scan Barcode
**POST** `/api/scans/barcode/:barcode`

Scan produk berdasarkan barcode.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Parameters:**
- `barcode` (path): Barcode produk (8-14 digit)

**Response:**
```json
{
  "success": true,
  "message": "Barcode scan completed successfully",
  "data": {
    "id": 1,
    "userId": 123,
    "productId": 456,
    "scanDate": "2024-01-15T10:30:00Z",
    "riskLevel": "CAUTION",
    "riskExplanation": "Product contains milk which matches your dairy allergy...",
    "matchedAllergens": "milk, lactose",
    "isSaved": false,
    "product": {
      "id": 456,
      "barcode": "1234567890123",
      "name": "Chocolate Cookies",
      "imageUrl": "https://example.com/image.jpg",
      "ingredients": "flour, sugar, milk, eggs..."
    }
  }
}
```

### 2. Scan Image (OCR)
**POST** `/api/scans/image`

Scan produk berdasarkan gambar menggunakan OCR.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:**
```json
{
  "imageUrl": "https://example.com/product-image.jpg",
  "productId": 456  // Optional, jika sudah ada produk di database
}
```

**Response:**
```json
{
  "success": true,
  "message": "Image scan completed successfully",
  "data": {
    "id": 2,
    "userId": 123,
    "productId": 789,
    "scanDate": "2024-01-15T10:35:00Z",
    "riskLevel": "RISKY",
    "riskExplanation": "Image analysis detected peanuts in ingredients...",
    "matchedAllergens": "peanuts",
    "isSaved": false,
    "product": {
      "id": 789,
      "barcode": "IMG_1705316100_123",
      "name": "Product from Image Scan",
      "imageUrl": "https://example.com/product-image.jpg",
      "ingredients": "Extracted from image"
    }
  }
}
```

### 3. Toggle Save Scan
**PUT** `/api/scans/:scanId/save`

Menyimpan atau menghapus hasil scan dari daftar favorit.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Scan saved successfully",
  "data": {
    // Same as scan result with updated isSaved status
  }
}
```

### 4. Get Scan History
**GET** `/api/scans/history`

Mendapatkan riwayat scan pengguna.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `limit` (optional): Jumlah hasil per halaman (default: 20, max: 100)
- `offset` (optional): Offset untuk pagination (default: 0)
- `savedOnly` (optional): Hanya tampilkan scan yang disimpan (default: false)

**Response:**
```json
{
  "success": true,
  "message": "Scan history retrieved successfully",
  "data": {
    "scans": [
      {
        // Array of scan results
      }
    ],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "total": 15
    }
  }
}
```

### 5. Get Saved Scans
**GET** `/api/scans/saved`

Shortcut untuk mendapatkan hanya scan yang disimpan.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Scan history retrieved successfully",
  "data": {
    "scans": [
      // Array of saved scan results only
    ],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "total": 5
    }
  }
}
```

## Risk Levels

### SAFE
- Tidak ada alergen yang terdeteksi
- Aman untuk dikonsumsi berdasarkan profil alergi pengguna

### CAUTION
- Kemungkinan kontaminasi silang
- Bahan tidak jelas yang mungkin mengandung alergen
- Perlu kehati-hatian ekstra

### RISKY
- Mengandung alergen yang ada dalam profil pengguna
- Sebaiknya dihindari

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "barcode",
      "message": "Barcode must be 8-14 digits"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Product with barcode 1234567890123 not found in Open Food Facts database"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "AI analysis failed: Rate limit exceeded"
}
```

## Testing

### Manual Testing dengan cURL

1. **Test Barcode Scan:**
```bash
curl -X POST "http://localhost:3000/api/scans/barcode/3017620422003" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

2. **Test Image Scan:**
```bash
curl -X POST "http://localhost:3000/api/scans/image" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/product-image.jpg"
  }'
```

3. **Test Get History:**
```bash
curl -X GET "http://localhost:3000/api/scans/history?limit=10&savedOnly=false" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Notes

1. **Open Food Facts Integration**: Otomatis fetch data produk dari Open Food Facts jika tidak ada di database lokal.

2. **AI Analysis**: Menggunakan Google Gemini untuk analisis bahan dan OCR gambar.

3. **User Allergies**: Sistem otomatis mengambil profil alergi pengguna dari database untuk analisis.

4. **Error Handling**: Comprehensive error handling dengan pesan yang informatif.

5. **Rate Limiting**: Pastikan ada rate limiting di level aplikasi untuk mencegah abuse API.

6. **Caching**: Pertimbangkan implementasi caching untuk hasil scan yang sering diakses.

## Dependensi

- `@ai-sdk/google`: Google AI SDK
- `ai`: Vercel AI SDK
- `zod`: Schema validation untuk AI output
- `axios`: HTTP client untuk Open Food Facts API
- `joi`: Input validation










