import { Router } from 'express';
import { StaffController } from './staff.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', StaffController.getStaffList);
router.post('/', requirePermission('ADMIN'), StaffController.createStaff);
router.get('/:id', StaffController.getStaffById);

export default router;
