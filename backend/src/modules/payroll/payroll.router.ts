import { Router } from 'express';
import { PayrollController } from './payroll.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/structure', requirePermission('FINANCE_MANAGE'), PayrollController.setSalaryStructure);
router.post('/advance', requirePermission('FINANCE_MANAGE'), PayrollController.createAdvance);
router.post('/generate', requirePermission('FINANCE_MANAGE'), PayrollController.generateMonthlyPayroll);
router.get('/month', requirePermission('FINANCE_MANAGE'), PayrollController.getPayrollMonth);
router.post('/pay', requirePermission('FINANCE_MANAGE'), PayrollController.processPayment);
router.get('/payslip/:id', requirePermission('FINANCE_MANAGE'), PayrollController.getPayslip);

export default router;
