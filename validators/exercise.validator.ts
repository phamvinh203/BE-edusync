import * as yup from 'yup';
import mongoose from 'mongoose';

// Schema cho câu hỏi trắc nghiệm
const questionSchema = yup.object({
  question: yup.string().required('Câu hỏi là bắt buộc'),
  options: yup
    .array()
    .of(yup.string().required('Lựa chọn không được để trống'))
    .min(2, 'Phải có ít nhất 2 lựa chọn')
    .required('Lựa chọn là bắt buộc'),
  correctAnswers: yup
    .array()
    .of(yup.number().integer().min(0, 'Index đáp án phải >= 0'))
    .min(1, 'Phải có ít nhất 1 đáp án đúng')
    .required('Đáp án đúng là bắt buộc')
    .test('valid-answers', 'Index đáp án vượt quá số lựa chọn', function (correctAnswers) {
      const { options } = this.parent;
      if (!options || !correctAnswers) return true;
      return correctAnswers.every(
        (answer: any) => typeof answer === 'number' && answer < options.length,
      );
    }),
  points: yup.number().positive('Điểm phải là số dương').default(1),
  explanation: yup.string().optional(),
});

export const createExerciseSchema = yup.object({
  title: yup.string().required('Tiêu đề là bắt buộc'),
  description: yup.string().optional(),
  dueDate: yup
    .date()
    .required('Hạn nộp là bắt buộc')
    .min(new Date(), 'Hạn nộp bài phải là thời gian trong tương lai'),
  maxScore: yup.number().positive('Điểm tối đa phải là số dương').optional(),
  subject: yup.string().optional(),
  type: yup
    .string()
    .oneOf(['essay', 'multiple_choice', 'file_upload'], 'Loại bài tập không hợp lệ')
    .default('essay'),
  questions: yup
    .array()
    .of(questionSchema)
    .when('type', {
      is: 'multiple_choice',
      then: (schema) =>
        schema
          .min(1, 'Bài tập trắc nghiệm phải có ít nhất 1 câu hỏi')
          .required('Câu hỏi là bắt buộc cho bài tập trắc nghiệm'),
      otherwise: (schema) => schema.optional(),
    }),
});

export const submitExerciseSchema = yup.object({
  content: yup.string().when('type', {
    is: 'essay',
    then: (schema) => schema.optional(),
    otherwise: (schema) => schema.optional(),
  }),
  answers: yup
    .array()
    .of(yup.number().integer().min(0, 'Index đáp án phải >= 0'))
    .when('type', {
      is: 'multiple_choice',
      then: (schema) => schema.required('Đáp án là bắt buộc cho bài tập trắc nghiệm'),
      otherwise: (schema) => schema.optional(),
    }),
});
