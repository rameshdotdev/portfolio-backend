// routes/Message.routes.ts
import { Router } from "express";
import {
  submitMessage,
  getMessages,
  markAsRead,
} from "../controllers/message.controller.js";
import { protect, adminOnly } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", submitMessage);
router.get("/", protect, adminOnly, getMessages);
router.patch("/:id/read", protect, adminOnly, markAsRead);

export default router;
