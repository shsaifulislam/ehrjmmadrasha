// backend/src/modules/onlinePayment/onlinePayment.routes.ts

import { Router } from 'express';
import { onlinePaymentController } from './onlinePayment.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth.middleware';
import { validateBody } from '../../shared/middlewares/validate';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { initiatePaymentSchema, verifyCallbackSchema } from './onlinePayment.schema';

const adminRouter = Router();
const publicRouter = Router();
const ctrl = onlinePaymentController;

// ─── ADMIN ROUTES ───────────────────────────────────
adminRouter.use(requireAuth);

adminRouter.post(
  '/initiate',
  requirePermission('manage_finance'),
  validateBody(initiatePaymentSchema),
  asyncHandler(ctrl.initiatePayment.bind(ctrl))
);

adminRouter.get(
  '/transactions',
  requirePermission('view_finance'),
  asyncHandler(ctrl.getTransactions.bind(ctrl))
);

adminRouter.post(
  '/verify',
  requirePermission('manage_finance'),
  validateBody(verifyCallbackSchema),
  asyncHandler(ctrl.handleCallback.bind(ctrl))
);

// ─── PUBLIC CALLBACK ROUTES ─────────────────────────
publicRouter.post('/callback', asyncHandler(ctrl.handleCallback.bind(ctrl)));
publicRouter.get('/callback', asyncHandler(ctrl.handleCallback.bind(ctrl)));

export { adminRouter as onlinePaymentAdminRouter, publicRouter as onlinePaymentPublicRouter };
