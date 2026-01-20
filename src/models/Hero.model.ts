import { Schema, model } from "mongoose";

// const heroSchema = new Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//     },

//     titles: {
//       type: [String],
//       required: true,
//       // ["Front-End Developer", "Full-Stack Developer", "Tech Enthusiast"]
//     },

//     description: {
//       type: String,
//       required: true,
//     },

//     resumeUrl: {
//       type: String,
//       required: true,
//     },
//   },
//   { timestamps: true }
// );

// export default model("Hero", heroSchema);

const characterSchema = new Schema(
  {
    name: { type: String, required: true },
    avatar: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
    },
    titles: { type: [String], required: true },
    description: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
  },
  { _id: false },
);

const heroSchema = new Schema(
  {
    characters: {
      type: [characterSchema],
      required: true,
      validate: {
        validator: (arr: any[]) => arr.length === 2,
        message: "Exactly 2 characters are required",
      },
    },
  },
  { timestamps: true },
);

export default model("Hero", heroSchema);
