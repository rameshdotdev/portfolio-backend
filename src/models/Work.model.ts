import { Schema, model } from "mongoose";

export const LOCATION_TYPES = ["Remote", "Onsite", "Hybrid"] as const;
export const JOB_TYPES = ["Full Time", "Part Time", "Internship"] as const;

const worksSchema = new Schema(
  {
    company: {
      type: String,
      required: true,
      trim: true,
    },

    logoUrl: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
    },

    type: {
      type: String,
      enum: JOB_TYPES,
      required: false,
    },

    role: {
      type: String,
      required: true,
      trim: true,
    },

    location_type: {
      type: String,
      enum: LOCATION_TYPES,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },

    href: {
      type: String,
      trim: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    start: {
      type: String,
      required: true,
      trim: true,
    },

    end: {
      type: String,
      required: true,
      trim: true,
    },

    points: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

export const Work = model("Work", worksSchema);
