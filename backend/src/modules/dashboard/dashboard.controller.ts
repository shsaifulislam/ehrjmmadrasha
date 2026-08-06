// backend/src/modules/dashboard/dashboard.controller.ts

import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';
import { sendSuccess } from '../../shared/utils/response';

const dashboardService = new DashboardService();

export class DashboardController {
  async getStats(_req: Request, res: Response): Promise<void> {
    const stats = await dashboardService.getStats();
    sendSuccess(res, stats, 'ড্যাশবোর্ড পরিসংখ্যান');
  }
}

export const dashboardController = new DashboardController();
