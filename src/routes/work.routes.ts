import { Router } from "express";
import {
  createWork,
  getWorks,
  updateWork,
  deleteWork,
} from "../controllers/work.controller.js";
import { protect, adminOnly } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", getWorks);

router.post("/", protect, adminOnly, createWork);
router.put("/:id", protect, adminOnly, updateWork);
router.delete("/:id", protect, adminOnly, deleteWork);

export default router;
