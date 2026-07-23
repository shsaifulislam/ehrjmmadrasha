// backend/src/config/env.ts
// Validated environment configuration

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3001'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10).optional(),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().default('5242880'), // 5MB
  SMS_PROVIDER: z.enum(['bulksmsbd', 'mock', 'teletalk']).default('mock'),
  SMS_API_URL: z.string().optional(),
  SMS_API_KEY: z.string().optional(),
  SMS_SENDER_ID: z.string().optional(),
  BKASH_APP_KEY: z.string().optional(),
  BKASH_APP_SECRET: z.string().optional(),
  BKASH_USERNAME: z.string().optional(),
  BKASH_PASSWORD: z.string().optional(),
  BKASH_API_URL: z.string().optional(),
  NAGAD_MERCHANT_ID: z.string().optional(),
  NAGAD_PUBLIC_KEY: z.string().optional(),
  NAGAD_PRIVATE_KEY: z.string().optional(),
  NAGAD_API_URL: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

const parsed = _env.data;

// Safety check: Fail startup if NODE_ENV=production and SMS_PROVIDER=mock
if (parsed.NODE_ENV === 'production' && parsed.SMS_PROVIDER === 'mock') {
  console.error('❌ Production safety violation: SMS_PROVIDER cannot be "mock" in production mode.');
  process.exit(1);
}

// Use JWT_SECRET as fallback for JWT_REFRESH_SECRET if not set
if (!parsed.JWT_REFRESH_SECRET) {
  parsed.JWT_REFRESH_SECRET = parsed.JWT_SECRET + '_refresh';
}

export const env = parsed as Required<typeof parsed>;
