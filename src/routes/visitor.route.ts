import { Router } from "express";
import { parsialProtect } from "../middlewares/auth.middleware.js";
import {
  getVisitorData,
  trackVisitor,
} from "../controllers/visitor.controller.js";

const router = Router();

// 1) Create / Track
router.post("/send", trackVisitor);

// 2) Get (public summary OR admin chart)
router.get("/visitor", parsialProtect, getVisitorData);

export default router;
