import { Router } from 'express';
import { LibraryController } from './library.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth.middleware';
import { validateBody } from '../../shared/middlewares/validate';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import {
  createLibraryCategorySchema,
  createBookSchema,
  issueBookSchema,
  returnBookSchema,
} from './library.schema';

const router = Router();

router.use(requireAuth);

router.post('/categories', requirePermission('ADMIN'), validateBody(createLibraryCategorySchema), asyncHandler(LibraryController.createCategory));
router.get('/categories', asyncHandler(LibraryController.getCategories));

router.post('/books', requirePermission('ADMIN'), validateBody(createBookSchema), asyncHandler(LibraryController.createBook));
router.get('/books', asyncHandler(LibraryController.getBooks));

router.post('/issue', requirePermission('ADMIN'), validateBody(issueBookSchema), asyncHandler(LibraryController.issueBook));
router.post('/return', requirePermission('ADMIN'), validateBody(returnBookSchema), asyncHandler(LibraryController.returnBook));
router.get('/borrowed', asyncHandler(LibraryController.getBorrowedBooks));

export default router;
