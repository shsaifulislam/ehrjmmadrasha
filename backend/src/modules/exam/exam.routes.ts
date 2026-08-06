// backend/src/modules/exam/exam.routes.ts

import { Router } from 'express';
import { examController } from './exam.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth.middleware';
import { validateQuery, validateBody, validateParams } from '../../shared/middlewares/validate';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { uuidParamSchema } from '../../shared/validations/common.schema';
import {
  createExamSchema,
  updateExamSchema,
  bulkMarksEntrySchema,
  publicResultSearchSchema,
} from './exam.schema';

const router = Router();
const ctrl = examController;

// ─── PUBLIC ROUTES ────────────────────────────────────
export const publicResultRouter = Router();
publicResultRouter.get(
  '/search',
  validateQuery(publicResultSearchSchema),
  asyncHandler(ctrl.searchPublicResult.bind(ctrl))
);
publicResultRouter.get(
  '/exams',
  asyncHandler(ctrl.getPublicExams.bind(ctrl))
);
publicResultRouter.get(
  '/verify/:id',
  asyncHandler(ctrl.verifyPublicResultCard.bind(ctrl))
);


// ─── ADMIN PROTECTED ROUTES ────────────────────────────
router.use(requireAuth);

// Exam CRUD
router.get('/exams', requirePermission('view_results'), asyncHandler(ctrl.getExams.bind(ctrl)));
router.get('/exams/:id', requirePermission('view_results'), validateParams(uuidParamSchema), asyncHandler(ctrl.getExamById.bind(ctrl)));
router.post('/exams', requirePermission('manage_results'), validateBody(createExamSchema), asyncHandler(ctrl.createExam.bind(ctrl)));
router.put('/exams/:id', requirePermission('manage_results'), validateParams(uuidParamSchema), validateBody(updateExamSchema), asyncHandler(ctrl.updateExam.bind(ctrl)));
router.delete('/exams/:id', requirePermission('manage_results'), validateParams(uuidParamSchema), asyncHandler(ctrl.deleteExam.bind(ctrl)));

// Marks Entry
router.get('/marks-sheet', requirePermission('view_results'), asyncHandler(ctrl.getMarksSheet.bind(ctrl)));
router.post('/marks/bulk', requirePermission('manage_results'), validateBody(bulkMarksEntrySchema), asyncHandler(ctrl.bulkSaveMarks.bind(ctrl)));

// Result Sheets & Cards
router.get('/result-sheet', requirePermission('view_results'), asyncHandler(ctrl.getClassResultSheet.bind(ctrl)));
router.get('/result-card/:examId/:studentId', requirePermission('view_results'), asyncHandler(ctrl.getStudentResultCard.bind(ctrl)));

export default router;
