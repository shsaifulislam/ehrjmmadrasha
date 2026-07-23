// backend/src/modules/dashboard/dashboard.controller.ts

import { Request, Response } from 'express';
import { dashboardService } from './dashboard.service';
import { sendSuccess } from '../../shared/utils/response';

export class DashboardController {
  async getStats(_req: Request, res: Response): Promise<void> {
    const stats = await dashboardService.getStats();
    sendSuccess(res, stats, 'ড্যাশবোর্ড পরিসংখ্যান');
  }
}

export const dashboardController = new DashboardController();
