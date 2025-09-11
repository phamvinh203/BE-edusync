import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

// Lưu file vào bộ nhớ RAM (để dùng buffer upload lên Supabase)
const storage = multer.memoryStorage();

// Allowed file types for exercises
const ALLOWED_EXERCISE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/jpg',
];

// Cấu hình multer cho avatar (chỉ ảnh)
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    console.log('📝 File filter check:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    // Chỉ cho phép upload ảnh
    if (file.mimetype.startsWith('image/')) {
      console.log('✅ File type accepted');
      cb(null, true);
    } else {
      console.log('❌ File type rejected:', file.mimetype);
      cb(new Error('Chỉ được upload file ảnh!'));
    }
  },
});

// Cấu hình multer cho exercise files
export const uploadExerciseFile = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max cho file bài tập
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    console.log('📝 Exercise file filter check:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    // Cho phép các loại file bài tập
    if (ALLOWED_EXERCISE_TYPES.includes(file.mimetype)) {
      console.log('✅ Exercise file type accepted');
      cb(null, true);
    } else {
      console.log('❌ Exercise file type rejected:', file.mimetype);
      cb(new Error('Chỉ được upload file PDF, Word, PowerPoint, Excel, TXT hoặc ảnh!'));
    }
  },
});

// Error handler cho multer
export const handleUploadError = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.log('🚨 Upload middleware error:', error);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File quá lớn! Kích thước tối đa 50MB',
      });
    }
  }

  if (error.message === 'Chỉ được upload file ảnh!') {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error.message === 'Chỉ được upload file PDF, Word, PowerPoint, Excel, TXT hoặc ảnh!') {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  next(error);
};
