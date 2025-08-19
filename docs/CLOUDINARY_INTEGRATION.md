# Cloudinary Integration for Allertify Backend

## Overview

This document explains how to set up and use Cloudinary for image uploads in the Allertify backend. The integration allows users to upload product images that are then analyzed by Gemini AI for allergen detection.

## Features

- **Image Upload**: Secure image upload to Cloudinary with automatic optimization
- **AI Analysis**: Integration with Gemini Vision AI for ingredient analysis
- **File Validation**: Automatic file type and size validation
- **Error Handling**: Comprehensive error handling and logging
- **Cleanup**: Automatic cleanup of test images

## Setup

### 1. Environment Variables

Add the following variables to your `.env` file:

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
CLOUDINARY_UPLOAD_PRESET="allertify_uploads"
```

### 2. Get Cloudinary Credentials

1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Go to your Dashboard
3. Copy your Cloud Name, API Key, and API Secret
4. Update your `.env` file with these values

### 3. Install Dependencies

The required packages are already installed:

```bash
npm install cloudinary multer @types/multer
```

## API Endpoints

### POST /scans/upload

Upload and analyze a product image for allergen detection.

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data
```

**Body (multipart/form-data):**
- `image` (required): Image file (JPEG, PNG, GIF, etc.)
- `productName` (optional): Name of the product

**Response:**
```json
{
  "success": true,
  "message": "Image uploaded and analyzed successfully",
  "data": {
    "id": 123,
    "userId": 456,
    "productId": 789,
    "scanDate": "2024-01-01T00:00:00.000Z",
    "riskLevel": "SAFE",
    "riskExplanation": "No allergens detected in the product image.",
    "matchedAllergens": null,
    "isSaved": false,
    "product": {
      "id": 789,
      "barcode": "IMG_1234567890_abc123",
      "name": "Product Name",
      "imageUrl": "https://res.cloudinary.com/...",
      "ingredients": "Extracted from image"
    },
    "scanLimit": {
      "remainingScans": 9,
      "dailyLimit": 10
    }
  }
}
```

## Usage Examples

### 1. Using cURL

```bash
curl -X POST http://localhost:3000/scans/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@product_image.jpg" \
  -F "productName=Chocolate Bar"
```

### 2. Using JavaScript/Fetch

```javascript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('productName', 'Product Name');

const response = await fetch('/scans/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + jwtToken
  },
  body: formData
});

const result = await response.json();
console.log(result);
```

### 3. Using Postman

1. Set method to `POST`
2. Set URL to `http://localhost:3000/scans/upload`
3. Add header: `Authorization: Bearer YOUR_JWT_TOKEN`
4. In Body tab, select `form-data`
5. Add key `image` with type `File` and select your image
6. Add key `productName` with type `Text` (optional)
7. Send request

## File Requirements

### Supported Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- BMP (.bmp)
- TIFF (.tiff)

### Size Limits
- Maximum file size: 10MB
- Recommended: Under 5MB for faster processing

### Image Quality
- Images are automatically optimized by Cloudinary
- Quality is set to "auto:good" for optimal file size/quality balance
- Images are resized to max 800x600 pixels while maintaining aspect ratio

## Error Handling

### Common Errors

#### 1. Authentication Required
```json
{
  "success": false,
  "message": "Authentication required"
}
```
**Solution**: Include valid JWT token in Authorization header

#### 2. No Image File
```json
{
  "success": false,
  "message": "Image file is required"
}
```
**Solution**: Ensure the `image` field is included in the form data

#### 3. Invalid File Type
```json
{
  "success": false,
  "message": "Only image files are allowed"
}
```
**Solution**: Upload only image files (JPEG, PNG, etc.)

#### 4. File Too Large
```json
{
  "success": false,
  "message": "File too large"
}
```
**Solution**: Reduce image file size to under 10MB

#### 5. Cloudinary Not Configured
```json
{
  "success": false,
  "message": "Cloudinary service is not configured. Please check environment variables."
}
```
**Solution**: Verify Cloudinary environment variables are set correctly

## Testing

### 1. Test Cloudinary Configuration

Run the test script to verify your setup:

```bash
node scripts/test-cloudinary.js
```

This will:
- Check environment variables
- Test API connection
- Test upload capabilities
- Clean up test files

### 2. Test API Endpoint

1. Start your server
2. Use Postman or cURL to test the `/scans/upload` endpoint
3. Verify the response format and data

## Security Considerations

### 1. File Validation
- Only image files are accepted
- File size is limited to 10MB
- File type is validated using MIME type

### 2. Authentication
- All uploads require valid JWT authentication
- User ID is extracted from the token
- Daily scan limits are enforced

### 3. Cloudinary Security
- Images are stored in private folders
- Access is controlled via API keys
- Images can be deleted programmatically

## Monitoring and Logging

### 1. Request Logging
All upload requests are logged with:
- Request ID for tracking
- User information
- File details
- Processing time
- Success/failure status

### 2. Error Logging
Errors are logged with:
- Error details
- Request context
- Stack traces
- User information

### 3. Performance Metrics
- Upload time
- AI analysis time
- Total processing time
- File size and type

## Troubleshooting

### 1. Cloudinary Connection Issues
- Verify API credentials
- Check internet connection
- Ensure Cloudinary account is active

### 2. Upload Failures
- Check file size and type
- Verify authentication token
- Check daily scan limits

### 3. AI Analysis Issues
- Ensure Gemini API key is set
- Check BYPASS_AI environment variable
- Verify image quality and readability

## Support

For issues related to:
- **Cloudinary**: Check [Cloudinary Documentation](https://cloudinary.com/documentation)
- **Backend API**: Check server logs and error messages
- **AI Analysis**: Verify Gemini API configuration

## Future Enhancements

- **Batch Upload**: Support for multiple image uploads
- **Image Processing**: Advanced image enhancement and OCR
- **Caching**: Image caching for faster subsequent analysis
- **Analytics**: Upload statistics and usage metrics
