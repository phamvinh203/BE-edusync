import mongoose from 'mongoose';

const authSchema = new mongoose.Schema(
  {
    username: String,
    email: String,
    password: String,
    access_token: String,
    refresh_token: String,
    role: {
      type: String,
      enum: ['admin', 'teacher', 'student'],
      default: 'student',
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  },
);

const Auth = mongoose.model('Auth', authSchema, 'auths');

export default Auth;
