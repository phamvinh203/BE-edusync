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
exports.updateAvatar = exports.updateMe = exports.getMe = void 0;
const auth_model_1 = __importDefault(require("../models/auth.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const db_1 = require("../config/db");
const getMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.user;
        const authUser = yield auth_model_1.default.findOne({ email, deleted: false });
        if (!authUser) {
            res.status(404).json({ message: "Người dùng không tồn tại" });
            return;
        }
        const userInfo = yield user_model_1.default.findOne({
            authId: authUser._id,
            deleted: false,
        });
        res.status(200).json({
            success: true,
            data: {
                auth: {
                    id: authUser._id,
                    email: authUser.email,
                    username: authUser.username,
                },
                profile: userInfo,
            },
        });
    }
    catch (error) {
        console.error("Error in getMe:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server",
        });
    }
});
exports.getMe = getMe;
const updateMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.user;
        const { username, phone, address, avatar, dateOfBirth, gender } = req.body;
        const authUser = yield auth_model_1.default.findOne({ email, deleted: false });
        if (!authUser) {
            res.status(404).json({ message: "Người dùng không tồn tại" });
            return;
        }
        let userInfo = yield user_model_1.default.findOne({ authId: authUser._id, deleted: false });
        if (userInfo) {
            userInfo.username = username || userInfo.username;
            userInfo.phone = phone || userInfo.phone;
            userInfo.address = address || userInfo.address;
            userInfo.avatar = avatar || userInfo.avatar;
            userInfo.dateOfBirth = dateOfBirth || userInfo.dateOfBirth;
            userInfo.gender = gender || userInfo.gender;
            yield userInfo.save();
        }
        else {
            userInfo = new user_model_1.default({
                authId: authUser._id,
                username,
                phone,
                address,
                avatar,
                dateOfBirth,
                gender,
            });
            yield userInfo.save();
        }
        res.status(200).json({
            success: true,
            message: "Cập nhật thông tin thành công",
            data: {
                auth: {
                    id: authUser._id,
                    username: authUser.username,
                    email: authUser.email,
                },
                profile: userInfo,
            },
        });
    }
    catch (error) {
        console.error("Error in updateMe:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server",
        });
    }
});
exports.updateMe = updateMe;
const updateAvatar = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.user;
        if (!req.file) {
            console.log("No file received in request");
            res.status(400).json({ message: "Vui lòng tải lên tệp avatar" });
            return;
        }
        const file = req.file;
        const fileName = `${Date.now()}-${file.originalname}`;
        const filePath = `avatars/${email}/${fileName}`;
        const { data, error } = yield db_1.supabase.storage
            .from("avatars")
            .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
        });
        if (error) {
            console.error("Supabase upload error:", {
                message: error.message,
                error: error,
            });
            res.status(500).json({
                success: false,
                message: "Lỗi khi tải lên avatar",
                error: error.message,
            });
            return;
        }
        const { data: publicUrlData } = db_1.supabase.storage
            .from("avatars")
            .getPublicUrl(filePath);
        const authUser = yield auth_model_1.default.findOne({ email, deleted: false });
        if (!authUser) {
            res.status(404).json({ message: "Người dùng không tồn tại" });
            return;
        }
        let userInfo = yield user_model_1.default.findOne({ authId: authUser._id, deleted: false });
        if (!userInfo) {
            userInfo = new user_model_1.default({ authId: authUser._id });
        }
        else {
            console.log("User profile found");
        }
        if (userInfo.avatar && userInfo.avatar.includes("supabase")) {
            try {
                const oldFilePath = userInfo.avatar.replace(publicUrlData.publicUrl.split("/avatars/")[0] + "/avatars/", "");
                yield db_1.supabase.storage.from("avatars").remove([oldFilePath]);
            }
            catch (deleteError) {
                console.log("Could not delete old avatar", deleteError);
            }
        }
        userInfo.avatar = publicUrlData.publicUrl;
        yield userInfo.save();
        res.status(200).json({
            success: true,
            message: "Cập nhật avatar thành công",
            data: {
                avatarUrl: publicUrlData.publicUrl,
                filePath: data.path,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi server",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.updateAvatar = updateAvatar;
