// backend/src/modules/dashboard/dashboard.routes.ts

import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../shared/utils/asyncHandler';

const router = Router();

router.use(requireAuth);
router.get('/stats', requirePermission('view_dashboard'), asyncHandler(dashboardController.getStats.bind(dashboardController)));

export default router;
