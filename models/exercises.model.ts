import mongoose from 'mongoose';

const SubmissionSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    submittedAt: { type: Date, default: Date.now },
    content: { type: String }, // bài làm text
    fileUrl: { type: String }, // nếu có file đính kèm
    answers: [{ type: Number }], // cho bài tập trắc nghiệm - mảng index đáp án
    grade: { type: Number, min: 0 }, // điểm số
    feedback: { type: String }, // nhận xét của giáo viên
  },
  { _id: false },
);

const QuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: [{ type: String, required: true }], // các lựa chọn
    correctAnswers: {
      type: [Number], // index đáp án đúng
      required: true,
      validate: {
        validator: (arr: number[]) => arr.length > 0,
        message: 'Ít nhất phải có 1 đáp án đúng',
      },
    }, // index của đáp án đúng
    points: { type: Number, default: 1 }, // điểm cho câu hỏi này
    explanation: { type: String }, // giải thích đáp án (tùy chọn)
  },
  { _id: false },
);

const AttachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true }, // Tên file gốc
    fileUrl: { type: String, required: true }, // URL file trên Supabase
    fileSize: { type: Number }, // Kích thước file (bytes)
    mimeType: { type: String }, // Loại file
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }, // Cho phép tạo _id cho từng attachment
);

const ExerciseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    type: {
      type: String,
      enum: ['essay', 'multiple_choice', 'file_upload'],
      default: 'essay',
    },

    // Cho bài tập trắc nghiệm
    questions: [QuestionSchema],

    // File đính kèm cho bài tập
    attachments: [AttachmentSchema],

    // Điểm tối đa cho bài tập
    maxScore: { type: Number, min: 0 },

    subject: { type: String }, // ví dụ: Toán, Lý
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    startDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },

    submissions: [SubmissionSchema],

    status: {
      type: String,
      enum: ['open', 'closed', 'graded'],
      default: 'open',
    },

    deleted: { type: Boolean, default: false },
    deletedAt: Date,
  },
  { timestamps: true },
);

const ExerciseModel = mongoose.model('Exercise', ExerciseSchema, 'exercises');
export default ExerciseModel;
