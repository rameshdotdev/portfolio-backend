// models/Project.model.ts
import { Schema, model } from "mongoose";

const projectSchema = new Schema(
  {
    title: { type: String, required: true },
    subTitle: { type: String, required: true },

    image: {
      type: {
        light: {
          url: { type: String, required: true },
          publicId: { type: String, required: true },
        },
        dark: {
          url: { type: String, required: true },
          publicId: { type: String, required: true },
        },
      },
      required: true,
    },

    stack: { type: [String], default: [] },
    description: { type: [String], default: [] },

    links: {
      site: { type: String },
      github: { type: String },
      post: { type: String },
    },

    status: {
      type: String,
      enum: ["live", "building", "offline"],
      required: true,
    },

    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export default model("Project", projectSchema);
