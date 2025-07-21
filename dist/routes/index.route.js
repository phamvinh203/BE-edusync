"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_route_1 = require("./auth.route");
const mainRoutes = (app) => {
    const version = "/api/v1";
    app.use(`${version}/auth`, auth_route_1.authRoutes);
};
exports.default = mainRoutes;
