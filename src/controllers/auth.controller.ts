import type { Request, Response } from "express";
import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import { comparePassword } from "../utils/bcrypt.js";
import { env } from "../config/env.js";

export const loginAdmin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = generateToken(user._id.toString());

  return res
    .cookie("auth_token", token, {
      httpOnly: true,
      secure: true, // MUST be true on vercel https
      sameSite: "none", // MUST be none for cross-site
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json({
      message: "Login successful",
    });
};

export const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: "Logout failed" });
  }
};

export const getMe = async (req: Request & { user?: any }, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
};
