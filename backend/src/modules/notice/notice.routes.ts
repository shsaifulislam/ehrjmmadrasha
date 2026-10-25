// backend/src/modules/notice/notice.routes.ts

import { Router } from 'express';
import { noticeController } from './notice.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth.middleware';
import { uploadMiddleware } from '../../shared/middlewares/upload';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { validateParams } from '../../shared/middlewares/validate';
import { uuidParamSchema } from '../../shared/validations/common.schema';

const adminRouter = Router();
const publicRouter = Router();
const ctrl = noticeController;

// ─── ADMIN ROUTES ───────────────────────────────────
adminRouter.use(requireAuth);

adminRouter.get('/', requirePermission('manage_settings'), asyncHandler(ctrl.getAdminNotices.bind(ctrl)));
adminRouter.post('/', requirePermission('manage_settings'), uploadMiddleware.single('attachment'), asyncHandler(ctrl.createNotice.bind(ctrl)));
adminRouter.put('/:id', requirePermission('manage_settings'), validateParams(uuidParamSchema), uploadMiddleware.single('attachment'), asyncHandler(ctrl.updateNotice.bind(ctrl)));
adminRouter.delete('/:id', requirePermission('manage_settings'), validateParams(uuidParamSchema), asyncHandler(ctrl.deleteNotice.bind(ctrl)));

// ─── PUBLIC ROUTES ──────────────────────────────────
publicRouter.get('/', asyncHandler(ctrl.getPublicNotices.bind(ctrl)));

export { adminRouter as noticeAdminRouter, publicRouter as noticePublicRouter };
