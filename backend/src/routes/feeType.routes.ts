import { Router } from 'express';
import { createFeeType, getFeeTypes, getFeeTypeById, updateFeeType, deleteFeeType } from '../controllers/feeType.controller';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createFeeTypeSchema, updateFeeTypeSchema } from '../validations/finance.validation';

const router = Router();

router.use(requireAuth);
router.use(requirePermission('manage_finance'));

router.get('/', getFeeTypes);
router.get('/:id', getFeeTypeById);
router.post('/', validate(createFeeTypeSchema), createFeeType);
router.put('/:id', validate(updateFeeTypeSchema), updateFeeType);
router.delete('/:id', deleteFeeType);

export default router;
