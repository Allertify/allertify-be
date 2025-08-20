export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Allertify API',
    description: 'Backend API untuk aplikasi deteksi alergen makanan',
    version: '1.0.0',
    contact: {
      name: 'Allertify Team',
      email: 'admin@allertify.com'
    }
  },
  servers: [
    {
      url: 'https://allertify.ciet.site/api/v1',
      description: 'Production server'
    },
    {
      url: 'http://localhost:3109/api/v1',
      description: 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          email: { type: 'string', example: 'user@example.com' },
          full_name: { type: 'string', example: 'John Doe' },
          phone_number: { type: 'string', example: '+6281234567890' },
          is_verified: { type: 'boolean', example: false },
          role: { type: 'number', example: 0 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      UserCreate: {
        type: 'object',
        required: ['full_name', 'email', 'password', 'phone_number'],
        properties: {
          full_name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', minLength: 6, example: 'password123' },
          phone_number: { type: 'string', example: '+6281234567890' }
        }
      },
      UserLogin: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', example: 'password123' }
        }
      },
      UserVerifyOTP: {
        type: 'object',
        required: ['email', 'otp'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          otp: { type: 'string', pattern: '^[0-9]{6}$', example: '123456' }
        }
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          barcode: { type: 'string', example: '8991002122017' },
          name: { type: 'string', example: 'Abc Kopi Susu' },
          imageUrl: { type: 'string', format: 'uri', example: 'https://example.com/image.jpg' },
          ingredients: { type: 'string', example: 'RH-30' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      ScanResult: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          userId: { type: 'number', example: 1 },
          productId: { type: 'number', example: 1 },
          scanDate: { type: 'string', format: 'date-time' },
          scanDateLocal: { type: 'string', example: '2024-01-01T07:00:00.000+07:00' },
          riskLevel: { type: 'string', enum: ['SAFE', 'CAUTION', 'RISKY'], example: 'SAFE' },
          riskExplanation: { type: 'string', example: 'Product appears safe based on ingredient analysis.' },
          matchedAllergens: { type: 'string', nullable: true },
          isSaved: { type: 'boolean', example: false },
          listType: { type: 'string', enum: ['RED', 'GREEN'], example: 'GREEN' },
          product: { $ref: '#/components/schemas/Product' },
          scanLimit: { $ref: '#/components/schemas/ScanLimit' }
        }
      },
      ScanLimit: {
        type: 'object',
        properties: {
          userId: { type: 'number', example: 1 },
          currentUsage: { type: 'number', example: 1 },
          dailyLimit: { type: 'number', example: 100 },
          remainingScans: { type: 'number', example: 99 },
          isLimitExceeded: { type: 'boolean', example: false },
          canScan: { type: 'boolean', example: true }
        }
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error message here' },
          error: { type: 'string', example: 'Error details' }
        }
      },
      Pagination: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 100, example: 20 },
          offset: { type: 'number', minimum: 0, example: 0 },
          total: { type: 'number', example: 100 }
        }
      }
    }
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register user baru',
        description: 'Membuat akun user baru dengan verifikasi email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserCreate' }
            }
          }
        },
        responses: {
          '201': {
            description: 'User berhasil dibuat, OTP dikirim ke email',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          '400': {
            description: 'Data tidak valid',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          '409': {
            description: 'Email sudah terdaftar',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login user',
        description: 'Authenticate user dan dapatkan JWT token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserLogin' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login berhasil',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            token: { type: 'string', description: 'JWT token untuk autentikasi' },
                            user: { $ref: '#/components/schemas/User' }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          '401': {
            description: 'Email atau password salah',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/auth/otp': {
      post: {
        tags: ['Authentication'],
        summary: 'Verifikasi OTP',
        description: 'Verifikasi OTP yang dikirim ke email untuk aktivasi akun',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserVerifyOTP' }
            }
          }
        },
        responses: {
          '200': {
            description: 'OTP berhasil diverifikasi',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          '400': {
            description: 'OTP tidak valid atau expired',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/scans/limit': {
      get: {
        tags: ['Scan'],
        summary: 'Cek scan limit user',
        description: 'Mendapatkan informasi scan limit harian user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Informasi scan limit berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/ScanLimit' }
                      }
                    }
                  ]
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized - token tidak valid',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/scans/barcode/{barcode}': {
      post: {
        tags: ['Scan'],
        summary: 'Scan produk dengan barcode',
        description: 'Scan produk menggunakan barcode untuk deteksi alergen',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'barcode',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Barcode produk (13-14 digit)',
            example: '8991002122017'
          }
        ],
        responses: {
          '200': {
            description: 'Scan berhasil',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/ScanResult' }
                      }
                    }
                  ]
                }
              }
            }
          },
          '400': {
            description: 'Barcode tidak valid',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          '401': {
            description: 'Unauthorized - token tidak valid'
          },
          '429': {
            description: 'Daily scan limit exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/scans/image': {
      post: {
        tags: ['Scan'],
        summary: 'Scan produk dengan image URL',
        description: 'Scan produk menggunakan URL gambar untuk deteksi alergen',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['imageUrl'],
                properties: {
                  imageUrl: {
                    type: 'string',
                    format: 'uri',
                    description: 'URL gambar produk',
                    example: 'https://example.com/product-image.jpg'
                  },
                  productId: {
                    type: 'integer',
                    description: 'ID produk (optional, untuk update existing product)'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Scan berhasil',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/ScanResult' }
                      }
                    }
                  ]
                }
              }
            }
          },
          '400': {
            description: 'URL tidak valid',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          '401': {
            description: 'Unauthorized - token tidak valid'
          },
          '429': {
            description: 'Daily scan limit exceeded'
          }
        }
      }
    },
    '/scans/upload': {
      post: {
        tags: ['Scan'],
        summary: 'Scan produk dengan upload gambar',
        description: 'Upload dan scan gambar produk untuk deteksi alergen',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['image'],
                properties: {
                  image: {
                    type: 'string',
                    format: 'binary',
                    description: 'File gambar produk (JPG, PNG, max 10MB)'
                  },
                  productName: {
                    type: 'string',
                    description: 'Nama produk (optional, untuk produk baru)'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Scan berhasil',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/ScanResult' }
                      }
                    }
                  ]
                }
              }
            }
          },
          '400': {
            description: 'File tidak valid',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          '401': {
            description: 'Unauthorized - token tidak valid'
          },
          '429': {
            description: 'Daily scan limit exceeded'
          }
        }
      }
    },
    '/scans/history': {
      get: {
        tags: ['Scan'],
        summary: 'Ambil riwayat scan user',
        description: 'Mendapatkan riwayat scan user dengan pagination dan filter',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            description: 'Jumlah item per halaman'
          },
          {
            name: 'offset',
            in: 'query',
            schema: { type: 'integer', minimum: 0, default: 0 },
            description: 'Offset untuk pagination'
          },
          {
            name: 'savedOnly',
            in: 'query',
            schema: { type: 'boolean', default: false },
            description: 'Filter hanya scan yang disimpan'
          },
          {
            name: 'uniqueByProduct',
            in: 'query',
            schema: { type: 'boolean', default: false },
            description: 'Tampilkan hanya produk unik (scan terbaru per produk)'
          },
          {
            name: 'listType',
            in: 'query',
            schema: { type: 'string', enum: ['RED', 'GREEN'] },
            description: 'Filter berdasarkan tipe list (Red/Green)'
          }
        ],
        responses: {
          '200': {
            description: 'Riwayat scan berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            scans: {
                              type: 'array',
                              items: { $ref: '#/components/schemas/ScanResult' }
                            },
                            pagination: { $ref: '#/components/schemas/Pagination' }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized - token tidak valid'
          }
        }
      }
    },
    '/scans/save/{scanId}': {
      put: {
        tags: ['Scan'],
        summary: 'Toggle save status scan',
        description: 'Mengubah status save/unsave untuk scan tertentu',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'scanId',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'ID scan yang akan di-toggle'
          }
        ],
        responses: {
          '200': {
            description: 'Status save berhasil diubah',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          '400': {
            description: 'Scan ID tidak valid'
          },
          '401': {
            description: 'Unauthorized - token tidak valid'
          },
          '404': {
            description: 'Scan tidak ditemukan'
          }
        }
      }
    },
    '/scans/saved': {
      get: {
        tags: ['Scan'],
        summary: 'Ambil scan yang disimpan',
        description: 'Mendapatkan semua scan yang disimpan user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Scan yang disimpan berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/ScanResult' }
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized - token tidak valid'
          }
        }
      }
    },
    '/scans/list': {
      post: {
        tags: ['Scan'],
        summary: 'Set product preference (Red/Green list)',
        description: 'Menambahkan/mengubah produk ke Red List atau Green List',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productId', 'listType'],
                properties: {
                  productId: {
                    type: 'integer',
                    description: 'ID produk yang akan di-set preference'
                  },
                  listType: {
                    type: 'string',
                    enum: ['RED', 'GREEN'],
                    description: 'Tipe list (RED untuk tidak suka, GREEN untuk suka)'
                  },
                  action: {
                    type: 'string',
                    enum: ['ADD', 'REMOVE'],
                    default: 'ADD',
                    description: 'Action untuk menambah atau menghapus dari list'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Product preference berhasil di-set',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          '400': {
            description: 'Data tidak valid'
          },
          '401': {
            description: 'Unauthorized - token tidak valid'
          },
          '404': {
            description: 'Produk tidak ditemukan'
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Authentication',
      description: 'Endpoints untuk autentikasi user'
    },
    {
      name: 'Scan',
      description: 'Endpoints untuk scan produk dan deteksi alergen'
    }
  ]
};
