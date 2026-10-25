// backend/src/modules/feeType/feeType.routes.ts

import { Router } from 'express';
import { feeTypeController } from './feeType.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth.middleware';
import { validateBody, validateParams } from '../../shared/middlewares/validate';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { createFeeTypeSchema, updateFeeTypeSchema } from './feeType.schema';
import { uuidParamSchema } from '../../shared/validations/common.schema';

const router = Router();
const ctrl = feeTypeController;

router.use(requireAuth);

router.get('/', requirePermission('view_finance'), asyncHandler(ctrl.getAll.bind(ctrl)));
router.get('/:id', requirePermission('view_finance'), validateParams(uuidParamSchema), asyncHandler(ctrl.getById.bind(ctrl)));
router.post('/', requirePermission('manage_finance'), validateBody(createFeeTypeSchema), asyncHandler(ctrl.create.bind(ctrl)));
router.put('/:id', requirePermission('manage_finance'), validateParams(uuidParamSchema), validateBody(updateFeeTypeSchema), asyncHandler(ctrl.update.bind(ctrl)));
router.delete('/:id', requirePermission('manage_finance'), validateParams(uuidParamSchema), asyncHandler(ctrl.delete.bind(ctrl)));

export default router;
