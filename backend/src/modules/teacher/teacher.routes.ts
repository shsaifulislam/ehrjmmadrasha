// backend/src/modules/teacher/teacher.routes.ts
// Teacher module routes

import { Router } from 'express';
import { teacherController } from './teacher.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth.middleware';
import { validateBody, validateQuery, validateParams } from '../../shared/middlewares/validate';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { createTeacherSchema, updateTeacherSchema } from './teacher.schema';
import { paginationQuerySchema, uuidParamSchema } from '../../shared/validations/common.schema';

const router = Router();

// All teacher routes require authentication
router.use(requireAuth);

router.get(
  '/',
  requirePermission('view_teachers'),
  validateQuery(paginationQuerySchema),
  asyncHandler(teacherController.getAll.bind(teacherController))
);

router.get(
  '/:id',
  requirePermission('view_teachers'),
  validateParams(uuidParamSchema),
  asyncHandler(teacherController.getById.bind(teacherController))
);

router.post(
  '/',
  requirePermission('manage_teachers'),
  validateBody(createTeacherSchema),
  asyncHandler(teacherController.create.bind(teacherController))
);

router.put(
  '/:id',
  requirePermission('manage_teachers'),
  validateParams(uuidParamSchema),
  validateBody(updateTeacherSchema),
  asyncHandler(teacherController.update.bind(teacherController))
);

router.delete(
  '/:id',
  requirePermission('manage_teachers'),
  validateParams(uuidParamSchema),
  asyncHandler(teacherController.delete.bind(teacherController))
);

export default router;
