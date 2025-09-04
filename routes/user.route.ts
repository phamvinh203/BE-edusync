import { Router } from "express";
import * as controller from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { upload, handleUploadError } from "../middlewares/upload.middleware";

const router: Router = Router();

router.get("/me", authenticate, controller.getMe);
router.put("/me/update", authenticate, controller.updateMe);
router.post(
  "/me/avatar",
  authenticate,
  upload.single("avatar"),
  handleUploadError,
  controller.updateAvatar
);

export const userRoutes: Router = router;
