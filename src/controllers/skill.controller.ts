import type { Request, Response } from "express";
import Skill from "../models/Skill.model.js";
import SkillCategory from "../models/SkillCategory.model.js";
// import { socketService } from "../services/socket.service.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

/* =========================
   ADD SKILL (ADMIN)
========================= */
export const addSkill = async (req: Request, res: Response) => {
  const { categoryId, name, iconKey, order, isVisible } = req.body;

  if (!categoryId || !name || !iconKey) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const categoryExists = await SkillCategory.exists({ _id: categoryId });
  if (!categoryExists) {
    return res.status(400).json({ message: "Invalid category" });
  }

  const skill = await Skill.create({
    categoryId,
    name,
    iconKey,
    order: order ?? 0,
    isVisible: isVisible ?? true,
  });

  // socketService.emit("skills:updated", { action: "ADD_SKILL" });

  res.status(201).json(skill);
};

/* =========================
   GET SKILL BOARD
   - Admin → all
   - Public → visible only
========================= */
export const getSkills = async (req: AuthRequest, res: Response) => {
  const isAdmin = req.user?.role === "ADMIN";

  const categoryQuery = isAdmin ? {} : { isVisible: true };
  const skillQuery = isAdmin ? {} : { isVisible: true };

  const categories = await SkillCategory.find(categoryQuery)
    .sort({ order: 1 })
    .lean();

  const skills = await Skill.find(skillQuery).sort({ order: 1 }).lean();

  const grouped = categories.map((category) => ({
    _id: category._id,
    title: category.title,
    subTitle: category.subTitle,
    order: category.order,
    isVisible: category.isVisible,
    skills: skills.filter(
      (skill) => skill.categoryId.toString() === category._id.toString()
    ),
  }));

  res.json(grouped);
};

/* =========================
   UPDATE SKILL (ADMIN)
========================= */
export const updateSkill = async (req: Request, res: Response) => {
  const { name, iconKey, order, isVisible, categoryId } = req.body;

  const skill = await Skill.findById(req.params.id);

  if (!skill) {
    return res.status(404).json({ message: "Skill not found" });
  }

  if (categoryId) {
    const exists = await SkillCategory.exists({ _id: categoryId });
    if (!exists) {
      return res.status(400).json({ message: "Invalid category" });
    }
    skill.categoryId = categoryId;
  }

  skill.name = name ?? skill.name;
  skill.iconKey = iconKey ?? skill.iconKey;
  skill.order = order ?? skill.order;
  skill.isVisible = isVisible ?? skill.isVisible;

  await skill.save();

  // socketService.emit("skills:updated", { action: "UPDATE_SKILL" });

  res.json(skill);
};

/* =========================
   DELETE SKILL (ADMIN)
========================= */
export const deleteSkill = async (req: Request, res: Response) => {
  const skill = await Skill.findById(req.params.id);

  if (!skill) {
    return res.status(404).json({ message: "Skill not found" });
  }

  await skill.deleteOne();

  // socketService.emit("skills:updated", { action: "DELETE_SKILL" });

  res.status(204).send();
};
