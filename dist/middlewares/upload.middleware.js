"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUploadError = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const storage = multer_1.default.memoryStorage();
exports.upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        console.log("📝 File filter check:", {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
        });
        if (file.mimetype.startsWith("image/")) {
            console.log("✅ File type accepted");
            cb(null, true);
        }
        else {
            console.log("❌ File type rejected:", file.mimetype);
            cb(new Error("Chỉ được upload file ảnh!"));
        }
    },
});
const handleUploadError = (error, req, res, next) => {
    console.log("🚨 Upload middleware error:", error);
    if (error instanceof multer_1.default.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                success: false,
                message: "File quá lớn! Kích thước tối đa 10MB",
            });
        }
    }
    if (error.message === "Chỉ được upload file ảnh!") {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
    next(error);
};
exports.handleUploadError = handleUploadError;
