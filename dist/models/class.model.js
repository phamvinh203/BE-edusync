"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const ClassSchema = new mongoose_1.default.Schema({
    nameClass: { type: String, required: true },
    subject: { type: String, required: true },
    description: String,
    teacherId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
    pendingStudents: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "User",
        }
    ],
    students: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    createdBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Auth",
    },
    deleted: { type: Boolean, default: false },
    deletedAt: Date,
}, { timestamps: true });
const ClassModel = mongoose_1.default.model("Class", ClassSchema, "classes");
exports.default = ClassModel;
