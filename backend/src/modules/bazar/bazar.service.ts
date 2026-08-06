import prisma from '../../config/prisma';
import { AccountingService } from '../accounting/accounting.service';
import { AppError } from '../../utils/AppError';
import { logAudit } from '../../utils/auditLogger';

export class BazarService {
  // 1. Create Supplier / Vendor
  static async createVendor(data: { name: string; companyName?: string; phone: string; address?: string; createdById?: string }) {
    const vendor = await prisma.bazarVendor.create({
      data: {
        name: data.name,
        companyName: data.companyName,
        phone: data.phone,
        address: data.address,
        currentBalance: 0,
      },
    });

    if (data.createdById) {
      await logAudit(data.createdById, 'CREATE_BAZAR_VENDOR', 'bazar', `ভেন্ডর তৈরি: ${data.name}`);
    }
    return vendor;
  }

  // 2. Get All Vendors
  static async getVendors() {
    return await prisma.bazarVendor.findMany({
      include: {
        purchases: { orderBy: { date: 'desc' } },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 3. Record Daily Bazar Purchase & Post Double-Entry Journal to General Ledger
  static async recordBazarPurchase(data: {
    invoiceNumber: string;
    vendorId?: string;
    paymentMethod: 'CASH' | 'BANK' | 'CREDIT';
    note?: string;
    items: { itemName: string; quantity: number; unit: string; unitPrice: number }[];
    createdById: string;
  }) {
    if (!data.items || data.items.length === 0) {
      throw new AppError('অন্তত একটি বাজারের পণ্যের বিবরণ দিতে হবে', 400);
    }

    let totalAmount = 0;
    const itemRecords = data.items.map((item) => {
      const lineTotal = Number(item.quantity) * Number(item.unitPrice);
      totalAmount += lineTotal;
      return {
        itemName: item.itemName,
        quantity: item.quantity,
        unit: item.unit || 'KG',
        unitPrice: item.unitPrice,
        totalPrice: lineTotal,
      };
    });

    const isPaid = data.paymentMethod !== 'CREDIT';
    const voucherNumber = `BAZAR-${Date.now().toString().slice(-6)}`;

    // Accounting General Ledger Integration:
    // Dr Food & Bazar Expense (4030)
    // Cr Cash in Hand (1010) if CASH, or Vendor Payables (2010) if CREDIT
    const foodExpCode = '4030';
    const creditCode = isPaid ? (data.paymentMethod === 'CASH' ? '1010' : '1020') : '2010';

    const [foodAcc, creditAcc] = await Promise.all([
      prisma.account.findFirst({ where: { code: foodExpCode } }),
      prisma.account.findFirst({ where: { code: creditCode } }),
    ]);

    let journalEntryId: string | undefined;

    if (foodAcc && creditAcc) {
      const journal = await AccountingService.createJournalEntry({
        voucherNumber,
        description: `দৈনিক বাজার ক্রয় (${isPaid ? 'নগদ/ব্যাংক' : 'বাকিতে'}) - চালান #${data.invoiceNumber}`,
        reference: `BAZAR-${data.invoiceNumber}`,
        createdById: data.createdById,
        lines: [
          { accountId: foodAcc.id, type: 'DEBIT', amount: totalAmount, description: 'ফুড ও বাজার খরচ ডেবিট' },
          { accountId: creditAcc.id, type: 'CREDIT', amount: totalAmount, description: isPaid ? 'ক্যাশ/ব্যাংক প্রদান' : 'ভেন্ডর পেয়েবল ক্রেডিট (বাকি)' },
        ],
      });
      journalEntryId = journal.id;
    }

    const res = await prisma.$transaction(async (tx) => {
      const purchase = await tx.bazarPurchase.create({
        data: {
          invoiceNumber: data.invoiceNumber,
          voucherNumber,
          vendorId: data.vendorId,
          totalAmount,
          paymentMethod: data.paymentMethod as any,
          isPaid,
          journalEntryId,
          note: data.note,
          items: {
            create: itemRecords,
          },
        },
        include: { items: true, vendor: true },
      });

      // If credit purchase, increment vendor current balance
      if (!isPaid && data.vendorId) {
        await tx.bazarVendor.update({
          where: { id: data.vendorId },
          data: { currentBalance: { increment: totalAmount } },
        });
      }

      return purchase;
    });

    await logAudit(data.createdById, 'RECORD_BAZAR_PURCHASE', 'bazar', `বাজার ক্রয় চালান #${data.invoiceNumber} (৳${totalAmount})`);
    return res;
  }

  // 4. Pay Supplier / Vendor Payable (বাকির টাকা পরিশোধ)
  static async payVendorBalance(data: {
    vendorId: string;
    purchaseId?: string;
    amountPaid: number;
    paymentMethod?: 'CASH' | 'BANK';
    note?: string;
    paidById: string;
  }) {
    const vendor = await prisma.bazarVendor.findUnique({ where: { id: data.vendorId } });
    if (!vendor) throw new AppError('সাপ্লায়ার / ভেন্ডর পাওয়া যায়নি', 404);

    const amount = Number(data.amountPaid);
    if (amount <= 0) throw new AppError('পেমেন্টের পরিমাণ ০ এর বেশি হতে হবে', 400);

    const method = data.paymentMethod || 'CASH';
    const voucherNumber = `VPAY-${Date.now().toString().slice(-6)}`;

    // Accounting Entry:
    // Dr Vendor Payables (2010)
    // Cr Cash (1010) / Bank (1020)
    const payableCode = '2010';
    const assetCode = method === 'CASH' ? '1010' : '1020';

    const [payableAcc, assetAcc] = await Promise.all([
      prisma.account.findFirst({ where: { code: payableCode } }),
      prisma.account.findFirst({ where: { code: assetCode } }),
    ]);

    let journalEntryId: string | undefined;

    if (payableAcc && assetAcc) {
      const journal = await AccountingService.createJournalEntry({
        voucherNumber,
        description: `সাপ্লায়ার বাকি পরিশোধ - ${vendor.name}`,
        reference: `VENDOR-PAY-${vendor.id}`,
        createdById: data.paidById,
        lines: [
          { accountId: payableAcc.id, type: 'DEBIT', amount, description: 'ভেন্ডর পেয়েবল লায়াবিলিটি হ্রাস' },
          { accountId: assetAcc.id, type: 'CREDIT', amount, description: 'ক্যাশ/ব্যাংক অ্যাসেট প্রদান' },
        ],
      });
      journalEntryId = journal.id;
    }

    const res = await prisma.$transaction(async (tx) => {
      const payment = await tx.vendorPayment.create({
        data: {
          vendorId: data.vendorId,
          purchaseId: data.purchaseId,
          amountPaid: amount,
          paymentMethod: method,
          voucherNumber,
          journalEntryId,
          note: data.note,
          paidById: data.paidById,
        },
      });

      // Update vendor current balance
      await tx.bazarVendor.update({
        where: { id: data.vendorId },
        data: { currentBalance: { decrement: amount } },
      });

      return payment;
    });

    await logAudit(data.paidById, 'PAY_VENDOR_BALANCE', 'bazar', `ভেন্ডর পেমেন্ট: ${vendor.name} (৳${amount})`);
    return res;
  }

  // 5. Record Daily Meal Attendance
  static async recordMealAttendance(data: {
    date: string;
    mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER';
    studentIds?: string[];
    teacherIds?: string[];
    guestCount?: number;
    recordedById: string;
  }) {
    const mealDate = new Date(data.date);
    const recordsToCreate: any[] = [];

    if (data.studentIds) {
      for (const sId of data.studentIds) {
        recordsToCreate.push({
          date: mealDate,
          mealType: data.mealType,
          studentId: sId,
          recordedById: data.recordedById,
        });
      }
    }

    if (data.teacherIds) {
      for (const tId of data.teacherIds) {
        recordsToCreate.push({
          date: mealDate,
          mealType: data.mealType,
          teacherId: tId,
          recordedById: data.recordedById,
        });
      }
    }

    if (data.guestCount && data.guestCount > 0) {
      recordsToCreate.push({
        date: mealDate,
        mealType: data.mealType,
        guestName: 'মেহমান/অতিথি',
        count: data.guestCount,
        recordedById: data.recordedById,
      });
    }

    const res = await prisma.mealAttendance.createMany({
      data: recordsToCreate,
    });

    await logAudit(data.recordedById, 'RECORD_MEAL_ATTENDANCE', 'bazar', `খাবারের হাজিরা লিপিবদ্ধ: ${data.date} (${data.mealType})`);
    return res;
  }

  // 6. Cost Per Meal Analytics Calculator (Total Expense / Total Meals)
  static async getCostPerMeal(year?: number, month?: number) {
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || (new Date().getMonth() + 1);

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    // Fetch total food expenses in month
    const purchases = await prisma.bazarPurchase.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
    });

    const totalExpense = purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0);

    // Fetch total meals served in month
    const meals = await prisma.mealAttendance.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
    });

    const totalMeals = meals.reduce((sum, m) => sum + m.count, 0);

    const costPerMeal = totalMeals > 0 ? (totalExpense / totalMeals).toFixed(2) : '0.00';

    return {
      year,
      month,
      totalExpense,
      totalMeals,
      costPerMeal: Number(costPerMeal),
    };
  }

  // 7. Get Recent Bazar Purchases
  static async getPurchases() {
    return await prisma.bazarPurchase.findMany({
      include: { items: true, vendor: true },
      orderBy: { date: 'desc' },
    });
  }
}
