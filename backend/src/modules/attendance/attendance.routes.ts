// backend/src/modules/attendance/attendance.routes.ts

import { Router } from 'express';
import { attendanceController } from './attendance.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth.middleware';
import { validateQuery, validateBody } from '../../shared/middlewares/validate';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import {
  attendanceQuerySchema,
  bulkAttendanceSchema,
  dailyReportQuerySchema,
  monthlyReportQuerySchema,
} from './attendance.schema';

const router = Router();
const ctrl = attendanceController;

router.use(requireAuth);

// GET /api/admin/attendance
router.get('/', requirePermission('view_attendance'), validateQuery(attendanceQuerySchema), asyncHandler(ctrl.getAttendanceByClassAndDate.bind(ctrl)));

// POST /api/admin/attendance/bulk
router.post('/bulk', requirePermission('manage_attendance'), validateBody(bulkAttendanceSchema), asyncHandler(ctrl.bulkSaveAttendance.bind(ctrl)));

// GET /api/admin/attendance/report/daily
router.get('/report/daily', requirePermission('view_attendance'), validateQuery(dailyReportQuerySchema), asyncHandler(ctrl.getDailyReport.bind(ctrl)));

// GET /api/admin/attendance/report/monthly
router.get('/report/monthly', requirePermission('view_attendance'), validateQuery(monthlyReportQuerySchema), asyncHandler(ctrl.getMonthlyReport.bind(ctrl)));

export default router;
