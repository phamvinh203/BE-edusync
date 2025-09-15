import ExerciseModel from '../models/exercises.model';
import UserModel from '../models/user.model';
import AuthModel from '../models/auth.model';
import ClassModel from '../models/class.model';
import { ValidationService } from './validation.service';
import { FileService } from './file.service';
import { calculateMaxScore, validateDueDate } from '../utils/exercise.utils';
import {
  CreateExerciseRequest,
  UpdateExerciseRequest,
  ExerciseData,
  Question,
} from '../types/exercise.types';

export class ExerciseService {
  /**
   * Tạo bài tập mới
   */
  static async createExercise(
    data: CreateExerciseRequest,
    classId: string,
    userId: string,
    files?: Express.Multer.File[],
  ): Promise<{
    success: boolean;
    exercise?: any;
    message?: string;
  }> {
    try {
      // Validate teacher role
      const roleValidation = ValidationService.validateTeacherRole({
        _id: userId,
        role: 'teacher',
      });
      if (!roleValidation.isValid) {
        return { success: false, message: roleValidation.message };
      }

      // Validate classId format
      const classIdValidation = ValidationService.validateObjectId(classId, 'ID lớp học');
      if (!classIdValidation.isValid) {
        return { success: false, message: classIdValidation.message };
      }

      // Get teacher info
      const teacherResult = await ValidationService.getTeacherInfo(userId);
      if (!teacherResult.success) {
        return { success: false, message: teacherResult.message };
      }

      // Validate class access
      const classResult = await ValidationService.validateClassAccess(
        classId,
        teacherResult.teacher!._id,
      );
      if (!classResult.success) {
        return { success: false, message: classResult.message };
      }

      // Calculate max score
      const calculatedMaxScore = calculateMaxScore(data.type, data.questions, data.maxScore);

      // Handle file uploads
      let attachments: any[] = [];
      if (files && files.length > 0) {
        const uploadResult = await FileService.uploadFiles(files, {
          teacherName: teacherResult.teacher!.username || 'Teacher',
          className: classResult.classData!.nameClass || 'Unknown_Class',
          exerciseTitle: data.title,
        });

        if (!uploadResult.success) {
          return { success: false, message: uploadResult.error };
        }

        attachments = uploadResult.attachments || [];
      }

      // Prepare exercise data
      const exerciseData: ExerciseData = {
        title: data.title,
        description: data.description,
        type: data.type,
        classId,
        createdBy: teacherResult.teacher!._id,
        dueDate: data.dueDate,
        maxScore: calculatedMaxScore,
        subject: data.subject || classResult.classData!.subject,
        status: 'open',
        submissions: [],
        attachments,
      };

      // Add questions for multiple choice exercises
      if (data.type === 'multiple_choice' && data.questions) {
        (exerciseData as any).questions = data.questions;
      }

      // Create exercise
      const newExercise = await ExerciseModel.create(exerciseData);

      const populatedExercise = await ExerciseModel.findById(newExercise._id)
        .populate('classId', 'nameClass subject gradeLevel')
        .populate('createdBy', 'username email');

      return {
        success: true,
        exercise: populatedExercise,
      };
    } catch (error) {
      console.error('Error in ExerciseService.createExercise:', error);
      return {
        success: false,
        message: 'Lỗi server khi tạo bài tập',
      };
    }
  }

  /**
   * Cập nhật bài tập
   */
  static async updateExercise(
    exerciseId: string,
    data: UpdateExerciseRequest,
    userId: string,
    files?: Express.Multer.File[],
  ): Promise<{
    success: boolean;
    exercise?: any;
    message?: string;
  }> {
    try {
      // Validate teacher role
      const roleValidation = ValidationService.validateTeacherRole({
        _id: userId,
        role: 'teacher',
      });
      if (!roleValidation.isValid) {
        return { success: false, message: roleValidation.message };
      }

      // Validate exerciseId format
      const exerciseIdValidation = ValidationService.validateObjectId(exerciseId, 'ID bài tập');
      if (!exerciseIdValidation.isValid) {
        return { success: false, message: exerciseIdValidation.message };
      }

      // Get teacher info
      const teacherResult = await ValidationService.getTeacherInfo(userId);
      if (!teacherResult.success) {
        return { success: false, message: teacherResult.message };
      }

      // Validate exercise access
      const exerciseResult = await ValidationService.validateExerciseAccess(
        exerciseId,
        teacherResult.teacher!._id,
      );
      if (!exerciseResult.success) {
        return { success: false, message: exerciseResult.message };
      }

      const exercise = exerciseResult.exercise!;
      const oldDueDate = exercise.dueDate;

      // Update basic information
      if (data.title !== undefined) exercise.title = data.title;
      if (data.description !== undefined) exercise.description = data.description;
      if (data.maxScore !== undefined) exercise.maxScore = data.maxScore;
      if (data.subject !== undefined) exercise.subject = data.subject;
      if (data.type !== undefined) exercise.type = data.type;

      // Validate and update due date
      if (data.dueDate !== undefined) {
        const newDueDate = new Date(data.dueDate);
        const dueDateValidation = validateDueDate(newDueDate, oldDueDate);

        if (!dueDateValidation.isValid) {
          return { success: false, message: dueDateValidation.message };
        }

        exercise.dueDate = newDueDate;
      }

      // Update questions for multiple choice exercises
      if (data.questions !== undefined) {
        if (exercise.type === 'multiple_choice' || data.type === 'multiple_choice') {
          exercise.questions = data.questions;

          // Recalculate maxScore if not provided
          if (data.maxScore === undefined && data.questions.length > 0) {
            exercise.maxScore = calculateMaxScore('multiple_choice', data.questions);
          }
        }
      }

      // Handle file deletion
      if (data.removeFileIds && data.removeFileIds.length > 0) {
        const deleteResult = await FileService.deleteFiles(exercise, data.removeFileIds);
        if (!deleteResult.success) {
          console.warn('Failed to delete some files:', deleteResult.error);
        }
      }

      // Handle new file uploads
      if (files && files.length > 0) {
        const classInfo = exercise.classId as any;
        const uploadResult = await FileService.uploadFiles(files, {
          teacherName: teacherResult.teacher!.username || 'Teacher',
          className: classInfo?.nameClass || 'Unknown_Class',
          exerciseTitle: exercise.title,
        });

        if (!uploadResult.success) {
          return { success: false, message: uploadResult.error };
        }

        // Add new attachments to existing ones
        const newAttachments = uploadResult.attachments || [];
        for (const newAttachment of newAttachments) {
          exercise.attachments.push(newAttachment);
        }
      }

      // Update timestamp
      exercise.updatedAt = new Date();

      await exercise.save();

      const populatedExercise = await ExerciseModel.findById(exercise._id)
        .populate('classId', 'nameClass subject gradeLevel')
        .populate('createdBy', 'username email');

      return {
        success: true,
        exercise: populatedExercise,
      };
    } catch (error) {
      console.error('Error in ExerciseService.updateExercise:', error);
      return {
        success: false,
        message: 'Lỗi server khi cập nhật bài tập',
      };
    }
  }

