import prisma from '../../config/prisma';
import { AccountingService } from '../accounting/accounting.service';

export class PayrollService {
  // 1. Salary Structure Setup
  static async setSalaryStructure(data: {
    teacherId?: string;
    staffId?: string;
    basicSalary: number;
    houseRent?: number;
    medicalAllowance?: number;
    foodAllowance?: number;
    transportAllowance?: number;
    otherAllowance?: number;
  }) {
    if (!data.teacherId && !data.staffId) {
      throw new Error('শিক্ষক অথবা কর্মচারীর আইডি প্রদান করতে হবে');
    }

    const basic = Number(data.basicSalary);
    const house = Number(data.houseRent || 0);
    const medical = Number(data.medicalAllowance || 0);
    const food = Number(data.foodAllowance || 0);
    const transport = Number(data.transportAllowance || 0);
    const other = Number(data.otherAllowance || 0);

    const grossSalary = basic + house + medical + food + transport + other;

    if (data.teacherId) {
      return await prisma.staffSalaryStructure.upsert({
        where: { teacherId: data.teacherId },
        update: {
          basicSalary: basic,
          houseRent: house,
          medicalAllowance: medical,
          foodAllowance: food,
          transportAllowance: transport,
          otherAllowance: other,
          grossSalary,
        },
        create: {
          teacherId: data.teacherId,
          basicSalary: basic,
          houseRent: house,
          medicalAllowance: medical,
          foodAllowance: food,
          transportAllowance: transport,
          otherAllowance: other,
          grossSalary,
        },
      });
    } else {
      return await prisma.staffSalaryStructure.upsert({
        where: { staffId: data.staffId },
        update: {
          basicSalary: basic,
          houseRent: house,
          medicalAllowance: medical,
          foodAllowance: food,
          transportAllowance: transport,
          otherAllowance: other,
          grossSalary,
        },
        create: {
          staffId: data.staffId,
          basicSalary: basic,
          houseRent: house,
          medicalAllowance: medical,
          foodAllowance: food,
          transportAllowance: transport,
          otherAllowance: other,
          grossSalary,
        },
      });
    }
  }

  // 2. Staff Advance Request
  static async createStaffAdvance(data: {
    teacherId?: string;
    staffId?: string;
    amount: number;
    reason?: string;
  }) {
    return await prisma.staffAdvance.create({
      data: {
        teacherId: data.teacherId,
        staffId: data.staffId,
        amount: data.amount,
        reason: data.reason,
        deductedAmount: 0,
        isFullyAdjusted: false,
      },
    });
  }

  // 3. Batch Monthly Payroll Generation
  static async generateMonthlyPayroll(year: number, month: number) {
    // Rejection of duplicates
    const existingMonth = await prisma.payrollMonth.findUnique({
      where: { year_month: { year, month } },
    });

    if (existingMonth) {
      throw new Error(`${year} সালের ${month} মাসের পে-রোল ইতিমধ্যে জেনারেট করা হয়েছে`);
    }

    // Fetch Teachers & Staff with Salary Structure
    const [teachers, staffList] = await Promise.all([
      prisma.teacher.findMany({
        where: { isDeleted: false },
        include: { salaryStructure: true, advances: { where: { isFullyAdjusted: false } } },
      }),
      prisma.staff.findMany({
        where: { isDeleted: false, isActive: true },
        include: { salaryStructure: true, advances: { where: { isFullyAdjusted: false } } },
      }),
    ]);

    let totalGrossBatch = 0;
    let totalDeductionsBatch = 0;
    let totalNetBatch = 0;

    const recordsToCreate: any[] = [];

    // Process Teachers
    for (const t of teachers) {
      if (!t.salaryStructure) continue;
      const struct = t.salaryStructure;
      const basic = Number(struct.basicSalary);
      const allowances = Number(struct.grossSalary) - basic;
      const gross = Number(struct.grossSalary);

      // Check advances
      let advanceDeduction = 0;
      for (const adv of t.advances) {
        const remaining = Number(adv.amount) - Number(adv.deductedAmount);
        if (remaining > 0) {
          advanceDeduction += remaining; // Deduct advance
        }
      }

      const absentDeduction = 0;
      const otherDeduction = 0;
      const totalDeduction = absentDeduction + advanceDeduction + otherDeduction;
      const netPayable = Math.max(0, gross - totalDeduction);

      totalGrossBatch += gross;
      totalDeductionsBatch += totalDeduction;
      totalNetBatch += netPayable;

      recordsToCreate.push({
        teacherId: t.id,
        employeeType: 'TEACHER',
        basicSalary: basic,
        totalAllowances: allowances,
        absentDeduction,
        advanceDeduction,
        otherDeduction,
        grossSalary: gross,
        netPayable,
        paidAmount: 0,
        dueAmount: netPayable,
        status: 'UNPAID',
      });
    }

    // Process Staff
    for (const s of staffList) {
      if (!s.salaryStructure) continue;
      const struct = s.salaryStructure;
      const basic = Number(struct.basicSalary);
      const allowances = Number(struct.grossSalary) - basic;
      const gross = Number(struct.grossSalary);

      let advanceDeduction = 0;
      for (const adv of s.advances) {
        const remaining = Number(adv.amount) - Number(adv.deductedAmount);
        if (remaining > 0) {
          advanceDeduction += remaining;
        }
      }

      const absentDeduction = 0;
      const otherDeduction = 0;
      const totalDeduction = absentDeduction + advanceDeduction + otherDeduction;
      const netPayable = Math.max(0, gross - totalDeduction);

      totalGrossBatch += gross;
      totalDeductionsBatch += totalDeduction;
      totalNetBatch += netPayable;

      recordsToCreate.push({
        staffId: s.id,
        employeeType: 'STAFF',
        basicSalary: basic,
        totalAllowances: allowances,
        absentDeduction,
        advanceDeduction,
        otherDeduction,
        grossSalary: gross,
        netPayable,
        paidAmount: 0,
        dueAmount: netPayable,
        status: 'UNPAID',
      });
    }

    if (recordsToCreate.length === 0) {
      throw new Error('কোনো শিক্ষক বা কর্মচারীর সেলারি স্ট্রাকচার সেট করা নেই। আগে স্যালারি স্ট্রাকচার সেট করুন।');
    }

    return await prisma.payrollMonth.create({
      data: {
        year,
        month,
        status: 'GENERATED',
        totalGross: totalGrossBatch,
        totalDeductions: totalDeductionsBatch,
        totalNetPayable: totalNetBatch,
        totalPaid: 0,
        records: {
          create: recordsToCreate,
        },
      },
      include: {
        records: {
          include: { teacher: true, staff: true },
        },
      },
    });
  }

