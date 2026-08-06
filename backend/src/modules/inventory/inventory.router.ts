import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth.middleware';
import { validateBody } from '../../shared/middlewares/validate';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import {
  createCategorySchema,
  createItemSchema,
  recordStockMovementSchema,
  createFixedAssetSchema,
  recordMaintenanceSchema,
} from './inventory.schema';

const router = Router();

router.use(requireAuth);

router.post('/categories', requirePermission('ADMIN'), validateBody(createCategorySchema), asyncHandler(InventoryController.createCategory));
router.get('/categories', asyncHandler(InventoryController.getCategories));

router.post('/items', requirePermission('ADMIN'), validateBody(createItemSchema), asyncHandler(InventoryController.createItem));
router.get('/items', asyncHandler(InventoryController.getItems));

router.post('/movement', requirePermission('FINANCE_MANAGE'), validateBody(recordStockMovementSchema), asyncHandler(InventoryController.recordStockMovement));

router.post('/assets', requirePermission('FINANCE_MANAGE'), validateBody(createFixedAssetSchema), asyncHandler(InventoryController.createFixedAsset));
router.get('/assets', asyncHandler(InventoryController.getFixedAssets));

router.post('/maintenance', requirePermission('FINANCE_MANAGE'), validateBody(recordMaintenanceSchema), asyncHandler(InventoryController.recordMaintenance));

export default router;
