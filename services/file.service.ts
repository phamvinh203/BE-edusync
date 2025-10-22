import {
  uploadExerciseFileToSupabase,
  deleteExerciseFileFromSupabase,
  getSignedUrlFromSupabase,
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
            filePath: uploadResult.filePath,
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
          filesToDelete.push(attachmentToRemove.filePath || attachmentToRemove.fileUrl);
          exercise.attachments.pull(fileId);
        }
      }

      // Xóa file từ Supabase Storage
      for (const fileIdentifier of filesToDelete) {
        const deleteSuccess = await deleteExerciseFileFromSupabase(fileIdentifier);
        if (!deleteSuccess) {
          console.warn(`⚠️ Failed to delete file from storage: ${fileIdentifier}`);
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

  private static toPlainObject<T>(data: T): T {
    if (!data || typeof (data as any).toObject !== 'function') {
      return data;
    }
    return (data as any).toObject();
  }

  private static async getSignedUrlForExerciseAttachment(attachment: any): Promise<string | null> {
    return getSignedUrlFromSupabase('ExerciseFile', attachment?.filePath || attachment?.fileUrl);
  }

  private static async getSignedUrlForSubmissionFile(submission: any): Promise<string | null> {
    return getSignedUrlFromSupabase('SubmissionFile', submission?.filePath || submission?.fileUrl);
  }

  static async withSignedAttachments(attachments?: any[]): Promise<any[]> {
    if (!attachments || attachments.length === 0) {
      return attachments || [];
    }

    return Promise.all(
      attachments.map(async (item) => {
        const attachment = FileService.toPlainObject(item);
        const signedUrl = await FileService.getSignedUrlForExerciseAttachment(attachment);
        const { filePath, ...attachmentRest } = attachment;

        return {
          ...attachmentRest,
          fileUrl: signedUrl ?? attachment.fileUrl,
        };
      }),
    );
  }

  static async withSignedSubmission(submission: any): Promise<any> {
    if (!submission) {
      return submission;
    }

    const normalizedDoc = FileService.toPlainObject(submission);
    const normalized = { ...normalizedDoc };
    const signedUrl = await FileService.getSignedUrlForSubmissionFile(normalized);

    if (signedUrl) {
      normalized.fileUrl = signedUrl;
    }

    delete normalized.filePath;

    return normalized;
  }

  static async withSignedSubmissions(submissions?: any[]): Promise<any[]> {
    if (!submissions || submissions.length === 0) {
      return submissions || [];
    }

    return Promise.all(
      submissions.map((submission) => FileService.withSignedSubmission(submission)),
    );
  }
}
