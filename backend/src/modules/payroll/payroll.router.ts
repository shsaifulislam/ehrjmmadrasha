import { Router } from 'express';
import { PayrollController } from './payroll.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth.middleware';
import { validateBody, validateParams } from '../../shared/middlewares/validate';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { uuidParamSchema } from '../../shared/validations/common.schema';
import {
  setSalaryStructureSchema,
  createAdvanceSchema,
  generatePayrollSchema,
  approvePayrollSchema,
  processPaymentSchema,
} from './payroll.schema';

const router = Router();

router.use(requireAuth);

router.post('/structure', requirePermission('FINANCE_MANAGE'), validateBody(setSalaryStructureSchema), asyncHandler(PayrollController.setSalaryStructure));
router.post('/advance', requirePermission('FINANCE_MANAGE'), validateBody(createAdvanceSchema), asyncHandler(PayrollController.createAdvance));
router.post('/generate', requirePermission('FINANCE_MANAGE'), validateBody(generatePayrollSchema), asyncHandler(PayrollController.generateMonthlyPayroll));
router.post('/approve', requirePermission('FINANCE_MANAGE'), validateBody(approvePayrollSchema), asyncHandler(PayrollController.approvePayroll));
router.get('/month', requirePermission('FINANCE_MANAGE'), asyncHandler(PayrollController.getPayrollMonth));
router.post('/pay', requirePermission('FINANCE_MANAGE'), validateBody(processPaymentSchema), asyncHandler(PayrollController.processPayment));
router.get('/payslip/:id', requirePermission('FINANCE_MANAGE'), validateParams(uuidParamSchema), asyncHandler(PayrollController.getPayslip));

export default router;
