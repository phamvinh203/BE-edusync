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
exports.deleteClass = exports.updateClass = exports.getClassById = exports.getAllClasses = exports.createClass = void 0;
const class_model_1 = __importDefault(require("../models/class.model"));
const createClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { nameClass, subject, description, schedule, location, maxStudents } = req.body;
        const user = req.user;
        const newClass = yield class_model_1.default.create({
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
    }
    catch (err) {
        return res.status(500).json({ message: "Lỗi server", error: err });
    }
});
exports.createClass = createClass;
const getAllClasses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const classes = yield class_model_1.default.find();
        return res
            .status(200)
            .json({ message: "Lấy danh sách lớp học thành công", data: classes });
    }
    catch (err) {
        return res.status(500).json({ message: "Lỗi server", error: err });
    }
});
exports.getAllClasses = getAllClasses;
const getClassById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const foundClass = yield class_model_1.default.findById(id);
        if (!foundClass) {
            return res.status(404).json({ message: "Không tìm thấy lớp học" });
        }
        return res
            .status(200)
            .json({ message: "Lấy thông tin lớp học thành công", data: foundClass });
    }
    catch (err) {
        return res.status(500).json({ message: "Lỗi server", error: err });
    }
});
exports.getClassById = getClassById;
const updateClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = req.user;
        const updateData = req.body;
        const foundClass = yield class_model_1.default.findById(id);
        if (!foundClass) {
            return res.status(404).json({ message: "Không tìm thấy lớp học" });
        }
        if (String(foundClass.teacherId) !== String(user._id)) {
            return res
                .status(403)
                .json({ message: "Bạn không có quyền sửa lớp học này" });
        }
        const updatedClass = yield class_model_1.default.findByIdAndUpdate(id, updateData, {
            new: true,
        });
        return res
            .status(200)
            .json({ message: "Cập nhật lớp học thành công", data: updatedClass });
    }
    catch (err) {
        return res.status(500).json({ message: "Lỗi server", error: err });
    }
});
exports.updateClass = updateClass;
const deleteClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = req.user;
        const foundClass = yield class_model_1.default.findById(id);
        if (!foundClass) {
            return res.status(404).json({ message: "Không tìm thấy lớp học" });
        }
        if (String(foundClass.teacherId) !== String(user._id)) {
            return res
                .status(403)
                .json({ message: "Bạn không có quyền xóa lớp học này" });
        }
        yield class_model_1.default.findByIdAndDelete(id);
        return res.status(200).json({ message: "Xóa lớp học thành công" });
    }
    catch (err) {
        return res.status(500).json({ message: "Lỗi server", error: err });
    }
});
exports.deleteClass = deleteClass;
