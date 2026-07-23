import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token;
    if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(new AppError('অনুগ্রহ করে প্রথমে লগইন করুন', 401));
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as any;

    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!currentUser) {
      return next(new AppError('সেশন শেষ হয়েছে, অনুগ্রহ করে আবার লগইন করুন', 401));
    }

    if (!currentUser.isActive) {
      return next(new AppError('এই অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে', 401));
    }

    // strictly block if user has mustChangePassword=true, except for specific auth paths
    const allowedPaths = [
      '/api/auth/me',
      '/api/auth/change-password',
      '/api/auth/logout'
    ];

    const isAllowedPath = allowedPaths.some(path => req.originalUrl.startsWith(path));

    if (currentUser.mustChangePassword && !isAllowedPath) {
      return next(new AppError('নিরাপত্তার জন্য প্রথমে আপনার পাসওয়ার্ড পরিবর্তন করুন।', 403));
    }

    req.user = currentUser;
    next();
  } catch (error) {
    return next(new AppError('সেশন শেষ হয়েছে, অনুগ্রহ করে আবার লগইন করুন', 401));
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role.name)) {
      return next(new AppError('আপনার এই কাজের অনুমতি নেই', 403));
    }
    next();
  };
};

export const requirePermission = (permissionKey: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) return next(new AppError('অনুগ্রহ করে প্রথমে লগইন করুন', 401));

      if (user.role.name === 'ADMIN') return next();

      const hasPermission = user.role.permissions.some(
        (rp: any) => rp.permission.name === permissionKey
      );

      if (!hasPermission) {
        return next(new AppError('আপনার এই কাজের অনুমতি নেই', 403));
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
