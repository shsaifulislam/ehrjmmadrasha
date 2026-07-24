import { Request, Response, NextFunction } from 'express';
import { PayrollService } from './payroll.service';
import { sendSuccess } from '../../shared/utils/response';

export class PayrollController {
  static async setSalaryStructure(req: Request, res: Response, next: NextFunction) {
    try {
      const structure = await PayrollService.setSalaryStructure(req.body);
      return sendSuccess(res, structure, 'স্যালারি স্ট্রাকচার সফলভাবে সংরক্ষণ হয়েছে', 201);
    } catch (error) {
      next(error);
    }
  }

  static async createAdvance(req: Request, res: Response, next: NextFunction) {
    try {
      const advance = await PayrollService.createStaffAdvance(req.body);
      return sendSuccess(res, advance, 'এডভান্স সফলভাবে রিকোয়েস্ট করা হয়েছে', 201);
    } catch (error) {
      next(error);
    }
  }

  static async generateMonthlyPayroll(req: Request, res: Response, next: NextFunction) {
    try {
      const { year, month } = req.body;
      const batch = await PayrollService.generateMonthlyPayroll(Number(year), Number(month));
      return sendSuccess(res, batch, 'মাসিক পে-রোল সফলভাবে জেনারেট করা হয়েছে', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getPayrollMonth(req: Request, res: Response, next: NextFunction) {
    try {
      const { year, month } = req.query;
      const batch = await PayrollService.getPayrollMonth(Number(year), Number(month));
      return sendSuccess(res, batch, 'Payroll month details retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async processPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const payment = await PayrollService.processSalaryPayment({
        ...req.body,
        paidById: user.id,
      });
      return sendSuccess(res, payment, 'বেতন পেমেন্ট সফলভাবে প্রসেস করা হয়েছে');
    } catch (error) {
      next(error);
    }
  }

  static async getPayslip(req: Request, res: Response, next: NextFunction) {
    try {
      const payslip = await PayrollService.getPayslip(req.params.id as string);
      return sendSuccess(res, payslip, 'Payslip retrieved');
    } catch (error) {
      next(error);
    }
  }
}