  /**
   * Xóa mềm bài tập (soft delete)
   */
  static async deleteExercise(
    exerciseId: string,
    userId: string,
  ): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      // Validate teacher role
      const roleValidation = ValidationService.validateTeacherRole({
        _id: userId,
        role: 'teacher',
      });
      if (!roleValidation.isValid) {
        return { success: false, message: roleValidation.message };
      }

      // Validate exerciseId format
      const exerciseIdValidation = ValidationService.validateObjectId(exerciseId, 'ID bài tập');
      if (!exerciseIdValidation.isValid) {
        return { success: false, message: exerciseIdValidation.message };
      }

      // Get teacher info
      const teacherResult = await ValidationService.getTeacherInfo(userId);
      if (!teacherResult.success) {
        return { success: false, message: teacherResult.message };
      }

      // Validate exercise access
      const exerciseResult = await ValidationService.validateExerciseAccess(
        exerciseId,
        teacherResult.teacher!._id,
      );
      if (!exerciseResult.success) {
        return { success: false, message: exerciseResult.message };
      }

      const exercise = exerciseResult.exercise!;

      // Kiểm tra xem bài tập đã bị xóa chưa
      if (exercise.deleted) {
        return { success: false, message: 'Bài tập đã được xóa trước đó' };
      }

      // Kiểm tra xem có bài nộp nào chưa
      if (exercise.submissions && exercise.submissions.length > 0) {
        return {
          success: false,
          message:
            'Không thể xóa bài tập đã có học sinh nộp bài. Vui lòng liên hệ admin nếu cần thiết.',
        };
      }

      // Thực hiện soft delete
      exercise.deleted = true;
      exercise.deletedAt = new Date();
      exercise.status = 'closed';

