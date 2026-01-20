import mongoose from "mongoose";

let isConnected = false;

export async function connectDb(uri: string) {
  if (isConnected) return;

  await mongoose.connect(uri);
  isConnected = true;

  console.log("✅ MongoDB connected");
}
