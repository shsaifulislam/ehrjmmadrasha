import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { logAudit } from '../utils/auditLogger';
import { PaymentMethod } from '@prisma/client';

export const createInvoiceWithItems = async (
  studentId: string,
  year: number,
  month: number | null,
  type: string,
  items: { feeTypeId: string; amount: number }[],
  userId: string
) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Check if invoice already exists (duplicate prevention)
    const existing = await tx.invoice.findFirst({
      where: {
        studentId,
        type,
        month: month ?? null,
        year
      }
    });

    if (existing) {
      throw new AppError('এই শিক্ষার্থীর জন্য এই মেয়াদের ইনভয়েস ইতিমধ্যে তৈরি করা হয়েছে।', 400);
    }

    // 2. Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

    if (totalAmount <= 0) {
      throw new AppError('ইনভয়েসের মোট পরিমাণ অবশ্যই ০ থেকে বড় হতে হবে।', 400);
    }

    // 3. Create invoice
    const invoice = await tx.invoice.create({
      data: {
        studentId,
        month,
        year,
        type,
        totalAmount,
        status: 'UNPAID',
        items: {
          create: items.map(item => ({
            feeTypeId: item.feeTypeId,
            amount: item.amount
          }))
        }
      },
      include: { items: true }
    });

    // 4. Log audit
    await logAudit(userId, 'CREATE_INVOICE', `Invoice ${invoice.id}`, `Amount: ${totalAmount}`);

    return invoice;
  });
};

export const collectPayment = async (
  invoiceId: string,
  amountPaid: number,
  method: PaymentMethod,
  receivedById: string
) => {
  if (amountPaid <= 0) {
    throw new AppError('পরিশোধের পরিমাণ অবশ্যই ০ থেকে বড় হতে হবে।', 400);
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch invoice to ensure it exists
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true }
    });

    if (!invoice) {
      throw new AppError('ইনভয়েসটি পাওয়া যায়নি।', 404);
    }

    if (invoice.status === 'PAID') {
      throw new AppError('ইনভয়েসটি ইতিমধ্যে সম্পূর্ণ পরিশোধ করা হয়েছে।', 400);
    }

    // Calculate total already paid
    const totalPaidBefore = invoice.payments.reduce((sum: number, p: any) => sum + Number(p.amountPaid), 0);
    const invoiceTotal = Number(invoice.totalAmount);
    const remaining = invoiceTotal - totalPaidBefore;

    // 2. Reject overpayment
    if (amountPaid > remaining) {
      throw new AppError(`পরিশোধের পরিমাণ বকেয়া পরিমাণের (${remaining}) চেয়ে বেশি হতে পারবে না।`, 400);
    }

    // 3. Create payment record
    const payment = await tx.payment.create({
      data: {
        invoiceId,
        amountPaid,
        method,
        receivedById,
      },
    });

    // 4. Determine new status
    const totalPaidAfter = totalPaidBefore + amountPaid;
    const newStatus = totalPaidAfter >= invoiceTotal ? 'PAID' : 'PARTIAL';

    // 5. Update invoice status
    await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: newStatus },
    });

    // 6. Generate a unique receipt number
    const receiptNumber = `FEE-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 7. Create Receipt (Type FEE requires paymentId)
    const receipt = await tx.receipt.create({
      data: {
        receiptNumber,
        type: 'FEE',
        paymentId: payment.id,
      },
    });

    // 8. Audit Log
    await logAudit(receivedById, 'COLLECT_FEE', `Invoice ${invoice.id}`, `Collected: ${amountPaid}`);

    return { payment, receipt, newStatus };
  });
};
