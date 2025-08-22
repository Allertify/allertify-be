# Allertify Backend API

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-blue.svg)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748.svg)](https://www.prisma.io/)
[![Express](https://img.shields.io/badge/Express-5.x-000000.svg)](https://expressjs.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

> **Backend API untuk Allertify** - Aplikasi deteksi alergen makanan yang membantu pengguna mengidentifikasi bahan berbahaya dalam produk makanan melalui scanning barcode dan analisis gambar.

## 📖 About

Allertify Backend adalah RESTful API yang dibangun dengan Node.js dan TypeScript, dirancang khusus untuk mendukung aplikasi mobile Allertify. Sistem ini menyediakan fitur-fitur canggih untuk:

- **Deteksi Alergen**: Analisis produk makanan menggunakan AI untuk mengidentifikasi potensi alergen
- **Manajemen Profil Alergi**: Sistem personalisasi berdasarkan alergi spesifik pengguna
- **Scanning Produk**: Dukungan barcode scanning dan OCR untuk analisis gambar
- **Subscription Management**: Sistem berlangganan dengan tier-based limitations
- **Admin Panel**: Interface administratif untuk manajemen data

**Authors**: Arvan Yudhistia Ardana, Muchammad Rafif Azis Syahlevi

## 🛠️ Tech Stack

### Core Technologies
- **Runtime**: Node.js 20.x
- **Language**: TypeScript 5.x
- **Framework**: Express.js 5.x
- **Database**: PostgreSQL 15.x
- **ORM**: Prisma 5.x

### Key Dependencies
- **Authentication**: JWT (jsonwebtoken), Argon2 (password hashing)
- **AI Integration**: Google Generative AI, OpenAI API
- **File Upload**: Cloudinary, Multer
- **Validation**: Joi, Zod
- **Security**: Helmet, CORS, Rate Limiting
- **Admin Panel**: AdminJS with Express integration
- **Email**: Nodemailer
- **Logging**: Winston
- **API Documentation**: Swagger UI Express

### Development Tools
- **Testing**: Jest, Supertest
- **Code Quality**: ESLint, Prettier
- **Development**: ts-node-dev, nodemon
- **Database**: Prisma Studio, PostgreSQL migrations
- **Containerization**: Docker, Docker Compose

## ✨ Features

### 🔐 Authentication & Security
- **JWT-based Authentication** dengan access tokens
- **Email Verification** menggunakan OTP system
- **Password Reset** dengan secure token mechanism
- **Role-based Access Control** (User, Admin)
- **Rate Limiting** untuk API protection
- **Argon2 Password Hashing** untuk security optimal

### 👤 User Management
- **Profile Management**: Update profil, foto profil, kontak darurat
- **Allergy Management**: Kustomisasi daftar alergi personal
- **Subscription Tracking**: Manajemen tier berlangganan
- **Emergency Contacts**: Satu kontak darurat per user

### 🔍 Product Scanning & Analysis
- **Barcode Scanning**: Identifikasi produk via barcode
- **Image Upload**: Analisis gambar produk untuk ekstraksi informasi
- **AI-Powered Analysis**: Deteksi alergen menggunakan Google Generative AI
- **Risk Assessment**: Klasifikasi tingkat risiko (LOW, MEDIUM, HIGH)
- **Scan History**: Riwayat lengkap scanning dengan filter options
- **Save Functionality**: Simpan produk untuk akses cepat

### 📊 Product Management
- **Product Database**: Katalog produk dengan barcode, ingredients, nutritional info
- **User Preferences**: RED/GREEN list untuk klasifikasi produk personal
- **Product Reports**: Sistem pelaporan untuk produk bermasalah
- **Ingredient Analysis**: Parsing dan analisis komposisi produk

### 💳 Subscription System
- **Tier-based Plans**: Multiple subscription tiers dengan limitations berbeda
- **Scan Limits**: Daily scan quotas berdasarkan subscription tier
- **Usage Tracking**: Monitoring penggunaan harian per user
- **Automatic Limit Enforcement**: Pembatasan otomatis sesuai subscription

### 📧 Communication
- **Email System**: SMTP integration untuk notifications
- **OTP Verification**: Email-based verification system
- **Password Reset**: Secure email-based password recovery

### 📱 API Features
- **RESTful Design**: Standard HTTP methods dan status codes
- **Swagger Documentation**: Interactive API documentation
- **Request Validation**: Comprehensive input validation
- **Error Handling**: Structured error responses
- **Logging System**: Detailed request/response logging
- **Health Checks**: System health monitoring endpoints

## 📊 System Overview & Architecture

### Entity Relational Diagram
<img width="1457" height="1072" alt="Image" src="https://github.com/user-attachments/assets/722824a1-3fe7-4a8e-9625-ab3fdd037c3b" />
https://miro.com/app/board/uXjVJV8BZn4=/?moveToWidget=3458764637279385595&cot=14
### CI/CD Overview
<img width="1824" height="183" alt="Image" src="https://github.com/user-attachments/assets/4b0f0e13-b367-40f9-b93e-792f68bb7ca6" />

### System Design Diagram
<img width="1060" height="641" alt="Image" src="https://github.com/user-attachments/assets/342c4c30-ac8b-49a0-8ecc-053778522fa7" />

### API Structure
```
/api/v1/
├── /auth          # Authentication endpoints
├── /users         # User management
├── /scans         # Product scanning
├── /subscriptions # Subscription management
├── /products      # Product catalog
└── /admin         # Admin operations
```

### Service Layer
- **AuthService**: Authentication, registration, password management
- **ScanService**: Product scanning, AI analysis, history management
- **UserService**: Profile management, preferences
- **SubscriptionService**: Plan management, usage tracking
- **ProductService**: Product catalog, search functionality
- **EmailService**: Email notifications, OTP delivery

## 🚀 Implementation

### Prerequisites
- Node.js 20.x atau lebih tinggi
- PostgreSQL 15.x
- npm atau yarn
- Docker & Docker Compose (optional)

### Environment Setup

1. **Clone Repository**
```bash
git clone https://github.com/Allertify/allertify-be
cd allertify-be
```

2. **Install Dependencies**
```bash
npm install
```

3. **Environment Configuration**
```bash
cp env.example .env
```

Edit `.env` file dengan konfigurasi yang sesuai:


### Docker Deployment

1. **Using Docker Compose** (Recommended)
```bash
docker-compose up -d
```

2. **Manual Docker Build**
```bash
docker build -t allertify-backend .
docker run -p 3000:3000 --env-file .env allertify-backend
```

### Production Deployment

1. **Environment Setup**
   - Set `NODE_ENV=production`
   - Configure production database URL
   - Set secure JWT secrets
   - Configure production email service

2. **Build & Deploy**
```bash
npm run build
npm start
```

3. **Health Check**
```bash
curl http://allertify.ciet/health
```

## 📚 API Documentation

### Base URL
```
Development: http://localhost:3109/api/v1
Production: https://allertify.ciet.site/api/v1
```

### Interactive Documentation
- **Swagger UI**: `http://allertify.ciet.site/api-docs`

### Authentication
Semua protected endpoints memerlukan Authorization header:
```
Authorization: Bearer <jwt_token>
```


## 📁 Project Structure

```
allertify-be/
├── src/
│   ├── config/            # Configuration files
│   │   ├── adminjs.config.ts
│   │   ├── database.ts
│   │   ├── features.ts
│   │   └── swagger.ts
│   ├── controllers/       # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── scan.controller.ts
│   │   ├── user.controller.ts
│   │   ├── subscription.controller.ts
│   │   ├── product.controller.ts
│   │   └── admin.controller.ts
│   ├── middlewares/       # Express middlewares
│   │   ├── auth.middleware.ts
│   │   ├── auth.validation.ts
│   │   ├── error.middleware.ts
│   │   ├── google.gen.ai.ts
│   │   └── validation.middleware.ts
│   ├── routes/           # API routes
│   │   ├── auth.routes.ts
│   │   ├── scan.routes.ts
│   │   ├── user.routes.ts
│   │   ├── subscription.routes.ts
│   │   ├── product.routes.ts
│   │   └── admin.routes.ts
│   ├── services/         # Business logic
│   │   ├── auth.service.ts
│   │   ├── scan.service.ts
│   │   ├── scan-limit.service.ts
│   │   ├── user.service.ts
│   │   ├── subscription.service.ts
│   │   ├── product.service.ts
│   │   ├── email.service.ts
│   │   └── cloudinary.service.ts
│   ├── utils/           # Utility functions
│   │   ├── logger.ts
│   │   ├── response.ts
│   │   ├── validation.ts
│   │   ├── transform.ts
│   │   ├── email.ts
│   │   ├── jwt.ts
│   │   └── constants.ts
│   └── index.ts         # Application entry point
├── prisma/
│   ├── migrations/      # Database migrations
│   ├── schema.prisma    # Database schema
│   └── seed.ts         # Database seeding
├── tests/
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   ├── helpers/        # Test utilities
│   ├── setup.ts        # Test setup
│   └── teardown.ts     # Test cleanup
├── logs/              # Log files
├── docker-compose.yaml # Docker configuration
├── Dockerfile         # Docker image definition
├── package.json       # Dependencies & scripts
├── tsconfig.json      # TypeScript configuration
├── jest.config.js     # Jest configuration
├── eslintrc.js        # ESLint configuration
└── README.md          # This file
```

## 🔧 Configuration

### Database Configuration
- **Production**: PostgreSQL dengan connection pooling
- **Development**: Local PostgreSQL instance
- **Testing**: In-memory atau separate test database

### AI Integration
- **Google Generative AI**: Primary AI service untuk analisis alergen

### File Upload
- **Cloudinary**: Cloud-based image storage dan processing

### Email Service
- **SMTP**: Gmail atau service lain untuk email delivery

## 🚦 Monitoring & Logging

### Logging System
- **Winston Logger**: Structured logging dengan multiple transports
- **Log Levels**: Error, Warn, Info, Debug
- **Log Files**: Combined logs dan error-specific logs
- **Request Logging**: Detailed HTTP request/response logging

### Health Checks
- **Health Endpoint**: `/health` untuk service monitoring
- **Database Health**: Connection status checking
- **External Services**: AI dan email service status

### Error Handling
- **Global Error Handler**: Centralized error processing
- **Error Types**: Validation, Authentication, Authorization, Server errors
- **Error Logging**: Detailed error tracking dengan stack traces

## 🔒 Security

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **Role-based Access**: User dan Admin roles
- **Token Expiration**: Configurable token lifetimes

### Data Protection
- **Password Hashing**: Argon2 untuk secure password storage
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Prisma ORM dengan parameterized queries
- **XSS Protection**: Input sanitization dan output encoding

### API Security
- **Rate Limiting**: Request throttling untuk abuse prevention
- **CORS Configuration**: Cross-origin request control
- **Helmet**: Security headers untuk HTTP responses
- **HTTPS Enforcement**: Secure communication (production)

## 🧪 Testing

### Test Coverage
- **Unit Tests**: Individual function dan service testing
- **Integration Tests**: End-to-end API testing

### Test Environment
- **Separate Database**: Isolated test database
- **Mock Services**: AI dan external service mocking

## 🚀 Deployment

### Production Requirements
- **Node.js 20.x**: Runtime environment
- **PostgreSQL 15.x**: Production database
- **SSL Certificate**: HTTPS encryption
- **Environment Variables**: Secure configuration management

### Deployment Options
- **Docker**: Containerized deployment dengan Docker Compose

### CI/CD Pipeline
- **Automated Testing**: Pre-deployment test execution
- **Database Migrations**: Automatic schema updates
- **Health Checks**: Post-deployment verification
- **Rollback Strategy**: Quick rollback capability

## 📞 Support

### Documentation
- **API Documentation**: `/api-docs` endpoint
- **Database Schema**: `docs/DATABASE_DESIGN.md`

### Contact
- **Authors**:  Arvan Yudhistia Ardana(https://github.com/arvardy184) & Muchammad Rafif Azis Syahlevi(https://github.com/rafifazs20)
- **Project**: Allertify - Food Allergen Detection System

### Issues
Report bugs atau request features melalui project issue tracker.

---

## 📄 License

This project is licensed under the ISC License - see the package.json file for details.

---

**Allertify Backend** - Empowering safer food choices through intelligent allergen detection.

*Built with ❤️ by Team 4 SEA COMPFEST 17*
