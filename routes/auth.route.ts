import { Router } from "express";
import * as controller from "../controllers/auth.controller";

const router: Router = Router();

router.post("/register", controller.register);
router.post("/login", controller.login);
router.post("/refresh-token", controller.refreshToken);
router.post("/logout", controller.logout);
router.post("/password/forgot", controller.forgotPassword);
router.post("/password/otp", controller.otpPassword);
router.post("/password/reset", controller.resetPassword);

export const authRoutes: Router = router;
