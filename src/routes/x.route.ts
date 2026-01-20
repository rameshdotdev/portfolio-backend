import { Router } from "express";
import { redis } from "../config/redis.js";
import axios from "axios";
import { env } from "../config/env.js";

const router = Router();

router.get("/profile", async (req, res) => {
  try {
    const cacheKey = "x_profile:rameshdotin";

    // ✅ check cache
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(cached);

    const username = "rameshdotin";

    const xRes = await axios.get(
      `https://api.twitter.com/2/users/by/username/${username}?user.fields=profile_image_url,description,public_metrics,verified`,
      {
        headers: {
          Authorization: `Bearer ${env.X_BEARER_TOKEN}`,
        },
      },
    );

    const fresh = xRes.data;

    // ✅ store in redis for 5 days
    await redis.set(cacheKey, fresh, { ex: 60 * 60 * 24 * 5 });

    return res.json(fresh);
  } catch (err: any) {
    // ✅ log actual error from X
    console.log("X API ERROR:", err?.response?.status, err?.response?.data);
    return res.status(err?.response?.status || 500).json({
      error: "Server error",
      details: err?.response?.data || err.message,
    });
  }
});

export default router;
