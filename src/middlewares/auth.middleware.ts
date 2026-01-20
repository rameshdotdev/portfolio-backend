import type { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

interface JwtPayload {
  userId: string;
}
export interface AuthRequest extends Request {
  user?: {
    _id: Types.ObjectId;
    name: string;
    email: string;
    role: "ADMIN" | "USER";
  };
}
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token && req.cookies?.auth_token) {
    token = req.cookies.auth_token;
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    const user = await User.findById(decoded.userId).select("name email role");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalid or expired" });
  }
};

export const adminOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.user?.role === "ADMIN") {
    next();
  } else {
    res.status(403).json({ message: "Admin access only" });
  }
};

export const parsialProtect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token && req.cookies?.auth_token) {
    token = req.cookies.auth_token;
  }

  // ✅ if no token, allow public access
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    const user = await User.findById(decoded.userId).select("name email role");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (err) {
    next();
  }
};
