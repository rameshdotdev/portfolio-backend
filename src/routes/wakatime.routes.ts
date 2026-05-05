import { Router } from "express";
import {
  //   createWakaTimeDaily,
  getWakaTimeDaily,
  getWakaTimeDailyRange,
} from "../controllers/wakatime.controller.js";

const router = Router();

// router.post("/wakatime/daily", createWakaTimeDaily);
router.get("/daily", getWakaTimeDaily);
router.get("/daily/range", getWakaTimeDailyRange);
export default router;
