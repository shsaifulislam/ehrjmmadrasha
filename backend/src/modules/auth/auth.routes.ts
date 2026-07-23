// backend/src/modules/auth/auth.routes.ts
// Auth module routes

import { Router } from 'express';
import { authController } from './auth.controller';
import { requireAuth } from '../../middlewares/auth.middleware';
import { validateBody } from '../../shared/middlewares/validate';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { loginSchema, changePasswordSchema } from './auth.schema';

const router = Router();

// Public routes
router.post('/login', validateBody(loginSchema), asyncHandler(authController.login.bind(authController)));
router.post('/refresh', asyncHandler(authController.refresh.bind(authController)));

// Protected routes
router.get('/me', requireAuth, asyncHandler(authController.getMe.bind(authController)));
router.post('/logout', requireAuth, asyncHandler(authController.logout.bind(authController)));
router.post(
  '/change-password',
  requireAuth,
  validateBody(changePasswordSchema),
  asyncHandler(authController.changePassword.bind(authController))
);

export default router;
