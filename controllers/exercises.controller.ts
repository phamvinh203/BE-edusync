import { Request, Response } from 'express';
import { sendError, sendSuccess } from '../helpers/response';
import { ExerciseService } from '../services/exercise.service';
import { getSuccessMessage } from '../utils/exercise.utils';
import { CreateExerciseRequest, UpdateExerciseRequest } from '../types/exercise.types';

export const createExercise = async (req: Request, res: Response) => {
  try {
    const exerciseData: CreateExerciseRequest = req.body; // Đã được validate bởi middleware
    const { classId } = req.params; // Lấy từ URL params
    const user = req.user as any;
    const files = req.files as Express.Multer.File[];

    const result = await ExerciseService.createExercise(exerciseData, classId, user._id, files);

    if (!result.success) {
      return sendError(res, 400, result.message!);
    }

    const successMessage = getSuccessMessage(exerciseData.type);

    return sendSuccess(res, {
      message: successMessage,
      data: result.exercise,
    });
  } catch (err) {
    console.error('Error in createExercise:', err);
    return sendError(res, 500, 'Lỗi server khi tạo bài tập');
  }
};

export const updateExercise = async (req: Request, res: Response) => {
  try {
    const { exerciseId } = req.params;
    const updateData: UpdateExerciseRequest = req.body;
    const user = req.user as any;
    const files = req.files as Express.Multer.File[];

    const result = await ExerciseService.updateExercise(exerciseId, updateData, user._id, files);

    if (!result.success) {
      return sendError(res, 400, result.message!);
    }

    const successMessage = getSuccessMessage(result.exercise.type, true);

    return sendSuccess(res, {
      message: successMessage,
      data: result.exercise,
    });
  } catch (err) {
    console.error('Error in updateExercise:', err);
    return sendError(res, 500, 'Lỗi server khi cập nhật bài tập');
  }
};

export const deleteExercise = async (req: Request, res: Response) => {
  try {
    const { exerciseId } = req.params;
    const user = req.user as any;

    const result = await ExerciseService.deleteExercise(exerciseId, user._id);

    if (!result.success) {
      return sendError(res, 400, result.message!);
    }

    return sendSuccess(res, {
      message: 'Xóa bài tập thành công',
      data: null,
    });
  } catch (err) {
    console.error('Error in deleteExercise:', err);
    return sendError(res, 500, 'Lỗi server khi xóa bài tập');
  }
};

export const getExercisesByClass = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const user = req.user as any;

    // Parse query parameters
    const { page, limit, status, type, sortBy, sortOrder } = req.query;

    // Build options object
    const options = {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      status: status as string,
      type: type as string,
      sortBy: sortBy as string,
      sortOrder: (sortOrder as string) === 'asc' ? ('asc' as const) : ('desc' as const),
    };

    const result = await ExerciseService.getExercisesByClass(classId, user._id, user.role, options);

    if (!result.success) {
      return sendError(res, 400, result.message!);
    }

    return sendSuccess(res, {
      message: 'Lấy danh sách bài tập thành công',
      data: {
        exercises: result.exercises,
        pagination: result.pagination,
        total: result.pagination?.totalItems || 0,
      },
    });
  } catch (err) {
    console.error('Error in getExercisesByClass:', err);
    return sendError(res, 500, 'Lỗi server khi lấy danh sách bài tập');
  }
};

export const getExerciseById = async (req: Request, res: Response) => {
  try {
    const { classId, exerciseId } = req.params;
    const user = req.user as any;

    const result = await ExerciseService.getExerciseById(classId, exerciseId, user._id, user.role);

    if (!result.success) {
      return sendError(res, 400, result.message!);
    }

    return sendSuccess(res, {
      message: 'Lấy chi tiết bài tập thành công',
      data: result.exercise,
    });
  } catch (err) {
    console.error('Error in getExerciseById:', err);
    return sendError(res, 500, 'Lỗi server khi lấy chi tiết bài tập');
  }
};

export const studentSubmitExercise = async (req: Request, res: Response) => {
  try {
    const { classId, exerciseId } = req.params;
    const user = req.user as any;
    const submissionData = req.body;
    const files = req.files as Express.Multer.File[];

    const result = await ExerciseService.studentSubmitExercise(
      classId,
      exerciseId,
      user._id,
      submissionData,
      files,
    );

    if (!result.success) {
      return sendError(res, 400, result.message!);
    }

    return sendSuccess(res, {
      message: 'Nộp bài tập thành công',
      data: result.submission,
    });
  } catch (err) {
    console.error('Error in studentSubmitExercise:', err);
    return sendError(res, 500, 'Lỗi server khi nộp bài tập');
  }
};

