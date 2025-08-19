
import express, { Express} from 'express';
// Import routes
import scanRoutes from './routes/scan.route';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit  from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from "./routes/auth.routes"



dotenv.config();

export const prisma = new PrismaClient();

const app: Express = express();
const port = process.env.PORT || 3000;

//security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }),
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
});

app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Request logging middleware
app.use((req, res, next) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`🌐 [${requestId}] [INCOMING_REQUEST] ${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    headers: {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      authorization: req.headers.authorization ? 'Bearer ***' : 'None',
    },
    timestamp: new Date().toISOString(),
  });

  // Add request ID to response headers for debugging
  res.setHeader('X-Request-ID', requestId);
  next();
});

// API Routes
app.use('/api/v1/scans', scanRoutes);
app.use("/api/v1/auth", authRoutes);




app.listen(port, () => {
  console.log(`🚀 Allertify Backend Server running on port ${port}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Available endpoints:`);
  console.log(`   • GET  /health`);
  console.log(`   • GET  /api/scans/limit`);
  console.log(`   • POST /api/scans/barcode/:barcode`);
  console.log(`   • POST /api/scans/image`);
  console.log(`   • POST /api/scans/upload`);
  console.log(`   • PUT  /api/scans/:scanId/save`);
  console.log(`   • GET  /api/scans/history`);
  console.log(`   • GET  /api/scans/saved`);
});

export default app;
