// backend/src/modules/auth/auth.service.ts
// Auth business logic — separated from controller

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/prisma';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { logAudit } from '../../utils/auditLogger';
import type { LoginInput, ChangePasswordInput } from './auth.schema';

/**
 * Sign an access token (short-lived)
 */
function signAccessToken(userId: string): string {
  return jwt.sign({ id: userId, type: 'access' }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
}

/**
 * Sign a refresh token (long-lived)
 */
function signRefreshToken(userId: string): string {
  return jwt.sign({ id: userId, type: 'refresh' }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  });
}

/**
 * Standard user include for auth queries (exclude passwordHash)
 */
const userInclude = {
  role: {
    include: {
      permissions: {
        include: { permission: true },
      },
    },
  },
} as const;

/**
 * Strip sensitive fields from user object
 */
function sanitizeUser(user: any) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export class AuthService {
  /**
   * Login — validate credentials and return tokens + user
   */
  async login(input: LoginInput, ipAddress?: string) {
    const identifier = input.username.trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { student: { studentId: identifier } },
          { student: { guardian: { phone: identifier } } },
          { teacher: { phone: identifier } },
          { teacher: { teacherId: identifier } },
          { staff: { phone: identifier } },
          { staff: { employeeId: identifier } },
        ],
      },
      include: userInclude,
    });


    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new AppError('ইউজারনেম, ফোন নম্বর বা পাসওয়ার্ড সঠিক নয়', 401);
    }


    if (!user.isActive) {
      throw new AppError('এই অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে', 401);
    }

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    await logAudit(user.id, 'LOGIN', 'auth', null, ipAddress || null);

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshTokenStr: string) {
    try {
      const decoded = jwt.verify(refreshTokenStr, env.JWT_REFRESH_SECRET) as any;

      if (decoded.type !== 'refresh') {
        throw new AppError('অবৈধ টোকেন', 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: userInclude,
      });

      if (!user || !user.isActive) {
        throw new AppError('সেশন শেষ হয়েছে, আবার লগইন করুন', 401);
      }

      const accessToken = signAccessToken(user.id);

      return {
        user: sanitizeUser(user),
        accessToken,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('সেশন শেষ হয়েছে, আবার লগইন করুন', 401);
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: userInclude,
    });

    if (!user) {
      throw new AppError('ব্যবহারকারী পাওয়া যায়নি', 404);
    }

    return sanitizeUser(user);
  }

  /**
   * Change password
   */
  async changePassword(userId: string, input: ChangePasswordInput, ipAddress?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new AppError('ব্যবহারকারী পাওয়া যায়নি', 404);
    }

    const isMatch = await bcrypt.compare(input.oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('বর্তমান পাসওয়ার্ডটি সঠিক নয়', 401);
    }

    const newHash = await bcrypt.hash(input.newPassword, 12);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
      },
      include: userInclude,
    });

    const accessToken = signAccessToken(updatedUser.id);
    const refreshToken = signRefreshToken(updatedUser.id);

    await logAudit(userId, 'CHANGE_PASSWORD', 'auth', null, ipAddress || null);

    return {
      user: sanitizeUser(updatedUser),
      accessToken,
      refreshToken,
    };
  }
}

export const authService = new AuthService();
