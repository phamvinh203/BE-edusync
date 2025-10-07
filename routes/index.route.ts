import { Express } from "express";
import { authRoutes }  from "./auth.route";
import { userRoutes } from "./user.route";
import { classRoutes } from "./class.route";
import { exerciseRoutes } from "./exercises.route";
import { attendanceRoutes } from "./attendance.route";
import { adminRoutes } from "./admin.route";


const mainRoutes = (app: Express): void => {
    const version = "/api";

    app.use(`${version}/auth`, authRoutes);
    app.use(`${version}/users`, userRoutes);
    app.use(`${version}/classes`, classRoutes);
    app.use(`${version}/exercises`, exerciseRoutes);
    app.use(`${version}/attendance`, attendanceRoutes);

    app.use(`${version}/admin`, adminRoutes);


}

export default mainRoutes;