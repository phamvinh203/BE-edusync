"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.classRoutes = void 0;
const express_1 = require("express");
const controller = __importStar(require("../controllers/class.controller"));
const checkRole_1 = require("../middlewares/checkRole");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post('/createclass', auth_middleware_1.authenticate, (0, checkRole_1.checkRole)(['teacher', 'admin']), controller.createClass);
router.get('/getallclasses', controller.getAllClasses);
router.get('/getclass/:id', controller.getClassById);
router.put('/updateclass/:id', auth_middleware_1.authenticate, (0, checkRole_1.checkRole)(['teacher', 'admin']), controller.updateClass);
router.delete('/deleteclass/:id', auth_middleware_1.authenticate, (0, checkRole_1.checkRole)(['teacher', 'admin']), controller.deleteClass);
router.post('/joinclass/:id', auth_middleware_1.authenticate, controller.joinClass);
router.get('/getStudentsByClass/:classId', auth_middleware_1.authenticate, controller.getStudentsByClass);
router.get('/:classId/getPendingStudentsByClass', auth_middleware_1.authenticate, (0, checkRole_1.checkRole)(['teacher', 'admin']), controller.getPendingStudents);
router.post('/:classId/approveStudent/:studentId', auth_middleware_1.authenticate, (0, checkRole_1.checkRole)(['teacher', 'admin']), controller.approveStudent);
exports.classRoutes = router;
