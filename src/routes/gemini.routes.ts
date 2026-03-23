import express, { type Request, type Response } from "express";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { redis } from "../config/redis.js";
import { geminiRatelimit } from "../utils/ratelimit.js";

const router = express.Router();

interface ProjectContext {
  title: string;
  excerpt: string;
  github: string;
}

interface ChatRequestBody {
  messages: { role: "user" | "assistant"; content: string }[];
  projectContext?: ProjectContext;
}

const README_CACHE_TTL_SECONDS = 60 * 60 * 24;
const README_MISS_TTL_SECONDS = 60 * 30;
const README_MISS_SENTINEL = "__README_NOT_FOUND__";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

function parseGithubRepo(
  githubUrl: string,
): { owner: string; repo: string } | null {
  try {
    const pathname = new URL(githubUrl).pathname.replace(/^\/+|\/+$/g, "");
    const [owner, repoRaw] = pathname.split("/");
    if (!owner || !repoRaw) return null;
    const repo = repoRaw.replace(/\.git$/i, "");
    if (!repo) return null;
    return { owner, repo };
  } catch {
    return null;
  }
}

async function fetchReadmeFromGitHub(
  owner: string,
  repo: string,
): Promise<string | null> {
  for (const branch of ["main", "master"]) {
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/${branch}/README.md`;
    const res = await fetch(url);
    if (res.ok) return await res.text();
  }
  return null;
}

async function fetchReadme(githubUrl: string): Promise<string | null> {
  try {
    const parsed = parseGithubRepo(githubUrl);
    if (!parsed) return null;

    const cacheKey = `cache:gemini:readme:${parsed.owner}:${parsed.repo}`;
    const cached = await redis.get<string>(cacheKey);

    if (cached === README_MISS_SENTINEL) return null;
    if (typeof cached === "string" && cached.length > 0) return cached;

    const readme = await fetchReadmeFromGitHub(parsed.owner, parsed.repo);
    if (!readme) {
      await redis.set(cacheKey, README_MISS_SENTINEL, {
        ex: README_MISS_TTL_SECONDS,
      });
      return null;
    }

    await redis.set(cacheKey, readme, { ex: README_CACHE_TTL_SECONDS });
    return readme;
  } catch {
    return null;
  }
}

function buildSystemPrompt(
  project: ProjectContext | undefined,
  readme: string | null,
): string {
  const baseInstructions = `You are a helpful assistant on Ramesh Kumar's portfolio website (imramesh.in).
CRITICAL: Be extremely concise. Avoid all filler, pleasantries, and lengthy introductions.
Provide direct answers. If a question can be answered in one sentence, do so.
Use markdown for structure (lists, bolding) but keep text minimal.`;

  if (!project) return baseInstructions;

  return `${baseInstructions}
You are discussing the project "${project.title}".
Focus strictly on "${project.title}" and Ramesh's work on it.

Project context:
- Title: ${project.title}
- Excerpt: ${project.excerpt}
- GitHub: ${project.github}

README content:
${readme ?? "README not available."}`;
}

function getClientIp(req: Request): string {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (forwardedFor)
    return (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)
      .split(",")[0]
      .trim();
  const realIp = req.headers["x-real-ip"];
  if (realIp) return Array.isArray(realIp) ? realIp[0] : realIp;
  return req.ip ?? "anonymous";
}

router.post("/", async (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const { success, reset } = await geminiRatelimit.limit(ip);

  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    res.setHeader("Retry-After", String(retryAfter));
    res.status(429).json({
      error: "Too many requests",
      message: "You have exceeded the rate limit. Please try again later.",
      retryAfter,
    });
    return;
  }

  const { messages, projectContext } = req.body as ChatRequestBody;

  if (!messages || messages.length === 0) {
    res.status(400).json({ error: "Messages are required" });
    return;
  }

  const readme = projectContext
    ? await fetchReadme(projectContext.github)
    : null;

  const prompt =
    messages
      .map(
        (msg) =>
          `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`,
      )
      .join("\n") + "\nAssistant:";

  const result = streamText({
    model: google("gemini-1.5-flash"),
    system: buildSystemPrompt(projectContext, readme),
    prompt,
  } as any);

  // Set SSE headers for streaming
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Content-Type-Options", "nosniff");

  const response = result.toTextStreamResponse();
  const stream = response.body;
  if (!stream) {
    res.status(500).json({ error: "Failed to create stream" });
    return;
  }
  const reader = stream.getReader();

  const pump = async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          res.write("data: [DONE]\n\n");
          res.end();
          break;
        }
        const chunk = new TextDecoder().decode(value);
        res.write(
          `data: ${JSON.stringify({ type: "text-delta", delta: chunk })}\n\n`,
        );
      }
    } catch (err) {
      console.error("Streaming error:", err);
      res.end();
    }
  };

  pump();
});

export default router;
