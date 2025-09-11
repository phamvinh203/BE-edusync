import { supabase } from '../config/db';
import { v4 as uuidv4 } from 'uuid';

interface UploadResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  error?: string;
}

interface UploadFileParams {
  file: Express.Multer.File;
  teacherName: string;
  className: string;
  exerciseTitle?: string;
}

export const uploadExerciseFileToSupabase = async (
  params: UploadFileParams,
): Promise<UploadResult> => {
  try {
    const { file, teacherName, className, exerciseTitle } = params;

    // Sanitize tên để tránh ký tự đặc biệt trong path
    const sanitizeFileName = (name: string) => {
      // Chuyển từ có dấu sang không dấu
      const removeVietnameseTones = (str: string) => {
        return str
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Xóa dấu
          .replace(/đ/g, 'd')
          .replace(/Đ/g, 'D') // Chuyển đ thành d
          .replace(/[^a-zA-Z0-9\s\-_.]/g, '') // Chỉ giữ lại chữ cái, số, khoảng trắng, dấu gạch ngang, underscore, dot
          .replace(/\s+/g, '_') // Thay khoảng trắng bằng underscore
          .replace(/_+/g, '_') // Thay nhiều underscore liên tiếp bằng 1
          .trim();
      };

      return removeVietnameseTones(name);
    };

    const sanitizedTeacherName = sanitizeFileName(teacherName);
    const sanitizedClassName = sanitizeFileName(className);
    const sanitizedFileName = sanitizeFileName(file.originalname);

    // Tạo cấu trúc thư mục: GiaoVien/LopHoc/TenFileGoc
    let filePath: string;
    if (exerciseTitle) {
      const sanitizedExerciseTitle = sanitizeFileName(exerciseTitle);
      filePath = `${sanitizedTeacherName}/${sanitizedClassName}/${sanitizedExerciseTitle}/${sanitizedFileName}`;
    } else {
      filePath = `${sanitizedTeacherName}/${sanitizedClassName}/${sanitizedFileName}`;
    }

    console.log('📤 Uploading file to Supabase:', {
      originalName: file.originalname,
      sanitizedFileName,
      filePath,
      size: file.size,
      mimetype: file.mimetype,
    });

    // Upload file lên Supabase Storage
    const { data, error } = await supabase.storage
      .from('ExerciseFile')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true, // Cho phép ghi đè nếu file trùng tên
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Lấy public URL
    const { data: publicData } = supabase.storage.from('ExerciseFile').getPublicUrl(filePath);

    console.log('✅ File uploaded successfully:', {
      path: data.path,
      publicUrl: publicData.publicUrl,
    });

    return {
      success: true,
      fileUrl: publicData.publicUrl,
      fileName: file.originalname, // Trả về tên file gốc để hiển thị
    };
  } catch (error: any) {
    console.error('❌ Upload helper error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const deleteExerciseFileFromSupabase = async (filePath: string): Promise<boolean> => {
  try {
    // Extract file path from URL
    const pathMatch = filePath.match(/\/storage\/v1\/object\/public\/ExerciseFile\/(.+)$/);
    if (!pathMatch) {
      console.error('❌ Invalid file URL format');
      return false;
    }

    const fileName = pathMatch[1];

    const { error } = await supabase.storage.from('ExerciseFile').remove([fileName]);

    if (error) {
      console.error('❌ Supabase delete error:', error);
      return false;
    }

    console.log('✅ File deleted successfully:', fileName);
    return true;
  } catch (error: any) {
    console.error('❌ Delete helper error:', error);
    return false;
  }
};
