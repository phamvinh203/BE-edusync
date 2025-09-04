import { decodeToken } from '../helpers/decodeToken';
import { Request, Response, NextFunction } from 'express';
import Auth from '../models/auth.model';

declare global {
  namespace Express {
    interface Request {
      user?: {
        email: string;
        role: 'admin' | 'teacher' | 'student';
        _id: string;
        [key: string]: any;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded: any = decodeToken(req.headers.authorization);

    const authUser = await Auth.findOne({ email: decoded.email, deleted: false });
    if (!authUser) {
      return res.status(404).json({ message: 'Người dùng không tồn tại hoặc đã bị xóa' });
    }

    req.user = { ...decoded, _id: authUser._id, role: authUser.role };
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token đã hết hạn' });
    }
    return res.status(403).json({ message: 'Token không hợp lệ' });
  }
};

// Middleware kiểm tra vai trò
export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }
    next();
  };
};
