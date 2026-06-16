import express, { type Application, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app: Application = express();

// Middlewares
const allowedOrigins = [
  "https://imramesh.in",
  "https://admin.imramesh.in",
  "http://localhost:3000",
  "http://localhost:5173",
];

app.use(
  cors({
    origin(origin, callback) {
      // console.log("Origin:", origin);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed`));
      }
    },
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
import yesterdayWorked from "./routes/yesterday-worked.route.js";
import wakatime from "./routes/wakatime.routes.js";
import geminiRoute from "./routes/gemini.routes.js";

app.use("/health", healthRoute);
app.use("/send", visitor);
app.use("/worked-for", yesterdayWorked);
app.use("/wakatime", wakatime);
app.use("/auth", authRoutes);
app.use("/projects", projectRoutes);
app.use("/skill-categories", skillCategoryRoutes);
app.use("/skills", skillRoutes);
app.use("/message", messageRoutes);
app.use("/contact", contactRoutes);
app.use("/hero", heroRoutes);
app.use("/works-at", worksAt);
app.use("/gemini", geminiRoute);
export default app;
