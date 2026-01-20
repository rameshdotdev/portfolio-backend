import { Router } from "express";
import {
  getContact,
  upsertContact,
} from "../controllers/contact.controller.js";
import { adminOnly, protect } from "../middlewares/auth.middleware.js";

const router = Router();

// Public (used by Navbar / Footer)
router.get("/", getContact);

// Admin-only (protect with auth middleware later)
router.post("/", protect, adminOnly, upsertContact);

export default router;
