import multer from "multer";
import { Request, Response, NextFunction } from "express";

// Lưu file vào bộ nhớ RAM (để dùng buffer upload lên Supabase)
const storage = multer.memoryStorage();

// Cấu hình multer với validation
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    console.log("📝 File filter check:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    // Chỉ cho phép upload ảnh
    if (file.mimetype.startsWith("image/")) {
      console.log("✅ File type accepted");
      cb(null, true);
    } else {
      console.log("❌ File type rejected:", file.mimetype);
      cb(new Error("Chỉ được upload file ảnh!"));
    }
  },
});

// Error handler cho multer
export const handleUploadError = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("🚨 Upload middleware error:", error);

  if (error instanceof multer.MulterError) {
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
