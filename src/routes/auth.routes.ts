import { Router } from "express";
import { getMe, loginAdmin, logout } from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
const router = Router();

router.post("/login", loginAdmin);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

export default router;
