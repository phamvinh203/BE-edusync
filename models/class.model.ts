// models/class.model.ts
import mongoose from "mongoose";

const ClassSchema = new mongoose.Schema(
  {
    nameClass: { type: String, required: true },
    subject: { type: String, required: true },
    description: String,
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
    },
    
    deleted: { type: Boolean, default: false },
    deletedAt: Date,
  },
  { timestamps: true }
);

const ClassModel = mongoose.model("Class", ClassSchema, "classes");
export default ClassModel;
