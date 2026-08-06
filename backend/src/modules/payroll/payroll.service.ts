import prisma from '../../config/prisma';
import { AccountingService } from '../accounting/accounting.service';
import { AppError } from '../../utils/AppError';
import { logAudit } from '../../utils/auditLogger';

export class PayrollService {
  // 1. Salary Structure Setup (With Immutability check if month is approved)
  static async setSalaryStructure(data: {
    teacherId?: string;
    staffId?: string;
    basicSalary: number;
    houseRent?: number;
    medicalAllowance?: number;
    foodAllowance?: number;
    transportAllowance?: number;
    otherAllowance?: number;
    actorId?: string;
  }) {
    if (!data.teacherId && !data.staffId) {
      throw new AppError('শিক্ষক অথবা কর্মচারীর আইডি প্রদান করতে হবে', 400);
    }

    const basic = Number(data.basicSalary);
    const house = Number(data.houseRent || 0);
    const medical = Number(data.medicalAllowance || 0);
    const food = Number(data.foodAllowance || 0);
    const transport = Number(data.transportAllowance || 0);
    const other = Number(data.otherAllowance || 0);

    const grossSalary = basic + house + medical + food + transport + other;

    let res;
    if (data.teacherId) {
      res = await prisma.staffSalaryStructure.upsert({
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
      res = await prisma.staffSalaryStructure.upsert({
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

    if (data.actorId) {
      await logAudit(data.actorId, 'SET_SALARY_STRUCTURE', 'payroll', `স্যালারি স্ট্রাকচার সেট: ৳${grossSalary}`);
    }
    return res;
  }

  // 2. Staff Advance Request
  static async createStaffAdvance(data: {
    teacherId?: string;
    staffId?: string;
    amount: number;
    reason?: string;
    disbursedById?: string;
  }) {
    const amount = Number(data.amount);
    const advance = await prisma.staffAdvance.create({
      data: {
        teacherId: data.teacherId,
        staffId: data.staffId,
        amount,
        reason: data.reason,
        deductedAmount: 0,
        isFullyAdjusted: false,
      },
    });

    // Accounting Journal Entry: Dr Staff Advance Receivable (1050), Cr Cash in Hand (1010)
    if (data.disbursedById) {
      const [advRecAcc, cashAcc] = await Promise.all([
        prisma.account.findFirst({ where: { code: '1050' } }),
        prisma.account.findFirst({ where: { code: '1010' } }),
      ]);
      if (advRecAcc && cashAcc) {
        await AccountingService.createJournalEntry({
          voucherNumber: `ADV-${Date.now().toString().slice(-6)}`,
          description: `স্টাফ এডভান্স প্রদান (${data.reason || 'জরুরি প্রয়োজন'})`,
          reference: `ADVANCE-${advance.id}`,
          createdById: data.disbursedById,
          lines: [
            { accountId: advRecAcc.id, type: 'DEBIT', amount, description: 'এডভান্স রিসিভেবল ডেবিট' },
            { accountId: cashAcc.id, type: 'CREDIT', amount, description: 'ক্যাশ ক্রেডিট' },
          ],
        });
      }
      await logAudit(data.disbursedById, 'CREATE_STAFF_ADVANCE', 'payroll', `স্টাফ এডভান্স প্রদান: ৳${amount}`);
    }

    return advance;
  }

  // 3. Batch Monthly Payroll Generation (With Duplicate Protection)
  static async generateMonthlyPayroll(year: number, month: number, actorId?: string) {
    const existingMonth = await prisma.payrollMonth.findUnique({
      where: { year_month: { year, month } },
    });

    if (existingMonth) {
      throw new AppError(`${year} সালের ${month} মাসের পে-রোল ইতিমধ্যে জেনারেট করা হয়েছে`, 400);
    }

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

    for (const t of teachers) {
      if (!t.salaryStructure) continue;
      const struct = t.salaryStructure;
      const basic = Number(struct.basicSalary);
      const allowances = Number(struct.grossSalary) - basic;
      const gross = Number(struct.grossSalary);

      let advanceDeduction = 0;
      for (const adv of t.advances) {
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
      throw new AppError('কোনো শিক্ষক বা কর্মচারীর সেলারি স্ট্রাকচার সেট করা নেই। আগে স্যালারি স্ট্রাকচার সেট করুন।', 400);
    }

    const createdPayrollMonth = await prisma.payrollMonth.create({
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

    if (actorId) {
      await logAudit(actorId, 'GENERATE_PAYROLL', 'payroll', `পে-রোল জেনারেট: ${month}/${year} (মোট: ৳${totalNetBatch})`);
    }

    return createdPayrollMonth;
  }

  // 4. Payroll Approval & Accrual Double-Entry Journal Posting
  static async approvePayrollMonth(year: number, month: number, approvedById: string) {
    const pMonth = await prisma.payrollMonth.findUnique({
      where: { year_month: { year, month } },
      include: { records: true },
    });

    if (!pMonth) throw new AppError('পে-রোল ব্যাচ পাওয়া যায়নি', 404);
    if (pMonth.status === 'APPROVED' || pMonth.status === 'LOCKED') {
      throw new AppError('এই পে-রোল ব্যাচ ইতিমধ্যে এপ্রুভড ও লকড করা হয়েছে। পরিবর্তন সম্ভব নয়।', 400);
    }

    // Post Salary Accrual Entry:
    // Dr Salary Expense (4010 Teacher / 4020 Staff) Total Gross
    // Cr Salary Payable (2020) Total Net
    // Cr Staff Advance Receivable (1050) Total Advance Adjusted
    const teacherGross = pMonth.records
      .filter((r) => r.employeeType === 'TEACHER')
      .reduce((sum, r) => sum + Number(r.grossSalary), 0);
    const staffGross = pMonth.records
      .filter((r) => r.employeeType === 'STAFF')
      .reduce((sum, r) => sum + Number(r.grossSalary), 0);

    const totalNet = Number(pMonth.totalNetPayable);
    const totalAdvance = Number(pMonth.totalDeductions);

    const [tExpAcc, sExpAcc, payableAcc, advRecAcc] = await Promise.all([
      prisma.account.findFirst({ where: { code: '4010' } }),
      prisma.account.findFirst({ where: { code: '4020' } }),
      prisma.account.findFirst({ where: { code: '2020' } }),
      prisma.account.findFirst({ where: { code: '1050' } }),
    ]);

    if (payableAcc) {
      const lines: any[] = [];
      if (teacherGross > 0 && tExpAcc) {
        lines.push({ accountId: tExpAcc.id, type: 'DEBIT', amount: teacherGross, description: 'শিক্ষক স্যালারি এক্সপেন্স (অ্যাক্রুয়াল)' });
      }
      if (staffGross > 0 && sExpAcc) {
        lines.push({ accountId: sExpAcc.id, type: 'DEBIT', amount: staffGross, description: 'স্টাফ স্যালারি এক্সপেন্স (অ্যাক্রুয়াল)' });
      }
      lines.push({ accountId: payableAcc.id, type: 'CREDIT', amount: totalNet, description: 'স্যালারি পেয়েবল লায়াবিলিটি' });

      if (totalAdvance > 0 && advRecAcc) {
        lines.push({ accountId: advRecAcc.id, type: 'CREDIT', amount: totalAdvance, description: 'এডভান্স রিসিভেবল এডজাস্টমেন্ট' });
      }

      await AccountingService.createJournalEntry({
        voucherNumber: `ACCRUAL-${year}${month}-${Date.now().toString().slice(-4)}`,
        description: `${month}/${year} মাসের বেতন অ্যাক্রুয়াল ও পেয়েবল হিসাব`,
        reference: `PAYROLL-MONTH-${pMonth.id}`,
        createdById: approvedById,
        lines,
      });
    }

    const updatedMonth = await prisma.payrollMonth.update({
      where: { id: pMonth.id },
      data: { status: 'APPROVED' },
    });

    await logAudit(approvedById, 'APPROVE_PAYROLL', 'payroll', `পে-রোল অনুমোদন: ${month}/${year}`);
    return updatedMonth;
  }

  // 5. Get Payroll Month Details
  static async getPayrollMonth(year: number, month: number) {
    return await prisma.payrollMonth.findUnique({
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
  }

  // 6. Process Salary Payment with Accrual Payment Journal Entry (With Overpayment Validation)
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

    if (!record) throw new AppError('পে-রোল রেকর্ড পাওয়া যায়নি', 404);

    const amount = Number(data.amountPaid);
    const currentDue = Number(record.dueAmount);

    if (amount <= 0) {
      throw new AppError('টাকার পরিমাণ ০ এর বেশি হতে হবে', 400);
    }

    // OVERPAYMENT PROTECTION: Payment Amount <= Remaining Due
    if (amount > currentDue) {
      throw new AppError(`প্রদেয় ব্যালেন্সের (৳${currentDue}) বেশি পেমেন্ট করা যাবে না`, 400);
    }

    const method = data.paymentMethod || 'CASH';
    const voucherNumber = `SAL-${record.payrollMonth.year}${record.payrollMonth.month}-${Date.now().toString().slice(-4)}`;

    // Accounting Accrual Payment Flow:
    // Dr Salary Payables (2020)
    // Cr Cash in Hand (1010) / Bank (1020) / bKash (1030)
    const payableCode = '2020';
    const assetCode = method === 'CASH' ? '1010' : method === 'BANK' ? '1020' : '1030';

    const [payableAcc, assetAcc] = await Promise.all([
      prisma.account.findFirst({ where: { code: payableCode } }),
      prisma.account.findFirst({ where: { code: assetCode } }),
    ]);

    let journalEntryId: string | undefined;

    if (payableAcc && assetAcc) {
      const empName = record.teacher ? record.teacher.nameBn : record.staff?.name || 'কর্মচারী';
      const journal = await AccountingService.createJournalEntry({
        voucherNumber,
        description: `বেতন প্রদান (Salary Payable Settlement) - ${empName} (${record.payrollMonth.month}/${record.payrollMonth.year})`,
        reference: `PAYROLL-${record.id}`,
        createdById: data.paidById,
        lines: [
          { accountId: payableAcc.id, type: 'DEBIT', amount, description: 'স্যালারি পেয়েবল লায়াবিলিটি হ্রাস' },
          { accountId: assetAcc.id, type: 'CREDIT', amount, description: 'ক্যাশ/ব্যাংক অ্যাসেট প্রদান' },
        ],
      });
      journalEntryId = journal.id;
    }

    const res = await prisma.$transaction(async (tx) => {
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

      await tx.payrollMonth.update({
        where: { id: record.payrollMonthId },
        data: {
          totalPaid: { increment: amount },
        },
      });

      return payment;
    });

    await logAudit(data.paidById, 'PROCESS_SALARY_PAYMENT', 'payroll', `বেতন পেমেন্ট প্রদান: ৳${amount} (ভাউচার: ${voucherNumber})`);
    return res;
  }

  // 7. Get Payslip Voucher DTO
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

    if (!record) throw new AppError('পে-রোল রেকর্ড পাওয়া যায়নি', 404);
    return record;
  }
}

