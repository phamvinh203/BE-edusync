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
exports.resetPassword = exports.otpPassword = exports.forgotPassword = exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_model_1 = __importDefault(require("../models/auth.model"));
const forgot_password_model_1 = __importDefault(require("../models/forgot-password.model"));
const generate_1 = require("../helpers/generate");
const sendMail_1 = require("../helpers/sendMail");
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password } = req.body;
        const emailExit = yield auth_model_1.default.findOne({ email });
        if (emailExit) {
            res.status(400).json({ message: "Email đã tồn tại" });
            return;
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const user = new auth_model_1.default({ username, email, password: hashedPassword });
        yield user.save();
        res
            .status(201)
            .json({ message: "Đăng ký thành công", user: { username, email } });
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield auth_model_1.default.findOne({
            email: email,
        });
        if (!user) {
            res.status(404).json({ message: "Email hoặc mật khẩu không đúng" });
            return;
        }
        const isPasswordValid = yield bcrypt_1.default.compare(password, user.password || "");
        if (!isPasswordValid) {
            return res
                .status(400)
                .json({ message: "Email hoặc mật khẩu không đúng" });
        }
        const access_token = jsonwebtoken_1.default.sign({
            email: user.email,
            username: user.username,
        }, process.env.JWT_SECRET || "default", { expiresIn: "15m" });
        const refresh_token = jsonwebtoken_1.default.sign({
            userId: user._id,
            email: user.email,
        }, process.env.JWT_SECRET, { expiresIn: "7d" });
        user.refresh_token = refresh_token;
        yield user.save();
        res.status(200).json({
            message: "Đăng nhập thành công",
            access_token,
            refresh_token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }
});
exports.login = login;
const refreshToken = (req, res) => {
    const { refresh_token } = req.body;
    if (!refresh_token) {
        res.status(401).json({ message: "Không có refresh token" });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(refresh_token, process.env.JWT_SECRET);
        const access_token = jsonwebtoken_1.default.sign({
            userId: decoded.userId,
            email: decoded.email,
        }, process.env.JWT_SECRET, { expiresIn: "15m" });
        res.status(200).json({
            access_token,
        });
    }
    catch (error) {
        res
            .status(403)
            .json({ message: "Refresh token không hợp lệ hoặc đã hết hạn" });
    }
};
exports.refreshToken = refreshToken;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.body;
    const user = yield auth_model_1.default.findById(userId);
    if (user) {
        user.refresh_token = "";
        yield user.save();
    }
    res.status(200).json({ message: "Đăng xuất thành công" });
});
exports.logout = logout;
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = req.body.email;
        const authUser = yield auth_model_1.default.findOne({ email, deleted: false });
        if (!authUser) {
            res.status(400).json({ message: "email dóe not exits" });
            return;
        }
        const otp = (0, generate_1.generateOTP)();
        const otpExpireMinutes = 5;
        const forgotPasswordData = new forgot_password_model_1.default({
            email,
            otp,
            otpExpire: Date.now() + otpExpireMinutes * 60 * 1000,
        });
        yield forgotPasswordData.save();
        const subject = "Mã OTP quên mật khẩu của bạn";
        const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Yêu cầu quên mật khẩu</h2>
        <p>Mã OTP của bạn là:</p>
        <div style="
          font-size: 24px;
          font-weight: bold;
          background-color: #f2f2f2;
          padding: 10px 20px;
          display: inline-block;
          border-radius: 6px;
        ">${otp}</div>
        <p>Mã có hiệu lực trong 5 phút.</p>
        <br/>
        <p>Trân trọng,<br/>Hệ thống EduSync</p>
      </div>
      `;
        yield (0, sendMail_1.sendMail)(email, subject, html);
        res.json({
            code: 200,
            message: 'OTP has been sent to your email',
        });
    }
    catch (error) {
        console.error("Error in forgotPassword:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
});
exports.forgotPassword = forgotPassword;
const otpPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp } = req.body;
    try {
        const result = yield forgot_password_model_1.default.findOne({ email, otp });
        if (!result) {
            res.status(400).json({ message: "OTP không hợp lệ" });
            return;
        }
        const user = yield auth_model_1.default.findOne({ email });
        if (!user) {
            res.status(404).json({ message: "Người dùng không tồn tại" });
            return;
        }
        const access_token = jsonwebtoken_1.default.sign({
            userId: user._id,
            email: user.email,
        }, process.env.JWT_SECRET || "default_secret", { expiresIn: "15m" });
        res.json({
            code: 200,
            message: "Xác thực OTP thành công",
            access_token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    }
    catch (error) {
        console.error("OTP verify error:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
});
exports.otpPassword = otpPassword;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
    }
    catch (error) {
        console.error("Error in resetPassword:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
});
exports.resetPassword = resetPassword;
