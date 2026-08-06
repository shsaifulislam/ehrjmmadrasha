import { Request, Response, NextFunction } from 'express';
import { CertificateService } from './certificate.service';
import { sendSuccess } from '../../shared/utils/response';

export class CertificateController {
  static async issueCertificate(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const cert = await CertificateService.issueCertificate({
        ...req.body,
        issuedById: user.id,
      });
      return sendSuccess(res, cert, 'সার্টিফিকেট সফলভাবে জেনারেট করা হয়েছে', 201);
    } catch (error) {
      next(error);
    }
  }

  static async verifyCertificate(req: Request, res: Response, next: NextFunction) {
    try {
      const certificateNumber = req.params.certificateNumber as string;
      const verification = await CertificateService.verifyCertificate(certificateNumber);
      return sendSuccess(res, verification, 'Certificate verification result');
    } catch (error) {
      next(error);
    }
  }

  static async getStudentCertificates(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.params.studentId as string;
      const certs = await CertificateService.getStudentCertificates(studentId);
      return sendSuccess(res, certs, 'Certificates retrieved');
    } catch (error) {
      next(error);
    }
  }
}
