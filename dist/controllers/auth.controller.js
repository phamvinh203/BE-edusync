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
const auth_model_2 = __importDefault(require("../models/auth.model"));
const response_1 = require("../helpers/response");
const token_1 = require("../helpers/token");
const decodeToken_1 = require("../helpers/decodeToken");
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password, role } = req.body;
        if (!username || !email || !password) {
            res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
            return;
        }
        const emailExit = yield auth_model_1.default.findOne({ email });
        if (emailExit) {
            res.status(400).json({ message: "Email đã tồn tại" });
            return;
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const allowedRoles = ["student", "teacher"];
        const safeRole = allowedRoles.includes(role) ? role : "student";
        const authUser = yield auth_model_1.default.create({
            username,
            email,
            password: hashedPassword,
            role: safeRole,
        });
        yield auth_model_2.default.create({
            authId: authUser._id,
            username,
            email,
        });
        (0, response_1.sendSuccess)(res, {
            success: true,
            message: "Đăng ký thành công",
            data: {
                user: {
                    id: authUser._id,
                    username: authUser.username,
                    email: authUser.email,
                    role: authUser.role,
                },
            },
        });
    }
    catch (error) {
        console.error(error);
        (0, response_1.sendError)(res, 500, "Lỗi server");
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return (0, response_1.sendError)(res, 400, "Vui lòng nhập email và mật khẩu");
        }
        const user = yield auth_model_1.default.findOne({ email });
        if (!user) {
            return (0, response_1.sendError)(res, 401, "Email hoặc mật khẩu không đúng");
        }
        const allowedRoles = ["student", "teacher"];
        if (!allowedRoles.includes(user.role)) {
            return (0, response_1.sendError)(res, 403, `Tài khoản role '${user.role}' không được phép đăng nhập`);
        }
        const isPasswordValid = yield bcrypt_1.default.compare(password, user.password || "");
        if (!isPasswordValid) {
            return (0, response_1.sendError)(res, 401, "Email hoặc mật khẩu không đúng");
        }
        const { access_token, refresh_token } = (0, token_1.createTokens)(user);
        user.refresh_token = refresh_token;
        yield user.save();
        return (0, response_1.sendSuccess)(res, {
            success: true,
            message: "Đăng nhập thành công",
            data: {
                access_token,
                refresh_token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                },
            },
        });
    }
    catch (error) {
        console.error(error);
        return (0, response_1.sendError)(res, 500, "Lỗi server");
    }
});
exports.login = login;
const refreshToken = (req, res) => {
    const { refresh_token } = req.body;
    if (!refresh_token)
        return (0, response_1.sendError)(res, 401, "Không có refresh token");
    try {
        const decoded = jsonwebtoken_1.default.verify(refresh_token, process.env.JWT_SECRET);
        const access_token = jsonwebtoken_1.default.sign({
            userId: decoded.userId,
            email: decoded.email,
        }, process.env.JWT_SECRET, { expiresIn: "15m" });
        (0, response_1.sendSuccess)(res, { access_token });
    }
    catch (error) {
        (0, response_1.sendError)(res, 403, "Refresh token không hợp lệ hoặc đã hết hạn");
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
    (0, response_1.sendSuccess)(res, { message: "Đăng xuất thành công" });
});
exports.logout = logout;
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = req.body.email;
        const authUser = yield auth_model_1.default.findOne({ email, deleted: false });
        if (!authUser) {
            (0, response_1.sendError)(res, 400, "Email không tồn tại");
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
        (0, response_1.sendSuccess)(res, { code: 200, message: "OTP đã được gửi đến email" });
    }
    catch (error) {
        console.error("Error in forgotPassword:", error);
        (0, response_1.sendError)(res, 500, "Lỗi server");
    }
});
exports.forgotPassword = forgotPassword;
const otpPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp } = req.body;
    try {
        const result = yield forgot_password_model_1.default.findOne({ email, otp });
        if (!result) {
            (0, response_1.sendError)(res, 404, "Người dùng không tồn tại");
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
        (0, response_1.sendSuccess)(res, {
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
        (0, response_1.sendError)(res, 500, "Lỗi server");
    }
});
exports.otpPassword = otpPassword;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const decoded = (0, decodeToken_1.decodeToken)(req.headers.authorization);
        const { email } = decoded;
        const { newPassword, confirmPassword } = req.body;
        if (!newPassword || !confirmPassword) {
            (0, response_1.sendError)(res, 400, "Vui lòng nhập đầy đủ mật khẩu mới");
            return;
        }
        if (newPassword !== confirmPassword) {
            (0, response_1.sendError)(res, 400, "Mật khẩu xác nhận không khớp");
            return;
        }
        const user = yield auth_model_1.default.findOne({ email });
        if (!user) {
            (0, response_1.sendError)(res, 404, "Người dùng không tồn tại");
            return;
        }
        user.password = yield bcrypt_1.default.hash(newPassword, 10);
        yield user.save();
        yield forgot_password_model_1.default.deleteMany({ email });
        (0, response_1.sendSuccess)(res, { message: "Đổi mật khẩu thành công" });
    }
    catch (error) {
        (0, response_1.sendError)(res, 403, "Token không hợp lệ hoặc đã hết hạn");
    }
});
exports.resetPassword = resetPassword;
