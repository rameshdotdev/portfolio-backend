import type { AuthRequest } from "../middlewares/auth.middleware.js";
import type { Request, Response } from "express";
import { Visitor } from "../models/Visitors-model.js";

/** Detect device type from user-agent */
const getDeviceType = (userAgent = "") => {
  return /mobile|android|iphone|ipad|ipod/i.test(userAgent)
    ? "mobile"
    : "desktop";
};

/** Extract IP safely (supports proxies) */
const getIpAddress = (req: Request) => {
  const xff = req.headers["x-forwarded-for"];
  const ipFromHeader = Array.isArray(xff) ? xff[0] : xff?.split(",")[0];
  return ipFromHeader || req.socket.remoteAddress || "unknown";
};

const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getFromDateByRange = (range: string) => {
  const today = getStartOfDay(new Date());

  let days = 90;
  if (range === "7d") days = 7;
  if (range === "30d") days = 30;
  if (range === "90d") days = 90;

  const from = new Date(today);
  from.setDate(from.getDate() - (days - 1));
  return from;
};

/**
 * POST /api/send
 * Track visitor (unique per IP per day)
 * + pageViews increment
 */
export const trackVisitor = async (req: Request, res: Response) => {
  try {
    const userAgent = req.headers["user-agent"] || "";
    const deviceType = getDeviceType(userAgent);

    const ip = getIpAddress(req);
    const page = req.body?.page || "unknown";

    const today = getStartOfDay(new Date());

    const exists = await Visitor.findOne({ ip, date: today });

    if (!exists) {
      await Visitor.create({
        deviceType,
        ip,
        userAgent,
        page,
        date: today,
        pageViews: 1, // make sure schema has this
      });
    } else {
      await Visitor.updateOne(
        { _id: exists._id },
        {
          $inc: { pageViews: 1 },
          $set: { page }, // optional
        },
      );
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Visitor tracking error:", error);
    return res.status(500).json({ message: "Failed to track visitor" });
  }
};

/**
 * GET /api/visitor?range=7d|30d|90d
 *
 * Public -> { visitors, pageviews }
 * Admin  -> { totals: { visitors, pageviews }, daily: [{date, desktop, mobile}] }
 */
export const getVisitorData = async (req: AuthRequest, res: Response) => {
  try {
    const isAdmin = !!req.user && req.user.role === "ADMIN";
    const range = (req.query.range as string) || "90d";

    // PUBLIC summary (all-time)
    if (!isAdmin) {
      const [summary] = await Visitor.aggregate([
        {
          $group: {
            _id: null,
            visitors: { $sum: 1 },
            pageviews: { $sum: "$pageViews" },
          },
        },
        { $project: { _id: 0, visitors: 1, pageviews: 1 } },
      ]);

      return res.json(summary || { visitors: 0, pageviews: 0 });
    }

    // ADMIN totals + daily chart (based on range)
    const from = getFromDateByRange(range);
    const to = getStartOfDay(new Date());

    const [totalsAgg] = await Visitor.aggregate([
      {
        $match: {
          date: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: null,
          visitors: { $sum: 1 },
          pageviews: { $sum: "$pageViews" },
        },
      },
      { $project: { _id: 0, visitors: 1, pageviews: 1 } },
    ]);

    const daily = await Visitor.aggregate([
      {
        $match: {
          date: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$date" },
            },
            device: "$deviceType",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          devices: { $push: { k: "$_id.device", v: "$count" } },
        },
      },
      { $addFields: { devices: { $arrayToObject: "$devices" } } },
      {
        $project: {
          _id: 0,
          date: "$_id",
          desktop: { $ifNull: ["$devices.desktop", 0] },
          mobile: { $ifNull: ["$devices.mobile", 0] },
        },
      },
      { $sort: { date: 1 } },
    ]);

    return res.json({
      totals: totalsAgg || { visitors: 0, pageviews: 0 },
      daily,
    });
  } catch (error) {
    console.error("Visitor data error:", error);
    return res.status(500).json({ message: "Failed to fetch visitor data" });
  }
};
