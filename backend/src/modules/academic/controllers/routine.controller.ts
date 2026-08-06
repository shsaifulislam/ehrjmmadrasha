import { Request, Response, NextFunction } from "express";
import { RoutineAssignmentService } from "../services/RoutineAssignmentService";

export class RoutineController {
  static async assignSlot(req: Request, res: Response, next: NextFunction) {
    try {
      const { classId, subjectId, teacherId, dayOfWeek, startTime, endTime, roomNo } = req.body;
      const routine = await RoutineAssignmentService.assignRoutineSlot({
        classId,
        subjectId,
        teacherId,
        dayOfWeek,
        startTime,
        endTime,
        roomNo,
      });
      res.status(201).json({
        success: true,
        message: "ক্লাস সময়সূচী সফলভাবে যুক্ত করা হয়েছে",
        data: routine,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getClassRoutine(req: Request, res: Response, next: NextFunction) {
    try {
      const classId = String(req.params.classId);
      const routines = await RoutineAssignmentService.getClassRoutineGrid(classId);
      res.status(200).json({
        success: true,
        data: routines,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteSlot(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      await RoutineAssignmentService.removeRoutineSlot(id);
      res.status(200).json({
        success: true,
        message: "সময়সূচী স্লট মুছে ফেলা হয়েছে",
      });
    } catch (error) {
      next(error);
    }
  }
}
