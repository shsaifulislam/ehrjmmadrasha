import { Router } from 'express';
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  collectFeePayment,
  getReceiptById,
  printReceipt
} from '../controllers/finance.controller';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createInvoiceSchema,
  collectPaymentSchema,
  invoiceQuerySchema
} from '../validations/finance.validation';

const router = Router();

router.use(requireAuth);
router.use(requirePermission('manage_finance'));

router.post('/invoices', validate(createInvoiceSchema), createInvoice);
router.get('/invoices', validate(invoiceQuerySchema), getInvoices);
router.get('/invoices/:id', getInvoiceById);

router.post('/collect', validate(collectPaymentSchema), collectFeePayment);

router.get('/receipts/:id', getReceiptById);
router.post('/receipts/:id/print', printReceipt);

export default router;
