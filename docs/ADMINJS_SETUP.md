# 🚀 AdminJS Setup Guide for Allertify Backend

## Overview
AdminJS adalah panel admin yang powerful untuk mengelola data Allertify backend. Panel ini memberikan interface yang user-friendly untuk mengelola users, products, allergens, dan data lainnya.

## 🛠️ Setup Instructions

### 1. Install Dependencies
Pastikan semua dependencies sudah terinstall:
```bash
npm install
```

### 2. Environment Configuration
Tambahkan konfigurasi berikut ke file `.env`:
```env
# AdminJS Configuration
ADMIN_SESSION_SECRET="your-super-secret-admin-session-key-change-this"
```

### 3. Database Setup
Jalankan migration dan generate Prisma client:
```bash
npm run prisma:migrate
npm run prisma:generate
```

### 4. Create Admin User
Jalankan script untuk membuat admin user pertama:
```bash
npm run setup:admin
```

**Default Admin Credentials:**
- Email: `admin@allertify.com`
- Password: `admin123`

⚠️ **IMPORTANT:** Ganti password default ini setelah login pertama kali!

### 5. Start Application
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 🔐 Access Admin Panel

AdminJS panel tersedia di: `http://localhost:3000/admin`

## 📊 Available Resources

### User Management
- View dan edit user accounts
- Manage user roles dan permissions
- Monitor user activity

### Product Management
- Manage product database
- Update allergen information
- Product image management

### Allergen Management
- Configure allergen types
- Custom allergen management
- Allergen descriptions

### Subscription Plans
- Manage tier plans
- User subscription tracking
- Billing configuration

### Scan Analytics
- View scan history
- Usage statistics
- User behavior insights

## 🔒 Security Features

- **Authentication Required**: Semua akses memerlukan login
- **Role-based Access**: Hanya admin yang bisa akses
- **Session Management**: Secure session handling dengan PostgreSQL
- **CSRF Protection**: Built-in CSRF protection
- **Secure Cookies**: HTTP-only cookies di production

## 🚨 Production Considerations

### 1. Change Default Password
```bash
# Update di database atau buat user baru dengan password yang kuat
```

### 2. Environment Variables
```env
NODE_ENV=production
ADMIN_SESSION_SECRET="very-long-random-secret-key"
```

### 3. SSL Configuration
```typescript
// AdminJS akan otomatis enable SSL di production
cookie: {
  secure: process.env.NODE_ENV === 'production',
  httpOnly: process.env.NODE_ENV === 'production',
}
```

## 🐛 Troubleshooting

### Common Issues

#### 1. "Cannot find module '@adminjs/prisma'"
```bash
npm install @adminjs/prisma
```

#### 2. "Database connection failed"
- Check `DATABASE_URL` di `.env`
- Pastikan PostgreSQL running
- Verify database permissions

#### 3. "Session store error"
```bash
# Recreate session table
npm run prisma:migrate
```

#### 4. "Authentication failed"
- Verify admin user exists: `npm run setup:admin`
- Check user role = 1 di database
- Verify password di `adminjs.config.ts`

### Debug Mode
Untuk debugging, tambahkan logging:
```typescript
// Di adminjs.config.ts
console.log('AdminJS Config:', adminJsConfig);
console.log('Session Store:', sessionStore);
```

## 📝 Customization

### Adding New Resources
```typescript
// Di adminjs.config.ts
{
  resource: { model: 'your_model', client: prisma },
  options: {
    navigation: { name: 'Your Section' },
    properties: {
      // Customize field visibility
    },
    actions: {
      // Customize actions
    }
  }
}
```

### Custom Dashboard
Edit `src/components/dashboard.tsx` untuk customize dashboard appearance.

## 🔗 Useful Links

- [AdminJS Documentation](https://adminjs.co/)
- [AdminJS Prisma Adapter](https://adminjs.co/module-@adminjs_prisma.html)
- [Express Session](https://github.com/expressjs/session)
- [Connect-PG-Simple](https://github.com/voxpelli/node-connect-pg-simple)

## 📞 Support

Jika ada masalah atau pertanyaan:
1. Check logs di console
2. Verify database connection
3. Check environment variables
4. Review this documentation

---

**Happy Admin-ing! 🎉**
