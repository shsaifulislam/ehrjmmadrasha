// backend/src/modules/studentPortal/studentPortal.routes.ts
import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { sendSuccess } from '../../shared/utils/response';
import prisma from '../../config/prisma';

const router = Router();
router.use(requireAuth);

// Student Dashboard Data
router.get(
  '/dashboard',
  asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, {
      studentId: 'EHRJ-2026-001',
      roll: 1,
      attendanceRate: 96,
      latestGpa: '5.00 (A+)',
      dueAmount: 0,
    }, 'Student dashboard statistics retrieved');
  })
);

// Student Profile Data
router.get(
  '/profile',
  asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, {
      nameBn: 'মুহাম্মদ আব্দুল্লাহ',
      nameEn: 'Muhammed Abdullah',
      studentId: 'EHRJ-2026-001',
      roll: 1,
      class: 'দাওরায়ে হাদীস (Dawra-e-Hadith)',
      department: 'কিতাব বিভাগ',
      session: '২০২৬',
      guardianPhone: '01845-162664',
      bloodGroup: 'B+',
    }, 'Student profile retrieved');
  })
);

// Student Results Data
router.get(
  '/results',
  asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, {
      examName: 'অর্ধবার্ষিক মূল্যায়ন পরীক্ষা ২০২৬',
      gpa: '5.00',
      grade: 'A+',
      position: '১ম স্থান',
      subjects: [
        { code: '101', name: 'সহীহ বুখারী শরীফ (১ম খণ্ড)', fullMarks: 100, obtainedMarks: 95, grade: 'A+' },
        { code: '102', name: 'সহীহ মুসলিম শরীফ', fullMarks: 100, obtainedMarks: 92, grade: 'A+' },
      ]
    }, 'Student results retrieved');
  })
);

// Student Fees & Invoices
router.get(
  '/fees',
  asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, [
      { receiptNo: 'REC-2026-0012', date: '২০২৬-০৭-১০', feeType: 'মাসিক বেতন (জুলাই)', amount: 1500, status: 'PAID' },
    ], 'Student fee history retrieved');
  })
);

export default router;
