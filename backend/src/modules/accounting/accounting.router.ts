import { Router } from 'express';
import { AccountingController } from './accounting.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth.middleware';
import { validateBody } from '../../shared/middlewares/validate';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import {
  createAccountSchema,
  createJournalEntrySchema,
  closeCashbookSchema,
} from './accounting.schema';

const router = Router();

// Protect all accounting routes for ADMIN or users with FINANCE_MANAGE permission
router.use(requireAuth);
router.use(requirePermission('FINANCE_MANAGE'));

router.get('/chart-of-accounts', asyncHandler(AccountingController.getChartOfAccounts));
router.post('/accounts', validateBody(createAccountSchema), asyncHandler(AccountingController.createAccount));
router.post('/journal-entry', validateBody(createJournalEntrySchema), asyncHandler(AccountingController.createJournalEntry));
router.get('/ledger', asyncHandler(AccountingController.getGeneralLedger));
router.get('/cashbook', asyncHandler(AccountingController.getCashbook));
router.post('/cashbook/close', validateBody(closeCashbookSchema), asyncHandler(AccountingController.closeCashbook));

// Financial Reports Endpoints (Part A)
router.get('/reports/trial-balance', asyncHandler(AccountingController.getTrialBalance));
router.get('/reports/income-statement', asyncHandler(AccountingController.getIncomeStatement));
router.get('/reports/balance-sheet', asyncHandler(AccountingController.getBalanceSheet));

export default router;
