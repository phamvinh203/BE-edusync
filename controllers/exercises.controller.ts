import { Request, Response } from 'express';
import mongoose from 'mongoose';
import ExerciseModel from '../models/exercises.model';
import ClassModel from '../models/class.model';
import UserModel from '../models/user.model';
import { sendError, sendSuccess } from '../helpers/response';
import {
  uploadExerciseFileToSupabase,
  deleteExerciseFileFromSupabase,
} from '../helpers/uploadFile';

export const createExercise = async (req: Request, res: Response) => {
  try {
    const { title, description, dueDate, maxScore, subject, type, questions } = req.body; // Đã được validate bởi middleware
    const { classId } = req.params; // Lấy từ URL params
    const user = req.user as any;

    // Chỉ giáo viên
    if (!user || user.role !== 'teacher') {
      return sendError(res, 403, 'Chỉ giáo viên mới có quyền tạo bài tập');
    }

    // Kiểm tra định dạng ObjectId cho classId từ params
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return sendError(res, 400, 'ID lớp học không hợp lệ');
    }

    // Lấy thông tin giáo viên
    const teacherUser = await UserModel.findOne({ authId: user._id, deleted: false });
    if (!teacherUser) return sendError(res, 404, 'Không tìm thấy thông tin giáo viên');

    // Kiểm tra lớp học
    const foundClass = await ClassModel.findById(classId);
    if (!foundClass) return sendError(res, 404, 'Không tìm thấy lớp học');
    if (String(foundClass.teacherId) !== String(teacherUser._id)) {
      return sendError(res, 403, 'Bạn không có quyền tạo bài tập cho lớp học này');
    }
    if (foundClass.deleted) {
      return sendError(res, 400, 'Không thể tạo bài tập cho lớp học đã bị xóa');
    }

    // Tính toán maxScore cho bài tập trắc nghiệm
    let calculatedMaxScore = maxScore;
    if (type === 'multiple_choice' && questions && questions.length > 0) {
      // Nếu không có maxScore được cung cấp, tính từ tổng điểm các câu hỏi
      if (!calculatedMaxScore) {
        calculatedMaxScore = questions.reduce(
          (total: number, q: any) => total + (q.points || 1),
          0,
        );
      }
    } else if (!calculatedMaxScore) {
      calculatedMaxScore = 10; // Mặc định cho bài tập khác
    }

    // Xử lý file attachments nếu có
    const attachments: any[] = [];
    const files = req.files as Express.Multer.File[];

    if (files && files.length > 0) {
      console.log(`📎 Processing ${files.length} file(s)...`);

      for (const file of files) {
        const uploadResult = await uploadExerciseFileToSupabase({
          file,
          teacherName: teacherUser.username || 'Teacher',
          className: foundClass.nameClass || 'Unknown_Class',
          exerciseTitle: title,
        });

        if (uploadResult.success) {
          attachments.push({
            fileName: uploadResult.fileName,
            fileUrl: uploadResult.fileUrl,
            fileSize: file.size,
            mimeType: file.mimetype,
            uploadedAt: new Date(),
          });
          console.log(`✅ File uploaded: ${uploadResult.fileName}`);
        } else {
          console.error(`❌ Failed to upload file: ${file.originalname}`, uploadResult.error);
          return sendError(res, 500, `Lỗi upload file: ${uploadResult.error}`);
        }
      }
    }

    // Tạo object bài tập
    const exerciseData: any = {
      title,
      description,
      type,
      classId,
      createdBy: teacherUser._id,
      dueDate,
      maxScore: calculatedMaxScore,
      subject: subject || foundClass.subject,
      status: 'open',
      submissions: [],
      attachments, // Thêm attachments
    };

    // Thêm questions nếu là bài tập trắc nghiệm
    if (type === 'multiple_choice' && questions) {
      exerciseData.questions = questions;
    }

    // Tạo bài tập
    const newExercise = await ExerciseModel.create(exerciseData);

    const populatedExercise = await ExerciseModel.findById(newExercise._id)
      .populate('classId', 'nameClass subject gradeLevel')
      .populate('createdBy', 'username email');

    return sendSuccess(res, {
      message: `Tạo bài tập ${
        type === 'multiple_choice' ? 'trắc nghiệm' : type === 'essay' ? 'tự luận' : 'upload file'
      } thành công`,
      data: populatedExercise,
    });
  } catch (err) {
    console.error('Error in createExercise:', err);
    return sendError(res, 500, 'Lỗi server khi tạo bài tập');
  }
};

