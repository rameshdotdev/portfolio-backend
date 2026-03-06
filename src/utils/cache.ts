import { redis } from "../config/redis.js";

export async function cacheOrFetch<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
): Promise<{ source: "cache" | "live"; data: T }> {
  try {
    const cached = await redis.get(key);

    if (cached && typeof cached === "string") {
      try {
        return {
          source: "cache",
          data: JSON.parse(cached),
        };
      } catch {
        await redis.del(key);
      }
    }

    const freshData = await fetcher();

    await redis.set(key, JSON.stringify(freshData), {
      ex: ttl,
    });

    return {
      source: "live",
      data: freshData,
    };
  } catch (error) {
    console.error("Cache layer error:", error);

    const freshData = await fetcher();

    return {
      source: "live",
      data: freshData,
    };
  }
}