      await exercise.save();

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error in ExerciseService.deleteExercise:', error);
      return {
        success: false,
        message: 'Lỗi server khi xóa bài tập',
      };
    }
  }

  /**
   * Xem danh sách bài tập tại lớp classId (cho cả teacher và student)
   */
  static async getExercisesByClass(
    classId: string,
    authId: string,
    userRole: string,
    options?: {
      page?: number;
      limit?: number;
      status?: string;
      type?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<{
    success: boolean;
    exercises?: any[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
    message?: string;
  }> {
    try {
      // Validate classId format
      const classIdValidation = ValidationService.validateObjectId(classId, 'ID lớp học');
      if (!classIdValidation.isValid) {
        return { success: false, message: classIdValidation.message };
      }

      // Get current user info
      const currentUser = await UserModel.findOne({ authId, deleted: false });
      if (!currentUser) {
        return { success: false, message: 'Không tìm thấy thông tin người dùng' };
      }

      // Get class info
      const foundClass = await ClassModel.findById(classId);
      if (!foundClass) {
        return { success: false, message: 'Không tìm thấy lớp học' };
      }

      // Check access permission based on role
      if (userRole === 'teacher') {
        // Teacher chỉ xem được lớp do mình tạo
        if (String(foundClass.teacherId) !== String(currentUser._id)) {
          return {
            success: false,
            message: 'Bạn không có quyền xem bài tập của lớp này',
          };
        }
      } else if (userRole === 'student') {
        // Student chỉ xem được lớp mà mình đã tham gia (đã được approve)
        const isStudentInClass = foundClass.students.some(
          (studentId: any) => String(studentId) === String(currentUser._id),
        );

        if (!isStudentInClass) {
          return {
            success: false,
            message:
              'Bạn không có quyền xem bài tập của lớp này (chỉ học sinh trong lớp mới được xem)',
          };
        }
      } else if (userRole !== 'admin') {
        return {
          success: false,
          message: 'Bạn không có quyền truy cập',
        };
      }

      // Build query filters
      const query: any = {
        classId: classId,
        deleted: { $ne: true }, // Loại bỏ bài tập đã bị xóa
      };

      // Apply optional filters
      if (options?.status) {
        query.status = options.status;
      }

      if (options?.type) {
        query.type = options.type;
      }

      // Build sort options
      const sortBy = options?.sortBy || 'createdAt';
      const sortOrder = options?.sortOrder === 'asc' ? 1 : -1;
      const sort: any = { [sortBy]: sortOrder };

      // Handle pagination
      const page = Math.max(1, options?.page || 1);
      const limit = Math.min(50, Math.max(1, options?.limit || 10)); // Giới hạn tối đa 50 items
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const totalItems = await ExerciseModel.countDocuments(query);

      // Get exercises with pagination
      const exercises = await ExerciseModel.find(query)
        .populate('classId', 'nameClass subject gradeLevel')
        .populate('createdBy', 'username email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(); // Sử dụng lean() để tăng hiệu suất

      // Format response data based on user role
      const formattedExercises = exercises.map((exercise: any) => {
        const baseData = {
          _id: exercise._id,
          title: exercise.title,
          description: exercise.description,
          type: exercise.type,
          subject: exercise.subject,
          maxScore: exercise.maxScore,
          startDate: exercise.startDate,
          dueDate: exercise.dueDate,
          status: exercise.status,
          createdAt: exercise.createdAt,
          updatedAt: exercise.updatedAt,
          class: {
            _id: exercise.classId._id,
            nameClass: exercise.classId.nameClass,
            subject: exercise.classId.subject,
            gradeLevel: exercise.classId.gradeLevel,
          },
          createdBy: {
            _id: exercise.createdBy._id,
            username: exercise.createdBy.username,
            email: exercise.createdBy.email,
          },
          hasAttachments: exercise.attachments && exercise.attachments.length > 0,
          attachmentCount: exercise.attachments ? exercise.attachments.length : 0,
          questionCount: exercise.questions ? exercise.questions.length : 0,
          // Thêm thông tin về deadline
          isOverdue: new Date() > new Date(exercise.dueDate),
          daysToDueDate: Math.ceil(
            (new Date(exercise.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
          ),
        };

        // Teacher xem được số lượng bài nộp
        if (userRole === 'teacher' || userRole === 'admin') {
          return {
            ...baseData,
            submissionCount: exercise.submissions ? exercise.submissions.length : 0,
          };
        }

        // Student chỉ xem thông tin cơ bản và trạng thái bài nộp của mình
        const studentSubmission = exercise.submissions?.find(
          (sub: any) => String(sub.studentId) === String(currentUser._id),
        );

        return {
          ...baseData,
          mySubmission: studentSubmission
            ? {
                submittedAt: studentSubmission.submittedAt,
                grade: studentSubmission.grade,
                feedback: studentSubmission.feedback,
              }
            : null,
        };
      });

      // Calculate pagination info
      const totalPages = Math.ceil(totalItems / limit);
      const pagination = {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
      };

      return {
        success: true,
        exercises: formattedExercises,
        pagination,
      };
    } catch (error) {
      console.error('Error in ExerciseService.getExercisesByClass:', error);
      return {
        success: false,
        message: 'Lỗi server khi lấy danh sách bài tập',
      };
    }
  }

  /**
   * Lấy chi tiết bài tập theo ID (cho cả teacher và student)
   */
  static async getExerciseById(
    classId: string,
    exerciseId: string,
    authId: string,
    userRole: string,
  ): Promise<{
    success: boolean;
    exercise?: any;
    message?: string;
  }> {
    try {
      // Validate IDs format
      const classIdValidation = ValidationService.validateObjectId(classId, 'ID lớp học');
      if (!classIdValidation.isValid) {
        return { success: false, message: classIdValidation.message };
      }

      const exerciseIdValidation = ValidationService.validateObjectId(exerciseId, 'ID bài tập');
      if (!exerciseIdValidation.isValid) {
        return { success: false, message: exerciseIdValidation.message };
      }

      // Get current user info
      const currentUser = await UserModel.findOne({ authId, deleted: false });
      if (!currentUser) {
        return { success: false, message: 'Không tìm thấy thông tin người dùng' };
      }

      // Get class info
      const foundClass = await ClassModel.findById(classId);
      if (!foundClass) {
        return { success: false, message: 'Không tìm thấy lớp học' };
      }

      // Check access permission based on role
      if (userRole === 'teacher') {
        // Teacher chỉ xem được bài tập của lớp do mình tạo
        if (String(foundClass.teacherId) !== String(currentUser._id)) {
          return {
            success: false,
            message: 'Bạn không có quyền xem bài tập của lớp này',
          };
        }
      } else if (userRole === 'student') {
        // Student chỉ xem được bài tập của lớp mà mình đã tham gia
        const isStudentInClass = foundClass.students.some(
          (studentId: any) => String(studentId) === String(currentUser._id),
        );

        if (!isStudentInClass) {
          return {
            success: false,
            message:
              'Bạn không có quyền xem bài tập của lớp này (chỉ học sinh trong lớp mới được xem)',
          };
        }
      } else if (userRole !== 'admin') {
        return {
          success: false,
          message: 'Bạn không có quyền truy cập',
        };
      }

      // Get exercise with full details
      const exercise = await ExerciseModel.findOne({
        _id: exerciseId,
        classId: classId,
        deleted: { $ne: true },
      })
        .populate('classId', 'nameClass subject gradeLevel')
        .populate('createdBy', 'username email')
        .populate('submissions.studentId', 'username email')
        .lean();

      if (!exercise) {
        return {
          success: false,
          message: 'Không tìm thấy bài tập',
        };
      }

      // Check if teacher has access to this exercise
      if (
        userRole === 'teacher' &&
        String((exercise.createdBy as any)._id) !== String(currentUser._id)
      ) {
        return {
          success: false,
          message: 'Bạn không có quyền xem bài tập này',
        };
      }

      // Format response data with full details
      const formattedExercise = {
        _id: exercise._id,
        title: exercise.title,
        description: exercise.description,
        type: exercise.type,
        subject: exercise.subject,
        maxScore: exercise.maxScore,
        startDate: exercise.startDate,
        dueDate: exercise.dueDate,
        status: exercise.status,
        createdAt: exercise.createdAt,
        updatedAt: exercise.updatedAt,
        class: {
          _id: (exercise.classId as any)._id,
          nameClass: (exercise.classId as any).nameClass,
          subject: (exercise.classId as any).subject,
          gradeLevel: (exercise.classId as any).gradeLevel,
        },
        createdBy: {
          _id: (exercise.createdBy as any)._id,
          username: (exercise.createdBy as any).username,
          email: (exercise.createdBy as any).email,
        },
        // Include full questions for multiple choice exercises
        questions: exercise.questions || [],
        // Include attachments
        attachments: exercise.attachments || [],
        // Include submission details
        submissions:
          exercise.submissions?.map((submission: any) => ({
            _id: submission._id,
            student: {
              _id: submission.studentId._id,
              username: submission.studentId.username,
              email: submission.studentId.email,
            },
            submittedAt: submission.submittedAt,
            content: submission.content,
            fileUrl: submission.fileUrl,
            answers: submission.answers,
            grade: submission.grade,
            feedback: submission.feedback,
          })) || [],
        // Additional statistics
        submissionCount: exercise.submissions ? exercise.submissions.length : 0,
        hasAttachments: exercise.attachments && exercise.attachments.length > 0,
        attachmentCount: exercise.attachments ? exercise.attachments.length : 0,
        questionCount: exercise.questions ? exercise.questions.length : 0,
        isOverdue: new Date() > new Date(exercise.dueDate),
        daysToDueDate: Math.ceil(
          (new Date(exercise.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
        ),
      };

      return {
        success: true,
        exercise: formattedExercise,
      };
    } catch (error) {
      console.error('Error in ExerciseService.getExerciseById:', error);
      return {
        success: false,
        message: 'Lỗi server khi lấy chi tiết bài tập',
      };
    }
  }

  /**
   * Học sinh nộp bài tập
   */
  static async studentSubmitExercise(
    classId: string,
    exerciseId: string,
    authId: string,
    submissionData: any,
    files?: Express.Multer.File[],
  ): Promise<{
    success: boolean;
    submission?: any;
    message?: string;
  }> {
    try {
      // Validate IDs format
      const classIdValidation = ValidationService.validateObjectId(classId, 'ID lớp học');
      if (!classIdValidation.isValid) {
        return { success: false, message: classIdValidation.message };
      }

      const exerciseIdValidation = ValidationService.validateObjectId(exerciseId, 'ID bài tập');
      if (!exerciseIdValidation.isValid) {
        return { success: false, message: exerciseIdValidation.message };
      }

      // Get student info
      const student = await UserModel.findOne({ authId, deleted: false }).populate('authId');
      if (!student) {
        return { success: false, message: 'Không tìm thấy thông tin học sinh' };
      }

      const authData = student.authId as any;
      if (!authData || authData.role !== 'student') {
        return { success: false, message: 'Chỉ học sinh mới được nộp bài tập' };
      }

      // Get class info and check student access
      const foundClass = await ClassModel.findById(classId);
      if (!foundClass) {
        return { success: false, message: 'Không tìm thấy lớp học' };
      }

      // Check if student is in class
      const isStudentInClass = foundClass.students.some(
        (studentId: any) => String(studentId) === String(student._id),
      );

      if (!isStudentInClass) {
        return {
          success: false,
          message: 'Bạn không thuộc lớp học này, không thể nộp bài tập',
        };
      }

      // Get exercise info
      const exercise = await ExerciseModel.findOne({
        _id: exerciseId,
        classId: classId,
        deleted: { $ne: true },
      });

      if (!exercise) {
        return { success: false, message: 'Không tìm thấy bài tập' };
      }

      // Check exercise status and due date
      if (exercise.status === 'closed') {
        return { success: false, message: 'Bài tập đã đóng, không thể nộp bài' };
      }

      const currentTime = new Date();
      const dueDate = new Date(exercise.dueDate);

      if (currentTime > dueDate) {
        return { success: false, message: 'Đã hết hạn nộp bài tập' };
      }

      // Check if student already submitted
      const existingSubmission = exercise.submissions.find(
        (sub: any) => String(sub.studentId) === String(student._id),
      );

      if (existingSubmission) {
        return { success: false, message: 'Bạn đã nộp bài tập này rồi. Không thể nộp lại' };
      }

      // Validate submission based on exercise type
      let submissionContent: any = {
        studentId: student._id,
        submittedAt: new Date(),
      };

      if (exercise.type === 'essay') {
        // Essay submission - require content or file
        if (!submissionData.content && (!files || files.length === 0)) {
          return {
            success: false,
            message: 'Bài tập tự luận cần có nội dung text hoặc file đính kèm',
          };
        }

        submissionContent.content = submissionData.content || '';

        // Handle file upload for essay
        if (files && files.length > 0) {
          const uploadResult = await FileService.uploadFiles(files, {
            teacherName: authData.username || 'Teacher',
            className: foundClass.nameClass || 'Unknown_Class',
            exerciseTitle: exercise.title,
          });

          if (!uploadResult.success) {
            return { success: false, message: uploadResult.error };
          }

          // For essay, we store the first file URL (main submission file)
          if (uploadResult.attachments && uploadResult.attachments.length > 0) {
            submissionContent.fileUrl = uploadResult.attachments[0].fileUrl;
          }
        }
      } else if (exercise.type === 'multiple_choice') {
        // Multiple choice submission - require answers array
        if (!submissionData.answers || !Array.isArray(submissionData.answers)) {
          return {
            success: false,
            message: 'Bài tập trắc nghiệm cần có đáp án được chọn',
          };
        }

        // Validate answers format
        const answers = submissionData.answers;
        const questionCount = exercise.questions ? exercise.questions.length : 0;

        if (answers.length !== questionCount) {
          return {
            success: false,
            message: `Cần trả lời đủ ${questionCount} câu hỏi`,
          };
        }

        // Validate each answer is a valid option index
        for (let i = 0; i < answers.length; i++) {
          const answerIndex = answers[i];
          const question = exercise.questions[i];

          if (
            typeof answerIndex !== 'number' ||
            answerIndex < 0 ||
            answerIndex >= question.options.length
          ) {
            return {
              success: false,
              message: `Đáp án câu ${i + 1} không hợp lệ`,
            };
          }
        }

        submissionContent.answers = answers;

        // Auto-calculate grade for multiple choice
        let correctCount = 0;
        let totalPoints = 0;

        for (let i = 0; i < answers.length; i++) {
          const question = exercise.questions[i];
          const studentAnswer = answers[i];
          const questionPoints = question.points || 1;

          totalPoints += questionPoints;

          // Check if student answer is in correct answers array
          if (question.correctAnswers.includes(studentAnswer)) {
            correctCount += questionPoints;
          }
        }

        // Calculate percentage grade based on max score
        const maxScore = exercise.maxScore || 0;
        const percentage = totalPoints > 0 ? (correctCount / totalPoints) * 100 : 0;
        submissionContent.grade = Math.min(maxScore, (percentage / 100) * maxScore);
      } else if (exercise.type === 'file_upload') {
        // File upload submission - require at least one file
        if (!files || files.length === 0) {
          return {
            success: false,
            message: 'Bài tập yêu cầu nộp file, vui lòng chọn file để upload',
          };
        }

        const uploadResult = await FileService.uploadFiles(files, {
          teacherName: authData.username || 'Teacher',
          className: foundClass.nameClass || 'Unknown_Class',
          exerciseTitle: exercise.title,
        });

        if (!uploadResult.success) {
          return { success: false, message: uploadResult.error };
        }

        // For file upload, store the main file URL
        if (uploadResult.attachments && uploadResult.attachments.length > 0) {
          submissionContent.fileUrl = uploadResult.attachments[0].fileUrl;
        }

        // Optional content for file upload
        submissionContent.content = submissionData.content || '';
      }

      // Add submission to exercise
      exercise.submissions.push(submissionContent);
      exercise.updatedAt = new Date();

      await exercise.save();

      // Get the newly created submission with its generated _id
      const newSubmission = exercise.submissions[exercise.submissions.length - 1];

      // Return formatted submission data
      const formattedSubmission = {
        _id: newSubmission._id, // submissionId được tự động tạo
        submissionId: newSubmission._id, // Bổ sung submissionId để dễ sử dụng
        student: {
          _id: student._id,
          username: student.username,
          email: student.email,
        },
        exercise: {
          _id: exercise._id,
          title: exercise.title,
          type: exercise.type,
          maxScore: exercise.maxScore,
        },
        submittedAt: submissionContent.submittedAt,
        content: submissionContent.content,
        fileUrl: submissionContent.fileUrl,
        answers: submissionContent.answers,
        grade: submissionContent.grade,
        feedback: submissionContent.feedback,
      };

      return {
        success: true,
        submission: formattedSubmission,
      };
    } catch (error) {
      console.error('Error in ExerciseService.studentSubmitExercise:', error);
      return {
        success: false,
        message: 'Lỗi server khi nộp bài tập',
      };
    }
  }

  /**
   * Lấy bài làm của học sinh cho bài tập cụ thể
   */
  static async getMySubmission(
    exerciseId: string,
    authId: string,
  ): Promise<{
    success: boolean;
    submission?: any;
    message?: string;
  }> {
    try {
      // Validate exerciseId format
      const exerciseIdValidation = ValidationService.validateObjectId(exerciseId, 'ID bài tập');
      if (!exerciseIdValidation.isValid) {
        return { success: false, message: exerciseIdValidation.message };
      }

      // Get student info
      const student = await UserModel.findOne({ authId, deleted: false }).populate('authId');
      if (!student) {
        return { success: false, message: 'Không tìm thấy thông tin học sinh' };
      }

      const authData = student.authId as any;
      if (!authData || authData.role !== 'student') {
        return { success: false, message: 'Chỉ học sinh mới được xem bài làm của mình' };
      }

      // Get exercise with submissions
      const exercise = await ExerciseModel.findOne({
        _id: exerciseId,
        deleted: { $ne: true },
      })
        .populate('classId', 'nameClass subject gradeLevel')
        .populate('createdBy', 'username email');

      if (!exercise) {
        return { success: false, message: 'Không tìm thấy bài tập' };
      }

      // Check if student is in the class
      const foundClass = await ClassModel.findById(exercise.classId);
      if (!foundClass) {
        return { success: false, message: 'Không tìm thấy lớp học' };
      }

      const isStudentInClass = foundClass.students.some(
        (studentId: any) => String(studentId) === String(student._id),
      );

      if (!isStudentInClass) {
        return {
          success: false,
          message: 'Bạn không thuộc lớp học này, không thể xem bài làm',
        };
      }

      // Find student's submission
      const submission = exercise.submissions.find(
        (sub: any) => String(sub.studentId) === String(student._id),
      );

      if (!submission) {
        return { success: false, message: 'Bạn chưa nộp bài tập này' };
      }

      // Format submission data
      const formattedSubmission = {
        _id: submission._id,
        exercise: {
          _id: exercise._id,
          title: exercise.title,
          description: exercise.description,
          type: exercise.type,
          maxScore: exercise.maxScore,
          dueDate: exercise.dueDate,
          questions: exercise.type === 'multiple_choice' ? exercise.questions : undefined,
        },
        submittedAt: submission.submittedAt,
        content: submission.content,
        fileUrl: submission.fileUrl,
        answers: submission.answers,
        grade: submission.grade,
        feedback: submission.feedback,
        isLate: submission.submittedAt > exercise.dueDate,
      };

      return {
        success: true,
        submission: formattedSubmission,
      };
    } catch (error) {
      console.error('Error in ExerciseService.getMySubmission:', error);
      return {
        success: false,
        message: 'Lỗi server khi lấy bài làm',
      };
    }
  }

  /**
   * Lấy danh sách tất cả bài tập đã nộp của học sinh
   */
  static async getMySubmissions(
    authId: string,
    options?: {
      page?: number;
      limit?: number;
      status?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      classId?: string;
    },
  ): Promise<{
    success: boolean;
    submissions?: any[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
    message?: string;
  }> {
    try {
      // Get student info
      const student = await UserModel.findOne({ authId, deleted: false }).populate('authId');
      if (!student) {
        return { success: false, message: 'Không tìm thấy thông tin học sinh' };
      }

      const authData = student.authId as any;
      if (!authData || authData.role !== 'student') {
        return { success: false, message: 'Chỉ học sinh mới được xem danh sách bài làm của mình' };
      }

      // Build exercise query
      const exerciseQuery: any = {
        deleted: { $ne: true },
        'submissions.studentId': student._id,
      };

      // Apply class filter if provided
      if (options?.classId) {
        const classIdValidation = ValidationService.validateObjectId(options.classId, 'ID lớp học');
        if (!classIdValidation.isValid) {
          return { success: false, message: classIdValidation.message };
        }

        // Check if student is in the specified class
        const foundClass = await ClassModel.findById(options.classId);
        if (!foundClass) {
          return { success: false, message: 'Không tìm thấy lớp học' };
        }

        const isStudentInClass = foundClass.students.some(
          (studentId: any) => String(studentId) === String(student._id),
        );

        if (!isStudentInClass) {
          return {
            success: false,
            message: 'Bạn không thuộc lớp học này, không thể xem bài làm',
          };
        }

        exerciseQuery.classId = options.classId;
      }

      // Get exercises with student's submissions
      const exercises = await ExerciseModel.find(exerciseQuery)
        .populate('classId', 'nameClass subject gradeLevel')
        .populate('createdBy', 'username email')
        .lean();

      // Extract submissions and add exercise info
      let allSubmissions: any[] = [];

      exercises.forEach((exercise: any) => {
        const studentSubmissions = exercise.submissions.filter(
          (sub: any) => String(sub.studentId) === String(student._id),
        );

        studentSubmissions.forEach((submission: any) => {
          allSubmissions.push({
            _id: submission._id,
            submissionId: submission._id,
            exercise: {
              _id: exercise._id,
              title: exercise.title,
              description: exercise.description,
              type: exercise.type,
              maxScore: exercise.maxScore,
              dueDate: exercise.dueDate,
              status: exercise.status,
              class: {
                _id: exercise.classId._id,
                nameClass: exercise.classId.nameClass,
                subject: exercise.classId.subject,
                gradeLevel: exercise.classId.gradeLevel,
              },
              createdBy: {
                _id: exercise.createdBy._id,
                username: exercise.createdBy.username,
                email: exercise.createdBy.email,
              },
            },
            submittedAt: submission.submittedAt,
            content: submission.content,
            fileUrl: submission.fileUrl,
            answers: submission.answers,
            grade: submission.grade,
            feedback: submission.feedback,
            isLate: submission.submittedAt > exercise.dueDate,
            hasGrade: submission.grade !== undefined && submission.grade !== null,
            // Additional calculated fields
            isOverdue: new Date() > new Date(exercise.dueDate),
            daysSinceSubmission: Math.floor(
              (new Date().getTime() - new Date(submission.submittedAt).getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          });
        });
      });

      // Apply status filter
      if (options?.status) {
        if (options.status === 'graded') {
          allSubmissions = allSubmissions.filter((sub) => sub.hasGrade);
        } else if (options.status === 'ungraded') {
          allSubmissions = allSubmissions.filter((sub) => !sub.hasGrade);
        } else if (options.status === 'late') {
          allSubmissions = allSubmissions.filter((sub) => sub.isLate);
        } else if (options.status === 'ontime') {
          allSubmissions = allSubmissions.filter((sub) => !sub.isLate);
        }
      }

      // Sort submissions
      const sortBy = options?.sortBy || 'submittedAt';
      const sortOrder = options?.sortOrder === 'asc' ? 1 : -1;

      allSubmissions.sort((a: any, b: any) => {
        let aValue, bValue;

        switch (sortBy) {
          case 'grade':
            aValue = a.grade || 0;
            bValue = b.grade || 0;
            break;
          case 'exerciseTitle':
            aValue = a.exercise.title || '';
            bValue = b.exercise.title || '';
            break;
          case 'className':
            aValue = a.exercise.class.nameClass || '';
            bValue = b.exercise.class.nameClass || '';
            break;
          case 'dueDate':
            aValue = a.exercise.dueDate;
            bValue = b.exercise.dueDate;
            break;
          case 'submittedAt':
          default:
            aValue = a.submittedAt;
            bValue = b.submittedAt;
            break;
        }

        if (aValue < bValue) return -1 * sortOrder;
        if (aValue > bValue) return 1 * sortOrder;
        return 0;
      });

      // Handle pagination
      const page = Math.max(1, options?.page || 1);
      const limit = Math.min(50, Math.max(1, options?.limit || 10));
      const totalItems = allSubmissions.length;
      const totalPages = Math.ceil(totalItems / limit);
      const skip = (page - 1) * limit;

      const paginatedSubmissions = allSubmissions.slice(skip, skip + limit);

      const pagination = {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
      };

      return {
        success: true,
        submissions: paginatedSubmissions,
        pagination,
      };
    } catch (error) {
      console.error('Error in ExerciseService.getMySubmissions:', error);
      return {
        success: false,
        message: 'Lỗi server khi lấy danh sách bài tập đã nộp',
      };
    }
  }

  /**
   * Lấy danh sách tất cả bài nộp của học sinh cho một bài tập (cho giáo viên)
   */
  static async getSubmissions(
    classId: string,
    exerciseId: string,
    authId: string,
    options?: {
      page?: number;
      limit?: number;
      graded?: boolean;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<{
    success: boolean;
    submissions?: any[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
    statistics?: {
      totalSubmissions: number;
      gradedSubmissions: number;
      ungradedSubmissions: number;
      averageGrade: number;
      maxGrade: number;
      minGrade: number;
    };
    message?: string;
  }> {
    try {
      // Validate IDs format
      const classIdValidation = ValidationService.validateObjectId(classId, 'ID lớp học');
      if (!classIdValidation.isValid) {
        return { success: false, message: classIdValidation.message };
      }

      const exerciseIdValidation = ValidationService.validateObjectId(exerciseId, 'ID bài tập');
      if (!exerciseIdValidation.isValid) {
        return { success: false, message: exerciseIdValidation.message };
      }

      // Get teacher info
      const teacherResult = await ValidationService.getTeacherInfo(authId);
      if (!teacherResult.success) {
        return { success: false, message: teacherResult.message };
      }

      // Validate class access
      const classResult = await ValidationService.validateClassAccess(
        classId,
        teacherResult.teacher!._id,
      );
      if (!classResult.success) {
        return { success: false, message: classResult.message };
      }

      // Get exercise
      const exercise = await ExerciseModel.findOne({
        _id: exerciseId,
        classId: classId,
        deleted: { $ne: true },
      })
        .populate('classId', 'nameClass subject gradeLevel')
        .populate('submissions.studentId', 'username email authId');

      if (!exercise) {
        return { success: false, message: 'Không tìm thấy bài tập' };
      }

      // Check if teacher owns this exercise
      if (String(exercise.createdBy) !== String(teacherResult.teacher!._id)) {
        return {
          success: false,
          message: 'Bạn không có quyền xem bài nộp của bài tập này',
        };
      }

      // Filter submissions based on options
      let submissions = [...exercise.submissions];

      if (options?.graded !== undefined) {
        submissions = submissions.filter((sub: any) => {
          if (options.graded) {
            return sub.grade !== undefined && sub.grade !== null;
          } else {
            return sub.grade === undefined || sub.grade === null;
          }
        });
      }

      // Sort submissions
      const sortBy = options?.sortBy || 'submittedAt';
      const sortOrder = options?.sortOrder === 'asc' ? 1 : -1;

      submissions.sort((a: any, b: any) => {
        let aValue, bValue;

        switch (sortBy) {
          case 'grade':
            aValue = a.grade || 0;
            bValue = b.grade || 0;
            break;
          case 'studentName':
            aValue = a.studentId?.username || '';
            bValue = b.studentId?.username || '';
            break;
          case 'submittedAt':
          default:
            aValue = a.submittedAt;
            bValue = b.submittedAt;
            break;
        }

        if (aValue < bValue) return -1 * sortOrder;
        if (aValue > bValue) return 1 * sortOrder;
        return 0;
      });

      // Handle pagination
      const page = Math.max(1, options?.page || 1);
      const limit = Math.min(50, Math.max(1, options?.limit || 10));
      const totalItems = submissions.length;
      const totalPages = Math.ceil(totalItems / limit);
      const skip = (page - 1) * limit;

      const paginatedSubmissions = submissions.slice(skip, skip + limit);

      // Format submissions
      const formattedSubmissions = paginatedSubmissions.map((submission: any) => ({
        _id: submission._id,
        student: {
          _id: submission.studentId._id,
          username: submission.studentId.username,
          email: submission.studentId.email,
        },
        submittedAt: submission.submittedAt,
        content: submission.content,
        fileUrl: submission.fileUrl,
        answers: submission.answers,
        grade: submission.grade,
        feedback: submission.feedback,
        isLate: submission.submittedAt > exercise.dueDate,
        hasGrade: submission.grade !== undefined && submission.grade !== null,
      }));

      // Calculate statistics
      const gradedSubmissions = exercise.submissions.filter(
        (sub: any) => sub.grade !== undefined && sub.grade !== null,
      );
      const grades = gradedSubmissions.map((sub: any) => sub.grade);

      const statistics = {
        totalSubmissions: exercise.submissions.length,
        gradedSubmissions: gradedSubmissions.length,
        ungradedSubmissions: exercise.submissions.length - gradedSubmissions.length,
        averageGrade: grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0,
        maxGrade: grades.length > 0 ? Math.max(...grades) : 0,
        minGrade: grades.length > 0 ? Math.min(...grades) : 0,
      };

      const pagination = {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
      };

      return {
        success: true,
        submissions: formattedSubmissions,
        pagination,
        statistics,
      };
    } catch (error) {
      console.error('Error in ExerciseService.getSubmissions:', error);
      return {
        success: false,
        message: 'Lỗi server khi lấy danh sách bài nộp',
      };
    }
  }

  /**
   * Chấm điểm bài làm
   */
  static async gradeSubmission(
    classId: string,
    exerciseId: string,
    submissionId: string,
    authId: string,
    gradeData: {
      grade?: number;
      feedback?: string;
    },
  ): Promise<{
    success: boolean;
    submission?: any;
    message?: string;
  }> {
    try {
      // Validate IDs format
      const classIdValidation = ValidationService.validateObjectId(classId, 'ID lớp học');
      if (!classIdValidation.isValid) {
        return { success: false, message: classIdValidation.message };
      }

      const exerciseIdValidation = ValidationService.validateObjectId(exerciseId, 'ID bài tập');
      if (!exerciseIdValidation.isValid) {
        return { success: false, message: exerciseIdValidation.message };
      }

      const submissionIdValidation = ValidationService.validateObjectId(submissionId, 'ID bài nộp');
      if (!submissionIdValidation.isValid) {
        return { success: false, message: submissionIdValidation.message };
      }

      // Get teacher info
      const teacherResult = await ValidationService.getTeacherInfo(authId);
      if (!teacherResult.success) {
        return { success: false, message: teacherResult.message };
      }

      // Validate class access
      const classResult = await ValidationService.validateClassAccess(
        classId,
        teacherResult.teacher!._id,
      );
      if (!classResult.success) {
        return { success: false, message: classResult.message };
      }

      // Get exercise
      const exercise = await ExerciseModel.findOne({
        _id: exerciseId,
        classId: classId,
        deleted: { $ne: true },
      }).populate('submissions.studentId', 'username email');

      if (!exercise) {
        return { success: false, message: 'Không tìm thấy bài tập' };
      }

      // Check if teacher owns this exercise
      if (String(exercise.createdBy) !== String(teacherResult.teacher!._id)) {
        return {
          success: false,
          message: 'Bạn không có quyền chấm bài tập này',
        };
      }

      // Find submission
      const submissionIndex = exercise.submissions.findIndex(
        (sub: any) => String(sub._id) === String(submissionId),
      );

      if (submissionIndex === -1) {
        return { success: false, message: 'Không tìm thấy bài nộp' };
      }

      const submission = exercise.submissions[submissionIndex];

      // Validate grade
      if (gradeData.grade !== undefined) {
        if (gradeData.grade < 0) {
          return { success: false, message: 'Điểm số không thể âm' };
        }

        const maxScore = exercise.maxScore || 0;
        if (gradeData.grade > maxScore) {
          return {
            success: false,
            message: `Điểm số không thể vượt quá điểm tối đa (${maxScore})`,
          };
        }
      }

      // Update submission
      if (gradeData.grade !== undefined) {
        submission.grade = gradeData.grade;
      }

      if (gradeData.feedback !== undefined) {
        submission.feedback = gradeData.feedback;
      }

      // Update exercise status to 'graded' if all submissions are graded
      const allGraded = exercise.submissions.every(
        (sub: any) => sub.grade !== undefined && sub.grade !== null,
      );

      if (allGraded && exercise.status !== 'graded') {
        exercise.status = 'graded';
      }

      exercise.updatedAt = new Date();

      await exercise.save();

      // Format response
      const populatedStudentId = submission.studentId as any;
      const formattedSubmission = {
        _id: submission._id,
        student: {
          _id: populatedStudentId._id,
          username: populatedStudentId.username,
          email: populatedStudentId.email,
        },
        exercise: {
          _id: exercise._id,
          title: exercise.title,
          maxScore: exercise.maxScore,
        },
        submittedAt: submission.submittedAt,
        content: submission.content,
        fileUrl: submission.fileUrl,
        answers: submission.answers,
        grade: submission.grade,
        feedback: submission.feedback,
        isLate: submission.submittedAt > exercise.dueDate,
      };

      return {
        success: true,
        submission: formattedSubmission,
      };
    } catch (error) {
      console.error('Error in ExerciseService.gradeSubmission:', error);
      return {
        success: false,
        message: 'Lỗi server khi chấm điểm bài làm',
      };
    }
  }

  /**
   * Lấy tổng quan tất cả bài tập đã tạo bởi teacher (đã chấm/chưa chấm)
   */
  static async getTeacherExercisesOverview(
    authId: string,
    options?: {
      page?: number;
      limit?: number;
      status?: string;
      gradingStatus?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      classId?: string;
    },
  ): Promise<{
    success: boolean;
    exercises?: any[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
    statistics?: {
      totalExercises: number;
      fullyGradedExercises: number;
      partiallyGradedExercises: number;
      ungradedExercises: number;
      totalSubmissions: number;
      gradedSubmissions: number;
      avgGradingProgress: number;
    };
    message?: string;
  }> {
    try {
      // Get teacher info
      const teacherResult = await ValidationService.getTeacherInfo(authId);
      if (!teacherResult.success) {
        return { success: false, message: teacherResult.message };
      }

      // Build exercise query
      const exerciseQuery: any = {
        createdBy: teacherResult.teacher!._id,
        deleted: { $ne: true },
      };

      // Apply class filter if provided
      if (options?.classId) {
        const classIdValidation = ValidationService.validateObjectId(options.classId, 'ID lớp học');
        if (!classIdValidation.isValid) {
          return { success: false, message: classIdValidation.message };
        }

        // Validate class access
        const classResult = await ValidationService.validateClassAccess(
          options.classId,
          teacherResult.teacher!._id,
        );
        if (!classResult.success) {
          return { success: false, message: classResult.message };
        }

        exerciseQuery.classId = options.classId;
      }

      // Apply status filter
      if (options?.status) {
        exerciseQuery.status = options.status;
      }

      // Get exercises with submissions and class info
      const exercises = await ExerciseModel.find(exerciseQuery)
        .populate('classId', 'nameClass subject gradeLevel')
        .populate('submissions.studentId', 'username email')
        .lean();

      // Process exercises and calculate grading statistics
      let processedExercises: any[] = [];
      let totalSubmissions = 0;
      let gradedSubmissions = 0;
      let fullyGradedExercises = 0;
      let partiallyGradedExercises = 0;
      let ungradedExercises = 0;

      exercises.forEach((exercise: any) => {
        const submissions = exercise.submissions || [];
        const submissionCount = submissions.length;
        const gradedCount = submissions.filter(
          (sub: any) => sub.grade !== undefined && sub.grade !== null,
        ).length;

        // Calculate grading status
        let gradingStatus = 'ungraded';
        if (gradedCount === 0) {
          gradingStatus = 'ungraded';
          ungradedExercises++;
        } else if (gradedCount === submissionCount && submissionCount > 0) {
          gradingStatus = 'fully_graded';
          fullyGradedExercises++;
        } else {
          gradingStatus = 'partially_graded';
          partiallyGradedExercises++;
        }

        totalSubmissions += submissionCount;
        gradedSubmissions += gradedCount;

        // Calculate average grade for graded submissions
        const gradedSubmissionsData = submissions.filter(
          (sub: any) => sub.grade !== undefined && sub.grade !== null,
        );
        const averageGrade =
          gradedSubmissionsData.length > 0
            ? gradedSubmissionsData.reduce((sum: number, sub: any) => sum + sub.grade, 0) /
              gradedSubmissionsData.length
            : null;

        const processedExercise = {
          _id: exercise._id,
          title: exercise.title,
          description: exercise.description,
          type: exercise.type,
          subject: exercise.subject,
          maxScore: exercise.maxScore,
          dueDate: exercise.dueDate,
          status: exercise.status,
          createdAt: exercise.createdAt,
          updatedAt: exercise.updatedAt,
          class: {
            _id: exercise.classId._id,
            nameClass: exercise.classId.nameClass,
            subject: exercise.classId.subject,
            gradeLevel: exercise.classId.gradeLevel,
          },
          // Submission statistics
          submissionCount,
          gradedCount,
          ungradedCount: submissionCount - gradedCount,
          gradingProgress: submissionCount > 0 ? (gradedCount / submissionCount) * 100 : 0,
          gradingStatus,
          averageGrade,
          // Additional info
          hasAttachments: exercise.attachments && exercise.attachments.length > 0,
          questionCount: exercise.questions ? exercise.questions.length : 0,
          isOverdue: new Date() > new Date(exercise.dueDate),
          daysSinceCreation: Math.floor(
            (new Date().getTime() - new Date(exercise.createdAt).getTime()) / (1000 * 60 * 60 * 24),
          ),
        };

        processedExercises.push(processedExercise);
      });

      // Apply grading status filter
      if (options?.gradingStatus) {
        if (options.gradingStatus === 'graded') {
          processedExercises = processedExercises.filter(
            (ex) => ex.gradingStatus === 'fully_graded',
          );
        } else if (options.gradingStatus === 'ungraded') {
          processedExercises = processedExercises.filter((ex) => ex.gradingStatus === 'ungraded');
        } else if (options.gradingStatus === 'partial') {
          processedExercises = processedExercises.filter(
            (ex) => ex.gradingStatus === 'partially_graded',
          );
        }
      }

      // Sort exercises
      const sortBy = options?.sortBy || 'createdAt';
      const sortOrder = options?.sortOrder === 'asc' ? 1 : -1;

      processedExercises.sort((a: any, b: any) => {
        let aValue, bValue;

        switch (sortBy) {
          case 'title':
            aValue = a.title || '';
            bValue = b.title || '';
            break;
          case 'className':
            aValue = a.class.nameClass || '';
            bValue = b.class.nameClass || '';
            break;
          case 'submissionCount':
            aValue = a.submissionCount || 0;
            bValue = b.submissionCount || 0;
            break;
          case 'gradingProgress':
            aValue = a.gradingProgress || 0;
            bValue = b.gradingProgress || 0;
            break;
          case 'dueDate':
            aValue = a.dueDate;
            bValue = b.dueDate;
            break;
          case 'averageGrade':
            aValue = a.averageGrade || 0;
            bValue = b.averageGrade || 0;
            break;
          case 'createdAt':
          default:
            aValue = a.createdAt;
            bValue = b.createdAt;
            break;
        }

        if (aValue < bValue) return -1 * sortOrder;
        if (aValue > bValue) return 1 * sortOrder;
        return 0;
      });

      // Handle pagination
      const page = Math.max(1, options?.page || 1);
      const limit = Math.min(50, Math.max(1, options?.limit || 10));
      const totalItems = processedExercises.length;
      const totalPages = Math.ceil(totalItems / limit);
      const skip = (page - 1) * limit;

      const paginatedExercises = processedExercises.slice(skip, skip + limit);

      // Calculate overall statistics
      const avgGradingProgress =
        exercises.length > 0
          ? processedExercises.reduce((sum, ex) => sum + ex.gradingProgress, 0) / exercises.length
          : 0;

      const statistics = {
        totalExercises: exercises.length,
        fullyGradedExercises,
        partiallyGradedExercises,
        ungradedExercises,
        totalSubmissions,
        gradedSubmissions,
        avgGradingProgress: Math.round(avgGradingProgress * 100) / 100,
      };

      const pagination = {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
      };

      return {
        success: true,
        exercises: paginatedExercises,
        pagination,
        statistics,
      };
    } catch (error) {
      console.error('Error in ExerciseService.getTeacherExercisesOverview:', error);
      return {
        success: false,
        message: 'Lỗi server khi lấy tổng quan bài tập',
      };
    }
  }
}
