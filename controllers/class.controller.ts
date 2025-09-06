import { Request, Response } from 'express';
import ClassModel from '../models/class.model';
import mongoose from 'mongoose';
import User from '../models/user.model';

// tạo lớp học (teacher)
export const createClass = async (req: Request, res: Response) => {
  try {
    const { nameClass, subject, description, schedule, location, maxStudents } = req.body;
    const user = req.user as any;

    // Chỉ giáo viên mới được tạo lớp
    if (!user || user.role !== 'teacher') {
      return res.status(403).json({ message: 'Chỉ giáo viên mới có quyền tạo lớp học' });
    }

    // Lấy user profile (trong collection users) để gán teacherId
    const teacherUser = await User.findOne({ authId: user._id, deleted: false });
    if (!teacherUser) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin giáo viên' });
    }

    const newClass = await ClassModel.create({
      nameClass,
      subject,
      description,
      schedule,
      location,
      maxStudents,
      teacherId: teacherUser._id, // 👈 luôn dùng user._id
      createdBy: user._id, // 👈 đây là id trong bảng auth (người tạo)
    });

    return res.status(201).json({ message: 'Tạo lớp học thành công', data: newClass });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi server', error: err });
  }
};

// xem danh sách lớp học
export const getAllClasses = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;

    // Kiểm tra user có tồn tại không
    if (!user) {
      return res.status(401).json({ message: 'Người dùng chưa được xác thực' });
    }

    // console.log('User info in getAllClasses:', { userId: user._id, role: user.role });

    // Nếu là giáo viên: chỉ thấy các lớp do mình tạo
    if (user?.role === 'teacher') {
      const teacherUser = await User.findOne({ authId: user._id, deleted: false });
      if (!teacherUser) {
        return res.status(404).json({ message: 'Không tìm thấy thông tin giáo viên' });
      }
      const classes = await ClassModel.find({
        teacherId: teacherUser._id,
        deleted: { $ne: true },
      }).populate('teacherId', 'username email');
      return res.status(200).json({
        message: 'Lấy danh sách lớp học của giáo viên thành công',
        data: classes,
      });
    }

    // Nếu là học sinh: thấy tất cả lớp và kèm tên giáo viên
    if (user?.role === 'student') {
      const classes = await ClassModel.find({ deleted: { $ne: true } }).populate(
        'teacherId',
        'username email',
      );
      return res.status(200).json({
        message: 'Lấy danh sách tất cả lớp học thành công',
        data: classes,
      });
    }

    // Nếu là admin: thấy tất cả lớp học
    if (user?.role === 'admin') {
      const classes = await ClassModel.find({ deleted: { $ne: true } }).populate(
        'teacherId',
        'username email',
      );
      return res.status(200).json({
        message: 'Lấy danh sách tất cả lớp học thành công',
        data: classes,
      });
    }

    // Nếu không có role hợp lệ
    console.log('Invalid role detected:', user.role);
    return res.status(403).json({
      message: 'Bạn không có quyền truy cập',
      userRole: user.role,
      validRoles: ['teacher', 'student', 'admin'],
    });
  } catch (err) {
    console.error('Error in getAllClasses:', err);
    return res.status(500).json({ message: 'Lỗi server', error: err });
  }
};

// xem lớp học
export const getClassById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const foundClass = await ClassModel.findById(id);
    if (!foundClass) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học' });
    }
    return res.status(200).json({ message: 'Lấy thông tin lớp học thành công', data: foundClass });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi server', error: err });
  }
};

// sửa thông tin lớp học (teacher)
export const updateClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as any;
    const updateData = req.body;
    const foundClass = await ClassModel.findById(id);
    if (!foundClass) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học' });
    }
    // Chỉ giáo viên tạo lớp mới được sửa
    const teacherUser = await User.findOne({ authId: user._id, deleted: false });
    if (!teacherUser) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin giáo viên' });
    }

    if (String(foundClass.teacherId) !== String(teacherUser._id)) {
      return res.status(403).json({ message: 'Bạn không có quyền sửa lớp học này' });
    }
    const updatedClass = await ClassModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    return res.status(200).json({ message: 'Cập nhật lớp học thành công', data: updatedClass });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi server', error: err });
  }
};

// xóa lớp học (teacher)
export const deleteClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as any;
    const foundClass = await ClassModel.findById(id);
    if (!foundClass) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học' });
    }
    // Chỉ giáo viên tạo lớp mới được xóa
    const teacherUser = await User.findOne({ authId: user._id, deleted: false });
    if (!teacherUser) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin giáo viên' });
    }

    if (String(foundClass.teacherId) !== String(teacherUser._id)) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa lớp học này' });
    }
    await ClassModel.findByIdAndDelete(id);
    return res.status(200).json({ message: 'Xóa lớp học thành công' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi server', error: err });
  }
};

