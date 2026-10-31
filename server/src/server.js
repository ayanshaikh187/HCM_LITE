import "dotenv/config";

import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

async function startServer() {
  try {
    await connectDB();

    app.listen(env.PORT, () => {
      console.log(`HCM Lite server running on port ${env.PORT}`);
      console.log(`Health: http://localhost:${env.PORT}/api/health`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();