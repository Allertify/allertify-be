// src/config/adminjs.config.ts
import { PrismaClient } from '@prisma/client';
import session from 'express-session';
import Connect from 'connect-pg-simple';
import argon2 from 'argon2';

const prisma = new PrismaClient();
const ConnectSession = Connect(session);

// --- AUTHENTICATION FUNCTION ---
const authenticate = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Ganti 'ADMIN' sesuai dengan nama Enum Role Anda di Prisma
  if (user && user.role === 0) {
    const isPasswordValid = await argon2.verify(user.password, password);
    if (isPasswordValid) {
      return {
        id: user.id,
        email: user.email,
        role: 'admin',
        fullName: user.full_name,
      };
    }
  }
  return null;
};

// --- SESSION STORE ---
const sessionStore = new ConnectSession({
  conObject: {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production',
  },
  tableName: 'user_sessions', 
  createTableIfMissing: true,
});

// --- MAIN CONFIG & ROUTER ---
export const createAdminRouter = async () => {
  // Dynamic imports for AdminJS v7
  const AdminJS = (await import('adminjs')).default;
  const { buildAuthenticatedRouter } = await import('@adminjs/express');
  const { Database, Resource } = await import('@adminjs/prisma');

  // Register Prisma adapter BEFORE creating AdminJS instance
  AdminJS.registerAdapter({ Database, Resource });

  const admin = new AdminJS({
    rootPath: '/admin',
    branding: {
      companyName: 'Allertify',
      logo: false,
    },
    // Use databases instead of resources for better compatibility
    databases: [new Database({ client: prisma })],
  });

  return buildAuthenticatedRouter(
    admin,
    {
      authenticate,
      cookieName: 'allertify-admin-cookie',
      cookiePassword: process.env.ADMIN_SESSION_SECRET || 'ALLERTIFFYYSESSIONALLERTIFY',
    },
    null,
    {
      store: sessionStore,
      resave: false,
      saveUninitialized: true,
      secret: process.env.ADMIN_SESSION_SECRET || 'ALLERTIFFYYSESSIONALLERTIFY',
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24, // 1 hari
      },
    }
  );
};