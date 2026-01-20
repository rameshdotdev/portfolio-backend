import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

const userSchema = new Schema(
  {
    name: { type: String, required: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false, // important for security
    },

    role: {
      type: String,
      enum: ["ADMIN"],
      default: "ADMIN",
    },
  },
  { timestamps: true }
);

/* 🔐 Hash password before saving */
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

export default model("User", userSchema);
