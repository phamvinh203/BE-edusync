import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import Auth from '../models/auth.model';
import ClassModel from '../models/class.model';
import User from '../models/user.model';
import { sendError, sendSuccess } from '../helpers/response';
import { generateJoinCode } from '../helpers/generateJoinCode';

export const createTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    // validate input
    if (!username || !email || !password) {
      sendError(res, 400, 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    // kiểm tra email đã tồn tại
    const existingUser = await Auth.findOne({ email });
    if (existingUser) {
      sendError(res, 400, 'Email đã tồn tại');
      return;
    }

    // mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // tạo tài khoản giáo viên
    const authUser = await Auth.create({
      username,
      email,
      password: hashedPassword,
      role: 'teacher',
    });

    // tạo thông tin người dùng
    const teacherProfile = await User.create({
      authId: authUser._id,
      username,
      email,
    });

    sendSuccess(res, {
      success: true,
      message: 'Tạo tài khoản giáo viên thành công',
      data: {
        teacherId: teacherProfile._id,
        auth: {
          _id: authUser._id,
          username: authUser.username,
          email: authUser.email,
          role: authUser.role,
          createdAt: authUser.createdAt,
        },
        profile: {
          _id: teacherProfile._id,
          authId: teacherProfile.authId,
          username: teacherProfile.username,
          email: teacherProfile.email,
          createdAt: teacherProfile.createdAt,
        },
      },
    });
  } catch (error) {
    console.error(error);
    sendError(res, 500, 'Lỗi server');
  }
};

// 1️⃣ Lấy toàn bộ lớp học (mặc định 10/lần)
// GET /admin/getallClasses?page=1&limit=10

// 2️⃣ Lọc theo môn học Toán
// GET /admin/getallClasses?subject=toan

// 3️⃣ Lọc theo giáo viên cụ thể
// GET /admin/getallClasses?teacherId=671a4562ef...

// 4️⃣ Kết hợp nhiều filter
// GET /admin/getallClasses?subject=Van&teacherId=671a4562ef...&page=2&limit=5
export const getAllClasses = async (req: Request, res: Response): Promise<void> => {
  try {
    // 📌 Lấy query parameters
    const { subject, teacherId, page = 1, limit = 10 } = req.query;

    // 📌 Tạo điều kiện lọc
    const filter: any = { deleted: { $ne: true } };

    if (subject) {
      // tìm gần đúng, không phân biệt hoa thường
      filter.subject = { $regex: new RegExp(subject as string, 'i') };
    }

    if (teacherId) {
      filter.teacherId = teacherId;
    }

    // 📌 Tính toán phân trang
    const pageNumber = parseInt(page as string) || 1;
    const limitNumber = parseInt(limit as string) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    // 📌 Đếm tổng số lớp
    const total = await ClassModel.countDocuments(filter);

    // 📌 Lấy danh sách lớp
    const classes = await ClassModel.find(filter)
      .populate('teacherId', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    sendSuccess(res, {
      success: true,
      message: 'Lấy danh sách lớp học thành công',
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
      data: classes,
    });
  } catch (error) {
    console.error('Error in getAllClasses:', error);
    sendError(res, 500, 'Lỗi server khi lấy danh sách lớp học');
  }
};

export const getClassesByTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teacherId } = req.params;

    if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
      sendError(res, 400, 'teacherId không hợp lệ');
      return;
    }

    const teacherDoc: any = await User.findOne({
      _id: teacherId,
      deleted: { $ne: true },
    }).populate({ path: 'authId', select: 'role email deleted' });

    if (!teacherDoc || !teacherDoc.authId || teacherDoc.authId.deleted) {
      sendError(res, 404, 'Không tìm thấy giáo viên');
      return;
    }

    if (teacherDoc.authId.role !== 'teacher') {
      sendError(res, 400, 'Tài khoản này không phải giáo viên');
      return;
    }

    const classes = await ClassModel.find({
      teacherId: teacherDoc._id,
      deleted: { $ne: true },
    })
      .populate('teacherId', 'username email')
      .sort({ createdAt: -1 });

    sendSuccess(res, {
      success: true,
      message: 'Lấy danh sách lớp học theo giáo viên thành công',
      teacher: {
        _id: teacherDoc._id,
        username: teacherDoc.username,
        email: teacherDoc.email,
      },
      total: classes.length,
      data: classes,
    });
  } catch (error) {
    console.error('Error in getClassesByTeacher:', error);
    sendError(res, 500, 'Lỗi server');
  }
};

