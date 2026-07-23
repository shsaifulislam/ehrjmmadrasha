// backend/src/modules/notification/notification.routes.ts

import { Router } from 'express';
import { notificationController } from './notification.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth.middleware';
import { validateQuery, validateBody, validateParams } from '../../shared/middlewares/validate';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { uuidParamSchema } from '../../shared/validations/common.schema';
import { sendBulkSmsSchema } from './notification.schema';

const router = Router();
const ctrl = notificationController;

router.use(requireAuth);

// GET /api/admin/notifications/logs
router.get('/logs', requirePermission('view_audit_logs'), asyncHandler(ctrl.getLogs.bind(ctrl)));

// POST /api/admin/notifications/bulk
router.post('/bulk', requirePermission('manage_settings'), validateBody(sendBulkSmsSchema), asyncHandler(ctrl.sendBulkSms.bind(ctrl)));

// POST /api/admin/notifications/:id/retry
router.post('/:id/retry', requirePermission('manage_settings'), validateParams(uuidParamSchema), asyncHandler(ctrl.retryNotification.bind(ctrl)));

export default router;
