// backend/src/modules/download/download.routes.ts

import { Router } from 'express';
import { downloadController } from './download.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth.middleware';
import { uploadMiddleware } from '../../shared/middlewares/upload';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { validateParams } from '../../shared/middlewares/validate';
import { uuidParamSchema } from '../../shared/validations/common.schema';

const adminRouter = Router();
const publicRouter = Router();
const ctrl = downloadController;

// ─── ADMIN ROUTES ───────────────────────────────────
adminRouter.use(requireAuth);

adminRouter.get('/', requirePermission('manage_settings'), asyncHandler(ctrl.getAdminDownloads.bind(ctrl)));
adminRouter.post('/', requirePermission('manage_settings'), uploadMiddleware.single('document'), asyncHandler(ctrl.createDownloadItem.bind(ctrl)));
adminRouter.delete('/:id', requirePermission('manage_settings'), validateParams(uuidParamSchema), asyncHandler(ctrl.deleteDownloadItem.bind(ctrl)));

// ─── PUBLIC ROUTES ──────────────────────────────────
publicRouter.get('/', asyncHandler(ctrl.getPublicDownloads.bind(ctrl)));

export { adminRouter as downloadAdminRouter, publicRouter as downloadPublicRouter };
