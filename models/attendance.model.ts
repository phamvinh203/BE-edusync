import { Schema, model, Document, Types } from "mongoose";

export interface IAttendanceStudent {
  studentId: Types.ObjectId;
  status: "present" | "absent" | "late";
  markedAt?: Date;
}

export interface IAttendanceSession extends Document {
  classId: Types.ObjectId;
  teacherId: Types.ObjectId;
  date: Date;
  students: IAttendanceStudent[];
  createdAt: Date;
  updatedAt: Date;
  status: "open" | "closed"; // mở / khóa buổi điểm danh
}

const AttendanceSchema = new Schema<IAttendanceSession>(
  {
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // giáo viên tạo
    date: { type: Date, default: Date.now },
    students: [
      {
        studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        status: {
          type: String,
          enum: ["present", "absent", "late"],
          default: "absent",
        },
        markedAt: { type: Date, default: Date.now },
      },
    ],
    status: { type: String, enum: ["open", "closed"], default: "open" },
  },
  { timestamps: true }
);

export const AttendanceModel = model<IAttendanceSession>(
  "Attendance",
  AttendanceSchema
);
