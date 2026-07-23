import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { createInvoiceWithItems, collectPayment } from '../services/finance.service';
import { logAudit } from '../utils/auditLogger';

export const createInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, type, year, month, items } = req.body;
    const userId = req.user.id;

    const invoice = await createInvoiceWithItems(
      studentId,
      year,
      month || null,
      type,
      items,
      userId
    );

    res.status(201).json({
      status: 'success',
      data: { invoice }
    });
  } catch (error) {
    next(error);
  }
};

export const getInvoices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, status, month, year, type, page = 1, limit = 10 } = req.query;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const skip = (parsedPage - 1) * parsedLimit;

    const where: any = {};
    if (studentId) where.studentId = String(studentId);
    if (status) where.status = status as any;
    if (month) where.month = Number(month);
    if (year) where.year = Number(year);
    if (type) where.type = String(type);

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: parsedLimit,
        include: {
          student: {
            select: {
              id: true,
              studentId: true,
              roll: true,
              nameBn: true,
              class: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          items: {
            include: {
              feeType: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.invoice.count({ where })
    ]);

    res.status(200).json({
      status: 'success',
      results: invoices.length,
      total,
      page: parsedPage,
      totalPages: Math.ceil(total / parsedLimit),
      data: { invoices }
    });
  } catch (error) {
    next(error);
  }
};

export const getInvoiceById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            roll: true,
            nameBn: true,
            class: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        items: {
          include: {
            feeType: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        payments: {
          select: {
            id: true,
            amountPaid: true,
            paymentDate: true,
            method: true,
            receivedBy: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }
      }
    });

    if (!invoice) {
      return next(new AppError('ইনভয়েসটি পাওয়া যায়নি।', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { invoice }
    });
  } catch (error) {
    next(error);
  }
};

export const collectFeePayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { invoiceId, amountPaid, method } = req.body;
    const receivedById = req.user.id;

    const result = await collectPayment(invoiceId, amountPaid, method, receivedById);

    res.status(200).json({
      status: 'success',
      data: {
        receiptNumber: result.receipt.receiptNumber,
        receiptId: result.receipt.id,
        newStatus: result.newStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getReceiptById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        payment: {
          include: {
            receivedBy: {
              select: {
                id: true,
                username: true
              }
            },
            invoice: {
              include: {
                student: {
                  select: {
                    id: true,
                    studentId: true,
                    roll: true,
                    nameBn: true,
                    class: {
                      select: {
                        id: true,
                        name: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        donation: true
      }
    });

    if (!receipt) {
      return next(new AppError('রশিদটি পাওয়া যায়নি।', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { receipt }
    });
  } catch (error) {
    next(error);
  }
};

export const printReceipt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const receipt = await prisma.receipt.update({
      where: { id },
      data: {
        printedCount: { increment: 1 },
        lastPrintedAt: new Date()
      }
    });

    await logAudit(req.user.id, 'PRINT_RECEIPT', `Receipt ${receipt.id}`, `Printed Count: ${receipt.printedCount}`);

    res.status(200).json({
      status: 'success',
      data: { receipt }
    });
  } catch (error) {
    next(error);
  }
};
