// backend/src/modules/attendance/attendance.controller.ts

import { Request, Response } from 'express';
import { attendanceService } from './attendance.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';
import { AuthenticatedRequest } from '../../shared/types';

export class AttendanceController {
  async getAttendanceByClassAndDate(req: Request, res: Response): Promise<void> {
    const { classId, date } = req.query as { classId: string; date: string };
    const result = await attendanceService.getAttendanceByClassAndDate(classId, date);
    sendSuccess(res, result, 'উপস্থিতি তথ্য পাওয়া গেছে');
  }

  async bulkSaveAttendance(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const result = await attendanceService.bulkSaveAttendance(req.body, authReq.user.id);
    sendCreated(res, result, 'উপস্থিতি সফলভাবে সংরক্ষণ করা হয়েছে');
  }

  async getDailyReport(req: Request, res: Response): Promise<void> {
    const { classId, date } = req.query as { classId: string; date: string };
    const report = await attendanceService.getDailyReport(classId, date);
    sendSuccess(res, report, 'দৈনিক উপস্থিতি রিপোর্ট');
  }

  async getMonthlyReport(req: Request, res: Response): Promise<void> {
    const { classId, year, month } = req.query as { classId: string; year: string; month: string };
    const report = await attendanceService.getMonthlyReport(classId, parseInt(year, 10), parseInt(month, 10));
    sendSuccess(res, report, 'মাসিক উপস্থিতি রিপোর্ট');
  }
}

export const attendanceController = new AttendanceController();
