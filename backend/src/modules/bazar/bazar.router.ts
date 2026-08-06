import { Router } from 'express';
import { BazarController } from './bazar.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth.middleware';
import { validateBody } from '../../shared/middlewares/validate';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import {
  createVendorSchema,
  recordPurchaseSchema,
  payVendorSchema,
  recordMealSchema,
} from './bazar.schema';

const router = Router();

router.use(requireAuth);

router.post('/vendors', requirePermission('FINANCE_MANAGE'), validateBody(createVendorSchema), asyncHandler(BazarController.createVendor));
router.get('/vendors', asyncHandler(BazarController.getVendors));
router.post('/purchases', requirePermission('FINANCE_MANAGE'), validateBody(recordPurchaseSchema), asyncHandler(BazarController.recordPurchase));
router.get('/purchases', asyncHandler(BazarController.getPurchases));
router.post('/pay-vendor', requirePermission('FINANCE_MANAGE'), validateBody(payVendorSchema), asyncHandler(BazarController.payVendor));
router.post('/meals', requirePermission('ADMIN'), validateBody(recordMealSchema), asyncHandler(BazarController.recordMeal));
router.get('/cost-per-meal', asyncHandler(BazarController.getCostPerMeal));

export default router;
