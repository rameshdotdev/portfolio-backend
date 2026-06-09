import type { Request, Response } from "express";
import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import { comparePassword } from "../utils/bcrypt.js";

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

  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    domain: ".imramesh.in",
    path: "/",
    maxAge: 8 * 60 * 60 * 1000,
  });

  return res.send(user);
};

export const logout = async (req: Request, res: Response) => {
  try {
    res.cookie("auth_token", "", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      domain: ".imramesh.in",
      expires: new Date(0),
    });
    return res.send("Logout Successful!!");
  } catch (error) {
    return res.status(500).json({ message: "Logout failed" });
  }
};

// export const getMe = async (req: Request & { user?: any }, res: Response) => {
//   if (!req.user) {
//     return res.status(401).json({ message: "Not authenticated" });
//   }

//   res.json({
//     _id: req.user._id,
//     name: req.user.name,
//     email: req.user.email,
//     role: req.user.role,
//   });
// };
