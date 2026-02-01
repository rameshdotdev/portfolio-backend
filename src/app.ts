import express, { type Application, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";

const app: Application = express();

// Middlewares
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (_req, res: Response) => {
  res.status(200).json({ message: "API is running 🚀" });
});

import healthRoute from "./routes/health.route.js";
import authRoutes from "./routes/auth.routes.js";
import projectRoutes from "./routes/project.routes.js";
import skillCategoryRoutes from "./routes/skill-category.routes.js";
import skillRoutes from "./routes/skill.routes.js";
import messageRoutes from "./routes/message.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import heroRoutes from "./routes/hero.routes.js";
import worksAt from "./routes/work.routes.js";
import visitor from "./routes/visitor.route.js";
import xProfile from "./routes/x.route.js";
import yesterdayWorked from "./routes/yesterday-worked.route.js";
import wakatime from "./routes/wakatime.routes.js";

app.use("/api", healthRoute);
app.use("/api", visitor);
app.use("/api", yesterdayWorked);
app.use("/api", wakatime);
app.use("/api/x", xProfile);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/skill-categories", skillCategoryRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/hero", heroRoutes);
app.use("/api/works-at", worksAt);

export default app;
