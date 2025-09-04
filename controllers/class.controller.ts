import { Request, Response } from "express";
import ClassModel from "../models/class.model";

// tạo lớp học (teacher)
export const createClass = async (req: Request, res: Response) => {
  try {
    const { nameClass, subject, description, schedule, location, maxStudents } =
      req.body;
    const user = req.user as any;

    const newClass = await ClassModel.create({
      nameClass,
      subject,
      description,
      schedule,
      location,
      maxStudents,
      teacherId: user._id,
      createdBy: user.authId || user._id,
    });

    return res
      .status(201)
      .json({ message: "Tạo lớp học thành công", data: newClass });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server", error: err });
  }
};

// xem danh sách lớp học
export const getAllClasses = async (req: Request, res: Response) => {
  try {
    const classes = await ClassModel.find();
    return res
      .status(200)
      .json({ message: "Lấy danh sách lớp học thành công", data: classes });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server", error: err });
  }
};

// xem lớp học
export const getClassById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const foundClass = await ClassModel.findById(id);
    if (!foundClass) {
      return res.status(404).json({ message: "Không tìm thấy lớp học" });
    }
    return res
      .status(200)
      .json({ message: "Lấy thông tin lớp học thành công", data: foundClass });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server", error: err });
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
      return res.status(404).json({ message: "Không tìm thấy lớp học" });
    }
    // Chỉ giáo viên tạo lớp mới được sửa
    if (String(foundClass.teacherId) !== String(user._id)) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền sửa lớp học này" });
    }
    const updatedClass = await ClassModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    return res
      .status(200)
      .json({ message: "Cập nhật lớp học thành công", data: updatedClass });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server", error: err });
  }
};

// xóa lớp học (teacher)
export const deleteClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as any;
    const foundClass = await ClassModel.findById(id);
    if (!foundClass) {
      return res.status(404).json({ message: "Không tìm thấy lớp học" });
    }
    // Chỉ giáo viên tạo lớp mới được xóa
    if (String(foundClass.teacherId) !== String(user._id)) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa lớp học này" });
    }
    await ClassModel.findByIdAndDelete(id);
    return res.status(200).json({ message: "Xóa lớp học thành công" });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server", error: err });
  }
};