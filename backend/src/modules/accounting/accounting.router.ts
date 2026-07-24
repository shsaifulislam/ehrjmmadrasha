import { Router } from 'express';
import { AccountingController } from './accounting.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth.middleware';

const router = Router();

// Protect all accounting routes for ADMIN or users with FINANCE_MANAGE permission
router.use(requireAuth);
router.use(requirePermission('FINANCE_MANAGE'));

router.get('/chart-of-accounts', AccountingController.getChartOfAccounts);
router.post('/accounts', AccountingController.createAccount);
router.post('/journal-entry', AccountingController.createJournalEntry);
router.get('/ledger', AccountingController.getGeneralLedger);
router.get('/cashbook', AccountingController.getCashbook);
router.post('/cashbook/close', AccountingController.closeCashbook);

export default router;
