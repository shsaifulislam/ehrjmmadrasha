import { Router } from 'express';
import { StaffController } from './staff.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth.middleware';
import { validateBody, validateParams } from '../../shared/middlewares/validate';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { uuidParamSchema } from '../../shared/validations/common.schema';
import { createStaffSchema } from './staff.schema';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(StaffController.getStaffList));
router.post('/', requirePermission('ADMIN'), validateBody(createStaffSchema), asyncHandler(StaffController.createStaff));
router.get('/:id', validateParams(uuidParamSchema), asyncHandler(StaffController.getStaffById));

export default router;
