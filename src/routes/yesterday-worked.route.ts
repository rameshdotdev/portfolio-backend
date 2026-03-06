import { Router, type Request, type Response } from "express";
import axios from "axios";
import { env } from "../config/env.js";
import { cacheOrFetch } from "../utils/cache.js";

const router = Router();

function toBasicAuth(apiKey: string) {
  return `Basic ${Buffer.from(apiKey + ":").toString("base64")}`;
}

const CACHE_TTL_SECONDS = 60 * 60 * 4; // 4 hours

router.get("/worked-for/yesterday", async (_req: Request, res: Response) => {
  try {
    const apiKey = env.WAKATIME_API_KEY;

    const result = await cacheOrFetch(
      "wakatime:yesterday:cursor-vscode",
      CACHE_TTL_SECONDS,
      async () => {
        const { data } = await axios.get(
          "https://wakatime.com/api/v1/users/current/summaries",
          {
            params: { range: "yesterday" },
            headers: { Authorization: toBasicAuth(apiKey) },
          },
        );

        const days = data?.data ?? [];
        const yesterday = days?.[0];
        const editors = yesterday?.editors ?? [];

        const wanted = new Set(["Cursor", "VS Code"]);
        const filteredEditors = editors.filter((e: any) => wanted.has(e.name));

        const combinedSeconds = filteredEditors.reduce(
          (sum: number, e: any) => sum + (e.total_seconds ?? 0),
          0,
        );

        const combinedText =
          combinedSeconds >= 3600
            ? `${Math.floor(combinedSeconds / 3600)}h ${Math.floor(
                (combinedSeconds % 3600) / 60,
              )}m`
            : `${Math.floor(combinedSeconds / 60)}m`;

        const payload = {
          date: yesterday?.range?.date ?? null,
          combined: {
            total_seconds: combinedSeconds,
            text: combinedText,
          },
          editors: filteredEditors.map((e: any) => ({
            name: e.name,
            text: e.text,
            total_seconds: e.total_seconds,
          })),
        };

        return payload;
      },
    );

    return res.json({
      source: result.source,
      ...result.data,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Server Error",
      details: error?.message,
    });
  }
});

export default router;
