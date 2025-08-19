
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit  from 'express-rate-limit';
import dotenv from 'dotenv';
import { Prisma, PrismaClient } from '@prisma/client';
import authRoutes from "./routes/auth.routes"



dotenv.config();

export const prisma = new PrismaClient();

const app: Express = express();
const port = process.env.PORT || 3000;

//security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials:true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.'
});

app.use(limiter);

app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({extended: true}));




// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API versioning
app.use("/api/v1/auth", authRoutes);


app.listen(port, () => {
  console.log(`🚀 Allertify Backend Server running on port ${port}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
});
export default app;
