import { Router } from "express";
import { getHero, updateHero } from "../controllers/hero.controller.js";
import { protect, adminOnly } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", getHero); // public
router.put("/", protect, adminOnly, updateHero); // admin edit

export default router;
