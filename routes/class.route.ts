import { Router } from "express";
import * as controller from "../controllers/class.controller";
import { checkRole } from "../middlewares/checkRole";
import { authenticate } from "../middlewares/auth.middleware";

const router: Router = Router();

router.post("/createclass", authenticate, checkRole(["teacher", "admin"]), controller.createClass);
router.get("/getallclasses", controller.getAllClasses);
router.get("/getclass/:id", controller.getClassById);
router.put("/updateclass/:id", authenticate, checkRole(["teacher", "admin"]), controller.updateClass);
router.delete("/deleteclass/:id", authenticate,checkRole(["teacher", "admin"]), controller.deleteClass);


export const classRoutes: Router = router;