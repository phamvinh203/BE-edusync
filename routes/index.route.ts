import { Express } from "express";
import { authRoutes }  from "./auth.route";
import { userRoutes } from "./user.route";
import { classRoutes } from "./class.route";
import { exerciseRoutes } from "./exercises.route";


const mainRoutes = (app: Express): void => {
    const version = "/api";

    app.use(`${version}/auth`, authRoutes);
    app.use(`${version}/users`, userRoutes);
    app.use(`${version}/classes`, classRoutes);
    app.use(`${version}/exercises`, exerciseRoutes);


}

export default mainRoutes;