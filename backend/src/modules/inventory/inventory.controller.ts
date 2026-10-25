import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service';
import { sendSuccess } from '../../shared/utils/response';

export class InventoryController {
  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await InventoryService.createCategory(req.body);
      return sendSuccess(res, category, 'ইনভেন্টরি ক্যাটাগরি তৈরি হয়েছে', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await InventoryService.getCategories();
      return sendSuccess(res, categories, 'Categories retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createItem(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await InventoryService.createItem(req.body);
      return sendSuccess(res, item, 'ইনভেন্টরি আইটেম সফলভাবে তৈরি হয়েছে', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getItems(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await InventoryService.getItems();
      return sendSuccess(res, items, 'Items retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async recordStockMovement(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const movement = await InventoryService.recordStockMovement({
        ...req.body,
        createdById: user.id,
      });
      return sendSuccess(res, movement, 'স্টক মুভমেন্ট সফলভাবে রেকর্ড ও লেজারে সিঙ্ক হয়েছে', 201);
    } catch (error) {
      next(error);
    }
  }

  static async createFixedAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const asset = await InventoryService.createFixedAsset({
        ...req.body,
        createdById: user.id,
      });
      return sendSuccess(res, asset, 'স্থায়ী সম্পদ সফলভাবে রেকর্ড ও ক্যাপিটালাইজেশন লেজারে জমা হয়েছে', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getFixedAssets(req: Request, res: Response, next: NextFunction) {
    try {
      const assets = await InventoryService.getFixedAssets();
      return sendSuccess(res, assets, 'Assets retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async recordMaintenance(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const maint = await InventoryService.recordAssetMaintenance({
        ...req.body,
        createdById: user.id,
      });
      return sendSuccess(res, maint, 'সম্পদ মেন্টেন্যান্স খরচ সফলভাবে রেকর্ড ও লেজারে পোস্ট হয়েছে', 201);
    } catch (error) {
      next(error);
    }
  }
}
