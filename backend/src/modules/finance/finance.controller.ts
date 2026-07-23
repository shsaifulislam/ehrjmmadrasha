// backend/src/modules/finance/finance.controller.ts

import { Request, Response } from 'express';
import { financeService } from './finance.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../shared/utils/response';
import { AuthenticatedRequest, PaginationQuery } from '../../shared/types';

export class FinanceController {
  // ─── Invoices ──────────────────────────────────────
  async createInvoice(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const invoice = await financeService.createInvoice(req.body, authReq.user.id);
    sendCreated(res, invoice, 'ইনভয়েস সফলভাবে তৈরি হয়েছে');
  }

  async getInvoices(req: Request, res: Response): Promise<void> {
    const query = req.query as any;
    const result = await financeService.findAllInvoices(query);
    sendPaginated(res, result.invoices, result.meta, 'ইনভয়েস তালিকা');
  }

  async getInvoiceById(req: Request, res: Response): Promise<void> {
    const invoice = await financeService.findInvoiceById(req.params.id as string);
    sendSuccess(res, invoice);
  }

  // ─── Payment ───────────────────────────────────────
  async collectPayment(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const result = await financeService.collectPayment(req.body, authReq.user.id);
    sendSuccess(res, { receiptNumber: result.receipt.receiptNumber, receiptId: result.receipt.id, newStatus: result.newStatus }, 'ফি সফলভাবে আদায় হয়েছে');
  }

  // ─── Receipt ───────────────────────────────────────
  async getReceiptById(req: Request, res: Response): Promise<void> {
    const receipt = await financeService.findReceiptById(req.params.id as string);
    sendSuccess(res, receipt);
  }

  async printReceipt(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const receipt = await financeService.printReceipt(req.params.id as string, authReq.user.id);
    sendSuccess(res, receipt, 'রশিদ প্রিন্ট হয়েছে');
  }

  // ─── Expense ───────────────────────────────────────
  async getExpenses(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as PaginationQuery;
    const result = await financeService.findAllExpenses(query);
    sendPaginated(res, result.expenses, result.meta, 'খরচ তালিকা');
  }

  async createExpense(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const expense = await financeService.createExpense(req.body, authReq.user.id);
    sendCreated(res, expense, 'খরচ সফলভাবে যোগ হয়েছে');
  }

  // ─── Donation ──────────────────────────────────────
  async getDonations(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as PaginationQuery;
    const result = await financeService.findAllDonations(query);
    sendPaginated(res, result.donations, result.meta, 'দান তালিকা');
  }

  async createDonation(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;
    const result = await financeService.createDonation(req.body, authReq.user.id);
    sendCreated(res, result, 'দান সফলভাবে গ্রহণ হয়েছে');
  }
}

export const financeController = new FinanceController();

