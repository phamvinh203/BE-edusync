"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_route_1 = require("./auth.route");
const user_route_1 = require("./user.route");
const class_route_1 = require("./class.route");
const exercises_route_1 = require("./exercises.route");
const attendance_route_1 = require("./attendance.route");
const admin_route_1 = require("./admin.route");
const mainRoutes = (app) => {
    const version = "/api";
    app.use(`${version}/auth`, auth_route_1.authRoutes);
    app.use(`${version}/users`, user_route_1.userRoutes);
    app.use(`${version}/classes`, class_route_1.classRoutes);
    app.use(`${version}/exercises`, exercises_route_1.exerciseRoutes);
    app.use(`${version}/attendance`, attendance_route_1.attendanceRoutes);
    app.use(`${version}/admin`, admin_route_1.adminRoutes);
};
exports.default = mainRoutes;
