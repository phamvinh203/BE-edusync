"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const decodeToken = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Thiếu token xác thực');
    }
    const token = authHeader.split(' ')[1];
    return jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'default_secret');
};
exports.decodeToken = decodeToken;
