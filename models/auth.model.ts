import mongoose from "mongoose";

const authSchema = new mongoose.Schema(
    {
        username: String,
        email: String,
        password: String,
        access_token: String,
        refresh_token: String,
        deleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: Date,
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", authSchema, "users");

export default User;