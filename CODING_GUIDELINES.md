# 🚀 Allertify BE - Coding Guidelines

## 📋 Overview
Dokumen ini berisi aturan dan standar coding yang harus diikuti oleh **Arvan** dan **Rafif** untuk menjaga konsistensi dan kualitas kode di project Allertify Backend.

---

## 🏗️ **PROJECT STRUCTURE & NAMING CONVENTIONS**

### **Folder Organization & Naming**
```
src/
├── config/          # Database, environment, app config
├── controllers/     # HTTP request handlers
├── middlewares/     # Custom middleware functions
├── repositories/    # Database operations layer
├── routes/          # API route definitions
├── services/        # Business logic layer
├── types/           # TypeScript type definitions
└── utils/           # Helper functions & utilities
```

### **File Naming Rules**
- **Controllers**: `kebab-case.controller.ts` (e.g., `auth.controller.ts`, `user-profile.controller.ts`)
- **Services**: `kebab-case.service.ts` (e.g., `auth.service.ts`, `product-scan.service.ts`)
- **Routes**: `kebab-case.route.ts` (e.g., `auth.route.ts`, `user-management.route.ts`)
- **Types**: `kebab-case.types.ts` (e.g., `auth.types.ts`, `product.types.ts`)
- **Middlewares**: `kebab-case.middleware.ts` (e.g., `auth.middleware.ts`, `validation.middleware.ts`)
- **Repositories**: `kebab-case.repository.ts` (e.g., `user.repository.ts`, `product.repository.ts`)
- **Utils**: `kebab-case.util.ts` (e.g., `jwt.util.ts`, `date.util.ts`)

---

## 🔄 **ALUR PENGGUNAAN & DEPENDENCIES**

### **1. CONFIG LAYER (Dasar)**
```typescript
// src/config/database.ts - Database configuration
export const databaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'allertify',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || ''
};

// src/config/app.ts - App configuration
export const appConfig = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'default-secret',
  environment: process.env.NODE_ENV || 'development'
};
```

**Aturan:**
- ✅ Selalu gunakan environment variables
- ✅ Jangan hardcode values
- ✅ Export sebagai named exports (bukan default)
- ✅ Gunakan type inference atau explicit typing

### **2. TYPES LAYER (Type Definitions)**
```typescript
// src/types/auth.types.ts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    role: UserRole;
  };
}

export type UserRole = 'admin' | 'user' | 'moderator';

// src/types/common.types.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}
```

**Aturan:**
- ✅ Interface untuk object shapes
- ✅ Type untuk union types
- ✅ Export semua types yang dibutuhkan layer lain
- ✅ Gunakan descriptive names (e.g., `CreateUserRequest`, bukan `UserData`)

### **3. UTILS LAYER (Helper Functions)**
```typescript
// src/utils/jwt.util.ts
export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '24h' });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
};

// src/utils/date.util.ts
export const formatDate = (date: Date): string => {
  return date.toISOString();
};

export const isValidDate = (date: any): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};
```

**Aturan:**
- ✅ Pure functions (tidak ada side effects)
- ✅ Export sebagai named exports
- ✅ Gunakan proper TypeScript typing
- ✅ Jangan import dari layer yang lebih tinggi (service, controller)

### **4. REPOSITORY LAYER (Database Operations)**
```typescript
// src/repositories/user.repository.ts
import { PrismaClient, User } from '@prisma/client';
import { CreateUserInput, UpdateUserInput } from '../types/user.types';

export class UserRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // ✅ Selalu implement CRUD operations
  async create(data: CreateUserInput): Promise<User> {
    return await this.prisma.user.create({ data });
  }

  async findById(id: number): Promise<User | null> {
    return await this.prisma.user.findUnique({ 
      where: { id },
      include: { userAllegens: true } // Include relations jika perlu
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: number, data: UpdateUserInput): Promise<User> {
    return await this.prisma.user.update({
      where: { id },
      data
    });
  }

  async delete(id: number): Promise<User> {
    return await this.prisma.user.delete({ where: { id } });
  }
}
```

**Aturan:**
- ✅ Import types dari `../types/`
- ✅ Import utils jika perlu helper functions
- ✅ Jangan import dari service, controller, atau routes
- ✅ Selalu implement CRUD operations lengkap
- ✅ Gunakan proper error handling dengan try-catch

### **5. SERVICE LAYER (Business Logic)**
```typescript
// src/services/auth.service.ts
import { UserRepository } from '../repositories/user.repository';
import { LoginRequest, LoginResponse } from '../types/auth.types';
import { ValidationError } from '../types/errors.types';
import { generateToken, hashPassword, comparePassword } from '../utils/auth.util';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  // ✅ Public methods untuk business logic
  async login(loginData: LoginRequest): Promise<LoginResponse> {
    // 1. Input validation
    this.validateLoginData(loginData);
    
    // 2. Find user
    const user = await this.userRepository.findByEmail(loginData.email);
    if (!user) {
      throw new ValidationError('Invalid email or password');
    }
    
    // 3. Verify password
    const isValidPassword = await comparePassword(loginData.password, user.password);
    if (!isValidPassword) {
      throw new ValidationError('Invalid email or password');
    }
    
    // 4. Generate token
    const token = generateToken({ userId: user.id, email: user.email });
    
    // 5. Return response
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    };
  }

  // ✅ Private methods untuk internal logic
  private validateLoginData(data: LoginRequest): void {
    if (!data.email || !data.password) {
      throw new ValidationError('Email and password are required');
    }
    if (!data.email.includes('@')) {
      throw new ValidationError('Invalid email format');
    }
  }
}
```

