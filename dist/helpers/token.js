"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTokens = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const createTokens = (user) => {
    const access_token = jsonwebtoken_1.default.sign({ email: user.email, username: user.username, role: user.role }, process.env.JWT_SECRET || "default_secret", { expiresIn: "15m" });
    const refresh_token = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || "default_secret", { expiresIn: "7d" });
    return { access_token, refresh_token };
};
exports.createTokens = createTokens;
