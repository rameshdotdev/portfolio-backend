import { Schema, model } from "mongoose";

export interface SocialLink {
  name: string;
  url: string;
  icon: string; // icon key (github, linkedin, x, etc.)
  navbar: boolean;
}

export interface Contact {
  email: string;
  social: Record<string, SocialLink>;
}

const SocialSchema = new Schema<SocialLink>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    icon: { type: String, required: true },
    navbar: { type: Boolean, default: false },
  },
  { _id: false }
);

const ContactSchema = new Schema<Contact>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    social: {
      type: Map,
      of: SocialSchema, // dynamic keys like GitHub, LinkedIn, X
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ContactModel = model<Contact>("Contact", ContactSchema);
