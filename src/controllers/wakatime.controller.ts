import type { Request, Response } from "express";
import { WakaTimeDailyModel } from "../models/Wakatime-daily.model.js";
// POST /api/wakatime/daily
// Body: { date, combined: { total_seconds }, editors: [{ name, total_seconds }] }
// export const createWakaTimeDaily = async (req: Request, res: Response) => {
//   try {
//     const { date, combined, editors } = req.body;

//     if (!date || !combined?.total_seconds) {
//       return res.status(400).json({
//         error: "date and combined.total_seconds are required",
//       });
//     }

//     // silently fail if already exists
//     const existing = await WakaTimeDailyModel.findOne({ date }).lean();
//     if (existing) {
//       return res.status(200).json({
//         ok: true,
//         created: false,
//         data: existing,
//       });
//     }

//     const doc = await WakaTimeDailyModel.create({
//       date,
//       combined: { total_seconds: combined.total_seconds },
//       editors: Array.isArray(editors) ? editors : [],
//     });

//     return res.status(201).json({
//       ok: true,
//       created: true,
//       data: doc,
//     });
//   } catch (err: any) {
//     // if unique index collision happens in race condition -> still silently fail
//     if (err?.code === 11000) {
//       const date = req.body?.date;
//       const existing = date
//         ? await WakaTimeDailyModel.findOne({ date }).lean()
//         : null;

//       return res.status(200).json({
//         ok: true,
//         created: false,
//         data: existing,
//       });
//     }

//     return res.status(500).json({
//       error: "Internal server error",
//     });
//   }
// };

// GET /api/wakatime/daily?date=2026-01-24
// If date not provided -> returns latest saved record
export const getWakaTimeDaily = async (req: Request, res: Response) => {
  try {
    const date = req.query.date as string | undefined;

    if (date) {
      const doc = await WakaTimeDailyModel.findOne({ date }).lean();

      if (!doc) {
        return res.status(404).json({ error: "No data found for this date" });
      }

      return res.status(200).json({ ok: true, data: doc });
    }

    // latest entry
    const latest = await WakaTimeDailyModel.findOne().sort({ date: -1 }).lean();

    if (!latest) {
      return res.status(404).json({ error: "No data found" });
    }

    return res.status(200).json({ ok: true, data: latest });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/wakatime/daily/range?from=YYYY-MM-DD&to=YYYY-MM-DD
export const getWakaTimeDailyRange = async (req: Request, res: Response) => {
  try {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    if (!from || !to) {
      return res.status(400).json({
        error: "from and to query params are required (YYYY-MM-DD)",
      });
    }

    // Since date is stored as "YYYY-MM-DD", lexicographical comparison works perfectly
    const docs = await WakaTimeDailyModel.find({
      date: { $gte: from, $lte: to },
    })
      .sort({ date: 1 })
      .lean();

    return res.status(200).json({
      ok: true,
      count: docs.length,
      range: { from, to },
      data: docs,
    });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
};
