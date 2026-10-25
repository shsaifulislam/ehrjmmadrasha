import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { logAudit } from '../utils/auditLogger';

export const createFeeType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, defaultAmount } = req.body;
    
    const feeType = await prisma.feeType.create({
      data: { name, defaultAmount }
    });

    await logAudit(req.user.id, 'CREATE_FEE_TYPE', `FeeType ${feeType.name}`);
    res.status(201).json({ status: 'success', data: { feeType } });
  } catch (error) { next(error); }
};

export const getFeeTypes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const feeTypes = await prisma.feeType.findMany({ where: { isDeleted: false } });
    res.status(200).json({ status: 'success', data: { feeTypes } });
  } catch (error) { next(error); }
};

export const getFeeTypeById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const feeType = await prisma.feeType.findFirst({
      where: { id: req.params.id as string, isDeleted: false }
    });

    if (!feeType) return next(new AppError('Fee Type not found', 404));

    res.status(200).json({ status: 'success', data: { feeType } });
  } catch (error) { next(error); }
};

export const updateFeeType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, defaultAmount } = req.body;
    
    const feeType = await prisma.feeType.update({
      where: { id: req.params.id as string },
      data: { name, defaultAmount }
    });

    await logAudit(req.user.id, 'UPDATE_FEE_TYPE', `FeeType ${feeType.name}`);
    res.status(200).json({ status: 'success', data: { feeType } });
  } catch (error) { next(error); }
};

export const deleteFeeType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for active invoice items
    const invoiceItemsCount = await prisma.invoiceItem.count({
      where: { feeTypeId: req.params.id as string }
    });

    if (invoiceItemsCount > 0) {
       // We can soft delete even if there are invoice items because historical invoices shouldn't be affected
       const feeType = await prisma.feeType.update({
         where: { id: req.params.id as string },
         data: { isDeleted: true }
       });
       await logAudit(req.user.id, 'SOFT_DELETE_FEE_TYPE', `FeeType ${feeType.name}`);
       return res.status(204).json({ status: 'success', data: null });
    }

    // Hard delete if no dependencies
    const feeType = await prisma.feeType.delete({
      where: { id: req.params.id as string }
    });
    
    await logAudit(req.user.id, 'DELETE_FEE_TYPE', `FeeType ${feeType.name}`);
    res.status(204).json({ status: 'success', data: null });
  } catch (error) { next(error); }
};
