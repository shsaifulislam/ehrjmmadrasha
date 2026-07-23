// backend/src/modules/gallery/gallery.routes.ts

import { Router } from 'express';
import { galleryController } from './gallery.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth.middleware';
import { uploadMiddleware } from '../../shared/middlewares/upload';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { validateParams } from '../../shared/middlewares/validate';
import { uuidParamSchema } from '../../shared/validations/common.schema';

const adminRouter = Router();
const publicRouter = Router();
const ctrl = galleryController;

// ─── ADMIN ROUTES ───────────────────────────────────
adminRouter.use(requireAuth);

adminRouter.get('/', requirePermission('manage_settings'), asyncHandler(ctrl.getAdminGallery.bind(ctrl)));
adminRouter.post('/', requirePermission('manage_settings'), uploadMiddleware.single('image'), asyncHandler(ctrl.createGalleryItem.bind(ctrl)));
adminRouter.delete('/:id', requirePermission('manage_settings'), validateParams(uuidParamSchema), asyncHandler(ctrl.deleteGalleryItem.bind(ctrl)));

// ─── PUBLIC ROUTES ──────────────────────────────────
publicRouter.get('/', asyncHandler(ctrl.getPublicGallery.bind(ctrl)));

export { adminRouter as galleryAdminRouter, publicRouter as galleryPublicRouter };
