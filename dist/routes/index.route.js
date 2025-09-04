"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_route_1 = require("./auth.route");
const user_route_1 = require("./user.route");
const mainRoutes = (app) => {
    const version = "/api";
    app.use(`${version}/auth`, auth_route_1.authRoutes);
    app.use(`${version}/users`, user_route_1.userRoutes);
};
exports.default = mainRoutes;
