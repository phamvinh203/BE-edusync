import { Request, Response } from "express";
import Auth from "../models/auth.model";
import User from "../models/user.model";
import { supabase } from "../config/db";

// GET /api/users/me
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.user as { email: string };

    const authUser = await Auth.findOne({ email, deleted: false });

    if (!authUser) {
      res.status(404).json({ message: "Người dùng không tồn tại" });
      return;
    }

    const userInfo = await User.findOne({
      authId: authUser._id,
      deleted: false,
    });

    res.status(200).json({
      success: true,
      data: {
        auth: {
          id: authUser._id,
          email: authUser.email,
          username: authUser.username,
          role: authUser.role,
        },
        profile: userInfo,
      },
    });
  } catch (error) {
    console.error("Error in getMe:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

// PUT /api/users/me - Cập nhật thông tin profile
export const updateMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.user as { email: string };
    const { username, phone, userClass, userSchool, address, avatar, dateOfBirth, gender } = req.body;

    // Tìm bản ghi auth
    const authUser = await Auth.findOne({ email, deleted: false });
    if (!authUser) {
      res.status(404).json({ message: "Người dùng không tồn tại" });
      return;
    }

    // Cập nhật hoặc tạo mới profile
    let userInfo = await User.findOne({ authId: authUser._id, deleted: false });

    if (userInfo) {
      // Cập nhật thông tin hiện có
      userInfo.username = username || userInfo.username;
      userInfo.phone = phone || userInfo.phone;
      userInfo.userClass = userClass || userInfo.userClass;
      userInfo.userSchool = userSchool || userInfo.userSchool;
      userInfo.address = address || userInfo.address;
      userInfo.avatar = avatar || userInfo.avatar;
      userInfo.dateOfBirth = dateOfBirth || userInfo.dateOfBirth;
      userInfo.gender = gender || userInfo.gender;
      await userInfo.save();
    } else {
      // Tạo mới profile
      userInfo = new User({
        authId: authUser._id,
        username,
        phone,
        userClass,
        userSchool,
        address,
        avatar,
        dateOfBirth,
        gender,
      });
      await userInfo.save();
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin thành công",
      data: {
        auth: {
          id: authUser._id,
          username: authUser.username,
          email: authUser.email,
        },
        profile: userInfo,
      },
    });
  } catch (error) {
    console.error("Error in updateMe:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

// POST /api/users/me/avatar - Cập nhật avatar
export const updateAvatar = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.user as { email: string };

    if (!req.file) {
      console.log("No file received in request");
      res.status(400).json({ message: "Vui lòng tải lên tệp avatar" });
      return;
    }

    const file = req.file as Express.Multer.File;

    // Tạo tên file unique với timestamp
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = `avatars/${email}/${fileName}`;

    // Tải tệp lên Supabase Storage
    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", {
        message: error.message,
        // statusCode: error.statusCode,
        error: error,
      });

      res.status(500).json({
        success: false,
        message: "Lỗi khi tải lên avatar",
        error: error.message,
        // details: `Status: ${error.statusCode || "unknown"}`,
      });
      return;
    }


    // Lấy URL công khai của file
    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    // Tìm và cập nhật thông tin user
    const authUser = await Auth.findOne({ email, deleted: false });
    if (!authUser) {
      res.status(404).json({ message: "Người dùng không tồn tại" });
      return;
    }

    let userInfo = await User.findOne({ authId: authUser._id, deleted: false });
    if (!userInfo) {
      userInfo = new User({ authId: authUser._id });
    } else {
      console.log("User profile found");
    }

    // Xóa avatar cũ nếu có (với error handling)
    if (userInfo.avatar && userInfo.avatar.includes("supabase")) {
      try {
        const oldFilePath = userInfo.avatar.replace(
          publicUrlData.publicUrl.split("/avatars/")[0] + "/avatars/",
          ""
        );
        await supabase.storage.from("avatars").remove([oldFilePath]);
      } catch (deleteError) {
        console.log(
          "Could not delete old avatar",
          deleteError
        );
      }
    }

    // Cập nhật avatar URL
    userInfo.avatar = publicUrlData.publicUrl;
    await userInfo.save();
    res.status(200).json({
      success: true,
      message: "Cập nhật avatar thành công",
      data: {
        avatarUrl: publicUrlData.publicUrl,
        filePath: data.path,
      },
    });
  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
