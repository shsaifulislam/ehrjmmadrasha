import { Router } from 'express';
import {
  createSession,
  getAllSessions,
  createClass,
  getAllClasses,
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent
} from '../controllers/academic.controller';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createSessionSchema,
  createClassSchema,
  createStudentSchema,
  updateStudentSchema
} from '../validations/academic.validation';

const router = Router();

router.use(requireAuth);

// Session Routes
router.post('/sessions', requirePermission('manage_settings'), validate(createSessionSchema), createSession);
router.get('/sessions', getAllSessions);

// Class Routes
router.post('/classes', requirePermission('manage_settings'), validate(createClassSchema), createClass);
router.get('/classes', getAllClasses);

// Student Routes
router.post('/students', requirePermission('manage_students'), validate(createStudentSchema), createStudent);
router.get('/students', requirePermission('view_students'), getStudents);
router.get('/students/:id', requirePermission('view_students'), getStudentById);
router.put('/students/:id', requirePermission('manage_students'), validate(updateStudentSchema), updateStudent);
router.delete('/students/:id', requirePermission('manage_students'), deleteStudent);

export default router;
