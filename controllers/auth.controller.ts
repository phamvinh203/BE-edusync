import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Auth from "../models/auth.model";
import ForgotPassword from "../models/forgot-password.model";
import { generateOTP } from "../helpers/generate";
import { sendMail } from "../helpers/sendMail";
import User from "../models/auth.model";
import { sendError, sendSuccess } from "../helpers/response";
import { createTokens } from "../helpers/token";
import { decodeToken } from "../helpers/decodeToken";

//POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
      return;
    }

    // Kiểm tra email đã tồn tại
    const emailExit = await Auth.findOne({ email });
    if (emailExit) {
      res.status(400).json({ message: "Email đã tồn tại" });
      return;
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    const allowedRoles = ["student", "teacher"];
    const safeRole = allowedRoles.includes(role) ? role : "student";

    const authUser = await Auth.create({
      username,
      email,
      password: hashedPassword,
      role: safeRole,
    });

    await User.create({
      authId: authUser._id,
      username,
      email,
    });

    sendSuccess(res, {
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
  } catch (error) {
    console.error(error);
    sendError(res, 500, "Lỗi server");
  }
};

//POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return sendError(res, 400, "Vui lòng nhập email và mật khẩu");
    }

    // 2. Tìm user
    const user = await Auth.findOne({ email });
    if (!user) {
      return sendError(res, 401, "Email hoặc mật khẩu không đúng");
    }

    // 3. Kiểm tra role được phép login
    const allowedRoles = ["student", "teacher"];
    if (!allowedRoles.includes(user.role)) {
      return sendError(res, 403, `Tài khoản role '${user.role}' không được phép đăng nhập`);
    }

    // 4. Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password || "");
    if (!isPasswordValid) {
      return sendError(res, 401, "Email hoặc mật khẩu không đúng");
    }

    // 5. Tạo token
    const { access_token, refresh_token } = createTokens(user);

    // Lưu refresh token (nếu bạn muốn cho 1 user chỉ đăng nhập trên 1 device)
    user.refresh_token = refresh_token;
    await user.save();

    // 6. Trả về response chuẩn
    return sendSuccess(res, {
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
  } catch (error) {
    console.error(error);
    return sendError(res, 500, "Lỗi server");
  }
};

//POST /api/auth/refresh-token
export const refreshToken = (req: Request, res: Response) => {
  const { refresh_token } = req.body;

  if (!refresh_token) return sendError(res, 401, "Không có refresh token");

  try {
    // Xác minh refresh token
    const decoded = jwt.verify(refresh_token, process.env.JWT_SECRET!);

    // Tạo lại access token mới
    const access_token = jwt.sign(
      {
        userId: (decoded as any).userId,
        email: (decoded as any).email,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" }
    );

     sendSuccess(res, { access_token });
  } catch (error) {
    sendError(res, 403, "Refresh token không hợp lệ hoặc đã hết hạn");
  }
};

//POST /api/auth/logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.body;

  const user = await Auth.findById(userId);
  if (user) {
    user.refresh_token = "";
    await user.save();
  }

  sendSuccess(res, { message: "Đăng xuất thành công" });
};

//POST /api/auth/password/forgot
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const email = req.body.email;

    const authUser = await Auth.findOne({ email, deleted: false });

    if (!authUser) {
      sendError(res, 400, "Email không tồn tại");
      return;
    }

    const otp: string = generateOTP();
    const otpExpireMinutes = 5;

    // Lưu OTP vào DB
    const forgotPasswordData = new ForgotPassword({
      email,
      otp,
      otpExpire: Date.now() + otpExpireMinutes * 60 * 1000,
    });

    await forgotPasswordData.save();

    // Gửi email
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
    await sendMail(email, subject, html);

    sendSuccess(res, { code: 200, message: "OTP đã được gửi đến email" });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    sendError(res, 500, "Lỗi server");
  }
};

// [POST] /api/users/password/otp
export const otpPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email, otp } = req.body;

  try {
    // Tìm OTP tương ứng
    const result = await ForgotPassword.findOne({ email, otp });
    if (!result) {
      sendError(res, 404, "Người dùng không tồn tại");
      return;
    }

    const user = await Auth.findOne({ email });
    if (!user) {
      res.status(404).json({ message: "Người dùng không tồn tại" });
      return;
    }

    // Tạo access token mới
    const access_token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "15m" }
    );

    sendSuccess(res, {
      code: 200,
      message: "Xác thực OTP thành công",
      access_token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    sendError(res, 500, "Lỗi server");
  }
};

//POST /api/auth/password/reset
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const decoded = decodeToken (req.headers.authorization);
    const { email } = decoded;
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      sendError(res, 400, "Vui lòng nhập đầy đủ mật khẩu mới");
      return;
    }
    if (newPassword !== confirmPassword) {
      sendError(res, 400, "Mật khẩu xác nhận không khớp");
      return;
    }

    const user = await Auth.findOne({ email });
    if (!user) {
      sendError(res, 404, "Người dùng không tồn tại");
      return;
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    await ForgotPassword.deleteMany({ email });

    sendSuccess(res, { message: "Đổi mật khẩu thành công" });
  } catch (error) {
    sendError(res, 403, "Token không hợp lệ hoặc đã hết hạn");
  }
};
