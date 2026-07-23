import { Router } from 'express';
import { createTeacher, getTeachers, getTeacherById, updateTeacher, deleteTeacher } from '../controllers/teacher.controller';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createTeacherSchema, updateTeacherSchema } from '../validations/teacher.validation';

const router = Router();

router.use(requireAuth);
router.use(requirePermission('manage_teachers'));

router.get('/', getTeachers);
router.get('/:id', getTeacherById);
router.post('/', validate(createTeacherSchema), createTeacher);
router.put('/:id', validate(updateTeacherSchema), updateTeacher);
router.delete('/:id', deleteTeacher);

export default router;
