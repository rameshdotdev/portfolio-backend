import type { Request, Response } from "express";
import Project from "../models/Project.model.js";
import { deleteFromCloudinary } from "../utils/uploadImage.js";
// import { socketService } from "../services/socket.service.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

/* =========================
   CREATE PROJECT
========================= */
export const createProject = async (req: Request, res: Response) => {
  try {
    const { title, image, techStack, description, links } = req.body;
    // 🔐 Validation
    if (
      !title ||
      !techStack ||
      !description ||
      !image?.url ||
      !image?.publicId
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!image.url.startsWith("https://res.cloudinary.com")) {
      return res.status(400).json({ message: "Invalid Cloudinary image URL" });
    }

    const project = await Project.create({
      title,
      image: {
        url: image.url,
        publicId: image.publicId,
      },
      techStack,
      description,
      links,
    });

    // socketService.emit("projects:updated", project);

    return res.status(201).json(project);
  } catch (error) {
    req.body.image && (await deleteFromCloudinary(req.body.image.publicId));
    console.error("Create Project Error:", error);
    return res.status(500).json({ message: "Create project failed" });
  }
};

/* =========================
   GET PROJECTS
========================= */
export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const isAdmin = req.user?.role === "ADMIN";

    const projects = await Project.find(isAdmin ? {} : { isPublished: true })
      .sort({ createdAt: -1 })
      .lean();
    return res.json(projects);
  } catch (error) {
    console.error("Get Projects Error:", error);
    return res.status(500).json({ message: "Failed to fetch projects" });
  }
};

/* =========================
   TOGGLE ISPUBLISHED PROJECT STATUS
========================= */
export const toggleIsPublishedProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    project.isPublished = !project.isPublished;
    await project.save();
    // socketService.emit("projects:updated", project);
    return res.json(project);
  } catch (error) {
    console.error("Toggle isPublished Project Error:", error);
    return res
      .status(500)
      .json({ message: "Failed to toggle isPublished status" });
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

    const { title, techStack, description, links, image } = req.body;

    /* =========================
       Handle Image Replacement
    ========================= */
    if (image && image.publicId && image.publicId !== project.image?.publicId) {
      // delete old image (if exists)
      if (project.image?.publicId) {
        await deleteFromCloudinary(project.image.publicId);
      }

      // assign new image
      project.image = {
        url: image.url,
        publicId: image.publicId,
      };
    }

    /* =========================
       Update Other Fields
    ========================= */
    project.title = title ?? project.title;
    project.techStack = techStack ?? project.techStack;
    project.description = description ?? project.description;
    project.links = links ?? project.links;

    await project.save();

    // socketService.emit("projects:updated", project);

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

    // 🧹 Delete image from Cloudinary
    project.image && (await deleteFromCloudinary(project?.image.publicId));

    // 🗑️ Delete project
    await project.deleteOne();

    // socketService.emit("projects:updated", { id: project._id });

    return res.status(204).send();
  } catch (error) {
    console.error("Delete Project Error:", error);
    return res.status(500).json({ message: "Failed to delete project" });
  }
};
