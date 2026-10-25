// backend/src/modules/finance/finance.service.ts

import prisma from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logAudit } from '../../utils/auditLogger';
import { PaginationQuery } from '../../shared/types';
import { buildPaginationMeta } from '../../shared/utils/response';
import type { CreateInvoiceInput, CollectPaymentInput, CreateExpenseInput, CreateDonationInput } from './finance.schema';

const invoiceInclude = {
  student: { select: { id: true, studentId: true, roll: true, nameBn: true, class: { select: { id: true, name: true } } } },
  items: { include: { feeType: { select: { id: true, name: true } } } },
} as const;

const invoiceDetailInclude = {
  ...invoiceInclude,
  payments: {
    select: { id: true, amountPaid: true, paymentDate: true, method: true, receivedBy: { select: { id: true, username: true } } },
  },
} as const;

export class FinanceService {
  // ─── INVOICES ──────────────────────────────────────

  async createInvoice(input: CreateInvoiceInput, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.invoice.findFirst({
        where: { studentId: input.studentId, type: input.type, month: input.month ?? null, year: input.year },
      });
      if (existing) throw new AppError('এই মেয়াদের ইনভয়েস ইতিমধ্যে আছে', 400);

      const totalAmount = input.items.reduce((sum, item) => sum + item.amount, 0);
      if (totalAmount <= 0) throw new AppError('মোট পরিমাণ ০ এর বেশি হতে হবে', 400);

      const invoice = await tx.invoice.create({
        data: {
          studentId: input.studentId,
          month: input.month ?? null,
          year: input.year,
          type: input.type,
          totalAmount,
          status: 'UNPAID',
          items: { create: input.items.map(i => ({ feeTypeId: i.feeTypeId, amount: i.amount })) },
        },
        include: invoiceInclude,
      });

      await logAudit(actorId, 'CREATE_INVOICE', 'finance', `ইনভয়েস তৈরি, পরিমাণ: ${totalAmount}`);
      return invoice;
    });
  }

  async findAllInvoices(query: PaginationQuery & { studentId?: string; status?: string; month?: number; year?: number; type?: string }) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.studentId) where.studentId = query.studentId;
    if (query.status) where.status = query.status;
    if (query.month) where.month = Number(query.month);
    if (query.year) where.year = Number(query.year);
    if (query.type) where.type = query.type;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({ where, skip, take: limit, include: invoiceInclude, orderBy: { createdAt: 'desc' } }),
      prisma.invoice.count({ where }),
    ]);
    return { invoices, meta: buildPaginationMeta(total, page, limit) };
  }

  async findInvoiceById(id: string) {
    const invoice = await prisma.invoice.findUnique({ where: { id }, include: invoiceDetailInclude });
    if (!invoice) throw new AppError('ইনভয়েস পাওয়া যায়নি', 404);
    return invoice;
  }

  // ─── PAYMENT ───────────────────────────────────────

  async collectPayment(input: CollectPaymentInput, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id: input.invoiceId }, include: { payments: true } });
      if (!invoice) throw new AppError('ইনভয়েস পাওয়া যায়নি', 404);
      if (invoice.status === 'PAID') throw new AppError('ইনভয়েস ইতিমধ্যে পরিশোধিত', 400);

      const totalPaid = invoice.payments.reduce((sum: number, p: any) => sum + Number(p.amountPaid), 0);
      const remaining = Number(invoice.totalAmount) - totalPaid;
      if (input.amountPaid > remaining) throw new AppError(`বকেয়া ${remaining} টাকার বেশি দেওয়া যাবে না`, 400);

      const payment = await tx.payment.create({
        data: { invoiceId: input.invoiceId, amountPaid: input.amountPaid, method: input.method, receivedById: actorId },
      });

      const newStatus = (totalPaid + input.amountPaid) >= Number(invoice.totalAmount) ? 'PAID' : 'PARTIAL';
      await tx.invoice.update({ where: { id: input.invoiceId }, data: { status: newStatus } });

      const receipt = await tx.receipt.create({
        data: { receiptNumber: `FEE-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`, type: 'FEE', paymentId: payment.id },
      });

      await logAudit(actorId, 'COLLECT_FEE', 'finance', `ফি আদায়: ${input.amountPaid} টাকা`);

      // Trigger SMS Notification asynchronously (Non-blocking)
      setImmediate(async () => {
        try {
          const pDetails = await prisma.payment.findUnique({
            where: { id: payment.id },
            include: { invoice: { include: { student: { include: { guardian: true } } } } },
          });
          const std = pDetails?.invoice?.student;
          const phone = std?.guardian?.phone;
          if (phone) {
            const msg = `মহোদয়, আপনার সন্তান ${std.nameBn}-এর ফি ৳${input.amountPaid} টাকা সফলভাবে গ্রহণ করা হয়েছে। রশিদ নং: ${receipt.receiptNumber}। ইলিয়টগঞ্জ মাদ্রাসা।`;
            const { notificationService } = await import('../notification/notification.service');
            const { NotificationEventType } = await import('@prisma/client');
            await notificationService.dispatchSingleNotification({
              eventType: NotificationEventType.FEE_PAYMENT_SUCCESS,
              recipientPhone: phone,
              recipientName: std.guardian?.name,
              message: msg,
              referenceId: payment.id,
            });
          }
        } catch (e) {
          // Suppress error to ensure transaction is never affected
        }
      });

      return { payment, receipt, newStatus };
    });
  }

  // ─── RECEIPT ───────────────────────────────────────

  async findReceiptById(id: string) {
    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        payment: { include: { receivedBy: { select: { id: true, username: true } }, invoice: { include: { student: { select: { id: true, studentId: true, roll: true, nameBn: true, class: { select: { id: true, name: true } } } } } } } },
        donation: true,
      },
    });
    if (!receipt) throw new AppError('রশিদ পাওয়া যায়নি', 404);
    return receipt;
  }

  async printReceipt(id: string, actorId: string) {
    const receipt = await prisma.receipt.update({
      where: { id },
      data: { printedCount: { increment: 1 }, lastPrintedAt: new Date() },
    });
    await logAudit(actorId, 'PRINT_RECEIPT', 'finance', `রশিদ প্রিন্ট: ${receipt.receiptNumber}`);
    return receipt;
  }

  // ─── EXPENSE ───────────────────────────────────────

  async findAllExpenses(query: PaginationQuery) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({ skip, take: limit, orderBy: { date: 'desc' }, include: { loggedBy: { select: { id: true, username: true } } } }),
      prisma.expense.count(),
    ]);
    return { expenses, meta: buildPaginationMeta(total, page, limit) };
  }

  async createExpense(input: CreateExpenseInput, actorId: string) {
    const expense = await prisma.expense.create({
      data: { category: input.category, amount: input.amount, description: input.description || null, date: input.date ? new Date(input.date) : new Date(), loggedById: actorId },
      include: { loggedBy: { select: { id: true, username: true } } },
    });
    await logAudit(actorId, 'CREATE_EXPENSE', 'finance', `খরচ: ${input.amount} টাকা — ${input.category}`);
    return expense;
  }

  // ─── DONATION ──────────────────────────────────────

  async findAllDonations(query: PaginationQuery) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const [donations, total] = await Promise.all([
      prisma.donation.findMany({ skip, take: limit, orderBy: { date: 'desc' } }),
      prisma.donation.count(),
    ]);
    return { donations, meta: buildPaginationMeta(total, page, limit) };
  }

  async createDonation(input: CreateDonationInput, actorId: string) {
    const donation = await prisma.donation.create({
      data: { donorName: input.donorName, amount: input.amount, purpose: input.purpose || null, date: input.date ? new Date(input.date) : new Date() },
    });

    // Create donation receipt
    const receipt = await prisma.receipt.create({
      data: { receiptNumber: `DON-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`, type: 'DONATION', donationId: donation.id },
    });

    await logAudit(actorId, 'CREATE_DONATION', 'finance', `দান: ${input.amount} টাকা — ${input.donorName}`);
    return { donation, receipt };
  }
}

export const financeService = new FinanceService();
