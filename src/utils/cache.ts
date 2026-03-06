import { redis } from "../config/redis.js";

export async function cacheOrFetch<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
): Promise<{ source: "cache" | "live"; data: T }> {
  try {
    const cached = await redis.get(key);

    if (cached && typeof cached === "string") {
      return {
        source: "cache",
        data: JSON.parse(cached),
      };
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
    // fallback if redis fails
    const freshData = await fetcher();
    return {
      source: "live",
      data: freshData,
    };
  }
}
