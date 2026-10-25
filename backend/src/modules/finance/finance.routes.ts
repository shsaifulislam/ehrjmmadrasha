// backend/src/modules/finance/finance.routes.ts

import { Router } from 'express';
import { financeController } from './finance.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth.middleware';
import { validateBody, validateParams } from '../../shared/middlewares/validate';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { createInvoiceSchema, collectPaymentSchema, createExpenseSchema, createDonationSchema } from './finance.schema';
import { uuidParamSchema } from '../../shared/validations/common.schema';

const router = Router();
const ctrl = financeController;

router.use(requireAuth);

// Invoices
router.get('/invoices', requirePermission('view_finance'), asyncHandler(ctrl.getInvoices.bind(ctrl)));
router.get('/invoices/:id', requirePermission('view_finance'), validateParams(uuidParamSchema), asyncHandler(ctrl.getInvoiceById.bind(ctrl)));
router.post('/invoices', requirePermission('manage_finance'), validateBody(createInvoiceSchema), asyncHandler(ctrl.createInvoice.bind(ctrl)));

// Payment
router.post('/collect', requirePermission('manage_finance'), validateBody(collectPaymentSchema), asyncHandler(ctrl.collectPayment.bind(ctrl)));

// Receipt
router.get('/receipts/:id', requirePermission('view_finance'), validateParams(uuidParamSchema), asyncHandler(ctrl.getReceiptById.bind(ctrl)));
router.post('/receipts/:id/print', requirePermission('view_finance'), validateParams(uuidParamSchema), asyncHandler(ctrl.printReceipt.bind(ctrl)));

// Expenses
router.get('/expenses', requirePermission('view_finance'), asyncHandler(ctrl.getExpenses.bind(ctrl)));
router.post('/expenses', requirePermission('manage_finance'), validateBody(createExpenseSchema), asyncHandler(ctrl.createExpense.bind(ctrl)));

// Donations
router.get('/donations', requirePermission('view_finance'), asyncHandler(ctrl.getDonations.bind(ctrl)));
router.post('/donations', requirePermission('manage_finance'), validateBody(createDonationSchema), asyncHandler(ctrl.createDonation.bind(ctrl)));

export default router;
