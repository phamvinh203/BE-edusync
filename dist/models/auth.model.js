"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const authSchema = new mongoose_1.default.Schema({
    username: String,
    email: String,
    password: String,
    access_token: String,
    refresh_token: String,
    role: {
        type: String,
        enum: ["admin", "teacher", "student"],
        default: "student",
    },
    deleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: Date,
}, {
    timestamps: true,
});
const Auth = mongoose_1.default.model("Auth", authSchema, "auths");
exports.default = Auth;
