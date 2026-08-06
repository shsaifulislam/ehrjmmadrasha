import { Request, Response, NextFunction } from 'express';
import { AccountingService } from './accounting.service';
import { sendSuccess } from '../../shared/utils/response';

export class AccountingController {
  static async getChartOfAccounts(req: Request, res: Response, next: NextFunction) {
    try {
      const accounts = await AccountingService.getChartOfAccounts();
      return sendSuccess(res, accounts, 'Chart of accounts retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const account = await AccountingService.createAccount(req.body);
      return sendSuccess(res, account, 'নতুন অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে', 201);
    } catch (error) {
      next(error);
    }
  }

  static async createJournalEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const entry = await AccountingService.createJournalEntry({
        ...req.body,
        createdById: user.id,
      });
      return sendSuccess(res, entry, 'জার্নাল এন্ট্রি সফলভাবে সংরক্ষণ হয়েছে', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getGeneralLedger(req: Request, res: Response, next: NextFunction) {
    try {
      const entries = await AccountingService.getGeneralLedger(req.query as any);
      return sendSuccess(res, entries, 'General ledger retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getCashbook(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await AccountingService.getDailyCashbook(req.query.date as string);
      return sendSuccess(res, summary, 'Daily cashbook retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async closeCashbook(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const closing = await AccountingService.closeDailyCashbook({
        ...req.body,
        closedById: user.id,
      });
      return sendSuccess(res, closing, 'দৈনিক ক্যাশ ক্লোজিং সম্পন্ন হয়েছে');
    } catch (error) {
      next(error);
    }
  }

  static async getTrialBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await AccountingService.getTrialBalance(req.query as any);
      return sendSuccess(res, report, 'রেওয়ামিল (Trial Balance) রিপোর্ট তৈরি হয়েছে');
    } catch (error) {
      next(error);
    }
  }

  static async getIncomeStatement(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await AccountingService.getIncomeStatement(req.query as any);
      return sendSuccess(res, report, 'আয়-ব্যয় বিবরণী (Income Statement) তৈরি হয়েছে');
    } catch (error) {
      next(error);
    }
  }

  static async getBalanceSheet(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await AccountingService.getBalanceSheet(req.query as any);
      return sendSuccess(res, report, 'উদ্বৃত্তপত্র (Balance Sheet) তৈরি হয়েছে');
    } catch (error) {
      next(error);
    }
  }
}
