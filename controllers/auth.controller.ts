import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Auth from "../models/auth.model";
import ForgotPassword from "../models/forgot-password.model";
import { generateOTP } from "../helpers/generate";
import { sendMail } from "../helpers/sendMail";

//POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    // Kiểm tra email đã tồn tại
    const emailExit = await Auth.findOne({ email });
    if (emailExit) {
      res.status(400).json({ message: "Email đã tồn tại" });
      return;
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new Auth({ username, email, password: hashedPassword });
    await user.save();

    res
      .status(201)
      .json({ message: "Đăng ký thành công", user: { username, email } });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

//POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // tìm người dùng
    const user = await Auth.findOne({
      email: email,
    });

    if (!user) {
      res.status(404).json({ message: "Email hoặc mật khẩu không đúng" });
      return;
    }

    // So sánh mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password || "");
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ message: "Email hoặc mật khẩu không đúng" });
    }

    // Tạo Access Token
    const access_token = jwt.sign(
      {
        email: user.email,
        username: user.username,
      },
      process.env.JWT_SECRET || "default",
      { expiresIn: "15m" }
    );

    // Tạo Refresh Token
    const refresh_token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    user.refresh_token = refresh_token;
    await user.save();

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
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

//POST /api/auth/refresh-token
export const refreshToken = (req: Request, res: Response): void => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    res.status(401).json({ message: "Không có refresh token" });
    return;
  }

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

    res.status(200).json({
      access_token,
    });
  } catch (error) {
    res
      .status(403)
      .json({ message: "Refresh token không hợp lệ hoặc đã hết hạn" });
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

  res.status(200).json({ message: "Đăng xuất thành công" });
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
      res.status(400).json({ message: "email dóe not exits" });
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

    res.json({
      code: 200,
      message: 'OTP has been sent to your email',
    });

  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(500).json({ message: "Lỗi server" });
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
      res.status(400).json({ message: "OTP không hợp lệ" });
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
  } catch (error) {
    console.error("OTP verify error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

//POST /api/auth/password/reset
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
 

  try {

  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
