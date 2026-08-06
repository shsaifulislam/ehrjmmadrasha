import prisma from '../../config/prisma';
import { AccountingService } from '../accounting/accounting.service';
import { AppError } from '../../utils/AppError';
import { logAudit } from '../../utils/auditLogger';

export class LibraryService {
  // 1. Create Book Category
  static async createCategory(data: { name: string; code: string; description?: string; createdById?: string }) {
    const existing = await prisma.bookCategory.findUnique({ where: { code: data.code } });
    if (existing) throw new AppError('এই বই ক্যাটাগরি কোডটি ইতিমধ্যে বিদ্যমান', 409);
    const cat = await prisma.bookCategory.create({ data: { name: data.name, code: data.code, description: data.description } });
    if (data.createdById) {
      await logAudit(data.createdById, 'CREATE_BOOK_CATEGORY', 'library', `বই ক্যাটাগরি তৈরি: ${data.code} - ${data.name}`);
    }
    return cat;
  }

  static async getCategories() {
    return await prisma.bookCategory.findMany({
      include: { books: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 2. Add Book to Library Catalog
  static async createBook(data: {
    categoryId: string;
    title: string;
    author: string;
    isbn?: string;
    publisher?: string;
    edition?: string;
    price?: number;
    rackLocation?: string;
    totalCopies: number;
    createdById?: string;
  }) {
    const copies = Number(data.totalCopies || 1);
    const price = Number(data.price || 0);

    const book = await prisma.bookMaster.create({
      data: {
        categoryId: data.categoryId,
        title: data.title,
        author: data.author,
        isbn: data.isbn,
        publisher: data.publisher,
        edition: data.edition,
        price,
        rackLocation: data.rackLocation,
        totalCopies: copies,
        availableCopies: copies,
        status: copies > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK',
      },
    });

    if (data.createdById) {
      await logAudit(data.createdById, 'CREATE_BOOK', 'library', `বই যুক্তকরণ: ${data.title} (${copies} কপি)`);
    }
    return book;
  }

  static async getBooks() {
    return await prisma.bookMaster.findMany({
      include: { category: true, issues: { where: { status: 'ISSUED' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 3. Issue Book with Stock Copy Validation
  static async issueBook(data: {
    bookId: string;
    studentId?: string;
    teacherId?: string;
    staffId?: string;
    days?: number;
    createdById?: string;
  }) {
    const book = await prisma.bookMaster.findUnique({ where: { id: data.bookId } });
    if (!book) throw new AppError('লাইব্রেরি বইটি পাওয়া যায়নি', 404);

    if (book.availableCopies <= 0) {
      throw new AppError(`এই বইটি বর্তমানে স্টকে অবশিষ্ট নেই (মোট কপি: ${book.totalCopies}, খালি কপি: 0)`, 400);
    }

    if (!data.studentId && !data.teacherId && !data.staffId) {
      throw new AppError('বই গ্রহণের জন্য ছাত্র, শিক্ষক বা কর্মচারীর আইডি প্রয়োজন', 400);
    }

    const issueDays = data.days || 14;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + issueDays);

    const res = await prisma.$transaction(async (tx) => {
      const issue = await tx.bookIssue.create({
        data: {
          bookId: data.bookId,
          studentId: data.studentId,
          teacherId: data.teacherId,
          staffId: data.staffId,
          dueDate,
          status: 'ISSUED',
        },
      });

      await tx.bookMaster.update({
        where: { id: data.bookId },
        data: { availableCopies: { decrement: 1 } },
      });

      return issue;
    });

    if (data.createdById) {
      await logAudit(data.createdById, 'ISSUE_BOOK', 'library', `বই ইস্যু: ${book.title}`);
    }
    return res;
  }

  // 4. Return Book with Fine & Accounting Ledger Integration
  static async returnBook(data: {
    issueId: string;
    fineAmount?: number;
    isFinePaid?: boolean;
    createdById: string;
  }) {
    const issue = await prisma.bookIssue.findUnique({
      where: { id: data.issueId },
      include: { book: true, student: true },
    });
    if (!issue) throw new AppError('বই ইস্যু রেকর্ড পাওয়া যায়নি', 404);
    if (issue.status === 'RETURNED') throw new AppError('বইটি আগেই ফেরত দেওয়া হয়েছে', 400);

    const fine = Number(data.fineAmount || 0);
    const isPaid = Boolean(data.isFinePaid);
    let journalEntryId: string | undefined;

    // Post GL Entry for Library Fine: Dr 1010 Cash, Cr 3050 Library Fine Income
    if (fine > 0 && isPaid) {
      const [cashAcc, fineAcc] = await Promise.all([
        prisma.account.findFirst({ where: { code: '1010' } }),
        prisma.account.findFirst({ where: { code: '3050' } }),
      ]);

      if (cashAcc && fineAcc) {
        const journal = await AccountingService.createJournalEntry({
          voucherNumber: `FINE-${Date.now().toString().slice(-6)}`,
          description: `লাইব্রেরি বিলম্ব ফি আদায় - ${issue.book.title} (${issue.student?.nameBn || 'গ্রহীতা'})`,
          reference: `LIB-FINE-${issue.id}`,
          createdById: data.createdById,
          lines: [
            { accountId: cashAcc.id, type: 'DEBIT', amount: fine, description: 'ক্যাশ অ্যাকাউন্ট ডেবিট' },
            { accountId: fineAcc.id, type: 'CREDIT', amount: fine, description: 'লাইব্রেরি জরিমানা আয় ক্রেডিট' },
          ],
        });
        journalEntryId = journal.id;
      }
    }

    const res = await prisma.$transaction(async (tx) => {
      const updatedIssue = await tx.bookIssue.update({
        where: { id: data.issueId },
        data: {
          returnDate: new Date(),
          status: 'RETURNED',
          fineAmount: fine,
          isFinePaid: isPaid,
          journalEntryId,
        },
      });

      await tx.bookMaster.update({
        where: { id: issue.bookId },
        data: { availableCopies: { increment: 1 } },
      });

      return updatedIssue;
    });

    await logAudit(data.createdById, 'RETURN_BOOK', 'library', `বই ফেরত: ${issue.book.title}${fine > 0 ? ` (জরিমানা: ৳${fine})` : ''}`);
    return res;
  }

  static async getBorrowedBooks() {
    return await prisma.bookIssue.findMany({
      include: {
        book: true,
        student: { select: { id: true, studentId: true, nameBn: true } },
        teacher: { select: { id: true, teacherId: true, nameBn: true } },
        staff: { select: { id: true, employeeId: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

