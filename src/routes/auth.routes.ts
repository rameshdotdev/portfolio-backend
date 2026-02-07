import { Router } from "express";
import { loginAdmin, logout } from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import {
  getProfile,
  updateProfile,
} from "../controllers/profile.controller.js";
const router = Router();

router.post("/login", loginAdmin);
router.post("/logout", protect, logout);
router.get("/me", protect, getProfile);
router.patch("/me", protect, updateProfile);

export default router;
