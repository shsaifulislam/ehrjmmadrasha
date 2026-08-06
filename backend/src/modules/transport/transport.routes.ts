import { Router } from 'express';
import { TransportController } from './transport.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../shared/utils/asyncHandler';

const router = Router();

router.use(requireAuth);

router.get('/vehicles', asyncHandler(TransportController.getVehicles));
router.post('/vehicles', requirePermission('manage_transport'), asyncHandler(TransportController.createVehicle));

router.get('/routes', asyncHandler(TransportController.getRoutes));
router.post('/routes', requirePermission('manage_transport'), asyncHandler(TransportController.createRoute));

router.get('/assignments', asyncHandler(TransportController.getAssignments));
router.post('/assignments', requirePermission('manage_transport'), asyncHandler(TransportController.assignStudentTransport));

export default router;
