import type { Request, Response } from "express";
import { ContactModel } from "../models/Contact.model.js";

/**
 * GET /api/contact
 * Public endpoint for frontend (Navbar, Footer, etc.)
 */

export const getContact = async (_req: Request, res: Response) => {
  try {
    const contact = await ContactModel.findOne()
      .select("-__v -createdAt -updatedAt")
      .lean();

    // ✅ Always return a stable shape
    if (!contact) {
      return res.status(200).json({
        email: "",
        social: {},
      });
    }

    return res.status(200).json(contact);
  } catch (error) {
    console.error("GET CONTACT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch contact data",
    });
  }
};

/**
 * POST /api/contact
 * Admin-only (create or replace contact)
 */
export const upsertContact = async (req: Request, res: Response) => {
  try {
    const { email, social } = req.body;

    if (!email || !social) {
      return res.status(400).json({
        success: false,
        message: "Email and social data are required",
      });
    }

    const contact = await ContactModel.findOneAndUpdate(
      {},
      { email, social },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error("UPSERT CONTACT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save contact data",
    });
  }
};