export const getMySubmission = async (req: Request, res: Response) => {
  try {
    const { exerciseId } = req.params;
    const user = req.user as any;

    const result = await ExerciseService.getMySubmission(exerciseId, user._id);

    if (!result.success) {
      return sendError(res, 400, result.message!);
    }

    return sendSuccess(res, {
      message: 'Lấy bài làm thành công',
      data: result.submission,
    });
  } catch (err) {
    console.error('Error in getMySubmission:', err);
    return sendError(res, 500, 'Lỗi server khi lấy bài làm');
  }
};

export const getMySubmissions = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;

    // Parse query parameters for filtering and pagination
    const { page, limit, status, sortBy, sortOrder, classId } = req.query;

    const options = {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      status: status as string,
      sortBy: sortBy as string,
      sortOrder: (sortOrder as string) === 'asc' ? ('asc' as const) : ('desc' as const),
      classId: classId as string,
    };

    const result = await ExerciseService.getMySubmissions(user._id, options);

    if (!result.success) {
      return sendError(res, 400, result.message!);
    }

    return sendSuccess(res, {
      message: 'Lấy danh sách bài tập đã nộp thành công',
      data: {
        submissions: result.submissions,
        pagination: result.pagination,
        total: result.pagination?.totalItems || 0,
      },
    });
  } catch (err) {
    console.error('Error in getMySubmissions:', err);
    return sendError(res, 500, 'Lỗi server khi lấy danh sách bài tập đã nộp');
  }
};

export const getSubmissions = async (req: Request, res: Response) => {
  try {
    const { classId, exerciseId } = req.params;
    const user = req.user as any;

    // Parse query parameters for filtering and pagination
    const { page, limit, graded, sortBy, sortOrder } = req.query;

    const options = {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      graded: graded === 'true' ? true : graded === 'false' ? false : undefined,
      sortBy: sortBy as string,
      sortOrder: (sortOrder as string) === 'asc' ? ('asc' as const) : ('desc' as const),
    };

    const result = await ExerciseService.getSubmissions(classId, exerciseId, user._id, options);

    if (!result.success) {
      return sendError(res, 400, result.message!);
    }

    return sendSuccess(res, {
      message: 'Lấy danh sách bài nộp thành công',
      data: {
        submissions: result.submissions,
        pagination: result.pagination,
        statistics: result.statistics,
      },
    });
  } catch (err) {
    console.error('Error in getSubmissions:', err);
    return sendError(res, 500, 'Lỗi server khi lấy danh sách bài nộp');
  }
};

export const gradeSubmission = async (req: Request, res: Response) => {
  try {
    const { classId, exerciseId, submissionId } = req.params;
    const { grade, feedback } = req.body;
    const user = req.user as any;

    // Validate required fields
    if (grade === undefined && !feedback) {
      return sendError(res, 400, 'Cần có điểm hoặc nhận xét để chấm bài');
    }

    if (grade !== undefined) {
      const gradeNum = parseFloat(grade);
      if (isNaN(gradeNum) || gradeNum < 0) {
        return sendError(res, 400, 'Điểm số phải là số không âm');
      }
    }

    const result = await ExerciseService.gradeSubmission(
      classId,
      exerciseId,
      submissionId,
      user._id,
      {
        grade: grade !== undefined ? parseFloat(grade) : undefined,
        feedback,
      },
    );

    if (!result.success) {
      return sendError(res, 400, result.message!);
    }

    return sendSuccess(res, {
      message: 'Chấm điểm bài làm thành công',
      data: result.submission,
    });
  } catch (err) {
    console.error('Error in gradeSubmission:', err);
    return sendError(res, 500, 'Lỗi server khi chấm điểm bài làm');
  }
};

export const getTeacherExercisesOverview = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;

    // Parse query parameters for filtering and pagination
    const { page, limit, status, gradingStatus, sortBy, sortOrder, classId } = req.query;

    const options = {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      status: status as string,
      gradingStatus: gradingStatus as string, // 'graded', 'ungraded', 'partial'
      sortBy: sortBy as string,
      sortOrder: (sortOrder as string) === 'asc' ? ('asc' as const) : ('desc' as const),
      classId: classId as string,
    };

    const result = await ExerciseService.getTeacherExercisesOverview(user._id, options);

    if (!result.success) {
      return sendError(res, 400, result.message!);
    }

    return sendSuccess(res, {
      message: 'Lấy tổng quan bài tập thành công',
      data: {
        exercises: result.exercises,
        pagination: result.pagination,
        statistics: result.statistics,
        total: result.pagination?.totalItems || 0,
      },
    });
  } catch (err) {
    console.error('Error in getTeacherExercisesOverview:', err);
    return sendError(res, 500, 'Lỗi server khi lấy tổng quan bài tập');
  }
};
