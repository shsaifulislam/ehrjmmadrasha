// backend/src/modules/auth/auth.controller.ts
// Auth controller — thin layer that calls AuthService

import { Request, Response } from 'express';
import { authService } from './auth.service';
import { sendSuccess } from '../../shared/utils/response';
import { env } from '../../config/env';
import { AuthenticatedRequest } from '../../shared/types';

/** Cookie options for access token */
const accessCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/',
};

/** Cookie options for refresh token */
const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

/** Clear cookie options */
const clearCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export class AuthController {
  /**
   * POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    const ip = req.ip || req.socket.remoteAddress;
    const result = await authService.login(req.body, ip);

    // Set HTTP-only cookies
    res.cookie('jwt', result.accessToken, accessCookieOptions);
    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions);

    sendSuccess(res, { user: result.user }, 'সফলভাবে লগইন হয়েছে');
  }

  /**
   * POST /api/auth/logout
   */
  async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie('jwt', clearCookieOptions);
    res.clearCookie('refreshToken', clearCookieOptions);
    sendSuccess(res, null, 'সফলভাবে লগআউট হয়েছে');
  }

  /**
   * GET /api/auth/me
   */
  async getMe(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const user = await authService.getProfile(authReq.user.id);
    sendSuccess(res, { user });
  }

  /**
   * POST /api/auth/refresh
   */
  async refresh(req: Request, res: Response): Promise<void> {
    const token = req.cookies.refreshToken;
    if (!token) {
      res.status(401).json({ success: false, message: 'রিফ্রেশ টোকেন নেই' });
      return;
    }

    const result = await authService.refreshToken(token);

    res.cookie('jwt', result.accessToken, accessCookieOptions);
    sendSuccess(res, { user: result.user }, 'টোকেন রিফ্রেশ হয়েছে');
  }

  /**
   * POST /api/auth/change-password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const ip = req.ip || req.socket.remoteAddress;
    const result = await authService.changePassword(authReq.user.id, req.body, ip);

    res.cookie('jwt', result.accessToken, accessCookieOptions);
    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions);

    sendSuccess(res, { user: result.user }, 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে');
  }
}

export const authController = new AuthController();
