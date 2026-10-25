// backend/src/modules/academic/academic.routes.ts
// Academic module routes — sessions, classes, departments, subjects, students

import { Router } from 'express';
import { academicController } from './academic.controller';
import { requireAuth, requirePermission } from '../../middlewares/auth.middleware';
import { validateBody, validateParams } from '../../shared/middlewares/validate';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { uuidParamSchema } from '../../shared/validations/common.schema';
import {
  createSessionSchema, updateSessionSchema,
  createClassSchema, updateClassSchema,
  createDepartmentSchema, updateDepartmentSchema,
  createSubjectSchema, updateSubjectSchema,
  createStudentSchema, updateStudentSchema,
} from './academic.schema';

const router = Router();
const publicRouter = Router();
const ctrl = academicController;
const bind = (fn: Function) => fn.bind(ctrl);

// ─── PUBLIC ACADEMIC ROUTES (Unauthenticated) ───────
publicRouter.get('/sessions', asyncHandler(bind(ctrl.getSessions)));
publicRouter.get('/classes', asyncHandler(bind(ctrl.getClasses)));

// ─── PROTECTED ACADEMIC ROUTES ──────────────────────
router.use(requireAuth);

// ─── Sessions ───────────────────────────────────────
router.get('/sessions', asyncHandler(bind(ctrl.getSessions)));
router.post('/sessions', requirePermission('manage_sessions'), validateBody(createSessionSchema), asyncHandler(bind(ctrl.createSession)));
router.put('/sessions/:id', requirePermission('manage_sessions'), validateParams(uuidParamSchema), validateBody(updateSessionSchema), asyncHandler(bind(ctrl.updateSession)));
router.delete('/sessions/:id', requirePermission('manage_sessions'), validateParams(uuidParamSchema), asyncHandler(bind(ctrl.deleteSession)));

// ─── Classes ────────────────────────────────────────
router.get('/classes', asyncHandler(bind(ctrl.getClasses)));
router.post('/classes', requirePermission('manage_classes'), validateBody(createClassSchema), asyncHandler(bind(ctrl.createClass)));
router.put('/classes/:id', requirePermission('manage_classes'), validateParams(uuidParamSchema), validateBody(updateClassSchema), asyncHandler(bind(ctrl.updateClass)));
router.delete('/classes/:id', requirePermission('manage_classes'), validateParams(uuidParamSchema), asyncHandler(bind(ctrl.deleteClass)));

// ─── Departments ────────────────────────────────────
router.get('/departments', asyncHandler(bind(ctrl.getDepartments)));
router.post('/departments', requirePermission('manage_departments'), validateBody(createDepartmentSchema), asyncHandler(bind(ctrl.createDepartment)));
router.put('/departments/:id', requirePermission('manage_departments'), validateParams(uuidParamSchema), validateBody(updateDepartmentSchema), asyncHandler(bind(ctrl.updateDepartment)));
router.delete('/departments/:id', requirePermission('manage_departments'), validateParams(uuidParamSchema), asyncHandler(bind(ctrl.deleteDepartment)));

// ─── Subjects ───────────────────────────────────────
router.get('/subjects', asyncHandler(bind(ctrl.getSubjects)));
router.post('/subjects', requirePermission('manage_subjects'), validateBody(createSubjectSchema), asyncHandler(bind(ctrl.createSubject)));
router.put('/subjects/:id', requirePermission('manage_subjects'), validateParams(uuidParamSchema), validateBody(updateSubjectSchema), asyncHandler(bind(ctrl.updateSubject)));
router.delete('/subjects/:id', requirePermission('manage_subjects'), validateParams(uuidParamSchema), asyncHandler(bind(ctrl.deleteSubject)));

// ─── Students ───────────────────────────────────────
router.get('/students', requirePermission('view_students'), asyncHandler(bind(ctrl.getStudents)));
router.get('/students/:id', requirePermission('view_students'), validateParams(uuidParamSchema), asyncHandler(bind(ctrl.getStudentById)));
router.post('/students', requirePermission('manage_students'), validateBody(createStudentSchema), asyncHandler(bind(ctrl.createStudent)));
router.put('/students/:id', requirePermission('manage_students'), validateParams(uuidParamSchema), validateBody(updateStudentSchema), asyncHandler(bind(ctrl.updateStudent)));
router.delete('/students/:id', requirePermission('manage_students'), validateParams(uuidParamSchema), asyncHandler(bind(ctrl.deleteStudent)));

export { router as default, publicRouter as academicPublicRouter };
