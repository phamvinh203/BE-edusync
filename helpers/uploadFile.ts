import { supabase } from '../config/db';

const SEVEN_DAYS_IN_SECONDS = 60 * 60 * 24 * 7;

const removeVietnameseTones = (str: string) =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');

const sanitizeForPath = (name: string) =>
  removeVietnameseTones(name)
    .replace(/[^a-zA-Z0-9\s\-_.]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .trim();

const resolveStoragePath = (fileIdentifier: string | undefined | null, bucket: string) => {
  if (!fileIdentifier) {
    return null;
  }

  // Nếu đã là path thì trả về luôn
  if (!fileIdentifier.includes('/storage/v1/object/public/')) {
    return fileIdentifier;
  }

  const regex = new RegExp(`/storage/v1/object/public/${bucket}/(.+)$`);
  const match = fileIdentifier.match(regex);
  return match ? match[1] : null;
};

export const getSignedUrlFromSupabase = async (
  bucket: 'ExerciseFile' | 'SubmissionFile',
  fileIdentifier: string | undefined,
  expiresIn: number = SEVEN_DAYS_IN_SECONDS,
): Promise<string | null> => {
  try {
    const filePath = resolveStoragePath(fileIdentifier, bucket);
    if (!filePath) {
      console.error('❌ Unable to resolve storage path for signed URL');
      return null;
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('❌ Supabase signed URL error:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('❌ Signed URL helper error:', error);
    return null;
  }
};

interface UploadResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  filePath?: string;
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

    const sanitizedTeacherName = sanitizeForPath(teacherName || 'Teacher');
    const sanitizedClassName = sanitizeForPath(className || 'Unknown_Class');
    const sanitizedFileName = sanitizeForPath(file.originalname);

    // Tạo cấu trúc thư mục: GiaoVien/LopHoc/TenFileGoc
    let filePath: string;
    if (exerciseTitle) {
      const sanitizedExerciseTitle = sanitizeForPath(exerciseTitle);
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
      filePath,
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

export const deleteExerciseFileFromSupabase = async (fileIdentifier: string): Promise<boolean> => {
  try {
    const filePath = resolveStoragePath(fileIdentifier, 'ExerciseFile');
    if (!filePath) {
      console.error('❌ Invalid file identifier for ExerciseFile');
      return false;
    }

    const { error } = await supabase.storage.from('ExerciseFile').remove([filePath]);

    if (error) {
      console.error('❌ Supabase delete error:', error);
      return false;
    }

    console.log('✅ File deleted successfully:', filePath);
    return true;
  } catch (error: any) {
    console.error('❌ Delete helper error:', error);
    return false;
  }
};

// ==================== SUBMISSION FILE HELPERS ====================

interface UploadSubmissionFileParams {
  file: Express.Multer.File;
  studentName: string;
  className: string;
  exerciseTitle: string;
}

/**
 * Upload file bài nộp của học sinh lên Supabase Storage (bucket: SubmissionFile)
 */
export const uploadSubmissionFileToSupabase = async (
  params: UploadSubmissionFileParams,
): Promise<UploadResult> => {
  try {
    const { file, studentName, className, exerciseTitle } = params;

    const sanitizedStudentName = sanitizeForPath(studentName || 'Student');
    const sanitizedClassName = sanitizeForPath(className || 'Unknown_Class');
    const sanitizedExerciseTitle = sanitizeForPath(exerciseTitle);
    const sanitizedFileName = sanitizeForPath(file.originalname);

    // Tạo cấu trúc thư mục: TenLop/TenBaiTap/TenHocSinh/TenFile
    const filePath = `${sanitizedClassName}/${sanitizedExerciseTitle}/${sanitizedStudentName}/${sanitizedFileName}`;

    console.log('📤 Uploading submission file to Supabase:', {
      originalName: file.originalname,
      sanitizedFileName,
      filePath,
      size: file.size,
      mimetype: file.mimetype,
    });

    // Upload file lên Supabase Storage (bucket: SubmissionFile)
    const { data, error } = await supabase.storage
      .from('SubmissionFile')
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
    const { data: publicData } = supabase.storage.from('SubmissionFile').getPublicUrl(filePath);

    console.log('✅ Submission file uploaded successfully:', {
      path: data.path,
      publicUrl: publicData.publicUrl,
    });

    return {
      success: true,
      fileUrl: publicData.publicUrl,
      filePath,
      fileName: file.originalname, // Trả về tên file gốc để hiển thị
    };
  } catch (error: any) {
    console.error('❌ Upload submission file error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Xóa file bài nộp của học sinh từ Supabase Storage (bucket: SubmissionFile)
 */
export const deleteSubmissionFileFromSupabase = async (
  fileIdentifier: string,
): Promise<boolean> => {
  try {
    const filePath = resolveStoragePath(fileIdentifier, 'SubmissionFile');
    if (!filePath) {
      console.error('❌ Invalid submission file identifier');
      return false;
    }

    const { error } = await supabase.storage.from('SubmissionFile').remove([filePath]);

    if (error) {
      console.error('❌ Supabase delete submission file error:', error);
      return false;
    }

    console.log('✅ Submission file deleted successfully:', filePath);
    return true;
  } catch (error: any) {
    console.error('❌ Delete submission file error:', error);
    return false;
  }
};
