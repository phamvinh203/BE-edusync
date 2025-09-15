import { Question } from '../types/exercise.types';

/**
 * Tính toán điểm tối đa cho bài tập trắc nghiệm
 */
export const calculateMaxScore = (
  type: string,
  questions?: Question[],
  providedMaxScore?: number,
): number => {
  if (providedMaxScore) {
    return providedMaxScore;
  }

  if (type === 'multiple_choice' && questions && questions.length > 0) {
    return questions.reduce((total: number, q: Question) => total + (q.points || 1), 0);
  }

  return 10; // Mặc định cho các loại bài tập khác
};

/**
 * Tạo thông báo thành công dựa trên loại bài tập
 */
export const getSuccessMessage = (type: string, isUpdate: boolean = false): string => {
  const action = isUpdate ? 'Cập nhật' : 'Tạo';

  switch (type) {
    case 'multiple_choice':
      return `${action} bài tập trắc nghiệm thành công`;
    case 'essay':
      return `${action} bài tập tự luận thành công`;
    case 'file_upload':
      return `${action} bài tập upload file thành công`;
    default:
      return `${action} bài tập thành công`;
  }
};

/**
 * Kiểm tra tính hợp lệ của ngày hết hạn
 */
export const validateDueDate = (
  newDueDate: Date,
  oldDueDate?: Date,
): { isValid: boolean; message?: string } => {
  const now = new Date();

  // Chỉ cho phép gia hạn hoặc cập nhật nếu chưa hết hạn
  if (oldDueDate && oldDueDate < now && newDueDate < now) {
    return {
      isValid: false,
      message: 'Không thể đặt thời hạn nộp bài trong quá khứ khi bài tập đã hết hạn',
    };
  }

  return { isValid: true };
};