export const updateExercise = async (req: Request, res: Response) => {
  try {
    const { exerciseId } = req.params;
    const { title, description, dueDate, maxScore, subject, type, questions, removeFileIds } =
      req.body;
    const user = req.user as any;

    // Chỉ giáo viên mới có quyền cập nhật
    if (!user || user.role !== 'teacher') {
      return sendError(res, 403, 'Chỉ giáo viên mới có quyền cập nhật bài tập');
    }

    // Kiểm tra ObjectId hợp lệ
    if (!mongoose.Types.ObjectId.isValid(exerciseId)) {
      return sendError(res, 400, 'ID bài tập không hợp lệ');
    }

    // Tìm thông tin giáo viên
    const teacherUser = await UserModel.findOne({ authId: user._id, deleted: false });
    if (!teacherUser) return sendError(res, 404, 'Không tìm thấy thông tin giáo viên');

    // Lấy thông tin bài tập với populate class để lấy tên lớp
    const exercise = await ExerciseModel.findById(exerciseId).populate('classId', 'nameClass');
    if (!exercise) return sendError(res, 404, 'Không tìm thấy bài tập');

    // Kiểm tra quyền sửa (giáo viên tạo ra bài tập này)
    if (String(exercise.createdBy) !== String(teacherUser._id)) {
      return sendError(res, 403, 'Bạn không có quyền sửa bài tập này');
    }

    // Lưu thông tin cũ để kiểm tra thay đổi
    const oldDueDate = exercise.dueDate;

    // Cập nhật thông tin cơ bản
    if (title !== undefined) exercise.title = title;
    if (description !== undefined) exercise.description = description;
    if (maxScore !== undefined) exercise.maxScore = maxScore;
    if (subject !== undefined) exercise.subject = subject;
    if (type !== undefined) exercise.type = type;

    // Cập nhật dueDate với validation
    if (dueDate !== undefined) {
      const newDueDate = new Date(dueDate);
      const now = new Date();

      // Chỉ cho phép gia hạn hoặc cập nhật nếu chưa hết hạn
      if (oldDueDate && oldDueDate < now && newDueDate < now) {
        return sendError(
          res,
          400,
          'Không thể đặt thời hạn nộp bài trong quá khứ khi bài tập đã hết hạn',
        );
      }

      exercise.dueDate = newDueDate;
    }

    // Cập nhật questions cho bài tập trắc nghiệm
    if (questions !== undefined) {
      if (exercise.type === 'multiple_choice' || type === 'multiple_choice') {
        exercise.questions = questions;

        // Tính lại maxScore nếu không được cung cấp
        if (maxScore === undefined && questions.length > 0) {
          exercise.maxScore = questions.reduce(
            (total: number, q: any) => total + (q.points || 1),
            0,
          );
        }
      }
    }

    // Xử lý xóa file cũ nếu có
    if (removeFileIds && Array.isArray(removeFileIds) && removeFileIds.length > 0) {
      // Lấy thông tin các file cần xóa trước khi xóa khỏi database
      const filesToDelete = [];
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
    }

    // Xử lý file attachments mới nếu có
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      console.log(`📎 Processing ${files.length} new file(s)...`);

      const newAttachments: any[] = [];
      const classInfo = exercise.classId as any;

      for (const file of files) {
        const uploadResult = await uploadExerciseFileToSupabase({
          file,
          teacherName: teacherUser.username || 'Teacher',
          className: classInfo?.nameClass || 'Unknown_Class',
          exerciseTitle: exercise.title,
        });

        if (uploadResult.success) {
          newAttachments.push({
            fileName: uploadResult.fileName,
            fileUrl: uploadResult.fileUrl,
            fileSize: file.size,
            mimeType: file.mimetype,
            uploadedAt: new Date(),
          });
          console.log(`✅ New file uploaded: ${uploadResult.fileName}`);
        } else {
          console.error(`❌ Failed to upload file: ${file.originalname}`, uploadResult.error);
          return sendError(res, 500, `Lỗi upload file: ${uploadResult.error}`);
        }
      }

      // Thêm file mới vào danh sách attachments hiện có
      for (const newAttachment of newAttachments) {
        exercise.attachments.push(newAttachment);
      }
    }

    // Cập nhật thời gian chỉnh sửa
    exercise.updatedAt = new Date();

    await exercise.save();

    const populatedExercise = await ExerciseModel.findById(exercise._id)
      .populate('classId', 'nameClass subject gradeLevel')
      .populate('createdBy', 'username email');

    return sendSuccess(res, {
      message: 'Cập nhật bài tập thành công',
      data: populatedExercise,
    });
  } catch (err) {
    console.error('Error in updateExercise:', err);
    return sendError(res, 500, 'Lỗi server khi cập nhật bài tập');
  }
};
