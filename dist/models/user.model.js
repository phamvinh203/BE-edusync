"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const UserSchema = new mongoose_1.default.Schema({
    authId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Auth",
        required: true,
        unique: true,
    },
    email: String,
    username: String,
    phone: String,
    userClass: String,
    userSchool: String,
    address: String,
    avatar: String,
    dateOfBirth: {
        type: Date,
        default: null,
    },
    gender: {
        type: String,
        enum: ["male", "female", "other"],
        default: "other",
    },
    deleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});
const User = mongoose_1.default.model("User", UserSchema, "users");
exports.default = User;
