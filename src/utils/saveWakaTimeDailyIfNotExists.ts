import { WakaTimeDailyModel } from "../models/Wakatime-daily.model.js";
type Payload = {
  date: string | null;
  combined: {
    total_seconds: number;
  };
  editors: Array<{
    name: "VS Code" | "Cursor" | string;
    total_seconds: number;
  }>;
};

export async function saveWakaTimeDailyIfNotExists(payload: Payload) {
  // schema requires date
  if (!payload.date) return;

  const alreadyExists = await WakaTimeDailyModel.exists({
    date: payload.date,
  });

  if (alreadyExists) return;

  try {
    await WakaTimeDailyModel.create({
      date: payload.date,
      combined: {
        total_seconds: payload.combined.total_seconds,
      },
      editors: payload.editors.map((e) => ({
        name: e.name,
        total_seconds: e.total_seconds,
      })),
    });
  } catch (err: any) {
    // silent duplicate in race condition
    if (err?.code !== 11000) throw err;
  }
}
