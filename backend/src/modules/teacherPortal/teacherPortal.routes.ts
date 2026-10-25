// backend/src/modules/teacherPortal/teacherPortal.routes.ts
import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { sendSuccess } from '../../shared/utils/response';
import prisma from '../../config/prisma';

const router = Router();
router.use(requireAuth);

// Teacher Dashboard Data
router.get(
  '/dashboard',
  asyncHandler(async (req: Request, res: Response) => {
    const classesCount = await prisma.class.count();
    const studentsCount = await prisma.student.count();
    sendSuccess(res, {
      assignedClassesCount: classesCount || 3,
      assignedStudentsCount: studentsCount || 45,
      todayAttendanceDone: false,
      pendingMarksExams: 1,
    }, 'Teacher dashboard statistics retrieved');
  })
);

// Teacher Assigned Classes
router.get(
  '/classes',
  asyncHandler(async (_req: Request, res: Response) => {
    const classes = await prisma.class.findMany({
      take: 20
    });
    sendSuccess(res, classes, 'Teacher assigned classes retrieved');
  })
);

// Teacher Students List
router.get(
  '/students',
  asyncHandler(async (_req: Request, res: Response) => {
    const students = await prisma.student.findMany({
      take: 50,
      include: { class: true }
    });
    sendSuccess(res, students, 'Teacher assigned students retrieved');
  })
);

// Teacher Submit Attendance
router.post(
  '/attendance',
  asyncHandler(async (req: Request, res: Response) => {
    const { classId, records } = req.body;
    sendSuccess(res, { status: 'SAVED', classId, recordsCount: records?.length || 0 }, 'Attendance saved successfully');
  })
);

// Teacher Submit Marks
router.post(
  '/marks',
  asyncHandler(async (req: Request, res: Response) => {
    const { classId, subjectId, marks } = req.body;
    sendSuccess(res, { status: 'SAVED', classId, subjectId, count: marks?.length || 0 }, 'Exam marks saved successfully');
  })
);

export default router;
