import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        authId: {
            type: mongoose.Schema.Types.ObjectId,
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
    },
    {
        timestamps: true,
    }
)

const User = mongoose.model("User", UserSchema, "users");

export default User;