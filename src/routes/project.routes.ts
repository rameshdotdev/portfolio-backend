// routes/project.routes.ts
import { Router } from "express";

import { adminOnly, protect } from "../middlewares/auth.middleware.js";
import {
  createProject,
  deleteProject,
  getProjects,
  toggleIsPublishedProject,
  updateProject,
} from "../controllers/project.controller.js";

const router = Router();

router.get("/", getProjects);
router.post("/", protect, adminOnly, createProject);
router.put("/:id", protect, adminOnly, updateProject);
router.delete("/:id", protect, adminOnly, deleteProject);
router.put("/status/:id", protect, adminOnly, toggleIsPublishedProject);

export default router;
