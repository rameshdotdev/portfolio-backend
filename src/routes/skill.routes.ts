// routes/skill.routes.ts
import { Router } from "express";
import {
  addSkill,
  getSkills,
  deleteSkill,
  updateSkill,
} from "../controllers/skill.controller.js";
import { protect, adminOnly } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", getSkills);
router.post("/", protect, adminOnly, addSkill);
router.put("/:id", protect, adminOnly, updateSkill);
router.delete("/:id", protect, adminOnly, deleteSkill);

export default router;
