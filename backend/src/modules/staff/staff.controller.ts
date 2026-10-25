import { Request, Response, NextFunction } from 'express';
import { StaffService } from './staff.service';
import { sendSuccess } from '../../shared/utils/response';

export class StaffController {
  static async getStaffList(req: Request, res: Response, next: NextFunction) {
    try {
      const staffList = await StaffService.getStaffList(req.query as any);
      return sendSuccess(res, staffList, 'Staff list retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async createStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const staff = await StaffService.createStaff(req.body);
      return sendSuccess(res, staff, 'নতুন কর্মচারী সফলভাবে যুক্ত করা হয়েছে', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getStaffById(req: Request, res: Response, next: NextFunction) {
    try {
      const staff = await StaffService.getStaffById(req.params.id as string);
      return sendSuccess(res, staff, 'Staff details retrieved');
    } catch (error) {
      next(error);
    }
  }
}
