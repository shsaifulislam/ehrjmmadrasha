import { Request, Response, NextFunction } from "express";
import { GuardianService } from "../services/GuardianService";
import { Guardian360Service } from "../services/Guardian360Service";
import { createGuardianSchema, updateGuardianSchema, linkWardSchema } from "../guardian.schema";

export class GuardianController {
  static async createGuardian(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createGuardianSchema.parse(req.body);
      const guardian = await GuardianService.createGuardian(validatedData);
      res.status(201).json({
        success: true,
        message: "অভিভাবকের তথ্য সফলভাবে সংরক্ষণ করা হয়েছে",
        data: guardian,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listGuardians(req: Request, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const result = await GuardianService.listGuardians({ search, page, limit });
      res.status(200).json({
        success: true,
        data: result.guardians,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getGuardianById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const guardian = await GuardianService.getGuardianById(id);
      res.status(200).json({
        success: true,
        data: guardian,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getGuardian360(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const profile360 = await Guardian360Service.getGuardianFull360Profile(id);
      res.status(200).json({
        success: true,
        data: profile360,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateGuardian(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const validatedData = updateGuardianSchema.parse(req.body);
      const updated = await GuardianService.updateGuardian(id, validatedData);
      res.status(200).json({
        success: true,
        message: "অভিভাবকের তথ্য হালনাগাদ করা হয়েছে",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async linkWard(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const validatedData = linkWardSchema.parse(req.body);
      const updatedStudent = await GuardianService.linkWardToGuardian(id, validatedData.studentId);
      res.status(200).json({
        success: true,
        message: "শিক্ষার্থীকে সফলভাবে অভিভাবকের সাথে সংযুক্ত করা হয়েছে",
        data: updatedStudent,
      });
    } catch (error) {
      next(error);
    }
  }

  static async unlinkWard(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = String(req.params.studentId);
      const updatedStudent = await GuardianService.unlinkWardFromGuardian(studentId);
      res.status(200).json({
        success: true,
        message: "শিক্ষার্থীকে অভিভাবক সংযোগ থেকে বিচ্ছিন্ন করা হয়েছে",
        data: updatedStudent,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteGuardian(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      await GuardianService.deleteGuardian(id);
      res.status(200).json({
        success: true,
        message: "অভিভাবকের রেকর্ড মুছে ফেলা হয়েছে",
      });
    } catch (error) {
      next(error);
    }
  }
}
