"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restrictTo = exports.authenticate = void 0;
const decodeToken_1 = require("../helpers/decodeToken");
const auth_model_1 = __importDefault(require("../models/auth.model"));
const authenticate = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const decoded = (0, decodeToken_1.decodeToken)(req.headers.authorization);
        const authUser = yield auth_model_1.default.findOne({ email: decoded.email, deleted: false });
        if (!authUser) {
            return res.status(404).json({ message: 'Người dùng không tồn tại hoặc đã bị xóa' });
        }
        req.user = Object.assign(Object.assign({}, decoded), { _id: authUser._id, role: authUser.role });
        next();
    }
    catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token đã hết hạn' });
        }
        return res.status(403).json({ message: 'Token không hợp lệ' });
    }
});
exports.authenticate = authenticate;
const restrictTo = (...roles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user || !roles.includes(user.role)) {
            return res.status(403).json({ message: 'Không có quyền truy cập' });
        }
        next();
    };
};
exports.restrictTo = restrictTo;
