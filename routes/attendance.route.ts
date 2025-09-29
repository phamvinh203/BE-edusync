import { Router } from "express";
import * as controller from "../controllers/attendance.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkRole } from "../middlewares/checkRole";

const router: Router = Router();

// Giáo viên tạo buổi điểm danh
router.post(
  "/:classId/start",
  authenticate,
  checkRole(["teacher"]),
  controller.startAttendanceSession
);

// Giáo viên cập nhật điểm danh
router.put(
  "/:attendanceId/mark",
  authenticate,
  checkRole(["teacher"]),
  controller.markAttendance
);

// Giáo viên xem lịch sử điểm danh theo lớp
router.get(
  "/:classId/history",
  authenticate,
  checkRole(["teacher", "admin"]),
  controller.getAttendanceByClass
);

// Học sinh xem điểm danh của mình trong lớp
router.get(
  "/:classId/me",
  authenticate,
  checkRole(["student"]),
  controller.getMyAttendance
);

export const attendanceRoutes = router;
