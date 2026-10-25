// backend/src/app.ts
// Express application setup with security middleware

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { logger } from './utils/logger';
import { globalErrorHandler } from './shared/middlewares/errorHandler';
import { AppError } from './utils/AppError';
import prisma from './config/prisma';

const app = express();

// ─── Security ───────────────────────────────────────
app.use(helmet());

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiter — 100 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'অনেক বেশি রিকোয়েস্ট, কিছুক্ষণ পর আবার চেষ্টা করুন',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: {
    success: false,
    message: 'অনেক বেশি লগইন চেষ্টা, ১৫ মিনিট পর আবার চেষ্টা করুন',
  },
});
app.use('/api/auth/login', authLimiter);

// ─── Body Parsing ───────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Static Files (uploads) ─────────────────────────
app.use('/uploads', express.static('uploads'));

// ─── Request Logging ────────────────────────────────
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// ─── Health Check ───────────────────────────────────
app.get(['/health', '/api/health'], async (_req, res) => {
  const startTime = Date.now();
  let dbStatus = 'HEALTHY';
  let dbLatencyMs = 0;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - startTime;
  } catch (err) {
    dbStatus = 'UNHEALTHY';
  }

  const statusCode = dbStatus === 'HEALTHY' ? 200 : 503;
  res.status(statusCode).json({
    success: dbStatus === 'HEALTHY',
    message: dbStatus === 'HEALTHY' ? 'System is fully operational' : 'Database connection error',
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ─── Routes ─────────────────────────────────────────
import authRouter from './modules/auth/auth.routes';
import teacherRouter from './modules/teacher/teacher.routes';
import academicRouter, { academicPublicRouter } from './modules/academic/academic.routes';
import feeTypeRouter from './modules/feeType/feeType.routes';
import financeRouter from './modules/finance/finance.routes';
import dashboardRouter from './modules/dashboard/dashboard.routes';
import attendanceRouter from './modules/attendance/attendance.routes';
import examRouter, { publicResultRouter } from './modules/exam/exam.routes';
import notificationRouter from './modules/notification/notification.routes';
import { onlinePaymentAdminRouter, onlinePaymentPublicRouter } from './modules/onlinePayment/onlinePayment.routes';
import { noticeAdminRouter, noticePublicRouter } from './modules/notice/notice.routes';
import { galleryAdminRouter, galleryPublicRouter } from './modules/gallery/gallery.routes';
import { downloadAdminRouter, downloadPublicRouter } from './modules/download/download.routes';
import { admissionAdminRouter, admissionPublicRouter } from './modules/admission/admission.routes';
import teacherPortalRouter from './modules/teacherPortal/teacherPortal.routes';
import studentPortalRouter from './modules/studentPortal/studentPortal.routes';

import accountingRouter from './modules/accounting/accounting.router';
import staffRouter from './modules/staff/staff.router';
import payrollRouter from './modules/payroll/payroll.router';
import hostelRouter from './modules/hostel/hostel.router';
import bazarRouter from './modules/bazar/bazar.router';
import inventoryRouter from './modules/inventory/inventory.router';

app.use('/api/auth', authRouter);
app.use('/api/teacher', teacherPortalRouter);
app.use('/api/student', studentPortalRouter);
app.use('/api/admin/teachers', teacherRouter);
app.use('/api/admin/staff', staffRouter);
app.use('/api/admin/payroll', payrollRouter);
app.use('/api/admin/hostel', hostelRouter);
app.use('/api/admin/bazar', bazarRouter);
app.use('/api/admin/inventory', inventoryRouter);
app.use('/api/academic', academicRouter);
app.use('/api/public/academic', academicPublicRouter);
app.use('/api/admin/fee-types', feeTypeRouter);
app.use('/api/admin/finance', financeRouter);
app.use('/api/admin/accounting', accountingRouter);
app.use('/api/admin/dashboard', dashboardRouter);
app.use('/api/admin/attendance', attendanceRouter);
app.use('/api/admin/results', examRouter);
app.use('/api/public/results', publicResultRouter);
app.use('/api/admin/notifications', notificationRouter);
app.use('/api/admin/online-payments', onlinePaymentAdminRouter);
app.use('/api/public/payments', onlinePaymentPublicRouter);
app.use('/api/admin/notices', noticeAdminRouter);
app.use('/api/public/notices', noticePublicRouter);
app.use('/api/admin/gallery', galleryAdminRouter);
app.use('/api/public/gallery', galleryPublicRouter);
app.use('/api/admin/downloads', downloadAdminRouter);
app.use('/api/public/downloads', downloadPublicRouter);
app.use('/api/admin/admissions', admissionAdminRouter);
app.use('/api/public/admissions', admissionPublicRouter);

// ─── 404 Handler ────────────────────────────────────
app.all('*path', (req, _res, next) => {
  next(new AppError(`রাউট ${req.originalUrl} পাওয়া যায়নি`, 404));
});

// ─── Global Error Handler (must be LAST) ────────────
app.use(globalErrorHandler);

export default app;
