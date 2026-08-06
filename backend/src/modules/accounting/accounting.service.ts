import prisma from '../../config/prisma';
import { AccountType, TransactionType } from '@prisma/client';
import { AppError } from '../../utils/AppError';
import { logAudit } from '../../utils/auditLogger';

export class AccountingService {
  // 1. Chart of Accounts
  static async getChartOfAccounts() {
    return await prisma.account.findMany({
      orderBy: { code: 'asc' },
    });
  }

  static async createAccount(data: { code: string; name: string; type: AccountType; description?: string; createdById?: string }) {
    const existing = await prisma.account.findUnique({ where: { code: data.code } });
    if (existing) {
      throw new AppError('এই অ্যাকাউন্ট কোড ইতিমধ্যে রয়েছে', 409);
    }

    const account = await prisma.account.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        description: data.description,
        balance: 0.00,
        isSystem: false,
      },
    });

    if (data.createdById) {
      await logAudit(data.createdById, 'CREATE_ACCOUNT', 'accounting', `অ্যাকাউন্ট তৈরি: ${data.code} - ${data.name}`);
    }

    return account;
  }

  // 2. Double-Entry Journal Transaction Entry
  static async createJournalEntry(data: {
    voucherNumber?: string;
    date?: Date;
    description: string;
    reference?: string;
    createdById: string;
    lines: Array<{
      accountId: string;
      type: TransactionType;
      amount: number;
      description?: string;
    }>;
  }) {
    if (!data.lines || data.lines.length < 2) {
      throw new AppError('জার্নাল এন্ট্রিতে অন্তত ২টি অ্যাকাউন্ট লাইন (ডেবিট ও ক্রেডিট) থাকতে হবে', 400);
    }

    // Double-entry validation: Sum(DEBIT) === Sum(CREDIT)
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of data.lines) {
      if (line.amount <= 0) {
        throw new AppError('টাকার পরিমাণ অবশ্যই ০ এর চেয়ে বেশি হতে হবে', 400);
      }
      if (line.type === 'DEBIT') {
        totalDebit += Number(line.amount);
      } else if (line.type === 'CREDIT') {
        totalCredit += Number(line.amount);
      }
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new AppError(`ডেবিট (৳${totalDebit}) এবং ক্রেডিট (৳${totalCredit}) সমান নয়। উভয় পাস সমান হতে হবে।`, 400);
    }

    const voucherNum = data.voucherNumber || `VCH-${Date.now()}`;

    // Execute in Transaction
    const entry = await prisma.$transaction(async (tx) => {
      const createdEntry = await tx.journalEntry.create({
        data: {
          voucherNumber: voucherNum,
          date: data.date || new Date(),
          description: data.description,
          reference: data.reference,
          createdById: data.createdById,
          lines: {
            create: data.lines.map((l) => ({
              accountId: l.accountId,
              type: l.type,
              amount: l.amount,
              description: l.description,
            })),
          },
        },
        include: {
          lines: {
            include: { account: true },
          },
        },
      });

      // Update Account balances according to Normal Balances rules
      for (const line of data.lines) {
        const account = await tx.account.findUnique({ where: { id: line.accountId } });
        if (!account) throw new AppError(`অ্যাকাউন্ট আইডি পাওয়া যায়নি: ${line.accountId}`, 404);

        let balanceChange = 0;
        // ASSET & EXPENSE -> Debit increases (+), Credit decreases (-)
        // LIABILITY, EQUITY, INCOME -> Credit increases (+), Debit decreases (-)
        if (account.type === 'ASSET' || account.type === 'EXPENSE') {
          balanceChange = line.type === 'DEBIT' ? Number(line.amount) : -Number(line.amount);
        } else {
          balanceChange = line.type === 'CREDIT' ? Number(line.amount) : -Number(line.amount);
        }

        await tx.account.update({
          where: { id: line.accountId },
          data: {
            balance: {
              increment: balanceChange,
            },
          },
        });
      }

      return createdEntry;
    });

    await logAudit(data.createdById, 'CREATE_JOURNAL_ENTRY', 'accounting', `জার্নাল এন্ট্রি সংরক্ষণ: ${voucherNum} (৳${totalDebit})`);
    return entry;
  }

  // 3. General Ledger Query
  static async getGeneralLedger(params: { accountId?: string; startDate?: string; endDate?: string }) {
    const whereClause: any = {};

    if (params.startDate || params.endDate) {
      whereClause.date = {};
      if (params.startDate) whereClause.date.gte = new Date(params.startDate);
      if (params.endDate) whereClause.date.lte = new Date(params.endDate);
    }

    const entries = await prisma.journalEntry.findMany({
      where: whereClause,
      include: {
        createdBy: { select: { id: true, username: true } },
        lines: {
          include: { account: true },
          where: params.accountId ? { accountId: params.accountId } : undefined,
        },
      },
      orderBy: { date: 'desc' },
    });

    return entries;
  }

  // 4. Daily Cashbook Closing
  static async getDailyCashbook(dateStr?: string) {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const cashAccount = await prisma.account.findFirst({ where: { code: '1010' } });
    if (!cashAccount) throw new AppError('ক্যাশ অ্যাকাউন্ট (1010) সিস্টেমে পাওয়া যায়নি', 404);

    // Find existing closing
    const existingClosing = await prisma.dailyCashbook.findFirst({
      where: { date: targetDate },
      include: { closedBy: { select: { username: true } } },
    });

    // Calculate today's cash DEBITs (Cash Income) & CREDITs (Cash Expense)
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const todayLines = await prisma.journalTransactionLine.findMany({
      where: {
        accountId: cashAccount.id,
        journalEntry: {
          date: {
            gte: targetDate,
            lt: nextDate,
          },
        },
      },
    });

    let totalCashIncome = 0;
    let totalCashExpense = 0;

    for (const line of todayLines) {
      if (line.type === 'DEBIT') {
        totalCashIncome += Number(line.amount);
      } else {
        totalCashExpense += Number(line.amount);
      }
    }

    // Yesterday's closing cash
    const yesterday = new Date(targetDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const prevClosing = await prisma.dailyCashbook.findFirst({
      where: { date: yesterday },
    });

    const openingBalance = prevClosing ? Number(prevClosing.actualCountedCash) : 0;
    const expectedClosingCash = openingBalance + totalCashIncome - totalCashExpense;

    return {
      date: targetDate,
      openingBalance,
      totalCashIncome,
      totalCashExpense,
      expectedClosingCash,
      existingClosing,
    };
  }

  static async closeDailyCashbook(data: {
    dateStr?: string;
    actualCountedCash: number;
    note?: string;
    closedById: string;
  }) {
    const summary = await this.getDailyCashbook(data.dateStr);

    const shortageOrSurplus = Number(data.actualCountedCash) - summary.expectedClosingCash;

    const cashbook = await prisma.dailyCashbook.upsert({
      where: { date: summary.date },
      update: {
        openingBalance: summary.openingBalance,
        totalCashIncome: summary.totalCashIncome,
        totalCashExpense: summary.totalCashExpense,
        expectedClosingCash: summary.expectedClosingCash,
        actualCountedCash: data.actualCountedCash,
        shortageOrSurplus,
        note: data.note,
        closedById: data.closedById,
      },
      create: {
        date: summary.date,
        openingBalance: summary.openingBalance,
        totalCashIncome: summary.totalCashIncome,
        totalCashExpense: summary.totalCashExpense,
        expectedClosingCash: summary.expectedClosingCash,
        actualCountedCash: data.actualCountedCash,
        shortageOrSurplus,
        note: data.note,
        closedById: data.closedById,
      },
    });

    await logAudit(data.closedById, 'CLOSE_CASHBOOK', 'accounting', `ক্যাশ ক্লোজিং সম্পন্ন: ${summary.date.toISOString().slice(0, 10)}`);
    return cashbook;
  }

  // 5. Trial Balance Engine (Validates Debit = Credit)
  static async getTrialBalance(params?: { startDate?: string; endDate?: string }) {
    const accounts = await prisma.account.findMany({
      orderBy: { code: 'asc' },
    });

    const whereClause: any = {};
    if (params?.startDate || params?.endDate) {
      whereClause.date = {};
      if (params.startDate) whereClause.date.gte = new Date(params.startDate);
      if (params.endDate) whereClause.date.lte = new Date(params.endDate);
    }

    const lines = await prisma.journalTransactionLine.findMany({
      where: {
        journalEntry: whereClause,
      },
    });

    let totalDebitSum = 0;
    let totalCreditSum = 0;

    const trialBalanceRows = accounts.map((acc) => {
      const accLines = lines.filter((l) => l.accountId === acc.id);
      const debitSum = accLines.reduce((sum, l) => sum + (l.type === 'DEBIT' ? Number(l.amount) : 0), 0);
      const creditSum = accLines.reduce((sum, l) => sum + (l.type === 'CREDIT' ? Number(l.amount) : 0), 0);

      totalDebitSum += debitSum;
      totalCreditSum += creditSum;

      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        debit: debitSum,
        credit: creditSum,
        netBalance: acc.type === 'ASSET' || acc.type === 'EXPENSE' ? debitSum - creditSum : creditSum - debitSum,
      };
    });

    const isBalanced = Math.abs(totalDebitSum - totalCreditSum) < 0.01;

    return {
      dateRange: { startDate: params?.startDate || null, endDate: params?.endDate || null },
      totalDebit: totalDebitSum,
      totalCredit: totalCreditSum,
      isBalanced,
      rows: trialBalanceRows,
    };
  }

  // 6. Income Statement Engine (Revenue - Expenses = Net Profit/Loss)
  static async getIncomeStatement(params?: { startDate?: string; endDate?: string }) {
    const accounts = await prisma.account.findMany({
      where: { type: { in: ['INCOME', 'EXPENSE'] } },
      orderBy: { code: 'asc' },
    });

    const whereClause: any = {};
    if (params?.startDate || params?.endDate) {
      whereClause.date = {};
      if (params.startDate) whereClause.date.gte = new Date(params.startDate);
      if (params.endDate) whereClause.date.lte = new Date(params.endDate);
    }

    const lines = await prisma.journalTransactionLine.findMany({
      where: {
        journalEntry: whereClause,
      },
    });

    const incomeAccounts: any[] = [];
    const expenseAccounts: any[] = [];
    let totalIncome = 0;
    let totalExpense = 0;

    for (const acc of accounts) {
      const accLines = lines.filter((l) => l.accountId === acc.id);
      const debitSum = accLines.reduce((sum, l) => sum + (l.type === 'DEBIT' ? Number(l.amount) : 0), 0);
      const creditSum = accLines.reduce((sum, l) => sum + (l.type === 'CREDIT' ? Number(l.amount) : 0), 0);

      if (acc.type === 'INCOME') {
        const netIncome = creditSum - debitSum;
        totalIncome += netIncome;
        incomeAccounts.push({ id: acc.id, code: acc.code, name: acc.name, amount: netIncome });
      } else {
        const netExpense = debitSum - creditSum;
        totalExpense += netExpense;
        expenseAccounts.push({ id: acc.id, code: acc.code, name: acc.name, amount: netExpense });
      }
    }

    const netProfit = totalIncome - totalExpense;

    return {
      dateRange: { startDate: params?.startDate || null, endDate: params?.endDate || null },
      incomeAccounts,
      expenseAccounts,
      totalIncome,
      totalExpense,
      netProfit,
    };
  }

  // 7. Balance Sheet Engine (Assets = Liabilities + Equity)
  static async getBalanceSheet(params?: { asOfDate?: string }) {
    const accounts = await prisma.account.findMany({
      where: { type: { in: ['ASSET', 'LIABILITY', 'EQUITY'] } },
      orderBy: { code: 'asc' },
    });

    const incomeStmt = await this.getIncomeStatement({ endDate: params?.asOfDate });

    const assets: any[] = [];
    const liabilities: any[] = [];
    const equity: any[] = [];

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = incomeStmt.netProfit; // Retained earnings

    for (const acc of accounts) {
      const balance = Number(acc.balance || 0);
      if (acc.type === 'ASSET') {
        totalAssets += balance;
        assets.push({ id: acc.id, code: acc.code, name: acc.name, balance });
      } else if (acc.type === 'LIABILITY') {
        totalLiabilities += balance;
        liabilities.push({ id: acc.id, code: acc.code, name: acc.name, balance });
      } else if (acc.type === 'EQUITY') {
        totalEquity += balance;
        equity.push({ id: acc.id, code: acc.code, name: acc.name, balance });
      }
    }

    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

    return {
      asOfDate: params?.asOfDate || new Date().toISOString().slice(0, 10),
      assets,
      liabilities,
      equity,
      retainedEarnings: incomeStmt.netProfit,
      totalAssets,
      totalLiabilities,
      totalEquity: totalLiabilities + totalEquity,
      isBalanced,
    };
  }
}