**Aturan:**
- ✅ Import repository, types, dan utils
- ✅ Jangan import dari controller atau routes
- ✅ Business logic harus terpisah dari HTTP concerns
- ✅ Gunakan private methods untuk internal validation
- ✅ Throw custom errors untuk business rule violations

### **6. MIDDLEWARE LAYER (Request Processing)**
```typescript
// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util';
import { UnauthorizedError } from '../types/errors.types';

export const authMiddleware = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw new UnauthorizedError('Access token required');
    }

    const decoded = verifyToken(token);
    req.user = decoded; // Extend Request type
    
    next();
  } catch (error) {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};

// src/middlewares/validation.middleware.ts
import { body, validationResult } from 'express-validator';

export const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
];
```

**Aturan:**
- ✅ Import types dan utils
- ✅ Jangan import dari service, controller, atau routes
- ✅ Gunakan `next(error)` untuk error handling
- ✅ Extend Request type untuk custom properties
- ✅ Return early untuk validation failures

### **7. CONTROLLER LAYER (HTTP Handling)**
```typescript
// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import { AuthService } from '../services/auth.service';
import { LoginRequest } from '../types/auth.types';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  // ✅ Gunakan asyncHandler untuk automatic error handling
  public login = asyncHandler(async (req: Request, res: Response) => {
    const loginData: LoginRequest = req.body;
    
    // Call service
    const result = await this.authService.login(loginData);
    
    // Response format yang konsisten
    return res.json({
      success: true,
      data: result,
      message: 'Login successful'
    });
  });

  public register = asyncHandler(async (req: Request, res: Response) => {
    const userData = req.body;
    
    // Call service
    const newUser = await this.authService.register(userData);
    
    return res.status(201).json({
      success: true,
      data: newUser,
      message: 'User registered successfully'
    });
  });
}
```

**Aturan:**
- ✅ Import service, types, dan asyncHandler
- ✅ Jangan import dari repository atau utils langsung
- ✅ Hanya handle HTTP request/response
- ✅ Gunakan asyncHandler untuk semua methods
- ✅ Response format harus konsisten

### **8. ROUTES LAYER (API Endpoints)**
```typescript
// src/routes/auth.route.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateLogin, validateRegister } from '../middlewares/validation.middleware';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/login', validateLogin, authController.login);
router.post('/register', validateRegister, authController.register);

// Protected routes
router.use(authMiddleware); // Apply auth to all routes below
router.get('/profile', authController.getProfile);
router.post('/logout', authController.logout);

export default router;
```

**Aturan:**
- ✅ Import controller dan middlewares
- ✅ Jangan import dari service, repository, atau utils
- ✅ Gunakan middleware untuk validation dan auth
- ✅ Group routes berdasarkan authentication level
- ✅ Export sebagai default export

---

## 🚨 **ERROR HANDLING FLOW**

### **Error Types Hierarchy**
```typescript
// src/types/errors.types.ts
export class BaseError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends BaseError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message: string) {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
  }
}
```

### **Error Flow**
```
Service throws error → Controller catches with asyncHandler → Error middleware processes → Client receives formatted response
```

---

## 📊 **RESPONSE FORMAT STANDARDS**

### **Success Response**
```typescript
{
  "success": true,
  "data": { /* actual data */ },
  "message": "Operation completed successfully",
  "timestamp": "2024-12-19T10:30:00Z"
}
```

### **Error Response**
```typescript
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-12-19T10:30:00Z"
}
```

---

## 🔄 **IMPORT/EXPORT RULES**

### **Import Order (dalam setiap file)**
```typescript
// 1. External libraries
import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// 2. Internal types
import { LoginRequest, LoginResponse } from '../types/auth.types';

// 3. Internal services/repositories
import { AuthService } from '../services/auth.service';

// 4. Internal utils
import { generateToken } from '../utils/jwt.util';

// 5. Internal middlewares
import { asyncHandler } from '../middlewares/asyncHandler';
```

### **Export Rules**
- **Types**: Named exports
- **Utils**: Named exports
- **Services**: Named exports (class)
- **Controllers**: Named exports (class)
- **Routes**: Default export
- **Middlewares**: Named exports (functions)

---

## 📋 **CHECKLIST SEBELUM COMMIT**

### **Import/Export Check**
- [ ] Import order sesuai aturan
- [ ] Tidak ada circular dependencies
- [ ] Export type yang benar (named vs default)
- [ ] Tidak import dari layer yang lebih tinggi

### **Naming Convention Check**
- [ ] File naming sesuai kebab-case
- [ ] Class naming PascalCase
- [ ] Method naming camelCase
- [ ] Variable naming camelCase
- [ ] Constant naming UPPER_SNAKE_CASE

### **Layer Separation Check**
- [ ] Repository hanya handle database
- [ ] Service hanya handle business logic
- [ ] Controller hanya handle HTTP
- [ ] Middleware hanya handle request processing
- [ ] Utils hanya handle helper functions

---

## 🎯 **QUICK REFERENCE - DEPENDENCY FLOW**

```
Config → Types → Utils → Repositories → Services → Middlewares → Controllers → Routes
```

### **What Each Layer Can Import**
- **Config**: Environment variables, external config
- **Types**: Nothing (base layer)
- **Utils**: Types, config
- **Repositories**: Types, utils, config
- **Services**: Types, utils, repositories
- **Middlewares**: Types, utils
- **Controllers**: Types, services, middlewares
- **Routes**: Controllers, middlewares

---

## 📞 **Support & Questions**

- **Code Review**: Selalu review code satu sama lain

---


> 💡 **Remember**: Ikuti dependency flow dan naming conventions untuk maintain clean architecture!
