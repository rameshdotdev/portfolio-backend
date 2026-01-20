import { Schema, model } from "mongoose";

export const SKILL_TITLES = [
  "PROGRAMMING",
  "FRONTEND",
  "BACKEND",
  "DATABASE",
  "AI_AND_DATA_SCIENCE",
  "TOOLS_AND_PLATFORMS",
] as const;

export type SkillTitle = (typeof SKILL_TITLES)[number];

const skillCategorySchema = new Schema(
  {
    /* =========================
       Card Title
    ========================= */
    title: {
      type: String,
      enum: SKILL_TITLES,
      required: true,
      unique: true,
      index: true,
    },

    /* =========================
       Terminal Subtitle
    ========================= */
    subTitle: {
      type: String,
      required: true,
    },

    /* =========================
       Card Order
    ========================= */
    order: {
      type: Number,
      default: 0,
    },

    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default model("SkillCategory", skillCategorySchema);
