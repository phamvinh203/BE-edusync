import mongoose from 'mongoose';
import UserModel from '../models/user.model';
import ClassModel from '../models/class.model';
import ExerciseModel from '../models/exercises.model';

export class ValidationService {
  /**
   * Validate quyền giáo viên
   */
  static validateTeacherRole(user: any): { isValid: boolean; message?: string } {
    if (!user || user.role !== 'teacher') {
      return {
        isValid: false,
        message: 'Chỉ giáo viên mới có quyền thực hiện thao tác này',
      };
    }
    return { isValid: true };
  }

  /**
   * Validate ObjectId format
   */
  static validateObjectId(id: string, fieldName: string): { isValid: boolean; message?: string } {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return {
        isValid: false,
        message: `${fieldName} không hợp lệ`,
      };
    }
    return { isValid: true };
  }

  /**
   * Lấy thông tin giáo viên từ authId
   */
  static async getTeacherInfo(authId: string): Promise<{
    success: boolean;
    teacher?: any;
    message?: string;
  }> {
    try {
      const teacher = await UserModel.findOne({ authId, deleted: false });
      if (!teacher) {
        return {
          success: false,
          message: 'Không tìm thấy thông tin giáo viên',
        };
      }
      return { success: true, teacher };
    } catch (error) {
      return {
        success: false,
        message: 'Lỗi khi lấy thông tin giáo viên',
      };
    }
  }

  /**
   * Validate lớp học và quyền của giáo viên
   */
  static async validateClassAccess(
    classId: string,
    teacherId: string,
  ): Promise<{
    success: boolean;
    classData?: any;
    message?: string;
  }> {
    try {
      const foundClass = await ClassModel.findById(classId);

      if (!foundClass) {
        return {
          success: false,
          message: 'Không tìm thấy lớp học',
        };
      }

      if (String(foundClass.teacherId) !== String(teacherId)) {
        return {
          success: false,
          message: 'Bạn không có quyền thực hiện thao tác với lớp học này',
        };
      }

      if (foundClass.deleted) {
        return {
          success: false,
          message: 'Không thể thực hiện thao tác với lớp học đã bị xóa',
        };
      }

      return { success: true, classData: foundClass };
    } catch (error) {
      return {
        success: false,
        message: 'Lỗi khi kiểm tra thông tin lớp học',
      };
    }
  }

  /**
   * Validate bài tập và quyền chỉnh sửa
   */
  static async validateExerciseAccess(
    exerciseId: string,
    teacherId: string,
  ): Promise<{
    success: boolean;
    exercise?: any;
    message?: string;
  }> {
    try {
      const exercise = await ExerciseModel.findById(exerciseId).populate('classId', 'nameClass');

      if (!exercise) {
        return {
          success: false,
          message: 'Không tìm thấy bài tập',
        };
      }

      if (String(exercise.createdBy) !== String(teacherId)) {
        return {
          success: false,
          message: 'Bạn không có quyền sửa bài tập này',
        };
      }

      return { success: true, exercise };
    } catch (error) {
      return {
        success: false,
        message: 'Lỗi khi kiểm tra thông tin bài tập',
      };
    }
  }
}
