import { Router } from 'express';
import * as controller from '../controllers/class.controller';
import { checkRole } from '../middlewares/checkRole';
import { authenticate } from '../middlewares/auth.middleware';

const router: Router = Router();

router.post('/createclass', authenticate, checkRole(['teacher', 'admin']), controller.createClass);
router.get('/getallclasses', authenticate, controller.getAllClasses);
router.get('/getclass/:id', controller.getClassById);
router.put(
  '/updateclass/:id',
  authenticate,
  checkRole(['teacher', 'admin']),
  controller.updateClass,
);
router.delete(
  '/deleteclass/:id',
  authenticate,
  checkRole(['teacher', 'admin']),
  controller.deleteClass,
);

// student can join class
router.post('/joinclass/:id', authenticate, controller.joinClass);
router.get('/getStudentsByClass/:classId', authenticate, controller.getStudentsByClass);
router.get(
  '/:classId/getPendingStudentsByClass',
  authenticate,
  checkRole(['teacher', 'admin']),
  controller.getPendingStudents,
);
router.post(
  '/:classId/approveStudent/:studentId',
  authenticate,
  checkRole(['teacher', 'admin']),
  controller.approveStudent,
);

// danh sách lớp học sinh đã đang chờ duyệt
router.get(
  '/my-pending-classes',
  authenticate,
  checkRole(['student']),
  controller.getMyPendingClasses,
);

// danh sách lớp học sinh đã đăng ký
router.get(
  '/my-registered-classes',
  authenticate,
  checkRole(['student']),
  controller.getMyRegisteredClasses,
);

// học sinh rời khỏi lớp học
router.delete('/leave-class/:classId', authenticate, checkRole(['student']), controller.leaveClass);

// lấy thông tin thời gian học của tất cả lớp
router.get('/schedules', authenticate, controller.getAllClassSchedules);

// lấy thông tin thời gian học của một lớp cụ thể
router.get('/schedule/:classId', authenticate, controller.getClassScheduleById);

export const classRoutes: Router = router;
