import { Router } from 'express';
import * as controller from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/checkRole';

const router: Router = Router();

router.post('/create-teacher', authenticate, checkRole(['admin']), controller.createTeacher);
router.get('/getallClasses', authenticate, checkRole(['admin']), controller.getAllClasses);
router.get(
  '/classes-by-teacher/:teacherId',
  authenticate,
  checkRole(['admin', 'teacher']),
  controller.getClassesByTeacher,
);
router.get('/all-teacher', authenticate, checkRole(['admin']), controller.getAllTeachers);
router.get('/all-students', authenticate, checkRole(['admin']), controller.getAllStudents);
router.get(
  '/students/:studentId/classes',
  authenticate,
  checkRole(['admin']),
  controller.getStudentClasses,
);
router.post('/create-class/:teacherId', authenticate, checkRole(['admin']), controller.createClass);

export const adminRoutes: Router = router;
