import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/categories', requirePermission('ADMIN'), InventoryController.createCategory);
router.get('/categories', InventoryController.getCategories);

router.post('/items', requirePermission('ADMIN'), InventoryController.createItem);
router.get('/items', InventoryController.getItems);

router.post('/movement', requirePermission('FINANCE_MANAGE'), InventoryController.recordStockMovement);

router.post('/assets', requirePermission('FINANCE_MANAGE'), InventoryController.createFixedAsset);
router.get('/assets', InventoryController.getFixedAssets);

router.post('/maintenance', requirePermission('FINANCE_MANAGE'), InventoryController.recordMaintenance);

export default router;
