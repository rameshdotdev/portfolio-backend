import { geminiRatelimit } from "../utils/ratelimit.js";
import { redis } from "../config/redis.js";
import "dotenv/config";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { type Request, type Response, Router } from "express";

const router = Router();

interface ProjectContext {
  title: string;
  excerpt: string;
  github: string;
}

interface ChatRequestBody {
  messages: UIMessage[];
  projectContext?: ProjectContext;
}

const README_CACHE_TTL_SECONDS = 60 * 60 * 24;
const README_MISS_TTL_SECONDS = 60 * 30;
const README_MISS_SENTINEL = "__README_NOT_FOUND__";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
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
    if (res.ok) {
      return await res.text();
    }
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

    await redis.set(cacheKey, readme, {
      ex: README_CACHE_TTL_SECONDS,
    });
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

  if (!project) {
    return baseInstructions;
  }

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
  if (forwardedFor) {
    return (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)
      .split(",")[0]
      .trim();
  }
  const realIp = req.headers["x-real-ip"];
  if (realIp) return Array.isArray(realIp) ? realIp[0] : realIp;
  return req.socket?.remoteAddress ?? "anonymous";
}

router.post(
  "/",
  async (req: Request<{}, {}, ChatRequestBody>, res: Response) => {
    const ip = getClientIp(req);
    const { success, reset } = await geminiRatelimit.limit(ip);

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      return res.status(429).setHeader("Retry-After", String(retryAfter)).json({
        error: "Too many requests",
        message: "You have exceeded the rate limit. Please try again later.",
        retryAfter,
      });
    }

    const { messages, projectContext } = req.body;

    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: "Messages are required" });
    }

    const readme = projectContext
      ? await fetchReadme(projectContext.github)
      : null;

    const result = streamText({
      model: google("gemini-2.5-flash-lite"),
      system: buildSystemPrompt(projectContext, readme),
      messages: await convertToModelMessages(messages),
    });

    const streamResponse = result.toUIMessageStreamResponse({
      headers: {
        "X-Content-Type-Options": "nosniff",
      },
    });

    // Forward status and headers from the AI SDK response
    res.status(streamResponse.status);
    streamResponse.headers.forEach((value, key) => {
      if (
        !["transfer-encoding", "content-encoding"].includes(key.toLowerCase())
      ) {
        res.setHeader(key, value);
      }
    });

    // Pipe the Web API ReadableStream to the Express response
    const reader = streamResponse.body!.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
    } finally {
      res.end();
    }
  },
);

export default router;