// 1️⃣ Lấy danh sách mặc định (10 giáo viên đầu tiên)
// GET /admin/all-teacher

// 2️⃣ Phân trang
// GET /admin/all-teacher?page=2&limit=5

// 3️⃣ Tìm kiếm theo tên hoặc email
// GET /admin/all-teacher?search=nguyen

// Lấy toàn bộ giáo viên
export const getAllTeachers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page as string) || 1;
    const limitNumber = parseInt(limit as string) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    // Tạo điều kiện lọc cho tài khoản role=teacher
    const filter: any = { role: 'teacher', deleted: { $ne: true } };

    // Nếu admin muốn tìm theo tên hoặc email
    if (search) {
      const keyword = new RegExp(search as string, 'i');
      filter.$or = [{ username: keyword }, { email: keyword }];
    }

    // Lấy danh sách tài khoản giáo viên
    const teachers = await Auth.find(filter)
      .select('username email role createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    // Đếm tổng số giáo viên
    const total = await Auth.countDocuments(filter);

    // Lấy thêm thông tin từ collection User (nếu cần)
    const teacherIds = teachers.map((t) => t._id);
    const userProfiles = await User.find({
      authId: { $in: teacherIds },
      deleted: { $ne: true },
    }).select('authId username email avatar');

    // Map thông tin user với auth
    const mergedTeachers = teachers.map((t) => {
      const profile = userProfiles.find((u) => u.authId.toString() === t._id.toString());
      return {
        _id: t._id,

        // the teacherId is the User profile _id created in createTeacher
        teacherId: profile?._id || null,
        username: profile?.username || t.username,
        email: t.email,
        avatar: profile?.avatar || null,
        role: t.role,
        createdAt: t.createdAt,
      };
    });

    sendSuccess(res, {
      success: true,
      message: 'Lấy danh sách giáo viên thành công',
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
      data: mergedTeachers,
    });
  } catch (error) {
    console.error('Error in getAllTeachers:', error);
    sendError(res, 500, 'Lỗi server khi lấy danh sách giáo viên');
  }
};

// tạo lớp học cho giáo viên từ admin
export const createClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const admin = req.user as any;
    const { teacherId } = req.params;
    const { nameClass, subject, description, schedule, location, maxStudents, gradeLevel } =
      req.body;

    if (!nameClass || !subject) {
      sendError(res, 400, 'Vui lòng nhập tên lớp và môn học');
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      sendError(res, 400, 'teacherId không hợp lệ');
      return;
    }

    if (gradeLevel && (typeof gradeLevel !== 'string' || !gradeLevel.trim())) {
      sendError(res, 400, 'Cấp lớp phải là chuỗi hợp lệ');
      return;
    }

    const parsedMaxStudents = maxStudents !== undefined ? Number(maxStudents) : undefined;
    if (
      parsedMaxStudents !== undefined &&
      (!Number.isFinite(parsedMaxStudents) ||
        parsedMaxStudents <= 0 ||
        !Number.isInteger(parsedMaxStudents))
    ) {
      sendError(res, 400, 'Số lượng học sinh tối đa phải là số nguyên dương');
      return;
    }

    const teacherDoc: any = await User.findOne({ _id: teacherId, deleted: { $ne: true } }).populate(
      'authId',
      'role email',
    );
    if (!teacherDoc || !teacherDoc.authId) {
      sendError(res, 404, 'Không tìm thấy giáo viên');
      return;
    }

    if (teacherDoc.authId.role !== 'teacher') {
      sendError(res, 400, 'Tài khoản này không phải giáo viên');
      return;
    }

    let classCode: string;
    do {
      classCode = generateJoinCode(6);
    } while (await ClassModel.findOne({ classCode }));

    const joinLink = `/join/class/${classCode}`;

    const newClass = await ClassModel.create({
      nameClass,
      subject,
      type: 'regular',
      description,
      schedule,
      location,
      maxStudents: parsedMaxStudents,
      gradeLevel,
      classCode,
      joinLink,
      teacherId: teacherDoc._id,
      createdBy: admin?._id,
      pendingStudents: [],
      students: [],
    });

    sendSuccess(res, {
      success: true,
      message: 'Tạo lớp học thành công cho giáo viên',
      data: newClass,
    });
  } catch (error) {
    console.error('Error in createClass:', error);
    sendError(res, 500, 'Lỗi server khi tạo lớp học');
  }
};
