import { Router } from 'express';
import { BazarController } from './bazar.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/vendors', requirePermission('FINANCE_MANAGE'), BazarController.createVendor);
router.get('/vendors', BazarController.getVendors);
router.post('/purchases', requirePermission('FINANCE_MANAGE'), BazarController.recordPurchase);
router.get('/purchases', BazarController.getPurchases);
router.post('/pay-vendor', requirePermission('FINANCE_MANAGE'), BazarController.payVendor);
router.post('/meals', requirePermission('ADMIN'), BazarController.recordMeal);
router.get('/cost-per-meal', BazarController.getCostPerMeal);

export default router;
