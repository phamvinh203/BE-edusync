// import { Router } from 'express';
// import * as controller from '../controllers/exercises.controller';
// import { authenticate } from '../middlewares/auth.middleware';
// import { checkRole } from '../middlewares/checkRole';

// const router: Router = Router();

// // Tạo bài tập mới trong lớp classId.
// router.post('/exercises/:classId/createExercise', authenticate, checkRole(['teacher']), controller.createExercise);

// // sửa thông tin bài tập nếu hết hạn nộp
// router.put('/exercises/:exerciseId/updateExercise', authenticate, checkRole(['teacher']), controller.updateExercise);

// // Xóa mềm (soft delete) bài tập
// router.delete('/exercises/:exerciseId/deleteExercise', authenticate, checkRole(['teacher']), controller.deleteExercise);

// // Xem danh sách bài tập do giáo viên tạo
// router.get('/exercises/my-exercises', authenticate, checkRole(['teacher']), controller.getExercisesCreatedByUser);

// // Xem chi tiết một bài tập (full thông tin).
// router.get('/exercises/:exerciseId/submissions', authenticate, controller.getExerciseById);
// // ==> Trả về: danh sách học sinh đã nộp, thời gian nộp, điểm số (nếu có).

// // Lấy danh sách bài tập trong lớp classId
// router.get('/exercises/:classId/getExercises', authenticate, controller.getExercisesByClass);

// export const exerciseRoutes: Router = router;

// routes/exercise.route.ts
import { Router } from 'express';
import * as controller from '../controllers/exercises.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/checkRole';
import { validate } from '../middlewares/validate';
import { createExerciseSchema } from '../validators/exercise.validator';
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
// router.delete('/:exerciseId/delete', authenticate, checkRole(['teacher']), controller.deleteExercise);

// Xem danh sách bài tập do giáo viên tạo
// router.get('/my-exercises', authenticate, checkRole(['teacher']), controller.getMyExercises);

// Xem chi tiết một bài tập (full thông tin).
// router.get('/:exerciseId', authenticate, controller.getExerciseById);

// Xem danh sách tất cả bài nộp của học sinh.
// ==> Trả về: danh sách học sinh đã nộp, thời gian nộp, điểm số (nếu có).
// router.get('/:exerciseId/submissions', authenticate, checkRole(['teacher', 'admin']), controller.getSubmissions);

// Chấm điểm bài làm
// router.put('/:exerciseId/submissions/:submissionId/grade', authenticate, checkRole(['teacher', 'admin']), controller.gradeSubmission);

// STUDENT
// Lấy danh sách bài tập trong lớp classId
// router.get('/class/:classId', authenticate, checkRole(['student']), controller.getExercisesByClass);

// Lấy bài làm của chính mình
// router.get('/:exerciseId/my-submission', authenticate, checkRole(['student']), controller.getMySubmission);

// Nộp bài tập
// router.post('/:exerciseId/submit', authenticate, checkRole(['student']), controller.submitExercise);

// Cập nhật bài làm (nếu giáo viên cho phép và chưa hết hạn nộp)
// router.put('/:exerciseId/submissions/:submissionId/update', authenticate, checkRole(['student']), controller.updateSubmission);

export const exerciseRoutes: Router = router;
