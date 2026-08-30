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
  if (!payload.date) {
    throw new Error("WakaTime response did not include a date");
  }

  await WakaTimeDailyModel.findOneAndUpdate(
    { date: payload.date },
    {
      $setOnInsert: {
        date: payload.date,
        combined: {
          total_seconds: payload.combined.total_seconds,
        },
        editors: payload.editors.map((e) => ({
          name: e.name,
          total_seconds: e.total_seconds,
        })),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}
