
import express, { Express} from 'express';
// Import routes
import scanRoutes from './routes/scan.routes';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit  from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import productRoutes from "./routes/product.routes";
import subscriptionRoutes from "./routes/subscription.routes";
import adminRoutes from "./routes/admin.routes";
import { errorHandler } from './middlewares/error.middleware';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { logger } from './utils/logger';


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


app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({extended: true}));
// Serve Swagger UI using manual spec only
console.log('Using manual swaggerSpec for Swagger UI');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
  
  // Log request to file
  logger.info('Incoming Request', {
    requestId,
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
  
  next();
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/scans', scanRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/admin', adminRoutes);

//error handler
app.use(errorHandler);

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  logger.error('Unhandled Rejection:', { reason, promise });
  process.exit(1);
});

app.listen(port, () => {
  console.log(`🚀 Allertify Backend Server running on port ${port}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);

});

export default app;
