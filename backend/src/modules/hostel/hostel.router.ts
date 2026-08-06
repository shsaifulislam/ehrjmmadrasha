import { Router } from 'express';
import { HostelController } from './hostel.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth.middleware';
import { validateBody } from '../../shared/middlewares/validate';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import {
  createBuildingSchema,
  createRoomSchema,
  allocateBedSchema,
  collectHostelFeeSchema,
} from './hostel.schema';

const router = Router();

router.use(requireAuth);

router.post('/buildings', requirePermission('ADMIN'), validateBody(createBuildingSchema), asyncHandler(HostelController.createBuilding));
router.get('/buildings', asyncHandler(HostelController.getBuildings));
router.post('/rooms', requirePermission('ADMIN'), validateBody(createRoomSchema), asyncHandler(HostelController.createRoom));
router.post('/allocate', requirePermission('ADMIN'), validateBody(allocateBedSchema), asyncHandler(HostelController.allocateBed));
router.post('/collect-fee', requirePermission('FINANCE_MANAGE'), validateBody(collectHostelFeeSchema), asyncHandler(HostelController.collectFee));

export default router;
