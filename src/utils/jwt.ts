import jwt from "jsonwebtoken";

export const generateToken = (userId: string) =>
  jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "7d" });
