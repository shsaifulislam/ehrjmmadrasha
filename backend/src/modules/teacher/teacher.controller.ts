// backend/src/modules/teacher/teacher.controller.ts
// Teacher controller — thin layer

import { Request, Response } from 'express';
import { teacherService } from './teacher.service';
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from '../../shared/utils/response';
import { AuthenticatedRequest } from '../../shared/types';
import { PaginationQueryInput } from '../../shared/validations/common.schema';

export class TeacherController {
  async getAll(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as PaginationQueryInput;
    const result = await teacherService.findAll(query);
    sendPaginated(res, result.teachers, result.meta, 'শিক্ষক তালিকা');
  }

  async getById(req: Request, res: Response): Promise<void> {
    const teacher = await teacherService.findById(req.params.id as string);
    sendSuccess(res, teacher);
  }

  async create(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const teacher = await teacherService.create(req.body, authReq.user.id);
    sendCreated(res, teacher, 'শিক্ষক সফলভাবে তৈরি হয়েছে');
  }

  async update(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const teacher = await teacherService.update(req.params.id as string, req.body, authReq.user.id);
    sendSuccess(res, teacher, 'শিক্ষক সফলভাবে আপডেট হয়েছে');
  }

  async delete(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    await teacherService.delete(req.params.id as string, authReq.user.id);
    sendNoContent(res);
  }
}

export const teacherController = new TeacherController();

