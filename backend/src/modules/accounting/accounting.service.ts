import prisma from '../../config/prisma';
import { AccountType, TransactionType } from '@prisma/client';
import { sendSuccess } from '../../shared/utils/response';

export class AccountingService {
  // 1. Chart of Accounts
  static async getChartOfAccounts() {
    return await prisma.account.findMany({
      orderBy: { code: 'asc' },
    });
  }

  static async createAccount(data: { code: string; name: string; type: AccountType; description?: string }) {
    const existing = await prisma.account.findUnique({ where: { code: data.code } });
    if (existing) {
      throw new Error('এই অ্যাকাউন্ট কোড ইতিমধ্যে রয়েছে');
    }

    return await prisma.account.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        description: data.description,
        balance: 0.00,
        isSystem: false,
      },
    });
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
      throw new Error('জার্নাল এন্ট্রিতে অন্তত ২টি অ্যাকাউন্ট লাইন (ডেবিট ও ক্রেডিট) থাকতে হবে');
    }

    // Double-entry validation: Sum(DEBIT) === Sum(CREDIT)
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of data.lines) {
      if (line.amount <= 0) {
        throw new Error('টাকার পরিমাণ অবশ্যই ০ এর চেয়ে বেশি হতে হবে');
      }
      if (line.type === 'DEBIT') {
        totalDebit += Number(line.amount);
      } else if (line.type === 'CREDIT') {
        totalCredit += Number(line.amount);
      }
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`ডেবিট (৳${totalDebit}) এবং ক্রেডিট (৳${totalCredit}) সমান নয়। উভয় পাস সমান হতে হবে।`);
    }

    const voucherNum = data.voucherNumber || `VCH-${Date.now()}`;

    // Execute in Transaction
    return await prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.create({
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
        if (!account) throw new Error(`অ্যাকাউন্ট আইডি পাওয়া যায়নি: ${line.accountId}`);

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

      return entry;
    });
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
    if (!cashAccount) throw new Error('ক্যাশ অ্যাকাউন্ট (1010) সিস্টেমে পাওয়া যায়নি');

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

    return await prisma.dailyCashbook.upsert({
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
  }
}
