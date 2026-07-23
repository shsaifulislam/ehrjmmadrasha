// backend/src/modules/admission/admission.controller.ts

import { Request, Response } from 'express';
import { admissionService } from './admission.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';
import { AuthenticatedRequest } from '../../shared/types';
import { AdmissionStatus } from '@prisma/client';

export class AdmissionController {
  async submitApplication(req: Request, res: Response): Promise<void> {
    let photoUrl = req.body.photoUrl;
    if (req.file) {
      photoUrl = `/uploads/images/${req.file.filename}`;
    }

    const result = await admissionService.submitApplication({ ...req.body, photoUrl });
    sendCreated(res, result, 'ভর্তি আবেদন সফলভাবে জমা নেয়া হয়েছে');
  }

  async verifyAdmission(req: Request, res: Response): Promise<void> {
    const { token } = req.params as { token: string };
    const result = await admissionService.getAdmissionByToken(token);
    sendSuccess(res, result, 'ভর্তি আবেদনের তথ্য');
  }

  async getAdmissionsQueue(req: Request, res: Response): Promise<void> {
    const { status, limit = '50', page = '1' } = req.query as { status?: AdmissionStatus; limit?: string; page?: string };
    const authReq = req as AuthenticatedRequest;
    
    const userPermissions: string[] = (authReq.user as any)?.permissions || [];
    const userRole: string = (authReq.user as any)?.role?.name || '';
    const hasSensitiveAccess = userPermissions.includes('view_sensitive_admission_data') || userRole === 'SUPER_ADMIN';

    if (hasSensitiveAccess) {
      // Audit log recording access to sensitive personal data (religion, guardianNid)
      const prisma = (await import('../../config/prisma')).default;
      await prisma.auditLog.create({
        data: {
          userId: authReq.user?.id || null,
          action: 'VIEW_SENSITIVE_ADMISSION_DATA',
          resource: 'Admission',
          details: `Sensitive admission data accessed by user ${authReq.user?.id || 'unknown'}`,
          ipAddress: req.ip || null,
        },
      }).catch(() => {});
    }

    const result = await admissionService.getAdmissionsQueue(status, parseInt(limit, 10), parseInt(page, 10), hasSensitiveAccess);
    sendSuccess(res, result, 'ভর্তি আবেদন কিউ তালিকা');
  }

  async approveAdmission(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const result = await admissionService.approveAdmission(id, authReq.user.id);
    sendSuccess(res, result, 'ভর্তি আবেদন অনুমোদিত হয়েছে');
  }

  async rejectAdmission(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { reason } = req.body as { reason: string };
    const result = await admissionService.rejectAdmission(id, reason, authReq.user.id);
    sendSuccess(res, result, 'ভর্তি আবেদন বাতিল করা হয়েছে');
  }
}

export const admissionController = new AdmissionController();
