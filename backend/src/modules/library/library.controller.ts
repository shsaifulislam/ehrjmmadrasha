import { Request, Response, NextFunction } from 'express';
import { LibraryService } from './library.service';
import { sendSuccess } from '../../shared/utils/response';

export class LibraryController {
  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const cat = await LibraryService.createCategory(req.body);
      return sendSuccess(res, cat, 'বই ক্যাটাগরি তৈরি হয়েছে', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await LibraryService.getCategories();
      return sendSuccess(res, categories, 'Categories retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async createBook(req: Request, res: Response, next: NextFunction) {
    try {
      const book = await LibraryService.createBook(req.body);
      return sendSuccess(res, book, 'লাইব্রেরিতে বই সফলভাবে যুক্ত হয়েছে', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getBooks(req: Request, res: Response, next: NextFunction) {
    try {
      const books = await LibraryService.getBooks();
      return sendSuccess(res, books, 'Books retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async issueBook(req: Request, res: Response, next: NextFunction) {
    try {
      const issue = await LibraryService.issueBook(req.body);
      return sendSuccess(res, issue, 'বই সফলভাবে ইস্যু করা হয়েছে', 201);
    } catch (error) {
      next(error);
    }
  }

  static async returnBook(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const result = await LibraryService.returnBook({
        ...req.body,
        createdById: user.id,
      });
      return sendSuccess(res, result, 'বই ফেরত সফলভাবে রেকর্ড ও ফাইন লেজারে সিঙ্ক হয়েছে', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getBorrowedBooks(req: Request, res: Response, next: NextFunction) {
    try {
      const borrowed = await LibraryService.getBorrowedBooks();
      return sendSuccess(res, borrowed, 'Borrowed books retrieved');
    } catch (error) {
      next(error);
    }
  }
}