  // 4. Get Payroll Month Details
  static async getPayrollMonth(year: number, month: number) {
    const pMonth = await prisma.payrollMonth.findUnique({
      where: { year_month: { year, month } },
      include: {
        records: {
          include: {
            teacher: true,
            staff: true,
            payments: { orderBy: { paymentDate: 'desc' } },
          },
        },
      },
    });
    return pMonth;
  }

  // 5. Process Salary Payment with General Ledger Integration
  static async processSalaryPayment(data: {
    payrollRecordId: string;
    amountPaid: number;
    paymentMethod?: 'CASH' | 'BANK' | 'BKASH' | 'NAGAD';
    note?: string;
    paidById: string;
  }) {
    const record = await prisma.payrollRecord.findUnique({
      where: { id: data.payrollRecordId },
      include: {
        teacher: true,
        staff: true,
        payrollMonth: true,
      },
    });

    if (!record) throw new Error('পে-রোল রেকর্ড পাওয়া যায়নি');

    const amount = Number(data.amountPaid);
    const currentDue = Number(record.dueAmount);

    if (amount <= 0) {
      throw new Error('টাকার পরিমাণ ০ এর বেশি হতে হবে');
    }
    if (amount > currentDue) {
      throw new Error(`প্রদেয় ব্যালেন্সের (৳${currentDue}) বেশি পেমেন্ট করা যাবে না`);
    }

    const method = data.paymentMethod || 'CASH';
    const voucherNumber = `SAL-${record.payrollMonth.year}${record.payrollMonth.month}-${Date.now().toString().slice(-4)}`;

    // Accounting Core Integration: Post Double-Entry Journal Entry
    // Find accounts: Salary Expense (4010 for teacher, 4020 for staff) & Asset (1010 Cash, 1020 Bank, 1030 bKash)
    const expenseCode = record.employeeType === 'TEACHER' ? '4010' : '4020';
    const assetCode = method === 'CASH' ? '1010' : method === 'BANK' ? '1020' : '1030';

    const [expenseAcc, assetAcc] = await Promise.all([
      prisma.account.findFirst({ where: { code: expenseCode } }),
      prisma.account.findFirst({ where: { code: assetCode } }),
    ]);

    let journalEntryId: string | undefined;

    if (expenseAcc && assetAcc) {
      const empName = record.teacher ? record.teacher.nameBn : record.staff?.name || 'কর্মচারী';
      const journal = await AccountingService.createJournalEntry({
        voucherNumber,
        description: `বেতন প্রদান - ${empName} (${record.payrollMonth.month}/${record.payrollMonth.year})`,
        reference: `PAYROLL-${record.id}`,
        createdById: data.paidById,
        lines: [
          { accountId: expenseAcc.id, type: 'DEBIT', amount, description: 'স্যালারি এক্সপেন্স ডেবিট' },
          { accountId: assetAcc.id, type: 'CREDIT', amount, description: 'ক্যাশ/ব্যাংক ক্রেডিট' },
        ],
      });
      journalEntryId = journal.id;
    }

    // Execute Payroll update in transaction
    return await prisma.$transaction(async (tx) => {
      const payment = await tx.salaryPayment.create({
        data: {
          payrollRecordId: data.payrollRecordId,
          amountPaid: amount,
          paymentMethod: method,
          voucherNumber,
          journalEntryId,
          note: data.note,
          paidById: data.paidById,
        },
      });

      const newPaidAmount = Number(record.paidAmount) + amount;
      const newDueAmount = Number(record.netPayable) - newPaidAmount;
      const newStatus = newDueAmount <= 0 ? 'PAID' : 'PARTIAL';

      await tx.payrollRecord.update({
        where: { id: data.payrollRecordId },
        data: {
          paidAmount: newPaidAmount,
          dueAmount: newDueAmount,
          status: newStatus,
        },
      });

      // Update monthly totals
      await tx.payrollMonth.update({
        where: { id: record.payrollMonthId },
        data: {
          totalPaid: { increment: amount },
        },
      });

      return payment;
    });
  }

  // 6. Get Payslip Voucher DTO
  static async getPayslip(payrollRecordId: string) {
    const record = await prisma.payrollRecord.findUnique({
      where: { id: payrollRecordId },
      include: {
        teacher: true,
        staff: true,
        payrollMonth: true,
        payments: {
          include: { paidBy: { select: { username: true } } },
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!record) throw new Error('পে-রোল রেকর্ড পাওয়া যায়নি');
    return record;
  }
}
