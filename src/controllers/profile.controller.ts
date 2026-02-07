import type { Request, Response } from "express";
import User from "../models/User.js";
import { comparePassword } from "../utils/bcrypt.js";
import { deleteFromCloudinary } from "../utils/uploadImage.js";

function isValidCloudinaryUrl(url?: string) {
  return (
    typeof url === "string" && url.startsWith("https://res.cloudinary.com")
  );
}

/*
	GET current admin profile
*/
export const getProfile = async (
  req: Request & { user?: any },
  res: Response,
) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || null,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
};

/*
	PATCH update profile: supports name, email, avatar (Cloudinary image object), password change
	body: { name?, email?, avatar? { url, publicId }, currentPassword?, newPassword? }
*/
export const updateProfile = async (
  req: Request & { user?: any },
  res: Response,
) => {
  try {
    const { name, email, avatar, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update name
    if (name) user.name = name;

    // Update email (ensure uniqueness)
    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists && exists._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email;
    }

    // Update avatar: expect an object { url, publicId } uploaded by client via Cloudinary
    if (avatar && typeof avatar === "object") {
      const newUrl = avatar.url as string | undefined;
      const newPublicId = avatar.publicId as string | undefined;

      if (!isValidCloudinaryUrl(newUrl) || !newPublicId) {
        return res
          .status(400)
          .json({ message: "Invalid Cloudinary avatar object" });
      }

      // delete old avatar if present and publicId differs
      if (
        user.avatar &&
        user.avatar.publicId &&
        user.avatar.publicId !== newPublicId
      ) {
        try {
          await deleteFromCloudinary(user.avatar.publicId);
        } catch (e) {
          // non-fatal
        }
      }

      user.avatar = { url: newUrl, publicId: newPublicId } as any;
    }

    // Change password: require currentPassword and newPassword
    if (currentPassword || newPassword) {
      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json({ message: "Provide currentPassword and newPassword" });
      }

      const isMatch = await comparePassword(currentPassword, user.password);
      if (!isMatch)
        return res
          .status(401)
          .json({ message: "Current password is incorrect" });

      user.password = newPassword;
    }

    await user.save();

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || null,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update profile" });
  }
};
