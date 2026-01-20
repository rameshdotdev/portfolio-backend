import { Schema, model, Types } from "mongoose";

const skillSchema = new Schema(
  {
    /* =========================
       Reference to Category
    ========================= */
    categoryId: {
      type: Types.ObjectId,
      ref: "SkillCategory",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    iconKey: {
      type: String,
      required: true,
    },

    order: {
      type: Number,
      default: 0,
      index: true,
    },

    isVisible: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

export default model("Skill", skillSchema);
