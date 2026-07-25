import { Request, Response, NextFunction } from 'express';
import { HostelService } from './hostel.service';
import { sendSuccess } from '../../shared/utils/response';

export class HostelController {
  static async createBuilding(req: Request, res: Response, next: NextFunction) {
    try {
      const building = await HostelService.createBuilding(req.body);
      return sendSuccess(res, building, 'হোস্টেল বিল্ডিং সফলভাবে তৈরি হয়েছে', 201);
    } catch (error) {
      next(error);
    }
  }

  static async createRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const room = await HostelService.createRoom(req.body);
      return sendSuccess(res, room, 'হোস্টেল রুম ও সিট তৈরি হয়েছে', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getBuildings(req: Request, res: Response, next: NextFunction) {
    try {
      const buildings = await HostelService.getBuildings();
      return sendSuccess(res, buildings, 'Hostel buildings retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async allocateBed(req: Request, res: Response, next: NextFunction) {
    try {
      const allocation = await HostelService.allocateBed(req.body);
      return sendSuccess(res, allocation, 'ছাত্রের হোস্টেল সিট সফলভাবে বরাদ্দ করা হয়েছে', 201);
    } catch (error) {
      next(error);
    }
  }

  static async collectFee(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const resData = await HostelService.collectHostelFee({
        ...req.body,
        paidById: user.id,
      });
      return sendSuccess(res, resData, 'হোস্টেল ফি সফলভাবে সংগ্রহ করা হয়েছে এবং লেজারে জমা হয়েছে');
    } catch (error) {
      next(error);
    }
  }
}
