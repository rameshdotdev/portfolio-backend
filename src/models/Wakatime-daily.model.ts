import mongoose, { Schema, type InferSchemaType } from "mongoose";

/** Editor SubSchema */
const wakaTimeEditorSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ["VS Code", "Cursor"],
    },
    total_seconds: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

/** Combined SubSchema */
const wakaTimeCombinedSchema = new Schema(
  {
    total_seconds: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

/** Main Schema (date-wise unique) */
const wakaTimeDailySchema = new Schema(
  {
    date: {
      type: String,
      required: true, // IMPORTANT: required for unique date-wise storage
      unique: true,
      index: true,
    },

    combined: {
      type: wakaTimeCombinedSchema,
      required: true,
    },

    editors: {
      type: [wakaTimeEditorSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type WakaTimeDailyDoc = InferSchemaType<typeof wakaTimeDailySchema>;

export const WakaTimeDailyModel =
  mongoose.models.WakaTimeDaily ||
  mongoose.model("WakaTimeDaily", wakaTimeDailySchema);