// xem danh sách học sinh đã tham gia lớp
export const getStudentsByClass = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const user = req.user as any;

    // Tìm lớp và populate học sinh + giáo viên
    const foundClass = await ClassModel.findById(classId)
      .populate('teacherId', 'username email')
      .populate('students', 'username email');

    if (!foundClass) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học' });
    }

    // Lấy thông tin user hiện tại
    const currentUser = await User.findOne({ authId: user._id, deleted: false });
    if (!currentUser) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng' });
    }

    const isOwnerTeacher = String(foundClass.teacherId._id) === String(currentUser._id);
    const isAdmin = user.role === 'admin';
    const isStudentInClass = foundClass.students.some(
      (stu: any) => String(stu._id) === String(currentUser._id),
    );

    if (!isOwnerTeacher && !isAdmin && !isStudentInClass) {
      return res.status(403).json({
        message: 'Bạn không có quyền xem danh sách học sinh lớp này',
      });
    }

    return res.status(200).json({
      message: 'Danh sách học sinh trong lớp',
      teacher: foundClass.teacherId,
      students: foundClass.students || [],
    });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi server', error: err });
  }
};

// học sinh đăng ký lớp học (student) -> thêm vào pendingStudents
export const joinClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as any;

    const foundClass = await ClassModel.findById(id);
    if (!foundClass) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học' });
    }

    // Lấy thông tin user hiện tại
    const currentUser = await User.findOne({ authId: user._id, deleted: false });
    if (!currentUser) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng' });
    }

    // Kiểm tra nếu user là giáo viên của lớp này
    if (String(foundClass.teacherId) === String(currentUser._id)) {
      return res.status(400).json({ message: 'Bạn không thể đăng ký vào lớp do chính mình tạo' });
    }

    // Kiểm tra nếu học sinh đã tham gia lớp
    if (foundClass.students.includes(currentUser._id)) {
      return res.status(400).json({ message: 'Bạn đã tham gia lớp này' });
    }

    // Nếu đã gửi đăng ký trước đó
    if (foundClass.pendingStudents.includes(currentUser._id)) {
      return res.status(400).json({ message: 'Bạn đã gửi yêu cầu tham gia lớp này' });
    }

    // Kiểm tra giới hạn số lượng học sinh (tổng số đã được duyệt + đang chờ)
    const totalStudents = foundClass.students.length + foundClass.pendingStudents.length;
    if (foundClass.maxStudents && totalStudents >= foundClass.maxStudents) {
      return res.status(400).json({
        message: 'Lớp học đã đầy. Không thể đăng ký thêm',
        details: {
          maxStudents: foundClass.maxStudents,
          currentStudents: foundClass.students.length,
          pendingStudents: foundClass.pendingStudents.length,
        },
      });
    }

    // Thêm học sinh vào danh sách chờ
    foundClass.pendingStudents.push(currentUser._id);
    await foundClass.save();

    return res.status(200).json({
      message: 'Đăng ký lớp thành công, vui lòng chờ giáo viên xác nhận',
      data: {
        classId: foundClass._id,
        className: foundClass.nameClass,
        subject: foundClass.subject,
        teacherId: foundClass.teacherId,
        status: 'pending',
        registeredAt: new Date(),
        position: foundClass.pendingStudents.length, // vị trí trong hàng đợi
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi server', error: err });
  }
};

// giáo viên xem danh sách học sinh đăng ký lớp (teacher) của lớp mình tạo
export const getPendingStudents = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params; // classId
    const teacher = req.user as any;

    const foundClass = await ClassModel.findById(classId);
    if (!foundClass) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học' });
    }

    // Lấy thông tin teacher hiện tại
    const teacherUser = await User.findOne({ authId: teacher._id, deleted: false });
    if (!teacherUser) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin giáo viên' });
    }

    if (String(foundClass.teacherId) !== String(teacherUser._id)) {
      return res.status(403).json({ message: 'Bạn không có quyền xem danh sách chờ lớp này' });
    }

    return res.status(200).json({
      message: 'Danh sách học sinh chờ xác nhận',
      data: foundClass.pendingStudents,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi server', error: error });
  }
};

// giáo viên duyệt học sinh vào lớp (teacher)
export const approveStudent = async (req: Request, res: Response) => {
  try {
    const { classId, studentId } = req.params;
    const teacher = req.user as any;

    const foundClass = await ClassModel.findById(classId);
    if (!foundClass) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học' });
    }

    // Chỉ giáo viên tạo lớp mới được duyệt
    const teacherUser = await User.findOne({ authId: teacher._id, deleted: false });
    if (!teacherUser) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin giáo viên' });
    }

    if (String(foundClass.teacherId) !== String(teacherUser._id)) {
      return res.status(403).json({ message: 'Bạn không có quyền duyệt học sinh lớp này' });
    }

    // Convert studentId to ObjectId for comparison
    const studentObjectId = new mongoose.Types.ObjectId(studentId);

    // Kiểm tra học sinh có trong pendingStudents không
    if (!foundClass.pendingStudents.some((id: any) => String(id) === String(studentId))) {
      return res.status(400).json({ message: 'Học sinh không có trong danh sách chờ' });
    }

    // Xóa khỏi pending và thêm vào students
    foundClass.pendingStudents = foundClass.pendingStudents.filter(
      (id: any) => String(id) !== String(studentId),
    );
    foundClass.students.push(studentObjectId);
    await foundClass.save();

    return res.status(200).json({
      message: 'Xác nhận học sinh thành công',
      data: foundClass.students,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi server', error: error });
  }
};
