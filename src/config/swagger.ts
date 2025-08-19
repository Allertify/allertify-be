import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Allertify API',
    description: 'Backend API untuk aplikasi deteksi alergen makanan',
    version: '1.0.0',
    contact: {
      name: 'Allertify Team',
      email: 'admin@allertify.com'
    }
  },
  host: 'allertify.ciet.site',
  basePath: '/api/v1',
  schemes: ['http', 'https'],
  consumes: ['application/json'],
  produces: ['application/json'],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
      description: 'JWT token dengan format: Bearer <token>'
    }
  },
  definitions: {
    // User Models
    User: {
      id: 1,
      email: 'user@example.com',
      full_name: 'John Doe',
      phone_number: '+6281234567890',
      is_verified: false,
      role: 0,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    UserCreate: {
      full_name: 'John Doe',
      email: 'user@example.com',
      password: 'password123',
      phone_number: '+6281234567890'
    },
    UserLogin: {
      email: 'user@example.com',
      password: 'password123'
    },
    UserVerifyOTP: {
      email: 'user@example.com',
      otp: '123456'
    },
    
    // Product Models
    Product: {
      id: 1,
      barcode: '8991002122017',
      name: 'Abc Kopi Susu',
      imageUrl: 'https://example.com/image.jpg',
      ingredients: 'RH-30',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    
    // Scan Models
    ScanResult: {
      id: 1,
      userId: 1,
      productId: 1,
      scanDate: '2024-01-01T00:00:00.000Z',
      scanDateLocal: '2024-01-01T07:00:00.000+07:00',
      riskLevel: 'SAFE',
      riskExplanation: 'Product appears safe based on ingredient analysis.',
      matchedAllergens: null,
      isSaved: false,
      listType: 'GREEN',
      product: {
        id: 1,
        barcode: '8991002122017',
        name: 'Abc Kopi Susu',
        imageUrl: 'https://example.com/image.jpg',
        ingredients: 'RH-30'
      },
      scanLimit: {
        remainingScans: 99,
        dailyLimit: 100
      }
    },
    
    // Scan Limit Models
    ScanLimit: {
      userId: 1,
      currentUsage: 1,
      dailyLimit: 100,
      remainingScans: 99,
      isLimitExceeded: false,
      canScan: true
    },
    
    // Product Preference Models
    ProductPreference: {
      id: 1,
      user_id: 1,
      product_id: 1,
      list_type: 'GREEN',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    
    // Response Models
    SuccessResponse: {
      success: true,
      message: 'Operation completed successfully',
      data: {}
    },
    ErrorResponse: {
      success: false,
      message: 'Error message here',
      error: 'Error details'
    },
    
    // Pagination Models
    Pagination: {
      limit: 20,
      offset: 0,
      total: 100
    }
  }
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./src/routes/*.ts'];

swaggerAutogen(outputFile, endpointsFiles, doc);