import { Router } from 'express';
import { CertificateController } from './certificate.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth.middleware';
import { validateBody } from '../../shared/middlewares/validate';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { issueCertificateSchema } from './certificate.schema';

const router = Router();

// PUBLIC QR VERIFICATION ROUTE (No authentication required!)
router.get('/public/verify/:certificateNumber', asyncHandler(CertificateController.verifyCertificate));

// Protected Routes
router.use(requireAuth);
router.post('/issue', requirePermission('ADMIN'), validateBody(issueCertificateSchema), asyncHandler(CertificateController.issueCertificate));
router.get('/student/:studentId', asyncHandler(CertificateController.getStudentCertificates));

export default router;
