import { Express } from "express";
import { authRoutes }  from "./auth.route";

const mainRoutes = (app: Express): void => {
    const version = "/api/v1";

    app.use(`${version}/auth`, authRoutes)
}

export default mainRoutes;