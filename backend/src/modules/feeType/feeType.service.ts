// backend/src/modules/feeType/feeType.service.ts

import prisma from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logAudit } from '../../utils/auditLogger';
import { notDeleted } from '../../shared/types';
import type { CreateFeeTypeInput, UpdateFeeTypeInput } from './feeType.schema';

export class FeeTypeService {
  async findAll() {
    return prisma.feeType.findMany({ where: notDeleted, orderBy: { name: 'asc' } });
  }

  async findById(id: string) {
    const feeType = await prisma.feeType.findFirst({ where: { id, ...notDeleted } });
    if (!feeType) throw new AppError('ফি টাইপ পাওয়া যায়নি', 404);
    return feeType;
  }

  async create(input: CreateFeeTypeInput, actorId: string) {
    const feeType = await prisma.feeType.create({ data: { name: input.name, defaultAmount: input.defaultAmount } });
    await logAudit(actorId, 'CREATE_FEE_TYPE', 'feeType', `ফি টাইপ ${input.name} তৈরি`);
    return feeType;
  }

  async update(id: string, input: UpdateFeeTypeInput, actorId: string) {
    await this.findById(id);
    const feeType = await prisma.feeType.update({ where: { id }, data: input });
    await logAudit(actorId, 'UPDATE_FEE_TYPE', 'feeType', `ফি টাইপ ${feeType.name} আপডেট`);
    return feeType;
  }

  async delete(id: string, actorId: string) {
    const feeType = await this.findById(id);
    const hasItems = await prisma.invoiceItem.count({ where: { feeTypeId: id } });

    if (hasItems > 0) {
      await prisma.feeType.update({ where: { id }, data: { isDeleted: true } });
    } else {
      await prisma.feeType.delete({ where: { id } });
    }

    await logAudit(actorId, 'DELETE_FEE_TYPE', 'feeType', `ফি টাইপ ${feeType.name} মুছে ফেলা`);
  }
}

export const feeTypeService = new FeeTypeService();
