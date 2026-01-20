// scripts/createAdmin.ts
import mongoose from "mongoose";
import User from "../models/User.js";
import { env } from "../config/env.js";

mongoose.connect(env.MONGO_URI);

(async () => {
  await User.create({
    name: "Ramesh Kumar",
    email: "admin@ramesh.dev",
    password: "Admin@123",
  });

  console.log("Admin created");
  process.exit();
})();
