import { Schema, model } from "mongoose";
const visitorSchema = new Schema(
  {
    deviceType: {
      type: String,
      enum: ["mobile", "desktop"],
      required: true,
    },
    ip: {
      type: String,
      required: true,
    },
    userAgent: String,
    page: String,
	pageViews: { type: Number, default: 1 },
    date: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);
export const Visitor = model("Visitor", visitorSchema);
