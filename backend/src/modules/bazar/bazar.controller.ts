import { Request, Response, NextFunction } from 'express';
import { BazarService } from './bazar.service';
import { sendSuccess } from '../../shared/utils/response';

export class BazarController {
  static async createVendor(req: Request, res: Response, next: NextFunction) {
    try {
      const vendor = await BazarService.createVendor(req.body);
      return sendSuccess(res, vendor, 'সাপ্লায়ার / ভেন্ডর সফলভাবে যুক্ত হয়েছে', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getVendors(req: Request, res: Response, next: NextFunction) {
    try {
      const vendors = await BazarService.getVendors();
      return sendSuccess(res, vendors, 'Vendors retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async recordPurchase(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const purchase = await BazarService.recordBazarPurchase({
        ...req.body,
        createdById: user.id,
      });
      return sendSuccess(res, purchase, 'বাজারের এন্ট্রি সফলভাবে সংরক্ষিত ও লেজারে হিট হয়েছে', 201);
    } catch (error) {
      next(error);
    }
  }

  static async payVendor(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const payment = await BazarService.payVendorBalance({
        ...req.body,
        paidById: user.id,
      });
      return sendSuccess(res, payment, 'সাপ্লায়ার বাকি পরিশোধ সফলভাবে রেকর্ড ও লেজারে সিঙ্ক হয়েছে');
    } catch (error) {
      next(error);
    }
  }

  static async recordMeal(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const meal = await BazarService.recordMealAttendance({
        ...req.body,
        recordedById: user.id,
      });
      return sendSuccess(res, meal, 'মিল এটেন্ডেন্স সফলভাবে সংরক্ষিত হয়েছে', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getCostPerMeal(req: Request, res: Response, next: NextFunction) {
    try {
      const { year, month } = req.query;
      const stats = await BazarService.getCostPerMeal(Number(year), Number(month));
      return sendSuccess(res, stats, 'Cost per meal calculated');
    } catch (error) {
      next(error);
    }
  }

  static async getPurchases(req: Request, res: Response, next: NextFunction) {
    try {
      const purchases = await BazarService.getPurchases();
      return sendSuccess(res, purchases, 'Purchases retrieved');
    } catch (error) {
      next(error);
    }
  }
}
