// models/class.model.ts
import mongoose from 'mongoose';

const ClassSchema = new mongoose.Schema(
  {
    nameClass: { type: String, required: true },
    subject: { type: String, required: true },
    description: String,
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Thêm trường mới: Cấp lớp dạy thêm (ví dụ: "Lớp 12")
    gradeLevel: {
      type: String, 
      required: false, 
    },

    // Thêm trường mới: Số tiền cho 1 buổi học (VND)
    pricePerSession: {
      type: Number,
      min: 0, // Không cho phép giá âm
      required: false, 
    },

    schedule: [
      {
        dayOfWeek: { type: String },
        startTime: { type: String },
        endTime: { type: String },
      },
    ],

    

    location: String,
    maxStudents: Number,

    pendingStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],



    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Auth',
    },

    deleted: { type: Boolean, default: false },
    deletedAt: Date,
  },
  { timestamps: true },
);

const ClassModel = mongoose.model('Class', ClassSchema, 'classes');
export default ClassModel;
