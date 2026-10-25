import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);
router.get('/stats', requirePermission('view_dashboard'), getDashboardStats);

export default router;
