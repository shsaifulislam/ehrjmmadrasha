// backend/src/modules/feeType/feeType.controller.ts

import { Request, Response } from 'express';
import { feeTypeService } from './feeType.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../shared/utils/response';
import { AuthenticatedRequest } from '../../shared/types';

export class FeeTypeController {
  async getAll(_req: Request, res: Response): Promise<void> {
    const feeTypes = await feeTypeService.findAll();
    sendSuccess(res, feeTypes, 'ফি টাইপ তালিকা');
  }

  async getById(req: Request, res: Response): Promise<void> {
    const feeType = await feeTypeService.findById(req.params.id as string);
    sendSuccess(res, feeType);
  }

  async create(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const feeType = await feeTypeService.create(req.body, authReq.user.id);
    sendCreated(res, feeType, 'ফি টাইপ সফলভাবে তৈরি হয়েছে');
  }

  async update(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const feeType = await feeTypeService.update(req.params.id as string, req.body, authReq.user.id);
    sendSuccess(res, feeType, 'ফি টাইপ সফলভাবে আপডেট হয়েছে');
  }

  async delete(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    await feeTypeService.delete(req.params.id as string, authReq.user.id);
    sendNoContent(res);
  }
}

export const feeTypeController = new FeeTypeController();

