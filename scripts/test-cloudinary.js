const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Test Cloudinary configuration
async function testCloudinary() {
  console.log('🧪 Testing Cloudinary Configuration...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET'}`);
  console.log(`CLOUDINARY_API_KEY: ${process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET'}`);
  console.log(`CLOUDINARY_API_SECRET: ${process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET'}\n`);

  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    // Test API connection
    console.log('🔗 Testing Cloudinary API connection...');
    const result = await cloudinary.api.ping();
    console.log('✅ Connection successful:', result);

    // Test upload capabilities (optional)
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      console.log('\n📤 Testing upload capabilities...');
      
      // Create a simple test image (1x1 pixel PNG)
      const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
      
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'allertify/test',
            public_id: `test_${Date.now()}`,
            tags: ['test', 'allertify']
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(testImageBuffer);
      });

      console.log('✅ Test upload successful:', {
        publicId: uploadResult.public_id,
        url: uploadResult.url,
        secureUrl: uploadResult.secure_url
      });

      // Clean up test image
      console.log('\n🧹 Cleaning up test image...');
      const deleteResult = await cloudinary.uploader.destroy(uploadResult.public_id);
      console.log('✅ Test image deleted:', deleteResult.result);

    } else {
      console.log('⚠️  Skipping upload test - Cloudinary not fully configured');
    }

    console.log('\n🎉 All tests passed! Cloudinary is properly configured.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.http_code === 401) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Check your CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET');
      console.log('2. Verify your CLOUDINARY_CLOUD_NAME');
      console.log('3. Ensure your Cloudinary account is active');
    }
    
    process.exit(1);
  }
}

// Run the test
testCloudinary();
