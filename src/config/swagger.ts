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
    responses: {
      Unauthorized: {
        description: 'Unauthorized - token tidak valid',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      Forbidden: {
        description: 'Forbidden - insufficient permissions',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
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
      AdminUserDetail: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          full_name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', example: 'user@example.com' },
          phone_number: { type: 'string', example: '+6281234567890' },
          is_verified: { type: 'boolean', example: true },
          role: { type: 'integer', enum: [0, 1], example: 0 },
          createdAt: { type: 'string', format: 'date-time' }
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
      TierPlan: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 2 },
          name: { type: 'string', example: 'Pro' },
          scan_count_limit: { type: 'integer', example: 100 },
          saved_product_limit: { type: 'integer', example: 50 },
          price_monthly: { type: 'number', example: 49000 }
        }
      },
      Subscription: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 10 },
          user_id: { type: 'integer', example: 1 },
          tier_plan_id: { type: 'integer', example: 2 },
          started_at: { type: 'string', format: 'date-time' },
          ends_at: { type: 'string', format: 'date-time' },
          is_active: { type: 'boolean', example: true }
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
      ProductReport: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          product_id: { type: 'integer', example: 22 },
          report_details: { type: 'string', example: 'Incorrect ingredient information' },
          status: { type: 'string', enum: ['PENDING', 'REVIEWED', 'RESOLVED', 'REJECTED'] },
          created_at: { type: 'string', format: 'date-time' }
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
    '/auth/forgot-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Request reset password token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Reset token dikirim jika email terdaftar' }
        }
      }
    },
    '/auth/reset-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Reset password dengan token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'newPassword'],
                properties: {
                  token: { type: 'string' },
                  newPassword: { type: 'string', minLength: 8 }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Password updated' } }
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
    // Users
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get current user\'s profile',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Profile retrieved' }, '401': { $ref: '#/components/responses/Unauthorized' } }
      },
      put: {
        tags: ['Users'],
        summary: 'Update current user\'s profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  full_name: { type: 'string', example: 'John Doe' },
                  phone_number: { type: 'string', example: '+6281234567890' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Profile updated' }, '401': { $ref: '#/components/responses/Unauthorized' } }
      }
    },
    '/users/me/allergies': {
      get: {
        tags: ['Users'],
        summary: 'Get user\'s allergies',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Allergies retrieved' }, '401': { $ref: '#/components/responses/Unauthorized' } }
      },
      put: {
        tags: ['Users'],
        summary: 'Replace user\'s allergies',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  allergies: { type: 'array', items: { type: 'string', example: 'peanut' } }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Allergies updated' }, '401': { $ref: '#/components/responses/Unauthorized' } }
      }
    },
    '/users/me/contacts': {
      get: {
        tags: ['Users'],
        summary: 'Get user\'s emergency contacts',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Contacts retrieved' }, '401': { $ref: '#/components/responses/Unauthorized' } }
      },
      post: {
        tags: ['Users'],
        summary: 'Create an emergency contact',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'phone_number', 'relationship'],
                properties: {
                  name: { type: 'string', example: 'Jane Doe' },
                  phone_number: { type: 'string', example: '+628111111111' },
                  relationship: { type: 'string', example: 'Sibling' }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Contact created' }, '401': { $ref: '#/components/responses/Unauthorized' } }
      }
    },
    '/users/me/contacts/{contactId}': {
      put: {
        tags: ['Users'],
        summary: 'Update an emergency contact',
        security: [{ bearerAuth: [] }],
        parameters: [ { name: 'contactId', in: 'path', required: true, schema: { type: 'integer' } } ],
        responses: { '200': { description: 'Contact updated' }, '401': { $ref: '#/components/responses/Unauthorized' } }
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete an emergency contact',
        security: [{ bearerAuth: [] }],
        parameters: [ { name: 'contactId', in: 'path', required: true, schema: { type: 'integer' } } ],
        responses: { '200': { description: 'Contact deleted' }, '401': { $ref: '#/components/responses/Unauthorized' } }
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
    // '/scans/image': {
    //   post: {
    //     tags: ['Scan'],
    //     summary: 'Scan produk dengan image URL',
    //     description: 'Scan produk menggunakan URL gambar untuk deteksi alergen',
    //     security: [{ bearerAuth: [] }],
    //     requestBody: {
    //       required: true,
    //       content: {
    //         'application/json': {
    //           schema: {
    //             type: 'object',
    //             required: ['imageUrl'],
    //             properties: {
    //               imageUrl: {
    //                 type: 'string',
    //                 format: 'uri',
    //                 description: 'URL gambar produk',
    //                 example: 'https://example.com/product-image.jpg'
    //               },
    //               productId: {
    //                 type: 'integer',
    //                 description: 'ID produk (optional, untuk update existing product)'
    //               }
    //             }
    //           }
    //         }
    //       }
    //     },
    //     responses: {
    //       '200': {
    //         description: 'Scan berhasil',
    //         content: {
    //           'application/json': {
    //             schema: {
    //               allOf: [
    //                 { $ref: '#/components/schemas/SuccessResponse' },
    //                 {
    //                   type: 'object',
    //                   properties: {
    //                     data: { $ref: '#/components/schemas/ScanResult' }
    //                   }
    //                 }
    //               ]
    //             }
    //           }
    //         }
    //       },
    //       '400': {
    //         description: 'URL tidak valid',
    //         content: {
    //           'application/json': {
    //             schema: { $ref: '#/components/schemas/ErrorResponse' }
    //           }
    //         }
    //       },
    //       '401': {
    //         description: 'Unauthorized - token tidak valid'
    //       },
    //       '429': {
    //         description: 'Daily scan limit exceeded'
    //       }
    //     }
    //   }
    // },
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
    },
    // Products
    // '/products/search': {
    //   get: {
    //     tags: ['Products'],
    //     summary: 'Search products by name or barcode',
    //     parameters: [
    //       { name: 'query', in: 'query', schema: { type: 'string' }, description: 'Search query (name or barcode)' },
    //       { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Number of products to return' },
    //       { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 }, description: 'Number of products to skip' }
    //     ],
    //     responses: {
    //       '200': {
    //         description: 'Products retrieved successfully',
    //         content: {
    //           'application/json': {
    //             schema: {
    //               type: 'object',
    //               properties: {
    //                 success: { type: 'boolean', example: true },
    //                 message: { type: 'string', example: 'Products retrieved successfully' },
    //                 data: {
    //                   type: 'object',
    //                   properties: {
    //                     products: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
    //                     pagination: { $ref: '#/components/schemas/Pagination' }
    //                   }
    //                 }
    //               }
    //             }
    //           }
    //         }
    //       }
    //     }
    //   }
    // },
    // '/products/popular': {
    //   get: {
    //     tags: ['Products'],
    //     summary: 'Get popular products based on scan count',
    //     parameters: [ { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } } ],
    //     responses: {
    //       '200': {
    //         description: 'Popular products retrieved successfully',
    //         content: {
    //           'application/json': {
    //             schema: {
    //               type: 'object',
    //               properties: {
    //                 success: { type: 'boolean', example: true },
    //                 message: { type: 'string', example: 'Popular products retrieved successfully' },
    //                 data: { type: 'object', properties: { products: { type: 'array', items: { $ref: '#/components/schemas/Product' } } } }
    //               }
    //             }
    //           }
    //         }
    //       }
    //     }
    //   }
    // },
    // '/products/reports/my': {
    //   get: {
    //     tags: ['Products'],
    //     summary: "Get user's product reports",
    //     security: [{ bearerAuth: [] }],
    //     parameters: [
    //       { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
    //       { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
    //     ],
    //     responses: {
    //       '200': {
    //         description: 'User reports retrieved successfully',
    //         content: {
    //           'application/json': {
    //             schema: {
    //               type: 'object',
    //               properties: {
    //                 success: { type: 'boolean', example: true },
    //                 message: { type: 'string', example: 'User reports retrieved successfully' },
    //                 data: {
    //                   type: 'object',
    //                   properties: {
    //                     reports: { type: 'array', items: { $ref: '#/components/schemas/ProductReport' } },
    //                     pagination: { $ref: '#/components/schemas/Pagination' }
    //                   }
    //                 }
    //               }
    //             }
    //           }
    //         }
    //       },
    //       '401': { $ref: '#/components/responses/Unauthorized' }
    //     }
    //   }
    // },
    // '/products/{productId}': {
    //   get: {
    //     tags: ['Products'],
    //     summary: 'Get product detail by ID',
    //     parameters: [ { name: 'productId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Product ID' } ],
    //     responses: {
    //       '200': {
    //         description: 'Product detail retrieved successfully',
    //         content: {
    //           'application/json': {
    //             schema: {
    //               type: 'object',
    //               properties: {
    //                 success: { type: 'boolean', example: true },
    //                 message: { type: 'string', example: 'Product detail retrieved successfully' },
    //                 data: {
    //                   type: 'object',
    //                   properties: {
    //                     product: { $ref: '#/components/schemas/Product' }
    //                   }
    //                 }
    //               }
    //             }
    //           }
    //         }
    //       },
    //       '404': { description: 'Product not found' }
    //     }
    //   }
    // },
    // '/products/{productId}/report': {
    //   post: {
    //     tags: ['Products'],
    //     summary: 'Report a problematic product',
    //     security: [{ bearerAuth: [] }],
    //     parameters: [ { name: 'productId', in: 'path', required: true, schema: { type: 'integer' } } ],
    //     requestBody: {
    //       required: true,
    //       content: {
    //         'application/json': {
    //           schema: { type: 'object', required: ['report_details'], properties: { report_details: { type: 'string', minLength: 10, maxLength: 255, example: 'Incorrect ingredient information listed on this product' } } }
    //         }
    //       }
    //     },
    //     responses: { '201': { description: 'Product report submitted successfully' }, '400': { description: 'Validation error or invalid product ID' }, '401': { $ref: '#/components/responses/Unauthorized' }, '404': { description: 'Product not found' }, '409': { description: 'User has already reported this product' } }
    //   }
    // },
    // Subscriptions
    '/subscriptions/plans': {
      get: {
        tags: ['Subscriptions'],
        summary: 'Get all available tier plans',
        responses: {
          '200': {
            description: 'Tier plans retrieved successfully',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', example: true }, message: { type: 'string', example: 'Tier plans retrieved successfully' }, data: { type: 'object', properties: { plans: { type: 'array', items: { $ref: '#/components/schemas/TierPlan' } } } } } } } }
          }
        }
      }
    },
    '/subscriptions/me': {
      get: {
        tags: ['Subscriptions'],
        summary: "Get user's current active subscription",
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'User subscription retrieved successfully' },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      },
      delete: {
        tags: ['Subscriptions'],
        summary: "Cancel user's active subscription",
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Subscription cancelled successfully' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { description: 'No active subscription found' }
        }
      }
    },
    '/subscriptions/me/history': {
      get: {
        tags: ['Subscriptions'],
        summary: "Get user's subscription history",
        security: [{ bearerAuth: [] }],
        parameters: [ { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }, { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } } ],
        responses: {
          '200': { description: 'Subscription history retrieved successfully' },
          '401': { $ref: '#/components/responses/Unauthorized' }
        }
      }
    },
    '/subscriptions/me/limits': {
      get: {
        tags: ['Subscriptions'],
        summary: "Get user's subscription limits and current usage",
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Subscription limits retrieved successfully' }, '401': { $ref: '#/components/responses/Unauthorized' } }
      }
    },
    '/subscriptions/upgrade': {
      post: {
        tags: ['Subscriptions'],
        summary: 'Upgrade or create new subscription',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['tier_plan_id'], properties: { tier_plan_id: { type: 'integer', example: 2 }, duration_months: { type: 'integer', minimum: 1, maximum: 12, default: 1, example: 3 } } } } }
        },
        responses: { '201': { description: 'Subscription upgraded successfully' }, '400': { description: 'Validation error' }, '401': { $ref: '#/components/responses/Unauthorized' }, '404': { description: 'Tier plan not found' } }
      }
    },
    // Admin
    // '/admin/dashboard': {
    //   get: {
    //     tags: ['Admin'],
    //     summary: 'Get admin dashboard statistics',
    //     security: [{ bearerAuth: [] }],
    //     responses: { '200': { description: 'Dashboard statistics retrieved successfully' }, '401': { $ref: '#/components/responses/Unauthorized' }, '403': { $ref: '#/components/responses/Forbidden' } }
    //   }
    // },
    // '/admin/analytics': {
    //   get: {
    //     tags: ['Admin'],
    //     summary: 'Get system analytics',
    //     security: [{ bearerAuth: [] }],
    //     responses: { '200': { description: 'System analytics retrieved successfully' }, '401': { $ref: '#/components/responses/Unauthorized' }, '403': { $ref: '#/components/responses/Forbidden' } }
    //   }
    // },
    // '/admin/users': {
    //   get: {
    //     tags: ['Admin'],
    //     summary: 'Get all users with filters',
    //     security: [{ bearerAuth: [] }],
    //     parameters: [
    //       { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
    //       { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
    //       { name: 'search', in: 'query', schema: { type: 'string' } },
    //       { name: 'role', in: 'query', schema: { type: 'integer', enum: [0, 1] } },
    //       { name: 'is_verified', in: 'query', schema: { type: 'boolean' } }
    //     ],
    //     responses: {
    //       '200': { description: 'Users retrieved successfully' },
    //       '401': { $ref: '#/components/responses/Unauthorized' },
    //       '403': { $ref: '#/components/responses/Forbidden' }
    //     }
    //   }
    // },
    // '/admin/users/{userId}': {
    //   get: {
    //     tags: ['Admin'],
    //     summary: 'Get user details by ID',
    //     security: [{ bearerAuth: [] }],
    //     parameters: [ { name: 'userId', in: 'path', required: true, schema: { type: 'integer' } } ],
    //     responses: { '200': { description: 'User details retrieved successfully' }, '400': { description: 'Invalid user ID' }, '401': { $ref: '#/components/responses/Unauthorized' }, '403': { $ref: '#/components/responses/Forbidden' }, '404': { description: 'User not found' } }
    //   },
    //   put: {
    //     tags: ['Admin'],
    //     summary: 'Update user role or verification status',
    //     security: [{ bearerAuth: [] }],
    //     parameters: [ { name: 'userId', in: 'path', required: true, schema: { type: 'integer' } } ],
    //     requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { role: { type: 'integer', enum: [0, 1], example: 1 }, is_verified: { type: 'boolean', example: true } }, minProperties: 1 } } } },
    //     responses: { '200': { description: 'User updated successfully' }, '400': { description: 'Validation error or invalid user ID' }, '401': { $ref: '#/components/responses/Unauthorized' }, '403': { $ref: '#/components/responses/Forbidden' }, '404': { description: 'User not found' } }
    //   },
    //   delete: {
    //     tags: ['Admin'],
    //     summary: 'Delete (deactivate) user',
    //     security: [{ bearerAuth: [] }],
    //     parameters: [ { name: 'userId', in: 'path', required: true, schema: { type: 'integer' } } ],
    //     responses: { '200': { description: 'User deleted successfully' }, '400': { description: 'Invalid user ID' }, '401': { $ref: '#/components/responses/Unauthorized' }, '403': { $ref: '#/components/responses/Forbidden' }, '404': { description: 'User not found' } }
    //   }
    // },
    // '/admin/reports': {
    //   get: {
    //     tags: ['Admin'],
    //     summary: 'Get all product reports',
    //     security: [{ bearerAuth: [] }],
    //     parameters: [
    //       { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
    //       { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
    //       { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'REVIEWED', 'RESOLVED', 'REJECTED'] } }
    //     ],
    //     responses: { '200': { description: 'Product reports retrieved successfully' }, '401': { $ref: '#/components/responses/Unauthorized' }, '403': { $ref: '#/components/responses/Forbidden' } }
    //   }
    // },
    // '/admin/reports/{reportId}': {
    //   put: {
    //     tags: ['Admin'],
    //     summary: 'Update product report status',
    //     security: [{ bearerAuth: [] }],
    //     parameters: [ { name: 'reportId', in: 'path', required: true, schema: { type: 'integer' } } ],
    //     requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['PENDING', 'REVIEWED', 'RESOLVED', 'REJECTED'], example: 'REVIEWED' } } } } } },
    //     responses: { '200': { description: 'Report status updated successfully' }, '400': { description: 'Validation error or invalid report ID' }, '401': { $ref: '#/components/responses/Unauthorized' }, '403': { $ref: '#/components/responses/Forbidden' }, '404': { description: 'Report not found' } }
    //   }
    // },
    // '/admin/subscriptions/stats': {
    //   get: {
    //     tags: ['Admin'],
    //     summary: 'Get subscription statistics',
    //     security: [{ bearerAuth: [] }],
    //     responses: { '200': { description: 'Subscription statistics retrieved successfully' }, '401': { $ref: '#/components/responses/Unauthorized' }, '403': { $ref: '#/components/responses/Forbidden' } }
    //   }
    // },
    // '/admin/allergens': {
    //   get: {
    //     tags: ['Admin'],
    //     summary: 'List allergens',
    //     security: [{ bearerAuth: [] }],
    //     parameters: [ { name: 'search', in: 'query', schema: { type: 'string' } }, { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }, { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } } ],
    //     responses: { '200': { description: 'Allergens retrieved successfully' }, '401': { $ref: '#/components/responses/Unauthorized' }, '403': { $ref: '#/components/responses/Forbidden' } }
    //   },
    //   post: {
    //     tags: ['Admin'],
    //     summary: 'Create allergen',
    //     security: [{ bearerAuth: [] }],
    //     requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, description: { type: 'string' }, is_custom: { type: 'boolean' } } } } } },
    //     responses: { '201': { description: 'Allergen created successfully' }, '401': { $ref: '#/components/responses/Unauthorized' }, '403': { $ref: '#/components/responses/Forbidden' } }
    //   }
    // },
    // '/admin/allergens/{id}': {
    //   put: {
    //     tags: ['Admin'],
    //     summary: 'Update allergen',
    //     security: [{ bearerAuth: [] }],
    //     parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'integer' } } ],
    //     requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' }, is_custom: { type: 'boolean' } } } } } },
    //     responses: { '200': { description: 'Allergen updated successfully' }, '401': { $ref: '#/components/responses/Unauthorized' }, '403': { $ref: '#/components/responses/Forbidden' } }
    //   },
    //   delete: {
    //     tags: ['Admin'],
    //     summary: 'Delete allergen',
    //     security: [{ bearerAuth: [] }],
    //     parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'integer' } } ],
    //     responses: { '200': { description: 'Allergen deleted successfully' }, '401': { $ref: '#/components/responses/Unauthorized' }, '403': { $ref: '#/components/responses/Forbidden' } }
    //   }
    // },
    '/auth/allergens': {
      get: {
        tags: ['Authentication'],
        summary: 'Get available allergens for user selection',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search allergens by name' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 100 }, description: 'Number of allergens per page' },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 }, description: 'Number of allergens to skip' }
        ],
        responses: { 
          '200': { 
            description: 'Allergens retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        items: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'integer' },
                              name: { type: 'string' },
                              description: { type: 'string' },
                              is_custom: { type: 'boolean' }
                            }
                          }
                        },
                        pagination: {
                          type: 'object',
                          properties: {
                            limit: { type: 'integer' },
                            offset: { type: 'integer' },
                            total: { type: 'integer' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
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
    // {
    //   name: 'Users',
    //   description: 'Endpoints untuk user profile & settings'
    // },
    {
      name: 'Scan',
      description: 'Endpoints untuk scan produk dan deteksi alergen'
    },
    // {
    //   name: 'Products',
    //   description: 'Endpoints untuk produk'
    // },
    {
      name: 'Subscriptions',
      description: 'Endpoints untuk subscription'
    },
    // {
    //   name: 'Admin',
    //   description: 'Endpoints untuk admin'
    // }
  ]
};
