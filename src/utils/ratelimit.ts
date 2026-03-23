import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "../config/redis.js";

export const geminiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: true,
  prefix: "ratelimit:gemini",
});
