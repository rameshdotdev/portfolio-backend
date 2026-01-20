import app from "./app.js";
import { connectDb } from "./config/connection.js";
import { env } from "./config/env.js";

async function start() {
  try {
    await connectDb(env.MONGO_URI);

    app.listen(env.PORT, () => {
      console.log(
        `🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`
      );
    });
  } catch (err: any) {
    console.error("Startup failed:", err.message);
  }
}

start();
