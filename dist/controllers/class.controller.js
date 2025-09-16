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
exports.leaveClass = exports.getMyRegisteredClasses = exports.getMyPendingClasses = exports.approveStudent = exports.getPendingStudents = exports.joinClass = exports.getStudentsByClass = exports.deleteClass = exports.updateClass = exports.getClassById = exports.getAllClasses = exports.createClass = void 0;
const class_model_1 = __importDefault(require("../models/class.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = __importDefault(require("../models/user.model"));
const createClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { nameClass, subject, description, schedule, location, maxStudents, gradeLevel, pricePerSession, } = req.body;
        const user = req.user;
        if (!user || user.role !== 'teacher') {
            return res.status(403).json({ message: 'Chỉ giáo viên mới có quyền tạo lớp học' });
        }
        if (gradeLevel && (typeof gradeLevel !== 'string' || gradeLevel.trim() === '')) {
            return res.status(400).json({ message: 'Cấp lớp phải là chuỗi hợp lệ' });
        }
        if (pricePerSession !== undefined &&
            (typeof pricePerSession !== 'number' || pricePerSession < 0)) {
            return res.status(400).json({ message: 'Số tiền buổi học phải là số >= 0' });
        }
        const teacherUser = yield user_model_1.default.findOne({ authId: user._id, deleted: false });
        if (!teacherUser) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin giáo viên' });
        }
        const newClass = yield class_model_1.default.create({
            nameClass,
            subject,
            description,
            schedule,
            location,
            maxStudents,
            gradeLevel,
            pricePerSession,
            teacherId: teacherUser._id,
            createdBy: user._id,
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
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Người dùng chưa được xác thực' });
        }
        if ((user === null || user === void 0 ? void 0 : user.role) === 'teacher') {
            const teacherUser = yield user_model_1.default.findOne({ authId: user._id, deleted: false });
            if (!teacherUser) {
                return res.status(404).json({ message: 'Không tìm thấy thông tin giáo viên' });
            }
            const classes = yield class_model_1.default.find({
                teacherId: teacherUser._id,
                deleted: { $ne: true },
            }).populate('teacherId', 'username email');
            return res.status(200).json({
                message: 'Lấy danh sách lớp học của giáo viên thành công',
                data: classes,
            });
        }
        if ((user === null || user === void 0 ? void 0 : user.role) === 'student') {
            const classes = yield class_model_1.default.find({ deleted: { $ne: true } }).populate('teacherId', 'username email');
            return res.status(200).json({
                message: 'Lấy danh sách tất cả lớp học thành công',
                data: classes,
            });
        }
        if ((user === null || user === void 0 ? void 0 : user.role) === 'admin') {
            const classes = yield class_model_1.default.find({ deleted: { $ne: true } }).populate('teacherId', 'username email');
            return res.status(200).json({
                message: 'Lấy danh sách tất cả lớp học thành công',
                data: classes,
            });
        }
        console.log('Invalid role detected:', user.role);
        return res.status(403).json({
            message: 'Bạn không có quyền truy cập',
            userRole: user.role,
            validRoles: ['teacher', 'student', 'admin'],
        });
    }
    catch (err) {
        console.error('Error in getAllClasses:', err);
        return res.status(500).json({ message: 'Lỗi server', error: err });
    }
});
exports.getAllClasses = getAllClasses;
const getClassById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const foundClass = yield class_model_1.default.findById(id).populate('teacherId', 'username email avatar');
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
        const teacherUser = yield user_model_1.default.findOne({ authId: user._id, deleted: false });
        if (!teacherUser) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin giáo viên' });
        }
        if (String(foundClass.teacherId) !== String(teacherUser._id)) {
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
        const teacherUser = yield user_model_1.default.findOne({ authId: user._id, deleted: false });
        if (!teacherUser) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin giáo viên' });
        }
        if (String(foundClass.teacherId) !== String(teacherUser._id)) {
            return res.status(403).json({ message: 'Bạn không có quyền xóa lớp học này' });
        }
        yield class_model_1.default.findByIdAndDelete(id);
        return res.status(200).json({
            message: 'Xóa lớp học thành công',
            data: {
                _id: foundClass._id,
                nameClass: foundClass.nameClass,
                subject: foundClass.subject,
            },
        });
    }
    catch (err) {
        return res.status(500).json({ message: 'Lỗi server', error: err });
    }
});
exports.deleteClass = deleteClass;
const getStudentsByClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { classId } = req.params;
        const user = req.user;
        const foundClass = yield class_model_1.default.findById(classId)
            .populate('teacherId', 'username email avatar')
            .populate('students', 'username email avatar');
        if (!foundClass) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học' });
        }
        const currentUser = yield user_model_1.default.findOne({ authId: user._id, deleted: false });
        if (!currentUser) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng' });
        }
        const isOwnerTeacher = String(foundClass.teacherId._id) === String(currentUser._id);
        const isAdmin = user.role === 'admin';
        const isStudentInClass = foundClass.students.some((stu) => {
            return String(stu._id) === String(currentUser._id);
        });
        if (user.role === 'student' && !isStudentInClass) {
            return res.status(403).json({
                message: 'Bạn không có quyền xem danh sách học sinh lớp này (chỉ học sinh trong lớp mới được xem)',
                debug: {
                    currentUserId: currentUser._id,
                    userRole: user.role,
                    isOwnerTeacher,
                    isAdmin,
                    isStudentInClass,
                    studentsCount: foundClass.students.length,
                },
            });
        }
        if (user.role === 'teacher' && !isOwnerTeacher && !isAdmin) {
            return res.status(403).json({
                message: 'Bạn không có quyền xem danh sách học sinh lớp này (chỉ giáo viên của lớp)',
                debug: {
                    currentUserId: currentUser._id,
                    userRole: user.role,
                    isOwnerTeacher,
                    isAdmin,
                },
            });
        }
        return res.status(200).json({
            message: 'Danh sách học sinh trong lớp',
            classInfo: {
                _id: foundClass._id,
                nameClass: foundClass.nameClass,
                subject: foundClass.subject,
                maxStudents: foundClass.maxStudents,
            },
            teacher: foundClass.teacherId,
            students: foundClass.students || [],
            totalStudents: ((_a = foundClass.students) === null || _a === void 0 ? void 0 : _a.length) || 0,
        });
    }
    catch (err) {
        console.error('Error in getStudentsByClass:', err);
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
        const currentUser = yield user_model_1.default.findOne({ authId: user._id, deleted: false });
        if (!currentUser) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng' });
        }
        if (String(foundClass.teacherId) === String(currentUser._id)) {
            return res.status(400).json({ message: 'Bạn không thể đăng ký vào lớp do chính mình tạo' });
        }
        if (foundClass.students.includes(currentUser._id)) {
            return res.status(400).json({ message: 'Bạn đã tham gia lớp này' });
        }
        if (foundClass.pendingStudents.includes(currentUser._id)) {
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
        foundClass.pendingStudents.push(currentUser._id);
        yield foundClass.save();
        currentUser.registeredClasses.push({
            classId: foundClass._id,
            status: 'pending',
            registeredAt: new Date(),
        });
        yield currentUser.save();
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
        const foundClass = yield class_model_1.default.findById(classId).populate('pendingStudents', 'username email avatar');
        if (!foundClass) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học' });
        }
        const teacherUser = yield user_model_1.default.findOne({ authId: teacher._id, deleted: false });
        if (!teacherUser) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin giáo viên' });
        }
        if (String(foundClass.teacherId) !== String(teacherUser._id)) {
            return res.status(403).json({ message: 'Bạn không có quyền xem danh sách chờ lớp này' });
        }
        return res.status(200).json({
            message: 'Danh sách học sinh chờ xác nhận',
            data: foundClass.pendingStudents,
            totalPending: foundClass.pendingStudents.length,
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
        const teacherUser = yield user_model_1.default.findOne({ authId: teacher._id, deleted: false });
        if (!teacherUser) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin giáo viên' });
        }
        if (String(foundClass.teacherId) !== String(teacherUser._id)) {
            return res.status(403).json({ message: 'Bạn không có quyền duyệt học sinh lớp này' });
        }
        const studentObjectId = new mongoose_1.default.Types.ObjectId(studentId);
        if (!foundClass.pendingStudents.some((id) => String(id) === String(studentId))) {
            return res.status(400).json({ message: 'Học sinh không có trong danh sách chờ' });
        }
        if (foundClass.maxStudents && foundClass.students.length >= foundClass.maxStudents) {
            return res.status(400).json({
                message: 'Lớp học đã đầy. Không thể duyệt thêm học sinh',
                details: {
                    maxStudents: foundClass.maxStudents,
                    currentStudents: foundClass.students.length,
                },
            });
        }
        foundClass.pendingStudents = foundClass.pendingStudents.filter((id) => String(id) !== String(studentId));
        foundClass.students.push(studentObjectId);
        yield foundClass.save();
        const studentUser = yield user_model_1.default.findById(studentId);
        if (studentUser) {
            const registeredClass = studentUser.registeredClasses.find((rc) => String(rc.classId) === String(classId));
            if (registeredClass) {
                registeredClass.status = 'approved';
                registeredClass.approvedAt = new Date();
                yield studentUser.save();
            }
        }
        const updatedClass = yield class_model_1.default.findById(classId)
            .populate('students', 'username email avatar')
            .populate('pendingStudents', 'username email avatar');
        const approvedStudent = yield user_model_1.default.findById(studentId, 'username email avatar');
        return res.status(200).json({
            message: 'Xác nhận học sinh thành công',
            approvedStudent: approvedStudent,
            data: {
                students: (updatedClass === null || updatedClass === void 0 ? void 0 : updatedClass.students) || [],
                pendingStudents: (updatedClass === null || updatedClass === void 0 ? void 0 : updatedClass.pendingStudents) || [],
                totalStudents: (updatedClass === null || updatedClass === void 0 ? void 0 : updatedClass.students.length) || 0,
                totalPending: (updatedClass === null || updatedClass === void 0 ? void 0 : updatedClass.pendingStudents.length) || 0,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Lỗi server', error: error });
    }
});
exports.approveStudent = approveStudent;
const getMyPendingClasses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user || user.role !== 'student') {
            return res.status(403).json({ message: 'Chỉ học sinh mới có quyền xem lớp đang chờ duyệt' });
        }
        const currentUser = yield user_model_1.default.findOne({ authId: user._id, deleted: false }).populate({
            path: 'registeredClasses.classId',
            populate: {
                path: 'teacherId',
                select: 'username email avatar',
            },
        });
        if (!currentUser) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng' });
        }
        const pendingClasses = currentUser.registeredClasses.filter((regClass) => regClass.status === 'pending');
        const formattedClasses = pendingClasses.map((regClass) => {
            const classInfo = regClass.classId;
            return {
                _id: classInfo._id,
                nameClass: classInfo.nameClass,
                subject: classInfo.subject,
                description: classInfo.description,
                schedule: classInfo.schedule,
                location: classInfo.location,
                maxStudents: classInfo.maxStudents,
                teacher: classInfo.teacherId,
                registrationInfo: {
                    registeredAt: regClass.registeredAt,
                    status: regClass.status,
                },
                createdAt: classInfo.createdAt,
                updatedAt: classInfo.updatedAt,
            };
        });
        return res.status(200).json({
            message: 'Lấy danh sách lớp đang chờ duyệt thành công',
            data: formattedClasses,
            totalClasses: formattedClasses.length,
        });
    }
    catch (err) {
        console.error('Error in getMyPendingClasses:', err);
        return res.status(500).json({ message: 'Lỗi server', error: err });
    }
});
exports.getMyPendingClasses = getMyPendingClasses;
const getMyRegisteredClasses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        if (!user || user.role !== 'student') {
            return res.status(403).json({ message: 'Chỉ học sinh mới có quyền xem lớp đã đăng ký' });
        }
        const currentUser = yield user_model_1.default.findOne({ authId: user._id, deleted: false }).populate({
            path: 'registeredClasses.classId',
            populate: {
                path: 'teacherId',
                select: 'username email avatar',
            },
        });
        if (!currentUser) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng' });
        }
        const approvedClasses = currentUser.registeredClasses.filter((regClass) => regClass.status === 'approved');
        const formattedClasses = approvedClasses.map((regClass) => {
            const classInfo = regClass.classId;
            return {
                _id: classInfo._id,
                nameClass: classInfo.nameClass,
                subject: classInfo.subject,
                description: classInfo.description,
                schedule: classInfo.schedule,
                location: classInfo.location,
                maxStudents: classInfo.maxStudents,
                teacher: classInfo.teacherId,
                registrationInfo: {
                    registeredAt: regClass.registeredAt,
                    approvedAt: regClass.approvedAt,
                    status: regClass.status,
                },
                createdAt: classInfo.createdAt,
                updatedAt: classInfo.updatedAt,
            };
        });
        return res.status(200).json({
            message: 'Lấy danh sách lớp đã đăng ký thành công',
            data: formattedClasses,
            totalClasses: formattedClasses.length,
        });
    }
    catch (err) {
        console.error('Error in getMyRegisteredClasses:', err);
        return res.status(500).json({ message: 'Lỗi server', error: err });
    }
});
exports.getMyRegisteredClasses = getMyRegisteredClasses;
const leaveClass = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { classId } = req.params;
        const user = req.user;
        const currentUser = yield user_model_1.default.findOne({ authId: user._id, deleted: false });
        if (!currentUser) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng' });
        }
        const foundClass = yield class_model_1.default.findById(classId);
        if (!foundClass) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học' });
        }
        const isInClass = foundClass.students.includes(currentUser._id);
        const isPending = foundClass.pendingStudents.includes(currentUser._id);
        if (!isInClass && !isPending) {
            return res.status(400).json({ message: 'Bạn không có trong lớp học này' });
        }
        if (isInClass) {
            foundClass.students = foundClass.students.filter((id) => String(id) !== String(currentUser._id));
        }
        if (isPending) {
            foundClass.pendingStudents = foundClass.pendingStudents.filter((id) => String(id) !== String(currentUser._id));
        }
        yield foundClass.save();
        const registeredClassIndex = currentUser.registeredClasses.findIndex((rc) => String(rc.classId) === String(classId));
        if (registeredClassIndex !== -1) {
            currentUser.registeredClasses.splice(registeredClassIndex, 1);
        }
        yield currentUser.save();
        return res.status(200).json({
            message: 'Rời khỏi lớp học thành công',
            data: {
                classId: foundClass._id,
                className: foundClass.nameClass,
                leftAt: new Date(),
            },
        });
    }
    catch (err) {
        return res.status(500).json({ message: 'Lỗi server', error: err });
    }
});
exports.leaveClass = leaveClass;
