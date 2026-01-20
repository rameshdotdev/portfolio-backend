import type { Request, Response } from "express";
import SkillCategory from "../models/SkillCategory.model.js";
import Skill from "../models/Skill.model.js";
// import { socketService } from "../services/socket.service.js";

/* =========================
   CREATE CATEGORY (ADMIN)
========================= */
export const createCategory = async (req: Request, res: Response) => {
  const { title, subTitle, order, isVisible } = req.body;

  if (!title || !subTitle) {
    return res.status(400).json({ message: "Title and subtitle are required" });
  }

  const exists = await SkillCategory.findOne({ title });
  if (exists) {
    return res.status(409).json({ message: "Category already exists" });
  }

  const category = await SkillCategory.create({
    title,
    subTitle,
    order: order ?? 0,
    isVisible: isVisible ?? true,
  });

  // socketService.emit("skills:updated", { action: "CREATE_CATEGORY" });

  res.status(201).json(category);
};

/* =========================
   GET CATEGORIES
   - Admin → all
   - Public → visible only
========================= */
export const getCategories = async (req: Request, res: Response) => {
  const isAdmin = (req as any).user?.role === "ADMIN";

  const query = isAdmin ? {} : { isVisible: true };

  const categories = await SkillCategory.find(query).sort({ order: 1 });

  res.json(categories);
};

/* =========================
   UPDATE CATEGORY (ADMIN)
========================= */
export const updateCategory = async (req: Request, res: Response) => {
  const { title, subTitle, order, isVisible } = req.body;

  const category = await SkillCategory.findById(req.params.id);

  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }

  category.title = title ?? category.title;
  category.subTitle = subTitle ?? category.subTitle;
  category.order = order ?? category.order;
  category.isVisible = isVisible ?? category.isVisible;

  await category.save();

  // socketService.emit("skills:updated", { action: "UPDATE_CATEGORY" });

  res.json(category);
};

/* =========================
   DELETE CATEGORY (ADMIN)
========================= */
export const deleteCategory = async (req: Request, res: Response) => {
  const category = await SkillCategory.findById(req.params.id);

  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }

  // 🧹 Delete all skills under this category
  await Skill.deleteMany({ categoryId: category._id });

  await category.deleteOne();

  // socketService.emit("skills:updated", { action: "DELETE_CATEGORY" });

  res.status(204).send();
};
