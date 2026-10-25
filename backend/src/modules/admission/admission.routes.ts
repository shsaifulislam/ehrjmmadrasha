// backend/src/modules/admission/admission.routes.ts

import { Router } from 'express';
import { admissionController } from './admission.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth.middleware';
import { uploadMiddleware } from '../../shared/middlewares/upload';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { validateBody, validateParams } from '../../shared/middlewares/validate';
import { uuidParamSchema } from '../../shared/validations/common.schema';
import { submitAdmissionSchema, rejectAdmissionSchema } from './admission.schema';

const adminRouter = Router();
const publicRouter = Router();
const ctrl = admissionController;

// ─── ADMIN ROUTES ───────────────────────────────────
adminRouter.use(requireAuth);

adminRouter.get('/', requirePermission('manage_students'), asyncHandler(ctrl.getAdmissionsQueue.bind(ctrl)));
adminRouter.post('/:id/approve', requirePermission('manage_students'), validateParams(uuidParamSchema), asyncHandler(ctrl.approveAdmission.bind(ctrl)));
adminRouter.post('/:id/reject', requirePermission('manage_students'), validateParams(uuidParamSchema), validateBody(rejectAdmissionSchema), asyncHandler(ctrl.rejectAdmission.bind(ctrl)));

// ─── PUBLIC ROUTES ──────────────────────────────────
publicRouter.post('/', uploadMiddleware.single('photo'), validateBody(submitAdmissionSchema), asyncHandler(ctrl.submitApplication.bind(ctrl)));
publicRouter.get('/verify/:token', asyncHandler(ctrl.verifyAdmission.bind(ctrl)));

export { adminRouter as admissionAdminRouter, publicRouter as admissionPublicRouter };
