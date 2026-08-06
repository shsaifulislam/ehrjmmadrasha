import { Request, Response, NextFunction } from 'express';
import { Student360Service } from './student360.service';
import { sendSuccess } from '../../shared/utils/response';

export class Student360Controller {
  static async getStudent360(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const dossier = await Student360Service.getStudent360Dossier(id);
      return sendSuccess(res, dossier, 'Student 360 Digital Dossier retrieved');
    } catch (error) {
      next(error);
    }
  }
}
