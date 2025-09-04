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
exports.approveStudent = exports.getPendingStudents = exports.joinClass = exports.getStudentsByClass = exports.deleteClass = exports.updateClass = exports.getClassById = exports.getAllClasses = exports.createClass = void 0;
const class_model_1 = __importDefault(require("../models/class.model"));
const mongoose_1 = __importDefault(require("mongoose"));
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
        return res.status(201).json({ message: 'Tạo lớp học thành công', data: newClass });
    }
    catch (err) {
        return res.status(500).json({ message: 'Lỗi server', error: err });
    }
});
exports.createClass = createClass;
const getAllClasses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const classes = yield class_model_1.default.find();
        return res.status(200).json({ message: 'Lấy danh sách lớp học thành công', data: classes });
    }
    catch (err) {
        return res.status(500).json({ message: 'Lỗi server', error: err });
    }
});
exports.getAllClasses = getAllClasses;
const getClassById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const foundClass = yield class_model_1.default.findById(id);
        if (!foundClass) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học' });
        }
        return res.status(200).json({ message: 'Lấy thông tin lớp học thành công', data: foundClass });
    }
    catch (err) {
        return res.status(500).json({ message: 'Lỗi server', error: err });
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
            return res.status(404).json({ message: 'Không tìm thấy lớp học' });
        }
        if (String(foundClass.teacherId) !== String(user._id)) {
            return res.status(403).json({ message: 'Bạn không có quyền sửa lớp học này' });
        }
        const updatedClass = yield class_model_1.default.findByIdAndUpdate(id, updateData, {
            new: true,
        });
        return res.status(200).json({ message: 'Cập nhật lớp học thành công', data: updatedClass });
    }
    catch (err) {
        return res.status(500).json({ message: 'Lỗi server', error: err });
    }
});
exports.updateClass = updateClass;
const deleteClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = req.user;
        const foundClass = yield class_model_1.default.findById(id);
        if (!foundClass) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học' });
        }
        if (String(foundClass.teacherId) !== String(user._id)) {
            return res.status(403).json({ message: 'Bạn không có quyền xóa lớp học này' });
        }
        yield class_model_1.default.findByIdAndDelete(id);
        return res.status(200).json({ message: 'Xóa lớp học thành công' });
    }
    catch (err) {
        return res.status(500).json({ message: 'Lỗi server', error: err });
    }
});
exports.deleteClass = deleteClass;
const getStudentsByClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { classId } = req.params;
        const user = req.user;
        const foundClass = yield class_model_1.default.findById(classId);
        if (!foundClass) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học' });
        }
        const isOwnerTeacher = String(foundClass.teacherId._id) === String(user._id);
        const isAdmin = user.role === 'admin';
        const isStudentInClass = foundClass.students.some((stu) => String(stu._id) === String(user._id));
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
    }
    catch (err) {
        return res.status(500).json({ message: 'Lỗi server', error: err });
    }
});
exports.getStudentsByClass = getStudentsByClass;
const joinClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = req.user;
        const foundClass = yield class_model_1.default.findById(id);
        if (!foundClass) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học' });
        }
        if (String(foundClass.teacherId) === String(user._id)) {
            return res.status(400).json({ message: 'Bạn không thể đăng ký vào lớp do chính mình tạo' });
        }
        if (foundClass.students.includes(user._id)) {
            return res.status(400).json({ message: 'Bạn đã tham gia lớp này' });
        }
        if (foundClass.pendingStudents.includes(user._id)) {
            return res.status(400).json({ message: 'Bạn đã gửi yêu cầu tham gia lớp này' });
        }
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
        foundClass.pendingStudents.push(user._id);
        yield foundClass.save();
        return res.status(200).json({
            message: 'Đăng ký lớp thành công, vui lòng chờ giáo viên xác nhận',
            data: {
                classId: foundClass._id,
                className: foundClass.nameClass,
                subject: foundClass.subject,
                teacherId: foundClass.teacherId,
                status: 'pending',
                registeredAt: new Date(),
                position: foundClass.pendingStudents.length,
            },
        });
    }
    catch (err) {
        return res.status(500).json({ message: 'Lỗi server', error: err });
    }
});
exports.joinClass = joinClass;
const getPendingStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { classId } = req.params;
        const teacher = req.user;
        const foundClass = yield class_model_1.default.findById(classId);
        if (!foundClass) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học' });
        }
        if (String(foundClass.teacherId) !== String(teacher._id)) {
            return res.status(403).json({ message: 'Bạn không có quyền xem danh sách chờ lớp này' });
        }
        return res.status(200).json({
            message: 'Danh sách học sinh chờ xác nhận',
            data: foundClass.pendingStudents,
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Lỗi server', error: error });
    }
});
exports.getPendingStudents = getPendingStudents;
const approveStudent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { classId, studentId } = req.params;
        const teacher = req.user;
        const foundClass = yield class_model_1.default.findById(classId);
        if (!foundClass) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học' });
        }
        if (String(foundClass.teacherId) !== String(teacher._id)) {
            return res.status(403).json({ message: 'Bạn không có quyền duyệt học sinh lớp này' });
        }
        const studentObjectId = new mongoose_1.default.Types.ObjectId(studentId);
        if (!foundClass.pendingStudents.some((id) => String(id) === String(studentId))) {
            return res.status(400).json({ message: 'Học sinh không có trong danh sách chờ' });
        }
        foundClass.pendingStudents = foundClass.pendingStudents.filter((id) => String(id) !== String(studentId));
        foundClass.students.push(studentObjectId);
        yield foundClass.save();
        return res.status(200).json({
            message: 'Xác nhận học sinh thành công',
            data: foundClass.students,
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Lỗi server', error: error });
    }
});
exports.approveStudent = approveStudent;
