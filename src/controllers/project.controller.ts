import type { Request, Response } from "express";
import Project from "../models/Project.model.js";
import { deleteFromCloudinary } from "../utils/uploadImage.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

function isValidCloudinaryUrl(url?: string) {
  return (
    typeof url === "string" && url.startsWith("https://res.cloudinary.com")
  );
}

/* =========================
   CREATE PROJECT
========================= */
export const createProject = async (req: Request, res: Response) => {
  try {
    const {
      title,
      subTitle,
      image,
      stack,
      description,
      links,
      status,
      isPinned,
    } = req.body;

    // 🔐 Validation
    if (
      !title ||
      !subTitle ||
      !status ||
      !image?.light?.url ||
      !image?.light?.publicId ||
      !image?.dark?.url ||
      !image?.dark?.publicId
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!Array.isArray(stack)) {
      return res
        .status(400)
        .json({ message: "stack must be an array of string" });
    }

    if (!Array.isArray(description)) {
      return res
        .status(400)
        .json({ message: "description must be an array of string" });
    }

    if (
      !isValidCloudinaryUrl(image.light.url) ||
      !isValidCloudinaryUrl(image.dark.url)
    ) {
      return res.status(400).json({ message: "Invalid Cloudinary image URL" });
    }

    const project = await Project.create({
      title,
      subTitle,
      image: {
        light: {
          url: image.light.url,
          publicId: image.light.publicId,
        },
        dark: {
          url: image.dark.url,
          publicId: image.dark.publicId,
        },
      },
      stack,
      description,
      links,
      status,
      isPinned: Boolean(isPinned),
    });

    return res.status(201).json(project);
  } catch (error: any) {
    // 🧹 cleanup if images uploaded but DB failed
    try {
      const lightId = req.body?.image?.light?.publicId;
      const darkId = req.body?.image?.dark?.publicId;

      if (lightId) await deleteFromCloudinary(lightId);
      if (darkId) await deleteFromCloudinary(darkId);
    } catch (_) {}

    console.error("Create Project Error:", error);
    return res.status(500).json({ message: "Create project failed" });
  }
};

/* =========================
   GET PROJECTS
========================= */
export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const projects = await Project.find({}).sort({ createdAt: -1 }).lean();
    return res.json(projects);
  } catch (error) {
    console.error("Get Projects Error:", error);
    return res.status(500).json({ message: "Failed to fetch projects" });
  }
};

/* =========================
   UPDATE PROJECT
========================= */
export const updateProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const {
      title,
      subTitle,
      stack,
      description,
      links,
      image,
      status,
      isPinned,
    } = req.body;

    /* =========================
       Handle Image Replacement
    ========================= */

    // update LIGHT image if changed
    if (
      image?.light?.publicId &&
      image?.light?.url &&
      image.light.publicId !== project.image?.light?.publicId
    ) {
      if (!isValidCloudinaryUrl(image.light.url)) {
        return res
          .status(400)
          .json({ message: "Invalid Cloudinary image URL (light)" });
      }

      // delete old light image
      if (project.image?.light?.publicId) {
        await deleteFromCloudinary(project.image.light.publicId);
      }

      project.image.light = {
        url: image.light.url,
        publicId: image.light.publicId,
      };
    }

    // update DARK image if changed
    if (
      image?.dark?.publicId &&
      image?.dark?.url &&
      image.dark.publicId !== project.image?.dark?.publicId
    ) {
      if (!isValidCloudinaryUrl(image.dark.url)) {
        return res
          .status(400)
          .json({ message: "Invalid Cloudinary image URL (dark)" });
      }

      // delete old dark image
      if (project.image?.dark?.publicId) {
        await deleteFromCloudinary(project.image.dark.publicId);
      }

      project.image.dark = {
        url: image.dark.url,
        publicId: image.dark.publicId,
      };
    }

    /* =========================
       Update Other Fields
    ========================= */
    if (typeof title === "string") project.title = title;
    if (typeof subTitle === "string") project.subTitle = subTitle;

    if (Array.isArray(stack)) project.stack = stack;
    if (Array.isArray(description)) project.description = description;

    if (links && typeof links === "object") {
      project.links = {
        site: links.site ?? project.links?.site,
        github: links.github ?? project.links?.github,
        post: links.post ?? project.links?.post,
      };
    }

    if (typeof status === "string")
      project.status = status as "live" | "building" | "offline";
    if (typeof isPinned === "boolean") project.isPinned = isPinned;

    await project.save();

    return res.json(project);
  } catch (error) {
    console.error("Update Project Error:", error);
    return res.status(500).json({ message: "Failed to update project" });
  }
};

/* =========================
   DELETE PROJECT
========================= */
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // 🧹 Delete images from Cloudinary (light + dark)
    const lightId = project.image?.light?.publicId;
    const darkId = project.image?.dark?.publicId;

    if (lightId) await deleteFromCloudinary(lightId);
    if (darkId) await deleteFromCloudinary(darkId);

    // 🗑️ Delete project
    await project.deleteOne();

    return res.status(204).send();
  } catch (error) {
    console.error("Delete Project Error:", error);
    return res.status(500).json({ message: "Failed to delete project" });
  }
};
