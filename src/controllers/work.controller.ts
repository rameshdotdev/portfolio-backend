import type { Request, Response } from "express";
import { deleteFromCloudinary } from "../utils/uploadImage.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { Work } from "../models/Work.model.js";

export const createWork = async (req: Request, res: Response) => {
  try {
    const {
      company,
      role,
      href,
      tags,
      location,
      location_type,
      logoUrl,
      start,
      end,
      points,
      type,
    } = req.body;

    // 🔐 Validation
    if (!company || !role || !location || !location_type || !start || !end || !logoUrl?.url) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (logoUrl?.url && !logoUrl.url.startsWith("https://res.cloudinary.com")) {
      return res.status(400).json({ message: "Invalid Cloudinary logo URL" });
    }

    const work = await Work.create({
      company,
      role,
      href,
      tags: tags ?? [],
      location,
      location_type,
      logoUrl,
      start,
      end,
      points: points ?? [],
      type,
    });

    return res.status(201).json(work);
  } catch (error) {
    // 🧹 cleanup uploaded logo on failure
    req.body.logoUrl?.publicId &&
      (await deleteFromCloudinary(req.body.logoUrl.publicId));

    console.error("Create Work Error:", error);
    return res.status(500).json({ message: "Create work failed" });
  }
};

/* =========================
   GET WORKS
========================= */
export const getWorks = async (req: AuthRequest, res: Response) => {
  try {
    const works = await Work.find().sort({ start: -1 }).lean();
    return res.json(works);
  } catch (error) {
    console.error("Get Works Error:", error);
    return res.status(500).json({ message: "Failed to fetch works" });
  }
};

/* =========================
   UPDATE WORK
========================= */
export const updateWork = async (req: Request, res: Response) => {
  try {
    const work = await Work.findById(req.params.id);

    if (!work) {
      return res.status(404).json({ message: "Work not found" });
    }

    const {
      company,
      role,
      href,
      tags,
      location,
      location_type,
      logoUrl,
      start,
      end,
      points,
      type,
    } = req.body;

    // Handle logo replacement
    if (
      logoUrl &&
      logoUrl.publicId &&
      logoUrl.publicId !== work.logoUrl?.publicId
    ) {
      if (work.logoUrl?.publicId) {
        await deleteFromCloudinary(work.logoUrl.publicId);
      }

      work.logoUrl = {
        url: logoUrl.url,
        publicId: logoUrl.publicId,
      };
    }

    // Update fields
    work.company = company ?? work.company;
    work.role = role ?? work.role;
    work.href = href ?? work.href;
    work.tags = tags ?? work.tags;
    work.location = location ?? work.location;
    work.location_type = location_type ?? work.location_type;
    work.start = start ?? work.start;
    work.end = end ?? work.end;
    work.points = points ?? work.points;
    work.type = type ?? work.type;

    await work.save();

    return res.json(work);
  } catch (error) {
    console.error("Update Work Error:", error);
    return res.status(500).json({ message: "Failed to update work" });
  }
};

/* =========================
   DELETE WORK
========================= */
export const deleteWork = async (req: Request, res: Response) => {
  try {
    const work = await Work.findById(req.params.id);

    if (!work) {
      return res.status(404).json({ message: "Work not found" });
    }

    // delete logo from Cloudinary
    work.logoUrl?.publicId &&
      (await deleteFromCloudinary(work.logoUrl.publicId));

    await work.deleteOne();

    return res.status(204).send();
  } catch (error) {
    console.error("Delete Work Error:", error);
    return res.status(500).json({ message: "Failed to delete work" });
  }
};
