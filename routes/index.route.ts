import { Express } from "express";
import { authRoutes }  from "./auth.route";
import { userRoutes } from "./user.route";

const mainRoutes = (app: Express): void => {
    const version = "/api";

    app.use(`${version}/auth`, authRoutes);
    app.use(`${version}/users`, userRoutes);

}

export default mainRoutes;