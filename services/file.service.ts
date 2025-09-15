import {
  uploadExerciseFileToSupabase,
  deleteExerciseFileFromSupabase,
} from '../helpers/uploadFile';
import { AttachmentData, FileUploadParams, FileUploadResult } from '../types/exercise.types';

export class FileService {
  /**
   * Upload multiple files và trả về danh sách attachments
   */
  static async uploadFiles(
    files: Express.Multer.File[],
    params: Omit<FileUploadParams, 'file'>,
  ): Promise<{ success: boolean; attachments?: AttachmentData[]; error?: string }> {
    if (!files || files.length === 0) {
      return { success: true, attachments: [] };
    }

    console.log(`📎 Processing ${files.length} file(s)...`);
    const attachments: AttachmentData[] = [];

    try {
      for (const file of files) {
        const uploadResult = await uploadExerciseFileToSupabase({
          file,
          ...params,
        });

        if (uploadResult.success) {
          attachments.push({
            fileName: uploadResult.fileName!,
            fileUrl: uploadResult.fileUrl!,
            fileSize: file.size,
            mimeType: file.mimetype,
            uploadedAt: new Date(),
          });
          console.log(`✅ File uploaded: ${uploadResult.fileName}`);
        } else {
          console.error(`❌ Failed to upload file: ${file.originalname}`, uploadResult.error);
          return {
            success: false,
            error: `Lỗi upload file: ${uploadResult.error}`,
          };
        }
      }

      return { success: true, attachments };
    } catch (error) {
      console.error('Error in uploadFiles:', error);
      return {
        success: false,
        error: 'Lỗi không xác định khi upload files',
      };
    }
  }

  /**
   * Xóa files từ storage và trả về danh sách URL đã xóa
   */
  static async deleteFiles(
    exercise: any,
    removeFileIds: string[],
  ): Promise<{ success: boolean; deletedUrls?: string[]; error?: string }> {
    if (!removeFileIds || removeFileIds.length === 0) {
      return { success: true, deletedUrls: [] };
    }

    try {
      const filesToDelete: string[] = [];

      // Lấy thông tin các file cần xóa trước khi xóa khỏi database
      for (const fileId of removeFileIds) {
        const attachmentToRemove = exercise.attachments.id(fileId);
        if (attachmentToRemove) {
          filesToDelete.push(attachmentToRemove.fileUrl);
          exercise.attachments.pull(fileId);
        }
      }

      // Xóa file từ Supabase Storage
      for (const fileUrl of filesToDelete) {
        const deleteSuccess = await deleteExerciseFileFromSupabase(fileUrl);
        if (!deleteSuccess) {
          console.warn(`⚠️ Failed to delete file from storage: ${fileUrl}`);
        }
      }

      console.log(`🗑️ Removed ${filesToDelete.length} file(s) from exercise`);
      return { success: true, deletedUrls: filesToDelete };
    } catch (error) {
      console.error('Error in deleteFiles:', error);
      return {
        success: false,
        error: 'Lỗi không xác định khi xóa files',
      };
    }
  }
}
