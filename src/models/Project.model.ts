// models/Project.model.ts
import { Schema, model } from "mongoose";

const projectSchema = new Schema(
  {
    title: { type: String, required: true },
    image: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
    },
    techStack: { type: String, required: true },

    description: {
      type: [String], // supports bullet points
      required: true,
    },

    links: {
      site: { type: String },
      github: { type: String },
    },

    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export default model("Project", projectSchema);
