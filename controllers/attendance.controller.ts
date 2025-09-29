import { Request, Response } from "express";
import { AttendanceModel } from "../models/attendance.model";
import ClassModel from "../models/class.model";
import User from "../models/user.model";


// Tạo buổi điểm danh (chỉ giáo viên)
export const startAttendanceSession = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const user = req.user as any;

    // Tìm user hiện tại
    const teacher = await User.findOne({ authId: user._id, deleted: false });
    if (!teacher) return res.status(404).json({ message: "Không tìm thấy giáo viên" });

    const foundClass = await ClassModel.findById(classId).populate("students", "_id username email");
    if (!foundClass) return res.status(404).json({ message: "Không tìm thấy lớp học" });

    // Chỉ giáo viên lớp đó mới tạo được
    if (String(foundClass.teacherId) !== String(teacher._id)) {
      return res.status(403).json({ message: "Bạn không có quyền điểm danh cho lớp này" });
    }

    // Lấy danh sách học sinh trong lớp
    const students = foundClass.students.map((s: any) => ({
      studentId: s._id,
      status: "absent",
    }));

    const attendance = new AttendanceModel({
      classId,
      teacherId: teacher._id,
      students,
    });

    await attendance.save();

    return res.status(201).json({
      message: "Tạo buổi điểm danh thành công",
      data: attendance,
    });
  } catch (err) {
    console.error("Error in createAttendanceSession:", err);
    return res.status(500).json({ message: "Lỗi server", error: err });
  }
};

// Cập nhật trạng thái điểm danh (giáo viên chọn học sinh có mặt/vắng)
export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { attendanceId } = req.params;
    const { students } = req.body; // [{ studentId, status }]
    const user = req.user as any;

    const teacher = await User.findOne({ authId: user._id, deleted: false });
    if (!teacher) return res.status(404).json({ message: "Không tìm thấy giáo viên" });

    const attendance = await AttendanceModel.findById(attendanceId);
    if (!attendance) return res.status(404).json({ message: "Không tìm thấy buổi điểm danh" });

    if (String(attendance.teacherId) !== String(teacher._id)) {
      return res.status(403).json({ message: "Bạn không có quyền sửa buổi điểm danh này" });
    }

    students.forEach((s: any) => {
      const studentRecord = attendance.students.find(
        (st) => String(st.studentId) === String(s.studentId)
      );
      if (studentRecord) {
        studentRecord.status = s.status;
        studentRecord.markedAt = new Date();
      }
    });

    await attendance.save();

    return res.status(200).json({
      message: "Cập nhật điểm danh thành công",
      data: attendance,
    });
  } catch (err) {
    console.error("Error in markAttendance:", err);
    return res.status(500).json({ message: "Lỗi server", error: err });
  }
};

// Lấy lịch sử điểm danh của 1 lớp (giáo viên xem)
export const getAttendanceByClass = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const sessions = await AttendanceModel.find({ classId })
      .populate("students.studentId", "username email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Lấy lịch sử điểm danh thành công",
      data: sessions,
    });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server", error: err });
  }
};

// Học sinh xem điểm danh của mình trong lớp
export const getMyAttendance = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const user = req.user as any;

    const student = await User.findOne({ authId: user._id, deleted: false });
    if (!student) return res.status(404).json({ message: "Không tìm thấy học sinh" });

    const sessions = await AttendanceModel.find({ classId, "students.studentId": student._id })
      .select("date students");

    const myRecords = sessions.map((session) => {
      const record = session.students.find(
        (s) => String(s.studentId) === String(student._id)
      );
      return {
        date: session.date,
        status: record?.status || "absent",
        markedAt: record?.markedAt || null,
      };
    });

    return res.status(200).json({
      message: "Lấy thông tin điểm danh cá nhân thành công",
      data: myRecords,
    });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server", error: err });
  }
};