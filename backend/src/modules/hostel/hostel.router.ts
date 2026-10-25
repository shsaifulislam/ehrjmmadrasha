import { Router } from 'express';
import { HostelController } from './hostel.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/buildings', requirePermission('ADMIN'), HostelController.createBuilding);
router.get('/buildings', HostelController.getBuildings);
router.post('/rooms', requirePermission('ADMIN'), HostelController.createRoom);
router.post('/allocate', requirePermission('ADMIN'), HostelController.allocateBed);
router.post('/collect-fee', requirePermission('FINANCE_MANAGE'), HostelController.collectFee);

export default router;
