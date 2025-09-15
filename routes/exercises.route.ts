import { Router } from 'express';
import * as controller from '../controllers/exercises.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/checkRole';
import { validate } from '../middlewares/validate';
import { createExerciseSchema, submitExerciseSchema } from '../validators/exercise.validator';
import { uploadExerciseFile, handleUploadError } from '../middlewares/upload.middleware';

const router: Router = Router();

// TEACHER
// Tạo bài tập mới (với file upload)
router.post(
  '/:classId/create',
  authenticate,
  checkRole(['teacher']),
  uploadExerciseFile.array('attachments', 5), // Cho phép upload tối đa 5 file
  handleUploadError,
  validate(createExerciseSchema),
  controller.createExercise,
);

// sửa thông tin bài tập nếu hết hạn nộp
router.put('/:exerciseId/update', authenticate, checkRole(['teacher']), controller.updateExercise);

// Xóa mềm (soft delete) bài tập
router.delete(
  '/:exerciseId/delete',
  authenticate,
  checkRole(['teacher']),
  controller.deleteExercise,
);

// Xem danh sách tất cả bài nộp của học sinh.
// ==> Trả về: danh sách học sinh đã nộp, thời gian nộp, điểm số (nếu có).
router.get(
  '/:classId/:exerciseId/submissions',
  authenticate,
  checkRole(['teacher']),
  controller.getSubmissions,
);

// Chấm điểm bài làm
router.put(
  '/:classId/:exerciseId/submissions/:submissionId/grade',
  authenticate,
  checkRole(['teacher', 'admin']),
  controller.gradeSubmission,
);

// Xem tổng quan tất cả bài tập đã tạo (đã chấm/chưa chấm)
router.get(
  '/teacher/overview',
  authenticate,
  checkRole(['teacher']),
  controller.getTeacherExercisesOverview,
);

// STUDENT
// Lấy danh sách bài tập trong lớp classId
router.get('/class/:classId', authenticate, checkRole(['student']), controller.getExercisesByClass);

// Lấy bài làm của chính mình
router.get(
  '/:exerciseId/my-submission',
  authenticate,
  checkRole(['student']),
  controller.getMySubmission,
);

// Lấy danh sách tất cả bài tập đã nộp của student
router.get(
  '/my-submissions/all',
  authenticate,
  checkRole(['student']),
  controller.getMySubmissions,
);

// Nộp bài tập
router.post(
  '/:classId/:exerciseId/student_Submit',
  authenticate,
  checkRole(['student']),
  uploadExerciseFile.array('files', 3), // Cho phép upload tối đa 3 file
  handleUploadError,
  validate(submitExerciseSchema),
  controller.studentSubmitExercise,
);

// Cập nhật bài làm (nếu giáo viên cho phép và chưa hết hạn nộp)
// router.put('/:exerciseId/submissions/:submissionId/update', authenticate, checkRole(['student']), controller.updateSubmission);

// Xem danh sách bài tập tại lớp classId (teacher và student trong lớp)
router.get(
  '/:classId/classAssignments',
  authenticate,
  checkRole(['teacher', 'student']),
  controller.getExercisesByClass,
);

// Xem chi tiết một bài tập (teacher và student trong lớp)
router.get(
  '/:classId/:exerciseId',
  authenticate,
  checkRole(['teacher', 'student']),
  controller.getExerciseById,
);

export const exerciseRoutes: Router = router;
